
"use client";

import React, { useState, type FormEvent } from 'react';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { MinimalFooter } from '@/components/layout/MinimalFooter';
import Container from '@/components/layout/Container';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Puzzle, Wand2, Loader2, Copy, Lightbulb } from 'lucide-react';
import Link from 'next/link';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle, GlassCardDescription } from '@/components/shared/GlassCard';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { adaptPromptForModel, type AdaptPromptForModelInput, type AdaptPromptForModelOutput, AIModelEnumSchema } from '@/ai/flows/adapt-prompt-model-flow';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';


export default function ModelSpecificPromptsPage() {
  const { currentUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [originalPrompt, setOriginalPrompt] = useState('');
  const [targetModel, setTargetModel] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AdaptPromptForModelOutput | null>(null);

  const modelOptions = AIModelEnumSchema.options;

  const handleAdaptPrompt = async (e: FormEvent) => {
    e.preventDefault();
    if (!originalPrompt.trim()) {
      toast({ title: "Original Prompt Required", description: "Please enter the prompt you want to adapt.", variant: "destructive" });
      return;
    }
    if (!targetModel) {
      toast({ title: "Target Model Required", description: "Please select a target AI model.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    setResult(null);
    try {
      const input: AdaptPromptForModelInput = {
        originalPrompt,
        targetModel: targetModel as any, // Cast as AIModelEnum is validated by Zod in flow
      };
      const adaptationResult = await adaptPromptForModel(input);
      setResult(adaptationResult);
      toast({ title: "Prompt Adapted!", description: "Your prompt has been tailored for the selected model." });
    } catch (error) {
      console.error("Error adapting prompt:", error);
      toast({ title: "Adaptation Failed", description: "Could not adapt the prompt. Please try again.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCopyToClipboard = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to Clipboard!",
      description: "The adapted prompt has been copied.",
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
    return ( // Render minimal content while redirecting
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
                <Puzzle className="mr-3 h-7 w-7 text-primary" />
                Model-Specific Prompt Adapter
              </GlassCardTitle>
              <GlassCardDescription>
                Enter your prompt and select an AI model. We&apos;ll help tailor it for optimal performance with that specific model.
              </GlassCardDescription>
            </GlassCardHeader>
            <GlassCardContent>
              <form onSubmit={handleAdaptPrompt} className="space-y-6">
                <div>
                  <Label htmlFor="originalPrompt" className="text-base font-semibold">Original Prompt</Label>
                  <Textarea
                    id="originalPrompt"
                    value={originalPrompt}
                    onChange={(e) => setOriginalPrompt(e.target.value)}
                    placeholder="Paste or type your general prompt here..."
                    rows={5}
                    className="mt-1 text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="targetModel" className="text-base font-semibold">Target AI Model</Label>
                  <Select value={targetModel} onValueChange={setTargetModel}>
                    <SelectTrigger id="targetModel" className="mt-1">
                      <SelectValue placeholder="Select an AI model" />
                    </SelectTrigger>
                    <SelectContent>
                      {modelOptions.map(model => (
                        <SelectItem key={model} value={model}>
                          {model.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())} {/* Basic formatting */}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" disabled={isLoading} className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90">
                  {isLoading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adapting...</>
                  ) : (
                    <><Wand2 className="mr-2 h-4 w-4" /> Adapt Prompt</>
                  )}
                </Button>
              </form>
            </GlassCardContent>
          </GlassCard>

          {result && (
            <GlassCard>
              <GlassCardHeader>
                <GlassCardTitle className="font-headline text-xl">Adaptation Results</GlassCardTitle>
                <GlassCardDescription>
                  For target model: <span className="font-semibold text-primary">{targetModel.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                  {' '}({result.modelType} model)
                </GlassCardDescription>
              </GlassCardHeader>
              <GlassCardContent className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <Label htmlFor="adaptedPrompt" className="text-base font-semibold">Adapted Prompt</Label>
                    <Button variant="outline" size="sm" onClick={() => handleCopyToClipboard(result.adaptedPrompt)}>
                      <Copy className="mr-2 h-3 w-3" /> Copy
                    </Button>
                  </div>
                  <Textarea
                    id="adaptedPrompt"
                    value={result.adaptedPrompt}
                    readOnly
                    rows={8}
                    className="mt-1 text-sm font-code bg-muted/30"
                  />
                </div>
                <div>
                  <Label className="text-base font-semibold flex items-center"><Lightbulb className="mr-2 h-5 w-5 text-yellow-500"/>Adaptation Tips</Label>
                  <ul className="mt-2 list-disc list-inside space-y-1 pl-2 text-sm text-muted-foreground">
                    {result.adaptationTips.map((tip, index) => (
                      <li key={index}>{tip}</li>
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
