
"use client";

import type { ReactNode } from 'react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SidebarProvider, Sidebar, SidebarInset } from "@/components/ui/sidebar";
import DashboardHeader from './DashboardHeader';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [isBannerVisible, setIsBannerVisible] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Only show the banner if it hasn't been dismissed in the current session
    if (sessionStorage.getItem('isBetaBannerDismissed') !== 'true') {
      setIsBannerVisible(true);
    }
  }, []);
  
  // Keyboard shortcut handler
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
        // Use event.metaKey for Command on Mac and event.ctrlKey for Control on Windows/Linux
        const isModifierKeyPressed = event.metaKey || event.ctrlKey;

        if (isModifierKeyPressed) {
            switch (event.key.toLowerCase()) {
                case 'k':
                    event.preventDefault();
                    router.push('/');
                    break;
                case 'h':
                    event.preventDefault();
                    router.push('/hub');
                    break;
                case 'p':
                    event.preventDefault();
                    router.push('/dashboard/projects');
                    break;
                case 'i':
                    event.preventDefault();
                    router.push('/dashboard/feedback');
                    break;
            }
        }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    // Cleanup the event listener on component unmount
    return () => {
        window.removeEventListener('keydown', handleKeyDown);
    };
  }, [router]);

  const handleDismissBanner = () => {
    sessionStorage.setItem('isBetaBannerDismissed', 'true');
    setIsBannerVisible(false);
  };

  return (
    <SidebarProvider>
      <Sidebar>
        <DashboardHeader variant="sidebar" />
      </Sidebar>
      <SidebarInset>
        <DashboardHeader variant="main" />
        {isBannerVisible && (
          <div className="relative w-full bg-amber-500/10 border-b border-amber-500/20 text-amber-200 text-center text-sm p-2 flex items-center justify-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>Briefly is currently in beta and some functions may fail, proceed with caution.</span>
            <Button variant="ghost" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 text-amber-200 hover:bg-amber-500/20" onClick={handleDismissBanner}>
                <X className="h-4 w-4" />
            </Button>
          </div>
        )}
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
