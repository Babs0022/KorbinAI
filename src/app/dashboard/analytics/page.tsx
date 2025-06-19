
"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { MinimalFooter } from '@/components/layout/MinimalFooter';
import Container from '@/components/layout/Container';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BarChart3, Star, Cpu, TrendingUp, AlertTriangle, Info, Archive, Users } from 'lucide-react';
import Link from 'next/link';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle, GlassCardDescription } from '@/components/shared/GlassCard';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { Line, LineChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, query, getDocs, orderBy, Timestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import type { PromptHistory } from '@/components/dashboard/PromptHistoryItem';

interface MonthlyData {
  month: string;
  prompts: number;
  score: number | null;
}

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

const formatMonthYear = (date: Date): string => {
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
};

export default function AnalyticsPage() {
  const { currentUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);
  
  const [allUserPrompts, setAllUserPrompts] = useState<PromptHistory[]>([]);
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

    const fetchAllMetrics = async () => {
      if (!currentUser) {
        setIsLoadingMetrics(false);
        setAllUserPrompts([]);
        return;
      }
      setIsLoadingMetrics(true);
      try {
        const userPromptsQuery = query(collection(db, `users/${currentUser.uid}/promptHistory`), orderBy("timestamp", "desc"));
        const querySnapshot = await getDocs(userPromptsQuery);
        const fetchedPrompts = querySnapshot.docs.map(docSnap => {
          const data = docSnap.data();
          let timestampStr = data.timestamp;
           if (data.timestamp instanceof Timestamp) {
            timestampStr = data.timestamp.toDate().toISOString();
          } else if (typeof data.timestamp === 'object' && data.timestamp.seconds) {
            // Fallback for potentially un-converted server timestamps in older data
            timestampStr = new Timestamp(data.timestamp.seconds, data.timestamp.nanoseconds).toDate().toISOString();
          }
          return {
            id: docSnap.id,
            name: data.name || data.goal || 'Untitled Prompt',
            goal: data.goal || '',
            optimizedPrompt: data.optimizedPrompt || '',
            timestamp: timestampStr,
            tags: data.tags || [],
            qualityScore: typeof data.qualityScore === 'number' ? data.qualityScore : undefined,
            targetModel: typeof data.targetModel === 'string' ? data.targetModel : undefined,
          } as PromptHistory;
        });
        setAllUserPrompts(fetchedPrompts);
      } catch (error) {
        console.error("Error loading user prompts data:", error);
        toast({ title: "Error Loading Analytics Data", description: "Could not load your prompt history for analytics.", variant: "destructive"});
        setAllUserPrompts([]);
      } finally {
        setIsLoadingMetrics(false);
      }
    };

    fetchAllMetrics();

  }, [currentUser, authLoading, router, toast]);

  const totalPromptsCount = useMemo(() => allUserPrompts.length, [allUserPrompts]);

  const averageQualityScore = useMemo(() => {
    const scoredPrompts = allUserPrompts.filter(p => typeof p.qualityScore === 'number');
    if (scoredPrompts.length === 0) return null;
    const sum = scoredPrompts.reduce((acc, p) => acc + (p.qualityScore || 0), 0);
    return parseFloat((sum / scoredPrompts.length).toFixed(1));
  }, [allUserPrompts]);

  const mostUsedModel = useMemo(() => {
    const modelCounts: Record<string, number> = {};
    allUserPrompts.forEach(p => {
      if (p.targetModel) {
        modelCounts[p.targetModel] = (modelCounts[p.targetModel] || 0) + 1;
      }
    });
    if (Object.keys(modelCounts).length === 0) return null;
    return Object.entries(modelCounts).sort(([,a],[,b]) => b-a)[0][0];
  }, [allUserPrompts]);
  
  const monthlyChartData = useMemo<MonthlyData[]>(() => {
    const dataByMonth: Record<string, { prompts: number; scores: number[]; scoreSum: number }> = {};

    allUserPrompts.forEach(prompt => {
      const date = new Date(prompt.timestamp);
      const monthYearKey = formatMonthYear(date);
      
      if (!dataByMonth[monthYearKey]) {
        dataByMonth[monthYearKey] = { prompts: 0, scores: [], scoreSum: 0 };
      }
      dataByMonth[monthYearKey].prompts += 1;
      if (typeof prompt.qualityScore === 'number') {
        dataByMonth[monthYearKey].scores.push(prompt.qualityScore);
        dataByMonth[monthYearKey].scoreSum += prompt.qualityScore;
      }
    });

    const sortedMonths = Object.keys(dataByMonth).sort((a,b) => new Date(a).getTime() - new Date(b).getTime());
    
    // Ensure we have at least 6 months of data, even if empty, for a better looking chart
    const chartEntries: MonthlyData[] = [];
    const today = new Date();
    const monthSet = new Set(sortedMonths);

    for (let i = 5; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthKey = formatMonthYear(date);
      if (dataByMonth[monthKey]) {
        chartEntries.push({
          month: monthKey.split(' ')[0], // Just month abbreviation
          prompts: dataByMonth[monthKey].prompts,
          score: dataByMonth[monthKey].scores.length > 0 
                 ? parseFloat((dataByMonth[monthKey].scoreSum / dataByMonth[monthKey].scores.length).toFixed(1)) 
                 : null,
        });
      } else {
         chartEntries.push({ month: monthKey.split(' ')[0], prompts: 0, score: null });
      }
    }
     // If there's historical data older than 6 months, make sure the chart still shows it.
     // This logic prioritizes showing the latest 6 months if there's a lot of data.
     // If there are fewer than 6 months of data, it will show all available months plus padding.
     // For more sophisticated charting with many data points, consider pagination or more advanced aggregation.

    return chartEntries.slice(-6); // Show up to last 6 months of activity

  }, [allUserPrompts]);


  const topPrompts = useMemo(() => {
    return allUserPrompts
      .filter(p => typeof p.qualityScore === 'number')
      .sort((a, b) => (b.qualityScore || 0) - (a.qualityScore || 0))
      .slice(0, 3); // Top 3
  }, [allUserPrompts]);


  if (authLoading || (!currentUser && !authLoading) || (isLoadingMetrics && !isClient)) {
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

          <section className="mb-8">
            <h2 className="font-headline text-xl font-semibold text-foreground mb-4">Your Key Metrics</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <GlassCard>
                <GlassCardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <GlassCardTitle className="text-sm font-medium text-muted-foreground">Total Prompts in Vault</GlassCardTitle>
                  <Archive className="h-5 w-5 text-primary" />
                </GlassCardHeader>
                <GlassCardContent>
                  {isLoadingMetrics ? (
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  ) : (
                    <div className="text-2xl font-bold text-foreground">{totalPromptsCount}</div>
                  )}
                  <p className="text-xs text-muted-foreground">Prompts saved to your vault.</p>
                </GlassCardContent>
              </GlassCard>
              <GlassCard>
                <GlassCardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <GlassCardTitle className="text-sm font-medium text-muted-foreground">Avg. Prompt Quality Score</GlassCardTitle>
                  <Star className="h-5 w-5 text-primary" />
                </GlassCardHeader>
                <GlassCardContent>
                   {isLoadingMetrics ? (
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  ) : (
                    <div className="text-2xl font-bold text-foreground">{averageQualityScore !== null ? `${averageQualityScore}/10` : 'N/A'}</div>
                  )}
                  <p className="text-xs text-muted-foreground">Average of scored prompts.</p>
                </GlassCardContent>
              </GlassCard>
              <GlassCard>
                <GlassCardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <GlassCardTitle className="text-sm font-medium text-muted-foreground">Most Used AI Model</GlassCardTitle>
                  <Cpu className="h-5 w-5 text-primary" />
                </GlassCardHeader>
                <GlassCardContent>
                   {isLoadingMetrics ? (
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  ) : (
                    <div className="text-2xl font-bold text-foreground">{mostUsedModel || 'N/A'}</div>
                  )}
                  <p className="text-xs text-muted-foreground">Based on adapted prompts.</p>
                </GlassCardContent>
              </GlassCard>
            </div>
          </section>

          {isClient && (
            <section className="mb-8">
              <GlassCard>
                <GlassCardHeader>
                  <GlassCardTitle className="font-headline text-xl">Prompt Activity & Quality</GlassCardTitle>
                  <GlassCardDescription>Monthly trends for prompts created and average quality score.</GlassCardDescription>
                </GlassCardHeader>
                <GlassCardContent className="h-[350px] w-full">
                  {isLoadingMetrics ? (
                     <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                  ) : monthlyChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                       <ChartContainer config={chartConfigMonthly} className="h-full w-full">
                         <LineChart
                            accessibilityLayer
                            data={monthlyChartData}
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
                              allowDecimals={false}
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
                              connectNulls // Important for months with no score data
                             />
                          </LineChart>
                        </ChartContainer>
                    </ResponsiveContainer>
                  ) : (
                     <div className="flex flex-col items-center justify-center h-full">
                        <BarChart3 className="h-10 w-10 text-muted-foreground mb-2" />
                        <p className="text-muted-foreground">No prompt activity data yet to display chart.</p>
                     </div>
                  )}
                </GlassCardContent>
              </GlassCard>
            </section>
          )}

          <section className="mb-8">
            <GlassCard>
              <GlassCardHeader>
                <GlassCardTitle className="font-headline text-xl">Top Performing Prompts</GlassCardTitle>
                <GlassCardDescription>Based on your highest quality scores.</GlassCardDescription>
              </GlassCardHeader>
              <GlassCardContent>
                {isLoadingMetrics ? (
                   <div className="flex items-center justify-center py-6"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                ) : topPrompts.length > 0 ? (
                  <div className="space-y-4">
                    {topPrompts.map((prompt) => (
                      <GlassCard key={prompt.id} className="p-4 bg-muted/30 hover:shadow-md transition-shadow">
                        <h4 className="font-semibold text-md text-foreground mb-1 line-clamp-1" title={prompt.name}>
                          {prompt.name}
                        </h4>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          <span>Quality Score: {prompt.qualityScore?.toFixed(1) || 'N/A'}/10</span>
                          {prompt.targetModel && <span>Model: {prompt.targetModel}</span>}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1" title={prompt.optimizedPrompt}>
                           {prompt.optimizedPrompt}
                        </p>
                      </GlassCard>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10">
                     <Star className="h-10 w-10 text-muted-foreground mb-2" />
                     <p className="text-muted-foreground">No prompts with quality scores available yet.</p>
                     <p className="text-xs text-muted-foreground">Analyze some prompts to see them ranked here!</p>
                  </div>
                )}
              </GlassCardContent>
            </GlassCard>
          </section>
          
          <div className="mt-6 flex items-center space-x-2 rounded-lg border border-blue-500/30 bg-blue-500/10 p-3 text-sm text-blue-700 dark:text-blue-300">
            <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <p><strong>Note:</strong> Analytics are based on data stored in your Prompt Vault. Ensure prompts are saved after analysis or adaptation for accurate metrics.</p>
          </div>

        </Container>
      </main>
      <MinimalFooter />
    </div>
  );
}
