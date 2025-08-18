"use server";

import { db } from "@/config/db";
import { song } from "@/config/schema";
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
