"use server";

import { db } from "@/config/db";
import { song } from "@/config/schema";
import { inngest } from "@/inngest/client";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export const queueSong = async () => {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      redirect("/auth/sign-in");
    }

    const [insertedSong] = await db
      .insert(song)
      .values({
        userId: session.user.id,
        title: "test song 1",
        fullDescribedSong: "A song for AI advancements and job layoffs",
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
      },
    });

    console.log("Inngest event sent:", result);

    return { success: true, songId: insertedSong.id };
  } catch (error) {
    console.error("Error in queueSong:", error);
    throw new Error("Failed to create song");
  }
};
