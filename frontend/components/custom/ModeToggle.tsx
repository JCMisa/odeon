"use client";

import * as React from "react";
import { MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";

export default function ModeToggle({ className = "" }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const isDark = theme === "dark";

  return (
    <>
      {/* Compact version for smaller screens */}
      <button
        type="button"
        aria-label="Toggle theme"
        onClick={() => setTheme(isDark ? "light" : "dark")}
        className={`relative w-6 h-6 flex items-center justify-center p-1 rounded-full bg-neutral-200 dark:bg-neutral-800  border-none outline-none  ${className}`}
      >
        {isDark ? (
          <MoonIcon className="size-3 text-white" />
        ) : (
          <SunIcon className="size-3 text-yellow-500" />
        )}
      </button>
    </>
  );
}
