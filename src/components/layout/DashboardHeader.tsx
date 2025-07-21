
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
import { LayoutGrid, User, Settings, LogOut, FolderKanban, Bot, PanelLeft, Sun, Moon, Monitor, UserPlus, Feather, Bolt, Image as ImageIcon, Code2, CreditCard, FileText, Shield } from "lucide-react";
import { SidebarTrigger, useSidebar, SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import Logo from "@/components/shared/Logo";
import { useSubscription } from "@/hooks/useSubscription";
import { Badge } from "../ui/badge";

interface DashboardHeaderProps {
    variant?: 'main' | 'sidebar';
}

function ThemeToggle() {
    const { setTheme, theme } = useTheme();

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
        >
            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
        </Button>
    )
}

function MenuThemeToggle() {
    const { setTheme, theme } = useTheme();
    return (
        <div className="flex items-center justify-between px-2 py-1.5">
            <span className="text-sm">Theme</span>
            <div className="flex items-center rounded-md bg-secondary p-1">
                 <Button 
                    variant={theme === 'light' ? 'default' : 'ghost'} 
                    size="sm" 
                    className="h-7 px-2"
                    onClick={() => setTheme("light")}
                >
                    L
                </Button>
                 <Button 
                    variant={theme === 'dark' ? 'default' : 'ghost'} 
                    size="sm" 
                    className="h-7 px-2"
                    onClick={() => setTheme("dark")}
                >
                    D
                </Button>
                 <Button 
                    variant={theme === 'system' ? 'default' : 'ghost'} 
                    size="sm" 
                    className="h-7 px-2"
                    onClick={() => setTheme("system")}
                >
                    S
                </Button>
            </div>
        </div>
    )
}


export default function DashboardHeader({ variant = 'main' }: DashboardHeaderProps) {
  const { user, logout, loading } = useAuth();
  const { subscription } = useSubscription();
  const { state, isMobile } = useSidebar();

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
      return <Skeleton className="h-10 w-10 rounded-md" />
    }
    if (user) {
      return (
         <DropdownMenu>
            <DropdownMenuTrigger asChild>
                 <Button variant="ghost" className="relative h-10 w-10 p-0">
                    <Avatar className="h-10 w-10">
                        <AvatarImage src={user.photoURL || undefined} alt={user.displayName || "User"} data-ai-hint="person avatar" />
                        <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
                    </Avatar>
                 </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64" align="end" forceMount>
               <DropdownMenuLabel className="font-normal">
                 <p className="text-xs leading-none text-muted-foreground truncate">{user.email}</p>
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
                <UserPlus className="mr-2 h-4 w-4" />
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
                        <LayoutGrid />
                        <span className={cn("transition-opacity", state === 'collapsed' && !isMobile && 'opacity-0')}>Dashboard</span>
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
             <SidebarMenuItem>
                <SidebarMenuButton asChild>
                    <Link href="/dashboard/agent-logs">
                        <Bot />
                        <span className={cn("transition-opacity", state === 'collapsed' && !isMobile && 'opacity-0')}>Agent Logs</span>
                    </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
        </SidebarMenu>

        <SidebarGroup>
            <SidebarGroupLabel>Tools</SidebarGroupLabel>
            <SidebarMenu>
                 <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip={{children: 'Written Content'}}>
                        <Link href="/written-content">
                            <Feather />
                            <span className={cn("transition-opacity", state === 'collapsed' && !isMobile && 'opacity-0')}>Written Content</span>
                        </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip={{children: 'Prompt Generator'}}>
                        <Link href="/prompt-generator">
                            <Bolt />
                            <span className={cn("transition-opacity", state === 'collapsed' && !isMobile && 'opacity-0')}>Prompt Generator</span>
                        </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip={{children: 'Image Generator'}}>
                        <Link href="/image-generator">
                            <ImageIcon />
                            <span className={cn("transition-opacity", state === 'collapsed' && !isMobile && 'opacity-0')}>Image Generator</span>
                        </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip={{children: 'Structured Data'}}>
                        <Link href="/structured-data">
                            <Code2 />
                            <span className={cn("transition-opacity", state === 'collapsed' && !isMobile && 'opacity-0')}>Structured Data</span>
                        </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
        </SidebarGroup>
    </nav>
  );

  if (variant === 'sidebar') {
    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between gap-2 p-4 border-b">
                 <Logo />
                <div className={cn("transition-opacity", state === 'collapsed' && !isMobile && 'opacity-0')}>
                    <ThemeToggle />
                </div>
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
            <SidebarTrigger>
                <Button variant="ghost" size="icon">
                    <PanelLeft />
                    <span className="sr-only">Toggle Sidebar</span>
                </Button>
            </SidebarTrigger>
            <div className="md:hidden">
                <Logo />
            </div>
            <div className="h-6 border-l mx-2 hidden md:block"></div>
            <div className="hidden md:block">
                <Logo />
            </div>
        </div>
        <div className="flex items-center gap-2">
            <ThemeToggle />
            <UserProfileMenu />
        </div>
      </div>
    </header>
  );
}
