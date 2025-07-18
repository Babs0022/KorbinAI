
"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { saveProject } from '@/services/projectService';
import MultiCodeDisplay from './CodeDisplay';
import DownloadZipButton from './DownloadZipButton';
import { Button } from '@/components/ui/button';
import { LoaderCircle, Save, Terminal } from 'lucide-react';
import { ToastAction } from "@/components/ui/toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MarkdownRenderer from '../shared/MarkdownRenderer';
import CodePreview from './CodePreview';

interface File {
  filePath: string;
  componentCode: string;
  instructions: string;
}

interface ComponentResultDisplayProps {
  result: {
    files: File[];
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

  const readmeFile = result.files.find(file => file.filePath.toLowerCase().endsWith('readme.md'));
  const mainPageFile = result.files.find(file => file.filePath.endsWith('page.tsx'));
  const globalsCssFile = result.files.find(file => file.filePath.endsWith('globals.css'));
  const tailwindConfigFile = result.files.find(file => file.filePath.endsWith('tailwind.config.ts'));


  return (
    <div className="space-y-6">
       <Tabs defaultValue="preview" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="code">Code</TabsTrigger>
        </TabsList>
        <TabsContent value="preview" className="mt-6">
          <CodePreview 
            mainPageFile={mainPageFile} 
            globalsCssFile={globalsCssFile}
            tailwindConfigFile={tailwindConfigFile}
          />
        </TabsContent>
        <TabsContent value="code" className="mt-6">
           <MultiCodeDisplay files={result.files} />
        </TabsContent>
      </Tabs>

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
                <div className="prose prose-sm dark:prose-invert max-w-none rounded-md bg-secondary p-4 max-h-[400px] overflow-y-auto">
                    <MarkdownRenderer>{readmeFile.componentCode}</MarkdownRenderer>
                </div>
            </CardContent>
        </Card>
      )}

      <div className="flex justify-end gap-4 pt-4">
        <DownloadZipButton files={result.files} />
        <Button onClick={handleSave} disabled={isSaving || !user || !!projectId} size="lg">
          {isSaving ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          {projectId ? 'Saved!' : 'Save Project'}
        </Button>
      </div>
    </div>
  );
}
