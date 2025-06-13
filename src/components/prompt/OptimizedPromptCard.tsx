
"use client";

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/shared/GlassCard';
import { CheckCircle, Copy, Edit3, Download, Save, AlertTriangle, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { PromptHistory } from '@/components/dashboard/PromptHistoryItem';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

interface OptimizedPromptCardProps {
  optimizedPrompt: string;
  originalGoal: string;
}

export function OptimizedPromptCard({ optimizedPrompt, originalGoal }: OptimizedPromptCardProps) {
  const [editedPrompt, setEditedPrompt] = useState(optimizedPrompt);
  const [isEditing, setIsEditing] = useState(false);
  const [isSavingToHistory, setIsSavingToHistory] = useState(false);
  const { toast } = useToast();
  const { currentUser } = useAuth();

  const handleCopy = () => {
    navigator.clipboard.writeText(editedPrompt);
    toast({ title: "Prompt Copied!", description: "The optimized prompt has been copied to your clipboard." });
  };

  const handleSaveEdit = () => {
    toast({ title: "Changes Applied!", description: "Your edits are applied. Click 'Save to History' to persist." });
    setIsEditing(false);
  };
  
  const handleExport = () => {
    const blob = new Blob([editedPrompt], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `brieflyai_prompt_${originalGoal.substring(0,20).replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "Prompt Exported!", description: "The prompt has been downloaded." });
  };

  const handleSaveToHistory = async () => {
    if (!currentUser) {
      toast({ title: "Login Required", description: "Please log in to save prompts to your history.", variant: "destructive" });
      return;
    }
    setIsSavingToHistory(true);
    try {
      const newPromptEntry: Omit<PromptHistory, 'id' | 'timestamp'> & { timestamp: any } = { // Allow serverTimestamp type
        goal: originalGoal,
        optimizedPrompt: editedPrompt, // Save the potentially edited prompt
        timestamp: serverTimestamp(), // Use Firestore server timestamp for ordering
        // tags: [] // Add tags functionality later if needed
      };

      await addDoc(collection(db, `users/${currentUser.uid}/promptHistory`), newPromptEntry);
      
      toast({ title: "Prompt Saved!", description: "This prompt has been saved to your cloud history." });
    } catch (error) {
      console.error("Error saving to Firestore:", error);
      toast({ title: "Save Failed", description: "Could not save prompt to cloud history. Please try again.", variant: "destructive" });
    } finally {
      setIsSavingToHistory(false);
    }
  };

  if (!optimizedPrompt) {
     return (
      <GlassCard className="mt-8">
        <GlassCardHeader>
          <GlassCardTitle className="flex items-center font-headline text-xl">
            <AlertTriangle className="mr-2 h-6 w-6 text-destructive" />
            Optimization Error
          </GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent>
          <p className="text-muted-foreground">
            There was an issue generating your optimized prompt. Please try adjusting your goal or survey answers and try again.
          </p>
        </GlassCardContent>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="mt-8">
      <GlassCardHeader>
        <GlassCardTitle className="flex items-center font-headline text-xl">
          <CheckCircle className="mr-2 h-6 w-6 text-accent" />
          Your Optimized Prompt
        </GlassCardTitle>
      </GlassCardHeader>
      <GlassCardContent>
        {isEditing ? (
          <Textarea
            value={editedPrompt}
            onChange={(e) => setEditedPrompt(e.target.value)}
            rows={10}
            className="text-sm leading-relaxed font-code bg-muted/50 p-4 rounded-md border focus:ring-accent"
          />
        ) : (
          <div className="text-sm leading-relaxed font-code bg-muted/50 p-4 rounded-md border whitespace-pre-wrap min-h-[150px]">
            {editedPrompt}
          </div>
        )}
        <div className="mt-6 flex flex-wrap gap-2 justify-end">
          <Button variant="outline" onClick={handleCopy} size="sm">
            <Copy className="mr-2 h-4 w-4" /> Copy
          </Button>
          {isEditing ? (
            <Button variant="default" onClick={handleSaveEdit} size="sm" className="bg-accent hover:bg-accent/90 text-accent-foreground">
              <Save className="mr-2 h-4 w-4" /> Apply Edit
            </Button>
          ) : (
            <Button variant="outline" onClick={() => setIsEditing(true)} size="sm">
              <Edit3 className="mr-2 h-4 w-4" /> Edit
            </Button>
          )}
          <Button variant="outline" onClick={handleSaveToHistory} size="sm" disabled={isSavingToHistory || !currentUser}>
            {isSavingToHistory ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save to History
          </Button>
          <Button variant="outline" onClick={handleExport} size="sm">
            <Download className="mr-2 h-4 w-4" /> Export
          </Button>
        </div>
      </GlassCardContent>
    </GlassCard>
  );
}
