"use client";

import React, { useState, useEffect } from 'react';
import { Loader2, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';

const tips = [
  "Tip: Providing a persona (e.g., 'Act as a professional copywriter') can dramatically improve AI results.",
  "Did you know? 'Few-shot prompting' means giving the AI a few examples of the output you want.",
  "Fact: AI models like GPT-4 don't have memories of past conversations unless you provide the history in the prompt.",
  "Tip: For creative tasks, try increasing the 'temperature' parameter if the model supports it. For factual tasks, keep it low.",
  "Did you know? Prompts for image models like DALL-E 3 work best with descriptive, vivid language about scenes and styles.",
  "Fact: The 'Top P' parameter controls the nucleus of sampling, another way to manage the AI's creativity.",
  "Tip: Use clear delimiters like triple quotes (\"\"\") or XML tags (<example>) to separate instructions from context.",
  "Did you know? Chain-of-thought prompting (e.g., 'Think step-by-step') helps AI tackle complex reasoning tasks.",
  "Tip: Be specific! Instead of 'write about dogs,' try 'write a 500-word blog post about the benefits of training a puppy.'",
];

interface LoadingTipsProps {
  loadingText: string;
  className?: string;
}

export function LoadingTips({ loadingText, className }: LoadingTipsProps) {
  const [currentTip, setCurrentTip] = useState('');

  useEffect(() => {
    // Set the first tip immediately
    setCurrentTip(tips[Math.floor(Math.random() * tips.length)]);

    const interval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * tips.length);
      setCurrentTip(tips[randomIndex]);
    }, 4000); // Change tip every 4 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={cn("flex flex-col items-center justify-center text-center p-8", className)}>
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="mt-4 text-lg font-semibold text-muted-foreground">
        {loadingText}
      </p>
      {currentTip && (
        <div className="mt-6 w-full max-w-md p-4 rounded-lg bg-accent/10 border border-dashed border-accent/30 text-accent transition-opacity duration-500 ease-in-out">
            <div className="flex items-start gap-3">
                <Lightbulb className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-left">{currentTip}</p>
            </div>
        </div>
      )}
    </div>
  );
}
