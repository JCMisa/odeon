"use client";

import {
  ChevronsLeftIcon,
  ChevronsRightIcon,
  HeartIcon,
  LoaderCircleIcon,
  PauseIcon,
  PlayIcon,
  UserIcon,
} from "lucide-react";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { userPlayerStore } from "@/stores/use-player-store";
import { Button } from "@/components/ui/button";
import { getPlayUrl } from "@/actions/generation";
import { setPublishedStatus, toggleLikeSong } from "@/actions/song";
import { toast } from "sonner";
import { getCurrentUser } from "@/actions/user";

const GeneratedSongCard = ({
  songId,
  songTitle,
  songImage,
  songOwnerId,
  songOwnerName,
  songOwnerEmail,
  songPrompts,
  listenCount = 0,
  likeCount = 0,
  isPublished,
  isLikedInitial,
  showPlayButton = true,
}: {
  songId: string;
  songTitle: string;
  songImage: string;
  songOwnerId: string;
  songOwnerName: string;
  songOwnerEmail: string;
  songPrompts: string | Array<{ id: string; name: string }>;
  listenCount: number;
  likeCount: number;
  isPublished?: boolean;
  isLikedInitial?: boolean;
  showPlayButton?: boolean;
}) => {
  const setTrack = userPlayerStore((state) => state.setTrack);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isLiked, setIsLiked] = useState(!!isLikedInitial);
  const [likesCount, setLikesCount] = useState(likeCount);
  const [isLiking, setIsLiking] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      const currentUser = await getCurrentUser();
      if (currentUser.success && currentUser.data) {
        if (songOwnerId === currentUser.data.id) {
          setIsOwner(true);
        }
      }
    };

    getUser();
  }, [songOwnerId]);

  // Keep local liked state in sync with SSR/prop on refresh or prop changes
  useEffect(() => {
    setIsLiked(!!isLikedInitial);
  }, [isLikedInitial]);

  // Handle both string and array types for songPrompts
  const promptsArray = Array.isArray(songPrompts)
    ? songPrompts.map((prompt) => prompt.name)
    : songPrompts
        .split(",")
        .map((prompt) => prompt.trim())
        .filter((prompt) => prompt.length > 0);

  const handlePlay = async () => {
    setIsPlaying(true);
    const playUrl = await getPlayUrl(songId);

    // Convert songPrompts to string for the player
    const promptString = Array.isArray(songPrompts)
      ? songPrompts.map((prompt) => prompt.name).join(", ")
      : songPrompts;

    // play the song in the playbar
    setTrack({
      id: songId,
      title: songTitle,
      url: playUrl,
      artwork: songImage,
      prompt: promptString,
      createdByUserName: songOwnerName,
    });
  };

  const handleStop = async () => {
    setIsPlaying(false);

    // stop the song in the playbar
    setTrack({
      id: "",
      title: null,
      url: null,
      artwork: null,
      prompt: null,
      createdByUserName: null,
    });
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();

    setIsLiking(true);
    try {
      const result = await toggleLikeSong(songId);

      if (result?.success) {
        setIsLiked(result.liked);
        setLikesCount(result.liked ? likesCount + 1 : likesCount - 1);
      }
    } catch (error) {
      console.error("Error toggling like:", error);
      // Revert the optimistic update if there's an error
      setIsLiked(!isLiked);
      setLikesCount(isLiked ? likesCount - 1 : likesCount + 1);
    } finally {
      setIsLiking(false);
    }
  };

  return (
    <div className="w-[30rem] max-h-[20rem] overflow-hidden bg-neutral-100 dark:bg-neutral-900 rounded-md flex flex-col items-center justify-center gap-2 p-5">
      <div className="flex items-center justify-between gap-2 w-full px-2">
        {/* owner info */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 object-cover rounded-full p-2 flex items-center justify-center bg-neutral-200 dark:bg-neutral-800">
            <UserIcon className="size-5" />
          </div>
          <p className="truncate text-muted-foreground text-sm tracking-wider w-[160px]">
            {songOwnerEmail}
          </p>
        </div>

        {isOwner && (
          <Button
            onClick={async (e) => {
              e.stopPropagation();
              setPublishing(true);
              try {
                await setPublishedStatus(songId, !isPublished);
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
            className={`cursor-pointer border ${isPublished ? "border-green-500" : "border-red-500"}`}
          >
            {publishing ? (
              <LoaderCircleIcon className="animate-spin size-4" />
            ) : isPublished ? (
              "Published"
            ) : (
              "Unpublished"
            )}
          </Button>
        )}
      </div>

      <div className="music-gs">
        <Image
          src={songImage}
          alt="thumbnail"
          width={1000}
          height={1000}
          className="w-32 h-32 rounded-md"
        />
      </div>
      <div className="flex flex-col items-center">
        <span className="font-bold text-lg tracking-wide">
          <div></div>
          {songTitle}
        </span>
        <span className="text-muted-foreground text-sm">
          <div></div>
          {songOwnerName}
        </span>
      </div>
      {/* prev, play, next buttons */}
      {showPlayButton && (
        <div className="flex items-center gap-5">
          <ChevronsLeftIcon className="size-10 cursor-pointer" />
          {isPlaying ? (
            <Button
              variant={"ghost"}
              size={"icon"}
              onClick={handleStop}
              className="cursor-pointer size-7"
            >
              <PauseIcon />
            </Button>
          ) : (
            <Button
              variant={"ghost"}
              size={"icon"}
              onClick={handlePlay}
              className="cursor-pointer size-7"
            >
              <PlayIcon />
            </Button>
          )}
          <ChevronsRightIcon className="size-10 cursor-pointer" />
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-muted-foreground w-full">
        <span>{listenCount} listens</span>
        <button
          className="flex items-center gap-1 cursor-pointer"
          onClick={handleLike}
        >
          {isLiking ? (
            <LoaderCircleIcon className="size-4 animate-spin" />
          ) : (
            <HeartIcon
              className={`size-4 ${isLiked ? "fill-red-500 text-red-500" : ""}`}
            />
          )}
          {likesCount} likes
        </button>
      </div>

      <div className="w-full overflow-hidden px-2">
        <div className="flex gap-1 animate-marquee">
          {promptsArray.map((prompt, index) => (
            <Badge
              key={`a-${index}`}
              variant="secondary"
              className="text-xs px-2 py-1 bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 shrink-0"
            >
              {prompt}
            </Badge>
          ))}
          {promptsArray.map((prompt, index) => (
            <Badge
              key={`b-${index}`}
              variant="secondary"
              className="text-xs px-2 py-1 bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 shrink-0"
            >
              {prompt}
            </Badge>
          ))}
        </div>
      </div>
      <style jsx>{`
        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-marquee {
          width: max-content;
          animation: marquee 20s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default GeneratedSongCard;
