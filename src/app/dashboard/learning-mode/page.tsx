
"use client";

import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import Container from '@/components/layout/Container';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Brain, TrendingUp, Lightbulb, Settings, Database } from 'lucide-react';
import Link from 'next/link';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle, GlassCardDescription } from '@/components/shared/GlassCard';

export default function LearningModePage() {
  return (
    <DashboardLayout>
      <main className="flex-grow bg-gradient-to-br from-background via-indigo-50/30 to-mint-50/30 py-8">
        <Container>
          <div className="mb-6">
            <Button variant="outline" asChild size="sm">
              <Link href="/dashboard">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Link>
            </Button>
          </div>
          <GlassCard>
            <GlassCardHeader>
              <GlassCardTitle className="font-headline text-3xl flex items-center">
                <Brain className="mr-3 h-8 w-8 text-primary" />
                Automated Optimization Engine
              </GlassCardTitle>
              <GlassCardDescription className="mt-2 text-lg">
                BrieflyAI is designed to get smarter and more helpful the more you use it, leveraging advanced, data-driven techniques.
              </GlassCardDescription>
            </GlassCardHeader>
            <GlassCardContent className="space-y-6">
              <div>
                <h3 className="font-headline text-xl font-semibold text-foreground mb-2 flex items-center">
                  <TrendingUp className="mr-2 h-5 w-5 text-accent" />
                  Our Optimization Philosophy
                </h3>
                <p className="text-muted-foreground">
                  Our "Automated Optimization Engine" is at the core of making BrieflyAI a truly intelligent platform. It's not about training a foundational LLM like GPT-4 from scratch. Instead, we focus on making BrieflyAI smarter by improving how it *uses* powerful existing AI models, tailored to your specific needs and successes.
                </p>
              </div>

              <div>
                <h3 className="font-headline text-xl font-semibold text-foreground mb-2 flex items-center">
                  <Lightbulb className="mr-2 h-5 w-5 text-accent" />
                  Feedback-Driven Evolution
                </h3>
                <p className="text-muted-foreground mb-2">
                  Our vision is to build a system that learns from your interactions to provide increasingly personalized and effective results. This includes developing capabilities for:
                </p>
                <ul className="list-disc list-inside text-muted-foreground mt-2 pl-4 space-y-1">
                  <li><strong>Feedback-Driven Self-Evolving Prompts:</strong> Analyzing which prompts you refine, save, and reuse to understand what "good" looks like *for you*.</li>
                  <li><strong>Reinforcement Learning from Human Feedback (RLHF) Principles:</strong> Using your ratings and the performance of prompts (e.g., quality scores) as a signal to improve future suggestions.</li>
                  <li><strong>Contextual Suggestions:</strong> Leveraging patterns from your Prompt Vault to offer more relevant initial survey questions and refinement tips that align with your past successes.</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-headline text-xl font-semibold text-foreground mb-2 flex items-center">
                  <Database className="mr-2 h-5 w-5 text-accent" />
                   Your Role in Building the Engine
                </h3>
                <p className="text-muted-foreground">
                  Your activity powers the engine. The best way to help BrieflyAI "learn" and improve is by actively using its features:
                </p>
                 <ul className="list-disc list-inside text-muted-foreground mt-2 pl-4 space-y-1">
                  <li>Use the <strong>Prompt Feedback & Analysis</strong> tool to generate quality scores for your prompts. This is a crucial feedback signal.</li>
                  <li>Save your most effective prompts to the <strong>Prompt Vault</strong>, and use descriptive names and tags.</li>
                  <li>Utilize the <strong>Refinement Hub</strong> to iteratively improve prompts. Each refinement is a learning opportunity for our system.</li>
                  <li>Explore different <strong>Model-Specific Adaptations</strong> to see what works best for you and your use cases.</li>
                </ul>
                <p className="text-muted-foreground mt-3">
                   Your interactions provide the valuable (and anonymized) data that will guide the development of a more intelligent and personalized BrieflyAI.
                </p>
              </div>
              
              <p className="text-md font-semibold text-primary text-center pt-4 border-t border-border/50">
                Thank you for being part of BrieflyAI's journey to smarter prompting!
              </p>

            </GlassCardContent>
          </GlassCard>
        </Container>
      </main>
    </DashboardLayout>
  );
}
