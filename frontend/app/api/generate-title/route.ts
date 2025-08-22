import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { source } = await req.json();

  if (!source || typeof source !== "string") {
    return NextResponse.json(
      {
        error:
          "Source from where to generate the title is required and must be a string",
      },
      { status: 400 }
    );
  }

  try {
    const { text: response } = await generateText({
      model: google("gemini-2.0-flash-001"),
      prompt: `
        Generate the single most beautiful, unique, and relevant song title based on the following text. The text provided will be a song description, a description of the lyrics, or the lyrics themselves. Return ONLY the title as a plain string, with no additional formatting, quotation marks, or explanations.
      
        text:
        ${source}
      `,
      temperature: 0.3,
      topP: 0.8,
      topK: 40,
      frequencyPenalty: 0.1,
      presencePenalty: 0.1,
    });

    if (!response) {
      return NextResponse.json(
        { error: "No response from AI model" },
        { status: 500 }
      );
    }

    // The AI now returns a plain string.
    // We create an object with the title for consistency, but the
    // value is the raw string response.
    return NextResponse.json({ title: response.trim() }, { status: 200 });
  } catch (error) {
    console.error("AI API Error:", error);
    return NextResponse.json(
      {
        error: "Failed to process request",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
