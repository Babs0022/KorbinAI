
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

export function HeroSection() {
  const [currentBenefitIndex, setCurrentBenefitIndex] = useState(0);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentBenefitIndex((prevIndex) => (prevIndex + 1) % benefits.length);
    }, 3000);
    return () => clearInterval(intervalId);
  }, []);

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary via-indigo-700 to-slate-900 py-20 md:py-32">
      {/* Background subtle elements */}
      <div className="absolute inset-0 -z-10 opacity-10">
        {/* You could add SVG patterns or very subtle animated shapes here */}
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
              <span className="text-mint-400">Intelligent Prompts</span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg text-indigo-100 lg:mx-0 md:text-xl">
              BrieflyAI transforms your ideas into high-impact AI prompts. Craft, adapt, and analyze with our comprehensive suite of tools designed for clarity, precision, and superior results.
            </p>
            <div className="mt-8">
              <div className="font-medium text-indigo-200 mb-3">Experience:</div>
              <div className="h-7 overflow-hidden"> {/* Container to manage height for cycling text */}
                {benefits.map((benefit, index) => (
                  <div
                    key={benefit}
                    className={cn(
                      "flex items-center text-mint-300 text-lg transition-all duration-500 ease-in-out",
                      index === currentBenefitIndex ? "opacity-100 translate-y-0" : "opacity-0 absolute -translate-y-full",
                      index > currentBenefitIndex && "translate-y-full" // For items coming from bottom
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
            {/* Placeholder for a more abstract/techy visual. Using a simple placeholder image for now. */}
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
