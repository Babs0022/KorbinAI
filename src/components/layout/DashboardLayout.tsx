
"use client";

import type { ReactNode } from 'react';
import { useState, useEffect } from 'react';
import { SidebarProvider, Sidebar, SidebarInset } from "@/components/ui/sidebar";
import DashboardHeader from './DashboardHeader';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [isBannerVisible, setIsBannerVisible] = useState(false);

  useEffect(() => {
    // Only show the banner if it hasn't been dismissed in the current session
    if (sessionStorage.getItem('isBetaBannerDismissed') !== 'true') {
      setIsBannerVisible(true);
    }
  }, []);

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
