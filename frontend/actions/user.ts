"use server";

import { db } from "@/config/db";
import { user } from "@/config/schema";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { cache } from "react";

export const getCurrentUser = cache(async () => {
  try {
    // Get session with proper error handling
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return {
        success: false,
        error: "NO_SESSION",
        redirect: "/auth/sign-in",
      };
    }

    // Fetch user data with optimized query
    const [userData] = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified,
        image: user.image,
        credits: user.credits,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      })
      .from(user)
      .where(eq(user.id, session.user.id))
      .limit(1);

    if (!userData) {
      return {
        success: false,
        error: "USER_NOT_FOUND",
      };
    }

    return {
      success: true,
      data: userData,
    };
  } catch (error) {
    console.error("Error fetching user data:", {
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    });

    return {
      success: false,
      error: "SERVER_ERROR",
    };
  }
});
