
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle, GlassCardDescription } from '@/components/shared/GlassCard';
import { Logo } from '@/components/shared/Logo';
import { Loader2, ArrowRight, Sparkles, Lightbulb } from 'lucide-react';
import Container from '@/components/layout/Container';

const TOTAL_STEPS = 2; // Reduced from 3 as referral step is removed

export default function OnboardingPage() {
  const { currentUser, loading: authLoading } = useAuth();
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState(1);

  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push('/login');
    }
  }, [currentUser, authLoading, router]);

  const handleNextStep = () => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(prev => prev + 1);
    } else {
      router.push('/dashboard');
    }
  };

  if (authLoading || !currentUser) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background via-indigo-50/50 to-mint-50/50">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading Onboarding...</p>
      </div>
    );
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <>
            <Sparkles className="h-12 w-12 text-primary mb-4" />
            <GlassCardTitle className="font-headline text-3xl mb-3">Welcome to BrieflyAI!</GlassCardTitle>
            <GlassCardDescription className="text-lg text-muted-foreground mb-6">
              We&apos;re thrilled to have you. BrieflyAI is here to help you craft perfect AI prompts, faster and smarter.
            </GlassCardDescription>
            <p className="text-sm text-muted-foreground">
              Let&apos;s quickly get you set up.
            </p>
          </>
        );
      case 2:
        return (
          <>
            <Lightbulb className="h-12 w-12 text-primary mb-4" />
            <GlassCardTitle className="font-headline text-3xl mb-3">Unlock AI&apos;s Potential</GlassCardTitle>
            <GlassCardDescription className="text-lg text-muted-foreground mb-6">
              BrieflyAI offers a suite of tools:
            </GlassCardDescription>
            <ul className="space-y-2 text-left text-muted-foreground list-disc list-inside pl-4 mb-6">
              <li><strong>Intelligent Prompt Generator:</strong> Turn goals into optimized prompts.</li>
              <li><strong>Model-Specific Adaptation:</strong> Tailor prompts for GPT, Claude, DALL-E & more.</li>
              <li><strong>Advanced Analysis:</strong> Get quality scores and actionable feedback.</li>
              <li><strong>Prompt Vault:</strong> Save and organize your best creations.</li>
            </ul>
             <p className="text-sm text-muted-foreground">
              You&apos;re ready to explore these features!
            </p>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background via-indigo-50/50 to-mint-50/50 p-4">
      <div className="mb-8">
        <Logo className="text-2xl" />
      </div>
      <Container className="max-w-xl w-full">
        <GlassCard className="text-center">
          <GlassCardHeader className="pt-8 pb-4">
            <div className="flex justify-center space-x-2 mb-6">
              {[1, 2].map((step) => ( // Only 2 steps now
                <div
                  key={step}
                  className={`h-3 w-3 rounded-full transition-all duration-300 ${
                    currentStep >= step ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              ))}
            </div>
          </GlassCardHeader>
          <GlassCardContent className="px-6 pb-8 md:px-10 md:pb-10">
            {renderStepContent()}
            <Button
              onClick={handleNextStep}
              size="lg"
              className="mt-8 w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {currentStep < TOTAL_STEPS ? 'Continue' : 'Go to Dashboard'}
              {currentStep < TOTAL_STEPS && <ArrowRight className="ml-2 h-5 w-5" />}
            </Button>
          </GlassCardContent>
        </GlassCard>
         <p className="mt-8 text-center text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} BrieflyAI. All rights reserved.
        </p>
      </Container>
    </div>
  );
}
