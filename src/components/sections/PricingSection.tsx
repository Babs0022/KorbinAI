
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { GlassCard, GlassCardContent, GlassCardDescription, GlassCardFooter, GlassCardHeader, GlassCardTitle } from '@/components/shared/GlassCard';
import Container from '@/components/layout/Container';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '@/lib/firebase'; 
import React, { useState } from 'react';

interface Tier {
  name: string;
  planId: string; 
  price: string;
  frequency: string;
  description: string;
  features: string[];
  cta: string;
  href: string; 
  emphasized: boolean;
  paystackPlanCode?: string; 
}

const pricingTiers: Tier[] = [
  {
    name: 'Free',
    planId: 'free',
    price: '$0',
    frequency: '/mo',
    description: 'Get started and experience the power of optimized prompts.',
    features: [
      '5 prompts per month',
      'Standard prompt optimization',
      'Access to basic survey questions',
      'Community support',
    ],
    cta: 'Start for Free',
    href: '/signup',
    emphasized: false,
  },
  {
    name: 'Premium',
    planId: 'premium',
    // Replace with your actual Paystack Plan Code if you create one on Paystack
    // paystackPlanCode: 'PLN_YOUR_PREMIUM_PLAN_CODE', 
    price: '$10', // Placeholder, ensure your backend uses correct NGN amount or plan code
    frequency: '/mo',
    description: 'For individuals who want to supercharge their AI interactions.',
    features: [
      '50 prompts per month',
      'Advanced prompt optimization',
      'Full access to adaptive survey',
      'Prompt history',
      'Priority email support',
    ],
    cta: 'Go Premium',
    href: '/signup?plan=premium', 
    emphasized: true,
  },
  {
    name: 'Unlimited',
    planId: 'unlimited',
    // Replace with your actual Paystack Plan Code if you create one on Paystack
    // paystackPlanCode: 'PLN_YOUR_UNLIMITED_PLAN_CODE', 
    price: '$35', // Placeholder, ensure your backend uses correct NGN amount or plan code
    frequency: '/mo',
    description: 'For power users and teams who need unlimited prompting capabilities.',
    features: [
      'Unlimited prompts',
      'All Premium features',
      'Early access to new features',
      'Dedicated support channel',
    ],
    cta: 'Go Unlimited',
    href: '/signup?plan=unlimited', 
    emphasized: false,
  },
];

export function PricingSection() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const functions = getFunctions(app); // Initialize Firebase Functions
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handleSubscription = async (tier: Tier) => {
    if (!currentUser) {
      toast({
        title: 'Login Required',
        description: 'Please log in or sign up to subscribe.',
        variant: 'destructive',
      });
      // Consider redirecting to login: router.push('/login');
      return;
    }

    if (tier.planId === 'free') {
      // Free plan usually just involves signing up or is the default state.
      // If already signed up, user is likely on free tier or needs to go to dashboard.
      // You might want to redirect to dashboard or handle this case differently.
      toast({ title: 'Free Plan', description: 'You are currently on the free plan.'});
      return;
    }
    
    setLoadingPlan(tier.planId);

    try {
      // Name of the Cloud Function you will create
      const createSubscriptionFunction = httpsCallable(functions, 'createPaystackSubscription');
      
      const result: any = await createSubscriptionFunction({ 
        userId: currentUser.uid, 
        email: currentUser.email, // Make sure user.email is available and verified
        planId: tier.planId, 
        // If you are using Paystack's "Plans", pass tier.paystackPlanCode
        // paystackPlanCode: tier.paystackPlanCode,
        // Otherwise, your backend will use a predefined amount for the planId
      });

      if (result.data && result.data.authorization_url) {
        // Redirect user to Paystack's checkout page
        window.location.href = result.data.authorization_url;
      } else {
        // Handle cases where authorization_url is not returned
        throw new Error(result.data.error || 'Could not initiate payment. Please try again.');
      }
    } catch (error: any) {
      console.error('Subscription Error:', error);
      toast({
        title: 'Subscription Failed',
        description: error.message || 'An unexpected error occurred. Please contact support if this persists.',
        variant: 'destructive',
      });
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <section id="pricing" className="py-16 md:py-24 bg-gradient-to-br from-background via-indigo-50/20 to-mint-50/20">
      <Container>
        <div className="text-center mb-12">
          <h2 className="font-headline text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Flexible Pricing for Everyone
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Choose the plan that’s right for you. No hidden fees, cancel anytime.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 items-stretch">
          {pricingTiers.map((tier) => (
            <GlassCard
              key={tier.name}
              className={`flex flex-col ${tier.emphasized ? 'border-2 border-primary shadow-2xl' : 'border-border'}`}
            >
              <GlassCardHeader className="pb-4">
                <GlassCardTitle className="font-headline text-2xl">{tier.name}</GlassCardTitle>
                <p className="mt-1">
                  <span className="text-4xl font-bold text-foreground">{tier.price}</span>
                  <span className="text-sm text-muted-foreground">{tier.frequency}</span>
                </p>
                <GlassCardDescription className="mt-2 text-sm">{tier.description}</GlassCardDescription>
              </GlassCardHeader>
              <GlassCardContent className="flex-grow">
                <ul className="space-y-2">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-center text-sm">
                      <CheckCircle2 className="mr-2 h-4 w-4 text-accent flex-shrink-0" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </GlassCardContent>
              <GlassCardFooter className="mt-6">
                {tier.planId === 'free' ? (
                   <Button asChild size="lg" className={`w-full ${tier.emphasized ? 'bg-primary hover:bg-primary/90 text-primary-foreground' : 'bg-accent hover:bg-accent/90 text-accent-foreground'}`}>
                    <Link href={tier.href}>{tier.cta}</Link>
                  </Button>
                ) : (
                  <Button
                    size="lg"
                    onClick={() => handleSubscription(tier)}
                    disabled={loadingPlan === tier.planId || !currentUser}
                    className={`w-full ${tier.emphasized ? 'bg-primary hover:bg-primary/90 text-primary-foreground' : 'bg-accent hover:bg-accent/90 text-accent-foreground'}`}
                  >
                    {loadingPlan === tier.planId ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : tier.cta}
                  </Button>
                )}
              </GlassCardFooter>
            </GlassCard>
          ))}
        </div>
        <p className="mt-8 text-center text-sm text-muted-foreground">
          Payments are securely processed by Paystack.
        </p>
      </Container>
    </section>
  );
}
