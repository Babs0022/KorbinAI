
"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, PhoneOff, AlertTriangle, LoaderCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { type Message } from '@/types/ai';
import { textToSpeech } from '@/ai/flows/text-to-speech-flow';
import { conversationalChat } from '@/ai/flows/conversational-chat-flow';

interface VoiceModeProps {
  onClose: () => void;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
}

enum VoiceState {
  Idle,
  Listening,
  Processing,
  Speaking
}

export default function VoiceMode({ onClose, messages, setMessages }: VoiceModeProps) {
  const { user } = useAuth();
  const [voiceState, setVoiceState] = useState<VoiceState>(VoiceState.Idle);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Ref to track if the component is mounted to prevent state updates on unmounted components
  const isMounted = useRef(true);

  // --- Core Functions ---

  const stopAudioPlayback = useCallback(() => {
    if (audioRef.current) {
        audioRef.current.pause();
        if (!isNaN(audioRef.current.duration)) {
             audioRef.current.currentTime = 0;
        }
    }
  }, []);

  const startListening = useCallback(() => {
    if (isMuted || !recognitionRef.current || !isMounted.current) return;
    
    // Don't start listening if already listening or processing
    if (voiceState === VoiceState.Listening || voiceState === VoiceState.Processing) return;

    stopAudioPlayback();
    setVoiceState(VoiceState.Listening);
    
    try {
      recognitionRef.current.start();
    } catch (e) {
      console.warn("Speech recognition could not be started, likely already active.", e);
    }
  }, [isMuted, voiceState, stopAudioPlayback]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, []);

  const processAndRespond = useCallback(async (transcript: string) => {
    if (!transcript.trim() || !isMounted.current) {
      startListening(); // If transcript is empty, just go back to listening
      return;
    }

    setVoiceState(VoiceState.Processing);
    
    const userMessage: Message = { role: 'user', content: transcript };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);

    try {
      const aiResponseText = await conversationalChat({ history: newMessages, userId: user?.uid });
      
      if (!isMounted.current) return; // Check if component is still mounted

      const aiMessage: Message = { role: 'model', content: aiResponseText };
      setMessages(prev => [...prev, aiMessage]);

      setVoiceState(VoiceState.Speaking);
      const { audioDataUri } = await textToSpeech({ text: aiResponseText });
      
      if (!isMounted.current) return;

      if (audioRef.current) {
        audioRef.current.src = audioDataUri;
        await audioRef.current.play();
        // The 'onended' event on the audio element will handle transitioning back to listening
      } else {
        startListening(); // Fallback if audio element isn't ready
      }

    } catch (err: any) {
      if (!isMounted.current) return;
      console.error("Voice mode error:", err);
      setError(err.message || "An unknown error occurred.");
      setVoiceState(VoiceState.Idle);
    }
  }, [messages, setMessages, user?.uid, startListening]);


  // --- Lifecycle and Event Handlers ---

  useEffect(() => {
    isMounted.current = true;
    
    // --- Initialize Web Speech API ---
    if (typeof window !== 'undefined') {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
          setError("Speech recognition is not supported in your browser.");
          return;
        }
        
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false; // We want to process after each phrase
        recognitionRef.current.interimResults = false;

        recognitionRef.current.onresult = (event: any) => {
          const transcript = event.results[event.results.length - 1][0].transcript.trim();
          processAndRespond(transcript);
        };
        
        recognitionRef.current.onend = () => {
          if (isMounted.current && voiceState === VoiceState.Listening) {
            // If it ended while we were supposed to be listening, start again.
            // This handles cases where the browser times out the recognition.
            startListening();
          }
        };

        recognitionRef.current.onerror = (event: any) => {
            if (event.error === 'no-speech' || event.error === 'audio-capture') {
                // These are common, non-critical errors. Just restart listening.
                setVoiceState(VoiceState.Idle);
            } else {
                console.error('Speech recognition error:', event.error);
                setError(`Speech recognition error: ${event.error}`);
            }
        };

        // --- Initialize Audio Element ---
        audioRef.current = new Audio();
        audioRef.current.onended = () => {
          setVoiceState(VoiceState.Idle); // Back to idle after speaking is done
        };

        // Start listening for the first time
        startListening();
    }


    // --- Cleanup function ---
    return () => {
      isMounted.current = false;
      stopListening();
      stopAudioPlayback();
      if (audioRef.current) {
        audioRef.current.onended = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  // Effect to automatically start listening when idle
  useEffect(() => {
    if (voiceState === VoiceState.Idle && !isMuted) {
      const timer = setTimeout(() => {
        if (isMounted.current) {
           startListening();
        }
      }, 100); // Small delay to prevent rapid-fire restarts
      return () => clearTimeout(timer);
    }
  }, [voiceState, isMuted, startListening]);


  const handleClose = () => {
    onClose();
  };

  const renderVisualizer = () => {
      const bars = Array.from({ length: 60 });
      let barClasses = "bg-muted";
      let stateText = "Idle. Say something to start.";

      switch (voiceState) {
        case VoiceState.Listening:
          barClasses = "bg-green-500 animate-pulse";
          stateText = "Listening...";
          break;
        case VoiceState.Processing:
           return <div className="flex flex-col items-center gap-4"><LoaderCircle className="h-16 w-16 animate-spin text-primary" /><p className="text-muted-foreground">Korbin is thinking...</p></div>;
        case VoiceState.Speaking:
          barClasses = "bg-blue-500 animate-pulse";
          stateText = "Korbin is speaking...";
          break;
      }
      
      return (
        <div className="flex flex-col items-center justify-center gap-8 h-32">
            <div className="flex items-end justify-center gap-1 h-full">
                {bars.map((_, i) => (
                    <div
                        key={i}
                        className={cn("w-1 transition-all duration-300 ease-in-out rounded-full", barClasses)}
                        style={{
                            height: `${ voiceState !== VoiceState.Idle ? (Math.sin(i * 0.2 + Date.now() * 0.005) * 40 + 60) : 10}%`,
                            animationDelay: `${i * 10}ms`
                        }}
                    />
                ))}
            </div>
            <p className="text-muted-foreground text-sm">{stateText}</p>
        </div>
    );
  };

  if (error) {
    return (
      <div className="fixed inset-0 bg-background z-50 flex flex-col items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-md">
            <AlertTriangle className="mx-auto h-12 w-12 text-destructive" />
            <h2 className="text-2xl font-bold">Voice Mode Error</h2>
            <p className="text-muted-foreground">{error}</p>
            <Button onClick={handleClose}>Close</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex flex-col items-center justify-between p-8">
      <div className="flex-grow flex items-center justify-center w-full">
        {renderVisualizer()}
      </div>

      <div className="flex-shrink-0 flex items-center gap-8">
        <Button
          variant="secondary"
          size="lg"
          className="rounded-full w-20 h-20"
          onClick={() => setIsMuted(!isMuted)}
        >
          {isMuted ? <MicOff className="h-8 w-8" /> : <Mic className="h-8 w-8" />}
        </Button>
        <Button
          variant="destructive"
          size="lg"
          className="rounded-full w-20 h-20"
          onClick={handleClose}
        >
          <PhoneOff className="h-8 w-8" />
        </Button>
      </div>
      <audio ref={audioRef} className="hidden" />
    </div>
  );
}
