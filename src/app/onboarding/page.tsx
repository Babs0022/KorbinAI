
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle, GlassCardDescription } from '@/components/shared/GlassCard';
import { Logo } from '@/components/shared/Logo';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, ArrowRight, Gift, Copy, CheckCircle, Sparkles, Lightbulb } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Container from '@/components/layout/Container';

const TOTAL_STEPS = 3;

export default function OnboardingPage() {
  const { currentUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [currentStep, setCurrentStep] = useState(1);
  const [userReferralCode, setUserReferralCode] = useState<string | null>(null);
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [isCodeCopied, setIsCodeCopied] = useState(false);

  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push('/login'); // Redirect if not logged in and auth state loaded
    }
  }, [currentUser, authLoading, router]);

  const generateUserReferralCode = async () => {
    if (!currentUser || userReferralCode) return; // Don't generate if already exists or no user
    setIsGeneratingCode(true);
    try {
      // Check if user already has an active code to prevent duplicates from multiple attempts
      const q = query(
        collection(db, "referralCodes"),
        where("userId", "==", currentUser.uid),
        where("isActive", "==", true)
      );
      const existingCodesSnapshot = await getDocs(q);
      if (!existingCodesSnapshot.empty) {
        setUserReferralCode(existingCodesSnapshot.docs[0].data().code as string);
        toast({ title: "Referral Code Found", description: "Your existing referral code has been loaded." });
        setIsGeneratingCode(false);
        return;
      }

      const code = `BRIEFLY${currentUser.uid.substring(0, 4)}${Math.random().toString(36).substring(2, 7)}`.toUpperCase();
      const newCodeData = {
        code,
        userId: currentUser.uid,
        isActive: true,
        usesLeft: 10, // Default uses for a new user's code
        createdAt: serverTimestamp(),
        usersReferred: [],
      };
      await addDoc(collection(db, "referralCodes"), newCodeData);
      setUserReferralCode(code);
      toast({ title: "Referral Code Generated!", description: "Share it with your friends!" });
    } catch (error) {
      console.error("Error generating user referral code:", error);
      toast({ title: "Code Generation Failed", description: "Could not generate your referral code. Please try again later or contact support.", variant: "destructive" });
    } finally {
      setIsGeneratingCode(false);
    }
  };
  
  useEffect(() => {
    if (currentStep === TOTAL_STEPS && !userReferralCode && !isGeneratingCode && currentUser) {
      generateUserReferralCode();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, userReferralCode, isGeneratingCode, currentUser]);


  const handleNextStep = () => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(prev => prev + 1);
    } else {
      router.push('/dashboard');
    }
  };

  const handleCopyCode = () => {
    if (userReferralCode) {
      navigator.clipboard.writeText(userReferralCode);
      setIsCodeCopied(true);
      toast({ title: "Copied!", description: "Referral code copied to clipboard." });
      setTimeout(() => setIsCodeCopied(false), 2000);
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
              You&apos;re one step away from exploring these features!
            </p>
          </>
        );
      case 3:
        return (
          <>
            <Gift className="h-12 w-12 text-primary mb-4" />
            <GlassCardTitle className="font-headline text-3xl mb-3">You&apos;re All Set!</GlassCardTitle>
            <GlassCardDescription className="text-lg text-muted-foreground mb-6">
              As a new member, here&apos;s your personal referral code. Share it with friends to invite them to BrieflyAI!
            </GlassCardDescription>
            {isGeneratingCode && (
              <div className="my-4 flex items-center justify-center">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                <p className="text-muted-foreground">Generating your code...</p>
              </div>
            )}
            {userReferralCode && (
              <div className="my-6 space-y-2">
                <Label htmlFor="referralCodeDisplay" className="text-sm font-medium text-muted-foreground">Your Unique Referral Code:</Label>
                <div className="flex items-center space-x-2">
                  <Input id="referralCodeDisplay" value={userReferralCode} readOnly className="font-mono text-lg h-11 bg-muted/50 border-primary/30" />
                  <Button variant="outline" size="lg" onClick={handleCopyCode} className="h-11">
                    {isCodeCopied ? <CheckCircle className="mr-2 h-4 w-4 text-green-500" /> : <Copy className="mr-2 h-4 w-4" />}
                    {isCodeCopied ? 'Copied!' : 'Copy'}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Keep this code handy. You can also find it on your Account page.</p>
              </div>
            )}
            {!userReferralCode && !isGeneratingCode && (
                 <p className="my-4 text-destructive">Could not generate referral code. You can try from your account page later.</p>
            )}
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
             {/* Progress Bubbles */}
            <div className="flex justify-center space-x-2 mb-6">
              {[1, 2, 3].map((step) => (
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
              disabled={isGeneratingCode || (currentStep === TOTAL_STEPS && !userReferralCode)}
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

