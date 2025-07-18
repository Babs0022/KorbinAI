
"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { saveProject } from '@/services/projectService';
import DownloadZipButton from './DownloadZipButton';
import { Button } from '@/components/ui/button';
import { LoaderCircle, Save, FileWarning } from 'lucide-react';
import { ToastAction } from "@/components/ui/toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CodePreview from './CodePreview';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import type { GenerateAppInput } from '@/types/ai';

interface File {
  filePath: string;
  componentCode: string;
}

export default function ComponentResultDisplay({ searchParams }: { searchParams: GenerateAppInput }) {
  const { user } = useAuth();
  const { toast } = useToast();

  const [finalCode, setFinalCode] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [projectId, setProjectId] = useState<string | null>(null);
  
  const workerRef = useRef<Worker>();

  useEffect(() => {
    // Start the generation process
    async function startGeneration() {
      setIsGenerating(true);
      setError(null);
      setFinalCode(null);

      try {
        const response = await fetch('/api/generate-app-stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(searchParams),
        });

        if (!response.ok || !response.body) {
           const errorData = await response.json().catch(() => ({ error: 'An unknown streaming error occurred.' }));
           throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let accumulatedCode = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          accumulatedCode += chunk;
          setFinalCode(accumulatedCode); // Update preview in real-time
        }

      } catch (e: any) {
        console.error("Failed to generate application:", e);
        setError(e.message || "An unknown error occurred during generation.");
      } finally {
        setIsGenerating(false);
      }
    }

    startGeneration();

    return () => {
        // Cleanup logic if needed when component unmounts
    }
  }, [searchParams]);

  const handleSave = async () => {
    if (!user || !finalCode) return;
    setIsSaving(true);
    try {
        const resultForSaving = {
            files: [{
                filePath: 'index.html',
                componentCode: finalCode,
                instructions: 'A self-contained HTML file.',
            }]
        };

        const id = await saveProject({
            userId: user.uid,
            type: 'component-wizard',
            content: resultForSaving,
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
  };
  
   if (error) {
    return (
      <Card className="w-full border-destructive bg-destructive/10">
        <CardHeader>
          <div className="flex items-center gap-4">
            <FileWarning className="h-10 w-10 text-destructive" />
            <div>
              <CardTitle className="text-destructive">Generation Failed</CardTitle>
              <CardDescription className="text-destructive/80">There was an error generating your application.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="rounded-md bg-destructive/10 p-4 font-mono text-sm text-destructive">
            {error}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
       <Tabs defaultValue="preview" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="code">Code</TabsTrigger>
        </TabsList>
        <TabsContent value="preview" className="mt-6">
          <CodePreview htmlContent={finalCode || ''}>
             {isGenerating && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-background/80 backdrop-blur-sm">
                    <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
                    <span className="font-semibold">AI is generating code...</span>
                </div>
            )}
          </CodePreview>
        </TabsContent>
        <TabsContent value="code" className="mt-6">
           <Card>
              <CardContent className="p-0">
                 <div className="relative h-[600px] overflow-auto rounded-lg border bg-secondary">
                    {isGenerating && !finalCode && (
                       <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2">
                            <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
                            <span className="font-semibold">Waiting for code stream...</span>
                        </div>
                    )}
                    <SyntaxHighlighter
                      language="html"
                      style={vscDarkPlus}
                      showLineNumbers={true}
                      customStyle={{ margin: 0, backgroundColor: 'transparent', height: '100%' }}
                      codeTagProps={{
                        style: {
                          fontFamily: "var(--font-code, monospace)",
                          fontSize: "0.875rem",
                        },
                      }}
                      className="!p-4 h-full"
                    >
                      {finalCode || '<!-- Code will appear here as it is generated -->'}
                    </SyntaxHighlighter>
                 </div>
              </CardContent>
           </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-4 pt-4">
        <DownloadZipButton files={[{ filePath: 'index.html', componentCode: finalCode || '' }]} disabled={!finalCode} />
        <Button onClick={handleSave} disabled={isSaving || !user || !!projectId || !finalCode || isGenerating} size="lg">
          {isSaving ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          {projectId ? 'Saved!' : 'Save Project'}
        </Button>
      </div>
    </div>
  );
}
