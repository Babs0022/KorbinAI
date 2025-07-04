
"use client";

import { useState } from "react";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Copy, Check } from "lucide-react";

interface GenerationResultCardProps {
  title: string;
  content: string;
  language?: string;
  variant?: 'prose' | 'code';
}

export default function GenerationResultCard({ title, content, language = 'markdown', variant = 'prose' }: GenerationResultCardProps) {
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
            customStyle={{ margin: 0, backgroundColor: 'hsl(var(--secondary))', borderRadius: 'var(--radius)', padding: '1rem' }}
            codeTagProps={{
              style: { fontFamily: "var(--font-code, monospace)", fontSize: "0.875rem" },
            }}
          >
            {content}
          </SyntaxHighlighter>
        ) : (
          <div className="prose dark:prose-invert max-w-none whitespace-pre-wrap rounded-md bg-secondary p-4">
            {content}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
