"use client";

import { useState, useEffect } from 'react';

const baseText = "Briefly is thinking";
const phases = ["", ".", "..", "..."];

const AnimatedLoadingText = () => {
  const [phaseIndex, setPhaseIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPhaseIndex((prevIndex) => (prevIndex + 1) % phases.length);
    }, 400); // Controls the speed of the dots appearing

    return () => clearInterval(interval);
  }, []);

  return (
    <p className="text-xl font-medium text-muted-foreground">
      {baseText}{phases[phaseIndex]}
    </p>
  );
};

export default AnimatedLoadingText;
