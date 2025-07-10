
"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getProjectsForUser } from "@/services/projectService";
import type { Project } from "@/types/project";
import type { ChatMessage } from "@/types/chat";

import ChatClient from "@/components/features/chat/ChatClient";
import ChatHistorySidebar from "@/components/features/chat/ChatHistorySidebar";
import { LoaderCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useSearchParams } from 'next/navigation';

export default function ChatPage() {
  const { user, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const [chats, setChats] = useState<Project[]>([]);
  const [loadingChats, setLoadingChats] = useState(true);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);

  const fetchChats = useCallback(() => {
    if (user) {
      setLoadingChats(true);
      getProjectsForUser(user.uid)
        .then(projects => {
          const chatProjects = projects.filter(p => p.type === 'chat');
          setChats(chatProjects);
        })
        .catch(console.error)
        .finally(() => setLoadingChats(false));
    }
  }, [user]);

  useEffect(() => {
    const chatIdFromParams = searchParams.get('id');
    if (chatIdFromParams) {
        setSelectedChatId(chatIdFromParams);
    }
    fetchChats();
  }, [user, fetchChats, searchParams]);
  
  const handleNewChat = () => {
    setSelectedChatId(null);
  };

  const handleSelectChat = (chatId: string) => {
    setSelectedChatId(chatId);
  };
  
  const handleChatUpdated = (newProject?: Project) => {
    if (newProject) {
        // Optimistically add the new chat to the list and select it
        setChats(prev => [newProject, ...prev.filter(p => p.id !== newProject.id)]);
        setSelectedChatId(newProject.id);
    } else {
        // It was an update, so just refresh the list from the server
        // to get the new `updatedAt` time and re-order the list.
        fetchChats();
    }
  }

  const selectedChatMessages = chats.find(c => c.id === selectedChatId)?.content as ChatMessage[] || [];

  const SidebarSkeleton = () => (
    <div className="p-4 space-y-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-5/6" />
    </div>
  );

  return (
    <main className="flex h-screen">
      <div className="hidden md:flex flex-col w-72 border-r bg-secondary/50">
        {authLoading || loadingChats ? (
            <SidebarSkeleton />
        ) : (
            <ChatHistorySidebar
                chats={chats}
                currentChatId={selectedChatId}
                onNewChat={handleNewChat}
                onSelectChat={handleSelectChat}
            />
        )}
      </div>
      <div className="flex-1 flex flex-col">
        {authLoading ? (
             <div className="flex-1 flex items-center justify-center">
                <LoaderCircle className="w-12 h-12 animate-spin text-primary"/>
            </div>
        ) : (
             <ChatClient 
                key={selectedChatId || 'new'}
                initialChatId={selectedChatId}
                initialMessages={selectedChatMessages}
                onChatUpdated={handleChatUpdated}
            />
        )}
      </div>
    </main>
  );
}
