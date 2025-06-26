
"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mic, Image as ImageIcon, Loader2, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

// Extending the window object for SpeechRecognition
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

export function PromptInputForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [goal, setGoal] = useState('');
  const [imageDataUri, setImageDataUri] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeechSupported, setIsSpeechSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null); // Ref for autosizing

  // Effect for autosizing the textarea
  useEffect(() => {
    if (textareaRef.current) {
      // Reset height to shrink when text is deleted
      textareaRef.current.style.height = 'auto';
      // Set height to scrollHeight to expand
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [goal]); // Rerun whenever the goal text changes

  useEffect(() => {
    // Check for SpeechRecognition API on the client
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setIsSpeechSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognitionRef.current = recognition;

      recognition.onresult = (event) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          setGoal(prev => (prev ? prev.trim() + ' ' : '') + finalTranscript.trim());
        }
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error', event);
        let description = "An unknown error occurred with the microphone.";
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          description = "Microphone access was denied. Please allow it in your browser settings.";
        } else if (event.error === 'no-speech') {
          description = "No speech was detected. Please try again.";
        }
        toast({ title: "Mic Error", description, variant: "destructive" });
        setIsRecording(false);
      };
    } else {
      setIsSpeechSupported(false);
    }

    return () => {
      recognitionRef.current?.abort();
    };
  }, [toast]);

  const handleMicClick = () => {
    if (!isSpeechSupported) {
      toast({ title: "Browser Not Supported", description: "Speech recognition isn't available in your browser.", variant: "destructive" });
      return;
    }
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    } else {
      setGoal(''); // Clear previous goal before starting new recording
      recognitionRef.current?.start();
      setIsRecording(true);
    }
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        setImageDataUri(dataUrl);
        toast({ title: "Image Selected", description: `Added ${file.name} for context. Enter your goal and submit.` });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault(); // Prevent default form submission on enter
    if (!goal.trim()) {
      toast({ title: "Goal Required", description: "Please describe what you want to create.", variant: "destructive" });
      return;
    }
    setIsProcessing(true);
    const params = new URLSearchParams();
    params.set('goal', goal);
    if (imageDataUri) {
      try {
        params.set('imageDataUri', imageDataUri);
      } catch (e) {
         toast({ title: "Image Too Large", description: "The selected image is too large to process this way. Please try a smaller image.", variant: "destructive" });
         setIsProcessing(false);
         return;
      }
    }
    router.push(`/create-prompt?${params.toString()}`);
  };

  // Prevent Enter from submitting the form, allowing for new lines instead
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      // To submit on Enter, you would call handleSubmit here.
      // But the requirement is to allow new lines.
    }
  };

  return (
    <div className="relative w-full">
      <form onSubmit={handleSubmit}>
        <Textarea
          ref={textareaRef}
          rows={1}
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="e.g., Write a marketing email for a new SaaS product..."
          className="w-full min-h-[72px] max-h-[300px] text-lg p-4 pr-36 rounded-2xl bg-muted/50 border-border/50 focus:outline-none focus:ring-2 focus:ring-primary focus:shadow-lg focus:shadow-primary/20 resize-none overflow-y-auto transition-all duration-200"
          disabled={isProcessing}
          aria-label="Prompt goal input"
        />
        <div className="absolute bottom-3 right-3 flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            className="h-9 w-9 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full"
            disabled={isProcessing}
            aria-label="Upload Image"
          >
            <ImageIcon className="h-5 w-5" />
          </Button>
          <Input id="image-upload-dashboard" type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleMicClick}
            className={cn(
              "h-9 w-9 text-muted-foreground hover:bg-primary/10 rounded-full",
              isRecording ? "text-destructive bg-destructive/10" : "hover:text-primary"
            )}
            disabled={isProcessing || !isSpeechSupported}
            aria-label={isRecording ? "Stop recording" : "Start recording"}
          >
            <Mic className="h-5 w-5" />
          </Button>
          <Button
            type="submit"
            variant="default"
            size="icon"
            className="h-9 w-9 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full"
            disabled={isProcessing || !goal.trim()}
            aria-label="Submit goal"
          >
              <Send className="h-5 w-5" />
          </Button>
        </div>
      </form>
      {isProcessing && <Loader2 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-8 w-8 animate-spin text-primary" />}
    </div>
  );
}
