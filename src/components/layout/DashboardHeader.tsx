
"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/shared/Logo';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LayoutGrid, LogOut, PlusCircle, Settings, UserCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { useEffect, useState } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';


export function DashboardHeader() {
  const router = useRouter();
  const { toast } = useToast();
  // This state will be replaced by an Auth Context later
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);

  // Placeholder user data - this will be updated by the auth state
  const [displayName, setDisplayName] = useState("User");
  const [displayEmail, setDisplayEmail] = useState("user@example.com");
  const [avatarUrl, setAvatarUrl] = useState("https://placehold.co/40x40.png");
  const [userInitials, setUserInitials] = useState("U");

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      setCurrentUser(user);
      if (user) {
        setDisplayName(user.displayName || user.email?.split('@')[0] || "User");
        setDisplayEmail(user.email || "user@example.com");
        setAvatarUrl(user.photoURL || "https://placehold.co/40x40.png");
        setUserInitials(
          (user.displayName?.split(" ").map(n => n[0]).join("") || 
           user.email?.charAt(0) || 
           "U"
          ).toUpperCase()
        );
      } else {
        // Reset to placeholders if not logged in, though ideally this header isn't shown
        setDisplayName("User");
        setDisplayEmail("user@example.com");
        setAvatarUrl("https://placehold.co/40x40.png");
        setUserInitials("U");
      }
    });
    return () => unsubscribe();
  }, []);


  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({ title: "Logged Out", description: "You have been successfully logged out."});
      router.push('/login');
    } catch (error) {
      console.error("Logout error:", error);
      toast({ title: "Logout Failed", description: "Could not log out. Please try again.", variant: "destructive"});
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <Logo />
        <nav className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard">
              <LayoutGrid className="mr-2 h-4 w-4" /> Dashboard
            </Link>
          </Button>
          <Button variant="default" size="sm" asChild className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <Link href="/create-prompt">
              <PlusCircle className="mr-2 h-4 w-4" /> Create Prompt
            </Link>
          </Button>
          
          {currentUser ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={avatarUrl} alt={displayName} data-ai-hint="user avatar" />
                    <AvatarFallback>{userInitials}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{displayName}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {displayEmail}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push('/dashboard/account')}>
                  <UserCircle className="mr-2 h-4 w-4" />
                  Account
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/dashboard/settings')}>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
             <Button variant="outline" size="sm" asChild>
                <Link href="/login">Login</Link>
              </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
