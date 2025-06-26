
"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import Container from '@/components/layout/Container';
import { GlassCard } from '@/components/shared/GlassCard';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { CheckCircle, XCircle, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";


interface Tier {
  name: string;
  planId: string;
  price: { monthly: string; annually: string };
  paymentLink: { monthly: string; annually: string };
  cryptoPaymentLink: { monthly: string; annually: string };
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
      cryptoPaymentLink: { monthly: '#', annually: '#' },
      description: 'For individuals and teams starting their journey with AI prompting.',
      features: [
        'Unlimited Prompts',
        'Full Prompt Vault & History',
        'Advanced Prompt Generation',
        'Contextual Prompting & Analysis',
        'Model-Specific Adaptation & A/B Testing',
        'Prompt Refinement Hub & Analytics',
        'Prompt Academy Access',
      ],
       missingFeatures: [
        'Team Collaboration Hub',
        'Shared Prompt Vaults & Templates',
      ],
      cta: 'Start for Free',
      emphasized: true,
    },
];


export function PricingSection() {
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'annually'>('monthly');
    const { currentUser } = useAuth();
    const { toast } = useToast();

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
    
    const handleCryptoPayment = (tier: Tier) => {
      if (!currentUser) {
        toast({
          title: "Login Required",
          description: "Please log in or create an account to pay with crypto.",
          variant: "destructive"
        });
        return;
      }
      
      const baseUrl = billingCycle === 'monthly' ? tier.cryptoPaymentLink.monthly : tier.cryptoPaymentLink.annually;

      if (!baseUrl || baseUrl === '#') {
        toast({ title: "Coming Soon", description: "Crypto payment links are not configured yet.", variant: "default"});
        return;
      }

      const orderId = `${currentUser.uid}_${tier.planId}_${billingCycle}`;
      const finalUrl = `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}order_id=${encodeURIComponent(orderId)}`;
      window.open(finalUrl, '_blank');
    };

    return (
        <section id="pricing" className="py-16 md:py-24 bg-gradient-to-b from-background via-indigo-50/10 to-background">
          <Container>
            <div className="text-center mb-12">
              <h2 className="font-headline text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Free for Everyone During Beta
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
                Get started with our powerful suite of prompt engineering tools, completely free. Paid plans for advanced team features are coming soon.
              </p>
            </div>
            
            <div className="flex justify-center items-center space-x-4 mb-8">
              {/* Hide the billing cycle switch for now */}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-1 gap-8 max-w-md mx-auto">
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
                        Free During Beta
                      </div>
                    </div>
                  )}
                  <h3 className="font-headline text-xl font-semibold text-foreground">{tier.name}</h3>
                  <p className="mt-4 flex items-baseline text-foreground">
                    <span className="text-4xl font-extrabold tracking-tight">
                        {tier.price.monthly}
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
                             "bg-accent hover:bg-accent/90 text-accent-foreground"
                        )}
                        >
                        <Link href="/signup">{tier.cta}</Link>
                    </Button>
                  </div>
                </GlassCard>
              ))}
            </div>
            <div className="text-center mt-8">
                <p className="text-xs text-muted-foreground">
                    Payments are not required at this time. All features except Team Collaboration are free to use.
                </p>
            </div>
          </Container>
        </section>
    );
}
