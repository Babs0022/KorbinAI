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
              The Future of AI Interaction is Here
            </div>
            <h1 className="font-headline text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl md:text-6xl">
              Ship better prompts, <span className="text-primary">Faster.</span>{' '}
              <br className="hidden md:block" />
              Go from idea to Production in <span className="text-accent">Minutes.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
              BrieflyAI is an enterprise-grade platform for crafting, testing, and managing high-quality AI prompts. Move from concept to deployment with confidence and speed.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
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
