"use client";

import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle, GlassCardDescription } from '@/components/shared/GlassCard';
import Container from '@/components/layout/Container';
import { Wand2, Settings, Share2 } from 'lucide-react';
import React from 'react';

const features = [
  {
    icon: <Settings className="h-10 w-10 text-primary" />,
    title: 'Precision Engineering Suite',
    description: 'Develop exceptionally clear prompts using contextual framing, role-playing techniques, and format specification. Eliminate ambiguity for consistent, high-quality AI outputs every time.',
    bgColor: 'bg-indigo-500/10',
  },
  {
    icon: <Wand2 className="h-10 w-10 text-accent" />,
    title: 'Automated Optimization Engine',
    description: 'Leverage advanced techniques like chain-of-thought prompting and automated parameter tuning. Our platform helps you decompose complex tasks and steer AI behavior for optimal results.',
    bgColor: 'bg-mint-500/10',
  },
  {
    icon: <Share2 className="h-10 w-10 text-primary" />,
    title: 'Management & Collaboration Hub',
    description: 'Utilize robust prompt management with versioning and A/B testing. Foster team collaboration with real-time sharing and monitor performance with cost-estimation tools.',
    bgColor: 'bg-indigo-500/10',
  },
];

export function KeyFeaturesHighlightSection() {
  return (
    <section id="features" className="py-16 md:py-24 bg-gradient-to-b from-background via-indigo-50/10 to-background">
      <Container>
        <div className="text-center mb-12 md:mb-16">
          <h2 className="font-headline text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            An Enterprise-Grade Prompting Platform
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Go beyond basic prompting. Access a full suite of tools for precision, optimization, and collaboration.
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
