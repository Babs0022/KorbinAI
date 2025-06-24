
"use client";

import React, { useState, type FormEvent, type ChangeEvent, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/shared/GlassCard';
import { generateSurveyQuestions, type SurveyQuestion, type GenerateSurveyQuestionsInput } from '@/ai/flows/generate-survey-questions-flow';
import { optimizePrompt, type OptimizePromptInput, type OptimizePromptOutput } from '@/ai/flows/optimize-prompt';
import { generatePromptMetadata } from '@/ai/flows/generate-prompt-metadata-flow';
import { useToast } from '@/hooks/use-toast';
import { Wand2, Loader2, Send, Mic, Lightbulb, Image as ImageIcon, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import NextImage from 'next/image';

// Extending the window object for SpeechRecognition
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
    AudioContext: typeof AudioContext;
    webkitAudioContext: typeof AudioContext;
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

// Helper to format time
const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export function CreatePromptForm({ onPromptOptimized }: CreatePromptFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [goal, setGoal] = useState('');
  const [imageDataUri, setImageDataUri] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [surveyQuestions, setSurveyQuestions] = useState<SurveyQuestion[]>([]);
  const [surveyAnswers, setSurveyAnswers] = useState<Record<string, string | string[]>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [isSpeechSupported, setIsSpeechSupported] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [visualizerData, setVisualizerData] = useState<Uint8Array>(new Uint8Array(32).fill(0));

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const visualizerAnimationRef = useRef<number>();
  const timerIntervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setIsSpeechSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognitionRef.current = recognition;
    } else {
      setIsSpeechSupported(false);
      console.warn("Speech Recognition not supported by this browser.");
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (visualizerAnimationRef.current) cancelAnimationFrame(visualizerAnimationRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
      if (recognitionRef.current) recognitionRef.current.abort();
    };
  }, []);

  const runVisualizer = useCallback(() => {
    if (!analyserRef.current) return;
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);
    const step = Math.floor(dataArray.length / 32);
    const vizSubset = new Uint8Array(32);
    for(let i=0; i<32; i++) {
       let slice = dataArray.slice(i * step, (i+1) * step);
       let avg = slice.reduce((a,b) => a+b, 0) / slice.length;
       vizSubset[i] = avg;
    }
    setVisualizerData(vizSubset);
    visualizerAnimationRef.current = requestAnimationFrame(runVisualizer);
  }, []);

  const startRecording = async () => {
    if (!isSpeechSupported || !recognitionRef.current) return;
    setIsRecording(true);
    setRecordingTime(0);
    timerIntervalRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);

    try {
      streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      const source = audioContextRef.current.createMediaStreamSource(streamRef.current);
      source.connect(analyserRef.current);
      
      runVisualizer();

      recognitionRef.current.onresult = (event) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript + ' ';
          }
        }
        if (finalTranscript) {
          setGoal(prev => (prev ? prev.trim() + ' ' : '') + finalTranscript.trim());
        }
      };
      
      recognitionRef.current.onerror = (event) => {
         console.error('Speech recognition error', event);
         let description = "An unknown error occurred with the microphone.";
         if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
            description = "Microphone access was denied. Please allow it in your browser settings.";
         } else if (event.error === 'no-speech') {
            description = "No speech was detected. Please try again."
         }
         toast({ title: "Mic Error", description, variant: "destructive" });
         stopRecording();
      };
      
      recognitionRef.current.start();

    } catch (err) {
      console.error("Error accessing microphone:", err);
      toast({ title: "Mic Access Denied", description: "Please enable microphone permissions in your browser.", variant: "destructive" });
      setIsRecording(false);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
  };

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) recognitionRef.current.stop();
    if (visualizerAnimationRef.current) cancelAnimationFrame(visualizerAnimationRef.current);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    
    streamRef.current?.getTracks().forEach(track => track.stop());
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
    }

    streamRef.current = null;
    audioContextRef.current = null;
    analyserRef.current = null;
    
    setIsRecording(false);
    setVisualizerData(new Uint8Array(32).fill(0));
  }, []);

  const handleMicClick = () => {
    if (!isSpeechSupported) {
       toast({ title: "Browser Not Supported", description: "Speech recognition isn't available in your browser.", variant: "destructive" });
       return;
    }
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };
  
  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        setImageDataUri(dataUrl);
        setImagePreview(URL.createObjectURL(file));
      };
      reader.readAsDataURL(file);
    } else {
      toast({ title: "Invalid File", description: "Please select an image file.", variant: "destructive" });
    }
  };
  
  const removeImage = () => {
      setImageDataUri(null);
      setImagePreview(null);
      if(fileInputRef.current) {
          fileInputRef.current.value = "";
      }
  }

  const handleGetQuestions = async () => {
    if (!goal.trim()) {
      toast({ title: "Goal Required", description: "Please describe the task for the AI.", variant: "destructive" });
      return;
    }
    setIsProcessing(true);
    try {
      const input: GenerateSurveyQuestionsInput = { goal };
      if (imageDataUri) {
          input.imageDataUri = imageDataUri;
      }
      const { questions } = await generateSurveyQuestions(input);
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
      if (imageDataUri) {
        optimizeInput.imageDataUri = imageDataUri;
      }
      
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
                <Label htmlFor="goal">What task or objective do you want your AI prompt to achieve? You can also upload an image for context.</Label>
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
                    <div className="absolute right-2 bottom-2 flex items-center space-x-2">
                        {isRecording && (
                           <div className="flex items-center gap-2 p-1 rounded-md bg-destructive/10 text-destructive text-xs font-mono">
                               <span>{formatTime(recordingTime)}</span>
                               <div className="flex items-end gap-0.5 h-4">
                                   {Array.from(visualizerData).map((value, i) => (
                                       <div key={i} className="w-0.5 bg-destructive rounded-full" style={{ height: `${Math.max(2, (value / 255) * 100)}%` }}></div>
                                   ))}
                               </div>
                           </div>
                        )}
                        <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon" 
                            onClick={handleMicClick}
                            className={cn(
                                "h-8 w-8 z-10 rounded-full",
                                 isRecording ? "text-white bg-destructive hover:bg-destructive/90" : "text-muted-foreground hover:bg-accent/10"
                            )} 
                            aria-label={isRecording ? "Stop recording" : "Start recording"} 
                            disabled={!isSpeechSupported || isProcessing}
                            title={isSpeechSupported ? (isRecording ? "Stop recording" : "Start recording") : "Speech recognition not supported"}
                        >
                            <Mic className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="image-upload" className="text-sm font-medium">Image Context (Optional)</Label>
                    {imagePreview ? (
                        <div className="relative w-32 h-32 rounded-md overflow-hidden border">
                            <NextImage src={imagePreview} alt="Image preview" layout="fill" objectFit="cover" />
                            <Button variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6 rounded-full" onClick={removeImage}>
                                <X className="h-4 w-4" />
                                <span className="sr-only">Remove image</span>
                            </Button>
                        </div>
                    ) : (
                        <div className="flex items-center">
                            <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                                <ImageIcon className="mr-2 h-4 w-4" />
                                Upload Image
                            </Button>
                            <Input 
                                id="image-upload"
                                type="file"
                                ref={fileInputRef}
                                onChange={handleImageChange}
                                accept="image/*"
                                className="hidden"
                            />
                        </div>
                    )}
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
