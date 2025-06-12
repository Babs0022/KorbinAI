
"use client";

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/shared/GlassCard';
import { CheckCircle, Copy, Edit3, Download, Save, AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { PromptHistory } from '@/components/dashboard/PromptHistoryItem';

interface OptimizedPromptCardProps {
  optimizedPrompt: string;
  originalGoal: string;
}

const LOCAL_STORAGE_KEY = 'brieflyai_prompt_history';

export function OptimizedPromptCard({ optimizedPrompt, originalGoal }: OptimizedPromptCardProps) {
  const [editedPrompt, setEditedPrompt] = useState(optimizedPrompt);
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();

  const handleCopy = () => {
    navigator.clipboard.writeText(editedPrompt);
    toast({ title: "Prompt Copied!", description: "The optimized prompt has been copied to your clipboard." });
  };

  const handleSaveEdit = () => {
    // This only saves the edit locally in the component state for now.
    // If "Save to History" is clicked later, this edited version will be saved.
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

  const handleSaveToHistory = () => {
    try {
      const existingHistoryString = localStorage.getItem(LOCAL_STORAGE_KEY);
      const existingHistory: PromptHistory[] = existingHistoryString ? JSON.parse(existingHistoryString) : [];
      
      const newPromptEntry: PromptHistory = {
        id: crypto.randomUUID(), // Generate a unique ID
        goal: originalGoal,
        optimizedPrompt: editedPrompt, // Save the potentially edited prompt
        timestamp: new Date().toISOString(),
        // tags: [] // Add tags functionality later if needed
      };

      const updatedHistory = [newPromptEntry, ...existingHistory]; // Add new prompt to the beginning
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedHistory));
      
      toast({ title: "Prompt Saved!", description: "This prompt has been saved to your local history." });
    } catch (error) {
      console.error("Error saving to localStorage:", error);
      toast({ title: "Save Failed", description: "Could not save prompt to local history.", variant: "destructive" });
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
          <Button variant="outline" onClick={handleSaveToHistory} size="sm">
            <Save className="mr-2 h-4 w-4" /> Save to History
          </Button>
          <Button variant="outline" onClick={handleExport} size="sm">
            <Download className="mr-2 h-4 w-4" /> Export
          </Button>
        </div>
      </GlassCardContent>
    </GlassCard>
  );
}
