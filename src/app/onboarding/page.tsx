
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle, GlassCardDescription } from '@/components/shared/GlassCard';
import { Logo } from '@/components/shared/Logo';
import { Loader2, ArrowRight, Sparkles, Lightbulb, Clock, Star, PartyPopper } from 'lucide-react';
import Container from '@/components/layout/Container';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { db } from '@/lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

const TOTAL_STEPS = 5; 

export default function OnboardingPage() {
  const { currentUser, loading: authLoading, displayName } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [currentStep, setCurrentStep] = useState(1);
  const [aiUsageFrequency, setAiUsageFrequency] = useState('');
  const [aiResultSatisfaction, setAiResultSatisfaction] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push('/login');
    }
  }, [currentUser, authLoading, router]);

  const handleNextStep = async () => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(prev => prev + 1);
    } else {
      // Final step: Save data and redirect
      if (!currentUser) {
        toast({ title: "Error", description: "User not found. Cannot save onboarding data.", variant: "destructive"});
        router.push('/dashboard'); // Still proceed to dashboard
        return;
      }
      if (!aiUsageFrequency || !aiResultSatisfaction) {
        toast({ title: "Incomplete Survey", description: "Please answer all questions before proceeding.", variant: "destructive"});
        // Optionally prevent moving forward if answers are mandatory
        // For now, we'll allow proceeding but log it or skip saving.
        // Or, we could just save what we have.
        if(!aiUsageFrequency && !aiResultSatisfaction) { // only if both are empty, otherwise save what's there.
            router.push('/dashboard');
            return;
        }
      }

      setIsSaving(true);
      try {
        const onboardingData = {
          aiUsageFrequency: aiUsageFrequency || null, // Store null if empty
          aiResultSatisfaction: aiResultSatisfaction || null,
          completedAt: serverTimestamp(),
        };
        const onboardingDocRef = doc(db, `users/${currentUser.uid}/onboardingInfo/surveyResponses`);
        await setDoc(onboardingDocRef, onboardingData, { merge: true }); // Use merge if doc might exist
        toast({ title: "Onboarding Complete!", description: "Your preferences have been noted."});
      } catch (error) {
        console.error("Error saving onboarding data:", error);
        toast({ title: "Save Error", description: "Could not save your onboarding responses. Proceeding anyway.", variant: "destructive"});
      } finally {
        setIsSaving(false);
        router.push('/dashboard');
      }
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
            <ul className="space-y-2 text-left text-muted-foreground list-disc list-inside pl-4 mb-6 text-sm">
              <li><strong>Intelligent Prompt Generator:</strong> Turn goals into optimized prompts.</li>
              <li><strong>Model-Specific Adaptation:</strong> Tailor prompts for GPT, Claude, DALL-E & more.</li>
              <li><strong>Advanced Analysis:</strong> Get quality scores and actionable feedback.</li>
              <li><strong>Prompt Vault:</strong> Save and organize your best creations.</li>
            </ul>
          </>
        );
      case 3:
        return (
          <>
            <Clock className="h-12 w-12 text-primary mb-4" />
            <GlassCardTitle className="font-headline text-3xl mb-3">Your AI Habits</GlassCardTitle>
            <GlassCardDescription className="text-lg text-muted-foreground mb-6">
              Understanding your current AI usage helps us tailor BrieflyAI for you.
            </GlassCardDescription>
            <div className="text-left space-y-3">
              <Label className="font-medium text-foreground">How often do you typically use AI tools?</Label>
              <RadioGroup value={aiUsageFrequency} onValueChange={setAiUsageFrequency} className="space-y-2">
                {[
                  { value: "daily", label: "Daily" },
                  { value: "weekly", label: "Weekly" },
                  { value: "monthly", label: "Monthly" },
                  { value: "rarely", label: "Rarely / Just Starting" },
                ].map(opt => (
                  <div key={opt.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={opt.value} id={`freq-${opt.value}`} />
                    <Label htmlFor={`freq-${opt.value}`} className="font-normal text-muted-foreground">{opt.label}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </>
        );
      case 4:
        return (
          <>
            <Star className="h-12 w-12 text-primary mb-4" />
            <GlassCardTitle className="font-headline text-3xl mb-3">Your AI Experience</GlassCardTitle>
            <GlassCardDescription className="text-lg text-muted-foreground mb-6">
              Let us know about the quality of results you usually achieve with AI.
            </GlassCardDescription>
            <div className="text-left space-y-3">
              <Label className="font-medium text-foreground">How would you rate the results you typically get from AI tools?</Label>
              <RadioGroup value={aiResultSatisfaction} onValueChange={setAiResultSatisfaction} className="space-y-2">
                {[
                  { value: "excellent", label: "Excellent (Usually get what I need)" },
                  { value: "good", label: "Good (Often helpful, some tweaking needed)" },
                  { value: "average", label: "Average (Hit or miss)" },
                  { value: "fair", label: "Fair (Often requires significant effort)" },
                  { value: "poor", label: "Poor (Rarely useful)" },
                ].map(opt => (
                  <div key={opt.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={opt.value} id={`sat-${opt.value}`} />
                    <Label htmlFor={`sat-${opt.value}`} className="font-normal text-muted-foreground">{opt.label}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </>
        );
      case 5:
        return (
          <>
            <PartyPopper className="h-12 w-12 text-primary mb-4" />
            <GlassCardTitle className="font-headline text-3xl mb-3">You&apos;re All Set!</GlassCardTitle>
            <GlassCardDescription className="text-lg text-muted-foreground mb-6">
              Welcome, {displayName || 'Innovator'}, to the BrieflyAI VERSE!
            </GlassCardDescription>
            <p className="text-sm text-muted-foreground">
              We&apos;re excited to help you master AI prompting.
            </p>
          </>
        );
      default:
        return null;
    }
  };

  const isSurveyStep = currentStep === 3 || currentStep === 4;
  const isSurveyAnswerMissing = (currentStep === 3 && !aiUsageFrequency) || (currentStep === 4 && !aiResultSatisfaction);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background via-indigo-50/50 to-mint-50/50 p-4">
      <div className="mb-8">
        <Logo className="text-2xl" />
      </div>
      <Container className="max-w-xl w-full">
        <GlassCard className="text-center">
          <GlassCardHeader className="pt-8 pb-4">
            <div className="flex justify-center space-x-2 mb-6">
              {Array.from({ length: TOTAL_STEPS }).map((_, index) => (
                <div
                  key={index}
                  className={`h-2.5 w-2.5 rounded-full transition-all duration-300 ${
                    currentStep >= index + 1 ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              ))}
            </div>
          </GlassCardHeader>
          <GlassCardContent className="px-6 pb-8 md:px-10 md:pb-10 min-h-[300px] flex flex-col justify-center">
            {renderStepContent()}
          </GlassCardContent>
          <div className="px-6 pb-8 md:px-10">
             <Button
              onClick={handleNextStep}
              size="lg"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              disabled={isSaving || (isSurveyStep && isSurveyAnswerMissing)}
            >
              {isSaving ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Saving & Entering...</> : (currentStep < TOTAL_STEPS ? 'Continue' : `Enter the VERSE (Go to Dashboard)`)}
              {currentStep < TOTAL_STEPS && !isSaving && <ArrowRight className="ml-2 h-5 w-5" />}
            </Button>
            {isSurveyStep && isSurveyAnswerMissing && (
                <p className="text-xs text-destructive mt-2">Please select an option to continue.</p>
            )}
          </div>
        </GlassCard>
         <p className="mt-8 text-center text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} BrieflyAI. All rights reserved.
        </p>
      </Container>
    </div>
  );
}
