
"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Trash2, Undo, AlertTriangle, LoaderCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import type { ChatSession } from "@/types/chat";
import { getDeletedChatsForUser, restoreChatSession, permanentlyDeleteChatSession } from "@/services/chatService";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from 'date-fns';

export default function TrashPage() {
    const { user, loading: authLoading } = useAuth();
    const { toast } = useToast();
    const [deletedChats, setDeletedChats] = useState<ChatSession[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState<string | null>(null);

    useEffect(() => {
        if (!user) {
            setIsLoading(false);
            return;
        }

        async function fetchDeletedChats() {
            setIsLoading(true);
            try {
                const chats = await getDeletedChatsForUser(user.uid);
                setDeletedChats(chats);
            } catch (error) {
                console.error("Failed to fetch deleted chats:", error);
                toast({ variant: 'destructive', title: "Error", description: "Could not fetch deleted items." });
            } finally {
                setIsLoading(false);
            }
        }
        fetchDeletedChats();
    }, [user, toast]);

    const handleRestore = async (chatId: string) => {
        setIsProcessing(chatId);
        try {
            await restoreChatSession(chatId);
            setDeletedChats(prev => prev.filter(c => c.id !== chatId));
            toast({ title: "Conversation Restored", description: "It's now back in your recent chats." });
        } catch (error) {
            toast({ variant: 'destructive', title: "Error", description: "Could not restore the conversation." });
        } finally {
            setIsProcessing(null);
        }
    };

    const handlePermanentDelete = async (chatId: string) => {
        setIsProcessing(chatId);
        try {
            await permanentlyDeleteChatSession(chatId);
            setDeletedChats(prev => prev.filter(c => c.id !== chatId));
            toast({ title: "Conversation Permanently Deleted" });
        } catch (error) {
            toast({ variant: 'destructive', title: "Error", description: "Could not permanently delete the conversation." });
        } finally {
            setIsProcessing(null);
        }
    };

    const renderContent = () => {
        if (isLoading || authLoading) {
            return (
                <div className="flex justify-center py-16">
                    <LoaderCircle className="h-8 w-8 animate-spin" />
                </div>
            )
        }

        if (deletedChats.length === 0) {
            return (
                 <div className="text-center py-16 px-4 border-2 border-dashed rounded-xl">
                    <Trash2 className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-semibold">The trash is empty</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                        When you delete a conversation, you'll find it here.
                    </p>
                </div>
            )
        }

        return (
            <ul className="space-y-4">
                {deletedChats.map(chat => (
                    <li key={chat.id} className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-lg border p-4">
                        <div>
                            <p className="font-semibold">{chat.title}</p>
                            <p className="text-sm text-muted-foreground">
                                Deleted {formatDistanceToNow(new Date(chat.deletedAt!), { addSuffix: true })}
                            </p>
                        </div>
                        <div className="flex gap-2 shrink-0">
                            <Button variant="outline" size="sm" onClick={() => handleRestore(chat.id)} disabled={!!isProcessing}>
                                {isProcessing === chat.id ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Undo className="h-4 w-4" />}
                                <span className="ml-2">Restore</span>
                            </Button>
                             <Button variant="destructive" size="sm" onClick={() => handlePermanentDelete(chat.id)} disabled={!!isProcessing}>
                                {isProcessing === chat.id ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                <span className="ml-2">Delete Forever</span>
                            </Button>
                        </div>
                    </li>
                ))}
            </ul>
        )
    };

    return (
        <DashboardLayout>
            <main className="flex-1 p-4 md:p-8">
                <div className="w-full max-w-4xl mx-auto">
                    <div className="mb-10">
                        <h1 className="text-4xl font-bold">Trash</h1>
                        <p className="mt-2 text-lg text-muted-foreground">
                            Deleted conversations are stored here for 30 days before being permanently removed.
                        </p>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Deleted Items</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {renderContent()}
                             <div className="mt-6 flex items-start gap-3 rounded-lg border border-amber-500/50 bg-amber-500/10 p-4 text-amber-200">
                                <AlertTriangle className="h-5 w-5 mt-1 shrink-0" />
                                <div className="text-sm">
                                    <p className="font-semibold">Automatic Deletion</p>
                                    <p className="opacity-80">Items in the trash will be automatically deleted forever after 30 days.</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </DashboardLayout>
    );
}
