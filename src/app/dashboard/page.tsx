"use client"; // Required for useState, useEffect, and event handlers

import React, { useState } from 'react';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { Footer } from '@/components/layout/Footer';
import Container from '@/components/layout/Container';
import { AccountInfoCard } from '@/components/dashboard/AccountInfoCard';
import { PromptHistoryItem, type PromptHistory } from '@/components/dashboard/PromptHistoryItem';
import { Button } from '@/components/ui/button';
import { PlusCircle, Search, ListFilter } from 'lucide-react';
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


// Mock data for prompt history - replace with Firestore data
const mockPromptHistory: PromptHistory[] = [
  {
    id: '1',
    goal: 'Write a marketing email for a new SaaS product launch targeting small businesses.',
    optimizedPrompt: 'Craft a compelling marketing email for the launch of "BrieflyAI", a new SaaS product designed to help small businesses optimize AI prompts. Highlight key benefits like time-saving, improved AI output quality, and ease of use. Include a clear call to action to sign up for a free trial. Target audience: non-technical small business owners.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    tags: ['marketing', 'email', 'saas']
  },
  {
    id: '2',
    goal: 'Generate a blog post outline about the future of AI in education.',
    optimizedPrompt: 'Create a comprehensive blog post outline discussing the transformative potential of AI in education. Include sections on personalized learning, AI-powered tutoring systems, administrative efficiencies, ethical considerations, and future trends. Ensure the tone is informative and optimistic yet balanced.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(), // 3 days ago
    tags: ['blog', 'ai', 'education']
  },
  {
    id: '3',
    goal: 'Summarize a long research paper on climate change impact.',
    optimizedPrompt: 'Provide a concise summary (approx. 300 words) of the attached research paper on climate change impact, focusing on key findings, methodology, and main conclusions. The summary should be accessible to a general audience without losing scientific accuracy.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 120).toISOString(), // 5 days ago
    tags: ['summary', 'research', 'climate change']
  },
];


export default function DashboardPage() {
  const [prompts, setPrompts] = useState<PromptHistory[]>(mockPromptHistory);
  const [searchTerm, setSearchTerm] = useState('');
  const [promptToDelete, setPromptToDelete] = useState<PromptHistory | null>(null);
  const { toast } = useToast();

  const handleViewPrompt = (prompt: PromptHistory) => alert(`Viewing prompt: ${prompt.goal}`);
  const handleEditPrompt = (prompt: PromptHistory) => alert(`Editing prompt: ${prompt.goal}`);
  const handleExportPrompt = (prompt: PromptHistory) => alert(`Exporting prompt: ${prompt.goal}`);
  
  const openDeleteDialog = (prompt: PromptHistory) => {
    setPromptToDelete(prompt);
  };

  const handleDeletePrompt = () => {
    if (!promptToDelete) return;
    setPrompts(prompts.filter(p => p.id !== promptToDelete.id));
    toast({ title: "Prompt Deleted", description: `Prompt "${promptToDelete.goal.substring(0,30)}..." has been deleted.`});
    setPromptToDelete(null); // Close dialog
  };

  const filteredPrompts = prompts.filter(prompt => 
    prompt.goal.toLowerCase().includes(searchTerm.toLowerCase()) ||
    prompt.optimizedPrompt.toLowerCase().includes(searchTerm.toLowerCase())
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

              {filteredPrompts.length > 0 ? (
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
                <div className="text-center py-10">
                  <Search className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="font-semibold text-xl text-foreground">No Prompts Found</h3>
                  <p className="text-muted-foreground mt-2">
                    {searchTerm ? "Try adjusting your search or create a new prompt." : "You haven't created any prompts yet. Get started by creating one!"}
                  </p>
                   {!searchTerm && (
                    <Button asChild className="mt-4 bg-primary hover:bg-primary/90 text-primary-foreground">
                        <Link href="/create-prompt">
                        <PlusCircle className="mr-2 h-4 w-4" /> Create New Prompt
                        </Link>
                    </Button>
                   )}
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
