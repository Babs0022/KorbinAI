
"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles, Wand2, CheckCircle } from 'lucide-react';
import Container from '@/components/layout/Container';
import { cn } from '@/lib/utils';
import Image from 'next/image';

const benefits = [
  "Precision Prompting",
  "Model Versatility",
  "AI-Powered Insights",
  "Effortless Optimization",
];

const dynamicHeroWords = ["Intelligent", "High-Impact", "Tailored", "Contextual", "Effective", "Curated", "Optimized"];
const TYPE_SPEED = 100; // Faster typing
const DELETE_SPEED = 60; // Faster deleting
const PAUSE_DURATION = 2200; // Slightly longer pause

export function HeroSection() {
  const [currentBenefitIndex, setCurrentBenefitIndex] = useState(0);

  // State for typewriter effect
  const [dynamicWordIndex, setDynamicWordIndex] = useState(0);
  const [displayedDynamicText, setDisplayedDynamicText] = useState('');
  const [isDeletingDynamicText, setIsDeletingDynamicText] = useState(false);

  useEffect(() => {
    const benefitIntervalId = setInterval(() => {
      setCurrentBenefitIndex((prevIndex) => (prevIndex + 1) % benefits.length);
    }, 3000);
    return () => clearInterval(benefitIntervalId);
  }, []);

  useEffect(() => {
    let typingTimeout: NodeJS.Timeout;

    if (isDeletingDynamicText) {
      if (displayedDynamicText.length > 0) {
        typingTimeout = setTimeout(() => {
          setDisplayedDynamicText(prev => prev.slice(0, -1));
        }, DELETE_SPEED);
      } else {
        // Finished deleting
        setIsDeletingDynamicText(false);
        setDynamicWordIndex(prev => (prev + 1) % dynamicHeroWords.length);
      }
    } else { // Typing
      const targetWord = dynamicHeroWords[dynamicWordIndex];
      if (displayedDynamicText.length < targetWord.length) {
        typingTimeout = setTimeout(() => {
          setDisplayedDynamicText(prev => targetWord.slice(0, prev.length + 1));
        }, TYPE_SPEED);
      } else { // Word fully typed
        typingTimeout = setTimeout(() => {
          setIsDeletingDynamicText(true);
        }, PAUSE_DURATION);
      }
    }

    return () => clearTimeout(typingTimeout);
  }, [displayedDynamicText, isDeletingDynamicText, dynamicWordIndex]);


  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary via-indigo-700 to-slate-900 py-20 md:py-32">
      <div className="absolute inset-0 -z-10 opacity-10">
      </div>
      <Container className="relative z-10">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
          <div className="text-center lg:text-left">
            <div className="mb-6 inline-flex items-center rounded-full border border-mint-500/30 bg-mint-500/20 px-4 py-1.5 text-sm font-medium text-white shadow-sm backdrop-blur-sm">
              <Sparkles className="mr-2 h-4 w-4 text-mint-400" />
              The Future of AI Interaction is Here
            </div>
            <h1 className="font-headline text-4xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl">
              Unlock Peak AI Performance with{' '}
              <span 
                className="inline-block text-left text-accent" // Changed to text-accent
                style={{ minWidth: '280px' }} // Adjusted min-width for potentially longer words and visual balance
              >
                {displayedDynamicText}
                <span className="animate-blink-cursor select-none text-accent">|</span> 
              </span>
              {' '}Prompts
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg text-indigo-100 lg:mx-0 md:text-xl">
              BrieflyAI transforms your ideas into high-impact AI prompts. Craft, adapt, and analyze with our comprehensive suite of tools designed for clarity, precision, and superior results.
            </p>
            <div className="mt-8">
              <div className="font-medium text-indigo-200 mb-3">Experience:</div>
              <div className="h-7 overflow-hidden">
                {benefits.map((benefit, index) => (
                  <div
                    key={benefit}
                    className={cn(
                      "flex items-center text-mint-300 text-lg transition-all duration-500 ease-in-out",
                      index === currentBenefitIndex ? "opacity-100 translate-y-0" : "opacity-0 absolute -translate-y-full",
                      index > currentBenefitIndex && "translate-y-full" 
                    )}
                  >
                    <CheckCircle className="mr-2 h-5 w-5 text-mint-400 flex-shrink-0" />
                    {benefit}
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row lg:justify-start">
              <Button size="lg" asChild className="bg-mint-500 hover:bg-mint-600 text-primary-foreground shadow-lg transition-transform hover:scale-105">
                <Link href="/signup">
                  Get Started Free <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="shadow-lg transition-transform hover:scale-105 border-indigo-300 text-indigo-100 bg-transparent hover:bg-indigo-100/10 hover:text-white">
                <Link href="#features">
                  Discover Features
                </Link>
              </Button>
            </div>
          </div>
          <div className="relative hidden lg:block">
            <Image
              src="https://placehold.co/600x400.png"
              alt="BrieflyAI Platform Showcase"
              width={600}
              height={400}
              className="rounded-xl shadow-2xl opacity-80"
              data-ai-hint="AI interface platform"
            />
            <div className="absolute -top-8 -right-8 h-40 w-40 bg-mint-500/20 rounded-full blur-2xl animate-pulse"></div>
            <div className="absolute -bottom-8 -left-8 h-32 w-32 bg-primary/30 rounded-full blur-2xl animate-pulse animation-delay-2000"></div>
          </div>
        </div>
      </Container>
    </section>
  );
}
