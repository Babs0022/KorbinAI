
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/shared/Logo';
import { Button, buttonVariants } from '@/components/ui/button';
import { LayoutDashboard, UserCircle, Settings, ScrollText, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext'; // For logout functionality
import { useToast } from '@/hooks/use-toast';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';


// Simplified sidebar for mobile header navigation, focusing on core app sections
const sidebarNavItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/create-prompt', label: 'New Prompt', icon: ScrollText },
  { href: '/dashboard/account', label: 'Account', icon: UserCircle },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

interface DashboardSidebarProps {
  className?: string;
  onLinkClick?: () => void; // For closing mobile sidebar
}

export function DashboardSidebar({ className, onLinkClick }: DashboardSidebarProps) {
  const pathname = usePathname();
  const { toast } = useToast();
  const router = useRouter();

  const handleLogout = async () => {
    if (onLinkClick) onLinkClick(); // Close sidebar if open
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
    <aside className={cn("h-full flex flex-col bg-card/80 dark:bg-card/60 border-r border-border/50", className)}>
      <div className="p-4 border-b border-border/50">
        <Logo />
      </div>
      <nav className="flex-grow p-4 space-y-2">
        {sidebarNavItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={onLinkClick}
            className={cn(
              buttonVariants({ variant: 'ghost' }),
              'w-full justify-start text-left',
              pathname === item.href
                ? 'bg-primary/10 text-primary hover:bg-primary/20'
                : 'hover:bg-muted/50 text-muted-foreground hover:text-foreground'
            )}
          >
            <item.icon className="mr-3 h-5 w-5" />
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="p-4 mt-auto border-t border-border/50">
        <Button variant="outline" className="w-full" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" /> Logout
        </Button>
      </div>
    </aside>
  );
}

    