
"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import Container from '@/components/layout/Container';
import { GlassCard } from '@/components/shared/GlassCard';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";


interface Tier {
  name: string;
  planId: string;
  price: { monthly: string; annually: string };
  paymentLink: { monthly: string; annually: string };
  description: string;
  features: string[];
  missingFeatures?: string[];
  cta: string;
  emphasized: boolean;
}

const pricingTiers: Tier[] = [
    {
      name: 'BrieflyAI Free',
      planId: 'free',
      price: { monthly: 'NGN 0', annually: 'NGN 0' },
      paymentLink: { monthly: '/signup', annually: '/signup' },
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
    },
    {
      name: 'BrieflyAI Premium',
      planId: 'premium',
      price: { monthly: 'NGN 100', annually: 'NGN 100' }, // Test Price
      paymentLink: {
          monthly: 'https://paystack.shop/pay/adn4uwot-5',
          annually: 'https://paystack.shop/pay/sq8pii8rod'
      },
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
    },
    {
      name: 'BrieflyAI Unlimited',
      planId: 'unlimited',
      price: { monthly: 'NGN 100', annually: 'NGN 100' }, // Test Price
      paymentLink: {
          monthly: 'https://paystack.shop/pay/cnfqzc7xw1',
          annually: 'https://paystack.shop/pay/w7iln7hu8e'
      },
      description: 'For teams & businesses that demand unlimited scale.',
      features: [
        'Unlimited Prompts & Vault Storage',
        'All Premium features, plus:',
        'Team Collaboration Workspace (up to 5 users)',
        'Shared Prompt Vaults & Templates',
        'Centralized Billing & User Management',
        'Dedicated Onboarding & Support',
      ],
      cta: 'Go Unlimited',
      emphasized: false,
    },
];


export function PricingSection() {
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'annually'>('monthly');
    const { currentUser } = useAuth();

    const getPaymentLink = (tier: Tier) => {
        let link = billingCycle === 'monthly' ? tier.paymentLink.monthly : tier.paymentLink.annually;

        if(tier.planId === 'free') {
            return link;
        }

        if (currentUser && currentUser.email) {
            if (link.includes('?')) {
                link += `&email=${encodeURIComponent(currentUser.email)}`;
            } else {
                link += `?email=${encodeURIComponent(currentUser.email)}`;
            }
        }
        return link;
    };

    return (
        <section id="pricing" className="py-16 md:py-24 bg-gradient-to-b from-background via-indigo-50/10 to-background">
          <Container>
            <div className="text-center mb-12">
              <h2 className="font-headline text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Choose the Plan That's Right For You
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
                Simple, transparent pricing in Nigerian Naira (NGN). No hidden fees. Cancel anytime.
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
                        {tier.price.monthly !== 'NGN 0' && (billingCycle === 'monthly' ? '/mo' : '/yr')}
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
                  <div className="mt-8 flex flex-col gap-2">
                    <Button
                      asChild
                      className={cn(
                        "w-full",
                        tier.emphasized && tier.planId !== 'free' ? "bg-primary hover:bg-primary/90 text-primary-foreground" : "bg-accent hover:bg-accent/90 text-accent-foreground",
                         tier.planId === 'free' ? "bg-secondary hover:bg-secondary/90 text-secondary-foreground" : ""
                      )}
                    >
                      <a href={getPaymentLink(tier)} rel="noopener noreferrer">
                          {tier.cta}
                      </a>
                    </Button>
                    {tier.planId !== 'free' && (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="outline" className="w-full" disabled>
                                        Pay with Crypto
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                <p>Crypto payments coming soon!</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )}
                  </div>
                </GlassCard>
              ))}
            </div>
            <div className="text-center mt-8">
                <p className="text-xs text-muted-foreground">
                    Important: Please ensure the email you use for payment matches your BrieflyAI account email.
                </p>
            </div>
          </Container>
        </section>
    );
}
