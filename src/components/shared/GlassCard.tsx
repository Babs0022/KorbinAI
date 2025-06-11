import React from 'react';
import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

const GlassCard = React.forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <Card
      ref={ref}
      className={cn(
        "rounded-xl border-white/20 bg-card/60 shadow-lg backdrop-blur-md",
        "dark:border-slate-700/50 dark:bg-card/40",
        className
      )}
      {...props}
    >
      {children}
    </Card>
  )
);
GlassCard.displayName = 'GlassCard';

const GlassCardHeader = CardHeader;
const GlassCardTitle = CardTitle;
const GlassCardDescription = CardDescription;
const GlassCardContent = CardContent;
const GlassCardFooter = CardFooter;

export { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardDescription, GlassCardContent, GlassCardFooter };
