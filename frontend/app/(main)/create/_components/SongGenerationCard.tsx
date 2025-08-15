"use client";

import React, { useState } from "react";
import { useSongCreation } from "@/contexts/EmotionContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ConfettiAnimation } from "@/components/custom/ConfettiAnimation";
import { LoaderCircleIcon } from "lucide-react";
import { GenerateRequest, generateSong } from "@/actions/generation";
import { toast } from "sonner";

export const SongGenerationCard: React.FC = () => {
  const { songData, setCurrentStep, resetData, creationMethod } =
    useSongCreation();

  const [isGenerating, setIsGenerating] = useState(false);
  const [isGenerated, setIsGenerated] = useState(false);
  // for confetti
  const [showConfetti, setShowConfetti] = useState(false);

  const handleGenerate = async () => {
    let fullDescribedSong = "";
    let describedLyrics = "";
    let lyrics = "";
    let prompt = "";

    switch (songData.creationMethod) {
      case "ai-full":
        fullDescribedSong = `User Emotion: ${songData.emotion}. Song Description: ${songData.songDescription}`;
        break;
      case "ai-lyrics":
        prompt = `${[
          songData.emotion,
          ...(Array.isArray(songData.settings.genre)
            ? songData.settings.genre
            : [songData.settings.genre]),
          songData.settings.voice,
          songData.settings.style,
          songData.settings.key,
          songData.settings.tempo,
          ...(Array.isArray(songData.settings.instrument)
            ? songData.settings.instrument
            : [songData.settings.instrument]),
          ...(Array.isArray(songData.settings.energy)
            ? songData.settings.energy
            : [songData.settings.energy]),
          ...(Array.isArray(songData.settings.atmosphere)
            ? songData.settings.atmosphere
            : [songData.settings.atmosphere]),
        ]
          .filter(Boolean)
          .join(", ")}`;
        describedLyrics = songData.songDescription as string;
        break;
      case "manual":
        prompt = `${[
          songData.emotion,
          ...(Array.isArray(songData.settings.genre)
            ? songData.settings.genre
            : [songData.settings.genre]),
          songData.settings.voice,
          songData.settings.style,
          songData.settings.key,
          songData.settings.tempo,
          ...(Array.isArray(songData.settings.instrument)
            ? songData.settings.instrument
            : [songData.settings.instrument]),
          ...(Array.isArray(songData.settings.energy)
            ? songData.settings.energy
            : [songData.settings.energy]),
          ...(Array.isArray(songData.settings.atmosphere)
            ? songData.settings.atmosphere
            : [songData.settings.atmosphere]),
        ]
          .filter(Boolean)
          .join(", ")}`;
        lyrics = songData.lyrics as string;
        break;
    }

    console.log(
      "fullDescribedSong to be passed to AI to generate prompt and lyrics: ",
      fullDescribedSong
    );
    console.log("prompt in array with comma separated string: ", prompt);
    console.log(
      "description of the lyrics to be passed to AI to generate lyrics: ",
      describedLyrics
    );
    console.log(
      "manual generated lyrics to be used directly by AceStep: ",
      lyrics
    );
    console.log("is song instrumental: ", songData.isInstrumental);

    // generate the song
    let requestBody: GenerateRequest;

    if (songData.creationMethod === "ai-full") {
      requestBody = {
        fullDescribedSong: fullDescribedSong,
        instrumental: songData.isInstrumental,
        requiredCredits: 80,
      };
    } else if (songData.creationMethod === "ai-lyrics") {
      requestBody = {
        prompt: prompt,
        describedLyrics: describedLyrics,
        instrumental: songData.isInstrumental,
        requiredCredits: 50,
      };
    } else {
      requestBody = {
        prompt: prompt,
        lyrics: lyrics,
        instrumental: songData.isInstrumental,
        requiredCredits: 20,
      };
    }

    try {
      setIsGenerating(true);

      const result = await generateSong(requestBody);

      if (result?.success) {
        setIsGenerated(true);
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 5000);
        toast.success("Song generated successfully!");
      }
    } catch (error) {
      console.log("song generation error: ", error);
      toast.error("Song generation failed. Please try again.");
    } finally {
      setIsGenerating(false);
    }

    // For now, just simulate completion
    // setTimeout(() => {
    //   setIsGenerating(false);
    //   setIsGenerated(true);
    //   setShowConfetti(true);

    //   // hide confetti after 5s
    //   setTimeout(() => setShowConfetti(false), 5000);
    // }, 5000);
  };

  const handleBack = () => {
    if (creationMethod === "ai-full") {
      setCurrentStep(3); // Back to create song description
    } else {
      setCurrentStep(6); // Back to settings
    }
  };

  const handleStartOver = () => {
    resetData();
  };

  const getCreationMethodLabel = (method: string) => {
    switch (method) {
      case "ai-full":
        return "AI Full Creation";
      case "ai-lyrics":
        return "AI Lyrics Only";
      case "manual":
        return "Manual Creation";
      default:
        return method;
    }
  };

  return (
    <>
      <ConfettiAnimation show={showConfetti} />
      <Card className="w-full max-w-2xl mx-auto h-[500px]">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            Review & Generate
          </CardTitle>
          <CardDescription>
            Review your song configuration and generate your music
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 overflow-y-auto custom-scrollbar flex-1">
          {/* Song Data Summary */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Song Configuration</h3>

            <div className="grid grid-cols-1 gap-3 text-sm">
              <div className="flex justify-between p-2 bg-muted rounded">
                <span className="text-muted-foreground">Emotion:</span>
                <span className="font-medium">{songData.emotion}</span>
              </div>

              <div className="flex justify-between p-2 bg-muted rounded">
                <span className="text-muted-foreground">Creation Method:</span>
                <span className="font-medium">
                  {getCreationMethodLabel(songData.creationMethod)}
                </span>
              </div>

              {songData.songDescription && (
                <div className="p-2 bg-muted rounded">
                  <span className="text-muted-foreground">Description:</span>
                  <p className="font-medium mt-1">{songData.songDescription}</p>
                </div>
              )}

              {songData.lyrics && (
                <div className="p-2 bg-muted rounded">
                  <span className="text-muted-foreground">Lyrics:</span>
                  <p className="font-medium mt-1 font-mono text-xs whitespace-pre-wrap">
                    {songData.lyrics.substring(0, 200)}...
                  </p>
                </div>
              )}

              <div className="flex justify-between p-2 bg-muted rounded">
                <span className="text-muted-foreground">Instrumental:</span>
                <span className="font-medium">
                  {songData.isInstrumental ? "Yes" : "No"}
                </span>
              </div>

              {/* Settings Summary */}
              {Object.keys(songData.settings).length > 0 && (
                <div className="p-2 bg-muted rounded">
                  <span className="text-muted-foreground">Settings:</span>
                  <div className="grid grid-cols-2 gap-2 mt-1 text-xs">
                    {Object.entries(songData.settings).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="capitalize text-muted-foreground">
                          {key}
                          {Array.isArray(value) && ` (${value.length})`}:
                        </span>
                        <span className="font-medium">
                          {Array.isArray(value) ? `${value}` : value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Generation Complete */}
          {isGenerated && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
              <p className="text-green-800 font-medium">
                🎵 Song generated successfully!
              </p>
              <p className="text-green-600 text-sm mt-1">
                Your song is ready to download
              </p>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-between">
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={isGenerating}
              className="cursor-pointer"
            >
              Back
            </Button>
            <Button
              variant="outline"
              onClick={handleStartOver}
              disabled={isGenerating}
              className="cursor-pointer"
            >
              Start Over
            </Button>
          </div>

          {!isGenerated && (
            <Button
              onClick={handleGenerate}
              className="bg-primary cursor-pointer flex items-center justify-center"
              disabled={isGenerating}
            >
              {isGenerating ? (
                <LoaderCircleIcon className="size-5 animate-spin" />
              ) : (
                "Generate Song"
              )}
            </Button>
          )}

          {isGenerated && (
            <Button className="bg-green-600 hover:bg-green-700 cursor-pointer text-white">
              Download Song
            </Button>
          )}
        </CardFooter>
      </Card>
    </>
  );
};
