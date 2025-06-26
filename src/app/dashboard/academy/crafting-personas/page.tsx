
"use client";

import React from 'react';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { MinimalFooter } from '@/components/layout/MinimalFooter';
import Container from '@/components/layout/Container';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users, Zap, Briefcase, Feather } from 'lucide-react';
import Link from 'next/link';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle, GlassCardDescription } from '@/components/shared/GlassCard';

export default function PersonasPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <DashboardHeader />
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
                  <Users className="h-8 w-8" />
                </div>
                <div>
                    <GlassCardTitle className="font-headline text-3xl">
                    Crafting Effective Personas
                    </GlassCardTitle>
                    <GlassCardDescription className="mt-1 text-md">
                    Giving your AI a role for better, more consistent results.
                    </GlassCardDescription>
                </div>
              </div>
            </GlassCardHeader>
             <GlassCardContent>
                <h3 className="font-semibold text-lg text-foreground mb-2">Why Use a Persona?</h3>
                <p className="text-muted-foreground">
                    Assigning a persona is like giving an actor a role. It tells the AI which "hat" to wear, guiding its tone, style, knowledge, and even its reasoning process. It's one of the most powerful techniques in prompt engineering. By starting your prompt with "Act as a...", you frame the entire request and get more focused and reliable outputs.
                </p>
            </GlassCardContent>
          </GlassCard>
          
          <h2 className="font-headline text-2xl font-semibold text-foreground mb-4">Examples of Personas</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <GlassCard>
                <GlassCardHeader>
                    <Zap className="h-7 w-7 text-accent mb-2"/>
                    <GlassCardTitle>Marketing Persona</GlassCardTitle>
                </GlassCardHeader>
                <GlassCardContent>
                    <p className="text-sm bg-muted/50 p-3 rounded-md font-code">"Act as a senior digital marketing manager with 10 years of experience in B2B SaaS. You are an expert in SEO, content marketing, and lead generation."</p>
                </GlassCardContent>
            </GlassCard>
             <GlassCard>
                <GlassCardHeader>
                     <Briefcase className="h-7 w-7 text-accent mb-2"/>
                    <GlassCardTitle>Technical Persona</GlassCardTitle>
                </GlassCardHeader>
                <GlassCardContent>
                    <p className="text-sm bg-muted/50 p-3 rounded-md font-code">"You are a principal software engineer specializing in Python and backend systems. Your expertise lies in writing clean, efficient, and well-documented code."</p>
                </GlassCardContent>
            </GlassCard>
            <GlassCard>
                <GlassCardHeader>
                     <Feather className="h-7 w-7 text-accent mb-2"/>
                    <GlassCardTitle>Creative Persona</GlassCardTitle>
                </GlassCardHeader>
                <GlassCardContent>
                    <p className="text-sm bg-muted/50 p-3 rounded-md font-code">"Assume the role of a seasoned travel writer and storyteller. Your writing style is evocative, personal, and focuses on hidden gems rather than tourist traps."</p>
                </GlassCardContent>
            </GlassCard>
          </div>
          
           <GlassCard className="mt-8">
                <GlassCardHeader>
                    <GlassCardTitle>Tips for Great Personas</GlassCardTitle>
                </GlassCardHeader>
                <GlassCardContent>
                   <ul className="list-disc list-inside text-muted-foreground space-y-2">
                      <li><strong>Be Specific About Expertise:</strong> Instead of "a programmer," say "a senior JavaScript developer specializing in React."</li>
                      <li><strong>Mention the Goal:</strong> Include the persona's motivation, e.g., "...your goal is to make complex topics easy for beginners to understand."</li>
                      <li><strong>Combine Roles:</strong> For unique results, mix personas, e.g., "Act as a historian with the narrative flair of a novelist."</li>
                   </ul>
                </GlassCardContent>
            </GlassCard>

        </Container>
      </main>
      <MinimalFooter />
    </div>
  );
}
