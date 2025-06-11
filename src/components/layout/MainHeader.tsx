"use client";

import Link from 'next/link';
import { Logo } from '@/components/shared/Logo';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, Settings } from 'lucide-react'; // Using Settings as a placeholder for "How it Works" or a generic icon.
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import React from 'react';

const navLinks = [
  { href: '/#how-it-works', label: 'How It Works' },
  { href: '/#use-cases', label: 'Use Cases' },
  { href: '/#pricing', label: 'Pricing' },
  { href: '/#about-founder', label: 'About Founder' },
  { href: 'https://discord.gg/your-discord-invite', label: 'Join Discord', external: true },
];

export function MainHeader() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const renderNavLinks = (isMobile = false) =>
    navLinks.map((link) => (
      <Button
        key={link.label}
        variant="ghost"
        asChild
        className={cn(
          "text-sm font-medium transition-colors hover:text-primary",
          isMobile ? "w-full justify-start" : "",
          pathname === link.href && !link.external ? "text-primary" : "text-muted-foreground"
        )}
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
        "sticky top-0 z-50 w-full border-b border-transparent transition-all duration-300",
        isScrolled ? "border-border/40 bg-background/80 backdrop-blur-lg" : "bg-transparent"
      )}
    >
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <Logo />
        <nav className="hidden items-center space-x-2 md:flex">
          {renderNavLinks()}
          <Button variant="outline" asChild>
            <Link href="/login">Login</Link>
          </Button>
          <Button variant="default" asChild className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <Link href="/signup">Sign Up</Link>
          </Button>
        </nav>
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <div className="flex flex-col space-y-4 p-4">
                <Logo className="mb-4 self-start" />
                {renderNavLinks(true)}
                <div className="mt-4 flex flex-col space-y-2">
                  <Button variant="outline" asChild className="w-full">
                     <Link href="/login">Login</Link>
                  </Button>
                  <Button variant="default" asChild className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                    <Link href="/signup">Sign Up</Link>
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
