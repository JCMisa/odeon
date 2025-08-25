import { db } from "@/config/db";
import { category, like, song, songCategory, user } from "@/config/schema";
import { auth } from "@/lib/auth";
import { desc, eq, inArray, sql } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import SongCard, { SongWithRelation } from "../_components/SongCard";
import { getPresignedUrl } from "@/actions/generation";

const ExplorePage = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    redirect("/auth/sign-in");
  }
  const userId = session.user.id;

  const allSongs = await db
    .select({
      song: song,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
      },
      likesCount: sql<number>`(
          SELECT COUNT(*)::int 
          FROM ${like} 
          WHERE ${like.songId} = ${song.id}
        )`,
      isLiked: sql<boolean>`EXISTS (
        SELECT 1 FROM ${like}
        WHERE ${like.songId} = ${song.id} AND ${like.userId} = ${userId}
      )`,
    })
    .from(song)
    .innerJoin(user, eq(song.userId, user.id))
    .where(eq(song.published, true))
    .orderBy(desc(song.listenCount));

  const songIds = allSongs.map((songData) => songData.song.id);

  const songCategories = await db
    .select({
      songId: songCategory.songId,
      category: {
        id: category.id,
        name: category.name,
      },
    })
    .from(songCategory)
    .innerJoin(category, eq(songCategory.categoryId, category.id))
    .where(inArray(songCategory.songId, songIds));

  const songsWithCategories = allSongs.map((songData) => ({
    ...songData,
    categories: songCategories
      .filter((sc) => sc.songId === songData.song.id)
      .map((sc) => sc.category),
  }));

  type SongWithExtras = SongWithRelation & { isLiked?: boolean };
  const songWithUrls: SongWithExtras[] = await Promise.all(
    songsWithCategories.map(async (data) => {
      const thumbnailUrl = data.song.thumbnailS3Key
        ? await getPresignedUrl(data.song.thumbnailS3Key)
        : null;

      return { ...data, thumbnailUrl } as SongWithExtras;
    })
  );

  // Ensure the initial liked state is passed to the card (consistent with Home page)
  const songsWithLikeFlags: SongWithExtras[] = songWithUrls.map((data) => ({
    ...data,
    isLikedInitial: !!data.isLiked,
  }));

  return (
    <main className="p-4">
      <h1 className="text-3xl font-bold tracking-tight">Explore Songs</h1>

      {songsWithLikeFlags.length > 0 && (
        <div className="mt-6">
          <div className="mt-4 flex flex-wrap gap-2">
            {songsWithLikeFlags.map((song) => (
              <SongCard key={song.song.id} song={song as SongWithRelation} />
            ))}
          </div>
        </div>
      )}
    </main>
  );
};

export default ExplorePage;
