
"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { RefreshCw, FileText, Wand2, CheckCircle2, LoaderCircle } from 'lucide-react';
import type { OutlineItem } from './OutlineEditor';

export type GenerationMode = 'full' | 'section';

interface ContentDraftingProps {
  outline: OutlineItem[];
  content: string;
  onContentChange: (newContent: string) => void;
  onGenerate: (mode: GenerationMode) => void;
  onGenerateSection: (index: number) => void;
  onRegenerate: () => void;
  generationMode: GenerationMode;
  onGenerationModeChange: (mode: GenerationMode) => void;
  isLoading: boolean;
  isLoadingSectionIndex: number | null;
  draftedSections: Set<number>;
}

export default function ContentDrafting({
  outline,
  content,
  onContentChange,
  onGenerate,
  onGenerateSection,
  onRegenerate,
  generationMode,
  onGenerationModeChange,
  isLoading,
  isLoadingSectionIndex,
  draftedSections,
}: ContentDraftingProps) {
  const [wordCount, setWordCount] = useState(0);

  useEffect(() => {
    const words = content.trim().split(/\s+/).filter(Boolean);
    setWordCount(words.length);
  }, [content]);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label className="font-semibold">Content Generation Mode</Label>
        <RadioGroup
          value={generationMode}
          onValueChange={(value: GenerationMode) => onGenerationModeChange(value)}
          className="flex gap-4 pt-2"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="full" id="gen-full" />
            <Label htmlFor="gen-full">Generate Full Draft</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="section" id="gen-section" />
            <Label htmlFor="gen-section">Generate Section by Section</Label>
          </div>
        </RadioGroup>
      </div>

      {generationMode === 'full' && (
        <div className="flex justify-end gap-4">
          <Button onClick={() => onGenerate('full')} disabled={isLoading}>
            {isLoading ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
            Generate Full Draft
          </Button>
        </div>
      )}

      {generationMode === 'section' && (
        <div className="space-y-4 rounded-lg border p-4">
            <h4 className="font-medium">Outline Sections</h4>
            <ul className="space-y-3">
                {outline.map((item, index) => (
                    <li key={item.id} className="flex items-center justify-between gap-4 p-2 rounded-md bg-secondary">
                        <div className="flex items-center gap-3">
                            {draftedSections.has(index) ? (
                                <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                            ) : (
                                <div className="h-5 w-5 rounded-full border-2 border-muted-foreground shrink-0" />
                            )}
                            <span className="flex-grow">{item.text}</span>
                        </div>
                        <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => onGenerateSection(index)}
                            disabled={isLoadingSectionIndex !== null}
                        >
                            {isLoadingSectionIndex === index ? (
                                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Wand2 className="mr-2 h-4 w-4" />
                            )}
                            Generate
                        </Button>
                    </li>
                ))}
            </ul>
        </div>
      )}

      <div className="relative">
        <Textarea
          value={content}
          onChange={(e) => onContentChange(e.target.value)}
          placeholder="Your generated content will appear here..."
          className="min-h-[500px] text-base leading-relaxed p-4 bg-secondary"
          readOnly={generationMode === 'section' && draftedSections.size > 0}
        />
        <div className="absolute bottom-3 right-3 flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{wordCount} words</span>
            <Button variant="ghost" size="icon" onClick={onRegenerate} disabled={isLoading || isLoadingSectionIndex !== null} title="Re-generate content">
                <RefreshCw className="h-4 w-4" />
            </Button>
        </div>
      </div>
    </div>
  );
}
