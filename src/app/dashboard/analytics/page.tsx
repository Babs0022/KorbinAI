
"use client";

import React, { useEffect, useState } from 'react';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { MinimalFooter } from '@/components/layout/MinimalFooter';
import Container from '@/components/layout/Container';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BarChart3, Star, Cpu, TrendingUp, AlertTriangle, Info, Archive } from 'lucide-react';
import Link from 'next/link';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle, GlassCardDescription } from '@/components/shared/GlassCard';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { Line, LineChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from 'recharts'; // Added ResponsiveContainer import
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, query, getCountFromServer } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

// Sample data for charts - replace with actual data when available
const chartDataMonthly = [
  { month: "Jan", prompts: Math.floor(Math.random() * 50) + 10, score: Math.random() * 3 + 6.5 },
  { month: "Feb", prompts: Math.floor(Math.random() * 50) + 15, score: Math.random() * 2.5 + 7 },
  { month: "Mar", prompts: Math.floor(Math.random() * 50) + 20, score: Math.random() * 2 + 7.5 },
  { month: "Apr", prompts: Math.floor(Math.random() * 50) + 25, score: Math.random() * 1.5 + 8 },
  { month: "May", prompts: Math.floor(Math.random() * 50) + 18, score: Math.random() * 2 + 7.2 },
  { month: "Jun", prompts: Math.floor(Math.random() * 50) + 30, score: Math.random() * 2.5 + 7.1 },
];

const chartConfigMonthly = {
  prompts: {
    label: "Prompts Created",
    color: "hsl(var(--primary))",
  },
  score: {
    label: "Avg. Quality Score",
    color: "hsl(var(--accent))",
  }
};

const topPromptsData = [
  { id: "1", goal: "Marketing email for new SaaS product", usage: 150, avgScore: 8.9, conversionRate: "12%" },
  { id: "2", goal: "Generate Python code for web scraper", usage: 95, avgScore: 9.2, conversionRate: "N/A" },
  { id: "3", goal: "Blog post outline: Future of AI", usage: 120, avgScore: 8.5, conversionRate: "8%" },
  { id: "4", goal: "Image prompt: Surreal landscape", usage: 200, avgScore: 7.8, conversionRate: "N/A" },
];


export default function AnalyticsPage() {
  const { currentUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);
  const [totalUserPrompts, setTotalUserPrompts] = useState<number | null>(null);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(true);

  useEffect(() => {
    setIsClient(true); 
  }, []);

  useEffect(() => {
    if (authLoading) return; 

    if (!currentUser) {
      router.push('/login');
      return;
    }

    const fetchMetrics = async () => {
      if (!currentUser) {
        setIsLoadingMetrics(false);
        setTotalUserPrompts(0);
        return;
      }
      setIsLoadingMetrics(true);
      try {
        const userPromptsQuery = query(collection(db, `users/${currentUser.uid}/promptHistory`));
        const countSnapshot = await getCountFromServer(userPromptsQuery);
        setTotalUserPrompts(countSnapshot.data().count);
      } catch (error) {
        console.error("Error loading total prompts count:", error);
        toast({ title: "Error Loading Metrics", description: "Could not load total prompts count.", variant: "destructive"});
        setTotalUserPrompts(0);
      } finally {
        setIsLoadingMetrics(false);
      }
    };

    fetchMetrics();

  }, [currentUser, authLoading, router, toast]);


  if (authLoading || (!currentUser && !authLoading) || (currentUser && isLoadingMetrics && totalUserPrompts === null)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading Analytics...</p>
      </div>
    );
  }
  
  if (!currentUser && !authLoading) {
     return (
      <div className="flex min-h-screen flex-col items-center justify-center">
         <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <p className="mt-4 text-muted-foreground">Please log in to view analytics.</p>
        <Button asChild className="mt-4"><Link href="/login">Login</Link></Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardHeader />
      <main className="flex-grow bg-gradient-to-br from-background via-indigo-50/30 to-mint-50/30 py-8">
        <Container>
          <div className="mb-6">
            <Button variant="outline" asChild size="sm">
              <Link href="/dashboard">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Link>
            </Button>
          </div>
          <h1 className="font-headline text-3xl font-bold text-foreground mb-2">Prompt Analytics Dashboard</h1>
          <p className="text-muted-foreground mb-8">
            Insights into your prompt creation and performance.
          </p>

          {/* Key Metrics Section */}
          <section className="mb-8">
            <h2 className="font-headline text-xl font-semibold text-foreground mb-4">Your Key Metrics</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <GlassCard>
                <GlassCardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <GlassCardTitle className="text-sm font-medium text-muted-foreground">Total Prompts Generated</GlassCardTitle>
                  <Archive className="h-5 w-5 text-primary" />
                </GlassCardHeader>
                <GlassCardContent>
                  {isLoadingMetrics && totalUserPrompts === null ? (
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  ) : (
                    <div className="text-2xl font-bold text-foreground">{totalUserPrompts ?? 0}</div>
                  )}
                  <p className="text-xs text-muted-foreground">Prompts saved to your vault by you.</p>
                </GlassCardContent>
              </GlassCard>
              <GlassCard>
                <GlassCardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <GlassCardTitle className="text-sm font-medium text-muted-foreground">Avg. Prompt Quality Score</GlassCardTitle>
                  <Star className="h-5 w-5 text-primary" />
                </GlassCardHeader>
                <GlassCardContent>
                  <div className="text-2xl font-bold text-foreground">N/A</div> {/* Illustrative */}
                  <p className="text-xs text-muted-foreground">Analysis feature active (illustrative avg.)</p>
                </GlassCardContent>
              </GlassCard>
              <GlassCard>
                <GlassCardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <GlassCardTitle className="text-sm font-medium text-muted-foreground">Most Used Model (Mock)</GlassCardTitle>
                  <Cpu className="h-5 w-5 text-primary" />
                </GlassCardHeader>
                <GlassCardContent>
                  <div className="text-2xl font-bold text-foreground">GPT-4</div> {/* Illustrative */}
                  <p className="text-xs text-muted-foreground">35% of analyzed prompts (illustrative)</p>
                </GlassCardContent>
              </GlassCard>
            </div>
          </section>

          {/* Prompt Performance Over Time Chart */}
          {isClient && (
            <section className="mb-8">
              <GlassCard>
                <GlassCardHeader>
                  <GlassCardTitle className="font-headline text-xl">Prompt Activity & Quality</GlassCardTitle>
                  <GlassCardDescription>Monthly trends for prompts created and average quality score. (Illustrative)</GlassCardDescription>
                </GlassCardHeader>
                <GlassCardContent className="h-[350px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                     <ChartContainer config={chartConfigMonthly} className="h-full w-full">
                       <LineChart
                          accessibilityLayer
                          data={chartDataMonthly}
                          margin={{ top: 5, right: 20, left: -20, bottom: 5 }}
                        >
                          <CartesianGrid vertical={false} strokeDasharray="3 3" />
                          <XAxis
                            dataKey="month"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            padding={{ left: 10, right: 10 }}
                          />
                          <YAxis 
                            yAxisId="left" 
                            orientation="left" 
                            stroke="hsl(var(--primary))"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                          />
                          <YAxis 
                            yAxisId="right" 
                            orientation="right" 
                            stroke="hsl(var(--accent))"
                            domain={[0, 10]} 
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                          />
                          <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent 
                                        indicator="line"
                                        labelKey="month"
                                        nameKey="name"
                                    />}
                           />
                          <ChartLegend content={<ChartLegendContent />} />
                          <Line 
                            yAxisId="left"
                            dataKey="prompts" 
                            type="monotone" 
                            stroke="var(--color-prompts)" 
                            strokeWidth={2} 
                            dot={false} 
                           />
                          <Line 
                            yAxisId="right"
                            dataKey="score" 
                            type="monotone" 
                            stroke="var(--color-score)" 
                            strokeWidth={2} 
                            dot={true}
                           />
                        </LineChart>
                      </ChartContainer>
                  </ResponsiveContainer>
                </GlassCardContent>
              </GlassCard>
            </section>
          )}

          {/* Top Performing Prompts Section */}
          <section className="mb-8">
            <GlassCard>
              <GlassCardHeader>
                <GlassCardTitle className="font-headline text-xl">Top Performing Prompts (Illustrative)</GlassCardTitle>
                <GlassCardDescription>Based on fictional usage and quality metrics.</GlassCardDescription>
              </GlassCardHeader>
              <GlassCardContent>
                <div className="space-y-4">
                  {topPromptsData.map((prompt) => (
                    <GlassCard key={prompt.id} className="p-4 bg-muted/30 hover:shadow-md transition-shadow">
                      <h4 className="font-semibold text-md text-foreground mb-1 line-clamp-1" title={prompt.goal}>
                        {prompt.goal}
                      </h4>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span>Usage: {prompt.usage}</span>
                        <span>Avg. Score: {prompt.avgScore}/10</span>
                        <span>Engagement: {prompt.conversionRate}</span>
                      </div>
                    </GlassCard>
                  ))}
                </div>
              </GlassCardContent>
            </GlassCard>
          </section>
          
          <div className="mt-6 flex items-center space-x-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-300">
            <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <p><strong>Note:</strong> Some data on this dashboard (charts, top prompts) is for illustrative purposes. Full dynamic analytics tracking for these sections is under development.</p>
          </div>

        </Container>
      </main>
      <MinimalFooter />
    </div>
  );
}
