"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

export type CreationMethod = "ai-full" | "ai-lyrics" | "manual";

export interface SongSettings {
  genre?: string;
  voice?: string;
  style?: string;
  key?: string;
  tempo?: string;
  instrument?: string;
  energy?: string;
  atmosphere?: string;
}

export interface SongCreationData {
  emotion: string;
  creationMethod: CreationMethod;
  songDescription?: string;
  lyrics?: string;
  settings: SongSettings;
}

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

interface SongCreationContextType {
  // Current step management
  currentStep: number;
  setCurrentStep: (step: number) => void;

  // Emotion data
  selectedEmotion: string;
  setSelectedEmotion: (emotion: string) => void;
  customEmotion: string;
  setCustomEmotion: (emotion: string) => void;

  // Creation method
  creationMethod: CreationMethod;
  setCreationMethod: (method: CreationMethod) => void;

  // Song description (for AI generation)
  songDescription: string;
  setSongDescription: (description: string) => void;

  // Lyrics
  lyrics: string;
  setLyrics: (lyrics: string) => void;

  // Settings
  settings: SongSettings;
  setSettings: (settings: SongSettings) => void;
  updateSetting: (key: keyof SongSettings, value: string) => void;

  // Save and navigation
  saveEmotion: () => void;
  saveCreationMethod: () => void;
  saveSongDescription: () => void;
  saveLyrics: () => void;
  saveSettings: () => void;

  // Final data
  songData: SongCreationData;

  // Reset
  resetData: () => void;
}

const SongCreationContext = createContext<SongCreationContextType | undefined>(
  undefined
);

export const useSongCreation = () => {
  const context = useContext(SongCreationContext);
  if (context === undefined) {
    throw new Error(
      "useSongCreation must be used within a SongCreationProvider"
    );
  }
  return context;
};

interface SongCreationProviderProps {
  children: ReactNode;
}

export const SongCreationProvider: React.FC<SongCreationProviderProps> = ({
  children,
}) => {
  const [currentStep, setCurrentStep] = useState(1);

  // Emotion data
  const [selectedEmotion, setSelectedEmotion] = useState<string>("");
  const [customEmotion, setCustomEmotion] = useState<string>("");
  const [savedEmotion, setSavedEmotion] = useState<string>("");

  // Creation method
  const [creationMethod, setCreationMethod] =
    useState<CreationMethod>("ai-full");

  // Song description
  const [songDescription, setSongDescription] = useState<string>("");
  const [savedSongDescription, setSavedSongDescription] = useState<string>("");

  // Lyrics
  const [lyrics, setLyrics] = useState<string>("");
  const [savedLyrics, setSavedLyrics] = useState<string>("");

  // Settings
  const [settings, setSettings] = useState<SongSettings>({});
  const [savedSettings, setSavedSettings] = useState<SongSettings>({});

  const saveEmotion = () => {
    const finalEmotion = customEmotion || selectedEmotion;
    setSavedEmotion(finalEmotion);
  };

  const saveCreationMethod = () => {
    // Method is already saved in state
  };

  const saveSongDescription = () => {
    setSavedSongDescription(songDescription);
  };

  const saveLyrics = () => {
    setSavedLyrics(lyrics);
  };

  const saveSettings = () => {
    setSavedSettings(settings);
  };

  const updateSetting = (key: keyof SongSettings, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const resetData = () => {
    setCurrentStep(1);
    setSelectedEmotion("");
    setCustomEmotion("");
    setSavedEmotion("");
    setCreationMethod("ai-full");
    setSongDescription("");
    setSavedSongDescription("");
    setLyrics("");
    setSavedLyrics("");
    setSettings({});
    setSavedSettings({});
  };

  const songData: SongCreationData = {
    emotion: savedEmotion,
    creationMethod,
    songDescription: savedSongDescription,
    lyrics: savedLyrics,
    settings: savedSettings,
  };

  return (
    <SongCreationContext.Provider
      value={{
        currentStep,
        setCurrentStep,
        selectedEmotion,
        setSelectedEmotion,
        customEmotion,
        setCustomEmotion,
        creationMethod,
        setCreationMethod,
        songDescription,
        setSongDescription,
        lyrics,
        setLyrics,
        settings,
        setSettings,
        updateSetting,
        saveEmotion,
        saveCreationMethod,
        saveSongDescription,
        saveLyrics,
        saveSettings,
        songData,
        resetData,
      }}
    >
      {children}
    </SongCreationContext.Provider>
  );
};
