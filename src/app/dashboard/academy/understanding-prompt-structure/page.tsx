
"use client";

import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import Container from '@/components/layout/Container';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BookOpen, User, ClipboardList, Frame, Code } from 'lucide-react';
import Link from 'next/link';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle, GlassCardDescription } from '@/components/shared/GlassCard';

export default function PromptStructurePage() {
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
                  <BookOpen className="h-8 w-8" />
                </div>
                <div>
                    <GlassCardTitle className="font-headline text-3xl">
                    Understanding Prompt Structure
                    </GlassCardTitle>
                    <GlassCardDescription className="mt-1 text-md">
                    The anatomy of a high-performance AI prompt.
                    </GlassCardDescription>
                </div>
              </div>
            </GlassCardHeader>
          </GlassCard>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <GlassCard>
                <GlassCardHeader>
                    <GlassCardTitle className="flex items-center"><User className="mr-2 h-5 w-5 text-accent"/>Component 1: Persona</GlassCardTitle>
                </GlassCardHeader>
                <GlassCardContent>
                    <p className="text-muted-foreground">Assigning a persona or role to the AI sets the stage for its response. It primes the model to access specific knowledge and adopt a certain tone.</p>
                    <p className="text-sm bg-muted/50 p-3 rounded-md mt-3 font-code">Act as an expert financial advisor specializing in retirement planning for millennials.</p>
                </GlassCardContent>
            </GlassCard>
             <GlassCard>
                <GlassCardHeader>
                    <GlassCardTitle className="flex items-center"><ClipboardList className="mr-2 h-5 w-5 text-accent"/>Component 2: Task</GlassCardTitle>
                </GlassCardHeader>
                <GlassCardContent>
                    <p className="text-muted-foreground">This is the core action you want the AI to perform. It should be clear, concise, and unambiguous. Use strong action verbs.</p>
                     <p className="text-sm bg-muted/50 p-3 rounded-md mt-3 font-code">Create a 500-word blog post outline.</p>
                </GlassCardContent>
            </GlassCard>
             <GlassCard>
                <GlassCardHeader>
                    <GlassCardTitle className="flex items-center"><Frame className="mr-2 h-5 w-5 text-accent"/>Component 3: Context & Constraints</GlassCardTitle>
                </GlassCardHeader>
                <GlassCardContent>
                    <p className="text-muted-foreground">Provide necessary background information, rules, and boundaries. What should it include? What should it avoid? This is where you add specificity.</p>
                     <p className="text-sm bg-muted/50 p-3 rounded-md mt-3 font-code">The blog post should focus on the benefits of compound interest and avoid complex financial jargon. The target audience is young professionals new to investing.</p>
                </GlassCardContent>
            </GlassCard>
             <GlassCard>
                <GlassCardHeader>
                    <GlassCardTitle className="flex items-center"><Code className="mr-2 h-5 w-5 text-accent"/>Component 4: Format</GlassCardTitle>
                </GlassCardHeader>
                <GlassCardContent>
                    <p className="text-muted-foreground">Explicitly define the desired structure of the output. This greatly improves the usability of the AI's response.</p>
                     <p className="text-sm bg-muted/50 p-3 rounded-md mt-3 font-code">Provide the outline in a markdown format with nested bullet points for each main section.</p>
                </GlassCardContent>
            </GlassCard>
          </div>

           <GlassCard className="mt-8">
                <GlassCardHeader>
                    <GlassCardTitle>Putting It All Together</GlassCardTitle>
                    <GlassCardDescription>Combining these components creates a powerful, structured prompt.</GlassCardDescription>
                </GlassCardHeader>
                <GlassCardContent>
                    <div className="bg-muted/50 p-4 rounded-lg border">
                        <p className="font-code text-sm text-foreground">
                            Act as an expert financial advisor specializing in retirement planning for millennials. Create a 500-word blog post outline. The blog post should focus on the benefits of compound interest and avoid complex financial jargon. The target audience is young professionals new to investing. Provide the outline in a markdown format with nested bullet points for each main section.
                        </p>
                    </div>
                </GlassCardContent>
            </GlassCard>

        </Container>
      </main>
    </DashboardLayout>
  );
}
