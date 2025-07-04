
"use client";

import type { Workspace } from '@/types/workspace';
import NextImage from 'next/image';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Download } from 'lucide-react';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import MultiCodeDisplay from '@/components/wizards/CodeDisplay';

interface WorkspacePreviewDialogProps {
  workspace: Workspace | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onExport: (workspace: Workspace) => void;
}

const getLanguage = (format: string | undefined): string => {
    if (format === 'csv') return 'csv';
    return 'json';
};

function isValidPath(path: any): path is string {
    return typeof path === 'string' && path.trim().startsWith('/');
}


export default function WorkspacePreviewDialog({ workspace, isOpen, onOpenChange, onExport }: WorkspacePreviewDialogProps) {
  if (!workspace) return null;

  const renderContent = () => {
    switch (workspace.type) {
      case 'image':
        let imageUrls: string[] | undefined;
        // Handle both old format (object) and new format (stringified JSON)
        if (typeof workspace.output === 'string') {
          try {
            imageUrls = JSON.parse(workspace.output).imageUrls;
          } catch (e) {
            console.error("Failed to parse image workspace output:", e);
            imageUrls = [];
          }
        } else {
          imageUrls = (workspace.output as any)?.imageUrls;
        }

        return (imageUrls && Array.isArray(imageUrls) && imageUrls.length > 0) ? (
          <ScrollArea className="mt-4 h-72 rounded-md border p-4">
            <div className="grid grid-cols-2 gap-4">
              {imageUrls.map((url: string, index: number) => (
                <a 
                  key={index} 
                  href={url} 
                  download={`${workspace.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${index + 1}.png`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="group relative aspect-square w-full overflow-hidden rounded-md"
                >
                  <NextImage src={url} alt={`${workspace.name} ${index + 1}`} fill className="object-cover" data-ai-hint="abstract image" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <Download className="h-8 w-8 text-white" />
                  </div>
                </a>
              ))}
            </div>
          </ScrollArea>
        ) : <p className="mt-4">No image preview available.</p>;

      case 'written-content':
      case 'prompt':
        return (
          <ScrollArea className="mt-4 h-72 rounded-md border">
            <div className="prose dark:prose-invert max-w-none whitespace-pre-wrap p-4">
              {workspace.output as string}
            </div>
          </ScrollArea>
        );

      case 'structured-data':
        const lang = getLanguage((workspace.input as any)?.format);
        const dataString = typeof workspace.output === 'string' ? workspace.output : JSON.stringify(workspace.output, null, 2);
        return (
          <ScrollArea className="mt-4 h-72">
            <SyntaxHighlighter language={lang} style={vscDarkPlus} customStyle={{ margin: 0, backgroundColor: 'hsl(var(--secondary))', borderRadius: 'var(--radius)', padding: '1rem' }}>
              {dataString}
            </SyntaxHighlighter>
          </ScrollArea>
        );

      case 'component-wizard':
        const output = workspace.output as any;
        const files = output?.files;
        const finalInstructions = output?.finalInstructions;

        if (files && Array.isArray(files) && finalInstructions) {
          return (
            <ScrollArea className="mt-4 h-[70vh] rounded-md border">
              <div className="p-4 md:p-6">
                <MultiCodeDisplay files={files} finalInstructions={finalInstructions} variant="preview" />
              </div>
            </ScrollArea>
          );
        }
        return <p>No file information available.</p>;

      default:
        return <p className="mt-4 text-muted-foreground">Preview not available for this workspace type.</p>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{workspace.name}</DialogTitle>
          <DialogDescription>{workspace.summary}</DialogDescription>
        </DialogHeader>
        {renderContent()}
        <DialogFooter className="mt-6 sm:justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
            {workspace.type !== 'image' && (
                <Button variant="secondary" onClick={() => onExport(workspace)}>
                    <Download className="mr-2 h-4 w-4" />
                    Export
                </Button>
            )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
