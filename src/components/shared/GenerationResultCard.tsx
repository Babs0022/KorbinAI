
"use client";

import React, { useState } from "react";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Copy, Check } from "lucide-react";
import MarkdownRenderer from "./MarkdownRenderer";

interface GenerationResultCardProps {
  title: string;
  content: string;
  language?: string;
  variant?: 'prose' | 'code';
}

// The core component logic
function GenerationResultCardComponent({ title, content, language = 'markdown', variant = 'prose' }: GenerationResultCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="rounded-xl">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{title}</CardTitle>
        <Button variant="ghost" size="icon" onClick={handleCopy}>
          {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
          <span className="sr-only">Copy</span>
        </Button>
      </CardHeader>
      <CardContent>
        {variant === 'code' ? (
          <SyntaxHighlighter
            language={language}
            style={vscDarkPlus}
            customStyle={{ margin: 0, backgroundColor: 'hsl(var(--secondary))', borderRadius: 'var(--radius)', padding: '1rem', maxHeight: '60vh', overflowY: 'auto' }}
            codeTagProps={{
              style: { fontFamily: "var(--font-code, monospace)", fontSize: "0.875rem" },
            }}
          >
            {content}
          </SyntaxHighlighter>
        ) : (
          <div className="rounded-md bg-secondary p-4 max-h-[60vh] overflow-y-auto">
            <MarkdownRenderer>{content}</MarkdownRenderer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Wrap the component with React.memo to prevent unnecessary re-renders when its props do not change.
const GenerationResultCard = React.memo(GenerationResultCardComponent);
GenerationResultCard.displayName = "GenerationResultCard";

export default GenerationResultCard;
