
"use client";

import { useState, useEffect } from 'react';
import type { Workspace } from '@/types/workspace';
import NextImage from 'next/image';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Download, LoaderCircle, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getWorkspace } from '@/services/workspaceService';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import MultiCodeDisplay from '@/components/wizards/CodeDisplay';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import MarkdownRenderer from '@/components/shared/MarkdownRenderer';

interface WorkspacePreviewDialogProps {
  workspaceMetadata: Workspace | null; // Receives the metadata from the list view
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onExport: (workspace: Workspace) => void;
}

const getLanguage = (format: string | undefined): string => {
    if (format === 'csv') return 'csv';
    return 'json';
};

const LoadingState = () => (
  <div className="flex h-72 items-center justify-center">
    <div className="text-center">
      <LoaderCircle className="mx-auto h-8 w-8 animate-spin text-primary" />
      <p className="mt-2 text-muted-foreground">Loading content...</p>
    </div>
  </div>
);

const ErrorState = ({ message }: { message: string }) => (
  <Card className="h-72 border-destructive bg-destructive/10">
    <CardHeader>
      <div className="flex items-center gap-2 text-destructive">
        <AlertTriangle className="h-5 w-5" />
        <h3 className="font-semibold">Could not load content</h3>
      </div>
    </CardHeader>
    <CardContent>
      <p className="text-sm text-destructive/80">{message}</p>
    </CardContent>
  </Card>
);

export default function WorkspacePreviewDialog({ workspaceMetadata, isOpen, onOpenChange, onExport }: WorkspacePreviewDialogProps) {
  const { user } = useAuth();
  const [fullWorkspace, setFullWorkspace] = useState<Workspace | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && workspaceMetadata && user) {
      const fetchContent = async () => {
        setIsLoading(true);
        setError(null);
        setFullWorkspace(null);
        try {
          const data = await getWorkspace({ workspaceId: workspaceMetadata.id, userId: user.uid });
          if (data) {
            setFullWorkspace(data);
          } else {
            setError("Could not find the workspace content.");
          }
        } catch (e: any) {
          setError(e.message || "An unknown error occurred.");
        } finally {
          setIsLoading(false);
        }
      };
      fetchContent();
    }
  }, [isOpen, workspaceMetadata, user]);

  if (!workspaceMetadata) return null;

  const renderContent = () => {
    if (isLoading) return <LoadingState />;
    if (error) return <ErrorState message={error} />;
    if (!fullWorkspace) return <ErrorState message="No content available." />;

    switch (fullWorkspace.type) {
      case 'written-content':
      case 'prompt':
        return (
          <ScrollArea className="mt-4 h-72 rounded-md border p-4">
            <MarkdownRenderer>{fullWorkspace.output as string}</MarkdownRenderer>
          </ScrollArea>
        );

      case 'structured-data':
        const lang = getLanguage((fullWorkspace.input as any)?.format);
        const dataString = typeof fullWorkspace.output === 'string' ? fullWorkspace.output : JSON.stringify(fullWorkspace.output, null, 2);
        return (
          <ScrollArea className="mt-4 h-72">
            <SyntaxHighlighter language={lang} style={vscDarkPlus} customStyle={{ margin: 0, backgroundColor: 'hsl(var(--secondary))', borderRadius: 'var(--radius)', padding: '1rem' }}>
              {dataString}
            </SyntaxHighlighter>
          </ScrollArea>
        );

      case 'component-wizard':
         // This case is handled by the full-page viewer now.
         return <ErrorState message="Application workspaces should be viewed on their dedicated page." />

      default:
        return <p className="mt-4 text-muted-foreground">Preview not available for this workspace type.</p>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{workspaceMetadata.name}</DialogTitle>
          <DialogDescription>{workspaceMetadata.summary}</DialogDescription>
        </DialogHeader>
        {renderContent()}
        <DialogFooter className="mt-6 sm:justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
            <Button variant="secondary" onClick={() => fullWorkspace && onExport(fullWorkspace)} disabled={!fullWorkspace || !!error}>
                <Download className="mr-2 h-4 w-4" />
                Export
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
