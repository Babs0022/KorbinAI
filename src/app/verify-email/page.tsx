
"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle, GlassCardDescription } from '@/components/shared/GlassCard';
import { Logo } from '@/components/shared/Logo';
import { MailCheck, Loader2, AlertTriangle, ExternalLink } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { sendEmailVerification } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentUser, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [email, setEmail] = useState<string | null>(null);
  const [isCheckingVerification, setIsCheckingVerification] = useState(false);
  const [isResendingEmail, setIsResendingEmail] = useState(false);

  useEffect(() => {
    const emailFromQuery = searchParams.get('email');
    if (emailFromQuery) {
      setEmail(emailFromQuery);
    } else if (currentUser?.email) {
      setEmail(currentUser.email);
    }
  }, [searchParams, currentUser]);

  const handleCheckVerification = async () => {
    if (!currentUser) {
      toast({
        title: "Not Logged In",
        description: "It seems you're not logged in. Please try signing up or logging in again.",
        variant: "destructive"
      });
      router.push('/login');
      return;
    }

    setIsCheckingVerification(true);
    try {
      await currentUser.reload();
      if (currentUser.emailVerified) {
        toast({
          title: "Email Verified!",
          description: "Redirecting you to onboarding...",
        });
        router.push('/onboarding');
      } else {
        toast({
          title: "Email Not Verified",
          description: "Your email is still not verified. Please check your inbox (and spam folder) for the verification link, or try resending it.",
          variant: "destructive",
          duration: 7000,
        });
      }
    } catch (error) {
      console.error("Error checking verification:", error);
      toast({
        title: "Verification Check Failed",
        description: "Could not check your verification status. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsCheckingVerification(false);
    }
  };

  const handleResendVerificationEmail = async () => {
    if (!currentUser) {
      toast({ title: "Error", description: "User not found. Please log in.", variant: "destructive"});
      return;
    }
    setIsResendingEmail(true);
    try {
      await sendEmailVerification(currentUser);
      toast({
        title: "Verification Email Resent",
        description: `A new verification email has been sent to ${currentUser.email}. Please check your inbox.`,
      });
    } catch (error: any) {
      console.error("Error resending verification email:", error);
      let desc = "Could not resend verification email. Please try again later.";
      if (error.code === "auth/too-many-requests") {
        desc = "Too many requests to resend verification email. Please wait a few minutes before trying again.";
      }
      toast({ title: "Resend Failed", description: desc, variant: "destructive" });
    } finally {
      setIsResendingEmail(false);
    }
  };
  
  // If auth is still loading, or if there's no current user but an email was passed (e.g. direct navigation after signup)
  if (authLoading && !email) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[200px]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading user information...</p>
      </div>
    );
  }

  return (
    <>
      <MailCheck className="h-16 w-16 text-primary mb-6" />
      <GlassCardTitle className="font-headline text-3xl mb-3">Verify Your Email</GlassCardTitle>
      <GlassCardDescription className="text-lg text-muted-foreground mb-6 max-w-md">
        We've sent a verification link to{' '}
        <strong className="text-foreground">{email || 'your email address'}</strong>.
        Please click the link in the email to continue.
      </GlassCardDescription>
      <p className="text-sm text-muted-foreground mb-6">
        If you don&apos;t see the email, please check your spam or junk folder.
      </p>
      <div className="space-y-4 w-full max-w-xs">
        <Button
          onClick={handleCheckVerification}
          size="lg"
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
          disabled={isCheckingVerification || isResendingEmail}
        >
          {isCheckingVerification ? (
            <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Checking...</>
          ) : (
            "I've Verified My Email, Continue"
          )}
        </Button>
        <Button
          variant="outline"
          onClick={handleResendVerificationEmail}
          size="lg"
          className="w-full"
          disabled={isCheckingVerification || isResendingEmail || !currentUser}
        >
          {isResendingEmail ? (
            <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Resending...</>
          ) : (
            "Resend Verification Email"
          )}
        </Button>
      </div>
       <p className="mt-8 text-xs text-muted-foreground">
        Opened the link on a different device? You can{' '}
        <a href="/login" className="text-primary hover:underline">log in here</a>
        {' '}once verified.
      </p>
    </>
  );
}


export default function VerifyEmailPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background via-indigo-50/50 to-mint-50/50 p-4">
      <div className="mb-8 text-center">
        <Logo className="text-2xl" />
      </div>
      <GlassCard className="w-full max-w-lg text-center">
        <GlassCardHeader className="pt-8 pb-4">
          {/* Header content if needed, or remove if title is handled by content */}
        </GlassCardHeader>
        <GlassCardContent className="px-6 pb-8 md:px-10 md:pb-10 min-h-[350px] flex flex-col items-center justify-center">
          <Suspense fallback={<div className="flex flex-col items-center justify-center min-h-[200px]"><Loader2 className="h-12 w-12 animate-spin text-primary" /><p className="mt-4 text-muted-foreground">Loading...</p></div>}>
            <VerifyEmailContent />
          </Suspense>
        </GlassCardContent>
      </GlassCard>
      <p className="mt-8 text-center text-xs text-muted-foreground">
        &copy; {new Date().getFullYear()} BrieflyAI. All rights reserved.
      </p>
    </div>
  );
}
