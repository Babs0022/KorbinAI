
"use client";

import { Message } from "@/types/ai";
import { cn } from "@/lib/utils";
import MarkdownRenderer from "@/components/shared/MarkdownRenderer";
import LogoSpinner from "@/components/shared/LogoSpinner";
import ChatMessageActions from "./ChatMessageActions";
import Reasoning from "./Reasoning";
import Sources from "./Sources";
import Image from "next/image";
import { Bot, User } from "lucide-react";

interface ChatMessageProps {
  message: Message;
  isLoading: boolean;
  isLastMessage: boolean;
  onRegenerate: () => void;
  projectId?: string;
}

export default function ChatMessage({
  message,
  isLoading,
  isLastMessage,
  onRegenerate,
  projectId,
}: ChatMessageProps) {
  const { role, content, mediaUrls, reasoning, sources } = message;

  const renderMedia = () => {
    if (!mediaUrls || mediaUrls.length === 0) return null;
    return (
      <div className="grid grid-cols-2 gap-2 mb-2">
        {mediaUrls.map((url, i) => (
          <div key={i} className="relative aspect-square">
            {url.startsWith("data:video") ? (
              <video
                src={url}
                className="rounded-lg object-cover w-full h-full"
                controls
              />
            ) : (
              <Image
                src={url}
                alt={`User upload ${i + 1}`}
                fill
                sizes="150px"
                className="rounded-lg object-cover"
              />
            )}
          </div>
        ))}
      </div>
    );
  };

  const icon = role === 'user' ? <User className="h-6 w-6" /> : <Bot className="h-6 w-6" />;

  return (
    <div className={cn("flex items-start gap-4 w-full animate-fade-in-up")}>
      <div className="flex-shrink-0">{icon}</div>
      <div className="flex-grow">
        <div
          className={cn(
            "max-w-full",
            role === "user"
              ? "bg-secondary text-foreground rounded-xl p-3"
              : ""
          )}
        >
          {role === "user" && renderMedia()}
          {isLoading && role === "model" && isLastMessage && !content ? (
            <>
              <Reasoning steps={reasoning || []} isStreaming={true} />
              <LogoSpinner />
            </>
          ) : content ? (
            <>
              <MarkdownRenderer>{content}</MarkdownRenderer>
              <Reasoning steps={reasoning || []} isStreaming={isLoading && isLastMessage} />
              <Sources sources={sources || []} />
            </>
          ) : null}
        </div>
        {role === 'model' && (content || mediaUrls) && (!isLoading || !isLastMessage) && (
            <ChatMessageActions
            message={message}
            onRegenerate={onRegenerate}
            projectId={projectId}
            />
        )}
      </div>
    </div>
  );
}
