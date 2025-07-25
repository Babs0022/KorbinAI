
"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { User, Settings, LogOut, FolderKanban, Bot, Sun, Moon, Monitor, CreditCard, FileText, Shield, Feather, Bolt, Image as ImageIcon, Code2, MessageSquare, Plus, MessageSquareText, MoreHorizontal, Pin, Trash2, Share, Pencil, LayoutGrid } from "lucide-react";
import { useSidebar, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarTrigger } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import Logo from "@/components/shared/Logo";
import { useSubscription } from "@/hooks/useSubscription";
import { Badge } from "../ui/badge";
import { useEffect, useState } from "react";
import { listRecentChatsForUser, deleteChatSession, updateChatSessionMetadata } from "@/services/chatService";
import type { ChatSession } from "@/types/chat";
import { usePathname, useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";


interface DashboardHeaderProps {
    variant?: 'main' | 'sidebar';
}

function MenuThemeToggle() {
    const { setTheme, theme } = useTheme();
    return (
        <div className="flex items-center justify-between px-2 py-1.5">
            <span className="text-sm">Theme</span>
            <div className="flex items-center rounded-md bg-secondary p-1">
                 <Button 
                    variant={theme === 'light' ? 'default' : 'ghost'} 
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setTheme("light")}
                >
                    <Sun className="h-4 w-4" />
                </Button>
                 <Button 
                    variant={theme === 'dark' ? 'default' : 'ghost'} 
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setTheme("dark")}
                >
                    <Moon className="h-4 w-4" />
                </Button>
                 <Button 
                    variant={theme === 'system' ? 'default' : 'ghost'} 
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setTheme("system")}
                >
                    <Monitor className="h-4 w-4" />
                </Button>
            </div>
        </div>
    )
}


export default function DashboardHeader({ variant = 'main' }: DashboardHeaderProps) {
  const { user, logout, loading } = useAuth();
  const { subscription } = useSubscription();
  const { state, isMobile } = useSidebar();
  const [recentChats, setRecentChats] = useState<ChatSession[]>([]);
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();

  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [chatToRename, setChatToRename] = useState<ChatSession | null>(null);
  const [newChatName, setNewChatName] = useState("");

  useEffect(() => {
    if (user) {
      const unsubscribe = listRecentChatsForUser(user.uid, (chats) => {
        // Sort chats to show pinned ones first, then by date
        const sortedChats = chats.sort((a, b) => {
          if (a.isPinned && !b.isPinned) return -1;
          if (!a.isPinned && b.isPinned) return 1;
          // Assuming updatedAt is a string that can be parsed into a Date
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        });
        setRecentChats(sortedChats);
      });
      return () => unsubscribe();
    }
  }, [user]);

  const getInitials = (name?: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };
  
  const handleDelete = async (chatId: string) => {
    try {
        await deleteChatSession(chatId);
        toast({ title: "Conversation Deleted" });
        // If the user deleted the chat they are currently on, redirect them
        if (pathname.includes(chatId)) {
            router.push('/');
        }
    } catch (error) {
        toast({ variant: 'destructive', title: "Error", description: "Could not delete conversation." });
    }
  };
  
  const handleTogglePin = async (chat: ChatSession) => {
    try {
        await updateChatSessionMetadata(chat.id, { isPinned: !chat.isPinned });
        toast({ title: chat.isPinned ? "Unpinned" : "Pinned to top" });
    } catch (error) {
        toast({ variant: 'destructive', title: "Error", description: "Could not update pin status." });
    }
  };

  const openRenameDialog = (chat: ChatSession) => {
    setChatToRename(chat);
    setNewChatName(chat.title);
    setIsRenameDialogOpen(true);
  };
  
  const handleRename = async () => {
    if (!chatToRename || !newChatName.trim()) return;
    try {
        await updateChatSessionMetadata(chatToRename.id, { title: newChatName.trim() });
        toast({ title: "Conversation Renamed" });
        setIsRenameDialogOpen(false);
        setChatToRename(null);
    } catch (error) {
        toast({ variant: 'destructive', title: "Error", description: "Could not rename conversation." });
    }
  };
  
  const handleShare = (chatId: string) => {
    const url = `${window.location.origin}/chat/${chatId}`;
    navigator.clipboard.writeText(url);
    toast({ title: "Link Copied", description: "A shareable link has been copied to your clipboard." });
  };
  
  const UserProfileMenu = () => {
    if (loading) {
      return <Skeleton className="h-10 w-10 rounded-full" />
    }
    if (user) {
      return (
         <DropdownMenu>
            <DropdownMenuTrigger asChild>
                 <Button variant="ghost" className="relative h-10 w-10 p-0 rounded-full">
                    <Avatar className="h-10 w-10">
                        <AvatarImage src={user.photoURL || undefined} alt={user.displayName || "User"} data-ai-hint="person avatar" />
                        <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
                    </Avatar>
                 </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64" align="end" forceMount>
               <DropdownMenuLabel className="font-normal">
                 <p className="text-sm font-medium leading-none">{user.displayName}</p>
                 <p className="text-xs leading-none text-muted-foreground truncate pt-1">{user.email}</p>
              </DropdownMenuLabel>
               <DropdownMenuSeparator />
                <DropdownMenuItem asChild><Link href="/dashboard/account"><User className="mr-2 h-4 w-4" />Profile</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link href="/dashboard/settings"><Settings className="mr-2 h-4 w-4" />Settings</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link href="/dashboard/billing"><CreditCard className="mr-2 h-4 w-4" />Pricing</Link></DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild><a href="https://brieflyai.xyz/terms" target="_blank" rel="noopener noreferrer"><FileText className="mr-2 h-4 w-4" />Terms</a></DropdownMenuItem>
                <DropdownMenuItem asChild><a href="https://brieflyai.xyz/privacy" target="_blank" rel="noopener noreferrer"><Shield className="mr-2 h-4 w-4" />Privacy Policy</a></DropdownMenuItem>
                <DropdownMenuSeparator />
                <div className="px-2 py-1.5 text-sm flex justify-between items-center">
                    <span>Subscription</span>
                    <Badge variant={subscription?.status === 'active' ? "default" : "secondary"} className="capitalize">
                        {subscription?.planId || 'Free'}
                    </Badge>
                </div>
                <MenuThemeToggle />
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={logout} className="text-destructive focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />Sign Out
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
      )
    }
    return (
        <Button asChild>
            <Link href="/login">
                Sign In
            </Link>
        </Button>
    );
  }

  const SidebarNav = () => (
    <nav className="flex flex-col gap-2 p-2">
        <SidebarMenu>
            <SidebarMenuItem>
                <SidebarMenuButton asChild>
                    <Link href="/">
                        <MessageSquareText />
                        <span className={cn("transition-opacity", state === 'collapsed' && !isMobile && 'opacity-0')}>Chat</span>
                    </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
             <SidebarMenuItem>
                <SidebarMenuButton asChild>
                    <Link href="/hub">
                        <LayoutGrid />
                        <span className={cn("transition-opacity", state === 'collapsed' && !isMobile && 'opacity-0')}>Creation Hub</span>
                    </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
                <SidebarMenuButton asChild>
                    <Link href="/dashboard/projects">
                        <FolderKanban />
                        <span className={cn("transition-opacity", state === 'collapsed' && !isMobile && 'opacity-0')}>Projects</span>
                    </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
        </SidebarMenu>

        <div className="px-2 py-2 text-xs font-medium text-sidebar-foreground/70 group-data-[state=collapsed]:opacity-0 transition-opacity">
            Briefs
        </div>
        <SidebarMenu>
            <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Written Content">
                    <Link href="/written-content">
                        <Feather />
                        <span className={cn("transition-opacity", state === 'collapsed' && !isMobile && 'opacity-0')}>Written Content</span>
                    </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Prompt Generator">
                    <Link href="/prompt-generator">
                        <Bolt />
                        <span className={cn("transition-opacity", state === 'collapsed' && !isMobile && 'opacity-0')}>Prompt Generator</span>
                    </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Image Generator">
                    <Link href="/image-generator">
                        <ImageIcon />
                        <span className={cn("transition-opacity", state === 'collapsed' && !isMobile && 'opacity-0')}>Image Generator</span>
                    </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Structured Data">
                    <Link href="/structured-data">
                        <Code2 />
                        <span className={cn("transition-opacity", state === 'collapsed' && !isMobile && 'opacity-0')}>Structured Data</span>
                    </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
        </SidebarMenu>
        
        <div className="px-2 py-2 text-xs font-medium text-sidebar-foreground/70 group-data-[state=collapsed]:opacity-0 transition-opacity">
            Recents
        </div>
        <SidebarMenu>
             {recentChats.map(chat => (
                <SidebarMenuItem key={chat.id}>
                    <div className="relative flex items-center w-full group">
                        <SidebarMenuButton asChild tooltip={{children: chat.title, className: "max-w-xs truncate"}} isActive={pathname.includes(`/chat/${chat.id}`)} className="flex-1 pr-8">
                            <Link href={`/chat/${chat.id}`} className="flex items-center gap-2 truncate w-full justify-start">
                                {chat.isPinned && <Pin className="h-3 w-3 shrink-0 text-primary" />}
                                <span className={cn("transition-opacity truncate", state === 'collapsed' && !isMobile && 'opacity-0')}>{chat.title}</span>
                            </Link>
                        </SidebarMenuButton>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-48">
                                <DropdownMenuItem onSelect={() => handleTogglePin(chat)}><Pin className="mr-2 h-4 w-4"/>{chat.isPinned ? "Unpin" : "Pin"}</DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => openRenameDialog(chat)}><Pencil className="mr-2 h-4 w-4"/>Rename</DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => handleShare(chat.id)}><Share className="mr-2 h-4 w-4"/>Share</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onSelect={() => handleDelete(chat.id)} className="text-destructive focus:text-destructive"><Trash2 className="mr-2 h-4 w-4"/>Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </SidebarMenuItem>
             ))}
        </SidebarMenu>
    </nav>
  );

  if (variant === 'sidebar') {
    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between gap-2 p-4 border-b">
                 <Link href="/" className={cn("flex items-center gap-2 font-semibold text-lg", state === 'collapsed' && !isMobile && "justify-center")}>
                    <span><Logo /></span>
                    <span className={cn("transition-opacity", state === 'collapsed' && !isMobile && 'opacity-0')}>BrieflyAI</span>
                 </Link>
            </div>
            <div className="flex-1 overflow-y-auto">
                <SidebarNav />
            </div>
            <div className="p-2 border-t">
                {loading ? (
                    <div className="flex items-center gap-3 p-2">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <Skeleton className="h-4 w-24" />
                    </div>
                ) : user ? (
                     <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                             <Button variant="ghost" className="w-full justify-start items-center gap-3 p-2 h-auto">
                                <Avatar className="h-10 w-10">
                                    <AvatarImage src={user.photoURL || undefined} alt={user.displayName || "User"} data-ai-hint="person avatar" />
                                    <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
                                </Avatar>
                                <div className={cn("text-left transition-opacity", state === 'collapsed' && !isMobile && 'opacity-0')}>
                                    <p className="text-sm font-medium leading-none">{user.displayName}</p>
                                    <p className="text-xs leading-none text-muted-foreground truncate">{user.email}</p>
                                </div>
                             </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56 mb-2" align="start" side="right">
                           <DropdownMenuLabel>My Account</DropdownMenuLabel>
                           <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                                <Link href="/dashboard/account"><User className="mr-2 h-4 w-4" />Account</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={logout} className="text-destructive focus:text-destructive">
                                <LogOut className="mr-2 h-4 w-4" />Log out
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                ) : (
                    <Button asChild className="w-full">
                      <Link href="/login">Sign In</Link>
                    </Button>
                )}
            </div>
            
             <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Rename Conversation</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">Name</Label>
                            <Input
                                id="name"
                                value={newChatName}
                                onChange={(e) => setNewChatName(e.target.value)}
                                className="col-span-3"
                                onKeyDown={(e) => { if (e.key === 'Enter') handleRename(); }}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                           <Button variant="outline">Cancel</Button>
                        </DialogClose>
                        <Button onClick={handleRename}>Save</Button>
                    </DialogFooter>
                </DialogContent>
             </Dialog>

        </div>
    );
  }

  // Main Header Variant
  return (
    <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur-sm">
      <div className="flex h-16 items-center justify-between px-4 md:px-8">
        <div className="flex items-center gap-2">
            <SidebarTrigger />
            <div className="md:hidden">
                <Logo />
            </div>
        </div>
        <div className="flex items-center gap-2">
            <UserProfileMenu />
        </div>
      </div>
    </header>
  );
}
