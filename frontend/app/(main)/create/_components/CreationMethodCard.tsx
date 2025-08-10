"use client";

import React from "react";
import { useSongCreation, CreationMethod } from "@/contexts/EmotionContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const creationMethods = [
  {
    id: "ai-full" as CreationMethod,
    title: "AI Full Creation",
    description:
      "Let AI create both lyrics and song settings based on your description",
    icon: "🤖",
    details:
      "AI will generate lyrics and configure settings like genre, mood, voice, etc.",
  },
  {
    id: "ai-lyrics" as CreationMethod,
    title: "AI Lyrics Only",
    description: "AI generates lyrics, you configure song settings",
    icon: "✍️",
    details:
      "AI creates lyrics from your description, you choose genre, voice, etc.",
  },
  {
    id: "manual" as CreationMethod,
    title: "Manual Creation",
    description: "You provide lyrics and configure all settings",
    icon: "🎵",
    details: "You write lyrics and configure all song settings manually",
  },
];

export const CreationMethodCard: React.FC = () => {
  const {
    creationMethod,
    setCreationMethod,
    saveCreationMethod,
    setCurrentStep,
  } = useSongCreation();

  const handleMethodSelect = (method: CreationMethod) => {
    setCreationMethod(method);
  };

  const handleNext = () => {
    saveCreationMethod();

    // Determine next step based on selected method
    switch (creationMethod) {
      case "ai-full":
        setCurrentStep(3); // Go to song description input
        break;
      case "ai-lyrics":
        setCurrentStep(6); // Go directly to settings configuration
        break;
      case "manual":
        setCurrentStep(6); // Go directly to settings configuration
        break;
    }
  };

  const handleBack = () => {
    setCurrentStep(1);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto h-[500px]">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">
          How would you like to create your song?
        </CardTitle>
        <CardDescription>
          Choose your preferred approach for song creation
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4 overflow-y-auto custom-scrollbar flex-1">
        {creationMethods.map((method) => (
          <button
            key={method.id}
            onClick={() => handleMethodSelect(method.id)}
            className={cn(
              "w-full p-4 rounded-lg border-2 transition-all duration-200 hover:scale-[1.02] text-left mt-2",
              creationMethod === method.id
                ? "border-primary bg-primary/10"
                : "border-border hover:border-primary/50"
            )}
          >
            <div className="flex items-start space-x-4">
              <span className="text-3xl">{method.icon}</span>
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-1">{method.title}</h3>
                <p className="text-muted-foreground mb-2">
                  {method.description}
                </p>
                <p className="text-sm text-muted-foreground">
                  {method.details}
                </p>
              </div>
            </div>
          </button>
        ))}
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
          disabled={!creationMethod}
          className="cursor-pointer"
        >
          Next
        </Button>
      </CardFooter>
    </Card>
  );
};
