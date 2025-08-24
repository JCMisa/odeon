"use client";

import React, { useState } from "react";
import { Track } from "./TrackList";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { LoaderCircleIcon, PencilIcon } from "lucide-react";
import { renameSong } from "@/actions/song";

const RenameDialog = ({ track }: { track: Track }) => {
  const [title, setTitle] = useState(track.title ?? "");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    await submitRename();
  };

  const submitRename = async () => {
    setLoading(true);
    try {
      if (title.trim()) {
        const result = await renameSong(track.id, title.trim());

        if (result && result.success) {
          toast.success("Song title renamed successfully");
        }
      }
    } catch (error) {
      console.log("rename song error: ", error);
      toast.error("Failed to update song title");
    } finally {
      setLoading(false);
    }
  };

  const handleEnterKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      submitRename();
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger className="w-full">
        <div className="flex items-center gap-2 p-2 w-full rounded-sm hover:bg-neutral-400/80 dark:hover:bg-neutral-500/20 transition-all">
          <PencilIcon className="size-5 mr-1 text-muted-foreground" />
          <p className="text-sm">Rename</p>
        </div>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Rename Song</AlertDialogTitle>
          <AlertDialogDescription>
            Enter a new name for your song. Click save when you&apos;re done.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="flex flex-col gap-2 py-4">
          <Label htmlFor="name" className="text-right">
            Title
          </Label>
          <Input
            id="name"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="col-span-3"
            onKeyDown={handleEnterKey}
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading} className="cursor-pointer">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleSubmit}
            disabled={loading}
            className="cursor-pointer"
          >
            {loading ? (
              <LoaderCircleIcon className="size-5 animate-spin" />
            ) : (
              "Save Changes"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default RenameDialog;
