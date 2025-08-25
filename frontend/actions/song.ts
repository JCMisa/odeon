"use server";

import { db } from "@/config/db";
import { song, like } from "@/config/schema";
import { auth } from "@/lib/auth";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export const setPublishedStatus = async (
  songId: string,
  published: boolean
) => {
  // check if authenticated
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    redirect("/auth/sign-in");
  }

  await db
    .update(song)
    .set({
      published: published,
    })
    .where(and(eq(song.id, songId), eq(song.userId, session.user.id)));

  revalidatePath("/result");
};

export const renameSong = async (songId: string, newTitle: string) => {
  // check if authenticated
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    redirect("/auth/sign-in");
  }

  const data = await db
    .update(song)
    .set({
      title: newTitle,
    })
    .where(and(eq(song.id, songId), eq(song.userId, session.user.id)));

  if (data) {
    revalidatePath("/result");
    return { success: true };
  }
};

export const toggleLikeSong = async (songId: string) => {
  // check if authenticated
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    redirect("/auth/sign-in");
  }

  const userId = session.user.id;

  // Check if user already liked this song
  const existingLike = await db
    .select()
    .from(like)
    .where(and(eq(like.songId, songId), eq(like.userId, userId)));

  if (existingLike.length > 0) {
    // User already liked, so unlike
    await db
      .delete(like)
      .where(and(eq(like.songId, songId), eq(like.userId, userId)));

    revalidatePath("/");
    return { success: true, liked: false };
  } else {
    // User hasn't liked, so like
    await db.insert(like).values({
      songId: songId,
      userId: userId,
    });

    revalidatePath("/");
    return { success: true, liked: true };
  }
};
