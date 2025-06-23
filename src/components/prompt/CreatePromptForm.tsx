
"use client";

import React, { useState, type FormEvent, type ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/shared/GlassCard';
import { generateSurveyQuestions, type SurveyQuestion } from '@/ai/flows/generate-survey-questions-flow';
import { optimizePrompt, type OptimizePromptInput, type OptimizePromptOutput } from '@/ai/flows/optimize-prompt';
import { generatePromptMetadata } from '@/ai/flows/generate-prompt-metadata-flow';
import { useToast } from '@/hooks/use-toast';
import { Wand2, Loader2, ArrowRight } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export interface OptimizedPromptResult extends OptimizePromptOutput {
  originalGoal: string;
  suggestedName: string;
  suggestedTags: string[];
}

interface CreatePromptFormProps {
  onPromptOptimized: (output: OptimizedPromptResult) => void;
}

const TOTAL_STEPS = 3;

export function CreatePromptForm({ onPromptOptimized }: CreatePromptFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [goal, setGoal] = useState('');
  const [surveyQuestions, setSurveyQuestions] = useState<SurveyQuestion[]>([]);
  const [surveyAnswers, setSurveyAnswers] = useState<Record<string, string | string[]>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleGoalSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!goal.trim()) {
      toast({ title: "Goal Required", description: "Please describe the task for the AI.", variant: "destructive" });
      return;
    }
    setIsProcessing(true);
    try {
      const { questions } = await generateSurveyQuestions({ goal });
      setSurveyQuestions(questions);
      setCurrentStep(2);
    } catch (error) {
      toast({ title: "Failed to Get Questions", description: "Could not generate survey questions. Please try again.", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSurveyChange = (id: string, type: SurveyQuestion['type'], value: string) => {
    setSurveyAnswers(prev => {
      const newAnswers = { ...prev };
      if (type === 'checkbox') {
        const currentValues = (newAnswers[id] as string[] | undefined) || [];
        if (currentValues.includes(value)) {
          newAnswers[id] = currentValues.filter(v => v !== value);
        } else {
          newAnswers[id] = [...currentValues, value];
        }
      } else {
        newAnswers[id] = value;
      }
      return newAnswers;
    });
  };

  const handleSurveySubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsProcessing(true);
    setCurrentStep(3);

    const formattedAnswers: Record<string, string> = {};
    for (const q of surveyQuestions) {
        const answer = surveyAnswers[q.id];
        if (Array.isArray(answer)) {
            formattedAnswers[q.text] = answer.join(', ');
        } else if (answer) {
            formattedAnswers[q.text] = answer;
        }
    }

    const optimizeInput: OptimizePromptInput = {
      goal,
      answers: formattedAnswers,
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
       toast({ title: "Optimization Failed", description: "Could not optimize the prompt. Please try again.", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const progressPercentage = ((currentStep -1) / (TOTAL_STEPS - 1)) * 100;

  return (
    <div className="space-y-6">
      <Progress value={progressPercentage} className="w-full h-2" />
      {currentStep === 1 && (
        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle>Step 1: Define Your Goal</GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent>
            <form onSubmit={handleGoalSubmit}>
              <Label htmlFor="goal">What is the primary task you want the AI to accomplish?</Label>
              <Textarea id="goal" value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="e.g., Write a marketing email for a new SaaS product..." rows={4} className="mt-2" required />
              <Button type="submit" className="mt-4 w-full" disabled={isProcessing}>
                {isProcessing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Getting Questions...</> : <>Get Tailored Questions <ArrowRight className="ml-2 h-4 w-4" /></>}
              </Button>
            </form>
          </GlassCardContent>
        </GlassCard>
      )}

      {currentStep === 2 && (
        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle>Step 2: Refine the Details</GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent>
            <form onSubmit={handleSurveySubmit} className="space-y-4">
              {surveyQuestions.map(q => (
                <div key={q.id}>
                  <Label>{q.text}</Label>
                  {q.type === 'text' && (
                    <Input type="text" onChange={(e: ChangeEvent<HTMLInputElement>) => handleSurveyChange(q.id, q.type, e.target.value)} className="mt-2" />
                  )}
                  {q.type === 'radio' && (
                    <RadioGroup onValueChange={(value) => handleSurveyChange(q.id, q.type, value)} className="mt-2 space-y-1">
                      {q.options?.map(opt => (
                        <div key={opt} className="flex items-center space-x-2">
                          <RadioGroupItem value={opt} id={`${q.id}-${opt}`} />
                          <Label htmlFor={`${q.id}-${opt}`} className="font-normal">{opt}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  )}
                  {q.type === 'checkbox' && (
                    <div className="mt-2 space-y-1">
                      {q.options?.map(opt => (
                        <div key={opt} className="flex items-center space-x-2">
                          <Checkbox id={`${q.id}-${opt}`} onCheckedChange={() => handleSurveyChange(q.id, q.type, opt)} />
                          <Label htmlFor={`${q.id}-${opt}`} className="font-normal">{opt}</Label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              <Button type="submit" className="w-full" disabled={isProcessing}>
                 Generate Prompt <Wand2 className="ml-2 h-4 w-4" />
              </Button>
            </form>
          </GlassCardContent>
        </GlassCard>
      )}
      
       {currentStep === 3 && (
        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle>Step 3: Processing</GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent className="flex flex-col items-center justify-center text-center h-48">
             <Loader2 className="h-12 w-12 animate-spin text-primary" />
             <p className="mt-4 text-muted-foreground">Generating your optimized prompt...</p>
          </GlassCardContent>
        </GlassCard>
      )}
    </div>
  );
}
