
"use client";

import LogoSpinner from "./LogoSpinner";

const AnimatedLoadingText = () => {
  return (
    <div className="flex flex-col items-center justify-center gap-6">
        <LogoSpinner />
        <p className="text-xl font-medium text-muted-foreground animate-pulse">
            Briefly is thinking...
        </p>
    </div>
  );
};

export default AnimatedLoadingText;
