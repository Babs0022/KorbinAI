
"use client";

import Link from 'next/link';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle, GlassCardDescription } from '@/components/shared/GlassCard';
import { Button } from '@/components/ui/button';
import { ArrowRight, type LucideIcon } from 'lucide-react'; 
import { cn } from '@/lib/utils';

export interface FeatureInfo {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon | React.ElementType; // Allow React.ElementType for custom icons if needed
  enabled: boolean; 
}

interface FeatureCardProps {
  feature: FeatureInfo;
}

export function FeatureCard({ feature }: FeatureCardProps) {
  const Icon = feature.icon;

  return (
    <GlassCard className={cn(
      "flex flex-col h-full transition-all duration-300 ease-in-out",
      feature.enabled ? "hover:shadow-2xl hover:scale-[1.02]" : "opacity-60 cursor-not-allowed"
    )}>
      <GlassCardHeader className="pb-3">
        <div className="flex items-center mb-3">
          <div className={cn("p-2 rounded-lg mr-3", feature.enabled ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground" )}>
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
          <Button variant="outline" size="sm" asChild className="w-full">
            <Link href={feature.href}>
              Explore <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        ) : (
          <Button variant="outline" size="sm" className="w-full" disabled>
            Coming Soon
          </Button>
        )}
      </div>
    </GlassCard>
  );
}
