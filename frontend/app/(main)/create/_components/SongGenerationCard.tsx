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

export const SongGenerationCard: React.FC = () => {
  const { songData, setCurrentStep, resetData } = useSongCreation();

  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);

  const handleGenerate = async () => {
    setIsGenerating(true);

    // Console logging based on creation method
    switch (songData.creationMethod) {
      case "ai-full":
        console.log(
          `User Emotion: ${songData.emotion}. Song Description: ${songData.songDescription}`
        );
        break;
      case "ai-lyrics":
        const aiLyricsSettings = [
          songData.settings.genre,
          songData.settings.voice,
          songData.settings.style,
          songData.settings.key,
          songData.settings.tempo,
          songData.settings.instrument,
          songData.settings.energy,
          songData.settings.atmosphere,
        ].filter(Boolean);
        console.log("User Lyrics - Description:", songData.songDescription);
        console.log("User Song - Settings:", aiLyricsSettings);
        break;
      case "manual":
        const manualSettings = [
          songData.settings.genre,
          songData.settings.voice,
          songData.settings.style,
          songData.settings.key,
          songData.settings.tempo,
          songData.settings.instrument,
          songData.settings.energy,
          songData.settings.atmosphere,
        ].filter(Boolean);
        console.log("Manual - Song Settings:", manualSettings);
        console.log("Manual - Song Lyrics:", songData.lyrics);
        break;
    }

    // Simulate generation progress
    const interval = setInterval(() => {
      setGenerationProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 500);

    // Here you would call your actual generation API
    // await generateSong(songData);

    // For now, just simulate completion
    setTimeout(() => {
      setIsGenerating(false);
      setGenerationProgress(100);
    }, 5000);
  };

  const handleBack = () => {
    setCurrentStep(6); // Back to settings
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
    <Card className="w-full max-w-2xl mx-auto h-[500px]">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">Review & Generate</CardTitle>
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

            {/* Settings Summary */}
            {Object.keys(songData.settings).length > 0 && (
              <div className="p-2 bg-muted rounded">
                <span className="text-muted-foreground">Settings:</span>
                <div className="grid grid-cols-2 gap-2 mt-1 text-xs">
                  {Object.entries(songData.settings).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="capitalize">{key}:</span>
                      <span className="font-medium">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Generation Progress */}
        {isGenerating && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Generating your song...</span>
              <span>{generationProgress}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${generationProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Generation Complete */}
        {!isGenerating && generationProgress === 100 && (
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

        {!isGenerating && generationProgress < 100 && (
          <Button
            onClick={handleGenerate}
            className="bg-primary cursor-pointer"
          >
            Generate Song
          </Button>
        )}

        {generationProgress === 100 && (
          <Button className="bg-green-600 hover:bg-green-700 cursor-pointer text-white">
            Download Song
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};
