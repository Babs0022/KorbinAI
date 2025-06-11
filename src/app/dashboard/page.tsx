
"use client"; 

import React, { useState, useEffect } from 'react';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { Footer } from '@/components/layout/Footer';
import Container from '@/components/layout/Container';
import { AccountInfoCard } from '@/components/dashboard/AccountInfoCard';
import { PromptHistoryItem, type PromptHistory } from '@/components/dashboard/PromptHistoryItem';
import { Button } from '@/components/ui/button';
import { PlusCircle, Search, ListFilter, Loader2 } from 'lucide-react';
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
} from "@/components/ui/alert-dialog"
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';


export default function DashboardPage() {
  const { currentUser, loading } = useAuth();
  const router = useRouter();
  const [prompts, setPrompts] = useState<PromptHistory[]>([]); 
  const [searchTerm, setSearchTerm] = useState('');
  const [promptToDelete, setPromptToDelete] = useState<PromptHistory | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && !currentUser) {
      router.push('/login');
    }
  }, [currentUser, loading, router]);

  if (loading || !currentUser) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
      </div>
    );
  }

  // TODO: Implement actual view, edit, export logic when Firestore is integrated
  const handleViewPrompt = (prompt: PromptHistory) => alert(`Viewing prompt (ID: ${prompt.id}): ${prompt.goal}`);
  const handleEditPrompt = (prompt: PromptHistory) => alert(`Editing prompt (ID: ${prompt.id}): ${prompt.goal}`);
  const handleExportPrompt = (prompt: PromptHistory) => alert(`Exporting prompt (ID: ${prompt.id}): ${prompt.goal}`);
  
  const openDeleteDialog = (prompt: PromptHistory) => {
    setPromptToDelete(prompt);
  };

  const handleDeletePrompt = () => {
    if (!promptToDelete) return;
    // TODO: Delete from Firestore when integrated
    setPrompts(prompts.filter(p => p.id !== promptToDelete.id));
    toast({ title: "Prompt Deleted", description: `Prompt "${promptToDelete.goal.substring(0,30)}..." has been deleted.`});
    setPromptToDelete(null); // Close dialog
  };

  const filteredPrompts = prompts.filter(prompt => 
    prompt.goal.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (prompt.optimizedPrompt && prompt.optimizedPrompt.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardHeader />
      <main className="flex-grow bg-gradient-to-br from-background via-indigo-50/30 to-mint-50/30 py-8">
        <Container>
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="lg:col-span-1">
              <AccountInfoCard />
            </div>
            <div className="lg:col-span-2">
              <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="font-headline text-2xl font-semibold text-foreground">Prompt History</h2>
                <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  <Link href="/create-prompt">
                    <PlusCircle className="mr-2 h-4 w-4" /> Create New Prompt
                  </Link>
                </Button>
              </div>

              <div className="mb-6 flex gap-2">
                <div className="relative flex-grow">
                   <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input 
                    type="search" 
                    placeholder="Search prompts..." 
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Button variant="outline">
                  <ListFilter className="mr-2 h-4 w-4" /> Filter
                </Button>
              </div>

              {prompts.length === 0 && !searchTerm ? (
                 <div className="text-center py-10 rounded-lg bg-card/50 p-6">
                  <Search className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="font-semibold text-xl text-foreground">No Prompts Yet</h3>
                  <p className="text-muted-foreground mt-2">
                    You haven&apos;t created any prompts. Get started by creating one!
                  </p>
                    <Button asChild className="mt-4 bg-primary hover:bg-primary/90 text-primary-foreground">
                        <Link href="/create-prompt">
                        <PlusCircle className="mr-2 h-4 w-4" /> Create New Prompt
                        </Link>
                    </Button>
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
                  <Search className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="font-semibold text-xl text-foreground">No Prompts Found</h3>
                  <p className="text-muted-foreground mt-2">
                    Try adjusting your search terms.
                  </p>
                </div>
              )}
            </div>
          </div>
        </Container>
      </main>
      <Footer />
      {promptToDelete && (
        <AlertDialog open={!!promptToDelete} onOpenChange={() => setPromptToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure you want to delete this prompt?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. The prompt titled &quot;{promptToDelete.goal.substring(0,50)}...&quot; will be permanently deleted.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setPromptToDelete(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeletePrompt} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
