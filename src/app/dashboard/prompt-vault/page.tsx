
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import Container from '@/components/layout/Container';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Search, Archive, ArrowLeft, Copy, Eye, Tag, ArrowDownUp } from 'lucide-react';
import Link from 'next/link';
import { PromptHistoryItem, type PromptHistory } from '@/components/dashboard/PromptHistoryItem';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/shared/GlassCard';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, getDocs, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type SortOption = "timestamp_desc" | "timestamp_asc" | "name_asc" | "name_desc";

export default function PromptVaultPage() {
  const { currentUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [prompts, setPrompts] = useState<PromptHistory[]>([]);
  const [isLoadingPrompts, setIsLoadingPrompts] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>("timestamp_desc");
  const [promptToDelete, setPromptToDelete] = useState<PromptHistory | null>(null);
  const [viewingPrompt, setViewingPrompt] = useState<PromptHistory | null>(null);

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
          name: data.name || data.goal || 'Untitled Prompt', 
          goal: data.goal || '',
          optimizedPrompt: data.optimizedPrompt || '',
          timestamp: timestampStr,
          tags: data.tags || [],
          qualityScore: data.qualityScore, 
          targetModel: data.targetModel,   
        } as PromptHistory;
      });
      setPrompts(firestorePrompts);
    } catch (error) {
      console.error("Error loading prompts from Firestore:", error);
      toast({ title: "Error Loading Vault", description: "Could not load your prompt vault.", variant: "destructive" });
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

  const handleViewPrompt = useCallback((prompt: PromptHistory) => {
    setViewingPrompt(prompt);
  }, []);

  const handleCopyToClipboard = useCallback((text: string, type: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast({
      title: `${type} Copied!`,
      description: `The ${type.toLowerCase()} has been copied to your clipboard.`,
    });
  }, [toast]);
  
  const handleEditPrompt = useCallback((prompt: PromptHistory) => {
    const queryParams = new URLSearchParams({ 
        name: prompt.name, 
        goal: prompt.goal, 
        optimizedPrompt: prompt.optimizedPrompt,
        tags: prompt.tags?.join(',') || ''
    });
    if (prompt.qualityScore) queryParams.set('qualityScore', prompt.qualityScore.toString());
    if (prompt.targetModel) queryParams.set('targetModel', prompt.targetModel);

    router.push(`/create-prompt?${queryParams.toString()}`);
    toast({ title: "Loading Prompt", description: `Loading "${prompt.name}" for a new session.`});
  }, [router, toast]);

  const handleExportPrompt = useCallback((prompt: PromptHistory) => {
    let content = `Name: ${prompt.name}\nGoal: ${prompt.goal}\nTags: ${prompt.tags?.join(', ') || 'N/A'}\n`;
    if (prompt.qualityScore) content += `Quality Score: ${prompt.qualityScore}/10\n`;
    if (prompt.targetModel) content += `Target Model: ${prompt.targetModel}\n`;
    content += `\nOptimized Prompt:\n${prompt.optimizedPrompt}`;
    
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    const safeName = prompt.name.substring(0,20).replace(/[^a-z0-9]/gi, '_').toLowerCase();
    link.download = `brieflyai_prompt_${safeName}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "Prompt Exported", description: "The prompt details have been downloaded as a .txt file." });
  }, [toast]);

  const openDeleteDialog = useCallback((prompt: PromptHistory) => {
    setPromptToDelete(prompt);
  }, []);

  const handleDeletePrompt = useCallback(async () => {
    if (!promptToDelete || !currentUser) return;
    try {
      await deleteDoc(doc(db, `users/${currentUser.uid}/promptHistory`, promptToDelete.id));
      setPrompts(prevPrompts => prevPrompts.filter(p => p.id !== promptToDelete.id));
      toast({ title: "Prompt Deleted", description: `Prompt "${promptToDelete.name}" has been deleted.`});
    } catch (error) {
      console.error("Error deleting prompt from Firestore:", error);
      toast({ title: "Error Deleting Prompt", description: "Could not delete prompt.", variant: "destructive" });
    } finally {
      setPromptToDelete(null);
    }
  }, [promptToDelete, currentUser, toast]);

  const sortedAndFilteredPrompts = useMemo(() => {
    let filtered = prompts.filter(prompt => {
      const lowerSearchTerm = searchTerm.toLowerCase();
      return (
        prompt.name.toLowerCase().includes(lowerSearchTerm) ||
        prompt.goal.toLowerCase().includes(lowerSearchTerm) ||
        (prompt.optimizedPrompt && prompt.optimizedPrompt.toLowerCase().includes(lowerSearchTerm)) ||
        (prompt.tags && prompt.tags.some(tag => tag.toLowerCase().includes(lowerSearchTerm))) ||
        (prompt.targetModel && prompt.targetModel.toLowerCase().includes(lowerSearchTerm))
      );
    });

    switch (sortOption) {
      case "timestamp_asc":
        return filtered.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      case "name_asc":
        return filtered.sort((a, b) => a.name.localeCompare(b.name));
      case "name_desc":
        return filtered.sort((a, b) => b.name.localeCompare(a.name));
      case "timestamp_desc":
      default:
        return filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }
  }, [prompts, searchTerm, sortOption]);

  if (authLoading || (!currentUser && authLoading)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading vault...</p>
      </div>
    );
  }
  
  if (!currentUser) { 
     return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <p className="mt-4 text-muted-foreground">Please log in to view your Prompt Vault.</p>
        <Button asChild className="mt-4"><Link href="/login">Login</Link></Button>
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
          <GlassCard>
            <GlassCardHeader>
              <GlassCardTitle className="font-headline text-3xl flex items-center">
                <Archive className="mr-3 h-8 w-8 text-primary" />
                Prompt Vault
              </GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent>
              <p className="text-muted-foreground mb-4">
                Browse, search, sort, and manage all your saved prompts.
              </p>
              <div className="mb-6 flex flex-col sm:flex-row gap-2">
                <div className="relative flex-grow">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search by name, goal, content, tags, or model..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex-shrink-0 sm:w-auto w-full">
                  <Select value={sortOption} onValueChange={(value) => setSortOption(value as SortOption)}>
                    <SelectTrigger className="w-full sm:w-[220px]" aria-label="Sort prompts by">
                      <ArrowDownUp className="mr-2 h-4 w-4 text-muted-foreground" />
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
              </div>

              {isLoadingPrompts ? (
                <div className="text-center py-16">
                  <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary mb-4" />
                  <h3 className="font-semibold text-xl text-foreground">Loading Your Prompts...</h3>
                </div>
              ) : sortedAndFilteredPrompts.length > 0 ? (
                <div className="space-y-4">
                  {sortedAndFilteredPrompts.map((prompt) => (
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
                <div className="text-center py-16">
                  <Search className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="font-semibold text-xl text-foreground">No Prompts Found</h3>
                  <p className="text-muted-foreground mt-2 text-md">
                    {searchTerm ? "Try adjusting your search terms or clear the search." : "You haven't saved any prompts yet. Create one!"}
                  </p>
                  {!searchTerm && (
                    <Button asChild className="mt-6">
                      <Link href="/create-prompt">Create New Prompt</Link>
                    </Button>
                  )}
                </div>
              )}
            </GlassCardContent>
          </GlassCard>
        </Container>
      </main>
      
      {promptToDelete && (
        <AlertDialog open={!!promptToDelete} onOpenChange={() => setPromptToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. Prompt &quot;{promptToDelete.name}&quot; will be permanently deleted.
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
              <DialogTitle className="text-2xl font-headline">{viewingPrompt.name}</DialogTitle>
              <DialogDescription>Review your prompt details.</DialogDescription>
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
              {viewingPrompt.tags && viewingPrompt.tags.length > 0 && (
                <div>
                  <Label className="text-sm font-semibold text-foreground flex items-center"><Tag className="mr-2 h-4 w-4"/>Tags</Label>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {viewingPrompt.tags.map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}
                  </div>
                </div>
              )}
              {typeof viewingPrompt.qualityScore === 'number' && (
                 <div>
                  <Label className="text-sm font-semibold text-foreground">Quality Score</Label>
                  <p className="mt-1 text-sm text-muted-foreground">{viewingPrompt.qualityScore}/10</p>
                </div>
              )}
              {viewingPrompt.targetModel && (
                <div>
                  <Label className="text-sm font-semibold text-foreground">Target Model</Label>
                  <p className="mt-1 text-sm text-muted-foreground">{viewingPrompt.targetModel}</p>
                </div>
              )}
              <div>
                <Label className="text-sm font-semibold text-foreground">Created/Updated</Label>
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
    </DashboardLayout>
  );
}
