
"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mic, Image as ImageIcon, Send, X } from 'lucide-react';
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
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeechSupported, setIsSpeechSupported] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [goal]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setIsSpeechSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognitionRef.current = recognition;

      recognition.onresult = (event) => {
        let fullTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          fullTranscript += event.results[i][0].transcript;
        }
        setGoal(fullTranscript);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognition.onerror = (event: any) => { // Using `any` to safely access `event.error`
        let description = "An unknown error occurred with the microphone.";
        
        // Handle common, non-critical speech recognition events gracefully.
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          description = "Microphone access was denied. Please allow it in your browser settings.";
        } else if (event.error === 'no-speech') {
          description = "No speech was detected. Please try again.";
        } else if (event.error === 'aborted') {
          // This event fires when recording is stopped manually. It's not an error.
          setIsRecording(false);
          return; // Don't show a toast for this.
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
    } else {
      setGoal('');
      try {
        recognitionRef.current?.start();
      } catch (e) {
        // This can happen if start() is called while it's already running.
        console.warn("Speech recognition already started.", e);
      }
    }
    setIsRecording(!isRecording);
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({ title: "Invalid File Type", description: "Please select an image file.", variant: "destructive" });
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        setImageDataUri(dataUrl);
        toast({ title: "Image Selected", description: `Added ${file.name} for context. Enter your goal and submit.` });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImageDataUri(null);
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
    toast({ title: "Image Removed", description: "The image context has been cleared." });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goal.trim()) {
      toast({ title: "Goal Required", description: "Please describe what you want to create.", variant: "destructive" });
      return;
    }
    const params = new URLSearchParams();
    params.set('goal', goal);

    if (imageDataUri) {
      try {
        sessionStorage.setItem('imageDataUri', imageDataUri);
        params.set('image', 'true');
      } catch (error) {
         let description = "The selected image is too large to process. Please try a smaller one.";
         if (error instanceof DOMException && error.name === 'QuotaExceededError') {
             description = "Cannot store image as it exceeds browser storage limits. Please use a smaller file.";
         }
         toast({ title: "Image Too Large", description, variant: "destructive" });
         return;
      }
    }
    router.push(`/create-prompt?${params.toString()}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className={cn(
      "relative w-full rounded-2xl transition-all duration-300",
      isFocused 
        ? "ring-2 ring-primary shadow-lg shadow-primary/20" 
        : "ring-0 shadow-none"
    )}>
      {imageDataUri && (
        <div className="absolute top-3 left-3 z-10">
            <div className="relative">
                <img src={imageDataUri} alt="Image preview" className="h-16 w-16 object-cover rounded-lg border-2 border-primary/50" />
                <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    onClick={handleRemoveImage}
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full shadow-md"
                    aria-label="Remove image"
                >
                    <X className="h-4 w-4" />
                </Button>
            </div>
        </div>
      )}
      <form onSubmit={handleSubmit} className="relative">
        <Textarea
          ref={textareaRef}
          rows={1}
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={handleKeyDown}
          placeholder="Write a marketing email for a new SaaS product..."
          className={cn(
            "w-full min-h-[72px] max-h-[300px] text-lg p-4 pr-36 rounded-2xl bg-muted/50 border-transparent focus-visible:ring-0 resize-none overflow-y-auto",
            imageDataUri ? "pl-24" : "pl-4"
          )}
          aria-label="Prompt goal input"
        />
        <div className="absolute bottom-3 right-3 flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            className="h-9 w-9 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full"
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
            disabled={!isSpeechSupported}
            aria-label={isRecording ? "Stop recording" : "Start recording"}
          >
            <Mic className="h-5 w-5" />
          </Button>
          <Button
            type="submit"
            variant="default"
            size="icon"
            className="h-9 w-9 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full"
            disabled={!goal.trim()}
            aria-label="Submit goal"
          >
              <Send className="h-5 w-5" />
          </Button>
        </div>
      </form>
    </div>
  );
}
