
"use client";

import { useState, useRef, useEffect, forwardRef, memo, useCallback } from "react";
import { useForm, FormProvider, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter, useParams } from "next/navigation";
import { LoaderCircle, ImagePlus, X, ArrowUp, Square, Sparkles } from "lucide-react";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import { conversationalChat } from "@/ai/flows/conversational-chat-flow";
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
import { Card, CardHeader, CardTitle } from "@/components/ui/card";

const formSchema = z.object({
  message: z.string(), // Allow empty message if a media file is attached
});

type FormValues = z.infer<typeof formSchema>;

interface ChatInputFormProps {
  onSubmit: (values: FormValues, media?: string[]) => void;
  isLoading: boolean;
  onInterrupt: () => void;
  onSuggestionClick: (suggestion: string) => void;
  hasMedia: boolean;
}

const promptSuggestions = [
    {
        title: "Write a blog post",
        prompt: "Write a blog post about the future of renewable energy, focusing on recent breakthroughs in solar and wind power."
    },
    {
        title: "Summarize this article",
        prompt: "Can you please visit https://www.theverge.com/2023/9/19/23880112/google-ai-ethicist-blake-lemoine-conscious-lamda-chatbots and give me a summary of the key points?"
    },
    {
        title: "Brainstorm marketing ideas",
        prompt: "Brainstorm three creative marketing slogans for a new brand of eco-friendly sneakers."
    },
    {
        title: "Multi-task: Create and explain",
        prompt: "Generate an image of a futuristic cityscape at night, then write a short, cyberpunk-style story scene that takes place in it."
    }
];

const mediaSuggestionPrompts = [
    "Describe this in detail.",
    "Write a social media post about this.",
    "What is the main subject of this file?",
    "Generate a witty caption for this picture."
];


// Memoize the form component to prevent re-renders on parent state changes.
const ChatInputForm = memo(forwardRef<HTMLFormElement, ChatInputFormProps>(({ onSubmit, isLoading, onInterrupt, onSuggestionClick, hasMedia }, ref) => {
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [mediaPreviews, setMediaPreviews] = useState<{type: 'image' | 'video' | 'other', url: string, name: string}[]>([]);
    
    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            message: "",
        },
    });

    const messageValue = useWatch({ control: form.control, name: 'message' });
    const isButtonDisabled = isLoading || (!messageValue?.trim() && mediaPreviews.length === 0);

    const handleFormSubmit = (values: FormValues) => {
        if (!values.message.trim() && mediaPreviews.length === 0) {
            toast({
                title: "Empty message",
                description: "Please enter a message or upload an image to send.",
                variant: "destructive",
            });
            return;
        }
        onSubmit(values, mediaPreviews.length > 0 ? mediaPreviews.map(p => p.url) : undefined);
        form.reset();
        setMediaPreviews([]);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            if (!isButtonDisabled) {
                form.handleSubmit(handleFormSubmit)();
            }
        }
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (files) {
            const newPreviews: Promise<{type: 'image' | 'video' | 'other', url: string, name: string}>[] = [];
            for (const file of Array.from(files)) {
                // ~10 minutes of video at reasonable quality, or large images.
                const maxSize = 25 * 1024 * 1024; // 25MB limit per file
                if (file.size > maxSize) {
                    toast({
                        title: "File too large",
                        description: `${file.name} is larger than 25MB. Please upload a smaller file.`,
                        variant: "destructive",
                    });
                    continue;
                }
                
                const fileType = file.type.startsWith('video') ? 'video' : (file.type.startsWith('image') ? 'image' : 'other');

                newPreviews.push(new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve({
                        type: fileType,
                        url: reader.result as string,
                        name: file.name,
                    });
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                }));
            }
            Promise.all(newPreviews).then(results => {
                setMediaPreviews(prev => [...prev, ...results]);
            });
        }
    };
    
    const removeMedia = (indexToRemove: number) => {
        setMediaPreviews(previews => previews.filter((_, index) => index !== indexToRemove));
    };

    return (
        <div className="flex-shrink-0 bg-gradient-to-t from-background via-background/80 to-transparent pt-4 pb-8">
            <div className="mx-auto w-full max-w-4xl px-4">
                 {hasMedia && (
                    <div className="mb-4">
                        <div className="flex items-center gap-2 mb-2">
                             <Sparkles className="h-4 w-4 text-primary" />
                             <h4 className="text-sm font-semibold text-muted-foreground">What do you want to do with this file?</h4>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {mediaSuggestionPrompts.map((prompt) => (
                                <Button
                                    key={prompt}
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => onSuggestionClick(prompt)}
                                >
                                    {prompt}
                                </Button>
                            ))}
                        </div>
                    </div>
                )}
                <FormProvider {...form}>
                    <form
                        ref={ref}
                        onSubmit={form.handleSubmit(handleFormSubmit)}
                        className="rounded-xl border bg-secondary"
                    >
                        {mediaPreviews.length > 0 && (
                            <div className="p-2 pt-2 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                                {mediaPreviews.map((preview, index) => (
                                    <div key={index} className="relative aspect-square">
                                        {preview.type === 'image' ? (
                                            <Image src={preview.url} alt={`Preview ${index}`} fill sizes="90px" className="rounded-lg object-cover" />
                                        ) : preview.type === 'video' ? (
                                            <video src={preview.url} className="rounded-lg object-cover w-full h-full" muted playsInline />
                                        ) : (
                                            <div className="w-full h-full bg-muted rounded-lg flex items-center justify-center text-center p-1 text-xs text-muted-foreground">
                                                {preview.name}
                                            </div>
                                        )}
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="icon"
                                            className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2 rounded-full h-5 w-5"
                                            onClick={() => removeMedia(index)}
                                        >
                                            <X className="h-3 w-3" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                        <FormField
                        control={form.control}
                        name="message"
                        render={({ field }) => (
                            <FormItem>
                            <FormControl>
                                <Textarea
                                    placeholder={"Ask Briefly anything..."}
                                    className="text-lg min-h-[90px] bg-secondary border-0 focus-visible:ring-0 resize-none placeholder:text-lg"
                                    autoComplete="off"
                                    disabled={isLoading}
                                    onKeyDown={handleKeyDown}
                                    {...field}
                                />
                            </FormControl>
                            </FormItem>
                        )}
                        />
                        <div className="flex items-center justify-between p-2">
                            <div className="flex items-center gap-2">
                                <Button type="button" variant="ghost" size="icon" className="rounded-lg" onClick={() => fileInputRef.current?.click()} disabled={isLoading}>
                                    <ImagePlus className="h-5 w-5 text-muted-foreground" />
                                    <span className="sr-only">Upload media</span>
                                </Button>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    className="hidden"
                                    multiple
                                    accept="image/*,video/mp4,video/quicktime,application/pdf,text/plain,.csv,.json,.xml"
                                />
                            </div>
                            
                            <Button 
                                type={isLoading ? "button" : "submit"}
                                size="sm" 
                                className="rounded-lg" 
                                disabled={isButtonDisabled && !isLoading}
                                onClick={isLoading ? onInterrupt : undefined}
                            >
                                {isLoading ? <Square className="h-5 w-5" /> : <ArrowUp className="h-5 w-5" />}
                                <span className="sr-only">{isLoading ? 'Stop' : 'Send'}</span>
                            </Button>
                        </div>
                    </form>
                </FormProvider>
            </div>
        </div>
    )
}));
ChatInputForm.displayName = "ChatInputForm";


export default function ChatClient() {
  const params = useParams();
  const chatId = params.chatId as string | undefined; // Can be undefined on the root page
  const { user } = useAuth();
  const router = useRouter();
  const [session, setSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(!!chatId); // Only show page loading for existing chats
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Create a ref for the session state to use in async handlers
  const sessionRef = useRef(session);
  useEffect(() => {
    sessionRef.current = session;
  }, [session]);


  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    async function loadChat() {
        if (!user || !chatId) {
            setSession(null);
            setMessages([]);
            setIsPageLoading(false);
            return;
        };

        setIsPageLoading(true);
        try {
            const loadedSession = await getChatSession(chatId);
            if (loadedSession) {
                setSession(loadedSession);
                setMessages(loadedSession.messages);
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


  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleInterrupt = () => {
    if (abortControllerRef.current) {
        abortControllerRef.current.abort();
    }
  };

  const handleNewMessage = useCallback(async (values: FormValues, media?: string[]) => {
    if (!user) return;

    const userMessage: Message = { role: "user", content: values.message, mediaUrls: media };
    const newHistory = [...messages, userMessage];
    setMessages(newHistory);
    
    abortControllerRef.current = new AbortController();
    setIsLoading(true);

    try {
        let currentSession = sessionRef.current;

        // If it's a new chat, create it first
        if (!currentSession) {
            const newSession = await createChatSession({ userId: user.uid, firstMessage: userMessage });
            setSession(newSession); // This updates the state
            currentSession = newSession; // Use the newly created session for this operation
            // Update URL without reloading the page
            window.history.replaceState(null, '', `/chat/${newSession.id}`);
        }
        
        if (!currentSession) {
            throw new Error("Failed to create or find a chat session.");
        }

        const response = await conversationalChat({
            history: newHistory,
        });

        if (abortControllerRef.current?.signal.aborted) {
            throw new Error('AbortError');
        }

        let aiMessage: Message;
        if (typeof response === 'string' && response.trim().length > 0) {
            aiMessage = { role: "model", content: response };
        } else {
            console.error("Invalid response from AI:", response);
            aiMessage = { role: "model", content: "Sorry, I received an invalid response. Please try again." };
        }
        
        const finalHistory = [...newHistory, aiMessage];
        setMessages(finalHistory);

        await updateChatSession(currentSession.id, finalHistory);

    } catch (error: any) {
        if (error.message === 'AbortError' || abortControllerRef.current?.signal.aborted) {
            const interruptMessage: Message = { role: "model", content: "*What else can I help you with?*" };
            const finalHistory = [...newHistory, interruptMessage];
            setMessages(finalHistory);
            if (sessionRef.current) await updateChatSession(sessionRef.current.id, finalHistory);
        } else {
            console.error("Chat failed:", error);
            const errorMessage: Message = { role: "model", content: `Sorry, I encountered an error. ${error instanceof Error ? error.message : ''}` };
            setMessages((prev) => [...prev, errorMessage]);
        }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [user, messages, router]);

  const handlePromptSuggestionClick = (prompt: string) => {
    handleNewMessage({ message: prompt });
  };


  const renderContent = () => {
    if (isPageLoading) {
        return (
            <div className="flex flex-grow flex-col items-center justify-center">
                <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    if (messages.length === 0) {
      const userName = user?.displayName ? `, ${user.displayName.split(' ')[0]}` : '';
      return (
        <div className="flex-grow flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-4xl mx-auto space-y-12">
                <div className="text-center space-y-4 max-w-full">
                    <h1 className="text-3xl sm:text-4xl font-bold break-words">Hello{userName}. Let's get to work.</h1>
                    <p className="text-lg sm:text-xl text-muted-foreground">What's the plan?</p>
                </div>
                
                 <div className="space-y-4">
                    {promptSuggestions.map((prompt, index) => (
                        <Card key={index} className="w-full cursor-pointer hover:border-primary transition-colors" onClick={() => handlePromptSuggestionClick(prompt.prompt)}>
                            <CardHeader>
                                <CardTitle className="text-base">{prompt.title}</CardTitle>
                            </CardHeader>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
      );
    }

    return (
      <div className="flex-grow w-full max-w-4xl mx-auto space-y-6 px-4">
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
                    "max-w-xl rounded-xl p-3",
                     message.role === "user" ? "shadow-md bg-primary text-primary-foreground" : "bg-secondary"
                  )}
              >
                  {message.mediaUrls && message.mediaUrls.length > 0 && (
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
                  {message.content && <MarkdownRenderer>{message.content}</MarkdownRenderer>}
              </div>
              </div>
          ))}
              {isLoading && (
              <div className="flex items-start gap-4 justify-start">
              <LogoSpinner />
              </div>
          )}
          <div ref={messagesEndRef} />
      </div>
    );
  };


  return (
    <div className="flex-1 flex flex-col">
      <div className="flex-1 overflow-y-auto pt-6 pb-24">
        {renderContent()}
      </div>
      <div className="fixed bottom-0 left-0 right-0 md:pl-[var(--sidebar-width)] group-data-[state=collapsed]:md:pl-[var(--sidebar-width-icon)]">
          <ChatInputForm
            onSubmit={handleNewMessage}
            isLoading={isLoading}
            onInterrupt={handleInterrupt}
            onSuggestionClick={handlePromptSuggestionClick}
            hasMedia={messages.some(m => m.mediaUrls && m.mediaUrls.length > 0)}
          />
      </div>
    </div>
  );
}
