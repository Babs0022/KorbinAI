
"use client";

import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle, GlassCardDescription } from '@/components/shared/GlassCard';
import Container from '@/components/layout/Container';
import { Lightbulb, Cpu, Settings2 } from 'lucide-react';
import React from 'react';

const features = [
  {
    icon: <Lightbulb className="h-10 w-10 text-primary" />,
    title: 'From Idea to Blueprint',
    description: 'Describe what you want to build in plain English. BrieflyAI asks clarifying questions and transforms your idea into a detailed specification that any AI can understand and execute.',
    bgColor: 'bg-indigo-500/10',
  },
  {
    icon: <Cpu className="h-10 w-10 text-accent" />,
    title: 'Generate Code, Copy & Assets',
    description: 'Get production-ready code snippets, persuasive copy for your landing page, or design concepts for your logo. BrieflyAI helps you create all the components of your project.',
    bgColor: 'bg-mint-500/10',
  },
  {
    icon: <Settings2 className="h-10 w-10 text-primary" />,
    title: 'AI-Assisted Iteration',
    description: 'Building is a process. Easily refine your creations by asking the AI to change a color scheme, add a feature, or rewrite text. BrieflyAI makes iteration simple.',
    bgColor: 'bg-indigo-500/10',
  },
];

export function KeyFeaturesHighlightSection() {
  return (
    <section id="features" className="py-16 md:py-24 bg-gradient-to-b from-background via-indigo-50/10 to-background">
      <Container>
        <div className="text-center mb-12 md:mb-16">
          <h2 className="font-headline text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            A Better Way to Build with AI
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            From your first idea to your final product, BrieflyAI provides the structure and guidance you need to build with confidence.
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
