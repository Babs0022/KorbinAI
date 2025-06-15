
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { MinimalFooter } from '@/components/layout/MinimalFooter';
import Container from '@/components/layout/Container';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Wand2, Loader2, AlertTriangle, Lightbulb, Info } from 'lucide-react';
import Link from 'next/link';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle, GlassCardDescription } from '@/components/shared/GlassCard';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { getPromptRefinementSuggestions, type GetPromptRefinementSuggestionsInput } from '@/ai/flows/refine-prompt-suggestions-flow';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

const DEBOUNCE_DELAY = 750; // milliseconds
const MIN_PROMPT_LENGTH = 10; // Minimum characters to trigger suggestions

export default function RealTimeSuggestionsPage() {
  const { currentUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [promptText, setPromptText] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [hasTypedEnough, setHasTypedEnough] = useState(false);

  const fetchSuggestions = useCallback(async (currentText: string) => {
    if (currentText.trim().length < MIN_PROMPT_LENGTH) {
      setSuggestions([]);
      setIsLoadingSuggestions(false);
      return;
    }

    setIsLoadingSuggestions(true);
    try {
      const input: GetPromptRefinementSuggestionsInput = { currentPromptText: currentText };
      const result = await getPromptRefinementSuggestions(input);
      setSuggestions(result.suggestions || []);
      if (result.suggestions && result.suggestions.length === 0) {
        // No specific suggestions, but the API call was successful
        toast({ title: "Prompt Looks Good So Far!", description: "Keep typing or refine further if needed. No specific AI suggestions at this moment.", duration: 3000});
      }
    } catch (error) {
      console.error("Error fetching real-time suggestions:", error);
      // Avoid spamming toasts if the API call fails repeatedly while typing
      // toast({ title: "Suggestion Error", description: "Could not fetch suggestions. Please try again later.", variant: "destructive", duration: 3000 });
      setSuggestions([]); // Clear suggestions on error
    } finally {
      setIsLoadingSuggestions(false);
    }
  }, [toast]);

  useEffect(() => {
    setHasTypedEnough(promptText.trim().length >= MIN_PROMPT_LENGTH);
    if (promptText.trim().length < MIN_PROMPT_LENGTH) {
      setSuggestions([]); // Clear suggestions if text is too short
      return;
    }

    const handler = setTimeout(() => {
      fetchSuggestions(promptText);
    }, DEBOUNCE_DELAY);

    return () => {
      clearTimeout(handler);
    };
  }, [promptText, fetchSuggestions]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!currentUser && !authLoading) {
    router.push('/login');
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <p className="mt-4 text-muted-foreground">Please log in to use Real-Time Suggestions.</p>
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
          
          <GlassCard className="mb-8">
            <GlassCardHeader>
              <GlassCardTitle className="font-headline text-2xl flex items-center">
                <Wand2 className="mr-3 h-7 w-7 text-primary" />
                Real-Time AI Prompt Suggestions
              </GlassCardTitle>
              <GlassCardDescription>
                Type your prompt idea below. As you type, BrieflyAI will offer intelligent, real-time suggestions to improve clarity, specificity, and overall effectiveness.
              </GlassCardDescription>
            </GlassCardHeader>
            <GlassCardContent className="space-y-6">
              <div>
                <Label htmlFor="realTimePrompt" className="text-base font-semibold">Your Prompt-in-Progress</Label>
                <Textarea
                  id="realTimePrompt"
                  value={promptText}
                  onChange={(e) => setPromptText(e.target.value)}
                  placeholder="Start typing your prompt idea here..."
                  rows={8}
                  className="mt-1 text-sm"
                  aria-describedby="suggestions-status"
                />
              </div>

              <div id="suggestions-status" aria-live="polite" className="sr-only">
                {isLoadingSuggestions && "Loading suggestions..."}
                {!isLoadingSuggestions && suggestions.length > 0 && `Received ${suggestions.length} suggestions.`}
                {!isLoadingSuggestions && suggestions.length === 0 && hasTypedEnough && "No specific suggestions at this time."}
                {!hasTypedEnough && promptText.length > 0 && `Type at least ${MIN_PROMPT_LENGTH} characters for suggestions.`}
              </div>
              
              { (isLoadingSuggestions || suggestions.length > 0 || (hasTypedEnough && !isLoadingSuggestions)) && (
                <div className="border-t border-border/50 pt-6">
                  <h4 className="font-headline text-lg font-semibold text-foreground mb-3 flex items-center">
                    <Lightbulb className="mr-2 h-5 w-5 text-yellow-500" />
                    AI Suggestions
                  </h4>
                  {isLoadingSuggestions && (
                    <div className="flex items-center justify-center py-6 text-muted-foreground">
                      <Loader2 className="mr-2 h-5 w-5 animate-spin text-primary" />
                      Fetching suggestions...
                    </div>
                  )}
                  {!isLoadingSuggestions && suggestions.length > 0 && (
                    <ul className="space-y-3">
                      {suggestions.map((suggestion, index) => (
                        <li key={index} className="flex items-start p-3 border rounded-md bg-muted/20 shadow-sm hover:bg-muted/30 transition-colors">
                          <Wand2 className="mr-3 h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-muted-foreground">{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {!isLoadingSuggestions && suggestions.length === 0 && hasTypedEnough && (
                     <div className="flex items-center space-x-2 rounded-lg border border-blue-500/30 bg-blue-500/10 p-3 text-sm text-blue-700 dark:text-blue-300">
                        <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <p>Your prompt looks good for now! No immediate AI suggestions. Keep typing or refine further if needed.</p>
                    </div>
                  )}
                </div>
              )}
               {!hasTypedEnough && promptText.length > 0 && (
                 <div className="flex items-center space-x-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-300">
                    <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <p>Keep typing... Suggestions will appear once your prompt is a bit longer (at least {MIN_PROMPT_LENGTH} characters).</p>
                </div>
              )}

            </GlassCardContent>
          </GlassCard>
        </Container>
      </main>
      <MinimalFooter />
    </div>
  );
}
