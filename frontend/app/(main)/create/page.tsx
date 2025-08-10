"use client";

import { InteractiveGridPattern } from "@/components/magicui/interactive-grid-pattern";
import {
  SongCreationProvider,
  useSongCreation,
} from "@/contexts/EmotionContext";
import { cn } from "@/lib/utils";
import { EmotionSelectionCard } from "./_components/EmotionSelectionCard";
import { CreationMethodCard } from "./_components/CreationMethodCard";
import { SongDescriptionCard } from "./_components/SongDescriptionCard";
import { SettingsConfigurationCard } from "./_components/SettingsConfigurationCard";
import { SongGenerationCard } from "./_components/SongGenerationCard";

const SongCreationFlow = () => {
  const { currentStep } = useSongCreation();

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return <EmotionSelectionCard />;
      case 2:
        return <CreationMethodCard />;
      case 3:
        return <SongDescriptionCard />;
      case 6:
        return <SettingsConfigurationCard />;
      case 7:
        return <SongGenerationCard />;
      default:
        return <EmotionSelectionCard />;
    }
  };

  return (
    <div className="flex items-center justify-center h-screen w-full relative flex-col overflow-hidden">
      <InteractiveGridPattern
        className={cn(
          "[mask-image:radial-gradient(400px_circle_at_center,white,transparent)]",
          "inset-x-0 w-full h-full "
        )}
      />
      <div className="w-[60%] z-10">{renderCurrentStep()}</div>
      <InteractiveGridPattern
        className={cn(
          "[mask-image:radial-gradient(400px_circle_at_center,white,transparent)]",
          "inset-x-0 w-full h-full ml-[1rem] rotate-180"
        )}
      />
    </div>
  );
};

const CreatePage = () => {
  return (
    <SongCreationProvider>
      <SongCreationFlow />
    </SongCreationProvider>
  );
};

export default CreatePage;
