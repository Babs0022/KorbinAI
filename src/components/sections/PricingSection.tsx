
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
import { useRouter } from 'next/navigation';

interface Tier {
  name: string;
  planId: string; // This will be 'premium' or 'unlimited'
  price: string; // Display price
  frequency: string;
  description: string;
  features: string[];
  cta: string;
  href?: string; // For free tier link
  emphasized: boolean;
}

const pricingTiers: Tier[] = [
  {
    name: 'Free',
    planId: 'free',
    price: 'NGN 0',
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
    planId: 'premium', // This ID is used to call the backend
    price: 'NGN 16,000',
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
    emphasized: true,
  },
  {
    name: 'Unlimited',
    planId: 'unlimited', // This ID is used to call the backend
    price: 'NGN 56,000',
    frequency: '/mo',
    description: 'For power users and teams who need unlimited prompting capabilities.',
    features: [
      'Unlimited prompts',
      'All Premium features',
      'Early access to new features',
      'Dedicated support channel',
    ],
    cta: 'Go Unlimited',
    emphasized: false,
  },
];

export function PricingSection() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const functions = getFunctions(app);
  const router = useRouter();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handleSubscription = async (tier: Tier) => {
    if (!currentUser) {
      toast({
        title: 'Login Required',
        description: 'Please log in or sign up to subscribe.',
        variant: 'destructive',
      });
      router.push('/login?redirect=/'); // Redirect to login, then back to home/pricing
      return;
    }

    if (tier.planId === 'free') {
      // User is already on free or can just proceed to dashboard if logged in.
      router.push('/dashboard');
      return;
    }
    
    setLoadingPlan(tier.planId);

    try {
      const createSubscriptionFunction = httpsCallable(functions, 'createPaystackSubscription');
      
      const result: any = await createSubscriptionFunction({ 
        // userId is derived from context.auth in the Cloud Function
        email: currentUser.email, 
        planId: tier.planId, 
      });

      if (result.data && result.data.authorization_url) {
        window.location.href = result.data.authorization_url;
      } else {
        throw new Error(result.data?.error || 'Could not initiate payment. Please try again.');
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
            Choose the plan that’s right for you. All prices in Nigerian Naira (NGN). No hidden fees, cancel anytime.
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
                {tier.planId === 'free' && tier.href ? (
                   <Button asChild size="lg" className={`w-full ${tier.emphasized ? 'bg-primary hover:bg-primary/90 text-primary-foreground' : 'bg-accent hover:bg-accent/90 text-accent-foreground'}`}>
                    <Link href={tier.href}>{tier.cta}</Link>
                  </Button>
                ) : (
                  <Button
                    size="lg"
                    onClick={() => handleSubscription(tier)}
                    disabled={loadingPlan === tier.planId}
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

