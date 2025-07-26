
"use client";

import { useState, useRef, useEffect, forwardRef, memo, useCallback } from "react";
import { useForm, FormProvider, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter, useParams } from "next/navigation";
import { LoaderCircle, ImagePlus, X, ArrowUp, Square, Sparkles, Info } from "lucide-react";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import { type Message } from "@/types/ai";
import { type ChatSession } from "@/types/chat";
import { createChatSession, getChatSession, updateChatSession, updateChatSessionMetadata } from "@/services/chatService";
import { conversationalChat } from "@/ai/flows/conversational-chat-flow";
import { generateTitleForChat } from '@/ai/actions/generate-chat-title-action';
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import MarkdownRenderer from "@/components/shared/MarkdownRenderer";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import LogoSpinner from "@/components/shared/LogoSpinner";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import ChatMessageActions from "./ChatMessageActions";

const formSchema = z.object({
  message: z.string(),
});

type FormValues = z.infer<typeof formSchema>;

interface ChatInputFormProps {
  onSubmit: (values: FormValues, media?: string[]) => void;
  isLoading: boolean;
  onInterrupt: () => void;
  onSuggestionClick: (prompt: string) => void;
  hasMedia: boolean;
}

const promptSuggestions = [
    { title: "Write a blog post", prompt: "Write a blog post about the future of renewable energy..." },
    { title: "Summarize this article", prompt: "Can you please visit https://www.theverge.com/... and summarize it?" },
    { title: "Brainstorm marketing ideas", prompt: "Brainstorm three creative marketing slogans for a new brand of eco-friendly sneakers." },
    { title: "Multi-task: Create and explain", prompt: "Generate an image of a futuristic cityscape at night, then write a short story about it." }
];

const mediaSuggestionPrompts = [ "Describe this in detail.", "Write a social media post about this.", "What is the main subject of this file?", "Generate a witty caption for this picture." ];

const ChatInputForm = memo(forwardRef<HTMLFormElement, ChatInputFormProps>(({ onSubmit, isLoading, onInterrupt, onSuggestionClick, hasMedia }, ref) => {
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [mediaPreviews, setMediaPreviews] = useState<{type: 'image' | 'video' | 'other', url: string, name: string}[]>([]);
    
    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: { message: "" },
    });

    const messageValue = useWatch({ control: form.control, name: 'message' });
    const isButtonDisabled = isLoading || (!messageValue?.trim() && mediaPreviews.length === 0);

    const handleFormSubmit = (values: FormValues) => {
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
        if (event.key === 'Enter' && !event.shiftKey && !isButtonDisabled) {
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

    return (
        <div className="flex-shrink-0 bg-gradient-to-t from-background via-background/80 to-transparent pt-4 pb-4">
            <div className="mx-auto w-full max-w-4xl px-4">
                 {hasMedia && (
                    <div className="mb-4">
                        <div className="flex items-center gap-2 mb-2">
                             <Sparkles className="h-4 w-4 text-primary" />
                             <h4 className="text-sm font-semibold text-muted-foreground">What do you want to do with this file?</h4>
                        </div>
                        <div className="flex flex-wrap gap-2">{mediaSuggestionPrompts.map(p => <Button key={p} variant="secondary" size="sm" onClick={() => onSuggestionClick(p)}>{p}</Button>)}</div>
                    </div>
                 )}
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
                            <FormItem><FormControl><Textarea placeholder={"Ask Briefly anything..."} className="text-lg min-h-[90px] bg-secondary border-0 focus-visible:ring-0 resize-none placeholder:text-lg" autoComplete="off" disabled={isLoading} onKeyDown={handleKeyDown} {...field} /></FormControl></FormItem>
                        )} />
                        <div className="flex items-center justify-between p-2">
                            <div className="flex items-center gap-2">
                                <Button type="button" variant="ghost" size="icon" className="rounded-lg" onClick={() => fileInputRef.current?.click()} disabled={isLoading}><ImagePlus className="h-5 w-5 text-muted-foreground" /><span className="sr-only">Upload media</span></Button>
                                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" multiple accept="image/*,video/mp4,video/quicktime,application/pdf,text/plain,.csv,.json,.xml" />
                            </div>
                            <Button type={isLoading ? "button" : "submit"} size="sm" className="rounded-lg" disabled={isButtonDisabled && !isLoading} onClick={isLoading ? onInterrupt : undefined}>
                                {isLoading ? <Square className="h-5 w-5" /> : <ArrowUp className="h-5 w-5" />}
                                <span className="sr-only">{isLoading ? 'Stop' : 'Send'}</span>
                            </Button>
                        </div>
                    </form>
                </FormProvider>
                <div className="flex items-center justify-center gap-2 mt-3 text-xs text-muted-foreground"><Info className="h-3.5 w-3.5" /><span>Briefly can make mistakes, do well to double check it</span></div>
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

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

  const handleInterrupt = () => {
    abortControllerRef.current?.abort();
  };

  const getAiResponse = useCallback(async (sessionId: string, historyForAI: Message[], userMessage: Message) => {
    if (!user) return;

    abortControllerRef.current = new AbortController();
    setIsLoading(true);
    let fullResponse = "";

    try {
        const aiMessage = await conversationalChat({
            history: historyForAI,
            userId: user.uid,
        });

        if (abortControllerRef.current?.signal.aborted) {
            throw new Error('AbortError');
        }
        
        const finalHistory = [...historyForAI, aiMessage];
        setMessages(finalHistory);
        await updateChatSession(sessionId, finalHistory);

        if (!chatId) {
            const newTitle = await generateTitleForChat(userMessage.content, aiMessage.content);
            await updateChatSessionMetadata(sessionId, { title: newTitle });
        }

    } catch (error: any) {
        if (error.name !== 'AbortError') {
            console.error("Streaming failed:", error);
            const finalHistory = [...historyForAI, { role: 'model', content: `Sorry, an error occurred: ${error.message}` }];
            setMessages(finalHistory);
            await updateChatSession(sessionId, finalHistory);
        }
    } finally {
        setIsLoading(false);
        abortControllerRef.current = null;
    }
  }, [user, chatId]);

  const handleSendMessage = useCallback(async (values: FormValues, media?: string[]) => {
    if (!user) return;
    const userMessage: Message = { role: "user", content: values.message, mediaUrls: media };
    
    const aiPlaceholder: Message = { role: "model", content: "" };
    const historyForAI = [...messages, userMessage];
    setMessages([...historyForAI, aiPlaceholder]);

    if (!chatId) {
      try {
        const newSession = await createChatSession({
          userId: user.uid,
          firstUserMessage: userMessage,
        });
        router.push(`/chat/${newSession.id}`);
        getAiResponse(newSession.id, historyForAI, userMessage);

      } catch (error) {
        console.error("Failed to create new chat session:", error);
        setMessages(messages); 
      }
    } else {
      getAiResponse(chatId, historyForAI, userMessage);
    }
  }, [user, chatId, messages, router, getAiResponse]);
  
  const handlePromptSuggestionClick = (prompt: string) => handleSendMessage({ message: prompt });
  
  const handleRegenerate = (messageIndex: number) => {
    if (!chatId || messageIndex === 0) return;
    const userMessage = messages[messageIndex - 1];
    if (userMessage?.role === 'user') {
      const historyForAI = messages.slice(0, messageIndex - 1);
      const newMessages = [...historyForAI, userMessage, { role: 'model', content: '' }];
      setMessages(newMessages);
      getAiResponse(chatId, newMessages, userMessage);
    }
  };
  
  const renderContent = () => {
    if (isPageLoading) return <div className="flex flex-grow flex-col items-center justify-center"><LoaderCircle className="h-8 w-8 animate-spin text-primary" /></div>;
    if (messages.length === 0) {
      return (
        <div className="flex-grow flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-4xl mx-auto space-y-12">
                <div className="text-center space-y-4 max-w-full"><h1 className="text-3xl sm:text-4xl font-bold break-words">Hello, {user?.displayName?.split(' ')[0] || 'friend'}.</h1><p className="text-lg sm:text-xl text-muted-foreground">What shall we create today?</p></div>
                <div className="space-y-4">{promptSuggestions.map((p, i) => <Card key={i} className="cursor-pointer hover:border-primary transition-colors" onClick={() => handlePromptSuggestionClick(p.prompt)}><CardHeader><CardTitle className="text-base">{p.title}</CardTitle></CardHeader></Card>)}</div>
            </div>
        </div>
      );
    }
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
                  {isLoading && message.role === 'model' && !message.content && !message.mediaUrls ? (
                      <LogoSpinner />
                  ) : message.content ? (
                      <MarkdownRenderer mediaUrls={message.mediaUrls}>{message.content}</MarkdownRenderer>
                  ) : null}

                  {message.role === 'model' && (message.content || message.mediaUrls) && (
                      <ChatMessageActions
                        message={message}
                        onRegenerate={() => handleRegenerate(index)}
                        projectId={chatId}
                      />
                  )}
              </div>
              </div>
          ))}
          <div ref={messagesEndRef} />
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen max-h-screen">
      <div className="flex-grow overflow-y-auto pt-6 pb-24">
        {renderContent()}
      </div>
       <ChatInputForm onSubmit={handleSendMessage} isLoading={isLoading} onInterrupt={handleInterrupt} onSuggestionClick={handlePromptSuggestionClick} hasMedia={messages.some(m => !!m.mediaUrls && m.mediaUrls.length > 0)} />
    </div>
  );
}
