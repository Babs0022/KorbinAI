
"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles, Wand2, CheckCircle, Loader2 } from 'lucide-react';
import Container from '@/components/layout/Container';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

const benefits = [
  "Precision Prompting",
  "Model Versatility",
  "AI-Powered Insights",
  "Effortless Optimization",
];

const dynamicHeroWords = ["Intelligent", "High-Impact", "Tailored", "Contextual", "Effective", "Curated", "Optimized"];
const TYPE_SPEED = 80;
const DELETE_SPEED = 50;
const PAUSE_DURATION = 2000; // Slightly shorter pause

export function HeroSection() {
  const [currentBenefitIndex, setCurrentBenefitIndex] = useState(0);
  const [dynamicWordIndex, setDynamicWordIndex] = useState(0);
  const [displayedDynamicText, setDisplayedDynamicText] = useState('');
  const [isDeletingDynamicText, setIsDeletingDynamicText] = useState(false);
  const { currentUser, loading: authLoading } = useAuth();

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
        setIsDeletingDynamicText(false);
        setDynamicWordIndex(prev => (prev + 1) % dynamicHeroWords.length);
      }
    } else { 
      const targetWord = dynamicHeroWords[dynamicWordIndex];
      if (displayedDynamicText.length < targetWord.length) {
        typingTimeout = setTimeout(() => {
          setDisplayedDynamicText(prev => targetWord.slice(0, prev.length + 1));
        }, TYPE_SPEED);
      } else { 
        typingTimeout = setTimeout(() => {
          setIsDeletingDynamicText(true);
        }, PAUSE_DURATION);
      }
    }

    return () => clearTimeout(typingTimeout);
  }, [displayedDynamicText, isDeletingDynamicText, dynamicWordIndex]);

  const getStartedHref = authLoading ? "#" : currentUser ? "/dashboard" : "/signup";

  return (
    <section className="hero-background relative overflow-hidden py-20 md:py-32">
      <Container className="relative z-10">
        <div className="grid grid-cols-1 items-center gap-12">
          <div className="text-center">
            <div className="mb-6 inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary shadow-sm backdrop-blur-sm">
              <Sparkles className="mr-2 h-4 w-4 text-primary" />
              The Future of AI Interaction is Here
            </div>
            <h1 className="font-headline text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl md:text-6xl">
              Unlock Peak AI Performance with{' '}
              <span 
                className="inline-block text-left text-accent"
                style={{ minWidth: '280px' }} 
              >
                {displayedDynamicText}
                <span className="animate-blink-cursor select-none text-accent">|</span> 
              </span>
              {' '}Prompts
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground md:text-xl">
              BrieflyAI transforms your ideas into high-impact AI prompts. Craft, adapt, and analyze with our comprehensive suite of tools designed for clarity, precision, and superior results.
            </p>
            <div className="mt-8">
              <div className="font-medium text-foreground/80 mb-3">Experience:</div>
              <div className="h-7 overflow-hidden">
                {benefits.map((benefit, index) => (
                  <div
                    key={benefit}
                    className={cn(
                      "flex items-center justify-center text-primary text-lg transition-all duration-500 ease-in-out",
                      index === currentBenefitIndex ? "opacity-100 translate-y-0" : "opacity-0 absolute -translate-y-full left-1/2 -translate-x-1/2",
                      index > currentBenefitIndex && "translate-y-full" 
                    )}
                  >
                    <CheckCircle className="mr-2 h-5 w-5 text-primary flex-shrink-0" />
                    {benefit}
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button size="lg" asChild className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg transition-transform hover:scale-105" disabled={authLoading}>
                <Link href={getStartedHref}>
                  {authLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Get Started Free"}
                  {!authLoading && <ArrowRight className="ml-2 h-5 w-5" />}
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="shadow-lg transition-transform hover:scale-105 border-border text-foreground bg-background/50 hover:bg-accent/10">
                <Link href="#features">
                  Discover Features
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
