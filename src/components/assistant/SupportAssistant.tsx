
"use client";

import React, { useState, useRef, useEffect, type FormEvent } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, Send, User, Bot, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { askSupportAssistant, type SupportAssistantInput, type SupportAssistantOutput } from "@/ai/flows/support-assistant-flow";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/contexts/AuthContext';

interface Message {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: Date;
  shouldContactSupport?: boolean;
}

export function SupportAssistant() {
  const { currentUser } = useAuth(); // Only show/enable if user is logged in
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      // Add a default welcome message from the assistant when dialog opens, if no messages exist
      if (messages.length === 0) {
        setMessages([
          {
            id: Date.now().toString(),
            role: "assistant",
            text: "Hi there! I'm Briefly, your AI support assistant. How can I help you with BrieflyAI today?",
            timestamp: new Date(),
          },
        ]);
      }
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, messages.length]);

  useEffect(() => {
    // Scroll to bottom when new messages are added
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    const query = inputValue.trim();
    if (!query) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      text: query,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      const conversationHistoryForAPI = messages.map(m => ({ role: m.role, text: m.text }));
      
      const input: SupportAssistantInput = { userQuery: query, conversationHistory: conversationHistoryForAPI };
      const result: SupportAssistantOutput = await askSupportAssistant(input);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        text: result.assistantResponse,
        timestamp: new Date(),
        shouldContactSupport: result.shouldContactSupport,
      };
      setMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      console.error("Error calling support assistant flow:", error);
      toast({
        title: "Error",
        description: "Sorry, I couldn't process your request right now. Please try again.",
        variant: "destructive",
      });
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        text: "I seem to be having trouble connecting. Please try again in a moment.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
       setTimeout(() => inputRef.current?.focus(), 0);
    }
  };
  
  if (!currentUser) {
    return null; // Don't render if user is not logged in
  }

  return (
    <>
      <Button
        variant="default"
        size="icon"
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50 bg-primary hover:bg-primary/90 text-primary-foreground"
        onClick={() => setIsOpen(true)}
        aria-label="Open Support Assistant"
      >
        <MessageCircle className="h-7 w-7" />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[450px] p-0 flex flex-col h-[70vh] max-h-[600px]">
          <DialogHeader className="p-4 border-b">
            <DialogTitle className="flex items-center text-lg">
              <Bot className="mr-2 h-5 w-5 text-primary" /> BrieflyAI Support
            </DialogTitle>
            <DialogDescription className="text-xs">
              Ask questions about using BrieflyAI. For sensitive issues, I'll guide you to human support.
            </DialogDescription>
             <button 
                onClick={() => setIsOpen(false)} 
                className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
                aria-label="Close dialog"
            >
                <X className="h-4 w-4" />
            </button>
          </DialogHeader>
          
          <ScrollArea className="flex-grow p-4 space-y-4" ref={scrollAreaRef}>
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex mb-3 text-sm",
                  msg.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                <div className="flex items-end max-w-[80%] gap-2">
                  {msg.role === "assistant" && (
                     <AvatarIcon role="assistant" />
                  )}
                  <div
                    className={cn(
                      "p-2.5 rounded-lg shadow",
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-none"
                        : "bg-muted text-muted-foreground rounded-bl-none",
                      msg.shouldContactSupport && msg.role === "assistant" ? "border border-destructive/50 bg-destructive/10 text-destructive-foreground" : ""
                    )}
                  >
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                    <p className="text-xs opacity-60 mt-1 text-right">
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                   {msg.role === "user" && (
                     <AvatarIcon role="user" />
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start mb-3">
                <div className="flex items-end max-w-[80%] gap-2">
                  <AvatarIcon role="assistant" />
                  <div className="p-3 rounded-lg shadow bg-muted">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  </div>
                </div>
              </div>
            )}
          </ScrollArea>
          
          <DialogFooter className="p-4 border-t">
            <form onSubmit={handleSendMessage} className="flex w-full items-center space-x-2">
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask about BrieflyAI..."
                className="flex-grow"
                disabled={isLoading}
              />
              <Button type="submit" size="icon" disabled={isLoading || !inputValue.trim()} aria-label="Send message">
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </form>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

const AvatarIcon = ({role}: {role: "user" | "assistant"}) => {
    const { userInitials, avatarUrl } = useAuth();
    if (role === 'user') {
        return (
            <div className="flex-shrink-0 h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs overflow-hidden">
               {avatarUrl && avatarUrl !== "https://placehold.co/40x40.png" ? <img src={avatarUrl} alt="User" className="h-full w-full object-cover"/> : userInitials || <User size={14}/>}
            </div>
        )
    }
    return (
        <div className="flex-shrink-0 h-7 w-7 rounded-full bg-muted text-muted-foreground flex items-center justify-center">
            <Bot size={16} />
        </div>
    )
}
