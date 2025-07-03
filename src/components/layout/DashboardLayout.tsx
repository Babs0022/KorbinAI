import type { ReactNode } from 'react';
import DashboardHeader from './DashboardHeader';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <DashboardHeader />
      {children}
    </div>
  );
}
