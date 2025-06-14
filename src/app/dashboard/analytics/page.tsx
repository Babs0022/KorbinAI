
"use client";

import React from 'react';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { MinimalFooter } from '@/components/layout/MinimalFooter';
import Container from '@/components/layout/Container';
import { Button } from '@/components/ui/button';
import { ArrowLeft, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/shared/GlassCard';

export default function AnalyticsPage() {
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
                <TrendingUp className="mr-3 h-8 w-8 text-primary" />
                Prompt Analytics Dashboard
              </GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent>
              <p className="text-muted-foreground mb-4">
                Track the performance of your prompts. See usage statistics, types of output generated, and user feedback to understand what works best.
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

    