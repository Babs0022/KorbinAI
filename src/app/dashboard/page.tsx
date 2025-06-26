
"use client";

import React, { useState, useEffect } from 'react';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { MinimalFooter } from '@/components/layout/MinimalFooter';
import Container from '@/components/layout/Container';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Loader2, AlertTriangle, BarChart3, Brain, ScrollText, Settings2, TestTubes, FileText, Lightbulb, Puzzle, School, Repeat, Rocket, Users, Edit3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PromptInputForm } from '@/components/dashboard/PromptInputForm';
import { FeatureCard, type FeatureInfo } from '@/components/dashboard/FeatureCard';

const featureCards: FeatureInfo[] = [
    {
    title: 'Prompt Vault & History',
    description: 'Save, search, and manage all your optimized prompts in one secure, centralized location.',
    href: '/dashboard/prompt-vault',
    icon: ScrollText,
    enabled: true,
  },
  {
    title: 'Refinement & Optimization Hub',
    description: 'Iteratively improve saved prompts. Our engine learns from your history to provide contextual AI suggestions and automatically evolved prompts.',
    href: '/dashboard/refinement-hub',
    icon: Settings2,
    enabled: true,
    isPremium: true,
  },
   {
    title: 'Team Collaboration Hub',
    description: 'Share, manage, and collaborate on prompts with your team in a shared workspace.',
    href: '/dashboard/collaboration',
    icon: Users,
    enabled: true,
    isUnlimited: true,
  },
  {
    title: 'Model-Specific Adapter',
    description: 'Automatically tailor any prompt for optimal performance on specific AI models like GPT-4, Claude 3, and more.',
    href: '/dashboard/model-specific-prompts',
    icon: Puzzle,
    enabled: true,
    isPremium: true,
  },
   {
    title: 'Real-Time Suggestions',
    description: 'Get live, AI-powered feedback and suggestions to improve your prompts as you type.',
    href: '/dashboard/real-time-suggestions',
    icon: Lightbulb,
    enabled: true,
    isPremium: true,
  },
  {
    title: 'A/B Testing',
    description: 'Compare prompt variations across multiple AI models side-by-side to find the most effective one.',
    href: '/dashboard/compatibility-checker',
    icon: TestTubes,
    enabled: true,
    isPremium: true,
  },
  {
    title: 'Prompt Feedback & Analysis',
    description: 'Receive an instant quality score (1-10) and actionable, AI-driven feedback on any prompt.',
    href: '/dashboard/feedback-analysis',
    icon: BarChart3,
    enabled: true,
    isPremium: true,
  },
   {
    title: 'Contextual Prompting',
    description: 'Generate new prompts by providing existing content, documents, or ideas as context.',
    href: '/dashboard/contextual-prompting',
    icon: FileText,
    enabled: true,
    isPremium: true,
  },
  {
    title: 'Reverse Prompting',
    description: 'Paste AI-generated text to reverse-engineer the prompt that likely created it.',
    href: '/dashboard/reverse-prompting',
    icon: Repeat,
    enabled: true,
    isPremium: true,
  },
   {
    title: 'Analytics Dashboard',
    description: 'Track your prompt performance, usage trends, and average quality scores over time.',
    href: '/dashboard/analytics',
    icon: BarChart3,
    enabled: true,
    isPremium: true,
  },
  {
    title: 'Automated Optimization Engine',
    description: 'BrieflyAI learns from your prompt history and feedback to provide smarter suggestions over time.',
    href: '/dashboard/refinement-hub',
    icon: Brain,
    enabled: true,
  },
  {
    title: 'Prompt Academy',
    description: 'Access tutorials and best practices to master the art and science of prompt engineering.',
    href: '/dashboard/academy',
    icon: School,
    enabled: true,
  },
  {
    title: 'Product Roadmap & Teams',
    description: 'See our vision for team features, analytics, integrations, and what we are building next.',
    href: '/dashboard/roadmap',
    icon: Rocket,
    enabled: true,
  },
];

export default function DashboardPage() {
  const { currentUser, loading: authLoading } = useAuth();
  const router = useRouter();

  if (authLoading) { 
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
      </div>
    );
  }
  
  if (!currentUser && !authLoading) {
     router.push('/login');
     return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <p className="mt-4 text-muted-foreground">Please log in to view your dashboard.</p>
        <Button asChild className="mt-4"><Link href="/login">Login</Link></Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardHeader />
      <main className="flex-1 flex flex-col bg-gradient-to-br from-background via-indigo-50/30 to-mint-50/30 py-8 md:py-12">
        <Container>
           <div className="pt-16 md:pt-20 mb-12 text-center">
              <h1 className="font-headline text-3xl font-bold text-foreground mb-4">
                 What can I help you create?
              </h1>
              <div className="max-w-3xl mx-auto">
                <PromptInputForm />
              </div>
           </div>

          <section className="bg-background/70 backdrop-blur-sm rounded-xl p-6 md:p-8">
            <div className="w-full text-center">
              <h2 className="font-headline text-2xl font-bold text-foreground mb-8">
                Explore Features
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {featureCards.map((feature) => (
                  <FeatureCard key={feature.href} feature={feature} />
                ))}
              </div>
            </div>
          </section>
        </Container>
      </main>
      <MinimalFooter />
    </div>
  );
}
