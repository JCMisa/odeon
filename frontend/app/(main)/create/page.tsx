"use client";

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
import Image from "next/image";
import { DotPattern } from "@/components/magicui/dot-pattern";

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
    <div className="flex items-center justify-center h-screen w-full flex-col overflow-hidden relative">
      <DotPattern
        width={20}
        height={20}
        cx={1}
        cy={1}
        cr={1}
        className={cn(
          "[mask-image:linear-gradient(to_bottom_right,white,transparent,transparent)] "
        )}
      />

      {/* center headset image */}
      <Image
        src={"/icon-1.png"}
        alt="icon1"
        width={900}
        height={900}
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-50 z-0"
      />
      {/* center headset image */}

      {/* floating images */}
      <Image
        src={"/icon-2.png"}
        alt="icon1"
        width={100}
        height={100}
        className="absolute top-20 left-32 z-0 animate-customBounce"
        style={{
          animation: "customBounce 2s ease-in-out infinite",
          animationDelay: "0s",
        }}
      />

      <Image
        src={"/icon-3.png"}
        alt="icon1"
        width={150}
        height={150}
        className="absolute top-80 right-32 z-0 animate-customBounce"
        style={{
          animation: "customBounce 2.2s ease-in-out infinite",
          animationDelay: "0.3s",
        }}
      />

      <Image
        src={"/icon-4.png"}
        alt="icon1"
        width={80}
        height={80}
        className="absolute bottom-40 left-52 z-0 animate-customBounce"
        style={{
          animation: "customBounce 2.4s ease-in-out infinite",
          animationDelay: "0.6s",
        }}
      />
      {/* floating images */}

      {/* cards */}
      <div className="w-[60%] z-10">{renderCurrentStep()}</div>
      {/* cards */}

      <DotPattern
        width={20}
        height={20}
        cx={1}
        cy={1}
        cr={1}
        className={cn(
          "[mask-image:linear-gradient(to_top_left,white,transparent,transparent)] "
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
