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
        className={`relative w-[50px] h-[50px] flex items-center justify-center p-1 rounded-full bg-light-200 dark:bg-dark-200 duration-300 border-none outline-none hover:scale-105 transition-transform xl:hidden ${className}`}
      >
        {isDark ? (
          <MoonIcon className="size-4 text-white" />
        ) : (
          <SunIcon className="size-4 text-yellow-400" />
        )}
      </button>

      {/* Full version for larger screens */}
      <button
        type="button"
        aria-label="Toggle theme"
        onClick={() => setTheme(isDark ? "light" : "dark")}
        className={`relative w-[90px] h-[50px] items-center p-1 rounded-full bg-light-200 dark:bg-dark-200 duration-300 border-none outline-none hover:scale-105 transition-transform hidden xl:flex ${className}`}
      >
        {/* Thumb with icon */}
        <span
          className={`absolute top-1 left-1 w-[40px] h-[40px] rounded-full bg-bg-dark-100/80 shadow transition-transform duration-300 flex items-center justify-center z-10`}
          style={{
            transform: isDark ? "translateX(0)" : "translateX(32px)",
          }}
        >
          {isDark ? (
            <MoonIcon className="size-4 text-white transition-colors duration-300" />
          ) : (
            <SunIcon className="size-4 text-yellow-400 transition-colors duration-300" />
          )}
        </span>
        {/* Centered icons outside the thumb */}
        <div className="relative w-full h-full flex items-center justify-between z-0 pointer-events-none select-none">
          {/* Left icon (Moon) */}
          <div className="flex-1 flex items-center justify-center">
            {!isDark && (
              <MoonIcon className="size-4 text-gray-400 opacity-100 transition-colors duration-300" />
            )}
          </div>
          {/* Right icon (Sun) */}
          <div className="flex-1 flex items-center justify-center">
            {isDark && (
              <SunIcon className="size-4 text-gray-400 opacity-100 transition-colors duration-300" />
            )}
          </div>
        </div>
      </button>
    </>
  );
}
