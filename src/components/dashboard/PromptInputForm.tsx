
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
  const [imageDataUris, setImageDataUris] = useState<string[]>([]);
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
        // Build the full transcript from the event results list
        const transcript = Array.from(event.results)
          .map((result) => result[0]) // Get the most confident transcript
          .map((result) => result.transcript) // Get the string
          .join(''); // Join all parts
        
        setGoal(transcript);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognition.onerror = (event: any) => { 
        let description = "An unknown error occurred with the microphone.";
        
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          description = "Microphone access was denied. Please allow it in your browser settings.";
        } else if (event.error === 'no-speech') {
          description = "No speech was detected. Please try again.";
        } else if (event.error === 'aborted') {
          setIsRecording(false);
          return;
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
        console.warn("Speech recognition already started.", e);
      }
    }
    setIsRecording(!isRecording);
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const newImageDataUris: string[] = [];
      const filePromises = Array.from(files).map(file => {
        return new Promise<void>((resolve, reject) => {
          if (!file.type.startsWith('image/')) {
            toast({ title: "Invalid File Type", description: `Skipping ${file.name} as it is not an image.`, variant: "destructive" });
            resolve();
            return;
          }
           if (file.size > 4 * 1024 * 1024) { // Limit file size, e.g., 4MB
            toast({ title: "File Too Large", description: `Skipping ${file.name} as it exceeds the 4MB limit.`, variant: "destructive" });
            resolve();
            return;
          }
          const reader = new FileReader();
          reader.onload = (e) => {
            const dataUrl = e.target?.result as string;
            newImageDataUris.push(dataUrl);
            resolve();
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      });

      Promise.all(filePromises).then(() => {
        setImageDataUris(prev => [...prev, ...newImageDataUris]);
        if(newImageDataUris.length > 0) {
          toast({ title: "Images Selected", description: `Added ${newImageDataUris.length} new image(s) for context.` });
        }
      }).catch(error => {
        console.error("Error reading files:", error);
        toast({ title: "Error Reading Files", description: "There was a problem adding one or more images.", variant: "destructive" });
      });

       if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setImageDataUris(prev => prev.filter((_, index) => index !== indexToRemove));
    toast({ title: "Image Removed", description: "The image context has been removed." });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goal.trim()) {
      toast({ title: "Goal Required", description: "Please describe what you want to create.", variant: "destructive" });
      return;
    }
    const params = new URLSearchParams();
    params.set('goal', goal);

    if (imageDataUris.length > 0) {
      try {
        sessionStorage.setItem('imageDataUris', JSON.stringify(imageDataUris));
        params.set('image', 'true');
      } catch (error) {
         let description = "The selected images are too large to process. Please try smaller files.";
         if (error instanceof DOMException && error.name === 'QuotaExceededError') {
             description = "Cannot store images as they exceed browser storage limits. Please use smaller files.";
         }
         toast({ title: "Images Too Large", description, variant: "destructive" });
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
      "relative w-full rounded-lg transition-all duration-300",
      isFocused 
        ? "ring-2 ring-primary shadow-lg shadow-primary/20" 
        : "ring-0 shadow-none"
    )}>
      {imageDataUris.length > 0 && (
        <div className="absolute top-3 left-3 z-10 max-w-[calc(100%-150px)]">
           <div className="flex gap-2 overflow-x-auto pb-2">
            {imageDataUris.map((uri, index) => (
              <div key={index} className="relative flex-shrink-0">
                <img src={uri} alt={`Image preview ${index + 1}`} className="h-16 w-16 object-cover rounded-lg border-2 border-primary/50" data-ai-hint="upload preview"/>
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  onClick={() => handleRemoveImage(index)}
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full shadow-md"
                  aria-label={`Remove image ${index + 1}`}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
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
          placeholder="Ask Briefly"
          className={cn(
            "w-full min-h-[72px] max-h-[300px] text-lg p-4 pr-36 rounded-lg bg-muted/50 border-transparent focus-visible:ring-0 resize-none overflow-y-auto",
            imageDataUris.length > 0 ? "pt-24" : "pt-4"
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
            aria-label="Upload Images"
          >
            <ImageIcon className="h-5 w-5" />
          </Button>
          <Input id="image-upload-dashboard" type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" multiple />
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
