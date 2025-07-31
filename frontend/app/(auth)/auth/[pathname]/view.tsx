"use client";

import ModeToggle from "@/components/custom/ModeToggle";
import { AuthCard } from "@daveyplate/better-auth-ui";

export function AuthView({ pathname }: { pathname: string }) {
  return (
    <main className="container flex grow flex-col items-center justify-center gap-3 self-center p-4 md:p-6 relative">
      <div className="absolute top-3 right-3">
        <ModeToggle />
      </div>
      <AuthCard pathname={pathname} />
    </main>
  );
}
