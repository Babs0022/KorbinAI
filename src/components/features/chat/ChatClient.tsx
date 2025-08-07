
"use client";

import { useState, useRef, useEffect, forwardRef, memo, useCallback } from "react";
import { useForm, FormProvider, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter, useParams } from "next/navigation";
import { LoaderCircle, ImagePlus, X, Info, Bot, ChevronDown, CircleStop, ArrowUp } from "lucide-react";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import { type Message } from "@/types/ai";
import { type ChatSession } from "@/types/chat";
import { createChatSession, getChatSession, updateChatSession } from "@/services/chatService";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import MarkdownRenderer from "@/components/shared/MarkdownRenderer";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import LogoSpinner from "@/components/shared/LogoSpinner";
import ChatMessageActions from "./ChatMessageActions";

const formSchema = z.object({
  message: z.string(),
});

type FormValues = z.infer<typeof formSchema>;

interface ChatInputFormProps {
  onSubmit: (values: FormValues, media?: string[]) => void;
  isLoading: boolean;
}

const ChatInputForm = memo(forwardRef<HTMLFormElement, ChatInputFormProps>(({ onSubmit, isLoading }, ref) => {
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
                            <div/>
                            <div className="flex items-center gap-2">
                                <Button type="button" variant="ghost" size="icon" className="rounded-lg" onClick={() => fileInputRef.current?.click()} disabled={isLoading}><ImagePlus className="h-5 w-5 text-muted-foreground" /><span className="sr-only">Upload media</span></Button>
                                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" multiple accept="image/*,video/mp4,video/quicktime,application/pdf,text/plain,.csv,.json,.xml" />
                                <Button type="submit" size="sm" className="rounded-lg" disabled={!messageValue?.trim() && mediaPreviews.length === 0}>
                                    {isLoading ? <CircleStop className="h-5 w-5" /> : <ArrowUp className="h-5 w-5" />}
                                    <span className="sr-only">{isLoading ? 'Stop' : 'Send'}</span>
                                </Button>
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

  const getAiResponse = useCallback(async (currentChatId: string, historyForAI: Message[]) => {
    if (!user) return;

    setIsLoading(true);

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
            const errorData = await response.json();
            throw new Error(errorData.error || 'The API returned an error.');
        }

        const data = await response.json();
        const responseText = data.response;
        
        setMessages(prev => [...prev, { role: 'model', content: responseText }]);
        await updateChatSession(currentChatId, [...historyForAI, { role: 'model', content: responseText }]);

    } catch (error: any) {
        console.error("Request failed:", error);
        const errorMessage: Message = { role: 'model', content: `Sorry, an error occurred: ${error.message}` };
        const finalHistory = [...historyForAI, errorMessage];
        setMessages(finalHistory);
        await updateChatSession(currentChatId, finalHistory);
    } finally {
        setIsLoading(false);
    }
  }, [user, chatId]);

  const handleSendMessage = useCallback(async (values: FormValues, media?: string[]) => {
    if (!user || isSubmittingRef.current) return;

    isSubmittingRef.current = true;
    try {
      const userMessage: Message = { role: "user", content: values.message, mediaUrls: media };
      
      const historyForAI = [...messages, userMessage];
      setMessages(historyForAI); // Update UI immediately with user message
      
      const aiPlaceholder: Message = { role: "model", content: "" };
      setMessages(prev => [...prev, aiPlaceholder]); // Add placeholder for AI response

      let currentChatId = chatId;

      if (!currentChatId) {
        const newSession = await createChatSession({
          userId: user.uid,
          firstUserMessage: userMessage,
        });
        router.push(`/chat/${newSession.id}`);
        currentChatId = newSession.id;
      }
      
      await getAiResponse(currentChatId, historyForAI);
      
    } catch (error) {
      console.error("Error handling message sending:", error);
      // Revert UI to show only the user message if AI call fails immediately
      setMessages(messages.slice(0, -1));
    } finally {
      isSubmittingRef.current = false;
    }
  }, [user, chatId, messages, router, getAiResponse]);
  
  const handleRegenerate = (messageIndex: number) => {
    if (!chatId || messageIndex === 0) return;
    const previousMessages = messages.slice(0, messageIndex - 1); // Exclude the message to be regenerated
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
                <div ref={messagesEndRef} />
            </div>
        );
    }
    return null; // Don't render anything if there are no messages
  };
  
  // New layout for the initial "hello" screen
  if (!chatId && messages.length === 0 && !isPageLoading) {
    return (
        <div className="flex flex-col h-full items-center justify-center text-center p-4">
            <div className="w-full max-w-4xl">
                <div className="mb-4">
                    <h1 className="text-3xl sm:text-4xl font-bold break-words text-primary">Hello, {user?.displayName?.split(' ')[0] || 'friend'}!</h1>
                    <p className="text-lg sm:text-xl text-muted-foreground">What shall we create today?</p>
                </div>
               <ChatInputForm 
                  onSubmit={handleSendMessage} 
                  isLoading={isLoading} 
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
       />
    </div>
  );
}
