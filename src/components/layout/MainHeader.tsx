
"use client";

import Link from 'next/link';
import { Logo } from '@/components/shared/Logo';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Menu } from 'lucide-react';
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const renderNavLinks = (isMobile = false) =>
    navLinks.map((link) => (
      <Button
        key={link.label}
        variant="ghost"
        asChild
        className={cn(
          "text-sm font-medium transition-colors",
          isMobile ? "w-full justify-start" : "",
          isScrolled
            ? "text-foreground hover:text-foreground/80" // Darkest text for max contrast on light blurred bg
            : (pathname === link.href && !link.external // Over dark hero section
                ? "text-primary hover:text-primary/80" // Active link is primary
                : "text-muted-foreground hover:text-primary") // Inactive link is muted
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
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle>Navigation Menu</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col h-full py-4">
                <Logo className="mb-6 self-start px-0" onClick={closeMobileMenu}/>
                <nav className="flex flex-col space-y-1">
                  {renderNavLinks(true)}
                </nav>
                <div className="mt-auto flex flex-col space-y-2 pt-6">
                  <Button variant="outline" asChild className="w-full" onClick={closeMobileMenu}>
                     <Link href="/login">Login</Link>
                  </Button>
                  <Button variant="default" asChild className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" onClick={closeMobileMenu}>
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
