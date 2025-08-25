"use client";

import { getPlayUrl } from "@/actions/generation";
import { userPlayerStore } from "@/stores/use-player-store";
import { useState } from "react";
import { toast } from "sonner";
import GeneratedSongCard from "../result/[songId]/_components/GeneratedSongCard";

export type SongWithRelation = {
  song: {
    id: string;
    title: string;
    s3Key: string | null;
    thumbnailS3Key: string | null;
    status: "queued" | "processed" | "processing" | "no credits" | "failed";
    instrumental: boolean;
    prompt: string | null;
    lyrics: string | null;
    fullDescribedSong: string | null;
    describedLyrics: string | null;
    guidanceScale: number | null;
    inferStep: number | null;
    audioDuration: number | null;
    seed: number | null;
    published: boolean;
    listenCount: number;
    userId: string;
    createdAt: Date;
    updatedAt: Date;
  };
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
  likesCount: number;
  likerUserIds?: string[];
  isLikedInitial?: boolean;
  categories: Array<{
    id: string;
    name: string;
  }>;
  thumbnailUrl: string | null;
};

interface SongCardProps {
  song: SongWithRelation;
}

const SongCard = ({ song }: SongCardProps) => {
  const setTrack = userPlayerStore((state) => state.setTrack);

  const [isLoading, setIsLoading] = useState(false);

  const handlePlay = async () => {
    // Don't allow playing if song is still processing
    if (song.song.status === "queued" || song.song.status === "processing") {
      toast.error("Song is still being generated. Please wait.");
      return;
    }

    setIsLoading(true);

    try {
      const playUrl = await getPlayUrl(song.song.id);

      // play the song in the playbar
      setTrack({
        id: song.song.id,
        title: song.song.title,
        url: playUrl,
        artwork: song.thumbnailUrl,
        prompt: song.song.prompt,
        createdByUserName: song.user.name,
      });
    } catch (error) {
      console.error("Error getting play URL:", error);
      toast.error("Failed to load song. Please try refreshing.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div
        onClick={handlePlay}
        className="cursor-pointer rounded-md hover:opacity-[0.8] transition-opacity duration-200 ease-linear"
      >
        <GeneratedSongCard
          songId={song.song.id}
          songImage={song.thumbnailUrl || "/empty-img.png"}
          songOwnerId={song.user.id}
          songOwnerEmail={song.user.email}
          songOwnerName={song.user.name}
          songPrompts={song.song.prompt || song.categories}
          songTitle={song.song.title}
          listenCount={song.song.listenCount}
          likeCount={song.likesCount}
          isPublished={song.song.published}
          isLikedInitial={!!song.isLikedInitial}
          showPlayButton={false}
        />
      </div>
    </div>
  );
};

export default SongCard;
