
"use client";

import { useState, useRef, useEffect, forwardRef, memo } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { LoaderCircle, Send, ImagePlus, X, ChevronDown } from "lucide-react";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import { conversationalChat } from "@/ai/flows/conversational-chat-flow";
import { agentExecutor } from "@/ai/flows/agent-executor-flow"; // Import the agent flow
import { type Message } from "@/types/ai";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import MarkdownRenderer from "@/components/shared/MarkdownRenderer";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import LogoSpinner from "@/components/shared/LogoSpinner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";


const formSchema = z.object({
  message: z.string(), // Allow empty message if an image is attached
}).refine(data => data.message.trim().length > 0 || "image is present", {
  message: "Message cannot be empty.",
});

type FormValues = z.infer<typeof formSchema>;
type ChatMode = 'chat' | 'agent';

interface ChatInputFormProps {
  onSubmit: (values: FormValues, image?: string) => void;
  isLoading: boolean;
  mode: ChatMode;
  onModeChange: (mode: ChatMode) => void;
  className?: string;
}


// Memoize the form component to prevent re-renders on parent state changes.
const ChatInputForm = memo(forwardRef<HTMLFormElement, ChatInputFormProps>(({ onSubmit, isLoading, mode, onModeChange, className }, ref) => {
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
        <div className={cn("w-full px-4", className)}>
            <div className="mx-auto w-full max-w-4xl">
                <FormProvider {...form}>
                    <form
                        ref={ref}
                        onSubmit={form.handleSubmit(handleFormSubmit)}
                        className="rounded-xl border bg-secondary"
                    >
                        {imagePreview && (
                            <div className="relative p-2 pt-2">
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
                                    placeholder={mode === 'chat' ? "Ask Briefly anything..." : "Tell the agent what to do..."}
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
                            <div className="flex items-center gap-1">
                                <Button type="button" variant="ghost" size="icon" className="rounded-lg" onClick={() => fileInputRef.current?.click()} disabled={isLoading}>
                                    <ImagePlus className="h-5 w-5 text-muted-foreground" />
                                    <span className="sr-only">Upload image</span>
                                </Button>
                                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />

                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="sm" className="gap-2">
                                        <span className="capitalize">{mode}</span>
                                        <ChevronDown className="h-4 w-4 opacity-50" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start">
                                        <DropdownMenuItem onSelect={() => onModeChange('chat')}>
                                            Chat
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onSelect={() => onModeChange('agent')}>
                                            Agent
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                            
                            <Button type="submit" size="sm" className="rounded-lg" disabled={isLoading}>
                                {isLoading ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                                <span className="sr-only">Send</span>
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
  const [mode, setMode] = useState<ChatMode>('chat');
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
      let response;
      if (mode === 'agent') {
        response = await agentExecutor({ userId: user?.uid, messages: newHistory });
      } else {
        response = await conversationalChat({
          history: newHistory,
        });
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

    } catch (error) {
      console.error("Chat failed:", error);
      const errorMessage: Message = {
        role: "model",
        content: `Sorry, I encountered an error. ${error instanceof Error ? error.message : ''}`,
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
      const userName = user?.displayName ? `, ${user.displayName.split(' ')[0]}` : '';
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-4">
            <div className="text-center space-y-4">
                <h1 className="text-4xl font-bold">Hey{userName}</h1>
                <p className="text-xl text-muted-foreground">How can I help you today?</p>
            </div>
        </div>
      );
    }

    return (
      <div className="w-full max-w-4xl mx-auto space-y-6">
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
                      : "prose dark:prose-invert max-w-none"
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
    <div className="flex flex-1 flex-col">
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {renderContent()}
      </div>
      <div className="sticky bottom-0 bg-gradient-to-t from-background to-transparent pt-4 pb-8">
          <ChatInputForm
            onSubmit={handleNewMessage}
            isLoading={isLoading}
            mode={mode}
            onModeChange={setMode}
          />
      </div>
    </div>
  );
}
