
"use client";

import React, { useState, useEffect, useCallback, type FormEvent } from 'react';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { MinimalFooter } from '@/components/layout/MinimalFooter';
import Container from '@/components/layout/Container';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle, GlassCardDescription } from '@/components/shared/GlassCard';
import { Loader2, Save, Edit3, ArrowLeft, Settings2, AlertTriangle, Info } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, getDocs, doc, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import type { PromptHistory } from '@/components/dashboard/PromptHistoryItem'; // Assuming this type is exported

export default function RefinementHubPage() {
  const { currentUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [prompts, setPrompts] = useState<PromptHistory[]>([]);
  const [isLoadingPrompts, setIsLoadingPrompts] = useState(true);
  const [selectedPrompt, setSelectedPrompt] = useState<PromptHistory | null>(null);
  
  const [editableGoal, setEditableGoal] = useState('');
  const [editableOptimizedPrompt, setEditableOptimizedPrompt] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const fetchPrompts = useCallback(async () => {
    if (!currentUser) {
      setIsLoadingPrompts(false);
      setPrompts([]);
      return;
    }
    setIsLoadingPrompts(true);
    try {
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
          goal: data.goal,
          optimizedPrompt: data.optimizedPrompt,
          timestamp: timestampStr,
          tags: data.tags || [],
        } as PromptHistory;
      });
      setPrompts(firestorePrompts);
    } catch (error) {
      console.error("Error loading prompts from Firestore:", error);
      toast({ title: "Error Loading Prompts", description: "Could not load your prompts for refinement.", variant: "destructive" });
      setPrompts([]);
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

  const handleSelectPrompt = (prompt: PromptHistory) => {
    setSelectedPrompt(prompt);
    setEditableGoal(prompt.goal);
    setEditableOptimizedPrompt(prompt.optimizedPrompt);
  };

  const handleSaveChanges = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedPrompt || !currentUser) {
      toast({ title: "Error", description: "No prompt selected or user not logged in.", variant: "destructive" });
      return;
    }
    if (!editableGoal.trim() || !editableOptimizedPrompt.trim()) {
        toast({ title: "Fields Required", description: "Goal and Optimized Prompt cannot be empty.", variant: "destructive" });
        return;
    }

    setIsSaving(true);
    try {
      const promptRef = doc(db, `users/${currentUser.uid}/promptHistory`, selectedPrompt.id);
      await updateDoc(promptRef, {
        goal: editableGoal,
        optimizedPrompt: editableOptimizedPrompt,
        timestamp: serverTimestamp() // Update timestamp to reflect refinement
      });
      toast({ title: "Prompt Refined!", description: "Your changes have been saved." });
      // Refresh the list or update the selected prompt in the local state
      fetchPrompts(); 
      setSelectedPrompt(prev => prev ? {...prev, goal: editableGoal, optimizedPrompt: editableOptimizedPrompt, timestamp: new Date().toISOString()} : null);
    } catch (error) {
      console.error("Error saving refined prompt:", error);
      toast({ title: "Save Failed", description: "Could not save your refined prompt. Please try again.", variant: "destructive" });
    } finally {
      setIsSaving(false);
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
            {/* Prompt Selection Column */}
            <div className="lg:col-span-1">
              <GlassCard>
                <GlassCardHeader>
                  <GlassCardTitle className="font-headline text-xl">Select Prompt to Refine</GlassCardTitle>
                </GlassCardHeader>
                <GlassCardContent className="max-h-[60vh] overflow-y-auto">
                  {isLoadingPrompts ? (
                    <div className="text-center py-10">
                      <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary mb-2" />
                      <p className="text-muted-foreground text-sm">Loading your prompts...</p>
                    </div>
                  ) : prompts.length > 0 ? (
                    <ul className="space-y-3">
                      {prompts.map(p => (
                        <li key={p.id}>
                          <button
                            onClick={() => handleSelectPrompt(p)}
                            className={`w-full text-left p-3 rounded-lg border transition-colors
                              ${selectedPrompt?.id === p.id 
                                ? 'bg-primary/10 border-primary ring-1 ring-primary' 
                                : 'bg-muted/30 hover:bg-muted/70 border-transparent'}`}
                          >
                            <p className="font-medium text-sm text-foreground truncate" title={p.goal}>{p.goal}</p>
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

            {/* Refinement Area Column */}
            <div className="lg:col-span-2">
              <GlassCard>
                <GlassCardHeader>
                  <GlassCardTitle className="font-headline text-xl flex items-center">
                    <Settings2 className="mr-3 h-6 w-6 text-primary" />
                    Prompt Refinement Hub
                  </GlassCardTitle>
                  <GlassCardDescription>
                    Select a prompt from the list to directly edit its goal or optimized text. AI-powered suggestions are coming soon!
                  </GlassCardDescription>
                </GlassCardHeader>
                <GlassCardContent>
                  {selectedPrompt ? (
                    <form onSubmit={handleSaveChanges} className="space-y-6">
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
                      <div className="flex justify-between items-center">
                         <div className="flex items-start space-x-2 rounded-lg border border-blue-500/30 bg-blue-500/10 p-3 text-xs text-blue-700 dark:text-blue-300 w-fit">
                            <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            <p><strong>Coming Soon:</strong> AI-powered suggestions for tone, specificity, and more!</p>
                        </div>
                        <Button type="submit" disabled={isSaving} className="bg-primary text-primary-foreground hover:bg-primary/90">
                          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                          Save Refinements
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <div className="text-center py-16">
                      <Edit3 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-lg font-medium text-foreground">Select a prompt from the left panel to start refining.</p>
                      <p className="text-muted-foreground mt-1">Make direct edits to your saved goals and prompts.</p>
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
