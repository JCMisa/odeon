import { getPresignedUrl } from "@/actions/generation";
import Empty from "@/components/custom/Empty";
import { db } from "@/config/db";
import { song, user, like, category, songCategory } from "@/config/schema";
import { auth } from "@/lib/auth";
import { eq, desc, sql, inArray } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import SongCard, { SongWithRelation } from "./_components/SongCard";

export default async function Home() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    redirect("/auth/sign-in");
  }
  const userId = session.user.id;

  // First, get the songs with user info and likes count
  // Expected output structure:
  // [
  //   {
  //     song: {
  //       id: "uuid-1",
  //       title: "My Song",
  //       s3Key: "songs/song1.mp3",
  //       status: "processed",
  //       prompt: "A happy song",
  //       lyrics: "Happy lyrics...",
  //       published: true,
  //       listenCount: 5,
  //       userId: "user-123",
  //       createdAt: "2024-01-15T10:30:00Z",
  //       updatedAt: "2024-01-15T10:30:00Z",
  //     },
  //     user: {
  //       id: "user-123",
  //       name: "John Doe",
  //       email: "john@example.com",
  //       image: "https://avatar.com/john.jpg"
  //     },
  //     likesCount: 42
  //   },
  // ]
  const userSongs = await db
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
    .where(eq(song.userId, userId))
    .orderBy(desc(song.createdAt))
    .limit(100);

  // Then, get categories for each song
  const songIds = userSongs.map((songData) => songData.song.id);

  // Expected output structure:
  // [
  //   {
  //     songId: "uuid-1",
  //     category: {
  //       id: "cat-1",
  //       name: "Pop"
  //     }
  //   },
  //   {
  //     songId: "uuid-1",
  //     category: {
  //       id: "cat-2",
  //       name: "Happy"
  //     }
  //   },
  //   {
  //     songId: "uuid-2",
  //     category: {
  //       id: "cat-3",
  //       name: "Rock"
  //     }
  //   },
  //   ... more category entries
  // ]
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

  // Combine the data
  // Final expected output structure:
  // [
  //   {
  //     song: {
  //       id: "uuid-1",
  //       title: "My Song",
  //       ... all song fields
  //     },
  //     user: {
  //       id: "user-123",
  //       name: "John Doe",
  //       email: "john@example.com",
  //       image: "https://avatar.com/john.jpg"
  //     },
  //     likesCount: 42,
  //     categories: [
  //       { id: "cat-1", name: "Pop" },
  //       { id: "cat-2", name: "Happy" }
  //     ]
  //   },
  //   {
  //     song: {
  //       id: "uuid-2",
  //       title: "Another Song",
  //       ... all song fields
  //     },
  //     user: {
  //       id: "user-123",
  //       name: "John Doe",
  //       email: "john@example.com",
  //       image: "https://avatar.com/john.jpg"
  //     },
  //     likesCount: 15,
  //     categories: [
  //       { id: "cat-3", name: "Rock" }
  //     ]
  //   },
  //   ... up to 100 songs total
  // ]
  const songsWithCategories = userSongs.map((songData) => ({
    ...songData,
    categories: songCategories
      .filter((sc) => sc.songId === songData.song.id)
      .map((sc) => sc.category),
  }));

  // At this point, `songWithUrls` is an array of objects, each representing a song with its user, likesCount, categories, and a `thumbnailUrl` property.
  // Example output:
  // [
  //   {
  //     song: { ...all song fields... },
  //     user: { ...user fields... },
  //     likesCount: 42,
  //     categories: [
  //       { id: "cat-1", name: "Pop" },
  //       { id: "cat-2", name: "Happy" }
  //     ],
  //     thumbnailUrl: "https://presigned-s3-url.com/thumbnail.jpg" // or null if not available
  //   },
  //   ...
  // ]
  type SongWithExtras = SongWithRelation & { isLiked?: boolean };
  const songWithUrls: SongWithExtras[] = await Promise.all(
    songsWithCategories.map(async (data) => {
      const thumbnailUrl = data.song.thumbnailS3Key
        ? await getPresignedUrl(data.song.thumbnailS3Key)
        : null;

      return { ...data, thumbnailUrl } as SongWithExtras;
    })
  );

  // Mark whether current user liked each song
  const songWithLikeFlags: SongWithExtras[] = songWithUrls.map((data) => ({
    ...data,
    isLikedInitial: !!data.isLiked,
  }));

  const twoDaysAgo = new Date();
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

  const trendingSongs = songWithLikeFlags
    .filter((song) => song.song.createdAt >= twoDaysAgo)
    .slice(0, 10);

  const trendingSongIds = new Set(trendingSongs.map((song) => song.song.id));

  // Expected output structure:
  // {
  //   "Pop": [
  //     {
  //       song: { id: "uuid-1", title: "Pop Song 1", ... },
  //       user: { id: "user-123", name: "John Doe", ... },
  //       likesCount: 25,
  //       categories: [{ id: "cat-1", name: "Pop" }, { id: "cat-2", name: "Happy" }],
  //       thumbnailUrl: "https://presigned-url.com/thumb1.jpg"
  //     },
  //     {
  //       song: { id: "uuid-2", title: "Pop Song 2", ... },
  //       user: { id: "user-123", name: "John Doe", ... },
  //       likesCount: 18,
  //       categories: [{ id: "cat-1", name: "Pop" }],
  //       thumbnailUrl: "https://presigned-url.com/thumb2.jpg"
  //     }
  //     ... up to 10 songs per category
  //   ],
  //   "Rock": [
  //     {
  //       song: { id: "uuid-3", title: "Rock Song 1", ... },
  //       user: { id: "user-123", name: "John Doe", ... },
  //       likesCount: 32,
  //       categories: [{ id: "cat-3", name: "Rock" }],
  //       thumbnailUrl: "https://presigned-url.com/thumb3.jpg"
  //     }
  //     ... up to 10 songs per category
  //   ],
  //   "Jazz": [
  //     ... up to 10 songs per category
  //   ]
  //   ... more categories
  // }
  const categorizedSongs = songWithLikeFlags
    .filter(
      (song) => !trendingSongIds.has(song.song.id) && song.categories.length > 0
    )
    .reduce(
      (acc, song) => {
        const primaryCategory = song.categories[0];
        if (primaryCategory && primaryCategory.name) {
          const categoryName = primaryCategory.name;
          if (!acc[categoryName]) {
            acc[categoryName] = [];
          }
          if (acc[categoryName]!.length < 10) {
            acc[categoryName]!.push(song);
          }
        }
        return acc;
      },
      {} as Record<string, Array<(typeof songWithUrls)[number]>>
    );

  if (
    trendingSongs.length === 0 &&
    Object.keys(categorizedSongs).length === 0
  ) {
    return (
      <div className="mt-5">
        <Empty
          title="No Trending Songs Found"
          subTitle="Please create a song."
          canCreate={true}
        />
      </div>
    );
  }

  return (
    <main className="p-4">
      <h1 className="text-3xl font-bold tracking-tight">Discover Music</h1>

      {/* trending songs */}
      {trendingSongs.length > 0 && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold">Trending</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {trendingSongs.map((song) => (
              <SongCard key={song.song.id} song={song as SongWithRelation} />
            ))}
          </div>
        </div>
      )}

      {/* categories */}
      {Object.entries(categorizedSongs)
        .slice(0, 5)
        .map(([category, songs], index) => (
          <div key={index} className="mt-6">
            <h2 className="text-xl font-semibold">{category}</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {songs.map((song) => (
                <SongCard key={song.song.id} song={song as SongWithRelation} />
              ))}
            </div>
          </div>
        ))}
    </main>
  );
}
