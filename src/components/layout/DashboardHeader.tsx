
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { User, Settings, LogOut, FolderKanban, Sun, Moon, Monitor, CreditCard, FileText, Shield, LifeBuoy, MoreHorizontal, Pin, Trash2, Share, Pencil, LayoutGrid, SquarePen, ShieldCheck, BadgeCheck, PanelLeft, Search, MessageSquare } from "lucide-react";
import { useSidebar, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarTrigger } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import Logo from "@/components/shared/Logo";
import { useSubscription } from "@/hooks/useSubscription";
import { Badge } from "../ui/badge";
import { useEffect, useState, useMemo } from "react";
import { listRecentChatsForUser, deleteChatSession, updateChatSessionMetadata } from "@/services/chatService";
import type { ChatSession } from "@/types/chat";
import { usePathname, useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";


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
  const { state, isMobile, toggleSidebar } = useSidebar();
  const [recentChats, setRecentChats] = useState<ChatSession[]>([]);
  const [isVerified, setIsVerified] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();

  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [chatToRename, setChatToRename] = useState<ChatSession | null>(null);
  const [newChatName, setNewChatName] = useState("");
  
  const [isSearchModeActive, setIsSearchModeActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (user) {
      const unsubscribeChats = listRecentChatsForUser(user.uid, (chats) => {
        // Sort chats to show pinned ones first, then by date
        const sortedChats = chats.sort((a, b) => {
          if (a.isPinned && !b.isPinned) return -1;
          if (!a.isPinned && b.isPinned) return 1;
          // Assuming updatedAt is a string that can be parsed into a Date
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        });
        setRecentChats(sortedChats);
      });
      
      const userDocRef = doc(db, 'users', user.uid);
      const unsubscribeUser = onSnapshot(userDocRef, (docSnap) => {
          setIsVerified(docSnap.data()?.isVerified === true);
      });
      
      const adminDocRef = doc(db, 'admins', user.uid);
      const unsubscribeAdmin = onSnapshot(adminDocRef, (docSnap) => {
          setIsAdmin(docSnap.exists());
      });

      return () => {
          unsubscribeChats();
          unsubscribeUser();
          unsubscribeAdmin();
      };
    }
  }, [user]);
  
  const filteredChats = useMemo(() => {
    if (!searchQuery) {
        return recentChats.slice(0, 5); // Show 5 most recent if no query
    }
    return recentChats.filter(chat =>
        chat.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, recentChats]);


  const getInitials = (name?: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() || 'U';
  };
  
  const handleDelete = async (chatId: string) => {
    try {
        await deleteChatSession(chatId);
        toast({ title: "Conversation Moved to Trash" });
        // If the user deleted the chat they are currently on, redirect them
        if (pathname.includes(chatId)) {
            router.push('/');
        }
    } catch (error) {
        toast({ variant: 'destructive', title: "Error", description: "Could not move conversation to trash." });
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
  
  const SearchMode = () => (
    <div className="flex-1 flex flex-col gap-2 p-2 overflow-y-auto">
        <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
                placeholder="Search conversations..." 
                className="pl-8" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />
        </div>
        <SidebarMenu className="flex-1 overflow-y-auto">
            {filteredChats.map((chat) => (
                <SidebarMenuItem key={chat.id}>
                    <SidebarMenuButton asChild isActive={pathname.includes(`/chat/${chat.id}`)}>
                        <Link href={`/chat/${chat.id}`} className="flex items-center gap-2 w-full justify-start">
                             <MessageSquare className="h-4 w-4 shrink-0" />
                             <span className="truncate">{chat.title}</span>
                        </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            ))}
            {searchQuery && filteredChats.length === 0 && (
                <div className="text-center p-4 text-sm text-muted-foreground">
                    No results found.
                </div>
            )}
        </SidebarMenu>
    </div>
  );
  
  const SidebarNav = () => (
    <div className="flex-1 flex flex-col gap-2 p-2 overflow-y-auto">
      <nav className="flex flex-col gap-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/">
                <SquarePen />
                <span
                  className={cn(
                    "transition-opacity",
                    state === "collapsed" && !isMobile && "opacity-0"
                  )}
                >
                  New Chat
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/hub">
                <LayoutGrid />
                <span
                  className={cn(
                    "transition-opacity",
                    state === "collapsed" && !isMobile && "opacity-0"
                  )}
                >
                  Creation Hub
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/dashboard/projects">
                <FolderKanban />
                <span
                  className={cn(
                    "transition-opacity",
                    state === "collapsed" && !isMobile && "opacity-0"
                  )}
                >
                  Projects
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </nav>

      <div
        className={cn(
          "px-2 py-2 text-xs font-medium text-sidebar-foreground/70 transition-opacity",
          state === "collapsed" && !isMobile && "opacity-0"
        )}
      >
        Recents
      </div>
      <SidebarMenu className="flex-1 overflow-y-auto">
        {recentChats.map((chat) => (
          <SidebarMenuItem key={chat.id}>
            <div className="relative flex items-center w-full group">
              <SidebarMenuButton
                asChild
                tooltip={{
                  children: chat.title,
                  className: "max-w-xs truncate",
                }}
                isActive={pathname.includes(`/chat/${chat.id}`)}
                className="flex-1 pr-8"
              >
                <Link
                  href={`/chat/${chat.id}`}
                  className="flex items-center gap-2 truncate w-full justify-start"
                >
                  {chat.isPinned && (
                    <Pin className="h-3 w-3 shrink-0 text-primary" />
                  )}
                  <span
                    className={cn(
                      "transition-opacity truncate",
                      state === "collapsed" && !isMobile && "opacity-0"
                    )}
                  >
                    {chat.title}
                  </span>
                </Link>
              </SidebarMenuButton>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-48">
                  <DropdownMenuItem onClick={() => handleTogglePin(chat)}>
                    <Pin className="mr-2 h-4 w-4" />
                    {chat.isPinned ? "Unpin" : "Pin"}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => openRenameDialog(chat)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleShare(chat.id)}>
                    <Share className="mr-2 h-4 w-4" />
                    Share
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => handleDelete(chat.id)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </div>
  );

  if (variant === 'sidebar') {
    return (
        <div className="flex flex-col h-full">
            <div className={cn(
                "flex items-center p-4 h-16",
                state === 'expanded' ? "justify-between" : "justify-center"
            )}>
                {state === 'expanded' ? (
                    <>
                        <Logo />
                        <div className="flex items-center">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsSearchModeActive(!isSearchModeActive)}>
                                <Search className="h-4 w-4" />
                            </Button>
                            <SidebarTrigger />
                        </div>
                    </>
                ) : (
                    <div
                        className="relative h-10 w-10 flex items-center justify-center group"
                        onClick={toggleSidebar}
                        onMouseEnter={(e) => e.currentTarget.querySelector('button')?.classList.remove('opacity-0')}
                        onMouseLeave={(e) => e.currentTarget.querySelector('button')?.classList.add('opacity-0')}
                    >
                        <Logo className="h-8 w-8 transition-opacity duration-200 group-hover:opacity-0" />
                        <SidebarTrigger className="absolute inset-0 size-full opacity-0 transition-opacity duration-200" />
                    </div>
                )}
            </div>
            <div className="flex-1 flex flex-col overflow-hidden">
                {isSearchModeActive ? <SearchMode /> : <SidebarNav />}
            </div>
            <div className="p-2 border-t border-transparent">
                {loading ? (
                    <div className="flex items-center gap-3 p-2">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <Skeleton className="h-4 w-24" />
                    </div>
                ) : user ? (
                     <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                             <Button variant="ghost" className="w-full justify-start items-center gap-3 p-2 h-auto">
                                <div className="relative">
                                    <Avatar className="h-10 w-10">
                                        <AvatarImage src={user.photoURL || undefined} alt={user.displayName || "User"} data-ai-hint="person avatar" />
                                        <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
                                    </Avatar>
                                     {isVerified && <BadgeCheck className="absolute -bottom-1 -right-1 h-5 w-5 text-primary bg-background rounded-full" />}
                                </div>
                                <div className={cn("text-left transition-opacity", state === 'collapsed' && !isMobile && 'opacity-0')}>
                                    <p className="text-sm font-medium leading-none flex items-center gap-1.5">
                                        {user.displayName}
                                        {isVerified && <BadgeCheck className="h-4 w-4 text-primary" />}
                                    </p>
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
    <header className="sticky top-0 z-30 border-b border-transparent bg-background">
      <div className="flex h-16 items-center justify-between px-4 md:px-8">
        <div className="flex items-center gap-2">
            <SidebarTrigger className="md:hidden" />
            <span className="hidden font-bold text-lg md:block">KorbinAI</span>
        </div>
        <div className="flex items-center gap-2">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 p-0 rounded-full">
                        <div className="relative">
                            <Avatar className="h-10 w-10">
                                <AvatarImage src={user?.photoURL || undefined} alt={user?.displayName || "User"} data-ai-hint="person avatar" />
                                <AvatarFallback>{getInitials(user?.displayName)}</AvatarFallback>
                            </Avatar>
                             {isVerified && <BadgeCheck className="absolute -bottom-1 -right-1 h-5 w-5 text-primary bg-background rounded-full" />}
                        </div>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                    <p className="text-sm font-medium leading-none flex items-center gap-1.5">
                        {user?.displayName}
                        {isVerified && <BadgeCheck className="h-4 w-4 text-primary" />}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground truncate pt-1">{user?.email}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                    <DropdownMenuItem asChild><Link href="/dashboard/account"><User className="mr-2 h-4 w-4" />Profile</Link></DropdownMenuItem>
                    <DropdownMenuItem asChild><Link href="/dashboard/settings"><Settings className="mr-2 h-4 w-4" />Settings</Link></DropdownMenuItem>
                    <DropdownMenuItem asChild><Link href="/dashboard/trash"><Trash2 className="mr-2 h-4 w-4" />Trash</Link></DropdownMenuItem>
                    {isAdmin && <DropdownMenuItem asChild><Link href="/dashboard/admin"><ShieldCheck className="mr-2 h-4 w-4" />Admin</Link></DropdownMenuItem>}
                    <DropdownMenuItem asChild disabled><Link href="/dashboard/billing"><CreditCard className="mr-2 h-4 w-4" />Pricing & Billing</Link></DropdownMenuItem>
                <DropdownMenuSeparator />
                    <DropdownMenuItem asChild><Link href="/dashboard/feedback"><LifeBuoy className="mr-2 h-4 w-4" />Feedback & Bugs</Link></DropdownMenuItem>
                    <DropdownMenuItem asChild><a href="https://korbinai.com/terms" target="_blank" rel="noopener noreferrer"><FileText className="mr-2 h-4 w-4" />Terms</a></DropdownMenuItem>
                    <DropdownMenuItem asChild><a href="https://korbinai.com/privacy" target="_blank" rel="noopener noreferrer"><Shield className="mr-2 h-4 w-4" />Privacy Policy</a></DropdownMenuItem>
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
        </div>
      </div>
    </header>
  );
}
