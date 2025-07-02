
"use client";

import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import Container from '@/components/layout/Container';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Settings2, RefreshCw, BarChart, Wand2, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle, GlassCardDescription } from '@/components/shared/GlassCard';

export default function RefinementPage() {
  return (
    <DashboardLayout>
      <main className="flex-grow bg-gradient-to-br from-background via-indigo-50/30 to-mint-50/30 py-8">
        <Container>
          <div className="mb-6">
            <Button variant="outline" asChild size="sm">
              <Link href="/dashboard/academy">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Academy
              </Link>
            </Button>
          </div>
          
          <GlassCard className="mb-8">
            <GlassCardHeader>
              <div className="flex items-center mb-3">
                <div className="p-3 rounded-lg mr-4 bg-primary/10 text-primary">
                  <Settings2 className="h-8 w-8" />
                </div>
                <div>
                    <GlassCardTitle className="font-headline text-3xl">
                    Iterative Prompt Refinement
                    </GlassCardTitle>
                    <GlassCardDescription className="mt-1 text-md">
                    The secret to great results is improvement, not perfection on the first try.
                    </GlassCardDescription>
                </div>
              </div>
            </GlassCardHeader>
             <GlassCardContent>
                <h3 className="font-semibold text-lg text-foreground mb-2">The Refinement Loop</h3>
                <p className="text-muted-foreground">
                    Prompt engineering is a process of discovery. Your first prompt is a starting point. The key is to analyze the AI's output and use that information to improve your next prompt. This cycle is called iterative refinement.
                </p>
            </GlassCardContent>
          </GlassCard>
          
          <div className="relative grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
             <GlassCard className="flex flex-col items-center text-center">
                <GlassCardHeader><RefreshCw className="h-8 w-8 text-primary mb-2"/><GlassCardTitle>1. Run</GlassCardTitle></GlassCardHeader>
                <GlassCardContent><p className="text-sm text-muted-foreground">Execute your initial prompt.</p></GlassCardContent>
            </GlassCard>
             <GlassCard className="flex flex-col items-center text-center">
                <GlassCardHeader><BarChart className="h-8 w-8 text-primary mb-2"/><GlassCardTitle>2. Analyze</GlassCardTitle></GlassCardHeader>
                <GlassCardContent><p className="text-sm text-muted-foreground">What’s good? What's missing? What's wrong with the output?</p></GlassCardContent>
            </GlassCard>
             <GlassCard className="flex flex-col items-center text-center">
                <GlassCardHeader><Wand2 className="h-8 w-8 text-primary mb-2"/><GlassCardTitle>3. Refine</GlassCardTitle></GlassCardHeader>
                <GlassCardContent><p className="text-sm text-muted-foreground">Add specifics, clarify instructions, or change the persona.</p></GlassCardContent>
            </GlassCard>
             <GlassCard className="flex flex-col items-center text-center">
                <GlassCardHeader><RefreshCw className="h-8 w-8 text-primary mb-2"/><GlassCardTitle>4. Repeat</GlassCardTitle></GlassCardHeader>
                <GlassCardContent><p className="text-sm text-muted-foreground">Run the new prompt and observe the improved results.</p></GlassCardContent>
            </GlassCard>
          </div>
          
           <GlassCard className="mt-8">
                <GlassCardHeader>
                    <GlassCardTitle>Example: Refining a Prompt</GlassCardTitle>
                </GlassCardHeader>
                <GlassCardContent className="space-y-4">
                    <div>
                        <h4 className="font-semibold text-foreground">Version 1 (Initial Idea):</h4>
                        <p className="text-sm bg-muted/50 p-3 rounded-md mt-2 font-code">"Tell me about BrieflyAI."</p>
                        <p className="text-xs text-muted-foreground mt-1"><strong>Result:</strong> Too generic. The AI might give a basic, uninspired summary.</p>
                    </div>
                    <div className="text-center my-2"><ArrowRight className="h-6 w-6 text-primary/50 rotate-90 md:rotate-0"/></div>
                    <div>
                        <h4 className="font-semibold text-foreground">Version 2 (Refined):</h4>
                        <p className="text-sm bg-muted/50 p-3 rounded-md mt-2 font-code">"Act as a marketing expert. Write 3 tweets announcing BrieflyAI to an audience of startup founders. Focus on the benefits of saving time and getting better AI results."</p>
                        <p className="text-xs text-muted-foreground mt-1"><strong>Result:</strong> Much better! The output is now targeted, has a specific format (tweets), and highlights key benefits.</p>
                    </div>
                    <div className="pt-4 border-t border-border/50">
                        <h4 className="font-semibold text-foreground">How BrieflyAI Helps</h4>
                        <p className="text-muted-foreground text-sm mt-1">
                            Our <Link href="/dashboard/refinement-hub" className="text-primary hover:underline">Refinement Hub</Link> and <Link href="/dashboard/compatibility-checker" className="text-primary hover:underline">A/B Testing</Link> tools are specifically designed to support this iterative process, making it faster and more effective.
                        </p>
                    </div>
                </GlassCardContent>
            </GlassCard>

        </Container>
      </main>
    </DashboardLayout>
  );
}
