
"use client";

import { useState, useRef, useEffect, forwardRef, memo } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { LoaderCircle, Send, ImagePlus, X } from "lucide-react";
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
}).refine(data => data.message.trim().length > 0 || "image is present", {
  message: "Message cannot be empty.",
});

type FormValues = z.infer<typeof formSchema>;

interface ChatInputFormProps {
  onSubmit: (values: FormValues, image?: string) => void;
  isLoading: boolean;
  className?: string;
}


// Memoize the form component to prevent re-renders on parent state changes.
const ChatInputForm = memo(forwardRef<HTMLFormElement, ChatInputFormProps>(({ onSubmit, isLoading, className }, ref) => {
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    
    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            message: "",
        },
    });

    const handleFormSubmit = (values: FormValues) => {
        if (!values.message.trim() && !imagePreview) {
            toast({
                title: "Empty message",
                description: "Please enter a message or upload an image to send.",
                variant: "destructive",
            });
            return;
        }
        onSubmit(values, imagePreview || undefined);
        form.reset();
        setImagePreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            form.handleSubmit(handleFormSubmit)();
        }
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) { // 2MB limit
                toast({
                    title: "Image too large",
                    description: "Please upload an image smaller than 2MB.",
                    variant: "destructive",
                });
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className={cn("w-full", className)}>
            <FormProvider {...form}>
                <form
                    ref={ref}
                    onSubmit={form.handleSubmit(handleFormSubmit)}
                    className="rounded-xl border bg-secondary"
                >
                    {imagePreview && (
                        <div className="relative p-2">
                            <Image src={imagePreview} alt="Image preview" width={90} height={90} className="rounded-lg" />
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute top-0 right-0 rounded-full h-6 w-6"
                                onClick={() => {
                                    setImagePreview(null);
                                    if (fileInputRef.current) {
                                        fileInputRef.current.value = "";
                                    }
                                }}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                    <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                        <FormItem>
                        <FormControl>
                            <Textarea
                                placeholder="ask briefly"
                                className="text-xl min-h-[90px] bg-secondary border-0 focus-visible:ring-0 resize-none placeholder:text-xl"
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
                        <Button type="button" variant="ghost" size="icon" className="rounded-lg" onClick={() => fileInputRef.current?.click()} disabled={isLoading}>
                            <ImagePlus className="h-5 w-5 text-muted-foreground" />
                            <span className="sr-only">Upload image</span>
                        </Button>
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                        
                        <Button type="submit" size="sm" className="rounded-lg" disabled={isLoading}>
                            {isLoading ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                            <span className="sr-only">Send</span>
                        </Button>
                    </div>
                </form>
            </FormProvider>
        </div>
    )
}));
ChatInputForm.displayName = "ChatInputForm";


export default function ChatClient() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleNewMessage = async (values: FormValues, image?: string) => {
    const userMessage: Message = { role: "user", content: values.message, imageUrl: image };
    const newHistory = [...messages, userMessage];
    
    setMessages(newHistory);
    setIsLoading(true);

    try {
      const response = await conversationalChat({
        history: newHistory,
      });

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

    } catch (error) {
      console.error("Chat failed:", error);
      const errorMessage: Message = {
        role: "model",
        content: "Sorry, I encountered an error. Please try again.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }
  
  const getInitials = (name?: string | null) => {
    if (!name) return "U";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase();
  };

  const renderContent = () => {
    if (messages.length === 0) {
      return (
        <div className="flex h-full flex-col items-center justify-center p-4">
          {/* This space is intentionally left blank for a clean initial view */}
        </div>
      );
    }

    return (
      <div className="w-full space-y-6">
          {messages.map((message, index) => (
              <div
              key={index}
              className={cn(
                  "flex items-start gap-4",
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
                      ? "rounded-xl bg-primary text-primary-foreground p-3 shadow-md"
                      : "" // No bubble styling for the model's response
                  )}
              >
                  {message.imageUrl && <Image src={message.imageUrl} alt="User upload" width={300} height={300} className="rounded-lg mb-2" />}
                  <MarkdownRenderer>{message.content}</MarkdownRenderer>
              </div>
                  {message.role === "user" && user && (
                  <Avatar className="h-9 w-9">
                      <AvatarImage src={user.photoURL || undefined} alt={user.displayName || "User"} data-ai-hint="person avatar" />
                      <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
                  </Avatar>
              )}
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
    <div className="flex h-screen flex-col">
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="mx-auto w-full max-w-4xl">
            {renderContent()}
        </div>
      </div>
      <div className="sticky bottom-0 bg-gradient-to-t from-background via-background to-transparent pt-4 pb-8 px-4">
        <div className="mx-auto w-full max-w-4xl">
          <ChatInputForm onSubmit={handleNewMessage} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
}
