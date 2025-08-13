
"use client";

import { useState, useRef, useEffect, forwardRef, memo, useCallback } from "react";
import { useForm, FormProvider, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter, useParams } from "next/navigation";
import { LoaderCircle, Paperclip, X, Info, ArrowUp, AudioLines } from "lucide-react";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import { type Message } from "@/types/ai";
import { type ChatSession } from "@/types/chat";
import { createChatSession, getChatSession } from "@/services/chatService";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import MarkdownRenderer from "@/components/shared/MarkdownRenderer";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import LogoSpinner from "@/components/shared/LogoSpinner";
import ChatMessageActions from "./ChatMessageActions";
import VoiceMode from "./VoiceMode";
import CollapsibleSection from "./CollapsibleSection";
import { CheckCircle, Code, CornerDownRight, Cpu, Search } from "lucide-react";

const formSchema = z.object({
  message: z.string(),
});

type FormValues = z.infer<typeof formSchema>;

interface ChatInputFormProps {
  onSubmit: (values: FormValues, media?: string[]) => void;
  isLoading: boolean;
  onVoiceModeClick: () => void;
}

const ChatInputForm = memo(forwardRef<HTMLFormElement, ChatInputFormProps>(({ onSubmit, isLoading, onVoiceModeClick }, ref) => {
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [mediaPreviews, setMediaPreviews] = useState<{type: 'image' | 'video' | 'other', url: string, name: string}[]>([]);
    
    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: { message: "" },
    });

    const messageValue = useWatch({ control: form.control, name: 'message' });
    const hasContent = messageValue?.trim() || mediaPreviews.length > 0;

    const handleFormSubmit = (values: FormValues) => {
        if (isLoading) return; // Prevent submission while loading
        if (!values.message.trim() && mediaPreviews.length === 0) {
            toast({ title: "Empty message", description: "Please enter a message or upload an image.", variant: "destructive" });
            return;
        }
        onSubmit(values, mediaPreviews.map(p => p.url));
        form.reset();
        setMediaPreviews([]);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.key === 'Enter' && !event.shiftKey && hasContent) {
            event.preventDefault();
            form.handleSubmit(handleFormSubmit)();
        }
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (files) {
            const newPreviews = Array.from(files).map(file => {
                if (file.size > 25 * 1024 * 1024) {
                    toast({ title: "File too large", description: `${file.name} is over 25MB.`, variant: "destructive" });
                    return null;
                }
                const fileType = file.type.startsWith('video') ? 'video' : (file.type.startsWith('image') ? 'image' : 'other');
                return new Promise<{type: 'image' | 'video' | 'other', url: string, name: string}>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve({ type: fileType, url: reader.result as string, name: file.name });
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                });
            }).filter(p => p !== null);
            
            Promise.all(newPreviews).then(results => {
                setMediaPreviews(prev => [...prev, ...results.filter(r => r !== null) as any]);
            });
        }
    };
    
    const removeMedia = (index: number) => setMediaPreviews(p => p.filter((_, i) => i !== index));

    const ActionButton = () => {
      if (isLoading) {
        return (
          <Button size="sm" className="rounded-lg" disabled>
            <LoaderCircle className="h-5 w-5 animate-spin" />
            <span className="sr-only">Sending</span>
          </Button>
        );
      }

      if (hasContent) {
        return (
          <Button type="submit" size="sm" className="rounded-lg">
            <ArrowUp className="h-5 w-5" />
            <span className="sr-only">Send</span>
          </Button>
        );
      }

      return (
        <Button type="button" variant="outline" size="icon" className="rounded-lg" onClick={onVoiceModeClick}>
          <AudioLines className="h-5 w-5 text-muted-foreground" />
          <span className="sr-only">Activate Voice Mode</span>
        </Button>
      );
    };

    return (
        <div className="flex-shrink-0 bg-gradient-to-t from-background via-background/80 to-transparent pt-4 pb-4">
            <div className="mx-auto w-full max-w-4xl px-4">
                <FormProvider {...form}>
                    <form ref={ref} onSubmit={form.handleSubmit(handleFormSubmit)} className="rounded-xl border bg-secondary">
                        {mediaPreviews.length > 0 && (
                            <div className="p-2 pt-2 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                                {mediaPreviews.map((preview, index) => (
                                    <div key={index} className="relative aspect-square">
                                        {preview.type === 'image' ? <Image src={preview.url} alt={`Preview ${index}`} fill sizes="90px" className="rounded-lg object-cover" /> : <div className="w-full h-full bg-muted rounded-lg flex items-center justify-center text-center p-1 text-xs text-muted-foreground">{preview.name}</div>}
                                        <Button type="button" variant="destructive" size="icon" className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2 rounded-full h-5 w-5" onClick={() => removeMedia(index)}><X className="h-3 w-3" /></Button>
                                    </div>
                                ))}
                            </div>
                        )}
                        <FormField control={form.control} name="message" render={({ field }) => (
                            <FormItem><FormControl><Textarea placeholder={"Ask Korbin anything..."} className="text-lg min-h-[90px] bg-secondary border-0 focus-visible:ring-0 resize-none placeholder:text-lg" autoComplete="off" disabled={isLoading} onKeyDown={handleKeyDown} {...field} /></FormControl></FormItem>
                        )} />
                        <div className="flex items-center justify-between p-2">
                            <div className="flex items-center gap-2">
                                <Button type="button" variant="ghost" size="icon" className="rounded-lg" onClick={() => fileInputRef.current?.click()} disabled={isLoading}><Paperclip className="h-5 w-5 text-muted-foreground" /><span className="sr-only">Upload media</span></Button>
                                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" multiple accept="image/*,video/mp4,video/quicktime,application/pdf,text/plain,.csv,.json,.xml" />
                            </div>
                            <div className="flex items-center gap-2">
                                <ActionButton />
                            </div>
                        </div>
                    </form>
                </FormProvider>
                <div className="flex items-center justify-center gap-2 mt-3 text-xs text-muted-foreground"><Info className="h-3.5 w-3.5" /><span>Korbin can make mistakes, do well to double check it</span></div>
            </div>
        </div>
    );
}));
ChatInputForm.displayName = "ChatInputForm";

export default function ChatClient() {
  const params = useParams();
  const chatId = params.chatId as string | undefined;
  const { user } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(!!chatId);
  const [isVoiceModeActive, setIsVoiceModeActive] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isSubmittingRef = useRef(false);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  useEffect(() => {
    async function loadChat() {
      if (!user || !chatId) {
        setMessages([]);
        setIsPageLoading(false);
        return;
      }
      setIsPageLoading(true);
      try {
        const session = await getChatSession(chatId);
        if (session) {
          setMessages(session.messages);
        } else {
          router.replace('/');
        }
      } catch (error) {
        console.error("Error loading chat session:", error);
        router.replace('/');
      }
      setIsPageLoading(false);
    }
    loadChat();
  }, [chatId, user, router]);

  const [thinkingSteps, setThinkingSteps] = useState<any[]>([]);
  const [sources, setSources] = useState<any[]>([]);

  const getAiResponse = useCallback(async (currentChatId: string, historyForAI: Message[]) => {
    if (!user) return null;

    setIsLoading(true);
    setThinkingSteps([]);
    setSources([]);

    // Optimistically add the AI message placeholder
    const aiMessagePlaceholder: Message = { role: 'model', content: '' };
    setMessages(prev => [...prev, aiMessagePlaceholder]);

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                history: historyForAI,
                userId: user.uid,
                chatId: currentChatId,
                isExistingChat: !!chatId,
            }),
        });

        if (!response.ok) {
            throw new Error(`API returned an error: ${response.statusText}`);
        }

        if (!response.body) {
            throw new Error('The response body is empty.');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || ''; // Keep the last, possibly incomplete line

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const jsonString = line.substring(6);
                    if (jsonString.trim()) {
                        try {
                            const part = JSON.parse(jsonString);

                            switch (part.type) {
                                case 'thinking_start':
                                    setThinkingSteps(prev => [...prev, {type: 'start'}]);
                                    break;
                                case 'tool_code':
                                    setThinkingSteps(prev => [...prev, {type: 'tool_code', payload: part.payload}]);
                                    break;
                                case 'tool_output':
                                    setThinkingSteps(prev => [...prev, {type: 'tool_output', payload: part.payload}]);
                                    break;
                                case 'thinking_end':
                                    setThinkingSteps(prev => [...prev, {type: 'end'}]);
                                    break;
                                case 'answer_chunk':
                                    setMessages(prev => {
                                        const newMessages = [...prev];
                                        const lastMessage = newMessages[newMessages.length - 1];
                                        if (lastMessage && lastMessage.role === 'model') {
                                            lastMessage.content += part.payload;
                                        }
                                        return newMessages;
                                    });
                                    break;
                                case 'sources':
                                    setSources(part.payload);
                                    break;
                                case 'error':
                                    throw new Error(part.payload.message);
                            }
                        } catch (e) {
                            console.error("Failed to parse stream part:", jsonString, e);
                        }
                    }
                }
            }
        }
    } catch (error: any) {
        console.error("Streaming request failed:", error);
        setMessages(prev => {
            const newMessages = [...prev];
            const lastMessage = newMessages[newMessages.length - 1];
            if (lastMessage && lastMessage.role === 'model' && lastMessage.content === '') {
                lastMessage.content = `Sorry, an error occurred: ${error.message}`;
            }
            return newMessages;
        });
    } finally {
        setIsLoading(false);
    }
    // The final history is now managed by the streaming updates, so we don't return it here.
    return null;
  }, [user, chatId]);

  const handleSendMessage = useCallback(async (values: FormValues, media?: string[]) => {
    if (!user || isSubmittingRef.current) return;

    isSubmittingRef.current = true;
    
    let currentChatId = chatId;
    
    const userMessage: Message = { role: "user", content: values.message, mediaUrls: media };
    const historyForAI = [...messages, userMessage];
    setMessages(historyForAI);
    
    const aiPlaceholder: Message = { role: "model", content: "" };
    setMessages(prev => [...prev, aiPlaceholder]);

    try {
      const isNewChat = !currentChatId;
      let finalHistory: Message[] | null = null;

      if (isNewChat) {
        const newSession = await createChatSession({
          userId: user.uid,
          firstUserMessage: userMessage,
        });
        currentChatId = newSession.id;
        finalHistory = await getAiResponse(currentChatId!, historyForAI);
      } else {
        finalHistory = await getAiResponse(currentChatId!, historyForAI);
      }

      if (isNewChat && finalHistory) {
        router.push(`/chat/${currentChatId}`);
      }
      
    } catch (error) {
      console.error("Error handling message sending:", error);
      setMessages(messages.slice(0, -1));
    } finally {
      isSubmittingRef.current = false;
    }
  }, [user, chatId, messages, router, getAiResponse]);
  
  const handleRegenerate = (messageIndex: number) => {
    if (!chatId || messageIndex === 0) return;
    const previousMessages = messages.slice(0, messageIndex - 1);
    const aiPlaceholder: Message = { role: "model", content: "" };
    setMessages([...previousMessages, aiPlaceholder]);
    getAiResponse(chatId, previousMessages);
  };
  
  const renderContent = () => {
    if (isPageLoading) return <div className="flex flex-grow flex-col items-center justify-center"><LoaderCircle className="h-8 w-8 animate-spin text-primary" /></div>;
    if (messages.length > 0) {
        return (
            <div className="w-full max-w-4xl mx-auto space-y-8 px-4">
                {messages.map((message, index) => (
                    <div
                    key={index}
                    className={cn(
                        "flex items-start gap-4 w-full",
                        message.role === "user" ? "justify-end" : "justify-start"
                    )}
                    >
                    <div
                        className={cn(
                            "max-w-xl",
                            message.role === "user" ? "shadow-md bg-secondary text-foreground rounded-xl p-3" : ""
                        )}
                    >
                        {message.mediaUrls && message.mediaUrls.length > 0 && message.role === 'user' && (
                            <div className="grid grid-cols-2 gap-2 mb-2">
                                {message.mediaUrls.map((url, i) => (
                                    <div key={i} className="relative aspect-square">
                                        {url.startsWith('data:video') ? (
                                            <video src={url} className="rounded-lg object-cover w-full h-full" controls />
                                        ) : (
                                            <Image src={url} alt={`User upload ${i + 1}`} fill sizes="150px" className="rounded-lg object-cover" />
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                        {isLoading && message.role === 'model' && index === messages.length - 1 && !message.content ? (
                            <LogoSpinner />
                        ) : message.content ? (
                            <MarkdownRenderer mediaUrls={message.role === 'model' ? message.mediaUrls : undefined}>{message.content}</MarkdownRenderer>
                        ) : null}

                        {message.role === 'model' && (message.content || message.mediaUrls) && (!isLoading || index < messages.length - 1) && (
                            <ChatMessageActions
                                message={message}
                                onRegenerate={() => handleRegenerate(index)}
                                projectId={chatId}
                            />
                        )}
                    </div>
                    </div>
                ))}

                {thinkingSteps.length > 0 && (
                    <div className="w-full max-w-xl mx-auto">
                        <CollapsibleSection title="Thinking">
                            <div className="space-y-2 text-sm">
                                {thinkingSteps.map((step, index) => {
                                    if (step.type === 'start') return <div key={index} className="flex items-center gap-2 text-muted-foreground"><Cpu className="h-4 w-4" /><span>Starting thought process...</span></div>;
                                    if (step.type === 'end') return <div key={index} className="flex items-center gap-2 text-green-500"><CheckCircle className="h-4 w-4" /><span>Finished thinking.</span></div>;
                                    if (step.type === 'tool_code') return (
                                        <div key={index} className="flex items-start gap-2">
                                            <Search className="h-4 w-4 mt-1 text-muted-foreground" />
                                            <div>
                                                <span className="font-semibold">{step.payload.toolName}</span>
                                                <pre className="text-xs bg-muted p-2 rounded-md mt-1">{JSON.stringify(step.payload.args, null, 2)}</pre>
                                            </div>
                                        </div>
                                    );
                                    if (step.type === 'tool_output') return (
                                        <div key={index} className="flex items-start gap-2">
                                            <CornerDownRight className="h-4 w-4 mt-1 text-muted-foreground" />
                                            <div className="w-full">
                                                <span className="text-muted-foreground">Tool Output:</span>
                                                <pre className="text-xs bg-muted p-2 rounded-md mt-1 overflow-x-auto">{JSON.stringify(step.payload, null, 2)}</pre>
                                            </div>
                                        </div>
                                    );
                                    return null;
                                })}
                            </div>
                        </CollapsibleSection>
                    </div>
                )}

                {sources.length > 0 && (
                    <div className="w-full max-w-xl mx-auto mt-4">
                        <CollapsibleSection title="Sources">
                            <div className="space-y-2">
                                {sources.map((source, index) => (
                                    <a key={index} href={source.url} target="_blank" rel="noopener noreferrer" className="block p-2 border rounded-md hover:bg-secondary text-sm">
                                        <p className="font-semibold truncate">{source.title}</p>
                                        <p className="text-xs text-muted-foreground">{source.url}</p>
                                    </a>
                                ))}
                            </div>
                        </CollapsibleSection>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>
        );
    }
    return null; // Don't render anything if there are no messages
  };
  
  if (isVoiceModeActive) {
    return (
        <VoiceMode
            onClose={() => setIsVoiceModeActive(false)}
            messages={messages}
            setMessages={setMessages}
            chatId={chatId}
        />
    )
  }

  // New layout for the initial "hello" screen
  if (!chatId && messages.length === 0 && !isPageLoading) {
    return (
        <div className="flex flex-col h-full items-center justify-center text-center p-4">
            <div className="w-full max-w-4xl">
                <div className="mb-8 space-y-2">
                    <h1 className="text-4xl sm:text-5xl font-bold break-words text-primary">
                        What's good, {user?.displayName?.split(' ')[0] || 'friend'}?
                    </h1>
                </div>
               <ChatInputForm 
                  onSubmit={handleSendMessage} 
                  isLoading={isLoading} 
                  onVoiceModeClick={() => setIsVoiceModeActive(true)}
               />
            </div>
        </div>
    );
  }

  // Standard chat layout
  return (
    <div className="flex flex-col h-screen max-h-screen">
      <div className="flex-grow overflow-y-auto flex flex-col pt-6 pb-24">
        {renderContent()}
      </div>
       <ChatInputForm 
          onSubmit={handleSendMessage} 
          isLoading={isLoading} 
          onVoiceModeClick={() => setIsVoiceModeActive(true)}
       />
    </div>
  );
}
