
"use client";

import React from 'react';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { MinimalFooter } from '@/components/layout/MinimalFooter';
import Container from '@/components/layout/Container';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Archive } from 'lucide-react';
import Link from 'next/link';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/shared/GlassCard';

export default function PromptVaultPage() {
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
                <Archive className="mr-3 h-8 w-8 text-primary" />
                Prompt Vault
              </GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent>
              <p className="text-muted-foreground mb-4">
                Welcome to your Prompt Vault! This is where all your saved and generated prompts will be organized.
              </p>
              <p className="text-lg font-semibold text-primary">Full feature coming soon!</p>
              <ul className="mt-4 list-disc list-inside text-muted-foreground space-y-1">
                <li>Advanced search and filtering</li>
                <li>Categorization and tagging</li>
                <li>Bulk actions (export, delete)</li>
                <li>And much more!</li>
              </ul>
            </GlassCardContent>
          </GlassCard>
        </Container>
      </main>
      <MinimalFooter />
    </div>
  );
}

    