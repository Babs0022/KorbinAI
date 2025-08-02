
"use client";

import { useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/cjs/styles/prism";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CodeBlockProps {
  language: string;
  value: string;
}

export default function CodeBlock({ language, value }: CodeBlockProps) {
  const { toast } = useToast();
  const [hasCopied, setHasCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setHasCopied(true);
    toast({ title: "Copied to clipboard" });
    setTimeout(() => setHasCopied(false), 2000);
  };

  return (
    <div className="relative group my-4 rounded-lg bg-secondary border">
       <div className="flex items-center justify-between px-4 py-1 border-b">
            <span className="text-xs font-sans text-muted-foreground">{language}</span>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCopy}>
                {hasCopied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                <span className="sr-only">Copy code</span>
            </Button>
        </div>
      <SyntaxHighlighter
        style={vscDarkPlus}
        language={language}
        PreTag="div"
        customStyle={{ margin: 0, backgroundColor: 'transparent', padding: '1rem' }}
      >
        {value}
      </SyntaxHighlighter>
    </div>
  );
}
