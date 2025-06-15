
"use client";

import React, { useState, useEffect, useCallback, type FormEvent, useMemo } from 'react';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { MinimalFooter } from '@/components/layout/MinimalFooter';
import Container from '@/components/layout/Container';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle, GlassCardDescription } from '@/components/shared/GlassCard';
import { Loader2, Save, Edit3, ArrowLeft, Settings2, AlertTriangle, Info, Tag, Wand2, Lightbulb, ArrowDownUp } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, getDocs, doc, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import type { PromptHistory } from '@/components/dashboard/PromptHistoryItem'; 
import { getPromptRefinementSuggestions, type GetPromptRefinementSuggestionsInput, type GetPromptRefinementSuggestionsOutput } from '@/ai/flows/refine-prompt-suggestions-flow';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type SortOption = "timestamp_desc" | "timestamp_asc" | "name_asc" | "name_desc";

export default function RefinementHubPage() {
  const { currentUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [allPrompts, setAllPrompts] = useState<PromptHistory[]>([]);
  const [isLoadingPrompts, setIsLoadingPrompts] = useState(true);
  const [selectedPrompt, setSelectedPrompt] = useState<PromptHistory | null>(null);
  const [sortOption, setSortOption] = useState<SortOption>("timestamp_desc");
  
  const [editableName, setEditableName] = useState('');
  const [editableGoal, setEditableGoal] = useState('');
  const [editableOptimizedPrompt, setEditableOptimizedPrompt] = useState('');
  const [editableTags, setEditableTags] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  const fetchPrompts = useCallback(async () => {
    if (!currentUser) {
      setIsLoadingPrompts(false);
      setAllPrompts([]);
      return;
    }
    setIsLoadingPrompts(true);
    try {
      // Initial fetch is always ordered by timestamp desc for consistency before client-side sort
      const q = query(collection(db, `users/${currentUser.uid}/promptHistory`), orderBy("timestamp", "desc"));
      const querySnapshot = await getDocs(q);
      const firestorePrompts = querySnapshot.docs.map(docSnap => {
        const data = docSnap.data();
        let timestampStr = data.timestamp;
        if (data.timestamp instanceof Timestamp) {
          timestampStr = data.timestamp.toDate().toISOString();
        } else if (typeof data.timestamp === 'object' && data.timestamp.seconds) {
          timestampStr = new Timestamp(data.timestamp.seconds, data.timestamp.nanoseconds).toDate().toISOString();
        }
        return {
          id: docSnap.id,
          name: data.name || data.goal, 
          goal: data.goal,
          optimizedPrompt: data.optimizedPrompt,
          timestamp: timestampStr,
          tags: data.tags || [],
        } as PromptHistory;
      });
      setAllPrompts(firestorePrompts);
    } catch (error) {
      console.error("Error loading prompts from Firestore:", error);
      toast({ title: "Error Loading Prompts", description: "Could not load your prompts for refinement.", variant: "destructive" });
      setAllPrompts([]);
    } finally {
      setIsLoadingPrompts(false);
    }
  }, [currentUser, toast]);

  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push('/login');
    } else if (currentUser) {
      fetchPrompts();
    }
  }, [currentUser, authLoading, router, fetchPrompts]);

  const sortedPrompts = useMemo(() => {
    let promptsToSort = [...allPrompts];
    switch (sortOption) {
      case "timestamp_asc":
        return promptsToSort.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      case "name_asc":
        return promptsToSort.sort((a, b) => a.name.localeCompare(b.name));
      case "name_desc":
        return promptsToSort.sort((a, b) => b.name.localeCompare(a.name));
      case "timestamp_desc":
      default:
        return promptsToSort.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }
  }, [allPrompts, sortOption]);

  const handleSelectPrompt = (prompt: PromptHistory) => {
    setSelectedPrompt(prompt);
    setEditableName(prompt.name);
    setEditableGoal(prompt.goal);
    setEditableOptimizedPrompt(prompt.optimizedPrompt);
    setEditableTags(prompt.tags?.join(', ') || '');
    setAiSuggestions([]); 
  };

  const handleSaveChanges = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedPrompt || !currentUser) {
      toast({ title: "Error", description: "No prompt selected or user not logged in.", variant: "destructive" });
      return;
    }
    if (!editableName.trim() || !editableGoal.trim() || !editableOptimizedPrompt.trim()) {
        toast({ title: "Fields Required", description: "Name, Goal, and Optimized Prompt cannot be empty.", variant: "destructive" });
        return;
    }

    setIsSaving(true);
    try {
      const tagsArray = editableTags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
      const promptRef = doc(db, `users/${currentUser.uid}/promptHistory`, selectedPrompt.id);
      
      await updateDoc(promptRef, {
        name: editableName,
        goal: editableGoal,
        optimizedPrompt: editableOptimizedPrompt,
        tags: tagsArray,
        timestamp: serverTimestamp() 
      });
      
      toast({ title: "Prompt Refined!", description: "Your changes have been saved." });
      // Refresh prompt list to reflect update time for sorting
      fetchPrompts(); 
      // Update selected prompt in state to reflect changes immediately in editor
      setSelectedPrompt(prev => prev ? {
        ...prev, 
        name: editableName, 
        goal: editableGoal, 
        optimizedPrompt: editableOptimizedPrompt, 
        tags: tagsArray,
        timestamp: new Date().toISOString() // Reflect immediate update for display
      } : null);
    } catch (error) {
      console.error("Error saving refined prompt:", error);
      toast({ title: "Save Failed", description: "Could not save your refined prompt. Please try again.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleGetAISuggestions = async () => {
    if (!selectedPrompt) {
      toast({ title: "No Prompt Selected", description: "Please select a prompt to get AI suggestions.", variant: "destructive" });
      return;
    }
    setIsLoadingSuggestions(true);
    setAiSuggestions([]);
    try {
      const input: GetPromptRefinementSuggestionsInput = {
        currentPromptText: editableOptimizedPrompt,
        originalGoal: editableGoal,
      };
      const result = await getPromptRefinementSuggestions(input);
      if (result.suggestions && result.suggestions.length > 0) {
        setAiSuggestions(result.suggestions);
        toast({ title: "AI Suggestions Ready!", description: "Check below for tips to improve your prompt." });
      } else {
        toast({ title: "No Specific Suggestions", description: "The AI didn't have specific new suggestions for this prompt at the moment.", variant: "default" });
      }
    } catch (error) {
      console.error("Error getting AI suggestions:", error);
      toast({ title: "Failed to Get Suggestions", description: "Could not fetch AI suggestions. Please try again.", variant: "destructive" });
    } finally {
      setIsLoadingSuggestions(false);
    }
  };


  if (authLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading Refinement Hub...</p>
      </div>
    );
  }
  
  if (!currentUser && !authLoading) { 
     return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <p className="mt-4 text-muted-foreground">Please log in to access the Prompt Refinement Hub.</p>
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
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <GlassCard>
                <GlassCardHeader>
                  <GlassCardTitle className="font-headline text-xl">Select Prompt to Refine</GlassCardTitle>
                   <div className="mt-3">
                     <Select value={sortOption} onValueChange={(value) => setSortOption(value as SortOption)}>
                        <SelectTrigger className="w-full text-xs" aria-label="Sort prompts by">
                           <ArrowDownUp className="mr-2 h-3 w-3 text-muted-foreground" />
                           <SelectValue placeholder="Sort by..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="timestamp_desc">Last Updated (Newest)</SelectItem>
                          <SelectItem value="timestamp_asc">Last Updated (Oldest)</SelectItem>
                          <SelectItem value="name_asc">Name (A-Z)</SelectItem>
                          <SelectItem value="name_desc">Name (Z-A)</SelectItem>
                        </SelectContent>
                      </Select>
                   </div>
                </GlassCardHeader>
                <GlassCardContent className="max-h-[60vh] overflow-y-auto">
                  {isLoadingPrompts ? (
                    <div className="text-center py-10">
                      <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary mb-2" />
                      <p className="text-muted-foreground text-sm">Loading your prompts...</p>
                    </div>
                  ) : sortedPrompts.length > 0 ? (
                    <ul className="space-y-3">
                      {sortedPrompts.map(p => (
                        <li key={p.id}>
                          <button
                            onClick={() => handleSelectPrompt(p)}
                            className={`w-full text-left p-3 rounded-lg border transition-colors
                              ${selectedPrompt?.id === p.id 
                                ? 'bg-primary/10 border-primary ring-1 ring-primary' 
                                : 'bg-muted/30 hover:bg-muted/70 border-transparent'}`}
                          >
                            <p className="font-medium text-sm text-foreground truncate" title={p.name}>{p.name}</p>
                            <p className="text-xs text-muted-foreground">
                              Last updated: {new Date(p.timestamp).toLocaleDateString()}
                            </p>
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted-foreground text-sm py-10 text-center">You have no prompts in your vault yet.</p>
                  )}
                </GlassCardContent>
              </GlassCard>
            </div>

            <div className="lg:col-span-2">
              <GlassCard>
                <GlassCardHeader>
                  <GlassCardTitle className="font-headline text-xl flex items-center">
                    <Settings2 className="mr-3 h-6 w-6 text-primary" />
                    Prompt Refinement Editor
                  </GlassCardTitle>
                  <GlassCardDescription>
                    Select a prompt to edit its name, goal, optimized text, and tags. Use AI to get suggestions!
                  </GlassCardDescription>
                </GlassCardHeader>
                <GlassCardContent>
                  {selectedPrompt ? (
                    <form onSubmit={handleSaveChanges} className="space-y-6">
                      <div>
                        <Label htmlFor="editableName" className="text-base font-semibold">Prompt Name</Label>
                        <Input
                          id="editableName"
                          value={editableName}
                          onChange={(e) => setEditableName(e.target.value)}
                          className="mt-1 text-sm"
                          placeholder="Enter a descriptive name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="editableGoal" className="text-base font-semibold">Original Goal</Label>
                        <Textarea
                          id="editableGoal"
                          value={editableGoal}
                          onChange={(e) => setEditableGoal(e.target.value)}
                          rows={3}
                          className="mt-1 text-sm"
                          placeholder="e.g., Write a marketing email..."
                        />
                      </div>
                      <div>
                        <Label htmlFor="editableOptimizedPrompt" className="text-base font-semibold">Optimized Prompt Text</Label>
                        <Textarea
                          id="editableOptimizedPrompt"
                          value={editableOptimizedPrompt}
                          onChange={(e) => setEditableOptimizedPrompt(e.target.value)}
                          rows={8}
                          className="mt-1 text-sm font-code"
                          placeholder="Your AI-ready prompt text goes here..."
                        />
                      </div>
                      <div>
                        <Label htmlFor="editableTags" className="text-base font-semibold flex items-center">
                           <Tag className="mr-2 h-4 w-4 text-muted-foreground"/> Tags (comma-separated)
                        </Label>
                        <Input
                          id="editableTags"
                          value={editableTags}
                          onChange={(e) => setEditableTags(e.target.value)}
                          className="mt-1 text-sm"
                          placeholder="e.g., marketing, email, saas"
                        />
                      </div>

                      <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-2">
                        <Button 
                            type="button" 
                            variant="outline" 
                            onClick={handleGetAISuggestions} 
                            disabled={isLoadingSuggestions || !selectedPrompt}
                            className="w-full sm:w-auto"
                        >
                          {isLoadingSuggestions ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                          Get AI Suggestions
                        </Button>
                        <Button 
                            type="submit" 
                            disabled={isSaving} 
                            className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90"
                        >
                          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                          Save Refinements
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <div className="text-center py-16">
                      <Edit3 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-lg font-medium text-foreground">Select a prompt from the left panel to start refining.</p>
                      <p className="text-muted-foreground mt-1">Make direct edits or get AI-powered suggestions.</p>
                    </div>
                  )}

                  {selectedPrompt && (isLoadingSuggestions || aiSuggestions.length > 0) && (
                    <div className="mt-8 border-t border-border/50 pt-6">
                      <h4 className="font-headline text-lg font-semibold text-foreground mb-3 flex items-center">
                        <Lightbulb className="mr-2 h-5 w-5 text-yellow-500" />
                        AI Refinement Suggestions
                      </h4>
                      {isLoadingSuggestions ? (
                        <div className="flex items-center justify-center py-6">
                          <Loader2 className="mr-2 h-6 w-6 animate-spin text-primary" />
                          <p className="text-muted-foreground">Fetching suggestions...</p>
                        </div>
                      ) : aiSuggestions.length > 0 ? (
                        <ul className="space-y-3">
                          {aiSuggestions.map((suggestion, index) => (
                            <li key={index} className="flex items-start p-3 border rounded-md bg-muted/20 shadow-sm">
                              <Wand2 className="mr-3 h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                              <span className="text-sm text-muted-foreground">{suggestion}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                         !isLoadingSuggestions && <p className="text-sm text-muted-foreground">No specific suggestions at this time.</p>
                      )}
                    </div>
                  )}

                </GlassCardContent>
              </GlassCard>
            </div>
          </div>
        </Container>
      </main>
      <MinimalFooter />
    </div>
  );
}
