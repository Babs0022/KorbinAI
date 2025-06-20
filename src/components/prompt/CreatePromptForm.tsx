
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
import { Wand2, Lightbulb, Loader2, Send, Mic, MicOff, AlertTriangle, Volume2 } from 'lucide-react';
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

  // Effect for initializing SpeechRecognition and base handlers (onerror, onend)
  useEffect(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognitionAPI) {
      setSpeechRecognitionSupported(true);
      const recognitionInstance = new SpeechRecognitionAPI();
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      recognitionRef.current = recognitionInstance;

      recognitionInstance.onerror = (event: SpeechRecognitionErrorEvent) => {
        if (event.error === 'aborted') {
          console.info("Speech recognition aborted by user or system.");
          // isListening and currentListeningField will be reset by onend
          return;
        }
        console.error("Speech recognition error:", event.error, "for field:", currentListeningField);
        let errorMsg = "Speech recognition error. Please try again.";
        if (event.error === 'no-speech') errorMsg = "No speech detected. Please try again.";
        if (event.error === 'audio-capture') errorMsg = "Microphone error. Please check permissions and hardware.";
        if (event.error === 'not-allowed') errorMsg = "Microphone access denied. Please allow microphone access in your browser settings.";
        toast({ title: "Voice Input Error", description: errorMsg, variant: "destructive" });
        setIsListening(false);
        setCurrentListeningField(null);
      };

      recognitionInstance.onend = () => {
        console.log("Speech recognition ended for field:", currentListeningField);
        setIsListening(false);
        setCurrentListeningField(null); // Always reset current field when recognition ends
      };

      return () => {
        if (recognitionRef.current) {
          recognitionRef.current.abort(); // Ensure it's stopped on unmount
        }
      };
    } else {
      setSpeechRecognitionSupported(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast]); // currentListeningField removed as onend should reset it globally.

  // Effect for handling SpeechRecognition results - depends on currentListeningField
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = event.results[0][0].transcript;
        console.log(`Transcript for ${currentListeningField}: ${transcript}`); // Debugging
        if (currentListeningField === 'goal') {
          setGoal(prev => prev + transcript);
        } else if (currentListeningField) {
          setSurveyAnswers(prev => {
            const existingAnswer = prev[currentListeningField];
            // Ensure existingAnswer is treated as string for concatenation, even if it's an array from checkbox initially
            const newAnswer = (typeof existingAnswer === 'string' ? existingAnswer : '') + transcript;
            return {
              ...prev,
              [currentListeningField]: newAnswer,
            };
          });
        }
        // Recognition stops automatically due to continuous=false.
        // The onend event will fire and reset isListening & currentListeningField.
      };
    }
  }, [currentListeningField]); // This ensures onresult handler has the correct currentListeningField


  // Effect for initializing SpeechSynthesis (TTS)
  useEffect(() => {
    if ('speechSynthesis' in window) {
      setTtsSupported(true);
      const utteranceInstance = new SpeechSynthesisUtterance();
      utteranceRef.current = utteranceInstance;

      utteranceInstance.onstart = () => setIsBrieflyAISpeaking(true);
      utteranceInstance.onend = () => setIsBrieflyAISpeaking(false);
      utteranceInstance.onerror = (event) => {
        console.error("Speech synthesis error", event.error);
        toast({ title: "Speech Output Error", description: "Could not speak the text.", variant: "destructive" });
        setIsBrieflyAISpeaking(false);
      };
      return () => {
        if (window.speechSynthesis && isBrieflyAISpeaking) {
            window.speechSynthesis.cancel();
        }
      };
    } else {
      setTtsSupported(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast]); // isBrieflyAISpeaking removed, cleanup is on unmount

  const speakText = (text: string, lang?: string) => {
    if (!ttsSupported || !utteranceRef.current) {
      console.warn("TTS not supported or utterance not ready.");
      return;
    }
    if (window.speechSynthesis.speaking) { // If already speaking, cancel previous and speak new.
        window.speechSynthesis.cancel();
        // There might be a slight delay needed before speaking again after a cancel.
        // For now, we'll try immediate speak.
    }
    utteranceRef.current.text = text;
    utteranceRef.current.lang = lang || navigator.language || 'en-US';
    console.log("Attempting to speak:", text, "in lang:", utteranceRef.current.lang);
    window.speechSynthesis.speak(utteranceRef.current);
  };

  const startListening = (fieldId: string) => {
    console.log("Attempting to start listening for field:", fieldId);
    if (!speechRecognitionSupported || !recognitionRef.current) {
      toast({ title: "Voice Input Not Supported", description: "Your browser does not support speech recognition.", variant: "destructive" });
      return;
    }
    if (isBrieflyAISpeaking) {
      toast({ title: "Speaking", description: "Please wait until BrieflyAI finishes speaking.", variant: "default" });
      return;
    }
    if (isListening) {
      // If already listening, stop current one. User can click again for new field.
      recognitionRef.current.stop(); // This will trigger onend, which resets states.
      console.log("Stopped previous listening session.");
      toast({ title: "Input Switched", description: "Click mic again for the new field.", variant:"default" });
      return; // Important: return to prevent starting a new session immediately.
    }

    setCurrentListeningField(fieldId);
    setIsListening(true);
    try {
      recognitionRef.current.lang = navigator.language || 'en-US';
      recognitionRef.current.start();
      console.log("Speech recognition started successfully for field:", fieldId);
    } catch (e) {
      console.error("Error starting speech recognition:", e, "for field:", fieldId);
      toast({ title: "Voice Input Error", description: "Could not start voice input. Check microphone permissions.", variant: "destructive" });
      setIsListening(false); // Reset state on immediate failure
      setCurrentListeningField(null);
    }
  };

  const stopListening = () => {
    console.log("Attempting to stop listening.");
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop(); // This will trigger onend, which resets isListening and currentListeningField
    } else {
      // If not actively listening, ensure states are clean, though onend should handle this.
      setIsListening(false);
      setCurrentListeningField(null);
    }
  };

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
    if (isBrieflyAISpeaking) window.speechSynthesis.cancel();
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
            result.questions.forEach(q => { questionsToSpeak += `${q.text} `; });
            speakText(questionsToSpeak, recognitionRef.current?.lang);
        }
      } else {
        setQuestionsFetched(false);
        const noQuestionsMessage = "Your goal is clear, proceed to optimize or add more details if you wish.";
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
    if (isListening) stopListening();
    if (isBrieflyAISpeaking) window.speechSynthesis.cancel();

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
        speakText(`Here's your optimized prompt: ${finalResult.optimizedPrompt}. The suggested name is ${finalResult.suggestedName}. Suggested tags are: ${finalResult.suggestedTags.join(', ')}. It is now displayed on your screen.`, recognitionRef.current?.lang);
      }

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
          <div className="flex items-start space-x-2">
            <Textarea
              id="goal"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="e.g., Write a marketing email for a new SaaS product, or Generate a Python function to sort a list of objects by a specific attribute."
              rows={4}
              className="mt-0 flex-grow"
              required
              disabled={(isListening && currentListeningField !== 'goal') || isProcessing || isLoadingQuestions || isBrieflyAISpeaking}
            />
            {speechRecognitionSupported && (
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => isListening && currentListeningField === 'goal' ? stopListening() : startListening('goal')}
                disabled={isProcessing || isLoadingQuestions || isBrieflyAISpeaking || (isListening && currentListeningField !== 'goal')}
                title={isListening && currentListeningField === 'goal' ? "Stop Listening" : "Speak Goal"}
                className="flex-shrink-0 mt-0"
              >
                {isListening && currentListeningField === 'goal' ? <MicOff className="h-5 w-5 text-destructive" /> : <Mic className="h-5 w-5" />}
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
           <Button type="button" variant="outline" onClick={handleFetchSurveyQuestions} disabled={isLoadingQuestions || !goal.trim() || isListening || isProcessing || isBrieflyAISpeaking} className="w-full sm:w-auto">
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
                      disabled={isProcessing || isLoadingQuestions || isBrieflyAISpeaking || (isListening && currentListeningField !== q.id)}
                    />
                    {speechRecognitionSupported && (
                       <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => isListening && currentListeningField === q.id ? stopListening() : startListening(q.id)}
                        disabled={isProcessing || isLoadingQuestions || isBrieflyAISpeaking || (isListening && currentListeningField !== q.id)}
                        title={isListening && currentListeningField === q.id ? "Stop Listening" : `Speak Answer for "${q.text.substring(0,20)}..."`}
                      >
                        {isListening && currentListeningField === q.id ? <MicOff className="h-5 w-5 text-destructive" /> : <Mic className="h-5 w-5" />}
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
                    disabled={isProcessing || isLoadingQuestions || isBrieflyAISpeaking || isListening}
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
                          disabled={isProcessing || isLoadingQuestions || isBrieflyAISpeaking || isListening}
                        />
                        <Label htmlFor={`${q.id}-${option.replace(/\s+/g, '-')}`} className="font-normal">{option}</Label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {isBrieflyAISpeaking && (
              <div className="flex items-center text-sm text-primary mt-2">
                <Volume2 className="mr-2 h-4 w-4 animate-pulse" />
                BrieflyAI is speaking...
              </div>
            )}
          </GlassCardContent>
        </GlassCard>
      )}
      
      <Button 
        type="submit" 
        size="lg" 
        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-base" 
        disabled={isProcessing || isLoadingQuestions || isListening || isBrieflyAISpeaking || !goal.trim()}
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
    