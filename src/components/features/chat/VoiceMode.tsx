
"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Mic, MicOff, PhoneOff, AlertTriangle, LoaderCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { type Message } from '@/types/ai';
import { textToSpeech } from '@/ai/flows/text-to-speech-flow';
import { conversationalChat } from '@/ai/flows/conversational-chat-flow';
import { createChatSession } from '@/services/chatService';

interface VoiceModeProps {
  onClose: () => void;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  chatId?: string;
}

enum VoiceState {
  Idle,
  Listening,
  Processing,
  Speaking
}

export default function VoiceMode({ onClose, messages, setMessages, chatId: initialChatId }: VoiceModeProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [voiceState, setVoiceState] = useState<VoiceState>(VoiceState.Idle);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isMounted = useRef(true);
  const currentChatIdRef = useRef(initialChatId);

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
      startListening();
      return;
    }
    
    if (!user) {
        setError("You must be logged in to use voice mode.");
        return;
    }

    setVoiceState(VoiceState.Processing);
    
    const userMessage: Message = { role: 'user', content: transcript };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);

    try {
      let chatIdToUse = currentChatIdRef.current;
      const isNewChat = !chatIdToUse;
      
      if (isNewChat) {
          const newSession = await createChatSession({
              userId: user.uid,
              firstUserMessage: userMessage,
          });
          chatIdToUse = newSession.id;
          currentChatIdRef.current = chatIdToUse; // Persist the new ID for this session
          router.push(`/chat/${chatIdToUse}`);
      }
      
      const aiResponseText = await conversationalChat({
        history: newMessages,
        userId: user.uid,
        chatId: chatIdToUse!,
        isExistingChat: !isNewChat,
      });
      
      if (!isMounted.current) return;

      const aiMessage: Message = { role: 'model', content: aiResponseText };
      setMessages(prev => [...prev, aiMessage]);
      
      setVoiceState(VoiceState.Speaking);
      const { audioDataUri } = await textToSpeech({ text: aiResponseText });
      
      if (!isMounted.current) return;

      if (audioRef.current) {
        audioRef.current.src = audioDataUri;
        await audioRef.current.play();
      } else {
        startListening();
      }

    } catch (err: any) {
      if (!isMounted.current) return;
      console.error("Voice mode error:", err);
      setError(err.message || "An unknown error occurred.");
      setVoiceState(VoiceState.Idle);
    }
  }, [messages, setMessages, user, startListening, router]);

  useEffect(() => {
    isMounted.current = true;
    
    if (typeof window !== 'undefined') {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
          setError("Speech recognition is not supported in your browser.");
          return;
        }
        
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;

        recognitionRef.current.onresult = (event: any) => {
          const transcript = event.results[event.results.length - 1][0].transcript.trim();
          processAndRespond(transcript);
        };
        
        recognitionRef.current.onend = () => {
          if (isMounted.current && voiceState === VoiceState.Listening) {
            // This ensures listening continues unless we are processing or speaking
            startListening();
          }
        };

        recognitionRef.current.onerror = (event: any) => {
            if (event.error === 'no-speech' || event.error === 'audio-capture') {
                setVoiceState(VoiceState.Idle);
            } else {
                console.error('Speech recognition error:', event.error);
                setError(`Speech recognition error: ${event.error}`);
            }
        };

        audioRef.current = new Audio();
        audioRef.current.onended = () => {
          setVoiceState(VoiceState.Idle);
        };
        
        // When user speaks while AI is talking
        recognitionRef.current.onaudiostart = () => {
            if (voiceState === VoiceState.Speaking) {
                stopAudioPlayback();
            }
        };

        startListening();
    }

    return () => {
      isMounted.current = false;
      stopListening();
      stopAudioPlayback();
      if (audioRef.current) {
        audioRef.current.onended = null;
      }
      if(recognitionRef.current) {
        recognitionRef.current.onaudiostart = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  useEffect(() => {
    // If we're idle, not muted, and component is mounted, start listening
    if (voiceState === VoiceState.Idle && !isMuted && isMounted.current) {
        startListening();
    }
  }, [voiceState, isMuted, startListening]);

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
            <Button onClick={onClose}>Close</Button>
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
          onClick={onClose}
        >
          <PhoneOff className="h-8 w-8" />
        </Button>
      </div>
      <audio ref={audioRef} className="hidden" />
    </div>
  );
}
