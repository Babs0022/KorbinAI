
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Wand2 } from 'lucide-react';

export interface OptimizationSettings {
  optimizeSeo: boolean;
  improveReadability: boolean;
  adjustTone: boolean;
  newTone: string;
  generateCta: boolean;
  suggestHeadlines: boolean;
}

interface ContentOptimizerProps {
  originalContent: string;
  // This prop will eventually receive the results of the optimization.
  suggestions?: string; 
  isLoading?: boolean;
  onApplyOptimization: (settings: OptimizationSettings) => void;
}

const toneOptions = ["More Humorous", "More Formal", "More Persuasive", "More Casual", "More Empathetic"];

export default function ContentOptimizer({ 
    originalContent, 
    suggestions, 
    isLoading,
    onApplyOptimization 
}: ContentOptimizerProps) {
  const [settings, setSettings] = useState<OptimizationSettings>({
    optimizeSeo: false,
    improveReadability: true,
    adjustTone: false,
    newTone: toneOptions[0],
    generateCta: false,
    suggestHeadlines: false,
  });

  const handleSwitchChange = (field: keyof OptimizationSettings) => (checked: boolean) => {
    setSettings(prev => ({ ...prev, [field]: checked }));
  };

  const handleToneChange = (newTone: string) => {
    setSettings(prev => ({ ...prev, newTone }));
  };
  
  const handleApplyClick = () => {
    onApplyOptimization(settings);
  };

  const isAnyOptimizationSelected = Object.values(settings).some(value => typeof value === 'boolean' && value);

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
                <Switch id="seo-switch" checked={settings.optimizeSeo} onCheckedChange={handleSwitchChange('optimizeSeo')} />
            </div>
             <div className="flex items-center justify-between rounded-lg border p-4">
                <Label htmlFor="readability-switch" className="flex-grow">Improve Readability</Label>
                <Switch id="readability-switch" checked={settings.improveReadability} onCheckedChange={handleSwitchChange('improveReadability')} />
            </div>
             <div className="flex items-center justify-between rounded-lg border p-4">
                <Label htmlFor="cta-switch" className="flex-grow">Generate Call to Action (CTA)</Label>
                <Switch id="cta-switch" checked={settings.generateCta} onCheckedChange={handleSwitchChange('generateCta')} />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4">
                <Label htmlFor="headlines-switch" className="flex-grow">Suggest Relevant Headlines</Label>
                <Switch id="headlines-switch" checked={settings.suggestHeadlines} onCheckedChange={handleSwitchChange('suggestHeadlines')} />
            </div>
            <div className="rounded-lg border p-4 space-y-3">
                <div className="flex items-center justify-between">
                    <Label htmlFor="tone-switch" className="flex-grow">Adjust Tone</Label>
                    <Switch id="tone-switch" checked={settings.adjustTone} onCheckedChange={handleSwitchChange('adjustTone')} />
                </div>
                {settings.adjustTone && (
                    <Select value={settings.newTone} onValueChange={handleToneChange}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a new tone" />
                        </SelectTrigger>
                        <SelectContent>
                            {toneOptions.map(tone => <SelectItem key={tone} value={tone}>{tone}</SelectItem>)}
                        </SelectContent>
                    </Select>
                )}
            </div>
          </CardContent>
        </Card>
        
        <div className="flex justify-end">
            <Button size="lg" onClick={handleApplyClick} disabled={!isAnyOptimizationSelected || isLoading}>
                <Wand2 className="mr-2 h-4 w-4" />
                {isLoading ? 'Optimizing...' : 'Apply Optimizations'}
            </Button>
        </div>

        <Card>
            <CardHeader>
                <CardTitle>AI Suggestions</CardTitle>
                <CardDescription>Suggestions and changes will appear here.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="min-h-[150px] rounded-md bg-secondary p-4 text-sm">
                    {suggestions || "No suggestions yet. Apply an optimization to see results."}
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
