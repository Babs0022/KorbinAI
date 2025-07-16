
"use client";

import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { LoaderCircle, Send, ImagePlus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { conversationalChat } from "@/ai/flows/conversational-chat-flow";
import { type Message } from "@/types/ai";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import MarkdownRenderer from "@/components/shared/MarkdownRenderer";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  message: z.string().min(1, "Message cannot be empty."),
});

export default function ChatClient() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);


  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      message: "",
    },
  });
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);


  async function onSubmit(values: z.infer<typeof formSchema>) {
    const userMessage: Message = { role: "user", content: values.message };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    form.reset();

    try {
      const response = await conversationalChat({
        history: messages,
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
  
  const ChatInputForm = ({ className }: { className?: string }) => (
    <div className={cn("w-full max-w-2xl mx-auto", className)}>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="relative"
          >
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      placeholder="Message Briefly..."
                      className="text-base py-6 pl-12 pr-14 rounded-full bg-secondary"
                      autoComplete="off"
                      disabled={isLoading}
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <div className="absolute left-4 top-1/2 -translate-y-1/2">
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => fileInputRef.current?.click()} disabled>
                    <ImagePlus className="h-5 w-5 text-muted-foreground" />
                    <span className="sr-only">Upload image</span>
                </Button>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" disabled />
            </div>
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
                <Button type="submit" size="icon" className="rounded-full" disabled={isLoading}>
                    {isLoading ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                    <span className="sr-only">Send</span>
                </Button>
            </div>
          </form>
        </Form>
    </div>
  )

  if (messages.length === 0) {
    return (
        <div className="flex h-[70vh] flex-col items-center justify-center">
            <ChatInputForm />
        </div>
    )
  }

  return (
    <div className="flex h-[80vh] flex-col">
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
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
        <div className="sticky bottom-0 bg-gradient-to-t from-background via-background to-transparent pt-4 pb-8">
            <ChatInputForm />
        </div>
    </div>
  );
}
