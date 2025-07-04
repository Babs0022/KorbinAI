
"use client";

import type { Workspace } from '@/types/workspace';
import NextImage from 'next/image';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

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

export default function WorkspacePreviewDialog({ workspace, isOpen, onOpenChange, onExport }: WorkspacePreviewDialogProps) {
  if (!workspace) return null;

  const renderContent = () => {
    switch (workspace.type) {
      case 'image':
        const imageUrl = (workspace.output as any)?.previewUrl;
        return imageUrl ? (
          <div className="relative mt-4 aspect-video w-full">
            <NextImage src={imageUrl} alt={workspace.name} fill className="rounded-md object-contain" data-ai-hint="abstract image" />
          </div>
        ) : <p>No image preview available.</p>;

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
        const files = (workspace.output as any)?.files;
        return files && Array.isArray(files) ? (
          <ScrollArea className="mt-4 h-72">
            <div className="rounded-md bg-secondary p-4 font-mono text-sm">
              <h4 className="mb-2 font-semibold">Generated Files:</h4>
              <ul className="space-y-1">
                {files.map((file: any) => <li key={file.filePath}>{file.filePath}</li>)}
              </ul>
            </div>
          </ScrollArea>
        ) : <p>No file information available.</p>;

      default:
        return <p className="mt-4 text-muted-foreground">Preview not available for this workspace type.</p>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{workspace.name}</DialogTitle>
          <DialogDescription>{workspace.summary}</DialogDescription>
        </DialogHeader>
        {renderContent()}
        <DialogFooter className="mt-6 sm:justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
            <Button variant="secondary" onClick={() => onExport(workspace)}>Export</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
