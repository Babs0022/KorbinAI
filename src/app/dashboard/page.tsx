
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { MinimalFooter } from '@/components/layout/MinimalFooter';
import { PromptHistoryItem, type PromptHistory } from '@/components/dashboard/PromptHistoryItem';
import { FeatureCard, type FeatureInfo } from '@/components/dashboard/FeatureCard';
import { Button } from '@/components/ui/button';
import { PlusCircle, Search, Loader2, Copy, Eye, Bell, Lightbulb, Archive, Settings2, School, Undo2, Puzzle, FileText, Wand2, BarChart3, TrendingUp, Brain, TestTubes, Maximize, AlertTriangle, Tag, Star } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, getDocs, deleteDoc, doc, Timestamp, limit } from 'firebase/firestore';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/shared/GlassCard';
import { AnalyticsSummaryCard } from '@/components/dashboard/AnalyticsSummaryCard';
import Container from '@/components/layout/Container';
import { Badge } from '@/components/ui/badge';

interface Announcement {
  id: string;
  title: string;
  content: string;
  timestamp: string;
}

const features: Omit<FeatureInfo, 'isPremium' | 'isUnlimitedFeature'>[] = [ 
  {
    title: "Prompt Generator",
    description: "Input goals, answer surveys, and get optimized AI prompts.",
    href: "/create-prompt",
    icon: Lightbulb,
    enabled: true,
  },
  {
    title: "Prompt Vault",
    description: "Store, organize, and categorize your most effective prompts.",
    href: "/dashboard/prompt-vault",
    icon: Archive,
    enabled: true,
  },
  {
    title: "Prompt Refinement Hub",
    description: "Modify previously generated prompts with suggested refinements.",
    href: "/dashboard/refinement-hub",
    icon: Settings2,
    enabled: true,
  },
  {
    title: "Model-Specific Prompts",
    description: "Customize prompts based on the AI model you intend to use.",
    href: "/dashboard/model-specific-prompts",
    icon: Puzzle,
    enabled: true,
  },
  {
    title: "Contextual Prompting",
    description: "Generate prompts based on existing content you provide.",
    href: "/dashboard/contextual-prompting",
    icon: FileText,
    enabled: true,
  },
  {
    title: "Prompt Academy",
    description: "Learn advanced prompting techniques with tutorials and best practices.",
    href: "/dashboard/academy",
    icon: School,
    enabled: true,
  },
  {
    title: "Real-Time AI Prompt Suggestions",
    description: "Get AI-powered suggestions as you type your prompts.",
    href: "/dashboard/real-time-suggestions",
    icon: Wand2,
    enabled: true,
  },
  {
    title: "Prompt Feedback & Analysis",
    description: "Receive a quality score and actionable feedback on your prompts.",
    href: "/dashboard/feedback-analysis",
    icon: BarChart3,
    enabled: true,
  },
  {
    title: "Reverse Prompting",
    description: "Reverse-engineer AI output back into a potential prompt.",
    href: "/dashboard/reverse-prompting",
    icon: Undo2,
    enabled: true,
  },
  {
    title: "Prompt Analytics Dashboard",
    description: "Track the performance and effectiveness of your generated prompts.",
    href: "/dashboard/analytics",
    icon: TrendingUp,
    enabled: true,
  },
  {
    title: "Prompt Learning Mode",
    description: "BrieflyAI learns your style to suggest more personalized prompts.",
    href: "/dashboard/learning-mode",
    icon: Brain,
    enabled: true,
  },
  {
    title: "A/B Prompt Testing",
    description: "Compare prompt variations across different models to find the optimal combination.",
    href: "/dashboard/compatibility-checker",
    icon: TestTubes,
    enabled: true,
  },
];


export default function DashboardPage() {
  const { currentUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const [allUserPrompts, setAllUserPrompts] = useState<PromptHistory[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [promptToDelete, setPromptToDelete] = useState<PromptHistory | null>(null);
  const [viewingPrompt, setViewingPrompt] = useState<PromptHistory | null>(null);
  const { toast } = useToast();

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoadingAnnouncements, setIsLoadingAnnouncements] = useState(true);

  const [averagePromptScore, setAveragePromptScore] = useState<number | null>(null);
  const [mostFrequentTag, setMostFrequentTag] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    if (!currentUser) {
      setIsLoadingData(false);
      setAllUserPrompts([]);
      setAveragePromptScore(null);
      setMostFrequentTag(null);
      return;
    }
    setIsLoadingData(true);
    try {
      const allPromptsQuery = query(collection(db, `users/${currentUser.uid}/promptHistory`), orderBy("timestamp", "desc"));
      const querySnapshot = await getDocs(allPromptsQuery);
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
      setAllUserPrompts(firestorePrompts);

      const scoredPrompts = firestorePrompts.filter(p => typeof p.qualityScore === 'number' && p.qualityScore !== undefined);
      if (scoredPrompts.length > 0) {
        const sum = scoredPrompts.reduce((acc, p) => acc + (p.qualityScore || 0), 0);
        setAveragePromptScore(parseFloat((sum / scoredPrompts.length).toFixed(1)));
      } else {
        setAveragePromptScore(null);
      }

      const tagCounts: Record<string, number> = {};
      firestorePrompts.forEach(prompt => {
        if (prompt.tags && prompt.tags.length > 0) {
          prompt.tags.forEach(tag => {
            const normalizedTag = tag.toLowerCase().trim();
            if (normalizedTag) {
                tagCounts[normalizedTag] = (tagCounts[normalizedTag] || 0) + 1;
            }
          });
        }
      });

      if (Object.keys(tagCounts).length > 0) {
        const sortedTags = Object.entries(tagCounts).sort(([,a],[,b]) => b-a);
        setMostFrequentTag(sortedTags[0][0]); 
      } else {
        setMostFrequentTag(null);
      }

    } catch (error) {
      console.error("Error loading dashboard data from Firestore:", error);
      toast({ title: "Error Loading Data", description: "Could not load dashboard data.", variant: "destructive"});
      setAllUserPrompts([]);
      setAveragePromptScore(null);
      setMostFrequentTag(null);
    } finally {
      setIsLoadingData(false);
    }
  }, [currentUser, toast]);

  const fetchAnnouncements = useCallback(async () => {
    setIsLoadingAnnouncements(true);
    try {
      const announcementsQuery = query(collection(db, `appAnnouncements`), orderBy("timestamp", "desc"), limit(1));
      const querySnapshot = await getDocs(announcementsQuery);
      const fetchedAnnouncements = querySnapshot.docs.map(docSnap => {
          const data = docSnap.data();
          let timestampStr = new Date().toISOString();
          if (data.timestamp instanceof Timestamp) {
            timestampStr = data.timestamp.toDate().toISOString();
          }
          return {
            id: docSnap.id,
            title: data.title || 'Update',
            content: data.content || 'No content available.',
            timestamp: timestampStr
          } as Announcement;
      });
      setAnnouncements(fetchedAnnouncements);
    } catch (error) {
       console.error("Error loading announcements:", error);
       // No toast here to avoid bothering users if announcements fail to load
       setAnnouncements([]);
    } finally {
        setIsLoadingAnnouncements(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push('/login');
    } else if (currentUser) {
      fetchDashboardData();
      fetchAnnouncements();
    } else if (!authLoading && !currentUser) {
      setIsLoadingData(false);
      setAllUserPrompts([]);
      setAveragePromptScore(null);
      setMostFrequentTag(null);
      setIsLoadingAnnouncements(false);
    }
  }, [currentUser, authLoading, router, fetchDashboardData, fetchAnnouncements]);
  
  const totalPromptsCount = useMemo(() => allUserPrompts.length, [allUserPrompts]);

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
      
      setAllUserPrompts(prevPrompts => {
        const updatedPrompts = prevPrompts.filter(p => p.id !== promptToDelete.id);
        
        const scoredPrompts = updatedPrompts.filter(p => typeof p.qualityScore === 'number' && p.qualityScore !== undefined);
        if (scoredPrompts.length > 0) {
          const sum = scoredPrompts.reduce((acc, p) => acc + (p.qualityScore || 0), 0);
          setAveragePromptScore(parseFloat((sum / scoredPrompts.length).toFixed(1)));
        } else {
          setAveragePromptScore(null);
        }

        const tagCounts: Record<string, number> = {};
        updatedPrompts.forEach(pItem => {
          if (pItem.tags && pItem.tags.length > 0) {
            pItem.tags.forEach(tag => {
              const normalizedTag = tag.toLowerCase().trim();
               if (normalizedTag) {
                  tagCounts[normalizedTag] = (tagCounts[normalizedTag] || 0) + 1;
              }
            });
          }
        });
        if (Object.keys(tagCounts).length > 0) {
          const sortedTags = Object.entries(tagCounts).sort(([,a],[,b]) => b-a);
          setMostFrequentTag(sortedTags[0][0]);
        } else {
          setMostFrequentTag(null);
        }
        return updatedPrompts;
      });

      toast({ title: "Prompt Deleted", description: `Prompt "${promptToDelete.name}" has been deleted.`});
    } catch (error) {
      console.error("Error deleting prompt from Firestore:", error);
      toast({ title: "Error Deleting Prompt", description: "Could not delete prompt.", variant: "destructive"});
      fetchDashboardData(); 
    } finally {
      setPromptToDelete(null);
    }
  }, [promptToDelete, currentUser, toast, fetchDashboardData]);

  const filteredPrompts = useMemo(() => {
    if (!searchTerm) {
      return allUserPrompts;
    }
    return allUserPrompts.filter(prompt => {
      const lowerSearchTerm = searchTerm.toLowerCase();
      return (
        prompt.name.toLowerCase().includes(lowerSearchTerm) ||
        prompt.goal.toLowerCase().includes(lowerSearchTerm) ||
        (prompt.optimizedPrompt && prompt.optimizedPrompt.toLowerCase().includes(lowerSearchTerm)) ||
        (prompt.tags && prompt.tags.some(tag => tag.toLowerCase().includes(lowerSearchTerm))) ||
        (prompt.targetModel && prompt.targetModel.toLowerCase().includes(lowerSearchTerm))
      );
    });
  }, [allUserPrompts, searchTerm]);

  if (authLoading || (isLoadingData && !currentUser)) { 
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
      </div>
    );
  }
  
  if (!currentUser && !authLoading) {
     return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <p className="mt-4 text-muted-foreground">Please log in to view your dashboard.</p>
        <Button asChild className="mt-4"><Link href="/login">Login</Link></Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardHeader />
      <main className="flex-1 bg-gradient-to-br from-background via-indigo-50/30 to-mint-50/30 overflow-y-auto">
        <Container className="py-8">
          <h1 className="font-headline text-3xl font-bold text-foreground mb-2">Welcome to BrieflyAI</h1>
          <p className="text-muted-foreground mb-8">
            Your central hub for creating, managing, and optimizing AI prompts.
          </p>

          <section className="mb-8">
              <h2 className="font-headline text-xl font-semibold text-foreground mb-4">Your Prompting Snapshot</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <AnalyticsSummaryCard 
                  title="Total Prompts in Vault" 
                  value={isLoadingData ? "..." : String(totalPromptsCount)} 
                  icon={Archive} 
                  description="Your saved prompts" 
                />
                <AnalyticsSummaryCard 
                  title="Average Prompt Score" 
                  value={isLoadingData ? "..." : (averagePromptScore !== null ? `${averagePromptScore}/10` : "N/A")} 
                  icon={Star} 
                  description="Average of your scored prompts" 
                />
                <AnalyticsSummaryCard 
                  title="Most Frequent Tag" 
                  value={isLoadingData ? "..." : (mostFrequentTag || "N/A")}
                  icon={Tag} 
                  description="Your most used prompt tag" 
                />
              </div>
          </section>

          <section className="mb-8">
            <h2 className="font-headline text-xl font-semibold text-foreground mb-6">Explore Features</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {features.map((feature) => (
                <FeatureCard key={feature.title} feature={feature as FeatureInfo} />
              ))}
            </div>
          </section>

          <section className="mb-8">
            <GlassCard>
              <GlassCardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <GlassCardTitle className="text-xl font-headline">Recent Prompts</GlassCardTitle>
                  <Button variant="outline" size="sm" asChild className="mt-2 sm:mt-0">
                      <Link href="/dashboard/prompt-vault">
                        View Full Prompt Vault <Maximize className="ml-2 h-4 w-4" />
                      </Link>
                  </Button>
                </div>
              </GlassCardHeader>
              <GlassCardContent>
                <div className="mb-4 flex gap-2">
                    <div className="relative flex-grow">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        type="search"
                        placeholder="Search recent prompts by name, goal, tags..."
                        className="pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        aria-label="Search recent prompts"
                      />
                    </div>
                  </div>

                {isLoadingData ? (
                  <div className="text-center py-10">
                    <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary mb-3" />
                    <h3 className="font-semibold text-lg text-foreground">Loading Recent Prompts...</h3>
                  </div>
                ) : filteredPrompts.length > 0 ? (
                  <div className="space-y-4">
                    {filteredPrompts.slice(0, 3).map((prompt) => (
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
                  <div className="text-center py-10">
                    <Search className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
                    <h3 className="font-semibold text-lg text-foreground">No Prompts Found</h3>
                    <p className="text-muted-foreground mt-1 text-sm">
                      {searchTerm ? "Try adjusting your search terms." : "Create a new prompt to see it here!"}
                    </p>
                    {!searchTerm && (
                      <Button asChild className="mt-4">
                        <Link href="/create-prompt">
                          <PlusCircle className="mr-2 h-4 w-4"/> Create New Prompt
                        </Link>
                      </Button>
                    )}
                  </div>
                )}
              </GlassCardContent>
            </GlassCard>
          </section>

          <section>
              <GlassCard>
                  <GlassCardHeader>
                      <GlassCardTitle className="text-xl font-headline flex items-center"><Bell className="mr-2 h-5 w-5"/> Notifications & Updates</GlassCardTitle>
                  </GlassCardHeader>
                  <GlassCardContent>
                      {isLoadingAnnouncements ? (
                        <div className="flex items-center text-muted-foreground">
                          <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                          <p>Loading latest announcements...</p>
                        </div>
                      ) : announcements.length > 0 ? (
                        <div className="text-muted-foreground">
                          <h4 className="font-semibold text-foreground mb-1">{announcements[0].title}</h4>
                          <p className="text-sm whitespace-pre-line">{announcements[0].content}</p>
                          <p className="text-xs text-muted-foreground/70 mt-2">
                            {new Date(announcements[0].timestamp).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </p>
                        </div>
                      ) : (
                        <div className="flex items-center text-muted-foreground">
                          <Bell className="mr-3 h-6 w-6 text-primary" />
                          <p>No new updates right now. Stay tuned!</p>
                        </div>
                      )}
                  </GlassCardContent>
              </GlassCard>
          </section>
        </Container>
      </main>
      <MinimalFooter />

      {promptToDelete && (
        <AlertDialog open={!!promptToDelete} onOpenChange={() => setPromptToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. Prompt &quot;{promptToDelete.name}&quot; will be deleted.
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
    </div>
  );
}
