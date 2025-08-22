import {
  ChevronsLeftIcon,
  ChevronsRightIcon,
  PlayIcon,
  UserIcon,
} from "lucide-react";
import Image from "next/image";
import React from "react";

const GeneratedSongCard = ({
  songTitle,
  songImage,
  songOwnerName,
  songOwnerEmail,
}: {
  songTitle: string;
  songImage: string;
  songOwnerName: string;
  songOwnerEmail: string;
}) => {
  return (
    <div className="w-[30rem] h-[21rem] bg-neutral-100 dark:bg-neutral-900 rounded-md flex flex-col items-center justify-center gap-2 p-5 relative">
      <div className="rounded-full bg-primary py-1 px-5 flex items-center justify-center absolute top-2">
        <span className="text-xs font-semibold tracking-widest">Odeon</span>
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
        <PlayIcon className="size-10 fill-primary cursor-pointer" />
        <ChevronsRightIcon className="size-10 cursor-pointer" />
      </div>
      {/* owner info */}
      <div className="flex items-center gap-2 absolute bottom-2 left-2">
        <div className="w-8 h-8 object-cover rounded-full p-2 flex items-center justify-center bg-neutral-200 dark:bg-neutral-800">
          <UserIcon className="size-5" />
        </div>
        <p className="truncate text-muted-foreground text-sm tracking-wider">
          {songOwnerEmail}
        </p>
      </div>
    </div>
  );
};

export default GeneratedSongCard;
