
"use client";

import { useState, useRef, useEffect, forwardRef, memo } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { LoaderCircle, Send, ImagePlus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { conversationalChat } from "@/ai/flows/conversational-chat-flow";
import { type Message } from "@/types/ai";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import MarkdownRenderer from "@/components/shared/MarkdownRenderer";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  message: z.string().min(1, "Message cannot be empty."),
});

type FormValues = z.infer<typeof formSchema>;

interface ChatInputFormProps {
  onSubmit: (values: FormValues) => void;
  isLoading: boolean;
  className?: string;
}

// Memoize the form component to prevent re-renders on parent state changes.
const ChatInputForm = memo(forwardRef<HTMLFormElement, ChatInputFormProps>(({ onSubmit, isLoading, className }, ref) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            message: "",
        },
    });

    const handleFormSubmit = (values: FormValues) => {
        onSubmit(values);
        form.reset();
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            form.handleSubmit(handleFormSubmit)();
        }
    };

    return (
        <div className={cn("w-full max-w-4xl mx-auto", className)}>
            <FormProvider {...form}>
                <form
                    ref={ref}
                    onSubmit={form.handleSubmit(handleFormSubmit)}
                    className="rounded-lg border bg-secondary"
                >
                    <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                        <FormItem>
                        <FormControl>
                            <Textarea
                                placeholder="ask briefly"
                                className="text-xl min-h-[120px] bg-secondary border-0 focus-visible:ring-0 resize-none placeholder:text-xl"
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
                        <Button type="button" variant="ghost" size="icon" className="rounded-lg" onClick={() => fileInputRef.current?.click()} disabled>
                            <ImagePlus className="h-5 w-5 text-muted-foreground" />
                            <span className="sr-only">Upload image</span>
                        </Button>
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" disabled />
                        
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

  const handleNewMessage = async (values: FormValues) => {
    const userMessage: Message = { role: "user", content: values.message };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await conversationalChat({
        history: [...messages, userMessage],
        prompt: values.message,
      });

      const aiMessage: Message = { role: "model", content: response };
      setMessages((prev) => [...prev, aiMessage]);

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

  if (messages.length === 0) {
    return (
        <div className="flex h-screen flex-col items-center justify-end p-4">
            <ChatInputForm onSubmit={handleNewMessage} isLoading={isLoading} />
        </div>
    )
  }

  return (
    <div className="flex h-screen flex-col">
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
            <div className="w-full max-w-3xl mx-auto space-y-6">
                {messages.map((message, index) => (
                    <div
                    key={index}
                    className={cn(
                        "flex items-start gap-4",
                        message.role === "user" ? "justify-end" : ""
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
                        "max-w-xl rounded-xl px-4 py-3 shadow-md",
                        message.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary"
                        )}
                    >
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
                    <div className="flex items-start gap-4">
                    <Avatar className="h-9 w-9">
                        <AvatarImage src="/icon.png" alt="BrieflyAI" data-ai-hint="logo icon" />
                        <AvatarFallback>B</AvatarFallback>
                    </Avatar>
                    <div className="max-w-xl rounded-xl px-4 py-3 bg-secondary flex items-center">
                        <LoaderCircle className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>
        </div>
        <div className="sticky bottom-0 bg-gradient-to-t from-background via-background to-transparent pt-4 pb-8 px-4">
            <ChatInputForm onSubmit={handleNewMessage} isLoading={isLoading} />
        </div>
    </div>
  );
}
