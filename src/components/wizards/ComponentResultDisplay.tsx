
"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { saveProject } from '@/services/projectService';
import MultiCodeDisplay from './CodeDisplay';
import DownloadZipButton from './DownloadZipButton';
import { Button } from '@/components/ui/button';
import { LoaderCircle, Save } from 'lucide-react';
import { ToastAction } from "@/components/ui/toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import MarkdownRenderer from '../shared/MarkdownRenderer';
import { Terminal } from 'lucide-react';

interface File {
  filePath: string;
  componentCode: string;
  instructions: string;
}

interface ComponentResultDisplayProps {
  result: {
    files: File[];
    finalInstructions?: string; // Make optional as it's being replaced by README
  }
}

export default function ComponentResultDisplay({ result }: ComponentResultDisplayProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [projectId, setProjectId] = useState<string | null>(null);
  
  const handleSave = async () => {
    if (!user || !result) return;
    setIsSaving(true);
    try {
        const id = await saveProject({
            userId: user.uid,
            type: 'component-wizard',
            content: result,
        });
        setProjectId(id);
        toast({
            title: "Project Saved!",
            description: "Your application files have been saved to your projects.",
            action: (
                <ToastAction altText="View Project" asChild>
                    <Link href={`/dashboard/projects/${id}`}>View</Link>
                </ToastAction>
            ),
        });
    } catch (error) {
        console.error("Failed to save project:", error);
        toast({
            variant: "destructive",
            title: "Save Failed",
            description: error instanceof Error ? error.message : "An unknown error occurred.",
        });
    } finally {
        setIsSaving(false);
    }
  }

  const readmeFile = result.files.find(file => file.filePath.toLowerCase() === 'readme.md');

  return (
    <div className="space-y-6">
      <MultiCodeDisplay files={result.files} />

      {readmeFile && (
        <Card className="bg-card/50">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Terminal />
                    README & Final Steps
                </CardTitle>
                <CardDescription>Follow these instructions to get your new application running.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="prose prose-sm dark:prose-invert max-w-none rounded-md bg-secondary p-4">
                    <MarkdownRenderer>{readmeFile.componentCode}</MarkdownRenderer>
                </div>
            </CardContent>
        </Card>
      )}

      <div className="flex justify-end gap-4">
        <DownloadZipButton files={result.files} />
        <Button onClick={handleSave} disabled={isSaving || !user || !!projectId} size="lg">
          {isSaving ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          {projectId ? 'Saved!' : 'Save Project'}
        </Button>
      </div>
    </div>
  );
}
