"use client";

import React, { useCallback, useEffect, useState } from "react";
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

  // Local state for fast typing
  const [localDescription, setLocalDescription] = useState(songDescription);

  // Debounce global state updates
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (localDescription !== songDescription) {
        setSongDescription(localDescription);
      }
    }, 300); // Adjust delay for responsiveness

    return () => clearTimeout(timeout);
  }, [localDescription, setSongDescription, songDescription]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setLocalDescription(e.target.value);
    },
    []
  );

  const handleNext = useCallback(() => {
    if (localDescription.trim()) {
      saveSongDescription();
      setCurrentStep(7);
    }
  }, [localDescription, saveSongDescription, setCurrentStep]);

  const handleBack = useCallback(() => {
    setCurrentStep(2);
  }, [setCurrentStep]);

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
            placeholder="e.g., A song about finding hope in difficult times..."
            value={localDescription}
            onChange={handleChange}
            className="min-h-[120px] resize-none"
          />
          <p className="text-xs text-muted-foreground">
            Be as detailed as possible to help AI create better lyrics and
            settings
          </p>
        </div>

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
          disabled={!localDescription.trim()}
          className="cursor-pointer"
        >
          Review Song
        </Button>
      </CardFooter>
    </Card>
  );
};
