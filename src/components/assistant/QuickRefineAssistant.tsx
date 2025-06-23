
"use client";

import React, { useState, useRef, useEffect, type FormEvent } from 'react';
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Wand2, Sparkles, Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { optimizePrompt } from '@/ai/flows/optimize-prompt';

export function QuickRefineAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [optimizedPrompt, setOptimizedPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      // Reset state when closing
      setInputValue("");
      setOptimizedPrompt("");
      setIsLoading(false);
      setCopied(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const query = inputValue.trim();
    if (!query) return;

    setIsLoading(true);
    setOptimizedPrompt("");

    try {
      const result = await optimizePrompt({ goal: query });
      setOptimizedPrompt(result.optimizedPrompt);
      navigator.clipboard.writeText(result.optimizedPrompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Prompt Refined & Copied!",
        description: "Your quick-refined prompt is ready in your clipboard.",
      });
    } catch (error) {
      console.error("Error in Quick Refine:", error);
      toast({
        title: "Refinement Failed",
        description: "Sorry, I couldn't refine that prompt right now.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(optimizedPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Copied!" });
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="default"
          size="sm"
          className="fixed bottom-6 right-24 h-12 w-12 rounded-full shadow-lg z-50 bg-primary hover:bg-primary/90 text-primary-foreground flex flex-col items-center justify-center p-1"
          aria-label="Open Quick Refine Assistant"
        >
          <Sparkles className="h-5 w-5" />
          <span className="text-[9px] mt-0.5">Refine</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 sm:w-96 mr-4 mb-2 p-0" align="end">
        <div className="p-4 border-b">
          <h4 className="font-medium text-sm text-foreground flex items-center">
            <Wand2 className="mr-2 h-4 w-4 text-primary" />
            Quick Refine
          </h4>
          <p className="text-xs text-muted-foreground mt-1">Instantly turn a raw idea into a polished prompt.</p>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          <Textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="e.g., blog post about ai ethics"
            className="h-24 text-sm"
            disabled={isLoading}
          />
          <Button type="submit" className="w-full" disabled={isLoading || !inputValue.trim()}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
            Refine & Copy
          </Button>
        </form>
        {optimizedPrompt && (
          <div className="p-4 border-t bg-muted/50">
            <p className="text-xs font-semibold text-muted-foreground mb-2">Result:</p>
            <div className="relative">
              <p className="text-xs font-code bg-background p-2 rounded-md border pr-8 whitespace-pre-wrap">
                {optimizedPrompt}
              </p>
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute top-1 right-1 h-6 w-6"
                onClick={handleCopy}
              >
                {copied ? <Check className="h-4 w-4 text-green-500"/> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
