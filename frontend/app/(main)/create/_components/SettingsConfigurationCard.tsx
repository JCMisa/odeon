"use client";

import React, { useEffect } from "react";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

// Emotion to mood mapping
const emotionToMood: Record<string, string> = {
  happy: "uplifting",
  sad: "melancholic",
  angry: "aggressive",
  anxious: "tense",
  tired: "calm",
  excited: "energetic",
  calm: "peaceful",
  melancholy: "melancholic",
  frustrated: "aggressive",
  loved: "romantic",
  confident: "empowering",
  contemplative: "introspective",
};

const genreOptions = [
  "melodic techno",
  "hip-hop",
  "rock",
  "pop",
  "jazz",
  "blues",
  "country",
  "electronic",
  "R&B",
  "folk",
  "classical",
  "reggae",
  "punk",
  "metal",
  "indie",
];

const voiceOptions = [
  "male vocal",
  "female vocal",
  "androgynous vocal",
  "child vocal",
  "elderly vocal",
  "robotic vocal",
  "whisper vocal",
];

const styleOptions = [
  "emotional",
  "driving",
  "atmospheric",
  "energetic",
  "calm",
  "aggressive",
  "romantic",
  "mysterious",
  "uplifting",
  "dark",
  "playful",
  "serious",
];

const tempoOptions = [
  "60 bpm",
  "80 bpm",
  "100 bpm",
  "120 bpm",
  "140 bpm",
  "160 bpm",
  "180 bpm",
];

const keyOptions = [
  "major key",
  "minor key",
  "C major",
  "G major",
  "D major",
  "A major",
  "E major",
  "B major",
  "F# major",
  "C minor",
  "G minor",
  "D minor",
  "A minor",
  "E minor",
  "B minor",
  "F minor",
];

const instrumentOptions = [
  "synthesizer",
  "piano",
  "guitar",
  "drums",
  "bass",
  "strings",
  "brass",
  "woodwinds",
  "electronic",
  "acoustic",
];

const energyOptions = [
  "driving",
  "energetic",
  "calm",
  "relaxed",
  "intense",
  "powerful",
  "gentle",
];

const atmosphereOptions = [
  "atmospheric",
  "ethereal",
  "mysterious",
  "warm",
  "cold",
  "spacey",
  "intimate",
  "epic",
];

export const SettingsConfigurationCard: React.FC = () => {
  const {
    settings,
    updateSetting,
    saveSettings,
    setCurrentStep,
    creationMethod,
    songData,
    lyrics,
    setLyrics,
    saveLyrics,
    songDescription,
    setSongDescription,
    saveSongDescription,
  } = useSongCreation();

  // Auto-fill mood based on emotion
  useEffect(() => {
    if (songData.emotion && !settings.style) {
      const mood = emotionToMood[songData.emotion.toLowerCase()] || "emotional";
      updateSetting("style", mood);
    }
  }, [songData.emotion, settings.style, updateSetting]);

  const handleNext = () => {
    saveSettings();

    // Save lyrics if in manual mode
    if (creationMethod === "manual" && lyrics.trim()) {
      saveLyrics();
    }

    // Save song description if in AI-lyrics mode
    if (creationMethod === "ai-lyrics" && songDescription.trim()) {
      saveSongDescription();
    }

    setCurrentStep(7); // Go to final review/generation
  };

  const handleBack = () => {
    setCurrentStep(2); // Back to creation method selection
  };

  const renderOptionGroup = (
    title: string,
    options: string[],
    settingKey: keyof typeof settings,
    placeholder?: string
  ) => (
    <div className="space-y-2">
      <label className="text-sm font-medium">{title}</label>
      <div className="grid grid-cols-2 gap-2">
        {options.map((option) => (
          <button
            key={option}
            onClick={() => updateSetting(settingKey, option)}
            className={cn(
              "p-2 text-sm rounded border transition-all",
              settings[settingKey] === option
                ? "border-primary bg-primary/10 text-primary"
                : "border-border hover:border-primary/50"
            )}
          >
            {option}
          </button>
        ))}
      </div>
      {placeholder && (
        <Input
          placeholder={placeholder}
          value={settings[settingKey] || ""}
          onChange={(e) => updateSetting(settingKey, e.target.value)}
          className="mt-2"
        />
      )}
    </div>
  );

  const canProceed = () => {
    if (creationMethod === "manual") {
      return lyrics.trim() && Object.keys(settings).length > 0;
    } else if (creationMethod === "ai-lyrics") {
      return songDescription.trim() && Object.keys(settings).length > 0;
    }
    return Object.keys(settings).length > 0;
  };

  return (
    <Card className="w-full max-w-4xl mx-auto h-[500px] flex flex-col">
      <CardHeader className="text-center flex-shrink-0">
        <CardTitle className="text-2xl font-bold">
          Configure Song Settings
        </CardTitle>
        <CardDescription>
          Choose the musical settings for your song
          {creationMethod === "manual" && " and provide your lyrics"}
          {creationMethod === "ai-lyrics" && " and describe your lyrics"}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6 overflow-y-auto custom-scrollbar flex-1">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {renderOptionGroup(
            "Genre",
            genreOptions,
            "genre",
            "Or enter custom genre"
          )}
          {renderOptionGroup(
            "Voice Type",
            voiceOptions,
            "voice",
            "Or enter custom voice"
          )}
          {renderOptionGroup(
            "Style",
            styleOptions,
            "style",
            "Or enter custom style"
          )}
          {renderOptionGroup("Tempo", tempoOptions, "tempo")}
          {renderOptionGroup("Musical Key", keyOptions, "key")}
          {renderOptionGroup("Instrument", instrumentOptions, "instrument")}
          {renderOptionGroup("Energy", energyOptions, "energy")}
          {renderOptionGroup("Atmosphere", atmosphereOptions, "atmosphere")}
        </div>

        {/* Lyrics Description for AI-lyrics mode */}
        {creationMethod === "ai-lyrics" && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Describe your lyrics</label>
            <Textarea
              placeholder="Describe the lyrics you want AI to generate... e.g., A song about finding hope in difficult times, with a message of resilience and inner strength..."
              value={songDescription}
              onChange={(e) => setSongDescription(e.target.value)}
              className="min-h-[100px] resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Be as detailed as possible to help AI create better lyrics
            </p>
          </div>
        )}

        {/* Lyrics Input for Manual mode */}
        {creationMethod === "manual" && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Your Lyrics</label>
            <Textarea
              placeholder="Enter your song lyrics here...&#10;&#10;Verse 1:&#10;[Your lyrics here]&#10;&#10;Chorus:&#10;[Your lyrics here]&#10;&#10;Verse 2:&#10;[Your lyrics here]"
              value={lyrics}
              onChange={(e) => setLyrics(e.target.value)}
              className="min-h-[150px] resize-none font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              You can format your lyrics with line breaks and sections
            </p>
          </div>
        )}

        {/* Summary of current data */}
        <div className="p-4 bg-muted rounded-lg space-y-2">
          <h3 className="font-medium">Current Song Data:</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Emotion:</span>{" "}
              {songData.emotion}
            </div>
            <div>
              <span className="text-muted-foreground">Creation Method:</span>{" "}
              {creationMethod}
            </div>
            {songData.songDescription && (
              <div className="col-span-2">
                <span className="text-muted-foreground">Description:</span>{" "}
                {songData.songDescription.substring(0, 100)}...
              </div>
            )}
            {songData.lyrics && (
              <div className="col-span-2">
                <span className="text-muted-foreground">Lyrics:</span>{" "}
                {songData.lyrics.substring(0, 100)}...
              </div>
            )}
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex justify-between flex-shrink-0">
        <Button
          variant="outline"
          onClick={handleBack}
          className="cursor-pointer"
        >
          Back
        </Button>
        <Button
          onClick={handleNext}
          disabled={!canProceed()}
          className="cursor-pointer"
        >
          Generate Song
        </Button>
      </CardFooter>
    </Card>
  );
};
