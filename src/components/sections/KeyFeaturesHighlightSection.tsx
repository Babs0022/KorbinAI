
"use client";

import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle, GlassCardDescription } from '@/components/shared/GlassCard';
import Container from '@/components/layout/Container';
import { Wand2, Cpu, BarChart3, Sparkles } from 'lucide-react';
import React from 'react';

const features = [
  {
    icon: <Wand2 className="h-10 w-10 text-primary" />,
    title: 'Intelligent Prompt Crafting',
    description: 'Transform vague ideas into precise, powerful prompts. Our AI-assisted workflow guides you from initial goal to optimized output, ensuring clarity and effectiveness for any task.',
    bgColor: 'bg-indigo-500/10',
  },
  {
    icon: <Cpu className="h-10 w-10 text-accent" />,
    title: 'Model-Specific Adaptation',
    description: 'Maximize results from any AI. BrieflyAI tailors your prompts for specific models like GPT-4, Claude 3, Gemini, DALL-E 3, Midjourney, ensuring optimal performance and compatibility.',
    bgColor: 'bg-mint-500/10',
  },
  {
    icon: <BarChart3 className="h-10 w-10 text-primary" />,
    title: 'Advanced Prompt Grading',
    description: 'Receive instant, AI-powered feedback on your prompts. Get quality scores, actionable insights, and suggestions to refine your prompts for peak AI performance.',
    bgColor: 'bg-indigo-500/10',
  },
];

export function KeyFeaturesHighlightSection() {
  return (
    <section id="features" className="py-16 md:py-24 bg-gradient-to-b from-background via-indigo-50/10 to-background">
      <Container>
        <div className="text-center mb-12 md:mb-16">
          <h2 className="font-headline text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            The BrieflyAI Power Suite
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Elevate your AI interactions with tools designed for precision and impact.
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
