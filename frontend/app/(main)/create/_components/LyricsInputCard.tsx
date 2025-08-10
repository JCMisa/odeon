"use client";

import React from "react";
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
import { Textarea } from "@/components/ui/textarea";

export const LyricsInputCard: React.FC = () => {
  const { lyrics, setLyrics, saveLyrics, setCurrentStep, songData } =
    useSongCreation();

  const handleNext = () => {
    if (lyrics.trim()) {
      saveLyrics();
      setCurrentStep(6); // Go to settings configuration
    }
  };

  const handleBack = () => {
    setCurrentStep(2);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto h-[500px]">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">Write your lyrics</CardTitle>
        <CardDescription>Enter the lyrics for your song</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4 overflow-y-auto custom-scrollbar flex-1">
        <div className="space-y-2">
          <label className="text-sm font-medium">Song Lyrics</label>
          <Textarea
            placeholder="Enter your song lyrics here...&#10;&#10;Verse 1:&#10;[Your lyrics here]&#10;&#10;Chorus:&#10;[Your lyrics here]&#10;&#10;Verse 2:&#10;[Your lyrics here]"
            value={lyrics}
            onChange={(e) => setLyrics(e.target.value)}
            className="min-h-[200px] resize-none font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground">
            You can format your lyrics with line breaks and sections
          </p>
        </div>

        {/* Preview of selected emotion */}
        {songData.emotion && (
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">Your emotion:</p>
            <p className="font-medium">{songData.emotion}</p>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          onClick={handleBack}
          className="cursor-pointer"
        >
          Back
        </Button>
        <Button
          onClick={handleNext}
          disabled={!lyrics.trim()}
          className="cursor-pointer"
        >
          Next
        </Button>
      </CardFooter>
    </Card>
  );
};
