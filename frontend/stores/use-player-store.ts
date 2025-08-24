import { create } from "zustand";

interface PlayerTrack {
  id: string;
  title: string | null;
  url: string | null;
  artwork: string | null;
  prompt: string | null;
  createdByUserName: string | null;
}

interface PlayerState {
  track: PlayerTrack | null;
  setTrack: (track: PlayerTrack) => void;
}

export const userPlayerStore = create<PlayerState>((set) => ({
  track: null,
  setTrack: (track) => set({ track }),
}));

// you use the setTrack of userPlayerStore in some place on your app like this:
// "userPlayerStore.setTrack(newSong)"
// the newSong you pass there is now the value of the userPlayerStore.track that you can access anywhere in your project.
// That userPlayerStore.track now has the properties in PlayerTrack interface that you can use anywhere
