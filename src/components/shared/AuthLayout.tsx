import type { ReactNode } from 'react';
import { Logo } from '@/components/shared/Logo';
import { GlassCard } from './GlassCard';

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  description?: string;
}

export function AuthLayout({ children, title, description }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background via-indigo-50/50 to-mint-50/50 p-4">
      <div className="mb-8 text-center">
        <Logo className="text-3xl" />
      </div>
      <GlassCard className="w-full max-w-md">
        <div className="p-6 sm:p-8">
          <h1 className="mb-2 text-center font-headline text-2xl font-bold text-foreground">
            {title}
          </h1>
          {description && (
            <p className="mb-6 text-center text-sm text-muted-foreground">
              {description}
            </p>
          )}
          {children}
        </div>
      </GlassCard>
       <p className="mt-8 text-center text-xs text-muted-foreground">
        &copy; {new Date().getFullYear()} BrieflyAI. All rights reserved.
      </p>
    </div>
  );
}
