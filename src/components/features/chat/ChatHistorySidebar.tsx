
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Project } from "@/types/project";
import { FilePlus, MessageSquare, ArrowLeft } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';
import { cn } from "@/lib/utils";
import Link from "next/link";

interface ChatHistorySidebarProps {
  chats: Project[];
  currentChatId: string | null;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
}

export default function ChatHistorySidebar({ chats, currentChatId, onSelectChat, onNewChat }: ChatHistorySidebarProps) {
  return (
    <div className="flex flex-col h-full">
        <div className="p-4 border-b">
            <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4" />
                Back to Creation Hub
            </Link>
        </div>
        <div className="p-4">
            <Button className="w-full" onClick={onNewChat}>
                <FilePlus className="mr-2 h-4 w-4" />
                New Chat
            </Button>
        </div>
        <ScrollArea className="flex-1">
            <div className="px-4 py-2 space-y-1">
                {chats.map(chat => (
                    <Button
                        key={chat.id}
                        variant="ghost"
                        className={cn(
                            "w-full justify-start h-auto text-left flex flex-col items-start p-2",
                            chat.id === currentChatId && "bg-accent text-accent-foreground"
                        )}
                        onClick={() => onSelectChat(chat.id)}
                    >
                        <p className="font-semibold line-clamp-1">{chat.name}</p>
                        <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(chat.updatedAt), { addSuffix: true })}
                        </p>
                    </Button>
                ))}
            </div>
        </ScrollArea>
       {chats.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                <MessageSquare className="w-10 h-10 text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">No chat history yet.</p>
                <p className="text-xs text-muted-foreground">Start a new conversation to see it here.</p>
            </div>
        )}
    </div>
  );
}
