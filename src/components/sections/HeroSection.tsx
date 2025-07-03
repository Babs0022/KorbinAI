
"use client";

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles, Loader2 } from 'lucide-react';
import Container from '@/components/layout/Container';
import { useAuth } from '@/contexts/AuthContext';

export function HeroSection() {
  const { currentUser, loading: authLoading } = useAuth();
  const getStartedHref = authLoading ? "#" : currentUser ? "/dashboard" : "/signup";

  return (
    <section className="hero-background relative overflow-hidden py-20 md:py-32">
      <Container className="relative z-10">
        <div className="grid grid-cols-1 items-center gap-12">
          <div className="text-center">
            <div className="mb-6 inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary shadow-sm backdrop-blur-sm">
              <Sparkles className="mr-2 h-4 w-4 text-primary" />
              Your AI Co-pilot for Creation
            </div>
            <h1 className="font-headline text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl md:text-6xl">
              Go from Idea to Shipped Product,
              <span className="text-primary"> with AI.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
              BrieflyAI is your AI co-pilot that helps you build and ship websites, apps, and creative projects—no coding expertise required.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button size="lg" asChild className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg transition-transform hover:scale-105">
                <Link href={getStartedHref}>
                  Start Building for Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="shadow-lg transition-transform hover:scale-105 border-border text-foreground bg-background/50 hover:bg-accent/10">
                <Link href="#how-it-works">
                  How It Works
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
