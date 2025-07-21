
"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Button } from "@/components/ui/button";
import { Copy, Check, Download } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { saveAs } from "file-saver";

import { cn } from "@/lib/utils";

interface MarkdownRendererProps {
  children: string;
  className?: string;
}

const CodeBlock = ({ className, children }: { className?: string; children: React.ReactNode }) => {
    const { toast } = useToast();
    const [copied, setCopied] = useState(false);
    const match = /language-(\w+)/.exec(className || '');
    const codeString = String(children).replace(/\n$/, '');

    const handleCopy = () => {
        navigator.clipboard.writeText(codeString);
        setCopied(true);
        toast({ title: "Copied to clipboard!" });
        setTimeout(() => setCopied(false), 2000);
    };

    return match ? (
        <div className="relative my-4 rounded-lg bg-secondary">
            <div className="flex items-center justify-between px-4 py-2 border-b">
                <span className="text-xs font-sans text-muted-foreground">{match[1]}</span>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCopy}>
                    {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
            </div>
            <SyntaxHighlighter
                style={vscDarkPlus}
                language={match[1]}
                PreTag="div"
                customStyle={{ margin: 0, backgroundColor: 'transparent', padding: '1rem', maxHeight: '400px', overflowY: 'auto' }}
                codeTagProps={{ style: { fontFamily: "var(--font-code, monospace)", fontSize: "0.875rem" } }}
            >
                {codeString}
            </SyntaxHighlighter>
        </div>
    ) : (
        <code className={className}>{children}</code>
    );
};

const ImageBlock = ({ src, alt }: { src?: string; alt?: string }) => {
    const { toast } = useToast();
    if (!src) return null;

    const handleDownload = () => {
        try {
            saveAs(src, alt || "generated-image.png");
            toast({ title: "Download started!" });
        } catch (error) {
            console.error("Download failed:", error);
            toast({ variant: "destructive", title: "Download Failed", description: "Could not download the image." });
        }
    };
    
    return (
        <div className="relative my-4 group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={alt} className="rounded-lg border max-w-full h-auto" />
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="secondary" size="icon" onClick={handleDownload}>
                    <Download className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
};

export default function MarkdownRenderer({ children, className }: MarkdownRendererProps) {
  return (
    <ReactMarkdown
      className={cn("prose dark:prose-invert max-w-none", className)}
      remarkPlugins={[remarkGfm]}
      components={{
        code(props) {
            const {children, className} = props;
            return <CodeBlock className={className}>{children}</CodeBlock>;
        },
        img(props) {
            const {src, alt} = props;
            return <ImageBlock src={src} alt={alt} />;
        },
      }}
    >
      {children}
    </ReactMarkdown>
  );
}
