
"use client";

import { useState, useEffect } from "react";
import LogoSpinner from "./LogoSpinner";

const AnimatedLoadingText = () => {
  const [dots, setDots] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => {
        if (prev.length >= 3) {
          return "";
        }
        return prev + ".";
      });
    }, 500); // Adjust speed of dot animation here

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center justify-center gap-4">
      <LogoSpinner />
      <p className="text-lg font-medium text-muted-foreground">
        thinking{dots}
      </p>
    </div>
  );
};

export default AnimatedLoadingText;
