import { ArrowLeftIcon, LoaderCircleIcon, MusicIcon } from "lucide-react";
import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import TrackListFetcher from "./_components/TrackListFetcher";
import Link from "next/link";
import { db } from "@/config/db";
import { song, user } from "@/config/schema";
import { eq, getTableColumns } from "drizzle-orm";
import Empty from "@/components/custom/Empty";
import ProcessingLoader from "@/components/custom/ProcessingLoader";
import { getPresignedUrl } from "@/actions/generation";
import GeneratedSongCard from "./_components/GeneratedSongCard";

interface ResultProps {
  params: {
    songId: string; // The name of the dynamic segment
  };
}

const ResulePage = async ({ params }: ResultProps) => {
  const { songId } = params;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/auth/sign-in");
  }

  const [generatedSong] = await db
    .select({
      ...getTableColumns(song),
      userName: user.name,
      userEmail: user.email,
    })
    .from(song)
    .leftJoin(user, eq(song.userId, user.id))
    .where(eq(song.id, songId));

  // get thumbnail presigned url
  let thumbnailUrl = "";
  if (generatedSong) {
    thumbnailUrl = await getPresignedUrl(generatedSong.thumbnailS3Key || "");
  }

  return (
    <main className="p-10 flex flex-col">
      <Link
        href={"/"}
        className="flex items-center gap-2 hover:opacity-[0.8] ease-in-out"
      >
        <ArrowLeftIcon className="size-5" />
        Go to home
      </Link>

      <div className="flex flex-col mt-10 space-y-20">
        <div>
          <h1 className="font-bold text-4xl tracking-widest">Generated Song</h1>

          <div className="p-5 flex items-center justify-center h-full">
            {generatedSong ? (
              generatedSong.status === "processing" ? (
                <div className="flex flex-col gap-2 items-center justify-center">
                  <ProcessingLoader />
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <p className="text-sm">
                      The song is processing. Please wait.
                    </p>{" "}
                    <MusicIcon className="size-4" />
                  </div>
                </div>
              ) : generatedSong.status === "failed" ? (
                <Empty
                  title="Song Failed to Generate"
                  subTitle="Please try again later."
                />
              ) : (
                <div className="flex items-center justify-center">
                  <GeneratedSongCard
                    songTitle={generatedSong.title}
                    songImage={thumbnailUrl || "/empty-img.png"}
                    songOwnerName={generatedSong.userName || ""}
                    songOwnerEmail={generatedSong.userEmail || ""}
                  />
                </div>
              )
            ) : (
              <Empty
                title="No Song Found With This ID"
                subTitle="Your song has not been generated"
              />
            )}
          </div>
        </div>

        <div>
          <h1 className="font-bold text-4xl tracking-widest">
            Your Song Tracks
          </h1>
          <div className="p-5 flex items-center justify-center h-full">
            <Suspense
              fallback={
                <div className="flex h-screen w-full items-center justify-center">
                  <LoaderCircleIcon className="size-8 animate-spin" />
                </div>
              }
            >
              <TrackListFetcher />
            </Suspense>
          </div>
        </div>
      </div>
    </main>
  );
};

export default ResulePage;
