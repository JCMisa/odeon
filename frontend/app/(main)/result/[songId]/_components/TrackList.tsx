"use client";

import { getPlayUrl } from "@/actions/generation";
import { setPublishedStatus } from "@/actions/song";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DownloadIcon,
  Loader2Icon,
  LoaderCircleIcon,
  MoreHorizontalIcon,
  MusicIcon,
  PlayIcon,
  RefreshCcwIcon,
  SearchIcon,
  XCircleIcon,
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import RenameDialog from "./RenameDialog";
import Empty from "@/components/custom/Empty";
import { useRouter } from "next/navigation";
import { userPlayerStore } from "@/stores/use-player-store";

export interface Track {
  id: string;
  title: string | null;
  createdAt: Date;
  instrumental: boolean | null;
  prompt: string | null;
  lyrics: string | null;
  describedLyrics: string | null;
  fullDescribedSong: string | null;
  thumbnailUrl: string | null;
  playUrl: string | null;
  status: string | null;
  createdByUserName: string | null;
  createdByUserEmail: string | null;
  createdByUserImage: string | null;
  published: boolean | null;
}

const TrackList = ({ tracks }: { tracks: Track[] }) => {
  const router = useRouter();

  const setTrack = userPlayerStore((state) => state.setTrack);

  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadingTrackId, setLoadingTrackId] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);

  const filteredTracks = tracks.filter(
    (track) =>
      track.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      track.prompt?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleTrackSelect = async (track: Track) => {
    if (loadingTrackId) return;

    // Don't allow playing if song is still processing
    if (track.status === "queued" || track.status === "processing") {
      toast.error("Song is still being generated. Please wait.");
      return;
    }

    setLoadingTrackId(track.id);

    try {
      const playUrl = await getPlayUrl(track.id);
      setLoadingTrackId(null);

      // play the song in the playbar
      setTrack({
        id: track.id,
        title: track.title,
        url: playUrl,
        artwork: track.thumbnailUrl,
        prompt: track.prompt,
        createdByUserName: track.createdByUserName,
      });
    } catch (error) {
      setLoadingTrackId(null);
      console.error("Error getting play URL:", error);
      toast.error("Failed to load song. Please try refreshing.");
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    router.refresh();
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  return (
    <div className="flex flex-1 flex-col overflow-y-auto custom-scrollbar">
      <div className="flex-1 p-6">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div className="relative max-w-md flex-1">
            <SearchIcon className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              placeholder="Search..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button
            disabled={isRefreshing}
            variant={"outline"}
            size={"sm"}
            onClick={handleRefresh}
          >
            {isRefreshing ? (
              <LoaderCircleIcon className="size-4 animate-spin mr-2" />
            ) : (
              <RefreshCcwIcon className="size-4 mr-2" />
            )}
            Refresh
          </Button>
        </div>

        {/* track list */}
        <div className="space-y-2">
          {filteredTracks.length > 0 ? (
            filteredTracks.map((track) => {
              switch (track.status) {
                case "failed":
                  return (
                    <div
                      key={track.id}
                      className="flex cursor-not-allowed items-center gap-4 rounded-lg p-3"
                    >
                      <div className="bg-destructive/10 flex h-12 w-12 flexshrink-0 items-center justify-center rounded-md">
                        <XCircleIcon className="text-destructive size-6" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-destructive truncate text-sm font-medium">
                          Generation failed
                        </h3>
                        <p className="text-muted-foreground truncate text-xs">
                          Please try creating the song again.
                        </p>
                      </div>
                    </div>
                  );
                case "no credits":
                  return (
                    <div
                      key={track.id}
                      className="flex cursor-not-allowed items-center gap-4 rounded-lg p-3"
                    >
                      <div className="bg-destructive/10 flex h-12 w-12 flexshrink-0 items-center justify-center rounded-md">
                        <XCircleIcon className="text-destructive size-6" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-destructive truncate text-sm font-medium">
                          Not enough credits
                        </h3>
                        <p className="text-muted-foreground truncate text-xs">
                          Please purchase more credits to generate this song.
                        </p>
                      </div>
                    </div>
                  );
                case "queued":
                case "processing":
                  return (
                    <div
                      key={track.id}
                      className="flex cursor-not-allowed items-center gap-4 rounded-lg p-3"
                    >
                      <div className="bg-muted flex h-12 w-12 flexshrink-0 items-center justify-center rounded-md">
                        <Loader2Icon className="text-muted-foreground size-6 animate-spin" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-muted-foreground truncate text-sm font-medium">
                          {track.status === "queued"
                            ? "Queued for generation"
                            : "Generating song..."}
                        </h3>
                        <p className="text-muted-foreground truncate text-xs">
                          This may take a few minutes. Refresh to check the
                          status.
                        </p>
                      </div>
                    </div>
                  );

                default:
                  return (
                    <div
                      key={track.id}
                      className="hover:bg-muted/50 flex cursor-pointer items-center gap-4 rounded-lg p-3 transition-colors"
                      onClick={() => handleTrackSelect(track)}
                    >
                      {/* thumbnail */}
                      <div className="group relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-md">
                        {track.thumbnailUrl ? (
                          <Image
                            src={track.thumbnailUrl}
                            alt="thumbnail"
                            width={1000}
                            height={1000}
                            className="h-full w-full object-cover transition-all group-hover:scale-110"
                          />
                        ) : (
                          <div className="bg-muted flex h-full w-full items-center justify-center">
                            <MusicIcon className="text-muted-foreground size-6" />
                          </div>
                        )}

                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity group-hover:opacity-100">
                          {loadingTrackId === track.id ? (
                            <div className="flex items-center justify-center p-1 rounded-md bg-neutral-100 dark:bg-neutral-900">
                              <LoaderCircleIcon className="size-4 animate-spin text-primary" />
                            </div>
                          ) : (
                            <div className="flex items-center justify-center p-1 rounded-md bg-neutral-100 dark:bg-neutral-900">
                              <PlayIcon className="size-4 text-primary fill-primary" />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* track info */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="truncate text-sm font-medium w-[50%]">
                            {track.title}
                          </h3>
                          {track.instrumental && (
                            <Badge variant={"outline"}>Instrumental</Badge>
                          )}
                        </div>
                        <p className="text-muted-foreground truncate text-xs">
                          {track.prompt}
                        </p>
                      </div>

                      {/* actions */}
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={async (e) => {
                            e.stopPropagation();
                            setPublishing(true);
                            try {
                              await setPublishedStatus(
                                track.id,
                                !track.published
                              );
                            } catch (error) {
                              console.log("publishing error: ", error);
                              toast.error("Failed to publish song");
                            } finally {
                              setPublishing(false);
                            }
                          }}
                          disabled={publishing}
                          variant={"outline"}
                          size={"sm"}
                          className={`cursor-pointer ${track.published ? "border-red-200" : ""}`}
                        >
                          {publishing ? (
                            <LoaderCircleIcon className="animate-spin size-4" />
                          ) : track.published ? (
                            "Published"
                          ) : (
                            "Unpublished"
                          )}
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            className="cursor-pointer"
                            asChild
                          >
                            <MoreHorizontalIcon className="size-5" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              className="text-sm"
                              onClick={async (e) => {
                                e.stopPropagation();

                                // Don't allow downloading if song is still processing
                                if (
                                  track.status === "queued" ||
                                  track.status === "processing"
                                ) {
                                  toast.error(
                                    "Song is still being generated. Please wait."
                                  );
                                  return;
                                }

                                try {
                                  const playUrl = await getPlayUrl(track.id);
                                  window.open(playUrl, "_blank"); // redirect user browser in new tab to start downloading
                                } catch (error) {
                                  console.error(
                                    "Error getting download URL:",
                                    error
                                  );
                                  toast.error(
                                    "Failed to get download link. Please try refreshing."
                                  );
                                }
                              }}
                            >
                              <DownloadIcon className="mr-1 size-5" /> Download
                            </DropdownMenuItem>

                            <RenameDialog track={track} />
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  );
              }
            })
          ) : (
            <div className="flex flex-col items-center justify-center gap-2">
              <Empty
                title="No Song Found"
                subTitle={
                  searchQuery
                    ? "No tracks match your search."
                    : "Create your first song to get started."
                }
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrackList;
