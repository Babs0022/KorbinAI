
"use client";

import React, { useState, type FormEvent, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/shared/GlassCard';
import { optimizePrompt, type OptimizePromptInput, type OptimizePromptOutput } from '@/ai/flows/optimize-prompt';
import { generateSurveyQuestions, type GenerateSurveyQuestionsInput, type GenerateSurveyQuestionsOutput, type SurveyQuestion } from '@/ai/flows/generate-survey-questions-flow';
import { generatePromptMetadata, type GeneratePromptMetadataInput, type GeneratePromptMetadataOutput } from '@/ai/flows/generate-prompt-metadata-flow';
import { useToast } from '@/hooks/use-toast';
import { Wand2, Lightbulb, Loader2, Send, Mic, MicOff, AlertTriangle, Volume2, Square } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

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
  const [goal, setGoal] = useState('');
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

  useEffect(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognitionAPI) {
      setSpeechRecognitionSupported(true);
      const recognitionInstance = new SpeechRecognitionAPI();
      recognitionInstance.continuous = false; // Process after user stops speaking
      recognitionInstance.interimResults = false; // Only final results
      recognitionRef.current = recognitionInstance;

      recognitionInstance.onerror = (event: SpeechRecognitionErrorEvent) => {
        if (event.error === 'aborted') {
          console.info("[SpeechRecognition onerror] Recognition aborted for field:", currentListeningField);
          // No user-facing toast for "aborted" as it's often programmatic
          return;
        }
        console.error("[SpeechRecognition onerror] Error for field:", currentListeningField, "Error type:", event.error);
        let errorMsg = "Speech recognition error. Please try again.";
        if (event.error === 'no-speech') errorMsg = "No speech detected. Please try again.";
        if (event.error === 'audio-capture') errorMsg = "Microphone error. Please check permissions and hardware.";
        if (event.error === 'not-allowed') errorMsg = "Microphone access denied. Please allow microphone access in your browser settings.";
        toast({ title: "Voice Input Error", description: errorMsg, variant: "destructive" });
        setIsListening(false); // Ensure listening state is reset
        setCurrentListeningField(null);
      };

      recognitionInstance.onend = () => {
        console.log("[SpeechRecognition onend] Recognition ended for field:", currentListeningField);
        setIsListening(false);
        setCurrentListeningField(null);
      };

      return () => {
        if (recognitionRef.current) {
          recognitionRef.current.abort(); // Clean up on unmount
          console.log("[SpeechRecognition cleanup] Aborted recognition on unmount.");
        }
      };
    } else {
      setSpeechRecognitionSupported(false);
      console.warn("[SpeechRecognition] Not supported by this browser.");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array: runs once on mount

  useEffect(() => {
    if (recognitionRef.current && currentListeningField) {
      console.log(`[Effect onresult] Setting up onresult for field: ${currentListeningField}.`);
      recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
        console.log(`[Event onresult] Fired for ${currentListeningField}. Number of results: ${event.results.length}`);
        if (event.results.length > 0 && event.results[0].length > 0) {
            const transcript = event.results[0][0].transcript;
            console.log(`[Event onresult] Transcript for ${currentListeningField}: "${transcript}"`);

            if (currentListeningField === 'goal') {
              console.log(`[State Update] Setting goal with: "${transcript}"`);
              setGoal(transcript); // Replace content
            } else {
              console.log(`[State Update] Setting surveyAnswer for ${currentListeningField} with: "${transcript}"`);
              setSurveyAnswers(prev => ({
                ...prev,
                [currentListeningField]: transcript, // Replace content
              }));
            }
        } else {
            console.warn(`[Event onresult] No transcript found in results for ${currentListeningField}.`);
        }
        // Do not set isListening or currentListeningField here; onend handles it.
      };
    } else {
      if (recognitionRef.current) {
        recognitionRef.current.onresult = null; // Clear handler if not listening
        console.log("[Effect onresult] Cleared onresult because currentListeningField is null.");
      }
    }
  }, [currentListeningField]); // Re-run this effect when currentListeningField changes

  useEffect(() => {
    if ('speechSynthesis' in window) {
      setTtsSupported(true);
      const utteranceInstance = new SpeechSynthesisUtterance();
      utteranceRef.current = utteranceInstance;
      console.log("[TTS] Supported and utterance instance created.");

      utteranceInstance.onstart = () => {
        console.log("[TTS onstart] Speaking started.");
        setIsBrieflyAISpeaking(true);
      }
      utteranceInstance.onend = () => {
        console.log("[TTS onend] Speaking finished.");
        setIsBrieflyAISpeaking(false);
      }
      utteranceInstance.onerror = (event) => {
        console.error("[TTS onerror] Error:", event.error);
        toast({ title: "Speech Output Error", description: `Could not speak: ${event.error}`, variant: "destructive" });
        setIsBrieflyAISpeaking(false);
      };
      return () => {
        if (window.speechSynthesis && window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
            console.log("[TTS cleanup] Cancelled any ongoing speech on unmount.");
        }
      };
    } else {
      setTtsSupported(false);
      console.warn("[TTS] Not supported by this browser.");
    }
  }, [toast]);

  const speakText = (text: string, lang?: string) => {
    if (!ttsSupported || !utteranceRef.current) {
      console.warn("[TTS speakText] Not supported or utterance not ready. Text was:", text);
      return;
    }
    if (window.speechSynthesis.speaking) {
        console.log("[TTS speakText] Cancelling previous speech before speaking new text:", text);
        window.speechSynthesis.cancel(); // Important: ensure previous speech is stopped.
        // It's possible a slight delay is needed for cancel to take effect before new speak command
        // For now, trying without explicit delay.
    }
    utteranceRef.current.text = text;
    utteranceRef.current.lang = lang || navigator.language || 'en-US';
    console.log("[TTS speakText] Attempting to speak:", `"${text.substring(0,50)}..."`, "in lang:", utteranceRef.current.lang);
    window.speechSynthesis.speak(utteranceRef.current);
  };

  const startListening = (fieldId: string) => {
    console.log(`[VoiceInput startListening] Attempting for field: ${fieldId}. Current state - isListening: ${isListening}, currentField: ${currentListeningField}, isBrieflyAISpeaking: ${isBrieflyAISpeaking}`);
    if (!speechRecognitionSupported || !recognitionRef.current) {
      toast({ title: "Voice Input Not Supported", description: "Your browser does not support speech recognition.", variant: "destructive" });
      return;
    }
    if (isBrieflyAISpeaking) {
      toast({ title: "Assistant Speaking", description: "Please wait until BrieflyAI finishes speaking.", variant: "default" });
      return;
    }
    if (isListening) {
      if (currentListeningField === fieldId) {
        console.log(`[VoiceInput startListening] Already listening for ${fieldId}. Calling stopListening.`);
        stopListening();
        return;
      } else {
        console.warn(`[VoiceInput startListening] Already listening for ${currentListeningField}, but requested for ${fieldId}. Stopping current one first.`);
        recognitionRef.current.stop(); // This will trigger onend to reset states
        toast({ title: "Switching Input", description: "Mic for previous field stopped. Click new mic again.", variant: "default", duration: 4000 });
        return;
      }
    }

    setCurrentListeningField(fieldId);
    setIsListening(true);
    try {
      recognitionRef.current.lang = navigator.language || 'en-US';
      recognitionRef.current.start();
      console.log(`[VoiceInput startListening] Recognition started successfully for field: ${fieldId}, lang: ${recognitionRef.current.lang}`);
    } catch (e: any) {
      console.error(`[VoiceInput startListening] Error starting recognition for ${fieldId}:`, e.message);
      toast({ title: "Voice Input Error", description: `Could not start voice input: ${e.message}. Check mic permissions.`, variant: "destructive" });
      setIsListening(false);
      setCurrentListeningField(null);
    }
  };

  const stopListening = () => {
    console.log(`[VoiceInput stopListening] Explicitly stopping for field: ${currentListeningField}. isListening: ${isListening}`);
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      // onend handler will set isListening = false and currentListeningField = null
    } else {
      // Fallback if somehow stopListening is called when not actually listening by our state
      setIsListening(false);
      setCurrentListeningField(null);
      console.log("[VoiceInput stopListening] State reset as fallback (was not actively listening by component state).");
    }
  };

  const handleSurveyChange = (questionId: string, value: string, type: 'text' | 'radio' | 'checkbox') => {
    setSurveyAnswers(prev => {
      if (type === 'checkbox') {
        const currentValues = (prev[questionId] as string[] || []);
        const saneCurrentValues = Array.isArray(currentValues) ? currentValues : [];
        if (saneCurrentValues.includes(value)) {
          return { ...prev, [questionId]: saneCurrentValues.filter(v => v !== value) };
        } else {
          return { ...prev, [questionId]: [...saneCurrentValues, value] };
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
    if (isBrieflyAISpeaking && window.speechSynthesis) window.speechSynthesis.cancel();
    if (isListening && recognitionRef.current) recognitionRef.current.stop();

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
        if (ttsSupported) {
            let questionsToSpeak = "Here are some questions to refine your goal: ";
            result.questions.forEach((q, index) => { questionsToSpeak += `Question ${index + 1}: ${q.text} `; });
            speakText(questionsToSpeak, recognitionRef.current?.lang);
        }
      } else {
        setQuestionsFetched(false); // Ensure it's false if no questions
        const noQuestionsMessage = "Your goal seems clear enough, or I couldn't generate specific follow-up questions. You can proceed to optimize or add more details to your goal if you wish.";
        toast({ title: "No Specific Questions Needed", description: noQuestionsMessage, variant: "default"});
        if(ttsSupported) speakText(noQuestionsMessage, recognitionRef.current?.lang);
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
    if (isListening && recognitionRef.current) recognitionRef.current.stop();
    if (isBrieflyAISpeaking && window.speechSynthesis) window.speechSynthesis.cancel();

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
      
      const finalResult: OptimizedPromptResult = {
        ...optimizationResult,
        originalGoal: goal,
        suggestedName: metadataResult.suggestedName,
        suggestedTags: metadataResult.suggestedTags,
      };
      onPromptOptimized(finalResult);
      
      const readyMessage = "Your optimized prompt with suggested name and tags is complete and displayed below.";
      toast({ title: "Prompt Ready!", description: readyMessage });
      if (ttsSupported) {
        const textToSpeak = `Your optimized prompt is: ${finalResult.optimizedPrompt}. The suggested name is ${finalResult.suggestedName}. And suggested tags are: ${finalResult.suggestedTags.join(', ')}. It's now displayed on your screen.`;
        speakText(textToSpeak, recognitionRef.current?.lang);
      }

    } catch (error) {
      console.error("Error during prompt creation process:", error);
      toast({ title: "Processing Failed", description: "Something went wrong. Please try again.", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const canInteractGenerally = !isProcessing && !isLoadingQuestions && !isBrieflyAISpeaking;
  const micButtonDisabledForField = (fieldId: string) => 
    !canInteractGenerally || (isListening && currentListeningField !== fieldId);
  const actionButtonDisabled = !canInteractGenerally || isListening || !goal.trim();

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
          <div className="flex items-start space-x-2">
            <Textarea
              id="goal"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="e.g., Write a marketing email for a new SaaS product, or Generate a Python function to sort a list of objects by a specific attribute."
              rows={4}
              className="mt-0 flex-grow"
              required
              disabled={!canInteractGenerally || (isListening && currentListeningField !== 'goal')}
            />
            {speechRecognitionSupported && (
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => isListening && currentListeningField === 'goal' ? stopListening() : startListening('goal')}
                disabled={micButtonDisabledForField('goal')}
                title={isListening && currentListeningField === 'goal' ? "Stop Recording" : "Record Goal"}
                className="flex-shrink-0 mt-0"
              >
                {isListening && currentListeningField === 'goal' ? <Square className="h-5 w-5 text-destructive fill-destructive" /> : <Mic className="h-5 w-5" />}
              </Button>
            )}
          </div>
          {(!speechRecognitionSupported || !ttsSupported) && (
             <div className="flex items-center text-xs text-muted-foreground mt-1">
                <AlertTriangle className="h-3 w-3 mr-1 text-amber-500"/>
                {!speechRecognitionSupported && "Voice input not supported. "}
                {!ttsSupported && "Speech output not supported by your browser."}
             </div>
          )}
           <Button type="button" variant="outline" onClick={handleFetchSurveyQuestions} disabled={actionButtonDisabled || !goal.trim()} className="w-full sm:w-auto">
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
                  <div className="flex items-center space-x-2 mt-1">
                    <Input 
                      id={q.id} 
                      type="text" 
                      className="flex-grow" 
                      value={(surveyAnswers[q.id] as string) || ''}
                      onChange={(e) => handleSurveyChange(q.id, e.target.value, q.type)} 
                      disabled={!canInteractGenerally || (isListening && currentListeningField !== q.id)}
                    />
                    {speechRecognitionSupported && (
                       <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => isListening && currentListeningField === q.id ? stopListening() : startListening(q.id)}
                        disabled={micButtonDisabledForField(q.id)}
                        title={isListening && currentListeningField === q.id ? "Stop Recording" : `Record Answer for "${q.text.substring(0,20)}..."`}
                      >
                        {isListening && currentListeningField === q.id ? <Square className="h-5 w-5 text-destructive fill-destructive" /> : <Mic className="h-5 w-5" />}
                      </Button>
                    )}
                  </div>
                )}
                {q.type === 'radio' && q.options && (
                  <RadioGroup 
                    id={q.id} 
                    className="mt-2 space-y-1"
                    value={surveyAnswers[q.id] as string}
                    onValueChange={(value) => handleSurveyChange(q.id, value, q.type)}
                    disabled={!canInteractGenerally || isListening}
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
                          checked={(surveyAnswers[q.id] as string[] || []).includes(option)}
                          onCheckedChange={() => { 
                            handleSurveyChange(q.id, option, q.type);
                          }}
                          disabled={!canInteractGenerally || isListening}
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
      
      {isBrieflyAISpeaking && (
        <div className="flex items-center justify-center text-sm text-primary my-2 p-2 bg-primary/10 rounded-md">
          <Volume2 className="mr-2 h-5 w-5 animate-pulse" />
          BrieflyAI is speaking...
        </div>
      )}
      
      <Button 
        type="submit" 
        size="lg" 
        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-base" 
        disabled={actionButtonDisabled}
      >
        {isProcessing ? (
          <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processing...</>
        ) : (
          <><Wand2 className="mr-2 h-5 w-5" /> Generate My Prompt</>
        )}
      </Button>
    </form>
  );
}
    

    