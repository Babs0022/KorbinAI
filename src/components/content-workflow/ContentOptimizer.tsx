
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Wand2, LoaderCircle, Check } from 'lucide-react';
import MarkdownRenderer from '@/components/shared/MarkdownRenderer';
import Logo from '@/components/shared/Logo';
import AnimatedLoadingText from '@/components/shared/AnimatedLoadingText';

export interface OptimizationOptions {
  seo: boolean;
  readability: boolean;
  tone: boolean;
  cta: boolean;
  headlines: boolean;
}

interface ContentOptimizerProps {
  originalContent: string;
  suggestions?: string; 
  isLoading?: boolean;
  onRunOptimization: (settings: OptimizationOptions, tone: string) => void;
  onApplyChanges: (newContent: string) => void;
}

const toneOptions = ["More Humorous", "More Formal", "More Persuasive", "More Casual", "More Empathetic"];

export default function ContentOptimizer({ 
    originalContent, 
    suggestions, 
    isLoading,
    onRunOptimization,
    onApplyChanges,
}: ContentOptimizerProps) {
  const [options, setOptions] = useState<OptimizationOptions>({
    seo: false,
    readability: true,
    tone: false,
    cta: false,
    headlines: false,
  });
  const [tone, setTone] = useState(toneOptions[0]);

  const handleSwitchChange = (field: keyof OptimizationOptions) => (checked: boolean) => {
    setOptions(prev => ({ ...prev, [field]: checked }));
  };
  
  const handleApplyClick = () => {
    onRunOptimization(options, tone);
  };

  const handleApplyChanges = () => {
    if (!suggestions) return;
    // This is a simplified approach. It assumes the first part of a suggestion
    // before a '---' is the main content to apply.
    const mainContent = suggestions.split('---')[0].trim();
    onApplyChanges(mainContent);
  };

  const isAnyOptimizationSelected = Object.values(options).some(value => value);
  const isRewriteOptimization = options.seo || options.readability || options.tone;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Left side: Original Content & Options */}
      <div className="space-y-6">
        <Card>
            <CardHeader>
                <CardTitle>Current Draft</CardTitle>
                <CardDescription>This is the content you've drafted so far.</CardDescription>
            </CardHeader>
            <CardContent>
                <Textarea
                    value={originalContent}
                    readOnly
                    className="min-h-[400px] text-base leading-relaxed p-4 bg-secondary"
                />
            </CardContent>
        </Card>
      </div>
      
      {/* Right side: Optimization & Suggestions */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Optimization Options</CardTitle>
            <CardDescription>Select one or more ways to improve your content.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
                <Label htmlFor="seo-switch" className="flex-grow">Optimize for SEO</Label>
                <Switch id="seo-switch" checked={options.seo} onCheckedChange={handleSwitchChange('seo')} />
            </div>
             <div className="flex items-center justify-between rounded-lg border p-4">
                <Label htmlFor="readability-switch" className="flex-grow">Improve Readability</Label>
                <Switch id="readability-switch" checked={options.readability} onCheckedChange={handleSwitchChange('readability')} />
            </div>
             <div className="flex items-center justify-between rounded-lg border p-4">
                <Label htmlFor="cta-switch" className="flex-grow">Generate Call to Action (CTA)</Label>
                <Switch id="cta-switch" checked={options.cta} onCheckedChange={handleSwitchChange('cta')} />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4">
                <Label htmlFor="headlines-switch" className="flex-grow">Suggest Relevant Headlines</Label>
                <Switch id="headlines-switch" checked={options.headlines} onCheckedChange={handleSwitchChange('headlines')} />
            </div>
            <div className="rounded-lg border p-4 space-y-3">
                <div className="flex items-center justify-between">
                    <Label htmlFor="tone-switch" className="flex-grow">Adjust Tone</Label>
                    <Switch id="tone-switch" checked={options.tone} onCheckedChange={handleSwitchChange('tone')} />
                </div>
                {options.tone && (
                    <Select value={tone} onValueChange={setTone}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a new tone" />
                        </SelectTrigger>
                        <SelectContent>
                            {toneOptions.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                        </SelectContent>
                    </Select>
                )}
            </div>
          </CardContent>
        </Card>
        
        <div className="flex justify-end">
            <Button size="lg" onClick={handleApplyClick} disabled={!isAnyOptimizationSelected || isLoading}>
                {isLoading ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                {isLoading ? 'Optimizing...' : 'Run AI Optimizer'}
            </Button>
        </div>

        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle>AI Suggestions</CardTitle>
                        <CardDescription>Suggestions and changes will appear here.</CardDescription>
                    </div>
                     {isRewriteOptimization && suggestions && (
                        <Button variant="outline" onClick={handleApplyChanges} disabled={isLoading}>
                            <Check className="mr-2 h-4 w-4" />
                            Apply Changes
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                 <div className="min-h-[200px] max-h-[40vh] overflow-y-auto rounded-md bg-secondary p-4 text-sm">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-full">
                           <div className="flex items-center gap-4">
                                <Logo />
                                <AnimatedLoadingText />
                            </div>
                        </div>
                    ) : suggestions ? (
                        <MarkdownRenderer>{suggestions}</MarkdownRenderer>
                    ) : (
                        <p className="text-muted-foreground">No suggestions yet. Run the optimizer to see results.</p>
                    )}
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
