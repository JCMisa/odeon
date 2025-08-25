"use client";

import { userPlayerStore } from "@/stores/use-player-store";
import {
  DownloadIcon,
  MusicIcon,
  PauseIcon,
  PlayIcon,
  Volume2Icon,
  XIcon,
  UserIcon,
} from "lucide-react";
import Image from "next/image";
import { Button } from "../ui/button";
import { useEffect, useRef, useState } from "react";
import { Slider } from "../ui/slider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Badge } from "../ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { formatTime } from "@/lib/utils";
import { getPlayUrl } from "@/actions/generation";

const Soundbar = () => {
  const { track } = userPlayerStore();

  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState([50]);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [audioError, setAudioError] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);

  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => {
      setCurrentTime(audio.currentTime);
    };

    const updateDuration = () => {
      if (!isNaN(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration);
      }
    };

    const handleTrackEnd = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handleError = () => {
      console.error("Audio playback error");
      setAudioError(true);
      setIsPlaying(false);

      // Check if it's a CORS error
      if (audioRef.current?.error?.code === 4) {
        console.error(
          "CORS error detected. Please configure S3 bucket CORS settings."
        );
        // Show a more specific error message
        setAudioError(true);
      } else {
        // Try to refresh the URL if there's an error
        if (track?.id) {
          setTimeout(() => {
            refreshPlayUrl();
          }, 1000);
        }
      }
    };

    const handleCanPlay = () => {
      setAudioError(false);
    };

    const handleLoadedMetadata = () => {
      updateDuration();
    };

    const handleTimeUpdate = () => {
      updateTime();
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("durationchange", updateDuration);
    audio.addEventListener("ended", handleTrackEnd);
    audio.addEventListener("error", handleError);
    audio.addEventListener("canplay", handleCanPlay);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("durationchange", updateDuration);
      audio.removeEventListener("ended", handleTrackEnd);
      audio.removeEventListener("error", handleError);
      audio.removeEventListener("canplay", handleCanPlay);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle track changes
  useEffect(() => {
    if (audioRef.current && track?.url) {
      console.log("Setting new track URL:", track.url);
      setCurrentTime(0);
      setDuration(0);
      setAudioError(false);

      // Reset audio element
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.src = track.url;

      // Load the audio
      audioRef.current.load();

      // Add a small delay to ensure the audio is loaded before attempting to play
      setTimeout(() => {
        if (audioRef.current && track?.url) {
          console.log("Attempting to play audio...");
          const playPromise = audioRef.current.play();
          if (playPromise !== undefined) {
            playPromise
              .then(() => {
                console.log("Audio started playing successfully");
                setIsPlaying(true);
              })
              .catch((error) => {
                console.error("Auto-play failed:", error);
                setIsPlaying(false);
                setAudioError(true);
              });
          }
        }
      }, 500); // Increased delay to give more time for loading
    }
  }, [track?.url]);

  // Handle volume changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume[0] / 100;
    }
  }, [volume]);

  // Update time more frequently for smooth progress bar
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      if (audioRef.current && !audioRef.current.paused) {
        const newTime = audioRef.current.currentTime;
        if (newTime !== currentTime) {
          setCurrentTime(newTime);
        }
      }
    }, 100); // Update every 100ms for smooth progress

    return () => clearInterval(interval);
  }, [isPlaying, currentTime]);

  const togglePlay = async () => {
    if (!track?.url || !audioRef.current) {
      console.log("No track URL or audio element available");
      return;
    }

    // Validate URL
    try {
      new URL(track.url);
    } catch (error) {
      console.error("Invalid URL: ", track.url, error);
      setAudioError(true);
      return;
    }

    try {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        // Ensure audio is loaded before playing
        if (audioRef.current.readyState < 2) {
          audioRef.current.load();
          await new Promise<void>((resolve) => {
            const handleCanPlay = () => {
              audioRef.current!.removeEventListener("canplay", handleCanPlay);
              resolve();
            };
            audioRef.current!.addEventListener("canplay", handleCanPlay);
          });
        }

        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          await playPromise;
          setIsPlaying(true);
          setAudioError(false);
        }
      }
    } catch (error) {
      console.error("Playback toggle failed:", error);
      setIsPlaying(false);
      setAudioError(true);
    }
  };

  const handleSeek = (value: number[]) => {
    if (audioRef.current && value[0] !== undefined) {
      const newTime = value[0];
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const refreshPlayUrl = async () => {
    if (!track?.id) return;

    try {
      console.log("Refreshing play URL for track:", track.id);
      const newUrl = await getPlayUrl(track.id);
      console.log("New URL:", newUrl);

      // Update the track with new URL
      userPlayerStore.setState((state) => ({
        track: state.track ? { ...state.track, url: newUrl } : null,
      }));
    } catch (error) {
      console.error("Failed to refresh play URL:", error);
      setAudioError(true);
    }
  };

  if (!track) return null;

  // Handle both string and array types for track.prompt
  const promptsArray = track.prompt
    ? Array.isArray(track.prompt)
      ? track.prompt.map((prompt) => prompt.name)
      : track.prompt
          .split(",")
          .map((prompt) => prompt.trim())
          .filter((prompt) => prompt.length > 0)
    : [];

  return (
    <>
      {/* Spinning Disk Soundbar */}
      <div className="fixed bottom-4 right-4 z-50">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <Tooltip>
            <TooltipTrigger asChild>
              <DialogTrigger asChild>
                <div
                  className="relative group cursor-pointer"
                  onDoubleClick={() => setIsDialogOpen(true)}
                >
                  {/* Spinning Disk */}
                  <div
                    className={`relative w-16 h-16 rounded-full overflow-hidden shadow-lg border-4 border-white/20 bg-gradient-to-br from-purple-500 to-primary transition-all duration-300 group-hover:scale-110 ${isPlaying ? "spinning-disk" : ""} ${isPlaying ? "disk-glow" : ""}`}
                  >
                    {track.artwork ? (
                      <Image
                        src={track.artwork}
                        alt="thumbnail"
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-primary">
                        <MusicIcon className="size-6 text-white" />
                      </div>
                    )}

                    {/* Center hole */}
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-inner"></div>

                    {/* Play/Pause overlay */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                      {isPlaying ? (
                        <PauseIcon className="size-5 text-white" />
                      ) : (
                        <PlayIcon className="size-5 text-white fill-white" />
                      )}
                    </div>
                  </div>

                  {/* Error indicator */}
                  {audioError && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                      <XIcon className="size-2 text-white" />
                    </div>
                  )}
                </div>
              </DialogTrigger>
            </TooltipTrigger>
            <TooltipContent side="right" className="bg-neutral-900 text-white">
              <p>Double-click to open player</p>
            </TooltipContent>
          </Tooltip>

          {/* Play/Pause Button Overlay */}
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              togglePlay();
            }}
            className="absolute -right-2 -top-2 w-8 h-8 rounded-full bg-primary text-white hover:bg-primary/90 shadow-lg"
          >
            {isPlaying ? (
              <PauseIcon className="size-4" />
            ) : (
              <PlayIcon className="size-4" />
            )}
          </Button>

          {/* Song Information Dialog */}
          <DialogContent className="max-w-md bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-900 dark:to-neutral-800 border-0 shadow-2xl">
            <DialogHeader className="text-center">
              <DialogTitle className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
                Now Playing
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              {/* Album Art */}
              <div className="flex justify-center">
                <div className="relative w-48 h-48 rounded-2xl overflow-hidden shadow-xl border-4 border-white/20">
                  {track.artwork ? (
                    <Image
                      src={track.artwork}
                      alt="album art"
                      width={192}
                      height={192}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-primary">
                      <MusicIcon className="size-16 text-white" />
                    </div>
                  )}

                  {/* Center hole */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-white rounded-full shadow-inner"></div>
                </div>
              </div>

              {/* Song Info */}
              <div className="text-center space-y-2">
                <h3 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 truncate">
                  {track.title || "Untitled"}
                </h3>
                <div className="flex items-center justify-center gap-2 text-neutral-600 dark:text-neutral-400">
                  <UserIcon className="size-4" />
                  <span className="text-sm">
                    {track.createdByUserName || "Unknown Artist"}
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-neutral-600 dark:text-neutral-400">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
                <Slider
                  value={[currentTime]}
                  max={duration || 100}
                  step={1}
                  onValueChange={handleSeek}
                  className="w-full"
                />
                {/* Debug info */}
                <div className="text-xs text-neutral-500">
                  <div>Current: {currentTime.toFixed(2)}s</div>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center gap-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={togglePlay}
                  className="w-12 h-12 rounded-full"
                >
                  {isPlaying ? (
                    <PauseIcon className="size-5" />
                  ) : (
                    <PlayIcon className="size-5" />
                  )}
                </Button>
              </div>

              {/* Volume Control */}
              <div className="flex items-center gap-3">
                <Volume2Icon className="size-4 text-neutral-600 dark:text-neutral-400" />
                <Slider
                  value={volume}
                  onValueChange={setVolume}
                  step={1}
                  max={100}
                  min={0}
                  className="flex-1"
                />
                <span className="text-xs text-neutral-600 dark:text-neutral-400 w-8">
                  {volume[0]}%
                </span>
              </div>

              {/* Prompts/Tags */}
              {promptsArray.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Tags
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {promptsArray.map((prompt, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="text-xs px-2 py-1 bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300"
                      >
                        {prompt}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Error Message */}
              {audioError && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                  <p className="text-red-800 dark:text-red-200 text-sm font-medium">
                    Audio playback error
                  </p>
                  <p className="text-red-600 dark:text-red-300 text-xs mt-1">
                    This might be due to CORS configuration. Please check S3
                    bucket settings.
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-center gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (!track?.url) return;
                    window.open(track.url, "_blank");
                  }}
                  className="flex items-center gap-2"
                >
                  <DownloadIcon className="size-4" />
                  Download
                </Button>
                {/* <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    console.log("Track URL:", track?.url);
                    console.log("Audio element:", audioRef.current);
                    console.log(
                      "Audio readyState:",
                      audioRef.current?.readyState
                    );
                    console.log(
                      "Audio networkState:",
                      audioRef.current?.networkState
                    );
                    console.log("Audio error:", audioRef.current?.error);
                  }}
                  className="flex items-center gap-2"
                >
                  Debug
                </Button> */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refreshPlayUrl}
                  className="flex items-center gap-2"
                >
                  Refresh URL
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Hidden Audio Element */}
      {track?.url && (
        <audio
          ref={audioRef}
          src={track.url}
          preload="metadata"
          crossOrigin="anonymous"
          onError={(e) => {
            console.error("Audio element error:", e);
            setAudioError(true);
          }}
          onLoadStart={() => {
            console.log("Audio loading started");
          }}
          onCanPlay={() => {
            console.log("Audio can play");
            setAudioError(false);
          }}
        />
      )}
    </>
  );
};

export default Soundbar;
