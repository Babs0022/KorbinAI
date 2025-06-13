
"use client"; // Required for useState and useEffect

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles } from 'lucide-react';
import Container from '@/components/layout/Container';

const animatedPhrases = [
  "Flawless Prompts",
  "Perfect Prompts",
  "Optimized Prompts",
];

export function HeroSection() {
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentPhraseIndex((prevIndex) => (prevIndex + 1) % animatedPhrases.length);
    }, 3000); // Change phrase every 3 seconds

    return () => clearInterval(intervalId); // Cleanup interval on component unmount
  }, []);

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary via-indigo-800 to-slate-900 py-28 md:py-48">
      <div className="absolute inset-0 -z-10">
        {/* Subtle background pattern or gradient variation if needed */}
      </div>
      <Container className="text-center">
        <div className="mb-6 inline-flex items-center rounded-full border border-accent/30 bg-accent/20 px-4 py-1.5 text-sm font-medium text-white shadow-sm backdrop-blur-sm">
          <Sparkles className="mr-2 h-4 w-4 text-white" />
          AI-Powered Prompt Perfection
        </div>
        <h1 className="font-headline text-4xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
          Craft{' '}
          <span className="text-accent">
            <span key={currentPhraseIndex} className="fade-in inline-block">
              {animatedPhrases[currentPhraseIndex]}
            </span>
          </span>
          .
          <br />
          Unlock AI's True Potential.
        </h1>
        <p className="mx-auto mt-10 max-w-2xl text-lg text-indigo-100 md:text-xl">
          BrieflyAI helps you transform your ideas into powerful, optimized prompts.
          Stop guessing, start creating with clarity and precision.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button size="lg" asChild className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-lg transition-transform hover:scale-105">
            <Link href="/signup">
              Start Prompting Now <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild className="shadow-lg transition-transform hover:scale-105 border-indigo-300 text-indigo-100 bg-transparent hover:bg-indigo-100/10 hover:text-white">
            <Link href="#how-it-works">
              Learn How It Works
            </Link>
          </Button>
        </div>
      </Container>
    </section>
  );
}
