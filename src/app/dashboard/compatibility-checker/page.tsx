
"use client";

import React from 'react';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { MinimalFooter } from '@/components/layout/MinimalFooter';
import Container from '@/components/layout/Container';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCheck } from 'lucide-react';
import Link from 'next/link';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/shared/GlassCard';

export default function CompatibilityCheckerPage() {
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
                <CheckCheck className="mr-3 h-8 w-8 text-primary" />
                AI Model Compatibility Checker
              </GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent>
              <p className="text-muted-foreground mb-4">
                Ensure your prompt is perfectly tuned for your chosen AI model. Get feedback on compatibility and suggestions for adjustments to maximize performance across different models.
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

    