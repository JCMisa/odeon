"use server";

import { db } from "@/config/db";
import { song } from "@/config/schema";
import { inngest } from "@/inngest/client";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { and, eq, isNotNull, or, sql } from "drizzle-orm";

export interface GenerateRequest {
  prompt?: string;
  lyrics?: string;
  fullDescribedSong?: string;
  describedLyrics?: string;
  instrumental?: boolean;
  requiredCredits: number;
}

export const generateSong = async (
  generateRequest: GenerateRequest,
  title: string
) => {
  try {
    // check if authenticated
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session) {
      redirect("/auth/sign-in");
    }

    const result = await queueSong(
      generateRequest,
      7.5,
      session.user.id,
      title
    );
    // const result2 = await queueSong(generateRequest, 15, session.user.id);
    if (result.success) {
      return { success: true, songId: result.songId };
    }
    revalidatePath("/");
  } catch (error) {
    console.error("Error in generateSong:", error);
    throw new Error("Failed to generate song");
  }
};

export const queueSong = async (
  generateRequest: GenerateRequest,
  guidanceScale: number,
  userId: string,
  songTitle: string
) => {
  try {
    const [insertedSong] = await db
      .insert(song)
      .values({
        userId: userId,
        title: songTitle,
        prompt: generateRequest.prompt,
        lyrics: generateRequest.lyrics,
        describedLyrics: generateRequest.describedLyrics,
        fullDescribedSong: generateRequest.fullDescribedSong,
        instrumental: generateRequest.instrumental,
        guidanceScale: guidanceScale,
        audioDuration: 180,
      })
      .returning({
        id: song.id,
        userId: song.userId,
      });

    // Send to Inngest
    const result = await inngest.send({
      name: "generate-song-event",
      data: {
        songId: insertedSong.id,
        userId: insertedSong.userId,
        requiredCredits: generateRequest.requiredCredits,
      },
    });

    console.log("Inngest event sent:", result);

    return { success: true, songId: insertedSong.id };
  } catch (error) {
    console.error("Error in queueSong:", error);
    throw new Error("Failed to queue song");
  }
};

export const getPresignedUrl = async (key: string) => {
  try {
    const s3Client = new S3Client({
      region: process.env.AWS_REGION!,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY_ID!,
      },
    });

    const command = new GetObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME!,
      Key: key,
    });

    return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
  } catch (error) {
    console.error("Error in getPresignedUrl:", error);
    throw new Error("Failed to get presigned URL");
  }
};

export const getPlayUrl = async (songId: string) => {
  // check if authenticated
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    redirect("/auth/sign-in");
  }

  const [songData] = await db
    .select({
      s3Key: song.s3Key,
    })
    .from(song)
    .where(
      and(
        eq(song.id, songId),
        or(eq(song.userId, session.user.id), eq(song.published, true)),
        isNotNull(song.s3Key)
      )
    )
    .limit(1);

  // increment listen count when song is played
  await db
    .update(song)
    .set({
      listenCount: sql`${song.listenCount} + 1`,
    })
    .where(eq(song.id, songId));

  return getPresignedUrl(songData.s3Key!);
};
