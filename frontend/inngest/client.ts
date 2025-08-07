import { Inngest } from "inngest";

// Create a client to send and receive events
export const inngest = new Inngest({
  fetch: fetch.bind(globalThis),
  id: "music-generator",
});
