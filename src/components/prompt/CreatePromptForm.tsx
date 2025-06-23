
"use client";

import React, { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle, GlassCardDescription } from '@/components/shared/GlassCard';
import { optimizePrompt, type OptimizePromptInput, type OptimizePromptOutput } from '@/ai/flows/optimize-prompt';
import { generatePromptMetadata } from '@/ai/flows/generate-prompt-metadata-flow';
import { useToast } from '@/hooks/use-toast';
import { Wand2, Loader2, Settings2, Bot, BookOpen, FileText } from 'lucide-react';
import { Slider } from "@/components/ui/slider";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export interface OptimizedPromptResult extends OptimizePromptOutput {
  originalGoal: string;
  suggestedName: string;
  suggestedTags: string[];
}
interface CreatePromptFormProps {
  onPromptOptimized: (output: OptimizedPromptResult) => void;
}

export function CreatePromptForm({ onPromptOptimized }: CreatePromptFormProps) {
  const [goal, setGoal] = useState('');
  const [context, setContext] = useState('');
  const [persona, setPersona] = useState('');
  const [format, setFormat] = useState('');
  const [examples, setExamples] = useState('');
  const [constraints, setConstraints] = useState('');
  
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState<string>("");
  
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!goal.trim()) {
      toast({ title: "Primary Goal Required", description: "Please describe the main task for the AI.", variant: "destructive" });
      return;
    }
    setIsProcessing(true);

    const optimizeInput: OptimizePromptInput = {
      goal,
      context: context || undefined,
      persona: persona || undefined,
      format: format || undefined,
      examples: examples || undefined,
      constraints: constraints || undefined,
      temperature,
      maxTokens: maxTokens ? parseInt(maxTokens, 10) : undefined,
    };

    try {
      const optimizationResult = await optimizePrompt(optimizeInput);
      const metadataResult = await generatePromptMetadata({
        optimizedPrompt: optimizationResult.optimizedPrompt,
        originalGoal: goal,
      });
      const finalResult: OptimizedPromptResult = {
        ...optimizationResult,
        originalGoal: goal,
        suggestedName: metadataResult.suggestedName,
        suggestedTags: metadataResult.suggestedTags,
      };
      onPromptOptimized(finalResult);
      toast({ title: "Prompt Ready!", description: "Your optimized prompt is complete and displayed below." });
    } catch (error) {
      toast({ title: "Processing Failed", description: "Something went wrong. Please try again.", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <GlassCard>
        <GlassCardHeader>
          <GlassCardTitle className="flex items-center font-headline text-xl">
            <Bot className="mr-2 h-6 w-6 text-primary" />
            Structured Prompt Builder
          </GlassCardTitle>
           <GlassCardDescription>
            Construct a powerful prompt by defining its core components.
          </GlassCardDescription>
        </GlassCardHeader>
        <GlassCardContent className="space-y-4">
          <div>
            <Label htmlFor="goal" className="text-base font-semibold">Primary Goal</Label>
            <p className="text-xs text-muted-foreground mb-1">What is the main task you want the AI to accomplish?</p>
            <Textarea id="goal" value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="e.g., Write a marketing email for a new SaaS product..." rows={3} required />
          </div>

          <Accordion type="multiple" className="w-full">
            <AccordionItem value="core-components">
              <AccordionTrigger><div className="flex items-center text-sm font-medium"><FileText className="mr-2 h-4 w-4" />Core Components</div></AccordionTrigger>
              <AccordionContent className="space-y-4 pt-2">
                <div>
                  <Label htmlFor="context">Context</Label>
                  <p className="text-xs text-muted-foreground mb-1">Provide background information the AI needs to understand the task.</p>
                  <Textarea id="context" value={context} onChange={(e) => setContext(e.target.value)} placeholder="e.g., The product is called 'SynthWave' and it helps developers automate testing..." rows={4} />
                </div>
                 <div>
                  <Label htmlFor="persona">Persona / Role</Label>
                  <p className="text-xs text-muted-foreground mb-1">What role should the AI adopt?</p>
                  <Input id="persona" value={persona} onChange={(e) => setPersona(e.target.value)} placeholder="e.g., an expert copywriter specializing in tech startups" />
                </div>
                 <div>
                  <Label htmlFor="format">Output Format</Label>
                   <p className="text-xs text-muted-foreground mb-1">Describe the desired structure of the AI's response.</p>
                  <Input id="format" value={format} onChange={(e) => setFormat(e.target.value)} placeholder="e.g., A JSON object with 'subject' and 'body' keys" />
                </div>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="advanced-components">
              <AccordionTrigger><div className="flex items-center text-sm font-medium"><BookOpen className="mr-2 h-4 w-4" />Advanced Components</div></AccordionTrigger>
              <AccordionContent className="space-y-4 pt-2">
                <div>
                  <Label htmlFor="examples">Examples (Few-shot)</Label>
                   <p className="text-xs text-muted-foreground mb-1">Provide examples of the kind of output you want.</p>
                  <Textarea id="examples" value={examples} onChange={(e) => setExamples(e.target.value)} placeholder="e.g., Example Subject: New Release! Body: ... " rows={4} />
                </div>
                <div>
                  <Label htmlFor="constraints">Constraints & Rules</Label>
                  <p className="text-xs text-muted-foreground mb-1">Specify what the AI should NOT do, or other rules to follow.</p>
                  <Textarea id="constraints" value={constraints} onChange={(e) => setConstraints(e.target.value)} placeholder="e.g., Do not use jargon. The email body must be under 150 words." rows={3} />
                </div>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="technical-params">
              <AccordionTrigger><div className="flex items-center text-sm font-medium"><Settings2 className="mr-2 h-4 w-4" />Technical Parameters</div></AccordionTrigger>
              <AccordionContent className="space-y-4 pt-2">
                  <div>
                    <Label htmlFor="temperature" className="flex justify-between text-xs"><span>Temperature (Creativity)</span><span>{temperature.toFixed(1)}</span></Label>
                    <Slider id="temperature" min={0} max={1} step={0.1} value={[temperature]} onValueChange={(v) => setTemperature(v[0])} className="mt-2" />
                  </div>
                   <div>
                    <Label htmlFor="maxTokens" className="text-xs">Max Tokens (Output Length)</Label>
                     <Input id="maxTokens" type="number" value={maxTokens} onChange={(e) => setMaxTokens(e.target.value)} placeholder="e.g., 1024" className="mt-1" />
                  </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </GlassCardContent>
      </GlassCard>
      
      <Button type="submit" size="lg" className="w-full bg-primary text-primary-foreground text-base" disabled={isProcessing}>
        {isProcessing ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processing...</> : <><Wand2 className="mr-2 h-5 w-5" /> Generate My Prompt</>}
      </Button>
    </form>
  );
}
