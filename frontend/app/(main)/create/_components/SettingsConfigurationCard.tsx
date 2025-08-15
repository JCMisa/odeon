"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
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
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

// ===== Static Data =====
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

// ===== Component =====
const SettingsConfigurationCardComponent: React.FC = () => {
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
    selectedEmotion,
    customEmotion,
  } = useSongCreation();

  const computedStyle = customEmotion.trim()
    ? customEmotion.trim()
    : emotionToMood[selectedEmotion.toLowerCase()] || selectedEmotion;

  // Local states for faster input
  const [localLyrics, setLocalLyrics] = useState(lyrics);
  const [localDescription, setLocalDescription] = useState(songDescription);
  const [customInstrument, setCustomInstrument] = useState<string>("");
  const [customEnergy, setCustomEnergy] = useState<string>("");

  // Debounce sync to context
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (localLyrics !== lyrics) setLyrics(localLyrics);
    }, 300);
    return () => clearTimeout(timeout);
  }, [localLyrics, lyrics, setLyrics]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (localDescription !== songDescription)
        setSongDescription(localDescription);
    }, 300);
    return () => clearTimeout(timeout);
  }, [localDescription, songDescription, setSongDescription]);

  // Multi-select
  const multiSelectUpdate = useCallback(
    (key: keyof typeof settings, value: string, limit: number) => {
      const current = Array.isArray(settings[key])
        ? (settings[key] as string[])
        : [];
      if (current.includes(value)) {
        updateSetting(
          key,
          current.filter((v) => v !== value)
        );
      } else if (current.length < limit) {
        updateSetting(key, [...current, value]);
      }
    },
    [settings, updateSetting]
  );

  const handleCustomInstrumentChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setCustomInstrument(value);
      if (value.includes(",")) {
        const newInstrument = value.split(",")[0].trim();
        if (newInstrument) {
          const current = Array.isArray(settings.instrument)
            ? settings.instrument
            : [];
          if (!current.includes(newInstrument) && current.length < 3) {
            updateSetting("instrument", [...current, newInstrument]);
          }
          setCustomInstrument("");
        }
      }
    },
    [settings, updateSetting]
  );

  const handleAddCustomInstrument = useCallback(() => {
    const newInstrument = customInstrument.trim();
    if (newInstrument) {
      const current = Array.isArray(settings.instrument)
        ? settings.instrument
        : [];
      if (!current.includes(newInstrument) && current.length < 3) {
        updateSetting("instrument", [...current, newInstrument]);
      }
      setCustomInstrument("");
    }
  }, [customInstrument, settings, updateSetting]);

  const handleCustomEnergyChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setCustomEnergy(value);
      if (value.includes(",")) {
        const newEnergy = value.split(",")[0].trim();
        if (newEnergy) {
          const current = Array.isArray(settings.energy) ? settings.energy : [];
          if (!current.includes(newEnergy) && current.length < 2) {
            updateSetting("energy", [...current, newEnergy]);
          }
          setCustomEnergy("");
        }
      }
    },
    [settings, updateSetting]
  );

  const handleAddCustomEnergy = useCallback(() => {
    const newEnergy = customEnergy.trim();
    if (newEnergy) {
      const current = Array.isArray(settings.energy) ? settings.energy : [];
      if (!current.includes(newEnergy) && current.length < 2) {
        updateSetting("energy", [...current, newEnergy]);
      }
      setCustomEnergy("");
    }
  }, [customEnergy, settings, updateSetting]);

  // Single-select
  const singleSelectUpdate = useCallback(
    (key: keyof typeof settings, value: string) => {
      updateSetting(key, value);
    },
    [updateSetting]
  );

  // Navigation
  const handleNext = useCallback(() => {
    saveSettings();
    if (creationMethod === "manual" && localLyrics.trim()) saveLyrics();
    if (creationMethod === "ai-lyrics" && localDescription.trim())
      saveSongDescription();
    setCurrentStep(7);
  }, [
    creationMethod,
    localLyrics,
    localDescription,
    saveLyrics,
    saveSongDescription,
    saveSettings,
    setCurrentStep,
  ]);

  const handleBack = useCallback(() => {
    setCurrentStep(2);
  }, [setCurrentStep]);

  // Render helpers
  const renderMultiSelectGroup = useCallback(
    (
      title: string,
      options: string[],
      settingKey: keyof typeof settings,
      limit = 3,
      placeholder?: string
    ) => {
      const selected = Array.isArray(settings[settingKey])
        ? (settings[settingKey] as string[])
        : [];

      const isCustomSection =
        settingKey === "instrument" || settingKey === "energy";

      const renderTag = (option: string) => {
        const isSelected = selected.includes(option);
        const isPredefined = options.includes(option);
        const isDisabled = !isSelected && selected.length >= limit;

        return (
          <button
            key={option}
            type="button"
            onClick={() => multiSelectUpdate(settingKey, option, limit)}
            disabled={isDisabled}
            className={cn(
              "flex items-center gap-1 p-2 text-sm rounded border transition-all",
              isSelected
                ? "border-primary bg-primary/10 text-primary"
                : isDisabled
                  ? "border-border bg-muted text-muted-foreground cursor-not-allowed"
                  : "border-border hover:border-primary/50"
            )}
          >
            {option}
            {isSelected && !isPredefined && (
              <span className="text-xs ml-1 opacity-50">✕</span>
            )}
          </button>
        );
      };

      return (
        <div className="space-y-2">
          <label className="text-sm font-medium">
            {title} {limit > 1 && `(max ${limit})`}
          </label>
          <div className="grid grid-cols-2 gap-2">{options.map(renderTag)}</div>

          {isCustomSection && (
            <>
              {/* Display selected custom instruments */}
              <div className="flex flex-wrap gap-2 my-2">
                {selected
                  .filter((item) => !options.includes(item))
                  .map((item) => (
                    <Button
                      key={item}
                      variant={"outline"}
                      size={"sm"}
                      onClick={() => multiSelectUpdate(settingKey, item, limit)}
                    >
                      {item} <span className="ml-2 text-xs opacity-50">✕</span>
                    </Button>
                  ))}
              </div>

              {/* Custom Input */}
              <div className="mt-4 flex items-center gap-2">
                <Input
                  placeholder={`Add custom ${settingKey}...`}
                  value={
                    settingKey === "instrument"
                      ? customInstrument
                      : customEnergy
                  }
                  onChange={
                    settingKey === "instrument"
                      ? handleCustomInstrumentChange
                      : handleCustomEnergyChange
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (settingKey === "instrument") {
                        handleAddCustomInstrument();
                      } else {
                        handleAddCustomEnergy();
                      }
                    }
                  }}
                />
                <Button
                  type="button"
                  onClick={() => {
                    if (settingKey === "instrument") {
                      handleAddCustomInstrument();
                    } else {
                      handleAddCustomEnergy();
                    }
                  }}
                  disabled={
                    (settingKey === "instrument" && !customInstrument.trim()) ||
                    (settingKey === "energy" && !customEnergy.trim()) ||
                    selected.length >= limit
                  }
                >
                  Add
                </Button>
              </div>
            </>
          )}

          {placeholder && !isCustomSection && (
            <Input
              placeholder={placeholder}
              value={selected.join(", ")}
              readOnly
              className="mt-2"
            />
          )}
        </div>
      );
    },
    [
      settings,
      multiSelectUpdate,
      customInstrument,
      customEnergy,
      handleAddCustomInstrument,
      handleCustomInstrumentChange,
      handleAddCustomEnergy,
      handleCustomEnergyChange,
    ]
  );

  const renderSingleSelectGroup = useCallback(
    (
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
              type="button"
              onClick={() => singleSelectUpdate(settingKey, option)}
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
            value={(settings[settingKey] as string) || ""}
            onChange={(e) => singleSelectUpdate(settingKey, e.target.value)}
            className="mt-2"
          />
        )}
      </div>
    ),
    [settings, singleSelectUpdate]
  );

  // Button state
  const canProceed = useMemo(() => {
    if (creationMethod === "manual")
      return localLyrics.trim() && Object.keys(settings).length > 0;
    if (creationMethod === "ai-lyrics")
      return localDescription.trim() && Object.keys(settings).length > 0;
    return Object.keys(settings).length > 0;
  }, [creationMethod, localLyrics, localDescription, settings]);

  // UI
  return (
    <Card className="w-full max-w-6xl mx-auto h-[600px] flex flex-col">
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
      <CardContent className="flex-1 flex gap-8 overflow-y-auto custom-scrollbar">
        {/* Left: Settings */}
        <div className="w-full max-w-[420px]">
          <Accordion type="multiple" defaultValue={["genre"]}>
            <AccordionItem value="genre">
              <AccordionTrigger>Genre(s)</AccordionTrigger>
              <AccordionContent>
                {renderMultiSelectGroup(
                  "Genre(s)",
                  genreOptions,
                  "genre",
                  2,
                  "Or enter custom genre"
                )}
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="voice">
              <AccordionTrigger>Voice Type</AccordionTrigger>
              <AccordionContent>
                {renderSingleSelectGroup(
                  "Voice Type",
                  voiceOptions,
                  "voice",
                  "Or enter custom voice"
                )}
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="mood">
              <AccordionTrigger>
                Mood (auto-filled from emotion)
              </AccordionTrigger>
              <AccordionContent>
                <Input value={computedStyle} readOnly className="mt-2" />
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="tempo">
              <AccordionTrigger>Tempo</AccordionTrigger>
              <AccordionContent>
                {renderSingleSelectGroup("Tempo", tempoOptions, "tempo")}
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="key">
              <AccordionTrigger>Musical Key</AccordionTrigger>
              <AccordionContent>
                {renderSingleSelectGroup("Musical Key", keyOptions, "key")}
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="instrument">
              <AccordionTrigger>Instrument(s)</AccordionTrigger>
              <AccordionContent>
                {renderMultiSelectGroup(
                  "Instrument(s)",
                  instrumentOptions,
                  "instrument",
                  3
                )}
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="energy">
              <AccordionTrigger>Energy</AccordionTrigger>
              <AccordionContent>
                {renderMultiSelectGroup("Energy", energyOptions, "energy", 2)}
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="atmosphere">
              <AccordionTrigger>Atmosphere</AccordionTrigger>
              <AccordionContent>
                {renderMultiSelectGroup(
                  "Atmosphere",
                  atmosphereOptions,
                  "atmosphere",
                  2
                )}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        {/* Right: Inputs */}
        <div className="flex-1 flex flex-col gap-6">
          {creationMethod === "ai-lyrics" && (
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Describe your lyrics
              </label>
              <Textarea
                placeholder="Describe the lyrics you want AI to generate..."
                value={localDescription}
                onChange={(e) => setLocalDescription(e.target.value)}
                className="min-h-[180px] resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Be as detailed as possible to help AI create better lyrics
              </p>
            </div>
          )}
          {creationMethod === "manual" && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Your Lyrics</label>
              <Textarea
                placeholder="Enter your song lyrics here..."
                value={localLyrics}
                onChange={(e) => setLocalLyrics(e.target.value)}
                className="min-h-[180px] resize-none font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                You can format your lyrics with line breaks and sections
              </p>
            </div>
          )}
          {/* Summary */}
          <div className="p-4 bg-muted rounded-lg space-y-2 mt-4">
            <h3 className="font-medium">Current Song Data:</h3>
            <div className="flex flex-col gap-4 text-sm">
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
          disabled={!canProceed}
          className="cursor-pointer"
        >
          Review Song
        </Button>
      </CardFooter>
    </Card>
  );
};

SettingsConfigurationCardComponent.displayName = "SettingsConfigurationCard";

export const SettingsConfigurationCard = React.memo(
  SettingsConfigurationCardComponent
);
