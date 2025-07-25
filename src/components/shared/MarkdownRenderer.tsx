
"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Button } from "@/components/ui/button";
import { Copy, Check, Download, Link as LinkIcon, File } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { saveAs } from "file-saver";
import Image from "next/image";

import { cn } from "@/lib/utils";

interface MarkdownRendererProps {
  children: string;
  className?: string;
}

const URL_REGEX = /https?:\/\/[^\s/$.?#].[^\s]*/gi;

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
        <div className="relative my-4 rounded-lg bg-secondary border">
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
                className="!whitespace-pre-wrap !break-all"
                customStyle={{ margin: 0, backgroundColor: 'transparent', padding: '1rem', maxHeight: '400px', overflowY: 'auto' }}
                codeTagProps={{ style: { fontFamily: "var(--font-code, monospace)", fontSize: "0.875rem" } }}
            >
                {codeString}
            </SyntaxHighlighter>
        </div>
    ) : (
        <code className={cn("bg-secondary text-foreground p-1 rounded-md border break-words", className)}>{children}</code>
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
        <div className="relative my-4 group bg-secondary border rounded-lg p-2 max-w-md">
            <Image src={src} alt={alt || "generated image"} width={512} height={512} className="rounded-md w-full h-auto object-contain" data-ai-hint="generated image" />
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="secondary" size="icon" onClick={handleDownload}>
                    <Download className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
};


export default function MarkdownRenderer({ children, className }: MarkdownRendererProps) {
    const urls = children.match(URL_REGEX);
    
    // Check if the URL is part of a markdown image tag
    const isImageUrl = (url: string) => `![](${url})`.includes(children) || `![some alt](${url})`.includes(children);
    const textLinks = urls?.filter(url => !url.startsWith('data:image') && !isImageUrl(url));
    
    // The main content to render, could be text, image markdown, or both.
    const mainContent = children;

    return (
        <>
            {textLinks && textLinks.length > 0 && (
                <div className="mb-2 space-y-2">
                    {textLinks.map((url, index) => (
                        <a 
                            key={index}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 p-2 rounded-lg border bg-background/50 hover:bg-accent transition-colors"
                        >
                            <LinkIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span className="text-sm truncate text-primary">{url}</span>
                        </a>
                    ))}
                </div>
            )}
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
                {mainContent}
            </ReactMarkdown>
        </>
    );
}
