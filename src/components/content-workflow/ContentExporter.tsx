
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Save, Copy, Download, FileText, RefreshCw, ThumbsUp, ThumbsDown, Check } from 'lucide-react';
import MarkdownRenderer from '@/components/shared/MarkdownRenderer';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '../ui/badge';

interface ContentExporterProps {
  finalContent: string;
  isSaving?: boolean;
  onSaveContent: () => void;
  onStartNew: () => void;
  onFeedback: (feedback: 'good' | 'bad') => void;
}

export default function ContentExporter({
  finalContent,
  isSaving,
  onSaveContent,
  onStartNew,
  onFeedback,
}: ContentExporterProps) {
  const { toast } = useToast();
  const [feedbackGiven, setFeedbackGiven] = useState<'good' | 'bad' | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(finalContent);
    setCopied(true);
    toast({ title: 'Copied to Clipboard!', description: 'The content has been copied.' });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = (format: 'md' | 'html' | 'txt') => {
    let blob: Blob;
    let filename: string;

    switch (format) {
      case 'md':
        blob = new Blob([finalContent], { type: 'text/markdown;charset=utf-8' });
        filename = 'content.md';
        break;
      case 'html':
        // A basic conversion for the .html download
        const htmlContent = `<!DOCTYPE html>\n<html lang="en">\n<head><meta charset="UTF-8"><title>Generated Content</title></head>\n<body>\n${finalContent.replace(/\n/g, '<br>')}\n</body>\n</html>`;
        blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
        filename = 'content.html';
        break;
      case 'txt':
        blob = new Blob([finalContent], { type: 'text/plain;charset=utf-8' });
        filename = 'content.txt';
        break;
    }

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast({ title: `Downloaded as ${filename}` });
  };
  
  const handleFeedback = (feedback: 'good' | 'bad') => {
      setFeedbackGiven(feedback);
      onFeedback(feedback);
      toast({ title: 'Thank you for your feedback!' });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Final Content Preview</CardTitle>
          <CardDescription>Here is your generated content. Review it before saving or exporting.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="min-h-[400px] max-h-[60vh] overflow-y-auto rounded-lg border bg-secondary p-4">
            <MarkdownRenderer>{finalContent}</MarkdownRenderer>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
              <CardHeader>
                  <CardTitle>Export Options</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-4">
                  <Button variant="outline" onClick={handleCopy}>
                      {copied ? <Check className="mr-2 h-4 w-4 text-green-500" /> : <Copy className="mr-2 h-4 w-4" />}
                      Copy to Clipboard
                  </Button>
                  <Button variant="outline" onClick={() => handleDownload('md')}>
                      <Download className="mr-2 h-4 w-4" />
                      Markdown (.md)
                  </Button>
                  <Button variant="outline" onClick={() => handleDownload('html')}>
                      <Download className="mr-2 h-4 w-4" />
                      HTML (.html)
                  </Button>
                  <Button variant="outline" onClick={() => handleDownload('txt')}>
                      <FileText className="mr-2 h-4 w-4" />
                      Plain Text (.txt)
                  </Button>
              </CardContent>
          </Card>

          <Card>
              <CardHeader>
                  <CardTitle>Feedback & Actions</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-4 items-center">
                  <span className="text-sm font-medium mr-2">Rate AI Quality:</span>
                  <Button variant={feedbackGiven === 'good' ? 'default' : 'outline'} size="icon" onClick={() => handleFeedback('good')}>
                      <ThumbsUp className="h-4 w-4" />
                  </Button>
                  <Button variant={feedbackGiven === 'bad' ? 'destructive' : 'outline'} size="icon" onClick={() => handleFeedback('bad')}>
                      <ThumbsDown className="h-4 w-4" />
                  </Button>
              </CardContent>
          </Card>
      </div>

      <div className="flex justify-between items-center pt-4">
        <Button variant="outline" onClick={onStartNew}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Start New Content
        </Button>
        <div className="relative">
          <Button disabled={true}>
            <Save className="mr-2 h-4 w-4" />
            Save to My Projects
          </Button>
          <Badge variant="secondary" className="absolute -top-2 -right-3">Coming Soon</Badge>
        </div>
      </div>
    </div>
  );
}
