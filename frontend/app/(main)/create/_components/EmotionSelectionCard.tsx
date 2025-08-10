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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const emotionOptions = [
  { emoji: "😊", value: "happy", label: "Happy" },
  { emoji: "😢", value: "sad", label: "Sad" },
  { emoji: "😡", value: "angry", label: "Angry" },
  { emoji: "😰", value: "anxious", label: "Anxious" },
  { emoji: "😴", value: "tired", label: "Tired" },
  { emoji: "🤗", value: "excited", label: "Excited" },
  { emoji: "😌", value: "calm", label: "Calm" },
  { emoji: "😔", value: "melancholy", label: "Melancholy" },
  { emoji: "😤", value: "frustrated", label: "Frustrated" },
  { emoji: "🥰", value: "loved", label: "Loved" },
  { emoji: "😎", value: "confident", label: "Confident" },
  { emoji: "🤔", value: "contemplative", label: "Contemplative" },
];

export const EmotionSelectionCard: React.FC = () => {
  const {
    selectedEmotion,
    setSelectedEmotion,
    customEmotion,
    setCustomEmotion,
    saveEmotion,
    setCurrentStep,
  } = useSongCreation();
  const [showCustomInput, setShowCustomInput] = useState(false);

  const handleEmotionSelect = (emotion: string) => {
    setSelectedEmotion(emotion);
    setCustomEmotion(""); // Clear custom emotion when selecting from options
    setShowCustomInput(false);
  };

  const handleCustomInputChange = (value: string) => {
    setCustomEmotion(value);
    setSelectedEmotion(""); // Clear selected emotion when typing custom
  };

  const handleNext = () => {
    const finalEmotion = customEmotion || selectedEmotion;
    if (finalEmotion.trim()) {
      saveEmotion();
      setCurrentStep(2); // Move to creation method selection
    }
  };

  const canProceed = customEmotion.trim() || selectedEmotion;

  return (
    <Card className="w-full max-w-md mx-auto h-[500px]">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">
          How are you feeling today?
        </CardTitle>
        <CardDescription>
          Select an emotion or describe how you feel
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6 overflow-y-auto custom-scrollbar flex-1">
        {/* Emotion Options Grid */}
        <div className="grid grid-cols-4 gap-3 my-5">
          {emotionOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => handleEmotionSelect(option.value)}
              className={cn(
                "flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all duration-200 hover:scale-105",
                selectedEmotion === option.value
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/50"
              )}
            >
              <span className="text-2xl mb-1">{option.emoji}</span>
              <span className="text-xs text-muted-foreground">
                {option.label}
              </span>
            </button>
          ))}
        </div>

        {/* Custom Emotion Input */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              Or describe your emotion:
            </span>
            <button
              onClick={() => setShowCustomInput(!showCustomInput)}
              className="text-sm text-primary hover:underline"
            >
              {showCustomInput ? "Hide" : "Add custom"}
            </button>
          </div>

          {showCustomInput && (
            <Input
              placeholder="e.g., grateful, overwhelmed, peaceful..."
              value={customEmotion}
              onChange={(e) => handleCustomInputChange(e.target.value)}
              className="w-full"
            />
          )}
        </div>

        {/* Selected Emotion Display */}
        {(selectedEmotion || customEmotion) && (
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">Selected emotion:</p>
            <p className="font-medium">
              {selectedEmotion &&
                emotionOptions.find((e) => e.value === selectedEmotion)
                  ?.emoji}{" "}
              {selectedEmotion}
              {customEmotion && `"${customEmotion}"`}
            </p>
          </div>
        )}
      </CardContent>

      <CardFooter>
        <Button
          onClick={handleNext}
          disabled={!canProceed}
          className="w-full cursor-pointer"
        >
          Next
        </Button>
      </CardFooter>
    </Card>
  );
};
