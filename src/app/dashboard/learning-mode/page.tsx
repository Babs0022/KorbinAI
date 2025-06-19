
"use client";

import React from 'react';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { MinimalFooter } from '@/components/layout/MinimalFooter';
import Container from '@/components/layout/Container';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Brain, TrendingUp, Lightbulb } from 'lucide-react';
import Link from 'next/link';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle, GlassCardDescription } from '@/components/shared/GlassCard';

export default function LearningModePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <DashboardHeader />
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
                Prompt Learning Mode
              </GlassCardTitle>
              <GlassCardDescription className="mt-2 text-lg">
                BrieflyAI is designed to get smarter and more helpful the more you use it.
              </GlassCardDescription>
            </GlassCardHeader>
            <GlassCardContent className="space-y-6">
              <div>
                <h3 className="font-headline text-xl font-semibold text-foreground mb-2 flex items-center">
                  <TrendingUp className="mr-2 h-5 w-5 text-accent" />
                  Our Goal: Personalized Prompting Excellence
                </h3>
                <p className="text-muted-foreground">
                  The "Prompt Learning Mode" reflects our commitment to making BrieflyAI adapt to your unique style and needs.
                  It's about continuously refining BrieflyAI's internal strategies and system prompts that guide the underlying AI model (like Gemini).
                  This is different from training a foundational LLM like GPT-4 or Claude from scratch.
                  Instead, we focus on making BrieflyAI smarter by improving how it *uses* powerful existing AI models.
                </p>
              </div>

              <div>
                <h3 className="font-headline text-xl font-semibold text-foreground mb-2 flex items-center">
                  <Lightbulb className="mr-2 h-5 w-5 text-accent" />
                  How It Works (and Will Improve!)
                </h3>
                <p className="text-muted-foreground mb-2">
                  Currently, BrieflyAI uses the immediate context you provide—your goal and survey answers—to generate and optimize prompts.
                </p>
                <p className="text-muted-foreground">
                  <strong>Our Vision for Enhancement:</strong> As you continue to use BrieflyAI, especially features like the Prompt Vault and Refinement Hub,
                  we plan to develop capabilities that analyze broader patterns in your activity (e.g., common topics, preferred output styles, frequently used models).
                  This information will be used to:
                </p>
                <ul className="list-disc list-inside text-muted-foreground mt-2 pl-4 space-y-1">
                  <li>Offer more relevant initial survey questions.</li>
                  <li>Provide more insightful real-time suggestions.</li>
                  <li>Suggest refinements that align better with your past successes.</li>
                  <li>Further tune the system prompts BrieflyAI uses internally for even better results.</li>
                </ul>
                 <p className="text-muted-foreground mt-3">
                  This is an evolving aspect of BrieflyAI. The more you interact with the platform and its features,
                  the better the foundation we have for building these intelligent personalization layers.
                </p>
              </div>
              
              <div>
                <h3 className="font-headline text-xl font-semibold text-foreground mb-2">
                  Your Role in Enhancing BrieflyAI's "Learning"
                </h3>
                <p className="text-muted-foreground">
                  For now, the best way to help BrieflyAI "learn" and improve is by actively using its features:
                </p>
                 <ul className="list-disc list-inside text-muted-foreground mt-2 pl-4 space-y-1">
                  <li>Consistently use the <strong>Prompt Generator</strong> for various tasks.</li>
                  <li>Save your most effective prompts to the <strong>Prompt Vault</strong>.</li>
                  <li>Utilize the <strong>Refinement Hub</strong> to tweak and improve your prompts.</li>
                  <li>Explore different <strong>Model-Specific Adaptations</strong> to see what works best for you.</li>
                </ul>
                <p className="text-muted-foreground mt-3">
                   Your interactions provide valuable (anonymized, where appropriate) insights that will guide the development of a more intelligent and personalized BrieflyAI.
                </p>
              </div>
              
              <p className="text-md font-semibold text-primary text-center pt-4 border-t border-border/50">
                Thank you for being part of BrieflyAI's journey to smarter prompting!
              </p>

            </GlassCardContent>
          </GlassCard>
        </Container>
      </main>
      <MinimalFooter />
    </div>
  );
}

