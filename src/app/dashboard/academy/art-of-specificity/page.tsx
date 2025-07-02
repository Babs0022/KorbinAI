
"use client";

import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import Container from '@/components/layout/Container';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Lightbulb, Target, ListChecks, Mic, FileText, BarChart } from 'lucide-react';
import Link from 'next/link';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle, GlassCardDescription } from '@/components/shared/GlassCard';

export default function SpecificityPage() {
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
                  <Lightbulb className="h-8 w-8" />
                </div>
                <div>
                    <GlassCardTitle className="font-headline text-3xl">
                    The Art of Specificity
                    </GlassCardTitle>
                    <GlassCardDescription className="mt-1 text-md">
                    From Vague Ideas to Precise Instructions.
                    </GlassCardDescription>
                </div>
              </div>
            </GlassCardHeader>
          </GlassCard>
          
          <GlassCard className="mb-6">
            <GlassCardHeader>
              <GlassCardTitle>Before vs. After</GlassCardTitle>
              <GlassCardDescription>See how adding details transforms the prompt.</GlassCardDescription>
            </GlassCardHeader>
            <GlassCardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold text-destructive">Before (Vague)</h4>
                <p className="text-sm bg-destructive/10 p-3 rounded-md mt-2 font-code">"Write about electric cars."</p>
                <p className="text-xs text-muted-foreground mt-2">This will likely produce a generic, high-level article that is not very useful.</p>
              </div>
              <div>
                <h4 className="font-semibold text-accent">After (Specific)</h4>
                <p className="text-sm bg-accent/10 p-3 rounded-md mt-2 font-code">"Write a 700-word comparison of the top 3 electric SUVs for families in 2024. Focus on safety ratings (NHTSA), real-world range (miles), and total cargo space (cubic feet). The tone should be informative and objective."</p>
                 <p className="text-xs text-muted-foreground mt-2">This gives the AI clear instructions, constraints, and a defined scope, leading to a much more valuable output.</p>
              </div>
            </GlassCardContent>
          </GlassCard>

          <h2 className="font-headline text-2xl font-semibold text-foreground mb-4 mt-8">Key Areas for Specificity</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <GlassCard>
                <GlassCardHeader><Target className="h-6 w-6 text-primary mb-2"/>Target Audience</GlassCardHeader>
                <GlassCardContent><p className="text-sm text-muted-foreground">Who is this for? (e.g., "for beginners", "for expert developers")</p></GlassCardContent>
            </GlassCard>
             <GlassCard>
                <GlassCardHeader><FileText className="h-6 w-6 text-primary mb-2"/>Key Details</GlassCardHeader>
                <GlassCardContent><p className="text-sm text-muted-foreground">What essential information must be included? (e.g., "mention our new product, 'BrieflyAI'")</p></GlassCardContent>
            </GlassCard>
             <GlassCard>
                <GlassCardHeader><BarChart className="h-6 w-6 text-primary mb-2"/>Quantify</GlassCardHeader>
                <GlassCardContent><p className="text-sm text-muted-foreground">Use numbers when possible. (e.g., "top 5 reasons", "a 3-post series", "under 1000 words")</p></GlassCardContent>
            </GlassCard>
             <GlassCard>
                <GlassCardHeader><Mic className="h-6 w-6 text-primary mb-2"/>Tone & Style</GlassCardHeader>
                <GlassCardContent><p className="text-sm text-muted-foreground">How should it sound? (e.g., "formal and academic", "witty and humorous")</p></GlassCardContent>
            </GlassCard>
          </div>
          
        </Container>
      </main>
    </DashboardLayout>
  );
}
