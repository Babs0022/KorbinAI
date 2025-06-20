
"use client";

import React, { useState, useRef, type FormEvent } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Wand2, Loader2, Copy, Lightbulb, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { optimizePrompt, type OptimizePromptInput } from '@/ai/flows/optimize-prompt';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export function VibeCodingAssistantPill() {
  const { currentUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [roughThought, setRoughThought] = useState("");
  const [refinedPrompt, setRefinedPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleRefine = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    const thought = roughThought.trim();
    if (!thought) {
      toast({ title: "Input Required", description: "Please enter your thoughts to refine.", variant: "destructive" });
      return;
    }
    if (!currentUser) {
      toast({ title: "Login Required", description: "Please log in to use this feature.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    setRefinedPrompt(""); 

    try {
      const input: OptimizePromptInput = {
        goal: thought,
        answers: {}, // No survey answers for quick refine
      };
      const result = await optimizePrompt(input);
      setRefinedPrompt(result.optimizedPrompt);

      // Save to Firestore
      await addDoc(collection(db, `users/${currentUser.uid}/quickRefines`), {
        roughThought: thought,
        refinedPrompt: result.optimizedPrompt,
        timestamp: serverTimestamp(),
      });
      
      // Copy to clipboard
      navigator.clipboard.writeText(result.optimizedPrompt);
      toast({
        title: "Prompt Refined & Copied!",
        description: "The refined prompt has been copied to your clipboard and saved.",
      });

    } catch (error) {
      console.error("Error refining thought:", error);
      toast({
        title: "Refinement Failed",
        description: "Could not refine your thought. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!currentUser) {
    return null; // Don't render if user is not logged in
  }

  return (
    <>
      <Button
        variant="default"
        size="icon"
        className="fixed bottom-6 left-6 h-14 w-14 rounded-full shadow-lg z-50 bg-accent hover:bg-accent/90 text-accent-foreground"
        onClick={() => {
          setIsOpen(true);
          // Reset states when opening
          setRoughThought(""); 
          setRefinedPrompt("");
        }}
        aria-label="Open Quick Refine Assistant"
      >
        <Lightbulb className="h-7 w-7" />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md p-0 flex flex-col">
          <DialogHeader className="p-4 border-b">
            <DialogTitle className="flex items-center text-lg">
              <Wand2 className="mr-2 h-5 w-5 text-primary" /> Quick Refine
            </DialogTitle>
            <DialogDescription className="text-xs">
              Drop your raw thoughts. Get a polished prompt, copied to clipboard.
            </DialogDescription>
             <button 
                onClick={() => setIsOpen(false)} 
                className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
                aria-label="Close dialog"
            >
                <X className="h-4 w-4" />
            </button>
          </DialogHeader>
          
          <div className="p-4 space-y-4 flex-grow overflow-y-auto">
            <div>
              <Label htmlFor="roughThought" className="text-sm font-medium">Your Thoughts:</Label>
              <Textarea
                id="roughThought"
                ref={textareaRef}
                value={roughThought}
                onChange={(e) => setRoughThought(e.target.value)}
                placeholder="e.g., 'need a marketing slogan for eco-friendly coffee' or 'python function to sort list by date'"
                rows={5}
                className="mt-1"
                disabled={isLoading}
              />
            </div>

            {refinedPrompt && !isLoading && (
              <div>
                <Label htmlFor="refinedPromptOutput" className="text-sm font-medium">Refined Prompt:</Label>
                <Textarea
                  id="refinedPromptOutput"
                  value={refinedPrompt}
                  readOnly
                  rows={5}
                  className="mt-1 bg-muted/50 font-code"
                />
              </div>
            )}
          </div>
          
          <DialogFooter className="p-4 border-t">
            <Button 
              type="button" 
              onClick={handleRefine} 
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              disabled={isLoading || !roughThought.trim()}
            >
              {isLoading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Refining...</>
              ) : (
                <><Wand2 className="mr-2 h-4 w-4" /> Refine & Copy</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
