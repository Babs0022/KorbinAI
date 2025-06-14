
"use client";

import React, { useState, type FormEvent } from 'react';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { MinimalFooter } from '@/components/layout/MinimalFooter';
import Container from '@/components/layout/Container';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BarChart3, Lightbulb, Loader2, ThumbsUp, ThumbsDown, CheckCircle, Info } from 'lucide-react';
import Link from 'next/link';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle, GlassCardDescription } from '@/components/shared/GlassCard';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { analyzePromptText, type AnalyzePromptInput, type AnalyzePromptOutput } from '@/ai/flows/analyze-prompt-flow';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function FeedbackAnalysisPage() {
  const { currentUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [promptText, setPromptText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalyzePromptOutput | null>(null);

  const handleAnalyzePrompt = async (e: FormEvent) => {
    e.preventDefault();
    if (!promptText.trim()) {
      toast({ title: "Prompt Text Required", description: "Please enter the prompt you want to analyze.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    setAnalysisResult(null);
    try {
      const input: AnalyzePromptInput = { promptText };
      const result = await analyzePromptText(input);
      setAnalysisResult(result);
      toast({ title: "Analysis Complete!", description: "Feedback for your prompt is ready below." });
    } catch (error)
     {
      console.error("Error analyzing prompt:", error);
      let errorMessage = "Could not analyze the prompt. Please try again.";
      if (error instanceof Error && error.message.includes('blocked')) {
        errorMessage = "The prompt or its potential analysis was blocked due to safety settings. Please revise your prompt."
      }
      toast({ title: "Analysis Failed", description: errorMessage, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };
  
  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-500';
    if (score >= 5) return 'text-yellow-500';
    return 'text-red-500';
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!currentUser) {
    router.push('/login');
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <p>Redirecting to login...</p>
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
          
          <GlassCard className="mb-8">
            <GlassCardHeader>
              <GlassCardTitle className="font-headline text-2xl flex items-center">
                <BarChart3 className="mr-3 h-7 w-7 text-primary" />
                Prompt Feedback & Analysis
              </GlassCardTitle>
              <GlassCardDescription>
                Enter your prompt below to get instant AI-powered analysis, a quality score, and actionable feedback.
              </GlassCardDescription>
            </GlassCardHeader>
            <GlassCardContent>
              <form onSubmit={handleAnalyzePrompt} className="space-y-6">
                <div>
                  <Label htmlFor="promptToAnalyze" className="text-base font-semibold">Your Prompt Text</Label>
                  <Textarea
                    id="promptToAnalyze"
                    value={promptText}
                    onChange={(e) => setPromptText(e.target.value)}
                    placeholder="Paste or type the prompt you want to get feedback on..."
                    rows={6}
                    className="mt-1 text-sm"
                  />
                </div>
                <Button type="submit" disabled={isLoading} className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90">
                  {isLoading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing...</>
                  ) : (
                    <><BarChart3 className="mr-2 h-4 w-4" /> Analyze Prompt</>
                  )}
                </Button>
              </form>
            </GlassCardContent>
          </GlassCard>

          {analysisResult && (
            <GlassCard>
              <GlassCardHeader>
                <GlassCardTitle className="font-headline text-xl">Analysis Results</GlassCardTitle>
              </GlassCardHeader>
              <GlassCardContent className="space-y-6">
                {/* Quality Score */}
                <div className="flex flex-col items-center sm:flex-row sm:items-center gap-4 p-4 border rounded-lg bg-muted/30">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-1">Quality Score</p>
                    <p className={`text-5xl font-bold ${getScoreColor(analysisResult.qualityScore)}`}>
                      {analysisResult.qualityScore}/10
                    </p>
                  </div>
                  <div className="flex-1 text-sm text-foreground">
                     <h4 className="font-semibold mb-1 flex items-center">
                        <Info className="mr-2 h-4 w-4 text-blue-500" /> Overall Assessment:
                     </h4>
                     <p className="text-muted-foreground">{analysisResult.overallAssessment}</p>
                  </div>
                </div>

                {/* Feedback Items */}
                <div>
                  <Label className="text-base font-semibold flex items-center mb-2">
                    <Lightbulb className="mr-2 h-5 w-5 text-yellow-500" /> Actionable Feedback & Suggestions
                  </Label>
                  <ul className="space-y-3">
                    {analysisResult.feedbackItems.map((item, index) => (
                      <li key={index} className="flex items-start p-3 border rounded-md bg-background shadow-sm">
                        {analysisResult.qualityScore >= 8 || (item.toLowerCase().includes("good") || item.toLowerCase().includes("excellent") || item.toLowerCase().includes("well done")) ? (
                            <CheckCircle className="mr-3 h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                        ) : analysisResult.qualityScore >=5 ? (
                            <Info className="mr-3 h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                        ) : (
                            <ThumbsDown className="mr-3 h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                        )}
                        <span className="text-sm text-muted-foreground">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </GlassCardContent>
            </GlassCard>
          )}
        </Container>
      </main>
      <MinimalFooter />
    </div>
  );
}
