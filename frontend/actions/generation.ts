"use server";

import { db } from "@/config/db";
import { song } from "@/config/schema";
import { inngest } from "@/inngest/client";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export interface GenerateRequest {
  prompt?: string;
  lyrics?: string;
  fullDescribedSong?: string;
  describedLyrics?: string;
  instrumental?: boolean;
  requiredCredits: number;
}

// will help to revalidate multiple paths after a certain function was done
const revalidatePaths = (paths: string[]) => {
  paths.forEach((path) => revalidatePath(path));
};

export const generateSong = async (generateRequest: GenerateRequest) => {
  try {
    // check if authenticated
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session) {
      redirect("/auth/sign-in");
    }

    const result = await queueSong(generateRequest, 7.5, session.user.id);
    // const result2 = await queueSong(generateRequest, 15, session.user.id);
    if (result.success) {
      return { success: true, songId: result.songId };
    }
    revalidatePaths(["/", "/create"]);
  } catch (error) {
    console.error("Error in generateSong:", error);
    throw new Error("Failed to generate song");
  }
};

export const queueSong = async (
  generateRequest: GenerateRequest,
  guidanceScale: number,
  userId: string
) => {
  try {
    // set what would be the title is based on the available inputs
    let title = "Untitled";
    if (generateRequest.describedLyrics)
      title = generateRequest.describedLyrics;
    if (generateRequest.fullDescribedSong)
      title = generateRequest.fullDescribedSong;

    // make the first letter of the title uppercase
    title = title.charAt(0).toUpperCase() + title.slice(1);

    const [insertedSong] = await db
      .insert(song)
      .values({
        userId: userId,
        title: title,
        prompt: generateRequest.prompt,
        lyrics: generateRequest.lyrics,
        describedLyrics: generateRequest.describedLyrics,
        fullDescribedSong: generateRequest.fullDescribedSong,
        instrumental: generateRequest.instrumental,
        guidanceScale: guidanceScale,
        audioDuration: 180,
      })
      .returning({
        id: song.id,
        userId: song.userId,
      });

    // Send to Inngest
    const result = await inngest.send({
      name: "generate-song-event",
      data: {
        songId: insertedSong.id,
        userId: insertedSong.userId,
        requiredCredits: generateRequest.requiredCredits,
      },
    });

    console.log("Inngest event sent:", result);

    return { success: true, songId: insertedSong.id };
  } catch (error) {
    console.error("Error in queueSong:", error);
    throw new Error("Failed to queue song");
  }
};

export const getPresignedUrl = async (key: string) => {
  try {
    const s3Client = new S3Client({
      region: process.env.AWS_REGION!,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY_ID!,
      },
    });

    const command = new GetObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME!,
      Key: key,
    });

    return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
  } catch (error) {
    console.error("Error in getPresignedUrl:", error);
    throw new Error("Failed to get presigned URL");
  }
};
