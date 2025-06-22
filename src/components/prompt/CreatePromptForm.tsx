
"use client";

import React, { useState, type FormEvent, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle, GlassCardDescription } from '@/components/shared/GlassCard';
import { optimizePrompt, type OptimizePromptInput, type OptimizePromptOutput } from '@/ai/flows/optimize-prompt';
import { generateSurveyQuestions, type GenerateSurveyQuestionsInput, type GenerateSurveyQuestionsOutput, type SurveyQuestion } from '@/ai/flows/generate-survey-questions-flow';
import { generatePromptMetadata, type GeneratePromptMetadataInput, type GeneratePromptMetadataOutput } from '@/ai/flows/generate-prompt-metadata-flow';
import { useToast } from '@/hooks/use-toast';
import { Wand2, Lightbulb, Loader2, Send, Mic, Square, AlertTriangle, Volume2, Settings2, Info, FileUp, Link as LinkIcon, Type } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import NextImage from 'next/image';

declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
    speechSynthesis: SpeechSynthesis;
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
  const [inputType, setInputType] = useState<'text' | 'image' | 'url'>('text');
  const [goal, setGoal] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [websiteUrl, setWebsiteUrl] = useState('');
  
  const [surveyQuestions, setSurveyQuestions] = useState<SurveyQuestion[]>([]);
  const [surveyAnswers, setSurveyAnswers] = useState<Record<string, string | string[]>>({});
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [questionsFetched, setQuestionsFetched] = useState(false);
  const { toast } = useToast();

  const [speechRecognitionSupported, setSpeechRecognitionSupported] = useState(false);
  const [ttsSupported, setTtsSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isBrieflyAISpeaking, setIsBrieflyAISpeaking] = useState(false);
  const [currentListeningField, setCurrentListeningField] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState<string>("");

  useEffect(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognitionAPI) {
      setSpeechRecognitionSupported(true);
      const recognitionInstance = new SpeechRecognitionAPI();
      recognitionInstance.continuous = false; 
      recognitionInstance.interimResults = false; 
      recognitionRef.current = recognitionInstance;

      recognitionInstance.onerror = (event: SpeechRecognitionErrorEvent) => {
        if (event.error === 'aborted') return;
        let errorMsg = "Speech recognition error.";
        if (event.error === 'no-speech') errorMsg = "No speech detected.";
        if (event.error === 'audio-capture') errorMsg = "Microphone error. Check permissions.";
        if (event.error === 'not-allowed') errorMsg = "Microphone access denied.";
        toast({ title: "Voice Input Error", description: errorMsg, variant: "destructive" });
        setIsListening(false); 
        setCurrentListeningField(null);
      };

      recognitionInstance.onend = () => {
        setIsListening(false);
        setCurrentListeningField(null);
      };
    }
  }, [toast]); 

  useEffect(() => {
    if (recognitionRef.current && currentListeningField) {
      recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = event.results[0]?.[0]?.transcript;
        if (transcript) {
          if (currentListeningField === 'goal') setGoal(transcript);
          else if (currentListeningField === 'websiteUrl') setWebsiteUrl(transcript);
          else setSurveyAnswers(prev => ({...prev, [currentListeningField]: transcript}));
        }
      };
    }
  }, [currentListeningField]); 

  useEffect(() => {
    if ('speechSynthesis' in window) {
      setTtsSupported(true);
      const utteranceInstance = new SpeechSynthesisUtterance();
      utteranceRef.current = utteranceInstance;
      utteranceInstance.onstart = () => setIsBrieflyAISpeaking(true);
      utteranceInstance.onend = () => setIsBrieflyAISpeaking(false);
      utteranceInstance.onerror = (event) => {
        toast({ title: "Speech Error", description: `Could not speak: ${event.error}`, variant: "destructive" });
        setIsBrieflyAISpeaking(false);
      };
    }
  }, [toast]);

  const speakText = (text: string) => {
    if (!ttsSupported || !utteranceRef.current) return;
    if (window.speechSynthesis.speaking) window.speechSynthesis.cancel();
    utteranceRef.current.text = text;
    utteranceRef.current.lang = navigator.language || 'en-US';
    window.speechSynthesis.speak(utteranceRef.current);
  };

  const startListening = (fieldId: string) => {
    if (!speechRecognitionSupported || !recognitionRef.current) return;
    if (isBrieflyAISpeaking) return;
    if (isListening) {
      stopListening();
      if (currentListeningField !== fieldId) setTimeout(() => startListening(fieldId), 100);
      return;
    }
    setCurrentListeningField(fieldId);
    setIsListening(true);
    try {
      recognitionRef.current.lang = navigator.language || 'en-US';
      recognitionRef.current.start();
    } catch (e: any) {
      setIsListening(false);
      setCurrentListeningField(null);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) recognitionRef.current.stop();
  };
  
  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) { // 4MB limit
        toast({ title: "Image Too Large", description: "Please upload an image smaller than 4MB.", variant: "destructive" });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => setImageUrl(reader.result as string);
      reader.onerror = () => toast({ title: "Error Reading File", description: "Could not read your image.", variant: "destructive" });
      reader.readAsDataURL(file);
    }
  };

  const handleSurveyChange = (questionId: string, value: string, type: 'text' | 'radio' | 'checkbox') => {
    setSurveyAnswers(prev => {
      if (type === 'checkbox') {
        const currentValues = (prev[questionId] as string[] || []);
        const newValues = currentValues.includes(value) ? currentValues.filter(v => v !== value) : [...currentValues, value];
        return { ...prev, [questionId]: newValues };
      }
      return { ...prev, [questionId]: value };
    });
  };

  const handleFetchSurveyQuestions = async () => {
    const hasTextInput = goal.trim();
    const hasImageInput = !!imageUrl;
    const hasUrlInput = websiteUrl.trim();
    if (!hasTextInput && !hasImageInput && !hasUrlInput) {
      toast({ title: "Input Required", description: "Please provide a goal, an image, or a URL.", variant: "destructive" });
      return;
    }
    stopListening();
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    
    setIsLoadingQuestions(true);
    setSurveyQuestions([]);
    setSurveyAnswers({});
    setQuestionsFetched(false);

    try {
      const input: GenerateSurveyQuestionsInput = {
        goal: hasTextInput ? goal : undefined,
        imageUrl: hasImageInput ? imageUrl : undefined,
        websiteUrl: hasUrlInput ? websiteUrl : undefined,
      };
      const result = await generateSurveyQuestions(input);
      if (result.questions && result.questions.length > 0) {
        setSurveyQuestions(result.questions);
        setQuestionsFetched(true);
        toast({ title: "Survey Ready!", description: "Please answer the tailored questions below." });
        if (ttsSupported) speakText("Here are some questions to refine your goal.");
      } else {
        const noQuestionsMessage = "Your input is clear! You can proceed to optimize or add more details.";
        toast({ title: "No Specific Questions Needed", description: noQuestionsMessage, variant: "default"});
        if(ttsSupported) speakText(noQuestionsMessage);
      }
    } catch (error) {
      toast({ title: "Failed to Fetch Questions", description: "Could not load dynamic questions.", variant: "destructive" });
    } finally {
      setIsLoadingQuestions(false);
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    stopListening();
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    
    const hasTextInput = goal.trim();
    const hasImageInput = !!imageUrl;
    const hasUrlInput = websiteUrl.trim();
    if (!hasTextInput && !hasImageInput && !hasUrlInput) {
      toast({ title: "Input Required", description: "Please provide a goal, image, or URL.", variant: "destructive" });
      return;
    }
    setIsProcessing(true);

    const formattedAnswers: Record<string, string> = {};
    Object.entries(surveyAnswers).forEach(([key, value]) => {
      formattedAnswers[key] = Array.isArray(value) ? value.join(', ') : value;
    });

    let effectiveGoal = goal;
    if (inputType === 'image' && !goal) effectiveGoal = "Analyze the provided image and generate a suitable prompt based on its content.";
    else if (inputType === 'url' && !goal) effectiveGoal = `Analyze the website at ${websiteUrl} and generate a prompt based on its content.`;

    const optimizeInput: OptimizePromptInput = {
      goal: inputType === 'text' ? goal : undefined,
      imageUrl: inputType === 'image' ? imageUrl ?? undefined : undefined,
      websiteUrl: inputType === 'url' ? websiteUrl : undefined,
      answers: formattedAnswers,
      temperature,
      maxTokens: maxTokens ? parseInt(maxTokens, 10) : undefined,
    };

    try {
      const optimizationResult = await optimizePrompt(optimizeInput);
      const metadataResult = await generatePromptMetadata({
        optimizedPrompt: optimizationResult.optimizedPrompt,
        originalGoal: effectiveGoal,
      });
      const finalResult: OptimizedPromptResult = {
        ...optimizationResult,
        originalGoal: effectiveGoal,
        suggestedName: metadataResult.suggestedName,
        suggestedTags: metadataResult.suggestedTags,
      };
      onPromptOptimized(finalResult);
      toast({ title: "Prompt Ready!", description: "Your optimized prompt is complete and displayed below." });
      if (ttsSupported) speakText(`Your optimized prompt is ready and displayed on your screen.`);
    } catch (error) {
      toast({ title: "Processing Failed", description: "Something went wrong. Please try again.", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };
  
  const canInteractGenerally = !isProcessing && !isLoadingQuestions && !isBrieflyAISpeaking;
  const actionButtonDisabled = !canInteractGenerally || isListening;
  const hasPrimaryInput = !!(goal.trim() || imageUrl || websiteUrl.trim());

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <GlassCard>
        <GlassCardHeader>
          <GlassCardTitle className="flex items-center font-headline text-xl">
            <Lightbulb className="mr-2 h-6 w-6 text-primary" />
            1. Define Your Input
          </GlassCardTitle>
           <GlassCardDescription>
            Start with text, an image, or a website URL.
          </GlassCardDescription>
        </GlassCardHeader>
        <GlassCardContent>
          <Tabs value={inputType} onValueChange={(value) => setInputType(value as any)} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="text"><Type className="mr-2 h-4 w-4"/>Text Goal</TabsTrigger>
              <TabsTrigger value="image"><FileUp className="mr-2 h-4 w-4"/>Image</TabsTrigger>
              <TabsTrigger value="url"><LinkIcon className="mr-2 h-4 w-4"/>Website URL</TabsTrigger>
            </TabsList>
            <TabsContent value="text" className="mt-4">
              <div className="space-y-2">
                <Label htmlFor="goal">What is your primary goal?</Label>
                 <Textarea id="goal" value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="e.g., Write a marketing email for a new SaaS product..." rows={4} />
              </div>
            </TabsContent>
             <TabsContent value="image" className="mt-4">
              <div className="space-y-2">
                <Label htmlFor="image-upload">Upload an image</Label>
                <Input id="image-upload" type="file" accept="image/*" onChange={handleImageChange} className="file:text-primary"/>
                {imageUrl && (
                  <div className="mt-2 relative aspect-video w-full max-w-sm rounded-md overflow-hidden border">
                    <NextImage src={imageUrl} alt="Uploaded preview" layout="fill" objectFit="contain" data-ai-hint="user uploaded image"/>
                  </div>
                )}
                 <Textarea value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="Optionally, add a goal for this image (e.g., 'describe this image for a blind person')." rows={2} className="mt-2"/>
              </div>
            </TabsContent>
            <TabsContent value="url" className="mt-4">
              <div className="space-y-2">
                <Label htmlFor="website-url">Enter a website URL</Label>
                <Input id="website-url" type="url" value={websiteUrl} onChange={e => setWebsiteUrl(e.target.value)} placeholder="https://example.com" />
                <Textarea value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="Optionally, add a goal for this website (e.g., 'summarize the key points')." rows={2} className="mt-2"/>
              </div>
            </TabsContent>
          </Tabs>
           <Button type="button" variant="outline" onClick={handleFetchSurveyQuestions} disabled={actionButtonDisabled || !hasPrimaryInput} className="w-full sm:w-auto mt-4">
            {isLoadingQuestions ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Fetching Questions...</> : <><Send className="mr-2 h-4 w-4" /> Get Tailored Questions</>}
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
            {isLoadingQuestions ? (
              <div className="flex items-center justify-center py-6"><Loader2 className="mr-2 h-6 w-6 animate-spin text-primary" /><p>Loading questions...</p></div>
            ) : surveyQuestions.map(q => (
              <div key={q.id}>
                <Label htmlFor={q.id}>{q.text}</Label>
                {q.type === 'text' && <Input id={q.id} type="text" value={(surveyAnswers[q.id] as string) || ''} onChange={(e) => handleSurveyChange(q.id, e.target.value, q.type)} className="mt-1" />}
                {q.type === 'radio' && q.options && (
                  <RadioGroup id={q.id} className="mt-2" value={surveyAnswers[q.id] as string} onValueChange={(value) => handleSurveyChange(q.id, value, q.type)}>
                    {q.options.map(option => <div key={option} className="flex items-center"><RadioGroupItem value={option} id={`${q.id}-${option}`} /><Label htmlFor={`${q.id}-${option}`} className="ml-2 font-normal">{option}</Label></div>)}
                  </RadioGroup>
                )}
                {q.type === 'checkbox' && q.options && (
                  <div id={q.id} className="mt-2 space-y-1">
                    {q.options.map(option => <div key={option} className="flex items-center"><Checkbox id={`${q.id}-${option}`} checked={(surveyAnswers[q.id] as string[] || []).includes(option)} onCheckedChange={() => handleSurveyChange(q.id, option, q.type)} /><Label htmlFor={`${q.id}-${option}`} className="ml-2 font-normal">{option}</Label></div>)}
                  </div>
                )}
              </div>
            ))}
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="advanced-settings">
                <AccordionTrigger><div className="flex items-center text-sm font-medium"><Settings2 className="mr-2 h-4 w-4" />Advanced Settings</div></AccordionTrigger>
                <AccordionContent className="space-y-4 pt-2">
                    <div>
                      <Label htmlFor="temperature" className="flex justify-between text-xs"><span>Temperature</span><span>{temperature.toFixed(1)}</span></Label>
                      <Slider id="temperature" min={0} max={1} step={0.1} value={[temperature]} onValueChange={(v) => setTemperature(v[0])} className="mt-2" />
                    </div>
                     <div>
                      <Label htmlFor="maxTokens" className="text-xs">Max Tokens</Label>
                       <Input id="maxTokens" type="number" value={maxTokens} onChange={(e) => setMaxTokens(e.target.value)} placeholder="e.g., 1024" className="mt-1" />
                    </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </GlassCardContent>
        </GlassCard>
      )}
      
      <Button type="submit" size="lg" className="w-full bg-primary text-primary-foreground text-base" disabled={actionButtonDisabled || !hasPrimaryInput}>
        {isProcessing ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processing...</> : <><Wand2 className="mr-2 h-5 w-5" /> Generate My Prompt</>}
      </Button>
    </form>
  );
}
