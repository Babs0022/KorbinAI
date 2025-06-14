
"use client"; 

import React, { useState, useEffect, useCallback } from 'react';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { MinimalFooter } from '@/components/layout/MinimalFooter';
import { DashboardSidebar } from '@/components/layout/DashboardSidebar';
import { AnalyticsSummaryCard } from '@/components/dashboard/AnalyticsSummaryCard';
import { PromptHistoryItem, type PromptHistory } from '@/components/dashboard/PromptHistoryItem';
import { Button } from '@/components/ui/button';
import { PlusCircle, Search, ListFilter, Loader2, Copy, Activity, Bell, Edit, Download, Eye, TrendingUp, BarChart3, Lightbulb } from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, getDocs, deleteDoc, doc, Timestamp, limit } from 'firebase/firestore';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/shared/GlassCard';

export default function DashboardPage() {
  const { currentUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const [prompts, setPrompts] = useState<PromptHistory[]>([]); 
  const [isLoadingPrompts, setIsLoadingPrompts] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [promptToDelete, setPromptToDelete] = useState<PromptHistory | null>(null);
  const [viewingPrompt, setViewingPrompt] = useState<PromptHistory | null>(null);
  const { toast } = useToast();

  const fetchPrompts = useCallback(async (fetchLimit: number = 5) => {
    if (!currentUser) {
      setIsLoadingPrompts(false);
      setPrompts([]); 
      return;
    }
    setIsLoadingPrompts(true);
    try {
      const q = query(collection(db, `users/${currentUser.uid}/promptHistory`), orderBy("timestamp", "desc"), limit(fetchLimit));
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
      toast({ title: "Error Loading History", description: "Could not load prompt history.", variant: "destructive"});
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
    } else if (!authLoading && !currentUser) {
      setIsLoadingPrompts(false);
      setPrompts([]);
    }
  }, [currentUser, authLoading, router, fetchPrompts]);

  const handleViewPrompt = (prompt: PromptHistory) => {
    setViewingPrompt(prompt);
  };

  const handleCopyToClipboard = (text: string, type: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast({
      title: `${type} Copied!`,
      description: `The ${type.toLowerCase()} has been copied to your clipboard.`,
    });
  };

  const handleEditPrompt = (prompt: PromptHistory) => {
    const queryParams = new URLSearchParams({ goal: prompt.goal, optimizedPrompt: prompt.optimizedPrompt });
    router.push(`/create-prompt?${queryParams.toString()}`);
    toast({ title: "Editing Prompt", description: `Loading "${prompt.goal.substring(0,30)}..." for editing.`});
  };

  const handleExportPrompt = (prompt: PromptHistory) => {
    const content = `Original Goal:\n${prompt.goal}\n\nOptimized Prompt:\n${prompt.optimizedPrompt}`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    const safeGoal = prompt.goal.substring(0,20).replace(/[^a-z0-9]/gi, '_').toLowerCase();
    link.download = `brieflyai_prompt_${safeGoal}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "Prompt Exported", description: "The prompt has been downloaded as a .txt file." });
  };
  
  const openDeleteDialog = (prompt: PromptHistory) => {
    setPromptToDelete(prompt);
  };

  const handleDeletePrompt = async () => {
    if (!promptToDelete || !currentUser) return;
    try {
      await deleteDoc(doc(db, `users/${currentUser.uid}/promptHistory`, promptToDelete.id));
      setPrompts(prevPrompts => prevPrompts.filter(p => p.id !== promptToDelete.id));
      toast({ title: "Prompt Deleted", description: `Prompt "${promptToDelete.goal.substring(0,30)}..." has been deleted.`});
    } catch (error) {
      console.error("Error deleting prompt from Firestore:", error);
      toast({ title: "Error Deleting Prompt", description: "Could not delete prompt.", variant: "destructive"});
    } finally {
      setPromptToDelete(null); 
    }
  };

  const filteredPrompts = prompts.filter(prompt => 
    prompt.goal.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (prompt.optimizedPrompt && prompt.optimizedPrompt.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  if (authLoading || (!currentUser && authLoading)) { 
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
      </div>
    );
  }
  
  if (!currentUser) { 
     return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <p className="mt-4 text-muted-foreground">Please log in to view your dashboard.</p>
        <Button asChild className="mt-4"><Link href="/login">Login</Link></Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardHeader />
      <div className="flex flex-1">
        <div className="hidden md:block md:w-64 xl:w-72">
           <DashboardSidebar className="fixed top-16 left-0 h-[calc(100vh-4rem)] w-64 xl:w-72"/>
        </div>
        <main className="flex-1 bg-gradient-to-br from-background via-indigo-50/30 to-mint-50/30 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {/* Featured Box: Generate Your Prompt */}
          <GlassCard className="mb-8 bg-primary/10 border-primary/30">
            <GlassCardHeader>
                <GlassCardTitle className="text-2xl font-headline text-primary flex items-center">
                    <Lightbulb className="mr-3 h-7 w-7" /> Create a New Masterpiece
                </GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent>
                <p className="text-muted-foreground mb-4">
                    Ready to craft the perfect AI prompt? Let BrieflyAI guide you.
                </p>
                <Button size="lg" asChild className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md">
                    <Link href="/create-prompt">
                    <PlusCircle className="mr-2 h-5 w-5" /> Generate Your Prompt
                    </Link>
                </Button>
            </GlassCardContent>
          </GlassCard>

          {/* Top Section: Quick Stats/Analytics */}
          <section className="mb-8">
            <h2 className="font-headline text-xl font-semibold text-foreground mb-4">Your Prompting Snapshot</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <AnalyticsSummaryCard title="Total Prompts Generated" value={String(prompts.length || 0)} icon={BarChart3} description="Across all your sessions" />
              <AnalyticsSummaryCard title="Average Prompt Score" value="N/A" icon={TrendingUp} description="Feedback coming soon!" />
              <AnalyticsSummaryCard title="Most Used Category" value="N/A" icon={ListFilter} description="Categorization coming soon!" />
            </div>
          </section>

          {/* Main Section: Recent Prompts */}
          <section className="mb-8">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="font-headline text-xl font-semibold text-foreground">Recent Prompts</h2>
              <Button variant="outline" asChild>
                  <Link href="/dashboard/prompt-vault">
                    View Full Prompt Vault <Eye className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
            </div>
             <div className="mb-4 flex gap-2">
                <div className="relative flex-grow">
                   <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input 
                    type="search" 
                    placeholder="Search recent prompts..." 
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

            {isLoadingPrompts ? (
              <div className="text-center py-10 rounded-lg bg-card/50 p-6">
                <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary mb-3" />
                <h3 className="font-semibold text-lg text-foreground">Loading Recent Prompts...</h3>
              </div>
            ) : filteredPrompts.length > 0 ? (
              <div className="space-y-4">
                {filteredPrompts.map((prompt) => (
                  <PromptHistoryItem
                    key={prompt.id}
                    prompt={prompt}
                    onView={handleViewPrompt}
                    onEdit={handleEditPrompt}
                    onExport={handleExportPrompt}
                    onDelete={() => openDeleteDialog(prompt)} 
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-10 rounded-lg bg-card/50 p-6">
                <Search className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
                <h3 className="font-semibold text-lg text-foreground">No Recent Prompts Found</h3>
                <p className="text-muted-foreground mt-1 text-sm">
                  {searchTerm ? "Try adjusting your search terms." : "Create a new prompt to see it here!"}
                </p>
              </div>
            )}
          </section>

          {/* Footer Section: Notifications Placeholder */}
          <section>
            <h2 className="font-headline text-xl font-semibold text-foreground mb-4">Notifications & Updates</h2>
            <GlassCard>
                <GlassCardContent className="pt-6">
                    <div className="flex items-center text-muted-foreground">
                        <Bell className="mr-3 h-6 w-6 text-primary" />
                        <p>New features and learning resources will be announced here. Stay tuned!</p>
                    </div>
                </GlassCardContent>
            </GlassCard>
          </section>

        </main>
      </div>
      <MinimalFooter />
      
      {promptToDelete && (
        <AlertDialog open={!!promptToDelete} onOpenChange={() => setPromptToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. Prompt: &quot;{promptToDelete.goal.substring(0,50)}...&quot; will be deleted.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setPromptToDelete(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeletePrompt} className="bg-destructive hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {viewingPrompt && (
        <Dialog open={!!viewingPrompt} onOpenChange={(isOpen) => { if (!isOpen) setViewingPrompt(null); }}>
          <DialogContent className="sm:max-w-xl max-h-[80vh] flex flex-col">
            <DialogHeader>
              <DialogTitle className="text-2xl font-headline">View Prompt Details</DialogTitle>
              <DialogDescription>Review your original goal and optimized prompt.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4 overflow-y-auto px-1 flex-grow">
              <div>
                <Label htmlFor="viewGoal" className="text-sm font-semibold text-foreground">Original Goal</Label>
                <p id="viewGoal" className="mt-1 text-sm text-muted-foreground p-3 bg-muted/50 rounded-md border whitespace-pre-wrap">
                  {viewingPrompt.goal}
                </p>
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <Label htmlFor="viewOptimizedPrompt" className="text-sm font-semibold text-foreground">Optimized Prompt</Label>
                  <Button variant="ghost" size="sm" onClick={() => handleCopyToClipboard(viewingPrompt.optimizedPrompt, 'Optimized Prompt')}>
                    <Copy className="mr-2 h-4 w-4" /> Copy
                  </Button>
                </div>
                <Textarea id="viewOptimizedPrompt" value={viewingPrompt.optimizedPrompt} readOnly rows={10} className="text-sm leading-relaxed font-code bg-muted/50 border whitespace-pre-wrap" />
              </div>
              <div>
                <Label className="text-sm font-semibold text-foreground">Created</Label>
                <p className="mt-1 text-xs text-muted-foreground">
                  {new Date(viewingPrompt.timestamp).toLocaleString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}
                </p>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="outline">Close</Button></DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
