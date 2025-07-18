
"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { saveProject } from '@/services/projectService';
import DownloadZipButton from './DownloadZipButton';
import { Button } from '@/components/ui/button';
import { LoaderCircle, Save } from 'lucide-react';
import { ToastAction } from "@/components/ui/toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CodePreview from './CodePreview';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Card, CardContent } from '../ui/card';

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

  const mainHtmlFile = result.files.find(file => file.filePath.endsWith('.html'));
  
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

  return (
    <div className="space-y-6">
       <Tabs defaultValue="preview" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="code">Code</TabsTrigger>
        </TabsList>
        <TabsContent value="preview" className="mt-6">
          <CodePreview htmlContent={mainHtmlFile?.componentCode} />
        </TabsContent>
        <TabsContent value="code" className="mt-6">
           <Card>
              <CardContent className="p-0">
                 <div className="h-[600px] overflow-auto rounded-lg border bg-secondary">
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
                      {mainHtmlFile?.componentCode || '<!-- No code generated -->'}
                    </SyntaxHighlighter>
                 </div>
              </CardContent>
           </Card>
        </TabsContent>
      </Tabs>

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
