
"use client";

import React, { useState, type FormEvent } from 'react';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { MinimalFooter } from '@/components/layout/MinimalFooter';
import Container from '@/components/layout/Container';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText, Wand2, Loader2, Copy, Lightbulb } from 'lucide-react';
import Link from 'next/link';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle, GlassCardDescription } from '@/components/shared/GlassCard';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { generatePromptFromContext, type GeneratePromptFromContextInput, type GeneratePromptFromContextOutput } from '@/ai/flows/contextual-prompt-flow';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function ContextualPromptingPage() {
  const { currentUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [contextText, setContextText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<GeneratePromptFromContextOutput | null>(null);

  const handleGeneratePrompt = async (e: FormEvent) => {
    e.preventDefault();
    if (!contextText.trim()) {
      toast({ title: "Context Text Required", description: "Please enter the text you want to use as context.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    setResult(null);
    try {
      const input: GeneratePromptFromContextInput = { contextText };
      const generationResult = await generatePromptFromContext(input);
      setResult(generationResult);
      toast({ title: "Prompt Generated!", description: "A new prompt has been generated based on your context." });
    } catch (error) {
      console.error("Error generating prompt from context:", error);
      toast({ title: "Generation Failed", description: "Could not generate prompt from context. Please try again.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyToClipboard = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to Clipboard!",
      description: "The generated prompt has been copied.",
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
                <FileText className="mr-3 h-7 w-7 text-primary" />
                Contextual Prompting
              </GlassCardTitle>
              <GlassCardDescription>
                Provide existing content (paragraphs, tweets, documents), and BrieflyAI will analyze it to generate highly relevant and effective prompts that build upon your work.
              </GlassCardDescription>
            </GlassCardHeader>
            <GlassCardContent>
              <form onSubmit={handleGeneratePrompt} className="space-y-6">
                <div>
                  <Label htmlFor="contextText" className="text-base font-semibold">Your Context Text</Label>
                  <Textarea
                    id="contextText"
                    value={contextText}
                    onChange={(e) => setContextText(e.target.value)}
                    placeholder="Paste or type your existing text, document snippet, or idea here..."
                    rows={8}
                    className="mt-1 text-sm"
                  />
                </div>
                <Button type="submit" disabled={isLoading} className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90">
                  {isLoading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</>
                  ) : (
                    <><Wand2 className="mr-2 h-4 w-4" /> Generate Prompt from Context</>
                  )}
                </Button>
              </form>
            </GlassCardContent>
          </GlassCard>

          {result && (
            <GlassCard>
              <GlassCardHeader>
                <GlassCardTitle className="font-headline text-xl">Generated Output</GlassCardTitle>
              </GlassCardHeader>
              <GlassCardContent className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <Label htmlFor="generatedPrompt" className="text-base font-semibold">Generated Prompt</Label>
                    <Button variant="outline" size="sm" onClick={() => handleCopyToClipboard(result.generatedPrompt)}>
                      <Copy className="mr-2 h-3 w-3" /> Copy
                    </Button>
                  </div>
                  <Textarea
                    id="generatedPrompt"
                    value={result.generatedPrompt}
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
