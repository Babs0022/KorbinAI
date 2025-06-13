
"use client";

import React, { useState, useEffect } from 'react';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { MinimalFooter } from '@/components/layout/MinimalFooter';
import Container from '@/components/layout/Container';
import { CreatePromptForm } from '@/components/prompt/CreatePromptForm';
import { OptimizedPromptCard } from '@/components/prompt/OptimizedPromptCard';
import type { OptimizePromptOutput } from '@/ai/flows/optimize-prompt';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function CreatePromptPage() {
  const { currentUser, loading } = useAuth();
  const router = useRouter();
  const [optimizedOutput, setOptimizedOutput] = useState<OptimizePromptOutput | null>(null);
  const [originalGoal, setOriginalGoal] = useState<string>('');

  useEffect(() => {
    if (!loading && !currentUser) {
      router.push('/login');
    }
  }, [currentUser, loading, router]);

  const handlePromptOptimized = (output: OptimizePromptOutput, goal: string) => {
    setOptimizedOutput(output);
    setOriginalGoal(goal);
  };

  if (loading || !currentUser) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading...</p>
      </div>
    );
  }

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
          <h1 className="font-headline text-3xl font-bold text-foreground mb-2">Create New Prompt</h1>
          <p className="text-muted-foreground mb-8">
            Follow the steps below to generate a highly optimized prompt for your AI tasks.
          </p>
          
          <CreatePromptForm onPromptOptimized={(output) => handlePromptOptimized(output, (document.getElementById('goal') as HTMLTextAreaElement)?.value || '')} />

          {optimizedOutput && (
            <OptimizedPromptCard 
              optimizedPrompt={optimizedOutput.optimizedPrompt}
              originalGoal={originalGoal} 
            />
          )}
        </Container>
      </main>
      <MinimalFooter />
    </div>
  );
}
