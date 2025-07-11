
import type { ReactNode } from 'react';
import { SidebarProvider, Sidebar, SidebarInset } from "@/components/ui/sidebar";
import DashboardHeader from './DashboardHeader';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <Sidebar>
        <DashboardHeader variant="sidebar" />
      </Sidebar>
      <SidebarInset>
        <DashboardHeader variant="main" />
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
