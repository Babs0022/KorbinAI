
"use client";

import { useState, useEffect } from "react";
import { ChevronDown, Bot } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReasoningProps {
  steps: string[];
  isStreaming: boolean;
}

export default function Reasoning({ steps, isStreaming }: ReasoningProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  useEffect(() => {
    if (!isStreaming) {
      setIsExpanded(false);
    } else {
      setIsExpanded(true);
    }
  }, [isStreaming]);

  if (!steps || steps.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 bg-secondary/50 rounded-lg p-3">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-sm font-medium text-muted-foreground w-full"
      >
        <Bot className="h-5 w-5" />
        <span>Reasoning</span>
        <ChevronDown
          className={cn(
            "h-4 w-4 transition-transform ml-auto",
            isExpanded ? "rotate-188" : ""
          )}
        />
      </button>
      {isExpanded && (
        <div className="mt-2 space-y-2 border-l border-dashed border-muted-foreground/30 pl-6 text-sm text-muted-foreground animate-fade-in">
          {steps.map((step, index) => (
            <p key={index} className="animate-fade-in-up" style={{ animationDelay: `${index * 100}ms` }}>{step}</p>
          ))}
        </div>
      )}
    </div>
  );
}
