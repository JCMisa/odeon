"use client";

import {
  ChevronsLeftIcon,
  ChevronsRightIcon,
  PauseIcon,
  PlayIcon,
  UserIcon,
} from "lucide-react";
import Image from "next/image";
import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { userPlayerStore } from "@/stores/use-player-store";
import { Button } from "@/components/ui/button";
import { getPlayUrl } from "@/actions/generation";

const GeneratedSongCard = ({
  songId,
  songTitle,
  songImage,
  songOwnerName,
  songOwnerEmail,
  songPrompts,
}: {
  songId: string;
  songTitle: string;
  songImage: string;
  songOwnerName: string;
  songOwnerEmail: string;
  songPrompts: string;
}) => {
  const setTrack = userPlayerStore((state) => state.setTrack);

  const [isPlaying, setIsPlaying] = useState(false);

  // Convert comma-separated string to array and clean up whitespace
  const promptsArray = songPrompts
    .split(",")
    .map((prompt) => prompt.trim())
    .filter((prompt) => prompt.length > 0);

  const handlePlay = async () => {
    setIsPlaying(true);
    const playUrl = await getPlayUrl(songId);

    // play the song in the playbar
    setTrack({
      id: songId,
      title: songTitle,
      url: playUrl,
      artwork: songImage,
      prompt: songPrompts,
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

  return (
    <div className="w-[30rem] bg-neutral-100 dark:bg-neutral-900 rounded-md flex flex-col items-center justify-center gap-2 p-5">
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

        <div className="rounded-full bg-primary py-1 px-5 flex items-center justify-center">
          <span className="text-xs font-semibold tracking-widest">Odeon</span>
        </div>
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

      <div className="w-full flex flex-wrap gap-1 px-2">
        {promptsArray.map((prompt, index) => (
          <Badge
            key={index}
            variant="secondary"
            className="text-xs px-2 py-1 bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
          >
            {prompt}
          </Badge>
        ))}
      </div>
    </div>
  );
};

export default GeneratedSongCard;
