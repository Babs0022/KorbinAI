"use client";

import React, { useState, type FormEvent, type ChangeEvent, useRef, useEffect } from 'react';
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
import { Wand2, Loader2, Send, Mic, Lightbulb, MicOff } from 'lucide-react';
import { cn } from '@/lib/utils';

// Extending the window object for SpeechRecognition
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

export interface OptimizedPromptResult extends OptimizePromptOutput {
  originalGoal: string;
  suggestedName: string;
  suggestedTags: string[];
}

interface CreatePromptFormProps {
  onPromptOptimized: (output: OptimizedPromptResult) => void;
}

export function CreatePromptForm({ onPromptOptimized }: CreatePromptFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [goal, setGoal] = useState('');
  const [surveyQuestions, setSurveyQuestions] = useState<SurveyQuestion[]>([]);
  const [surveyAnswers, setSurveyAnswers] = useState<Record<string, string | string[]>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const [isRecording, setIsRecording] = useState(false);
  const [isSpeechSupported, setIsSpeechSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    // Check for browser support on component mount
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setIsSpeechSupported(true);
      recognitionRef.current = new SpeechRecognition();
    } else {
      setIsSpeechSupported(false);
      console.warn("Speech Recognition not supported by this browser.");
    }
  }, []);

  const handleMicClick = () => {
    if (!isSpeechSupported || !recognitionRef.current) {
      toast({
        title: "Browser Not Supported",
        description: "Your browser does not support speech recognition.",
        variant: "destructive",
      });
      return;
    }
  
    const recognition = recognitionRef.current;
  
    if (isRecording) {
      recognition.stop();
      setIsRecording(false);
    } else {
      recognition.lang = 'en-US';
      recognition.continuous = true;
      recognition.interimResults = false;
  
      recognition.onresult = (event) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          setGoal(prevGoal => (prevGoal ? prevGoal + ' ' : '') + finalTranscript.trim());
        }
      };
  
      recognition.onerror = (event) => {
        console.error('Speech recognition error', event);
        let description = `An error occurred: ${event.error}. Please try again.`;
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
            description = "Microphone access was denied. Please allow microphone access in your browser settings to use this feature.";
        } else if (event.error === 'no-speech') {
            description = "No speech was detected. Please try again."
        }
        toast({
          title: "Speech Recognition Error",
          description,
          variant: "destructive",
        });
        setIsRecording(false);
      };
  
      recognition.onend = () => {
        setIsRecording(false);
      };
  
      recognition.start();
      setIsRecording(true);
    }
  };

  const handleGetQuestions = async () => {
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

  const handleDirectGenerate = async () => {
    if (!goal.trim()) {
      toast({ title: "Goal Required", description: "Please describe the task for the AI.", variant: "destructive" });
      return;
    }
    setIsProcessing(true);
    setCurrentStep(3); // Go to processing state

    try {
      const optimizeInput: OptimizePromptInput = {
        goal,
        answers: {}, // No answers
      };
      
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
       setCurrentStep(1); // Go back to the input step on failure
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
       setCurrentStep(1); // Go back to the input step on failure
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {currentStep === 1 && (
        <>
          <GlassCard>
            <GlassCardHeader>
              <GlassCardTitle className="flex items-center">
                <Lightbulb className="mr-2 h-5 w-5 text-accent" />
                1. Define Your Goal
              </GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent>
              <div className="space-y-4">
                <Label htmlFor="goal">What task or objective do you want your AI prompt to achieve? Be as specific as possible.</Label>
                <div className="relative">
                    <Textarea 
                        id="goal" 
                        value={goal} 
                        onChange={(e) => setGoal(e.target.value)} 
                        placeholder="e.g., Write a marketing email for a new SaaS product, or Generate a Python function to sort a list of objects by a specific attribute." 
                        rows={4} 
                        className="pr-12 text-base bg-muted/30 border-border/50"
                        required 
                    />
                    <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        onClick={handleMicClick}
                        className={cn(
                            "absolute right-2 bottom-2 h-8 w-8 hover:bg-transparent",
                             isRecording ? "text-destructive" : "text-muted-foreground"
                        )} 
                        aria-label={isRecording ? "Stop recording" : "Use voice input"} 
                        disabled={!isSpeechSupported || isProcessing}
                        title={isSpeechSupported ? (isRecording ? "Stop recording" : "Use voice input") : "Speech recognition not supported"}
                    >
                        {isRecording ? <MicOff className="h-4 w-4 animate-pulse" /> : <Mic className="h-4 w-4" />}
                    </Button>
                </div>
                <Button type="button" variant="secondary" onClick={handleGetQuestions} disabled={isProcessing || !goal.trim()}>
                  {isProcessing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /></> : <><Send className="mr-2 h-4 w-4" /> Get Tailored Questions</>}
                </Button>
              </div>
            </GlassCardContent>
          </GlassCard>
          <Button onClick={handleDirectGenerate} size="lg" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" disabled={isProcessing || !goal.trim()}>
            {isProcessing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</> : <><Wand2 className="mr-2 h-4 w-4" /> Generate My Prompt</>}
          </Button>
        </>
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
              <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" disabled={isProcessing}>
                 {isProcessing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</> : <><Wand2 className="ml-2 h-4 w-4" /> Generate My Prompt</>}
              </Button>
            </form>
          </GlassCardContent>
        </GlassCard>
      )}
      
       {currentStep === 3 && (
        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle>Processing Your Prompt</GlassCardTitle>
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
