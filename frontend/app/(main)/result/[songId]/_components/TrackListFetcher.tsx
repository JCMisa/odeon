"use server";

import { getPresignedUrl } from "@/actions/generation";
import Empty from "@/components/custom/Empty";
import { db } from "@/config/db";
import { song, user } from "@/config/schema";
import { auth } from "@/lib/auth";
import { desc, eq, getTableColumns } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import TrackList from "./TrackList";

const TrackListFetcher = async () => {
  // check if authenticated
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    redirect("/auth/sign-in");
  }

  const songs = await db
    .select({
      ...getTableColumns(song),
      userName: user.name,
      userEmail: user.email,
      userImage: user.image,
    })
    .from(song)
    .leftJoin(user, eq(song.userId, user.id))
    .where(eq(song.userId, session.user.id))
    .orderBy(desc(song.createdAt));

  const songsWithThumbnails = await Promise.all(
    songs.map(async (song) => {
      let thumbnailUrl = null;
      if (song.thumbnailS3Key) {
        thumbnailUrl = await getPresignedUrl(song.thumbnailS3Key);
      }

      return {
        id: song.id,
        title: song.title,
        createdAt: song.createdAt,
        instrumental: song.instrumental,
        prompt: song.prompt,
        lyrics: song.lyrics,
        describedLyrics: song.describedLyrics,
        fullDescribedSong: song.fullDescribedSong,
        thumbnailUrl,
        playUrl: null,
        status: song.status,
        createdByUserName: song.userName,
        createdByUserEmail: song.userEmail,
        createdByUserImage: song.userImage,
        published: song.published,
      };
    })
  );

  return songs.length > 0 || songsWithThumbnails ? (
    // songs.map((song) => <div key={song.id}>{song.thumbnailS3Key}</div>)
    <TrackList tracks={songsWithThumbnails} />
  ) : (
    <Empty
      title="No Song Yet"
      subTitle="You have not generated any song yet."
      canCreate={true}
    />
  );
};

export default TrackListFetcher;
