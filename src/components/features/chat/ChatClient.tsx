
"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SendHorizonal, Bot, User, BrainCircuit, LoaderCircle } from 'lucide-react';
import MarkdownRenderer from '@/components/shared/MarkdownRenderer';
import { conversationalChat } from '@/ai/flows/conversational-chat-flow';
import { type ChatMessage } from '@/types/chat';
import NextImage from 'next/image';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { saveChatConversation } from '@/services/projectService';
import type { Project } from '@/types/project';


const starterPrompts = [
    { title: "Explain a concept", prompt: "Explain quantum computing in simple terms" },
    { title: "Write some code", prompt: "Write a python script to scrape a website and save the headings to a CSV file." },
    { title: "Generate an image", prompt: "Generate an image of a cat programming on a laptop, digital art style" },
    { title: "Draft an email", prompt: "Draft a professional follow-up email to a client after a project meeting." }
];

interface ChatClientProps {
    initialChatId: string | null;
    initialMessages: ChatMessage[];
    onChatUpdated: (newProject?: Project) => void;
}


export default function ChatClient({ initialChatId, initialMessages, onChatUpdated }: ChatClientProps) {
    const { user, loading: authLoading } = useAuth();
    const { toast } = useToast();
    const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
    const [currentChatId, setCurrentChatId] = useState<string | null>(initialChatId);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
        }
    }, [messages]);
    
    // Reset the chat when the initial props change (e.g., selecting a new chat from sidebar)
    useEffect(() => {
        setMessages(initialMessages);
        setCurrentChatId(initialChatId);
    }, [initialChatId, initialMessages]);

    const handleStarterPrompt = (prompt: string) => {
        setInput(prompt);
        textareaRef.current?.focus();
    }

    const getInitials = (name?: string | null) => {
        if (!name) return "U";
        return name.split(" ").map((n) => n[0]).join("").toUpperCase();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading || !user) return;

        const userMessage: ChatMessage = { role: 'user', content: input };
        const updatedMessages = [...messages, userMessage];
        
        setMessages(updatedMessages);
        setInput('');
        setIsLoading(true);

        try {
            const assistantResponse = await conversationalChat({
                history: updatedMessages,
            });

            const finalMessages = [...updatedMessages, assistantResponse];
            setMessages(finalMessages);

            const { id, newProject } = await saveChatConversation(user.uid, finalMessages, currentChatId);
            
            if (newProject) {
                // This was a new chat, update local state and notify parent with full project
                setCurrentChatId(id);
                onChatUpdated(newProject);
            } else {
                // This was an update to an existing chat, just notify parent to refresh
                onChatUpdated();
            }

        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : "An unknown error occurred.";
            toast({ variant: "destructive", title: "Chat Error", description: errorMsg });
            setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I encountered an error. Please try again." }]);
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="h-full w-full max-w-4xl mx-auto flex flex-col">
            <div ref={scrollAreaRef} className="flex-1 overflow-y-auto space-y-6 p-4">
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <BrainCircuit className="w-16 h-16 text-primary" />
                        <h2 className="mt-4 text-3xl font-bold">BrieflyAI Chat</h2>
                        <p className="mt-2 text-muted-foreground">Your multi-talented AI co-pilot. How can I help you today?</p>
                        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
                            {starterPrompts.map(p => (
                                <button key={p.title} onClick={() => handleStarterPrompt(p.prompt)} className="text-left p-4 rounded-lg bg-secondary hover:bg-accent transition-colors">
                                    <p className="font-semibold text-foreground">{p.title}</p>
                                    <p className="text-sm text-muted-foreground">{p.prompt}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    messages.map((msg, index) => (
                         <div key={index} className={cn("flex items-start gap-4 animate-fade-in", msg.role === 'user' ? 'justify-end' : '')}>
                            {msg.role === 'assistant' && (
                                <Avatar className="w-9 h-9 border shrink-0">
                                    <AvatarFallback><Bot/></AvatarFallback>
                                </Avatar>
                            )}
                            <div className={cn("max-w-xl rounded-xl p-4", msg.role === 'assistant' ? 'bg-secondary' : 'bg-primary text-primary-foreground')}>
                                <MarkdownRenderer>{msg.content}</MarkdownRenderer>
                                {msg.imageUrl && (
                                     <div className="mt-4 relative aspect-square w-full max-w-sm overflow-hidden rounded-lg">
                                        <NextImage src={msg.imageUrl} alt="Generated image" fill sizes="300px" className="object-cover" />
                                    </div>
                                )}
                            </div>
                             {msg.role === 'user' && (
                                <Avatar className="w-9 h-9 border shrink-0">
                                    <AvatarImage src={user?.photoURL || undefined} />
                                    <AvatarFallback>{getInitials(user?.displayName)}</AvatarFallback>
                                </Avatar>
                            )}
                        </div>
                    ))
                )}
                 {isLoading && (
                    <div className="flex items-start gap-4">
                        <Avatar className="w-9 h-9 border shrink-0">
                            <AvatarFallback><Bot/></AvatarFallback>
                        </Avatar>
                        <div className="max-w-xl rounded-xl p-4 bg-secondary flex items-center">
                           <LoaderCircle className="h-5 w-5 animate-spin text-muted-foreground" />
                        </div>
                    </div>
                )}
            </div>
            
            <div className="p-4 pt-0 shrink-0">
                 <form onSubmit={handleSubmit} className="relative">
                    <Textarea 
                        ref={textareaRef}
                        placeholder="Ask BrieflyAI anything..."
                        className="min-h-[52px] pr-16 text-base"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSubmit(e as any);
                            }
                        }}
                        disabled={isLoading || !user || authLoading}
                    />
                    <Button type="submit" size="icon" className="absolute right-3 top-1/2 -translate-y-1/2" disabled={isLoading || !input.trim() || !user}>
                        <SendHorizonal />
                    </Button>
                </form>
            </div>
        </div>
    );
}
