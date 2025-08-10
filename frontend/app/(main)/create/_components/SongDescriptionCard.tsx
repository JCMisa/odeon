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

export const SongDescriptionCard: React.FC = () => {
  const {
    songDescription,
    setSongDescription,
    saveSongDescription,
    setCurrentStep,
    songData,
  } = useSongCreation();

  const handleNext = () => {
    if (songDescription.trim()) {
      saveSongDescription();
      setCurrentStep(7); // Go directly to generation (AI-full only)
    }
  };

  const handleBack = () => {
    setCurrentStep(2);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto h-[500px]">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">
          Describe your song idea
        </CardTitle>
        <CardDescription>
          AI will create both lyrics and song settings based on your description
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4 overflow-y-auto custom-scrollbar flex-1">
        <div className="space-y-2">
          <label className="text-sm font-medium">Song Description</label>
          <Textarea
            placeholder="e.g., A song about finding hope in difficult times, with a message of resilience and inner strength..."
            value={songDescription}
            onChange={(e) => setSongDescription(e.target.value)}
            className="min-h-[120px] resize-none"
          />
          <p className="text-xs text-muted-foreground">
            Be as detailed as possible to help AI create better lyrics and
            settings
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
          disabled={!songDescription.trim()}
          className="cursor-pointer"
        >
          Next
        </Button>
      </CardFooter>
    </Card>
  );
};
