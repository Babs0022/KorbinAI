
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
import { LayoutGrid, User, Settings, LogOut, FolderKanban, CreditCard, FileText, Shield, PanelLeft, Sun, Moon, Mail, UserPlus, Bot } from "lucide-react";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "next-themes";
import Logo from "@/components/shared/Logo";

interface DashboardHeaderProps {
    variant?: 'main' | 'sidebar';
}

const XIcon = (props: React.ComponentProps<'svg'>) => (
    <svg
      role="img"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className="h-4 w-4 fill-current"
      {...props}
    >
      <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.931ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
    </svg>
);


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


export default function DashboardHeader({ variant = 'main' }: DashboardHeaderProps) {
  const { user, logout, loading } = useAuth();
  const { state } = useSidebar();
  const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'elijah@brieflyai.xyz';

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
                        <AvatarImage src={user.photoURL || undefined} alt={user.displayName || "User"} />
                        <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
                    </Avatar>
                 </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
               <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user.displayName}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                </div>
              </DropdownMenuLabel>
               <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                    <Link href="/dashboard/account"><User className="mr-2 h-4 w-4" />Account</Link>
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={logout} className="text-destructive focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />Log out
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
        <Link href="/" className="flex items-center gap-3 p-2 rounded-md hover:bg-accent">
            <LayoutGrid />
            <span className={cn("transition-opacity", state === 'collapsed' && 'opacity-0')}>Dashboard</span>
        </Link>
        <Link href="/dashboard/projects" className="flex items-center gap-3 p-2 rounded-md hover:bg-accent">
            <FolderKanban />
            <div className={cn("flex w-full items-center justify-between transition-opacity", state === 'collapsed' && 'opacity-0')}>
              <span>Projects</span>
            </div>
        </Link>
        <Link href="/dashboard/agent-logs" className="flex items-center gap-3 p-2 rounded-md hover:bg-accent">
            <Bot />
            <div className={cn("flex w-full items-center justify-between transition-opacity", state === 'collapsed' && 'opacity-0')}>
              <span>Agent Logs</span>
            </div>
        </Link>
        <div className="flex items-center gap-3 p-2 rounded-md text-muted-foreground/50 cursor-not-allowed relative">
            <CreditCard />
            <div className={cn("flex w-full items-center justify-between transition-opacity", state === 'collapsed' && 'opacity-0')}>
              <span>Billing</span>
               <Badge variant="secondary" className="absolute right-2 top-1/2 -translate-y-1/2">Soon</Badge>
            </div>
        </div>
        <Link href="/dashboard/account" className="flex items-center gap-3 p-2 rounded-md hover:bg-accent">
            <User />
            <span className={cn("transition-opacity", state === 'collapsed' && 'opacity-0')}>Account</span>
        </Link>
        <Link href="/dashboard/settings" className="flex items-center gap-3 p-2 rounded-md hover:bg-accent">
            <Settings />
            <span className={cn("transition-opacity", state === 'collapsed' && 'opacity-0')}>Settings</span>
        </Link>
        
        <Separator className="my-2" />

        <a href="https://brieflyai.xyz/terms" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-2 rounded-md hover:bg-accent">
            <FileText />
            <span className={cn("transition-opacity", state === 'collapsed' && 'opacity-0')}>Terms of Service</span>
        </a>
        <a href="https://brieflyai.xyz/privacy" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-2 rounded-md hover:bg-accent">
            <Shield />
            <span className={cn("transition-opacity", state === 'collapsed' && 'opacity-0')}>Privacy Policy</span>
        </a>

        <Separator className="my-2" />

         <a href="https://x.com/trybrieflyai" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-2 rounded-md hover:bg-accent">
            <XIcon />
            <span className={cn("transition-opacity", state === 'collapsed' && 'opacity-0')}>Follow on X</span>
        </a>
         <a href={`mailto:${supportEmail}`} className="flex items-center gap-3 p-2 rounded-md hover:bg-accent">
            <Mail />
            <span className={cn("transition-opacity", state === 'collapsed' && 'opacity-0')}>Contact Support</span>
        </a>
    </nav>
  );

  if (variant === 'sidebar') {
    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between gap-2 p-4 border-b">
                 <Logo />
                <div className={cn("transition-opacity", state === 'collapsed' && 'opacity-0')}>
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
