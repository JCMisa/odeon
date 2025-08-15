"use server";

import { db } from "@/config/db";
import { song } from "@/config/schema";
import { inngest } from "@/inngest/client";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export interface GenerateRequest {
  prompt?: string;
  lyrics?: string;
  fullDescribedSong?: string;
  describedLyrics?: string;
  instrumental?: boolean;
  requiredCredits: number;
}

export const generateSong = async (generateRequest: GenerateRequest) => {
  try {
    // check if authenticated
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session) {
      redirect("/auth/sign-in");
    }

    const result1 = await queueSong(generateRequest, 3, session.user.id);
    // const result2 = await queueSong(generateRequest, 15, session.user.id);
    if (result1.success) {
      return { success: true };
    }
    revalidatePath("/create");
  } catch (error) {
    console.error("Error in generateSong:", error);
    throw new Error("Failed to generate song");
  }
};

export const queueSong = async (
  generateRequest: GenerateRequest,
  guidanceScale: number,
  userId: string
) => {
  try {
    // set what would be the title is based on the available inputs
    let title = "Untitled";
    if (generateRequest.describedLyrics)
      title = generateRequest.describedLyrics;
    if (generateRequest.fullDescribedSong)
      title = generateRequest.fullDescribedSong;

    // make the first letter of the title uppercase
    title = title.charAt(0).toUpperCase() + title.slice(1);

    const [insertedSong] = await db
      .insert(song)
      .values({
        userId: userId,
        title: title,
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
