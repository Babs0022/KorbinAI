
"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, PhoneOff, AlertTriangle } from 'lucide-react';
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
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const startListening = useCallback(() => {
    if (isMuted || !recognitionRef.current) return;
    setVoiceState(VoiceState.Listening);
    recognitionRef.current.start();
  }, [isMuted]);
  
  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;
    recognitionRef.current.stop();
    setVoiceState(VoiceState.Processing);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Speech recognition is not supported in your browser.");
      return;
    }
    
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;

    recognitionRef.current.onresult = (event: any) => {
      if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
      
      let interimTranscript = '';
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      if (finalTranscript.trim()) {
        stopListening();
        handleUserSpeech(finalTranscript.trim());
      }

      // Reset silence timeout
      silenceTimeoutRef.current = setTimeout(() => {
        stopListening();
      }, 1500); // Stop listening after 1.5s of silence
    };

    recognitionRef.current.onend = () => {
      if (voiceState === VoiceState.Listening) {
        // If it ended unexpectedly while it should be listening, restart it.
        startListening();
      }
    };
    
    // Start listening as soon as the component mounts
    startListening();

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUserSpeech = async (transcript: string) => {
    if (!transcript) {
      setVoiceState(VoiceState.Idle);
      startListening();
      return;
    }

    const userMessage: Message = { role: 'user', content: transcript };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);

    try {
      const aiResponseText = await conversationalChat({ history: newMessages, userId: user?.uid });
      const aiMessage: Message = { role: 'model', content: aiResponseText };
      setMessages(prev => [...prev, aiMessage]);

      // Convert AI text to speech and play it
      setVoiceState(VoiceState.Speaking);
      const { audioDataUri } = await textToSpeech({ text: aiResponseText });
      
      if (audioRef.current) {
          audioRef.current.src = audioDataUri;
          audioRef.current.play();
          audioRef.current.onended = () => {
              setVoiceState(VoiceState.Idle);
              startListening();
          };
      }

    } catch (err: any) {
      console.error("Voice mode error:", err);
      setError(err.message || "An unknown error occurred.");
      setVoiceState(VoiceState.Idle);
    }
  };
  
  const toggleMute = () => {
      setIsMuted(prev => {
          const newMutedState = !prev;
          if (newMutedState) {
              if (recognitionRef.current) recognitionRef.current.stop();
              setVoiceState(VoiceState.Idle);
          } else {
              startListening();
          }
          return newMutedState;
      });
  };

  const renderVisualizer = () => {
      const bars = Array.from({ length: 60 });
      const baseClasses = "w-1 transition-all duration-300 ease-in-out rounded-full";
      let barClasses = "";
      
      switch (voiceState) {
        case VoiceState.Listening:
          barClasses = "bg-green-500 animate-pulse";
          break;
        case VoiceState.Processing:
          barClasses = "bg-yellow-500 animate-pulse";
          break;
        case VoiceState.Speaking:
          barClasses = "bg-blue-500 animate-pulse";
          break;
        case VoiceState.Idle:
        default:
          barClasses = "bg-muted";
          break;
      }
      
      return (
        <div className="flex items-center justify-center gap-1 h-32">
            {bars.map((_, i) => (
                <div
                    key={i}
                    className={cn(baseClasses, barClasses)}
                    style={{
                        height: `${Math.sin(i * 0.2 + Date.now() * 0.005) * 40 + 60}%`,
                        animationDelay: `${i * 10}ms`
                    }}
                />
            ))}
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
            <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col items-center justify-between p-8">
      <div className="flex-grow flex items-center justify-center w-full">
        {renderVisualizer()}
      </div>

      <div className="flex-shrink-0 flex items-center gap-8">
        <Button
          variant="secondary"
          size="lg"
          className="rounded-full w-20 h-20"
          onClick={toggleMute}
        >
          {isMuted ? <MicOff className="h-8 w-8" /> : <Mic className="h-8 w-8" />}
        </Button>
        <Button
          variant="destructive"
          size="lg"
          className="rounded-full w-20 h-20"
          onClick={onClose}
        >
          <PhoneOff className="h-8 w-8" />
        </Button>
      </div>
      <audio ref={audioRef} className="hidden" />
    </div>
  );
}
