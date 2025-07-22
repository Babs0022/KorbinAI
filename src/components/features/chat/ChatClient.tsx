
"use client";

import { useState, useRef, useEffect, forwardRef, memo } from "react";
import { useForm, FormProvider, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { LoaderCircle, ImagePlus, X, ArrowUp, Square } from "lucide-react";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import { conversationalChat } from "@/ai/flows/conversational-chat-flow";
import { type Message } from "@/types/ai";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import MarkdownRenderer from "@/components/shared/MarkdownRenderer";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import LogoSpinner from "@/components/shared/LogoSpinner";

const formSchema = z.object({
  message: z.string(), // Allow empty message if an image is attached
});

type FormValues = z.infer<typeof formSchema>;


interface ChatInputFormProps {
  onSubmit: (values: FormValues, images?: string[]) => void;
  isLoading: boolean;
  onInterrupt: () => void;
}


// Memoize the form component to prevent re-renders on parent state changes.
const ChatInputForm = memo(forwardRef<HTMLFormElement, ChatInputFormProps>(({ onSubmit, isLoading, onInterrupt }, ref) => {
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    
    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            message: "",
        },
    });

    const messageValue = useWatch({ control: form.control, name: 'message' });
    const isButtonDisabled = isLoading || (!messageValue?.trim() && imagePreviews.length === 0);

    const handleFormSubmit = (values: FormValues) => {
        if (!values.message.trim() && imagePreviews.length === 0) {
            toast({
                title: "Empty message",
                description: "Please enter a message or upload an image to send.",
                variant: "destructive",
            });
            return;
        }
        onSubmit(values, imagePreviews.length > 0 ? imagePreviews : undefined);
        form.reset();
        setImagePreviews([]);
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
            const newPreviews: Promise<string>[] = [];
            for (const file of Array.from(files)) {
                if (file.size > 2 * 1024 * 1024) { // 2MB limit per image
                    toast({
                        title: "Image too large",
                        description: `${file.name} is larger than 2MB. Please upload smaller images.`,
                        variant: "destructive",
                    });
                    continue;
                }
                newPreviews.push(new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                }));
            }
            Promise.all(newPreviews).then(results => {
                setImagePreviews(prev => [...prev, ...results]);
            });
        }
    };
    
    const removeImage = (indexToRemove: number) => {
        setImagePreviews(previews => previews.filter((_, index) => index !== indexToRemove));
    };

    return (
        <div className="flex-shrink-0 bg-gradient-to-t from-background via-background/80 to-transparent pt-4 pb-8">
            <div className="mx-auto w-full max-w-4xl px-4">
                <FormProvider {...form}>
                    <form
                        ref={ref}
                        onSubmit={form.handleSubmit(handleFormSubmit)}
                        className="rounded-xl border bg-secondary"
                    >
                        {imagePreviews.length > 0 && (
                            <div className="p-2 pt-2 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                                {imagePreviews.map((src, index) => (
                                    <div key={index} className="relative aspect-square">
                                        <Image src={src} alt={`Preview ${index}`} fill sizes="90px" className="rounded-lg object-cover" />
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="icon"
                                            className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2 rounded-full h-5 w-5"
                                            onClick={() => removeImage(index)}
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
                                    <span className="sr-only">Upload image</span>
                                </Button>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    className="hidden"
                                    multiple
                                    accept="image/png, image/jpeg, image/gif, image/webp"
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
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [greeting, setGreeting] = useState("Hey");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) {
      setGreeting("Good morning");
    } else if (hour < 18) {
      setGreeting("Good afternoon");
    } else {
      setGreeting("Good evening");
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleInterrupt = () => {
    if (abortControllerRef.current) {
        abortControllerRef.current.abort();
    }
  };

  const handleNewMessage = async (values: FormValues, images?: string[]) => {
    const userMessage: Message = { role: "user", content: values.message, imageUrls: images };
    const newHistory = [...messages, userMessage];
    
    abortControllerRef.current = new AbortController();
    setMessages(newHistory);
    setIsLoading(true);

    try {
      // Note: Genkit flows don't accept an AbortSignal directly like fetch.
      // This implementation handles the client-side interruption gracefully.
      const response = await conversationalChat({
        history: newHistory,
      });

      if (abortControllerRef.current?.signal.aborted) {
          // If aborted during the await, don't process the response.
          // The catch block will handle the message.
          return;
      }

      if (typeof response === 'string' && response.trim().length > 0) {
        const aiMessage: Message = { role: "model", content: response };
        setMessages((prev) => [...prev, aiMessage]);
      } else {
        // Handle cases where the AI returns an empty or invalid response
        console.error("Invalid response from AI:", response);
        const errorMessage: Message = {
            role: "model",
            content: "Sorry, I received an invalid response. Please try again.",
        };
        setMessages((prev) => [...prev, errorMessage]);
      }

    } catch (error: any) {
        if (error.name === 'AbortError' || abortControllerRef.current?.signal.aborted) {
            const interruptMessage: Message = {
                role: "model",
                content: "*What else can I help you with?*",
            };
            setMessages((prev) => [...prev, interruptMessage]);
        } else {
            console.error("Chat failed:", error);
            const errorMessage: Message = {
                role: "model",
                content: `Sorry, I encountered an error. ${error instanceof Error ? error.message : ''}`,
            };
            setMessages((prev) => [...prev, errorMessage]);
        }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }

  const renderContent = () => {
    if (messages.length === 0) {
      const userName = user?.displayName ? `, ${user.displayName.split(' ')[0]}` : '';
      return (
        <div className="flex-grow flex flex-col items-center justify-center p-4">
            <div className="text-center space-y-4 max-w-full">
                <h1 className="text-3xl sm:text-4xl font-bold break-words">{greeting}{userName}</h1>
                <p className="text-lg sm:text-xl text-muted-foreground">How can I help you today?</p>
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
              {message.role === "model" && (
                  <Avatar className="h-9 w-9">
                      <AvatarImage src="/icon.png" alt="BrieflyAI" data-ai-hint="logo icon" />
                      <AvatarFallback>B</AvatarFallback>
                  </Avatar>
              )}
              <div
                  className={cn(
                    "max-w-xl",
                    message.role === "user"
                      ? "rounded-xl shadow-md bg-primary text-primary-foreground p-3"
                      : ""
                  )}
              >
                  {message.imageUrls && message.imageUrls.length > 0 && (
                      <div className="grid grid-cols-2 gap-2 mb-2">
                          {message.imageUrls.map((url, i) => (
                              <Image key={i} src={url} alt={`User upload ${i + 1}`} width={150} height={150} className="rounded-lg object-cover" />
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
    <div className="flex-grow flex flex-col overflow-y-auto">
      <div className="flex-grow overflow-y-auto pt-6">
        {renderContent()}
      </div>
      <ChatInputForm
        onSubmit={handleNewMessage}
        isLoading={isLoading}
        onInterrupt={handleInterrupt}
      />
    </div>
  );
}
