"use client";

import { queueSong } from "@/actions/generation";
import { Button } from "@/components/ui/button";
import React, { useTransition } from "react";

const CreateSong = () => {
  const [isPending, startTransition] = useTransition();

  const handleCreateSong = () => {
    startTransition(async () => {
      try {
        await queueSong();
      } catch (error) {
        console.error("Failed to create song:", error);
        // Handle error appropriately - maybe show a toast
      }
    });
  };

  return (
    <Button onClick={handleCreateSong} disabled={isPending}>
      {isPending ? "Creating..." : "Create Song"}
    </Button>
  );
};

export default CreateSong;
