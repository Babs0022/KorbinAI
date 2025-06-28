
"use client";

import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle, GlassCardDescription } from '@/components/shared/GlassCard';
import Container from '@/components/layout/Container';
import { Settings, BarChart3, Share2 } from 'lucide-react';
import React from 'react';

const features = [
  {
    icon: <Settings className="h-10 w-10 text-primary" />,
    title: 'Engineer Precise Prompts',
    description: 'Go from vague ideas to detailed instructions. Use contextual framing, personas, and format specification to eliminate ambiguity and get the exact output you need.',
    bgColor: 'bg-indigo-500/10',
  },
  {
    icon: <BarChart3 className="h-10 w-10 text-accent" />,
    title: 'Understand What Works',
    description: 'Stop guessing. A/B test prompts, get quality scores, and use data-driven insights to make decisions that improve your results.',
    bgColor: 'bg-mint-500/10',
  },
  {
    icon: <Share2 className="h-10 w-10 text-primary" />,
    title: 'Save & Collaborate Seamlessly',
    description: 'Never lose a great prompt with automatic version history in your vault. Share instantly with your team to get feedback and build better, together.',
    bgColor: 'bg-indigo-500/10',
  },
];

export function KeyFeaturesHighlightSection() {
  return (
    <section id="features" className="py-16 md:py-24 bg-gradient-to-b from-background via-indigo-50/10 to-background">
      <Container>
        <div className="text-center mb-12 md:mb-16">
          <h2 className="font-headline text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            An Intuitive Workspace for Prompt Engineering
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Your complete toolkit for repeatable, production-quality results. Test, version, and perfect your prompts with confidence.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {features.map((feature, index) => (
            <GlassCard 
              key={feature.title} 
              className={`flex flex-col text-center h-full transform transition-all duration-300 hover:scale-105 hover:shadow-2xl border-transparent hover:border-primary/30 ${feature.bgColor}`}
            >
              <GlassCardHeader className="items-center">
                <div className={`mb-4 flex h-16 w-16 items-center justify-center rounded-full ${index === 1 ? 'bg-accent/20' : 'bg-primary/20'}`}>
                  {feature.icon}
                </div>
                <GlassCardTitle className="font-headline text-xl text-foreground">{feature.title}</GlassCardTitle>
              </GlassCardHeader>
              <GlassCardContent className="flex-grow">
                <GlassCardDescription className="text-muted-foreground text-sm leading-relaxed">{feature.description}</GlassCardDescription>
              </GlassCardContent>
            </GlassCard>
          ))}
        </div>
      </Container>
    </section>
  );
}
