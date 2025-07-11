
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
import { Home, LayoutGrid, User, Settings, LogOut, FolderKanban, CreditCard, MessageSquare } from "lucide-react";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

interface DashboardHeaderProps {
    variant?: 'main' | 'sidebar';
}

export default function DashboardHeader({ variant = 'main' }: DashboardHeaderProps) {
  const { user, logout, loading } = useAuth();
  const { state } = useSidebar();

  const getInitials = (name?: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const SidebarNav = () => (
    <nav className="flex flex-col gap-2 p-2">
        <Link href="/" className="flex items-center gap-3 p-2 rounded-md hover:bg-accent">
            <LayoutGrid />
            <span className={cn("transition-opacity", state === 'collapsed' && 'opacity-0')}>Dashboard</span>
        </Link>
        <Link href="/chat" className="flex items-center gap-3 p-2 rounded-md hover:bg-accent">
            <MessageSquare />
            <span className={cn("transition-opacity", state === 'collapsed' && 'opacity-0')}>Chat</span>
        </Link>
        <Link href="/dashboard/projects" className="flex items-center gap-3 p-2 rounded-md hover:bg-accent">
            <FolderKanban />
            <span className={cn("transition-opacity", state === 'collapsed' && 'opacity-0')}>Projects</span>
        </Link>
        <Link href="/dashboard/billing" className="flex items-center gap-3 p-2 rounded-md hover:bg-accent">
            <CreditCard />
            <span className={cn("transition-opacity", state === 'collapsed' && 'opacity-0')}>Billing</span>
        </Link>
        <Link href="/dashboard/account" className="flex items-center gap-3 p-2 rounded-md hover:bg-accent">
            <User />
            <span className={cn("transition-opacity", state === 'collapsed' && 'opacity-0')}>Account</span>
        </Link>
        <Link href="/dashboard/settings" className="flex items-center gap-3 p-2 rounded-md hover:bg-accent">
            <Settings />
            <span className={cn("transition-opacity", state === 'collapsed' && 'opacity-0')}>Settings</span>
        </Link>
    </nav>
  );

  if (variant === 'sidebar') {
    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center gap-2 p-4 border-b">
                 <Link href="/" className="text-xl font-bold text-foreground">
                    BrieflyAI
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
                                    <AvatarImage src={user.photoURL || undefined} alt={user.displayName || "User"} />
                                    <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
                                </Avatar>
                                <div className={cn("text-left transition-opacity", state === 'collapsed' && 'opacity-0')}>
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
    <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur-sm">
      <div className="flex h-16 items-center justify-between px-4 md:px-8">
        <div className="flex items-center gap-2">
            <SidebarTrigger className="md:hidden" />
            <div className="hidden md:block">
                <SidebarTrigger />
            </div>
            <div className="h-6 border-l mx-2 hidden md:block"></div>
            <h1 className="text-lg font-semibold">Dashboard</h1>
        </div>
        
        {/* User menu for main header is now in the sidebar */}
      </div>
    </header>
  );
}
