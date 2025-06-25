
"use client";

import React, { useState, type FormEvent } from 'react';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { MinimalFooter } from '@/components/layout/MinimalFooter';
import Container from '@/components/layout/Container';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCheck, Wand2, Loader2, Copy, Lightbulb } from 'lucide-react';
import Link from 'next/link';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle, GlassCardDescription } from '@/components/shared/GlassCard';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { adaptPromptForModel, type AdaptPromptForModelInput, type AdaptPromptForModelOutput, type AIModelEnum } from '@/ai/flows/adapt-prompt-model-flow';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

// Define the model options directly in the component, same as model-specific-prompts
const modelOptions = [
  // OpenAI
  "gpt-4.5",
  "gpt-4o",
  "gpt-4",
  "gpt-3.5-turbo",
  // Google
  "gemini-2.5-pro",
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-pro",
  "gemini-1.5-flash",
  "gemini-1.0-pro",
  // Anthropic
  "claude-3-opus",
  "claude-3-sonnet",
  "claude-3-haiku",
  // xAI
  "grok-3",
  // Open Source
  "llama-3-70b",
  "deepseek-r1",
  // Image Models
  "dall-e-3",
  "stable-diffusion-3",
  "stable-diffusion",
  "midjourney",
];

export default function CompatibilityCheckerPage() {
  const { currentUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [originalPrompt, setOriginalPrompt] = useState('');
  const [targetModel, setTargetModel] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AdaptPromptForModelOutput | null>(null);

  const handleCheckCompatibility = async (e: FormEvent) => {
    e.preventDefault();
    if (!originalPrompt.trim()) {
      toast({ title: "Original Prompt Required", description: "Please enter the prompt you want to check.", variant: "destructive" });
      return;
    }
    if (!targetModel) {
      toast({ title: "Target Model Required", description: "Please select a target AI model for compatibility check.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    setResult(null);
    try {
      const input: AdaptPromptForModelInput = {
        originalPrompt,
        targetModel: targetModel as AIModelEnum, 
      };
      const checkResult = await adaptPromptForModel(input);
      setResult(checkResult);
      toast({ title: "Compatibility Check Complete!", description: "Feedback and an adapted prompt are ready below." });
    } catch (error) {
      console.error("Error checking prompt compatibility:", error);
      toast({ title: "Check Failed", description: "Could not check prompt compatibility. Please try again.", variant: "destructive" });
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
                <CheckCheck className="mr-3 h-7 w-7 text-primary" />
                AI Model Compatibility Checker
              </GlassCardTitle>
              <GlassCardDescription>
                Enter your prompt and select an AI model. We'll provide feedback on compatibility and suggest adjustments to maximize its performance.
              </GlassCardDescription>
            </GlassCardHeader>
            <GlassCardContent>
              <form onSubmit={handleCheckCompatibility} className="space-y-6">
                <div>
                  <Label htmlFor="originalPrompt" className="text-base font-semibold">Your Prompt to Check</Label>
                  <Textarea
                    id="originalPrompt"
                    value={originalPrompt}
                    onChange={(e) => setOriginalPrompt(e.target.value)}
                    placeholder="Paste or type your prompt here..."
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
                          {model.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" disabled={isLoading} className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90">
                  {isLoading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Checking & Adapting...</>
                  ) : (
                    <><Wand2 className="mr-2 h-4 w-4" /> Check & Adapt Prompt</>
                  )}
                </Button>
              </form>
            </GlassCardContent>
          </GlassCard>

          {result && (
            <GlassCard>
              <GlassCardHeader>
                <GlassCardTitle className="font-headline text-xl">Compatibility Check Results</GlassCardTitle>
                <GlassCardDescription>
                  For target model: <span className="font-semibold text-primary">{targetModel.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                  {' '}({result.modelType} model)
                </GlassCardDescription>
              </GlassCardHeader>
              <GlassCardContent className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <Label htmlFor="adaptedPrompt" className="text-base font-semibold">Optimized/Adapted Prompt</Label>
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
                  <Label className="text-base font-semibold flex items-center"><Lightbulb className="mr-2 h-5 w-5 text-yellow-500"/>Compatibility Insights & Tips</Label>
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
