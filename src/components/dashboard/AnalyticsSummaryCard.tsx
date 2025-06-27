
"use client";

import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/shared/GlassCard';
import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';

interface AnalyticsSummaryCardProps {
  title: string;
  value: string;
  description?: string;
  icon: LucideIcon;
  className?: string;
}

export function AnalyticsSummaryCard({ title, value, description, icon: Icon, className }: AnalyticsSummaryCardProps) {
  return (
     <Link href="/dashboard/analytics">
        <GlassCard className={className + " transition-all hover:border-primary/30 hover:shadow-xl"}>
        <GlassCardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <GlassCardTitle className="text-sm font-medium text-muted-foreground">
            {title}
            </GlassCardTitle>
            <Icon className="h-5 w-5 text-primary" />
        </GlassCardHeader>
        <GlassCardContent>
            <div className="text-2xl font-bold text-foreground">{value}</div>
            {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
        </GlassCardContent>
        </GlassCard>
    </Link>
  );
}
