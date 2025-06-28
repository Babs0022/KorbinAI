
"use client";

import Link from 'next/link';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle, GlassCardDescription } from '@/components/shared/GlassCard';
import { ArrowRight, Lock, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '../ui/skeleton';
import { Badge } from '../ui/badge';

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
  const { subscription, subscriptionLoading, isAdmin } = useAuth();
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
        </GlassCard>
    )
  }

  let hasAccess = true;
  let requiredPlan = '';

  if (feature.isUnlimited) {
    requiredPlan = 'Unlimited';
    hasAccess = subscription?.planId === 'unlimited' || isAdmin;
  } else {
    hasAccess = true;
  }

  const isEnabled = feature.enabled;

  const cardContent = (
    <GlassCard className={cn(
      "group flex flex-col h-full transition-all duration-300 ease-in-out relative",
      isEnabled ? "hover:shadow-2xl hover:scale-[1.02] hover:border-primary/30 cursor-pointer" : "opacity-70 cursor-not-allowed bg-muted/30"
    )}>
      <GlassCardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className={cn("p-2 rounded-lg", isEnabled ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground" )}>
            <Icon className="h-6 w-6" />
          </div>
           <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform duration-300 group-hover:translate-x-1 group-hover:text-primary" />
        </div>
      </GlassCardHeader>
      <GlassCardContent className="flex-grow flex flex-col">
        <GlassCardTitle className="text-md font-headline mb-1">{feature.title}</GlassCardTitle>
        <GlassCardDescription className="text-xs text-muted-foreground leading-relaxed flex-grow">
          {feature.description}
        </GlassCardDescription>
      </GlassCardContent>
      {!hasAccess && isEnabled && (
         <div className="px-6 pb-4">
             <Badge variant="destructive" className="text-xs"><Lock className="mr-1.5 h-3 w-3"/>Requires {requiredPlan}</Badge>
        </div>
      )}
    </GlassCard>
  );

  if (!isEnabled || !hasAccess) {
    return (
       <div className="h-full">
         {cardContent}
       </div>
    );
  }

  return (
    <Link href={feature.href} className="h-full">
      {cardContent}
    </Link>
  );
}
