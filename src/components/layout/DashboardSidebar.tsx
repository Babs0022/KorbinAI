
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/shared/Logo';
import { Button, buttonVariants } from '@/components/ui/button';
import { Archive, Settings2, School, Undo2, LayoutDashboard, ScrollText, Rocket } from 'lucide-react';

const sidebarNavItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/prompt-vault', label: 'Prompt Vault', icon: Archive },
  { href: '/dashboard/refinement-hub', label: 'Refinement Hub', icon: Settings2 },
  { href: '/dashboard/academy', label: 'Prompt Academy', icon: School },
  { href: '/dashboard/reverse-prompting', label: 'Reverse Prompting', icon: Undo2 },
];

interface DashboardSidebarProps {
  className?: string;
  onLinkClick?: () => void; // For closing mobile sidebar
}

export function DashboardSidebar({ className, onLinkClick }: DashboardSidebarProps) {
  const pathname = usePathname();

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
        <Button variant="outline" className="w-full" asChild>
            <Link href="/create-prompt" onClick={onLinkClick}>
                <Rocket className="mr-2 h-4 w-4" /> New Prompt
            </Link>
        </Button>
      </div>
    </aside>
  );
}
