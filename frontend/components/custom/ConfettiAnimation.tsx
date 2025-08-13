"use client";

import { DotLottieReact } from "@lottiefiles/dotlottie-react";

export const ConfettiAnimation: React.FC<{ show: boolean }> = ({ show }) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
      <DotLottieReact
        src="/Confetti.lottie" // put this file in public/
        loop={false}
        autoplay
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
};
