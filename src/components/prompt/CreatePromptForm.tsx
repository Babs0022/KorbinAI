"use client";

import React, { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/shared/GlassCard';
import { optimizePrompt, type OptimizePromptInput, type OptimizePromptOutput } from '@/ai/flows/optimize-prompt';
import { useToast } from '@/hooks/use-toast';
import { Wand2, Lightbulb, Loader2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

interface SurveyQuestion {
  id: string;
  text: string;
  type: 'text' | 'radio' | 'checkbox';
  options?: string[]; // For radio/checkbox
}

// Example adaptive survey questions - this would ideally be dynamic based on the goal
const initialSurveyQuestions: SurveyQuestion[] = [
  { id: 'q1', text: 'What is the primary audience for this prompt\'s output?', type: 'text' },
  { id: 'q2', text: 'What is the desired tone of the output?', type: 'radio', options: ['Formal', 'Casual', 'Professional', 'Humorous'] },
  { id: 'q3', text: 'Are there any specific keywords or phrases to include or exclude?', type: 'text' },
  { id: 'q4', text: 'What is the desired length or format of the output (e.g., paragraph, bullet points, code snippet)?', type: 'text'},
  { id: 'q5', text: 'Are there any constraints or limitations for the AI?', type: 'checkbox', options: ['Avoid jargon', 'Keep it concise', 'Provide examples']}
];

interface CreatePromptFormProps {
  onPromptOptimized: (output: OptimizePromptOutput) => void;
}

export function CreatePromptForm({ onPromptOptimized }: CreatePromptFormProps) {
  const [goal, setGoal] = useState('');
  const [surveyAnswers, setSurveyAnswers] = useState<Record<string, string | string[]>>({});
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSurveyChange = (questionId: string, value: string, type: 'text' | 'radio' | 'checkbox') => {
    setSurveyAnswers(prev => {
      if (type === 'checkbox') {
        const currentValues = (prev[questionId] as string[] || []);
        if (currentValues.includes(value)) {
          return { ...prev, [questionId]: currentValues.filter(v => v !== value) };
        } else {
          return { ...prev, [questionId]: [...currentValues, value] };
        }
      }
      return { ...prev, [questionId]: value };
    });
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!goal.trim()) {
      toast({ title: "Goal Required", description: "Please enter your goal for the prompt.", variant: "destructive" });
      return;
    }
    setIsLoading(true);

    const formattedAnswers: Record<string, string> = {};
    for (const key in surveyAnswers) {
        if (Array.isArray(surveyAnswers[key])) {
            formattedAnswers[key] = (surveyAnswers[key] as string[]).join(', ');
        } else {
            formattedAnswers[key] = surveyAnswers[key] as string;
        }
    }

    const input: OptimizePromptInput = {
      goal,
      answers: formattedAnswers,
    };

    try {
      const result = await optimizePrompt(input);
      onPromptOptimized(result);
      toast({ title: "Prompt Optimized!", description: "Your optimized prompt is ready." });
    } catch (error) {
      console.error("Error optimizing prompt:", error);
      toast({ title: "Optimization Failed", description: "Something went wrong. Please try again.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <GlassCard>
        <GlassCardHeader>
          <GlassCardTitle className="flex items-center font-headline text-xl">
            <Lightbulb className="mr-2 h-6 w-6 text-primary" />
            1. Define Your Goal
          </GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent>
          <Label htmlFor="goal" className="text-sm font-medium text-foreground">
            What task or objective do you want your AI prompt to achieve?
          </Label>
          <Textarea
            id="goal"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="e.g., Write a marketing email for a new SaaS product..."
            rows={4}
            className="mt-2"
            required
          />
        </GlassCardContent>
      </GlassCard>

      <GlassCard>
        <GlassCardHeader>
          <GlassCardTitle className="flex items-center font-headline text-xl">
            <Wand2 className="mr-2 h-6 w-6 text-primary" />
            2. Refine with Details (Adaptive Survey)
          </GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent className="space-y-6">
          {initialSurveyQuestions.map(q => (
            <div key={q.id}>
              <Label htmlFor={q.id} className="text-sm font-medium text-foreground">{q.text}</Label>
              {q.type === 'text' && (
                <Input 
                  id={q.id} 
                  type="text" 
                  className="mt-1" 
                  onChange={(e) => handleSurveyChange(q.id, e.target.value, q.type)} 
                />
              )}
              {q.type === 'radio' && q.options && (
                <RadioGroup 
                  id={q.id} 
                  className="mt-2 space-y-1"
                  onValueChange={(value) => handleSurveyChange(q.id, value, q.type)}
                >
                  {q.options.map(option => (
                    <div key={option} className="flex items-center space-x-2">
                      <RadioGroupItem value={option} id={`${q.id}-${option}`} />
                      <Label htmlFor={`${q.id}-${option}`} className="font-normal">{option}</Label>
                    </div>
                  ))}
                </RadioGroup>
              )}
              {q.type === 'checkbox' && q.options && (
                <div id={q.id} className="mt-2 space-y-1">
                  {q.options.map(option => (
                    <div key={option} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`${q.id}-${option}`} 
                        onCheckedChange={(checked) => {
                          if (checked) handleSurveyChange(q.id, option, q.type);
                          else handleSurveyChange(q.id, option, q.type); // Will be removed if already present
                        }}
                      />
                      <Label htmlFor={`${q.id}-${option}`} className="font-normal">{option}</Label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </GlassCardContent>
      </GlassCard>
      
      <Button type="submit" size="lg" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-base" disabled={isLoading}>
        {isLoading ? (
          <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Optimizing...</>
        ) : (
          <><Wand2 className="mr-2 h-5 w-5" /> Optimize My Prompt</>
        )}
      </Button>
    </form>
  );
}
