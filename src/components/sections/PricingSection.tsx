
"use client";

import React, { useState } from 'react';
import Container from '@/components/layout/Container';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle, GlassCardDescription } from '@/components/shared/GlassCard';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '@/lib/firebase';

interface Tier {
  name: string;
  planId: string;
  price: { monthly: string; annually: string };
  description: string;
  features: string[];
  missingFeatures?: string[];
  cta: string;
  emphasized: boolean;
  isCurrent?: boolean;
  isBetaPaused?: boolean;
}

const pricingTiers: Omit<Tier, 'isCurrent' | 'loadingPlanId'>[] = [
    {
      name: 'BrieflyAI Free',
      planId: 'free',
      price: { monthly: '$0', annually: '$0' },
      description: 'For individuals starting their journey with AI prompting.',
      features: [
        '15 Prompts per month',
        'Basic Prompt Generator',
        'Save up to 5 prompts in Vault',
        'Standard email support',
      ],
      missingFeatures: [
        'Contextual Prompting (Image, PDF, URL)',
        'Model-Specific Adaptation & Compatibility Checker',
        'Prompt Refinement Hub & Analytics',
        'Team Collaboration Features',
      ],
      cta: 'Start for Free',
      emphasized: false,
      isBetaPaused: false, // Free plan is always available
    },
    {
      name: 'BrieflyAI Premium',
      planId: 'premium',
      price: { monthly: '$11', annually: '$118.80' },
      description: 'For power users & professionals who need advanced tools.',
      features: [
        '500 Prompts per month',
        'All Free features, plus:',
        'Advanced Prompt Generator',
        'Contextual Prompting (Image upload)',
        'Model-Specific Adaptation & Compatibility Checker',
        'Prompt Refinement Hub & Analytics',
        'Priority email & chat support',
      ],
      cta: 'Upgrade to Premium',
      emphasized: true,
      isBetaPaused: true,
    },
    {
      name: 'BrieflyAI Unlimited',
      planId: 'unlimited',
      price: { monthly: '$40', annually: '$432' },
      description: 'For teams & businesses that demand unlimited scale.',
      features: [
        'Unlimited Prompts & Vault Storage',
        'All Premium features, plus:',
        'Team Collaboration Workspace (up to 5 users)',
        'Shared Prompt Vaults & Templates',
        'Centralized Billing & User Management',
        'Dedicated Onboarding & Support',
      ],
      cta: 'Contact Sales',
      emphasized: false,
      isBetaPaused: true,
    },
];


export function PricingSection() {
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'annually'>('monthly');
    const { currentUser } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const functions = getFunctions(app, "us-central1");
    const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);

    const handleSubscription = async (tier: Tier) => {
        if (tier.planId === 'free') {
          router.push('/signup');
          return;
        }

        if (tier.isBetaPaused) {
            toast({
              title: 'Subscriptions Paused',
              description: 'Paid subscriptions are temporarily paused during our beta phase. Please check back later!',
              variant: 'default',
            });
            return;
        }

        if (!currentUser) {
            toast({
                title: 'Login Required',
                description: 'Please log in or sign up to subscribe.',
                variant: 'destructive',
            });
            router.push(`/login?redirect=/dashboard/account#pricing`);
            return;
        }

        if(tier.planId === 'unlimited') {
            window.location.href = "mailto:babseli933@gmail.com?subject=BrieflyAI Unlimited Plan Inquiry";
            return;
        }

        setLoadingPlanId(tier.planId);

        try {
            const createSubscriptionFunction = httpsCallable(functions, 'createPaystackSubscription');
            const result: any = await createSubscriptionFunction({
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
            setLoadingPlanId(null);
        }
    };


    return (
        <section id="pricing" className="py-16 md:py-24 bg-gradient-to-b from-background via-indigo-50/10 to-background">
          <Container>
            <div className="text-center mb-12">
              <h2 className="font-headline text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Choose the Plan That's Right For You
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
                Simple, transparent pricing. No hidden fees. Cancel anytime.
              </p>
            </div>
            
            <div className="flex justify-center items-center space-x-4 mb-8">
              <Label htmlFor="billing-cycle" className={cn("text-muted-foreground", billingCycle === 'monthly' && 'text-foreground font-medium')}>
                Monthly
              </Label>
              <Switch
                id="billing-cycle"
                checked={billingCycle === 'annually'}
                onCheckedChange={(checked) => setBillingCycle(checked ? 'annually' : 'monthly')}
                aria-label="Toggle between monthly and annual billing"
              />
              <Label htmlFor="billing-cycle" className={cn("text-muted-foreground", billingCycle === 'annually' && 'text-foreground font-medium')}>
                Annually <span className="text-accent font-semibold">(Save 10%!)</span>
              </Label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {pricingTiers.map((tier) => (
                <GlassCard
                  key={tier.planId}
                  className={cn(
                    "flex flex-col rounded-xl border p-6 shadow-lg transition-all duration-300",
                    tier.emphasized ? "border-2 border-primary scale-105 bg-primary/5" : "bg-card/70 border-border/30"
                  )}
                >
                  {tier.emphasized && (
                    <div className="absolute top-0 right-4 -mt-3">
                      <div className="flex h-8 items-center justify-center rounded-full bg-primary px-4 text-xs font-bold uppercase text-primary-foreground shadow-xl">
                        Most Popular
                      </div>
                    </div>
                  )}
                  <h3 className="font-headline text-xl font-semibold text-foreground">{tier.name}</h3>
                  <p className="mt-4 flex items-baseline text-foreground">
                    <span className="text-4xl font-extrabold tracking-tight">
                        {billingCycle === 'monthly' ? tier.price.monthly : tier.price.annually}
                    </span>
                    <span className="ml-1 text-md font-semibold text-muted-foreground">
                        {tier.price.monthly !== '$0' && (billingCycle === 'monthly' ? '/mo' : '/yr')}
                    </span>
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground h-10">{tier.description}</p>
                  
                  <ul className="mt-6 space-y-3 text-sm flex-grow">
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex items-start">
                        <CheckCircle className="mr-2 h-4 w-4 text-accent flex-shrink-0 mt-0.5" />
                        <span className="text-muted-foreground" dangerouslySetInnerHTML={{ __html: feature.replace(/\*\*(.*?)\*\*/g, '<strong class="text-foreground/90">$1</strong>') }}></span>
                      </li>
                    ))}
                    {tier.missingFeatures && tier.missingFeatures.map((feature) => (
                        <li key={feature} className="flex items-start opacity-60">
                            <XCircle className="mr-2 h-4 w-4 text-muted-foreground/50 flex-shrink-0 mt-0.5" />
                            <span className="text-muted-foreground/80">{feature}</span>
                        </li>
                    ))}
                  </ul>

                  <Button
                    onClick={() => handleSubscription(tier as Tier)}
                    disabled={loadingPlanId === tier.planId}
                    className={cn(
                      "mt-8 w-full",
                      tier.emphasized && tier.planId !== 'free' ? "bg-primary hover:bg-primary/90 text-primary-foreground" : "bg-accent hover:bg-accent/90 text-accent-foreground",
                       tier.planId === 'free' ? "bg-secondary hover:bg-secondary/90 text-secondary-foreground" : "",
                      tier.isBetaPaused && tier.planId !== 'free' ? "bg-muted hover:bg-muted text-muted-foreground cursor-not-allowed" : ""
                    )}
                  >
                    {loadingPlanId === tier.planId ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (tier.isBetaPaused && tier.planId !== 'free' ? 'Paused (Beta)' : tier.cta)}
                  </Button>
                </GlassCard>
              ))}
            </div>
          </Container>
        </section>
    );
}
