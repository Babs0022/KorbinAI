import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  asChild?: boolean;
}

const GlassCard = ({ children, className, ...props }: GlassCardProps) => {
  return (
    <div
      className={cn(
        "rounded-xl border border-white/20 bg-card/50 p-6 shadow-lg backdrop-blur-lg",
        "dark:border-slate-700/50 dark:bg-card/30",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

const GlassCardHeader = CardHeader;
const GlassCardTitle = CardTitle;
const GlassCardDescription = CardDescription;
const GlassCardContent = CardContent;
const GlassCardFooter = CardFooter;

export { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardDescription, GlassCardContent, GlassCardFooter };
