
"use client";

import Link from 'next/link';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle, GlassCardDescription } from '@/components/shared/GlassCard';
import { Button } from '@/components/ui/button';
import { ArrowRight, Lock, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '../ui/skeleton';

export interface FeatureInfo {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon | React.ElementType;
  enabled: boolean;
  isPremium?: boolean;
  isUnlimited?: boolean;
}

interface FeatureCardProps {
  feature: FeatureInfo;
}

export function FeatureCard({ feature }: FeatureCardProps) {
  const { subscription, subscriptionLoading } = useAuth();
  const Icon = feature.icon;
  
  if (subscriptionLoading) {
    return (
        <GlassCard className="flex flex-col h-full opacity-60">
            <GlassCardHeader>
                <Skeleton className="h-6 w-3/4" />
            </GlassCardHeader>
            <GlassCardContent className="flex-grow space-y-2">
                 <Skeleton className="h-4 w-full" />
                 <Skeleton className="h-4 w-5/6" />
            </GlassCardContent>
            <div className="p-4 pt-2 mt-auto">
                <Skeleton className="h-9 w-full" />
            </div>
        </GlassCard>
    )
  }

  let hasAccess = true;
  let requiredPlan = '';

  // Only the Team Hub feature requires a specific paid plan for now.
  if (feature.isUnlimited) {
    requiredPlan = 'Unlimited';
    hasAccess = subscription?.planId === 'unlimited';
  } else {
    // All other features, including premium ones, are now considered accessible for everyone.
    hasAccess = true;
  }

  const isEnabled = feature.enabled && hasAccess;

  return (
    <GlassCard className={cn(
      "flex flex-col h-full transition-all duration-300 ease-in-out relative",
      isEnabled ? "hover:shadow-2xl hover:scale-[1.02]" : "opacity-70 cursor-not-allowed bg-muted/30"
    )}>
      <GlassCardHeader className="pb-3">
        <div className="flex items-center mb-3">
          <div className={cn("p-2 rounded-lg mr-3", isEnabled ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground" )}>
            <Icon className="h-6 w-6" />
          </div>
          <GlassCardTitle className="text-lg font-headline">{feature.title}</GlassCardTitle>
        </div>
      </GlassCardHeader>
      <GlassCardContent className="flex-grow">
        <GlassCardDescription className="text-sm text-muted-foreground leading-relaxed">
          {feature.description}
        </GlassCardDescription>
      </GlassCardContent>
      <div className="p-4 pt-2 mt-auto">
        {feature.enabled ? (
          hasAccess ? (
            <Button variant="outline" size="sm" asChild className="w-full">
              <Link href={feature.href}>
                Explore <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          ) : (
             <Button variant="default" size="sm" className="w-full bg-muted hover:bg-muted text-muted-foreground cursor-not-allowed" disabled>
                <Lock className="mr-2 h-4 w-4" /> Beta Locked
            </Button>
          )
        ) : (
          <Button variant="outline" size="sm" className="w-full" disabled>
            Coming Soon
          </Button>
        )}
      </div>
    </GlassCard>
  );
}
