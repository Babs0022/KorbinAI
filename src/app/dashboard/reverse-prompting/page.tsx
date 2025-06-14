
"use client";

import React from 'react';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { MinimalFooter } from '@/components/layout/MinimalFooter';
import Container from '@/components/layout/Container';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Undo2 } from 'lucide-react';
import Link from 'next/link';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/shared/GlassCard';

export default function ReversePromptingPage() {
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
                <Undo2 className="mr-3 h-8 w-8 text-primary" />
                Reverse Prompting
              </GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent>
              <p className="text-muted-foreground mb-4">
                Upload AI-generated output (text or images) and let BrieflyAI attempt to reconstruct the prompt that might have created it. A great way to learn and analyze!
              </p>
              <p className="text-lg font-semibold text-primary">Full feature coming soon!</p>
            </GlassCardContent>
          </GlassCard>
        </Container>
      </main>
      <MinimalFooter />
    </div>
  );
}

    