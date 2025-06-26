
"use client";

import React, { useState, type FormEvent } from 'react';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { MinimalFooter } from '@/components/layout/MinimalFooter';
import Container from '@/components/layout/Container';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Wand2, Loader2, Copy, Lightbulb, FileText } from 'lucide-react';
import Link from 'next/link';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle, GlassCardDescription } from '@/components/shared/GlassCard';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { reconstructPromptFromOutput, type ReconstructPromptInput, type ReconstructPromptOutput } from '@/ai/flows/reverse-prompt-flow';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { LoadingTips } from '@/components/shared/LoadingTips';

export default function ReversePromptingPage() {
  const { currentUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [aiOutputText, setAiOutputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ReconstructPromptOutput | null>(null);

  const handleReconstructPrompt = async (e: FormEvent) => {
    e.preventDefault();
    if (!aiOutputText.trim()) {
      toast({ title: "AI Output Text Required", description: "Please paste the AI-generated text you want to analyze.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    setResult(null);
    try {
      const input: ReconstructPromptInput = { aiOutputText };
      const reconstructionResult = await reconstructPromptFromOutput(input);
      setResult(reconstructionResult);
      toast({ title: "Prompt Reconstructed!", description: "Our AI's best guess for the original prompt is ready." });
    } catch (error) {
      console.error("Error reconstructing prompt:", error);
      toast({ title: "Reconstruction Failed", description: "Could not reconstruct prompt from the provided text. Please try again.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyToClipboard = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to Clipboard!",
      description: "The reconstructed prompt has been copied.",
    });
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
                <FileText className="mr-3 h-7 w-7 text-primary" /> {/* Changed icon for better fit */}
                Reverse Prompting
              </GlassCardTitle>
              <GlassCardDescription>
                Paste AI-generated text below, and BrieflyAI will attempt to reconstruct the prompt that might have created it.
              </GlassCardDescription>
            </GlassCardHeader>
            <GlassCardContent>
              <form onSubmit={handleReconstructPrompt} className="space-y-6">
                <div>
                  <Label htmlFor="aiOutputText" className="text-base font-semibold">AI-Generated Text Output</Label>
                  <Textarea
                    id="aiOutputText"
                    value={aiOutputText}
                    onChange={(e) => setAiOutputText(e.target.value)}
                    placeholder="Paste the text output from an AI model here..."
                    rows={8}
                    className="mt-1 text-sm"
                  />
                </div>
                <Button type="submit" disabled={isLoading} className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90">
                  {isLoading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Reconstructing...</>
                  ) : (
                    <><Wand2 className="mr-2 h-4 w-4" /> Reconstruct Prompt</>
                  )}
                </Button>
              </form>
            </GlassCardContent>
          </GlassCard>

          {isLoading && (
            <GlassCard className="mt-8">
              <LoadingTips loadingText="Reconstructing the original prompt..." />
            </GlassCard>
          )}

          {result && !isLoading && (
            <GlassCard>
              <GlassCardHeader>
                <GlassCardTitle className="font-headline text-xl">Reconstruction Results</GlassCardTitle>
              </GlassCardHeader>
              <GlassCardContent className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <Label htmlFor="reconstructedPrompt" className="text-base font-semibold">Reconstructed Prompt</Label>
                    <Button variant="outline" size="sm" onClick={() => handleCopyToClipboard(result.reconstructedPrompt)}>
                      <Copy className="mr-2 h-3 w-3" /> Copy
                    </Button>
                  </div>
                  <Textarea
                    id="reconstructedPrompt"
                    value={result.reconstructedPrompt}
                    readOnly
                    rows={6}
                    className="mt-1 text-sm font-code bg-muted/30"
                  />
                </div>
                <div>
                  <Label className="text-base font-semibold flex items-center"><Lightbulb className="mr-2 h-5 w-5 text-yellow-500"/>Analysis</Label>
                  <p className="mt-2 text-sm text-muted-foreground bg-muted/20 p-3 rounded-md border">
                    {result.analysis}
                  </p>
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
