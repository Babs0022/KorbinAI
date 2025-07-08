
"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { RefreshCw, FileText } from 'lucide-react';

export type GenerationMode = 'full' | 'section';

interface ContentDraftingProps {
  initialContent?: string;
  onGenerate: (mode: GenerationMode) => void;
  onRegenerate: () => void;
}

export default function ContentDrafting({
  initialContent = '',
  onGenerate,
  onRegenerate,
}: ContentDraftingProps) {
  const [generationMode, setGenerationMode] = useState<GenerationMode>('full');
  const [content, setContent] = useState(initialContent);
  const [wordCount, setWordCount] = useState(0);

  useEffect(() => {
    setContent(initialContent);
  }, [initialContent]);

  useEffect(() => {
    const words = content.trim().split(/\s+/).filter(Boolean);
    setWordCount(words.length);
  }, [content]);

  const handleGenerateClick = () => {
    onGenerate(generationMode);
  };

  const generateButtonText = generationMode === 'full' ? 'Generate Full Draft' : 'Generate Selected Section';

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        <div className="space-y-2">
          <Label className="font-semibold">Content Generation Options</Label>
          <RadioGroup
            value={generationMode}
            onValueChange={(value: GenerationMode) => setGenerationMode(value)}
            className="flex gap-4 pt-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="full" id="gen-full" />
              <Label htmlFor="gen-full">Generate Full Draft</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="section" id="gen-section" disabled />
              <Label htmlFor="gen-section" className="text-muted-foreground">Section by Section (Soon)</Label>
            </div>
          </RadioGroup>
        </div>
        <div className="flex justify-end gap-4">
           <Button onClick={handleGenerateClick} disabled={generationMode === 'section'}>
                <FileText className="mr-2 h-4 w-4" />
                {generateButtonText}
            </Button>
        </div>
      </div>

      <div className="relative">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Your generated content will appear here..."
          className="min-h-[500px] text-base leading-relaxed p-4 bg-secondary"
        />
        <div className="absolute bottom-3 right-3 flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{wordCount} words</span>
            <Button variant="ghost" size="icon" onClick={onRegenerate} title="Re-generate content">
                <RefreshCw className="h-4 w-4" />
            </Button>
        </div>
      </div>
    </div>
  );
}
