
"use client";

import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { LoaderCircle, Send } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { conversationalChat, Message } from "@/ai/flows/conversational-chat-flow";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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

  return (
    <Card className="w-full">
      <CardContent className="p-0">
        <div className="flex h-[70vh] flex-col">
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.length === 0 && (
                <div className="flex justify-center items-center h-full">
                    <p className="text-muted-foreground">Start the conversation by sending a message.</p>
                </div>
            )}
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
                        <AvatarImage src="/icon.png" alt="BrieflyAI" />
                        <AvatarFallback>B</AvatarFallback>
                    </Avatar>
                )}
                <div
                  className={cn(
                    "max-w-xl rounded-xl px-4 py-3",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary"
                  )}
                >
                  <MarkdownRenderer>{message.content}</MarkdownRenderer>
                </div>
                 {message.role === "user" && user && (
                    <Avatar className="h-9 w-9">
                        <AvatarImage src={user.photoURL || undefined} alt={user.displayName || "User"} />
                        <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
                    </Avatar>
                )}
              </div>
            ))}
             {isLoading && (
              <div className="flex items-start gap-4">
                <Avatar className="h-9 w-9">
                    <AvatarImage src="/icon.png" alt="BrieflyAI" />
                    <AvatarFallback>B</AvatarFallback>
                </Avatar>
                <div className="max-w-xl rounded-xl px-4 py-3 bg-secondary flex items-center">
                    <LoaderCircle className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <div className="border-t bg-background px-4 py-3">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="flex items-center gap-2"
              >
                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Input
                          placeholder="Type your message..."
                          className="text-base"
                          autoComplete="off"
                          disabled={isLoading}
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <Button type="submit" size="icon" disabled={isLoading}>
                  <Send className="h-5 w-5" />
                  <span className="sr-only">Send</span>
                </Button>
              </form>
            </Form>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
