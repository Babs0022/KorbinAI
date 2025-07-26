
import type { ReactNode } from 'react';
import { SidebarProvider, Sidebar, SidebarInset } from "@/components/ui/sidebar";
import DashboardHeader from './DashboardHeader';
import { AlertTriangle } from 'lucide-react';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <Sidebar>
        <DashboardHeader variant="sidebar" />
      </Sidebar>
      <SidebarInset>
        <DashboardHeader variant="main" />
        <div className="w-full bg-amber-500/10 border-b border-amber-500/20 text-amber-200 text-center text-sm p-2 flex items-center justify-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            <span>Briefly is currently in beta and some functions may fail, proceed with caution.</span>
        </div>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
