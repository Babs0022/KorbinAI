
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
import { Skeleton } from "@/components/ui/skeleton";
import { User, Settings, LogOut, FolderKanban, Bot, Sun, Moon, Monitor, CreditCard, FileText, Shield, Feather, Bolt, Image as ImageIcon, Code2, MessageSquare, Plus, MessageSquareText, MoreHorizontal, Pin, Trash2, Share, Pencil } from "lucide-react";
import { useSidebar, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarTrigger } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import Logo from "@/components/shared/Logo";
import { useSubscription } from "@/hooks/useSubscription";
import { Badge } from "../ui/badge";
import { useEffect, useState } from "react";
import { listRecentChatsForUser } from "@/services/chatService";
import type { ChatSession } from "@/types/chat";
import { formatDistanceToNow } from 'date-fns';
import { usePathname } from "next/navigation";


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

  useEffect(() => {
    if (user) {
      const unsubscribe = listRecentChatsForUser(user.uid, (chats) => {
        setRecentChats(chats);
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
                        <Plus />
                        <span className={cn("transition-opacity", state === 'collapsed' && !isMobile && 'opacity-0')}>New Chat</span>
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
        
        <div className="px-2 py-2 text-xs font-medium text-sidebar-foreground/70 group-data-[collapsible=icon]:hidden">
            Recents
        </div>
        <SidebarMenu>
             {recentChats.map(chat => (
                <SidebarMenuItem key={chat.id}>
                    <SidebarMenuButton asChild tooltip={{children: chat.title, className: "max-w-xs truncate"}} isActive={pathname.includes(`/chat/${chat.id}`)}>
                        <Link href={`/chat/${chat.id}`} className="truncate w-full justify-start items-center">
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
                            <DropdownMenuItem><Pin className="mr-2 h-4 w-4"/>Pin</DropdownMenuItem>
                            <DropdownMenuItem><Pencil className="mr-2 h-4 w-4"/>Rename</DropdownMenuItem>
                            <DropdownMenuItem><Share className="mr-2 h-4 w-4"/>Share</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive"><Trash2 className="mr-2 h-4 w-4"/>Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                     </DropdownMenu>
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
