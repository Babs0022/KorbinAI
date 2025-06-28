
"use client";

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/shared/GlassCard';
import { CheckCircle, Copy, Edit3, Download, Save, AlertTriangle, Loader2, Tag, BarChart3 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { PromptHistory } from '@/components/dashboard/PromptHistoryItem.d';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

interface OptimizedPromptCardProps {
  optimizedPrompt: string;
  originalGoal: string;
  targetModel?: string;
  generatedName?: string;
  generatedTags?: string[];
  qualityScore?: number;
}

export function OptimizedPromptCard({ optimizedPrompt, originalGoal, targetModel, generatedName, generatedTags, qualityScore }: OptimizedPromptCardProps) {
  const [promptName, setPromptName] = useState('');
  const [promptTags, setPromptTags] = useState('');
  const [editedPromptText, setEditedPromptText] = useState(optimizedPrompt);
  const [isEditing, setIsEditing] = useState(false);
  const [isSavingToHistory, setIsSavingToHistory] = useState(false);
  const [isAlreadySaved, setIsAlreadySaved] = useState(false);
  const { toast } = useToast();
  const { currentUser } = useAuth();

  useEffect(() => {
    setPromptName(generatedName || originalGoal.substring(0, 50) + (originalGoal.length > 50 ? '...' : ''));
    setPromptTags(generatedTags?.join(', ') || '');
    setEditedPromptText(optimizedPrompt);
    // Reset state for new prompt
    setIsEditing(false);
    setIsAlreadySaved(false);
  }, [originalGoal, optimizedPrompt, generatedName, generatedTags, qualityScore]);

  const handleCopy = () => {
    navigator.clipboard.writeText(editedPromptText);
    toast({ title: "Prompt Copied!", description: "The optimized prompt has been copied to your clipboard." });
  };

  const handleSaveEdit = () => {
    toast({ title: "Changes Applied!", description: "Your edits are applied. Click 'Save to History' to persist." });
    setIsEditing(false);
  };
  
  const handleExport = () => {
    const content = `Name: ${promptName}\nGoal: ${originalGoal}\nTags: ${promptTags}\nTarget Model: ${targetModel || 'N/A'}\nQuality Score: ${qualityScore || 'N/A'}\n\nOptimized Prompt:\n${editedPromptText}`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    const safeName = promptName.substring(0,20).replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'prompt';
    link.download = `brieflyai_${safeName}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "Prompt Exported!", description: "The prompt details have been downloaded." });
  };

  const handleSaveToHistory = async () => {
    if (!currentUser) {
      toast({ title: "Login Required", description: "Please log in to save prompts to your history.", variant: "destructive" });
      return;
    }
    if (!promptName.trim()) {
      toast({ title: "Prompt Name Required", description: "Please enter a name for your prompt.", variant: "destructive" });
      return;
    }

    setIsSavingToHistory(true);
    try {
      const tagsArray = promptTags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
      
      const newPromptEntry: Omit<PromptHistory, 'id' | 'timestamp'> & { timestamp: any } = {
        name: promptName,
        goal: originalGoal,
        optimizedPrompt: editedPromptText, 
        tags: tagsArray,
        targetModel: targetModel || undefined,
        qualityScore: qualityScore,
        timestamp: serverTimestamp(),
      };

      await addDoc(collection(db, `users/${currentUser.uid}/promptHistory`), newPromptEntry);
      
      toast({ title: "Prompt Saved!", description: `"${promptName}" has been saved to your cloud history.` });
      setIsAlreadySaved(true);
    } catch (error) {
      console.error("Error saving to Firestore:", error);
      toast({ title: "Save Failed", description: "Could not save prompt to cloud history. Please try again.", variant: "destructive" });
    } finally {
      setIsSavingToHistory(false);
    }
  };
  
  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-500';
    if (score >= 5) return 'text-yellow-500';
    return 'text-red-500';
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
        <div className="flex justify-between items-center">
            <GlassCardTitle className="flex items-center font-headline text-xl">
              <CheckCircle className="mr-2 h-6 w-6 text-accent" />
              Your Optimized Prompt {targetModel && `for ${targetModel}`}
            </GlassCardTitle>
            {typeof qualityScore === 'number' && (
                <div className="flex items-center gap-2 p-2 rounded-md bg-accent/10">
                    <BarChart3 className="h-5 w-5 text-accent"/>
                    <span className="text-sm text-accent font-medium">Quality Score:</span>
                    <span className={`text-lg font-bold ${getScoreColor(qualityScore)}`}>{qualityScore}/10</span>
                </div>
            )}
        </div>
      </GlassCardHeader>
      <GlassCardContent>
        {isEditing ? (
          <Textarea
            value={editedPromptText}
            onChange={(e) => {
              setEditedPromptText(e.target.value);
              if (isAlreadySaved) setIsAlreadySaved(false);
            }}
            rows={10}
            className="text-sm leading-relaxed font-code bg-muted/50 p-4 rounded-md border focus:ring-accent"
            aria-label="Editable optimized prompt"
          />
        ) : (
          <div className="text-sm leading-relaxed font-code bg-muted/50 p-4 rounded-md border whitespace-pre-wrap min-h-[150px]">
            {editedPromptText}
          </div>
        )}
         <div className="mt-4 space-y-4">
            <div>
              <Label htmlFor="promptName" className="text-sm font-medium">Prompt Name</Label>
              <Input 
                id="promptName" 
                value={promptName} 
                onChange={(e) => {
                  setPromptName(e.target.value);
                  if (isAlreadySaved) setIsAlreadySaved(false);
                }}
                placeholder="Enter a descriptive name" 
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="promptTags" className="text-sm font-medium flex items-center">
                <Tag className="mr-2 h-4 w-4 text-muted-foreground"/>
                Tags (comma-separated)
              </Label>
              <Input 
                id="promptTags" 
                value={promptTags} 
                onChange={(e) => {
                  setPromptTags(e.target.value);
                  if (isAlreadySaved) setIsAlreadySaved(false);
                }}
                placeholder="e.g., marketing, email, saas" 
                className="mt-1"
              />
            </div>
          </div>
        <div className="mt-6 flex flex-wrap gap-2 justify-end">
          <Button variant="outline" onClick={handleCopy} size="sm">
            <Copy className="mr-2 h-4 w-4" /> Copy Prompt Text
          </Button>
          {isEditing ? (
            <Button variant="default" onClick={handleSaveEdit} size="sm" className="bg-accent hover:bg-accent/90 text-accent-foreground">
              <Save className="mr-2 h-4 w-4" /> Apply Edit
            </Button>
          ) : (
            <Button variant="outline" onClick={() => setIsEditing(true)} size="sm">
              <Edit3 className="mr-2 h-4 w-4" /> Edit Prompt Text
            </Button>
          )}
          <Button 
            variant="default" 
            onClick={handleSaveToHistory} 
            size="sm" 
            disabled={isSavingToHistory || !currentUser || !promptName.trim() || isAlreadySaved}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isSavingToHistory ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : isAlreadySaved ? (
              <CheckCircle className="mr-2 h-4 w-4" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {isAlreadySaved ? "Saved to History" : "Save to History"}
          </Button>
          <Button variant="outline" onClick={handleExport} size="sm">
            <Download className="mr-2 h-4 w-4" /> Export Details
          </Button>
        </div>
      </GlassCardContent>
    </GlassCard>
  );
}
