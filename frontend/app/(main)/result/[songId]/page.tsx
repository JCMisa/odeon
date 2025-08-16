import { ArrowLeftIcon, LoaderCircleIcon } from "lucide-react";
import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import TrackListFetcher from "./_components/TrackListFetcher";
import Link from "next/link";
import { db } from "@/config/db";
import { song } from "@/config/schema";
import { eq } from "drizzle-orm";
import Empty from "@/components/custom/Empty";

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
    .select()
    .from(song)
    .where(eq(song.id, songId));

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
          <h1 className="font-bold text-4xl tracking-widest] w-[40%] truncate">
            {generatedSong.title}
          </h1>

          <div className="p-5 flex items-center justify-center h-full">
            {generatedSong ? (
              <p>{generatedSong.s3Key}</p>
            ) : (
              <Empty
                title="No Song Found With This ID"
                subTitle="Your song has not been generated"
              />
            )}
          </div>
        </div>

        <div>
          <h1 className="font-bold text-4xl tracking-widest]">
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
