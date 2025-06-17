
"use client";

import React, { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/shared/GlassCard';
import { optimizePrompt, type OptimizePromptInput, type OptimizePromptOutput } from '@/ai/flows/optimize-prompt';
import { generateSurveyQuestions, type GenerateSurveyQuestionsInput, type GenerateSurveyQuestionsOutput, type SurveyQuestion } from '@/ai/flows/generate-survey-questions-flow';
import { generatePromptMetadata, type GeneratePromptMetadataInput, type GeneratePromptMetadataOutput } from '@/ai/flows/generate-prompt-metadata-flow';
import { useToast } from '@/hooks/use-toast';
import { Wand2, Lightbulb, Loader2, Send, Tag } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

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
  const [surveyQuestions, setSurveyQuestions] = useState<SurveyQuestion[]>([]);
  const [surveyAnswers, setSurveyAnswers] = useState<Record<string, string | string[]>>({});
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false); // Combined loading state
  const [questionsFetched, setQuestionsFetched] = useState(false);
  const { toast } = useToast();

  const handleSurveyChange = (questionId: string, value: string, type: 'text' | 'radio' | 'checkbox') => {
    setSurveyAnswers(prev => {
      if (type === 'checkbox') {
        const currentValues = (prev[questionId] as string[] || []);
        const SaneCurrentValues = Array.isArray(currentValues) ? currentValues : [];
        if (SaneCurrentValues.includes(value)) {
          return { ...prev, [questionId]: SaneCurrentValues.filter(v => v !== value) };
        } else {
          return { ...prev, [questionId]: [...SaneCurrentValues, value] };
        }
      }
      return { ...prev, [questionId]: value };
    });
  };

  const handleFetchSurveyQuestions = async () => {
    if (!goal.trim()) {
      toast({ title: "Goal Required", description: "Please enter your goal before fetching questions.", variant: "destructive" });
      return;
    }
    setIsLoadingQuestions(true);
    setSurveyQuestions([]);
    setSurveyAnswers({});
    setQuestionsFetched(false);

    try {
      const input: GenerateSurveyQuestionsInput = { goal };
      const result: GenerateSurveyQuestionsOutput = await generateSurveyQuestions(input);
      if (result.questions && result.questions.length > 0) {
        setSurveyQuestions(result.questions);
        setQuestionsFetched(true);
        toast({ title: "Survey Ready!", description: "Please answer the tailored questions below." });
      } else {
        setQuestionsFetched(false);
        toast({ title: "No Specific Questions Needed", description: "Your goal is clear, proceed to optimize or add more details if you wish.", variant: "default"});
      }
    } catch (error) {
      console.error("Error fetching survey questions:", error);
      toast({ title: "Failed to Fetch Questions", description: "Could not load dynamic questions. Please try again or proceed without them.", variant: "destructive" });
      setQuestionsFetched(false);
    } finally {
      setIsLoadingQuestions(false);
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!goal.trim()) {
      toast({ title: "Goal Required", description: "Please enter your goal for the prompt.", variant: "destructive" });
      return;
    }
    setIsProcessing(true);

    const formattedAnswers: Record<string, string> = {};
    for (const key in surveyAnswers) {
        if (Array.isArray(surveyAnswers[key])) {
            formattedAnswers[key] = (surveyAnswers[key] as string[]).join(', ');
        } else {
            formattedAnswers[key] = surveyAnswers[key] as string;
        }
    }

    const optimizeInput: OptimizePromptInput = {
      goal,
      answers: formattedAnswers,
    };

    try {
      const optimizationResult = await optimizePrompt(optimizeInput);
      toast({ title: "Prompt Optimized!", description: "Now generating name and tags..." });

      const metadataInput: GeneratePromptMetadataInput = {
        optimizedPrompt: optimizationResult.optimizedPrompt,
        originalGoal: goal,
      };
      const metadataResult = await generatePromptMetadata(metadataInput);
      
      onPromptOptimized({
        ...optimizationResult,
        originalGoal: goal,
        suggestedName: metadataResult.suggestedName,
        suggestedTags: metadataResult.suggestedTags,
      });
      toast({ title: "Prompt Ready!", description: "Your optimized prompt with suggested name and tags is complete." });

    } catch (error) {
      console.error("Error during prompt creation process:", error);
      toast({ title: "Processing Failed", description: "Something went wrong. Please try again.", variant: "destructive" });
    } finally {
      setIsProcessing(false);
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
        <GlassCardContent className="space-y-3">
          <Label htmlFor="goal" className="text-sm font-medium text-foreground">
            What task or objective do you want your AI prompt to achieve? Be as specific as possible.
          </Label>
          <Textarea
            id="goal"
            value={goal}
            onChange={(e) => {
              setGoal(e.target.value);
            }}
            placeholder="e.g., Write a marketing email for a new SaaS product, or Generate a Python function to sort a list of objects by a specific attribute."
            rows={4}
            className="mt-2"
            required
          />
           <Button type="button" variant="outline" onClick={handleFetchSurveyQuestions} disabled={isLoadingQuestions || !goal.trim()} className="w-full sm:w-auto">
            {isLoadingQuestions ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Fetching Questions...</>
            ) : (
              <><Send className="mr-2 h-4 w-4" /> Get Tailored Questions</>
            )}
          </Button>
        </GlassCardContent>
      </GlassCard>

      {(isLoadingQuestions || (questionsFetched && surveyQuestions.length > 0)) && (
        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle className="flex items-center font-headline text-xl">
              <Wand2 className="mr-2 h-6 w-6 text-primary" />
              2. Refine with Details
            </GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent className="space-y-6">
            {isLoadingQuestions && (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="mr-2 h-6 w-6 animate-spin text-primary" />
                <p className="text-muted-foreground">Loading tailored questions...</p>
              </div>
            )}
            {!isLoadingQuestions && surveyQuestions.map(q => (
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
                        <RadioGroupItem value={option} id={`${q.id}-${option.replace(/\s+/g, '-')}`} />
                        <Label htmlFor={`${q.id}-${option.replace(/\s+/g, '-')}`} className="font-normal">{option}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                )}
                {q.type === 'checkbox' && q.options && (
                  <div id={q.id} className="mt-2 space-y-1">
                    {q.options.map(option => (
                      <div key={option} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`${q.id}-${option.replace(/\s+/g, '-')}`} 
                          onCheckedChange={(checked) => {
                            handleSurveyChange(q.id, option, q.type);
                          }}
                        />
                        <Label htmlFor={`${q.id}-${option.replace(/\s+/g, '-')}`} className="font-normal">{option}</Label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </GlassCardContent>
        </GlassCard>
      )}
      
      <Button type="submit" size="lg" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-base" disabled={isProcessing || isLoadingQuestions}>
        {isProcessing ? (
          <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processing...</>
        ) : (
          <><Wand2 className="mr-2 h-5 w-5" /> Generate My Prompt</>
        )}
      </Button>
    </form>
  );
}
