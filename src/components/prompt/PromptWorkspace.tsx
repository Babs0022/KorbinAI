"use client";

import React, { useState, useEffect, type FormEvent, type ChangeEvent, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle, GlassCardDescription } from '@/components/shared/GlassCard';
import { generateSurveyQuestions, type SurveyQuestion, type GenerateSurveyQuestionsInput } from '@/ai/flows/generate-survey-questions-flow';
import { optimizePrompt, type OptimizePromptInput, type OptimizePromptOutput } from '@/ai/flows/optimize-prompt';
import { generatePromptMetadata, type GeneratePromptMetadataOutput } from '@/ai/flows/generate-prompt-metadata-flow';
import { useToast } from '@/hooks/use-toast';
import { Wand2, Loader2, ArrowLeft, HelpCircle } from 'lucide-react';
import { OptimizedPromptCard } from '@/components/prompt/OptimizedPromptCard';
import Link from 'next/link';
import { LoadingTips } from '@/components/shared/LoadingTips';

type WorkspaceState = 'loading_questions' | 'showing_questions' | 'loading_optimization' | 'showing_result' | 'error';

interface OptimizedPromptResult extends OptimizePromptOutput, GeneratePromptMetadataOutput {
  originalGoal: string;
}

export function PromptWorkspace() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();

  const [workspaceState, setWorkspaceState] = useState<WorkspaceState>('loading_questions');
  const [goal, setGoal] = useState('');
  const [imageDataUri, setImageDataUri] = useState<string | null>(null);

  const [surveyQuestions, setSurveyQuestions] = useState<SurveyQuestion[]>([]);
  const [surveyAnswers, setSurveyAnswers] = useState<Record<string, string | string[]>>({});
  
  const [optimizedOutput, setOptimizedOutput] = useState<OptimizedPromptResult | null>(null);
  
  const handleDirectGenerate = useCallback(async (currentGoal: string, currentImageDataUri: string | null) => {
    setWorkspaceState('loading_optimization');
    try {
      const optimizeInput: OptimizePromptInput = { goal: currentGoal, answers: {} };
       if (currentImageDataUri) {
        optimizeInput.imageDataUri = currentImageDataUri;
      }
      const optimizationResult = await optimizePrompt(optimizeInput);
      const metadataResult = await generatePromptMetadata({
          optimizedPrompt: optimizationResult.optimizedPrompt,
          originalGoal: currentGoal,
      });

      const finalResult: OptimizedPromptResult = {
        ...optimizationResult,
        originalGoal: currentGoal,
        suggestedName: metadataResult.suggestedName,
        suggestedTags: metadataResult.suggestedTags,
      };

      setOptimizedOutput(finalResult);
      setWorkspaceState('showing_result');
      toast({ title: "Prompt Ready!", description: "Your optimized prompt is complete." });
    } catch (error) {
       toast({ title: "Optimization Failed", description: "Could not optimize the prompt. Please try again.", variant: "destructive" });
       setWorkspaceState('error');
    }
  }, [toast]);

  const fetchAndSetQuestions = useCallback(async (currentGoal: string, currentImageDataUri: string | null) => {
    try {
      const input: GenerateSurveyQuestionsInput = { goal: currentGoal };
      if (currentImageDataUri) {
        input.imageDataUri = currentImageDataUri;
      }
      const { questions } = await generateSurveyQuestions(input);
      if (questions.length > 0) {
        setSurveyQuestions(questions);
        setWorkspaceState('showing_questions');
      } else {
        toast({ title: "No specific questions needed", description: "Generating your prompt directly..." });
        await handleDirectGenerate(currentGoal, currentImageDataUri);
      }
    } catch (error) {
      console.error("Error fetching survey questions:", error);
      toast({ title: "Error", description: "Could not generate survey questions. Please try again.", variant: "destructive" });
      setWorkspaceState('error');
    }
  }, [toast, handleDirectGenerate]);

  useEffect(() => {
    const goalFromParams = searchParams.get('goal');
    const hasImageFlag = searchParams.get('image') === 'true';
    let imageFromStorage: string | null = null;

    if (hasImageFlag) {
        imageFromStorage = sessionStorage.getItem('imageDataUri');
        sessionStorage.removeItem('imageDataUri');
    }

    if (goalFromParams) {
      setGoal(goalFromParams);
      if (imageFromStorage) {
        setImageDataUri(imageFromStorage);
      }
      setWorkspaceState('loading_questions');
      fetchAndSetQuestions(goalFromParams, imageFromStorage);
    } else {
      toast({ title: "No Goal Specified", description: "Redirecting to dashboard to start a new prompt.", variant: "destructive" });
      router.push('/dashboard');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


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
    setWorkspaceState('loading_optimization');

    const formattedAnswers: Record<string, string> = {};
    for (const q of surveyQuestions) {
        const answer = surveyAnswers[q.id];
        if (Array.isArray(answer)) {
            formattedAnswers[q.text] = answer.join(', ');
        } else if (answer) {
            formattedAnswers[q.text] = answer;
        }
    }

    const optimizeInput: OptimizePromptInput = { goal, answers: formattedAnswers };
    if (imageDataUri) {
      optimizeInput.imageDataUri = imageDataUri;
    }
    
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
      
      setOptimizedOutput(finalResult);
      setWorkspaceState('showing_result');
      toast({ title: "Prompt Ready!", description: "Your optimized prompt is complete." });
    } catch (error) {
       toast({ title: "Optimization Failed", description: "Could not optimize the prompt. Please try again.", variant: "destructive" });
       setWorkspaceState('error');
    }
  };

  const renderContent = () => {
    switch (workspaceState) {
      case 'loading_questions':
      case 'loading_optimization':
        return (
          <GlassCard>
            <LoadingTips
              loadingText={
                workspaceState === 'loading_questions'
                  ? 'Generating clarifying questions...'
                  : 'Crafting your optimized prompt...'
              }
            />
          </GlassCard>
        );
      case 'showing_questions':
        return (
          <GlassCard>
            <GlassCardHeader>
              <GlassCardTitle className="flex items-center"><HelpCircle className="mr-2 h-5 w-5 text-accent"/>Refine the Details</GlassCardTitle>
              <GlassCardDescription>Answering these questions will help create a more effective prompt.</GlassCardDescription>
            </GlassCardHeader>
            <GlassCardContent>
              <form onSubmit={handleSurveySubmit} className="space-y-4">
                {imageDataUri && (
                  <div className="mb-4">
                    <Label>Image Context:</Label>
                    <img src={imageDataUri} alt="User-provided context" className="mt-2 rounded-lg border max-h-48 w-auto" />
                  </div>
                )}
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
                <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
                  <Wand2 className="mr-2 h-4 w-4" /> Optimize My Prompt
                </Button>
              </form>
            </GlassCardContent>
          </GlassCard>
        );
      case 'showing_result':
        return optimizedOutput ? (
          <>
            <OptimizedPromptCard 
              optimizedPrompt={optimizedOutput.optimizedPrompt}
              originalGoal={optimizedOutput.originalGoal} 
              generatedName={optimizedOutput.suggestedName}
              generatedTags={optimizedOutput.suggestedTags}
            />
             <Button variant="outline" asChild className="mt-6 mx-auto flex">
                <Link href="/dashboard">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Create Another Prompt
                </Link>
            </Button>
          </>
        ) : null;
      case 'error':
         return (
             <GlassCard>
                <GlassCardContent className="flex flex-col items-center justify-center text-center h-64">
                    <p className="text-destructive">Something went wrong. Please go back and try again.</p>
                    <Button asChild variant="outline" className="mt-4">
                        <Link href="/dashboard"><ArrowLeft className="mr-2 h-4 w-4" />Back to Dashboard</Link>
                    </Button>
                </GlassCardContent>
            </GlassCard>
         );
      default:
        return null;
    }
  };

  return (
    <div>
      <h1 className="font-headline text-3xl font-bold text-foreground mb-2">Prompt Workspace</h1>
      <p className="text-muted-foreground mb-8 line-clamp-2">
        <strong>Goal:</strong> {goal}
      </p>
      {renderContent()}
    </div>
  );
}
