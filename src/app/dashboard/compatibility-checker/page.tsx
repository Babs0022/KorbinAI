
"use client";

import React, { useState, type FormEvent } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import Container from '@/components/layout/Container';
import { Button } from '@/components/ui/button';
import { ArrowLeft, TestTubes, Wand2, Loader2, Copy, Lightbulb } from 'lucide-react';
import Link from 'next/link';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle, GlassCardDescription } from '@/components/shared/GlassCard';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { optimizePrompt, type OptimizePromptOutput } from '@/ai/flows/optimize-prompt';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { LoadingTips } from '@/components/shared/LoadingTips';

const modelGroups = [
  {
    groupName: 'Text Models (OpenAI)',
    models: ["gpt-4.5", "gpt-4o", "gpt-4", "gpt-3.5-turbo"]
  },
  {
    groupName: 'Text Models (Google)',
    models: ["gemini-2.5-pro", "gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-pro", "gemini-1.5-flash", "gemini-1.0-pro"]
  },
  {
    groupName: 'Text Models (Anthropic)',
    models: ["claude-3.5-sonnet", "claude-3-opus", "claude-3-sonnet", "claude-3-haiku"]
  },
  {
    groupName: 'Text Models (Other)',
    models: ["grok-3", "llama-3-70b", "deepseek-r1"]
  },
  {
    groupName: 'Image Models',
    models: ["dall-e-3", "stable-diffusion-3", "stable-diffusion", "midjourney"]
  }
];

type TestResult = OptimizePromptOutput & { targetModel: string };

export default function CompatibilityCheckerPage() {
  const { currentUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [originalPrompt, setOriginalPrompt] = useState('');
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<TestResult[] | null>(null);

  const handleModelToggle = (model: string) => {
    setSelectedModels((prev) =>
      prev.includes(model)
        ? prev.filter((m) => m !== model)
        : [...prev, model]
    );
  };
  
  const handleRunTests = async (e: FormEvent) => {
    e.preventDefault();
    if (!originalPrompt.trim()) {
      toast({ title: "Original Prompt Required", description: "Please enter the prompt you want to test.", variant: "destructive" });
      return;
    }
    if (selectedModels.length === 0) {
      toast({ title: "Target Model(s) Required", description: "Please select at least one AI model to test.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    setResults(null);
    try {
      const testPromises = selectedModels.map(model => 
        optimizePrompt({
          goal: originalPrompt,
          targetModel: model,
        })
      );
      
      const optimizationResults = await Promise.all(testPromises);

      const combinedResults = optimizationResults.map((res, index) => ({
        ...res,
        targetModel: selectedModels[index],
      }));

      setResults(combinedResults);
      toast({ title: `A/B Test Complete for ${combinedResults.length} models!`, description: "Review the adapted prompts below." });
    } catch (error) {
      console.error("Error checking prompt compatibility:", error);
      toast({ title: "A/B Test Failed", description: "Could not run the test. Please try again.", variant: "destructive" });
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
    <DashboardLayout>
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
                <TestTubes className="mr-3 h-7 w-7 text-primary" />
                AI Model A/B Testing
              </GlassCardTitle>
              <GlassCardDescription>
                Select multiple AI models to adapt your prompt for each one. Compare the results side-by-side to find the most effective version.
              </GlassCardDescription>
            </GlassCardHeader>
            <GlassCardContent>
              <form onSubmit={handleRunTests} className="space-y-6">
                <div>
                  <Label htmlFor="originalPrompt" className="text-base font-semibold">Your Prompt to Test</Label>
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
                  <Label className="text-base font-semibold">Target AI Models</Label>
                  <div className="mt-2 space-y-4">
                    {modelGroups.map((group) => (
                      <div key={group.groupName}>
                        <p className="mb-2 text-sm font-medium text-muted-foreground">{group.groupName}</p>
                        <div className="flex flex-wrap gap-2">
                          {group.models.map((model) => (
                            <Button
                              key={model}
                              type="button"
                              variant={selectedModels.includes(model) ? "default" : "outline"}
                              size="sm"
                              className="h-auto px-3 py-1.5 text-xs"
                              onClick={() => handleModelToggle(model)}
                            >
                              {model.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                            </Button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <Button type="submit" disabled={isLoading} className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90">
                  {isLoading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Running Tests...</>
                  ) : (
                    <><Wand2 className="mr-2 h-4 w-4" /> Run A/B Test</>
                  )}
                </Button>
              </form>
            </GlassCardContent>
          </GlassCard>

          {isLoading && (
            <GlassCard className="mt-8">
              <LoadingTips loadingText="Running A/B Tests..." />
            </GlassCard>
          )}

          {results && !isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
              {results.map((result, index) => {
                const isImageModel = modelGroups.some(g => g.groupName.includes('Image') && g.models.includes(result.targetModel));
                const modelType = isImageModel ? 'Image' : 'Text';

                return (
                  <GlassCard key={index}>
                    <GlassCardHeader>
                      <GlassCardTitle className="font-headline text-xl">
                        {result.targetModel.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </GlassCardTitle>
                      <GlassCardDescription>
                        {modelType} Model
                      </GlassCardDescription>
                    </GlassCardHeader>
                    <GlassCardContent className="space-y-6">
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <Label htmlFor={`adaptedPrompt-${index}`} className="text-base font-semibold">Adapted Prompt</Label>
                          <Button variant="outline" size="sm" onClick={() => handleCopyToClipboard(result.optimizedPrompt)}>
                            <Copy className="mr-2 h-3 w-3" /> Copy
                          </Button>
                        </div>
                        <Textarea
                          id={`adaptedPrompt-${index}`}
                          value={result.optimizedPrompt}
                          readOnly
                          rows={8}
                          className="mt-1 text-sm font-code bg-muted/30"
                        />
                      </div>
                      <div>
                        <Label className="text-base font-semibold flex items-center"><Lightbulb className="mr-2 h-5 w-5 text-yellow-500"/>Explanation</Label>
                        <p className="mt-2 text-sm text-muted-foreground bg-muted/20 p-3 rounded-md border whitespace-pre-wrap">
                          {result.explanation}
                        </p>
                      </div>
                    </GlassCardContent>
                  </GlassCard>
                );
              })}
            </div>
          )}
        </Container>
      </main>
    </DashboardLayout>
  );
}
