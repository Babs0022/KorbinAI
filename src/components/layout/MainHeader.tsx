
"use client";

import Link from 'next/link';
import { Logo } from '@/components/shared/Logo';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Menu, Loader2, UserCircle, LayoutGrid, LogOut } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation'; 
import { cn } from '@/lib/utils';
import React, { useState, useEffect } from 'react'; 
import { useAuth } from '@/contexts/AuthContext'; 
import { signOut } from 'firebase/auth'; 
import { auth } from '@/lib/firebase'; 
import { useToast } from '@/hooks/use-toast'; 
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const navLinks = [
  { href: '/#features', label: 'Features' },
  { href: '/#solutions', label: 'Solutions' },
  { href: '/#pricing', label: 'Pricing' },
  { href: '/#faq', label: 'FAQ' },
  { href: 'https://discord.gg/8muUf5Nzb4', label: 'Join Discord', external: true },
];

export function MainHeader() {
  const pathname = usePathname();
  const router = useRouter(); 
  const { toast } = useToast(); 
  const { currentUser, loading: authLoading, displayName, avatarUrl, userInitials, displayEmail } = useAuth(); 
  const [isScrolled, setIsScrolled] = React.useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({ title: "Logged Out", description: "You have been successfully logged out."});
      router.push('/'); 
    } catch (error) {
      console.error("Logout error:", error);
      toast({ title: "Logout Failed", description: "Could not log out. Please try again.", variant: "destructive"});
    }
  };

  // Determine if header should use dark text (for light backgrounds) or light text (for dark backgrounds)
  // It should use dark text if scrolled, if user is logged in, or if not on homepage OR if on homepage hero (which is now light)
  const useDarkText = isScrolled || currentUser || pathname !== '/';

  const renderNavLinks = (isMobile = false) =>
    navLinks.map((link) => (
      <Button
        key={link.label}
        variant="ghost"
        asChild
        className={cn(
          "text-sm font-medium transition-colors",
          isMobile ? "w-full justify-start" : "",
          useDarkText 
            ? "text-foreground hover:text-foreground/80" 
            : (pathname === link.href && !link.external && pathname === '/'
                ? "text-primary hover:text-primary/80" // Active link on light hero
                : "text-muted-foreground hover:text-foreground") // Default link on light hero
        )}
        onClick={() => isMobile && closeMobileMenu()}
      >
        {link.external ? (
          <a href={link.href} target="_blank" rel="noopener noreferrer">
            {link.label}
          </a>
        ) : (
          <Link href={link.href}>{link.label}</Link>
        )}
      </Button>
    ));

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b transition-all duration-300",
        useDarkText ? "border-border/40 bg-background/80 backdrop-blur-lg" : "border-transparent bg-transparent"
      )}
    >
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <Logo className={cn(useDarkText ? "text-primary" : "text-primary")} /> {/* Always primary color now for hero */}
        <nav className="hidden items-center space-x-1 md:flex">
          {renderNavLinks()}
          {authLoading ? (
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          ) : currentUser ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={avatarUrl} alt={displayName} data-ai-hint="user avatar"/>
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
                 <DropdownMenuItem onClick={() => router.push('/dashboard')}>
                  <LayoutGrid className="mr-2 h-4 w-4" />
                  Dashboard
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild className={cn( useDarkText ? "text-foreground hover:bg-accent/50" : "text-muted-foreground hover:bg-muted/20 hover:text-foreground")}>
                <Link href="/login">Login</Link>
              </Button>
              <Button variant="default" size="sm" asChild className="bg-accent hover:bg-accent/90 text-accent-foreground">
                <Link href="/signup">Sign Up</Link>
              </Button>
            </>
          )}
        </nav>
        <div className="md:hidden">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className={cn(useDarkText ? "text-primary" : "text-primary")}> {/* Always primary for mobile menu icon */}
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader className="mb-6 sr-only"> 
                <SheetTitle><Logo onClick={closeMobileMenu}/></SheetTitle>
              </SheetHeader>
              <div className="flex flex-col h-full py-4">
                 <div className="mb-6 px-2">
                    <Logo onClick={closeMobileMenu}/>
                </div>
                <nav className="flex flex-col space-y-1">
                  {renderNavLinks(true)}
                </nav>
                <div className="mt-auto flex flex-col space-y-2 pt-6">
                  {authLoading ? (
                     <div className="flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
                  ) : currentUser ? (
                    <>
                     <Button variant="outline" asChild className="w-full" onClick={closeMobileMenu}>
                        <Link href="/dashboard">Go to Dashboard</Link>
                     </Button>
                     <Button variant="destructive" className="w-full" onClick={() => { handleLogout(); closeMobileMenu(); }}>
                        Logout
                     </Button>
                    </>
                  ) : (
                    <>
                      <Button variant="outline" asChild className="w-full" onClick={closeMobileMenu}>
                         <Link href="/login">Login</Link>
                      </Button>
                      <Button variant="default" asChild className="w-full" onClick={closeMobileMenu}>
                        <Link href="/signup">Sign Up</Link>
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
