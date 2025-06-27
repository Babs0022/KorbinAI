
"use client";

import React, { useState, useEffect } from 'react';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { MinimalFooter } from '@/components/layout/MinimalFooter';
import Container from '@/components/layout/Container';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Loader2, AlertTriangle, BarChart3, Brain, ScrollText, Settings2, TestTubes, FileText, Lightbulb, Puzzle, School, Repeat, Rocket, Users, Edit3, Archive, Star, Cpu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { FeatureCard, type FeatureInfo } from '@/components/dashboard/FeatureCard';
import { AnalyticsSummaryCard } from '@/components/dashboard/AnalyticsSummaryCard';
import { db } from '@/lib/firebase';
import { collection, query, getDocs, Timestamp } from 'firebase/firestore';

const coreFeatures: FeatureInfo[] = [
  {
    title: 'Prompt Vault & History',
    description: 'Save, search, and manage all your optimized prompts in one secure, centralized location.',
    href: '/dashboard/prompt-vault',
    icon: Archive,
    enabled: true,
  },
  {
    title: 'Refinement & Optimization Hub',
    description: 'Iteratively improve saved prompts. Get AI suggestions based on your history to evolve your prompts.',
    href: '/dashboard/refinement-hub',
    icon: Settings2,
    enabled: true,
  },
  {
    title: 'Team Collaboration Hub',
    description: 'Share, manage, and collaborate on prompts with your team in a shared workspace.',
    href: '/dashboard/collaboration',
    icon: Users,
    enabled: true,
    isUnlimited: true,
  },
];

const fullToolkit: FeatureInfo[] = [
  {
    title: 'Real-Time Suggestions',
    description: 'Get live, AI-powered feedback and suggestions to improve your prompts as you type.',
    href: '/dashboard/real-time-suggestions',
    icon: Lightbulb,
    enabled: true,
  },
  {
    title: 'Prompt Feedback & Analysis',
    description: 'Receive an instant quality score (1-10) and actionable, AI-driven feedback on any prompt.',
    href: '/dashboard/feedback-analysis',
    icon: BarChart3,
    enabled: true,
  },
  {
    title: 'Contextual Prompting',
    description: 'Generate new prompts by providing existing content, documents, or ideas as context.',
    href: '/dashboard/contextual-prompting',
    icon: FileText,
    enabled: true,
  },
  {
    title: 'Reverse Prompting',
    description: 'Paste AI-generated text to reverse-engineer the prompt that likely created it.',
    href: '/dashboard/reverse-prompting',
    icon: Repeat,
    enabled: true,
  },
  {
    title: 'Model-Specific Adapter',
    description: 'Automatically tailor any prompt for optimal performance on specific AI models like GPT-4, Claude 3, and more.',
    href: '/dashboard/model-specific-prompts',
    icon: Puzzle,
    enabled: true,
  },
  {
    title: 'A/B Testing',
    description: 'Compare prompt variations across multiple AI models side-by-side to find the most effective one.',
    href: '/dashboard/compatibility-checker',
    icon: TestTubes,
    enabled: true,
  },
    {
    title: 'Analytics Dashboard',
    description: 'Track your prompt performance, usage trends, and average quality scores over time.',
    href: '/dashboard/analytics',
    icon: BarChart3,
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
    title: 'Product Roadmap',
    description: 'See our vision for team features, analytics, integrations, and what we are building next.',
    href: '/dashboard/roadmap',
    icon: Rocket,
    enabled: true,
  },
];


export default function DashboardPage() {
  const { currentUser, loading: authLoading } = useAuth();
  const router = useRouter();

  const [totalPrompts, setTotalPrompts] = useState<number | null>(null);
  const [avgQualityScore, setAvgQualityScore] = useState<number | null>(null);
  const [promptsThisMonth, setPromptsThisMonth] = useState<number | null>(null);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(true);

  useEffect(() => {
    if (!currentUser) {
        setIsLoadingAnalytics(false);
        return;
    }

    const fetchAnalytics = async () => {
        setIsLoadingAnalytics(true);
        try {
            const promptsCollectionRef = collection(db, `users/${currentUser.uid}/promptHistory`);
            const q = query(promptsCollectionRef);
            const querySnapshot = await getDocs(q);

            const allPrompts = querySnapshot.docs.map(doc => doc.data());
            
            setTotalPrompts(allPrompts.length);

            const scoredPrompts = allPrompts.filter(p => typeof p.qualityScore === 'number');
            if (scoredPrompts.length > 0) {
                const totalScore = scoredPrompts.reduce((acc, p) => acc + p.qualityScore, 0);
                setAvgQualityScore(parseFloat((totalScore / scoredPrompts.length).toFixed(1)));
            } else {
                setAvgQualityScore(null);
            }

            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            
            const thisMonthPrompts = allPrompts.filter(p => {
                if (!p.timestamp) return false;
                const timestamp = p.timestamp instanceof Timestamp ? p.timestamp.toDate() : new Date(p.timestamp);
                return timestamp >= startOfMonth;
            });
            setPromptsThisMonth(thisMonthPrompts.length);

        } catch (error) {
            console.error("Failed to fetch dashboard analytics", error);
        } finally {
            setIsLoadingAnalytics(false);
        }
    };

    fetchAnalytics();
  }, [currentUser]);

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

  const renderValue = (value: number | null, suffix = '', emptyState = '0') => {
    if (isLoadingAnalytics) return <Loader2 className="h-6 w-6 animate-spin text-primary" />;
    return value !== null ? `${value}${suffix}` : emptyState;
  };

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardHeader />
      <main className="flex-1 flex flex-col bg-gradient-to-br from-background via-indigo-50/30 to-mint-50/30 py-8 md:py-12">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            <div className="lg:col-span-2 space-y-8">
                <div>
                    <h2 className="font-headline text-2xl font-bold text-foreground mb-4">Core Tools</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {coreFeatures.map((feature) => (
                        <FeatureCard key={feature.title} feature={feature} />
                        ))}
                    </div>
                </div>
            </div>
            <div className="lg:col-span-1 space-y-8">
                 <AnalyticsSummaryCard 
                    title="Total Prompts Created"
                    value={renderValue(totalPrompts)}
                    description={isLoadingAnalytics ? "..." : `+${promptsThisMonth ?? 0} this month`}
                    icon={Archive}
                 />
                 <AnalyticsSummaryCard 
                    title="Average Quality Score"
                    value={renderValue(avgQualityScore, '/10', 'N/A')}
                    description="Based on scored prompts"
                    icon={Star}
                 />
            </div>
          </div>

          <section className="bg-background/70 backdrop-blur-sm rounded-xl p-6 md:p-8">
            <div className="w-full text-left mb-6">
              <h2 className="font-headline text-2xl font-bold text-foreground">
                Explore Your Full Toolkit
              </h2>
               <p className="text-muted-foreground mt-1">
                Dive into our advanced utilities and learning resources.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {fullToolkit.map((feature) => (
                  <FeatureCard key={feature.title} feature={feature} />
                ))}
            </div>
          </section>
        </Container>
      </main>
      <MinimalFooter />
    </div>
  );
}
