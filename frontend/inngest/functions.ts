import { db } from "@/config/db";
import { inngest } from "./client";
import { category, song, songCategory, user } from "@/config/schema";
import { eq, sql } from "drizzle-orm";

export const generateSong = inngest.createFunction(
  {
    id: "generate-song",
    concurrency: {
      limit: 1,
      key: "event.data.userId",
    },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onFailure: async ({ event, error }) => {
      await db
        .update(song)
        .set({
          status: "failed",
        })
        .where(
          eq(song.id, (event?.data?.event?.data as { songId: string }).songId)
        );
    },
  },
  { event: "generate-song-event" },
  async ({ event, step }) => {
    const { songId, requiredCredits } = event.data as {
      songId: string;
      userId: string;
      requiredCredits: number;
    };

    // a step to get the song from database and call fastapi endpoint based on available data provided by user
    const { userId, credits, endpoint, body } = await step.run(
      "check-credits",
      // get the song and the owner of the song based on songId
      async () => {
        const songData = await db
          .select({
            userId: user.id,
            userCredits: user.credits,
            prompt: song.prompt,
            lyrics: song.lyrics,
            fullDescribedSong: song.fullDescribedSong,
            describedLyrics: song.describedLyrics,
            instrumental: song.instrumental,
            guidanceScale: song.guidanceScale,
            inferStep: song.inferStep,
            audioDuration: song.audioDuration,
            seed: song.seed,
          })
          .from(song)
          .leftJoin(user, eq(song.userId, user.id))
          .where(eq(song.id, songId));

        // this is the type of the request body when we call an endpoint
        type RequestBody = {
          guidance_scale?: number;
          infer_step?: number;
          audio_duration?: number;
          seed?: number;
          instrumental?: boolean;
          full_described_song?: string;
          prompt?: string;
          lyrics?: string;
          described_lyrics?: string;
        };

        let endpoint = "";
        let body: RequestBody = {};

        // this are the properties of AudioGenerationBase parent class that is shared by all endpoint return types
        const commonParams = {
          guidance_scale: songData[0].guidanceScale ?? undefined,
          infer_step: songData[0].inferStep ?? undefined,
          audio_duration: songData[0].audioDuration ?? undefined,
          seed: songData[0].seed ?? undefined,
          instrumental: songData[0].instrumental ?? undefined,
        };

        // ? 3 common cases:

        // 1. user provides a song description and ai generates a comma separated prompts and lyrics based on that song description
        if (songData[0].fullDescribedSong) {
          endpoint = process.env.GENERATE_FROM_DESCRIPTION!;
          body = {
            full_described_song: songData[0].fullDescribedSong ?? "",
            ...commonParams,
          };
        }

        // 2. user provides both the lyrics and the comma separated prompts
        else if (songData[0].lyrics && songData[0].prompt) {
          endpoint = process.env.GENERATE_WITH_LYRICS!;
          body = {
            prompt: songData[0].prompt ?? "",
            lyrics: songData[0].lyrics ?? "",
            ...commonParams,
          };
        }

        // 3. user provides the comma separated prompts, and a description of a lyrics to be used by ai to generate a lyrics
        else if (songData[0].describedLyrics && songData[0].prompt) {
          endpoint = process.env.GENERATE_FROM_DESCRIBED_LYRICS!;
          body = {
            prompt: songData[0].prompt ?? "",
            described_lyrics: songData[0].describedLyrics ?? "",
            ...commonParams,
          };
        }

        return {
          userId: songData[0].userId,
          credits: songData[0].userCredits,
          endpoint: endpoint, // anong endpoint ang gagamitin base sa mga input ni user
          body: body,
        };
      }
    );

    // a step to check of user credits is enough
    if (credits && credits > 0) {
      // generate the song
      // update the status of song generation to "processing"
      await step.run("set-status-processing", async () => {
        return await db
          .update(song)
          .set({
            status: "processing",
          })
          .where(eq(song.id, songId));
      });

      // fetch which ever endpoint is called and pass the essential properties, body depends on what the user inputted for the song generation
      // this will call the endpoint in main.py and perform the operations
      const response = await step.fetch(endpoint, {
        method: "POST",
        body: JSON.stringify(body),
        headers: {
          "Content-Type": "application/json",
          "Modal-Key": process.env.MODAL_KEY!,
          "Modal-Secret": process.env.MODAL_SECRET!,
        },
      });

      // get the result from response.json
      await step.run("update-song-result", async () => {
        const responseData = response.ok
          ? ((await response.json()) as {
              s3_key: string;
              cover_image_s3_key: string;
              categories: string[];
            })
          : null;

        // store the results to database by updating the song properties
        await db
          .update(song)
          .set({
            s3Key: responseData?.s3_key,
            thumbnailS3Key: responseData?.cover_image_s3_key,
            status: response.ok ? "processed" : "failed",
          })
          .where(eq(song.id, songId));

        // store the generated categories to its own table and create relationship with song table
        if (responseData && responseData?.categories.length > 0) {
          const categoriesToConnect = responseData.categories; // ["rock", "ballad", "jazz", ...]

          // without transaction
          const categoryIds: string[] = [];
          for (const categoryName of categoriesToConnect) {
            // Attempt to find the category first
            const foundCategory = await db
              .select({
                id: category.id,
              })
              .from(category)
              .where(eq(category.name, categoryName));

            if (foundCategory.length > 0) {
              categoryIds.push(foundCategory[0].id);
            } else {
              // If not found, create a new one
              const newCategory = await db
                .insert(category)
                .values({
                  name: categoryName,
                })
                .returning({ id: category.id });
              categoryIds.push(newCategory[0].id);
            }
          }

          // with transaction
          // Step 1: Find or create the categories.
          // This is a transaction to ensure atomicity.
          // const categoryIds = await db.transaction(async (tx) => {
          //   const ids: string[] = [];
          //   for (const categoryName of categoriesToConnect) {
          //     // Attempt to find the category first
          //     const foundCategory = await tx
          //       .select({
          //         id: category.id,
          //       })
          //       .from(category)
          //       .where(eq(category.name, categoryName));

          //     if (foundCategory.length > 0) {
          //       ids.push(foundCategory[0].id);
          //     } else {
          //       // If not found, create a new one
          //       const newCategory = await tx
          //         .insert(category)
          //         .values({
          //           name: categoryName,
          //         })
          //         .returning({ id: category.id });
          //       ids.push(newCategory[0].id);
          //     }
          //   }
          //   return ids;
          // });

          // Step 2: Create entries in the songCategory join table
          if (categoryIds.length > 0) {
            // Map the new category IDs to the songCategory table structure
            const songCategoriesData = categoryIds.map((categoryId) => ({
              songId: songId,
              categoryId: categoryId,
            }));
            await db.insert(songCategory).values(songCategoriesData);
          }
        }
      });

      // deduct user credits after successful song creation
      return await step.run("deduct-credits", async () => {
        if (!response.ok) return;

        return await db
          .update(user)
          .set({
            credits: sql`${user.credits} - ${requiredCredits}`,
          })
          .where(eq(user.id, userId as string));
      });
    } else {
      // set song status "not enough credits" if user credits is not enough
      await step.run("set-status-no-credits", async () => {
        return await db
          .update(song)
          .set({
            status: "no credits",
          })
          .where(eq(song.id, songId));
      });
    }
  }
);
