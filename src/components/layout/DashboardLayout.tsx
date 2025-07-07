import type { ReactNode } from 'react';
import DashboardHeader from './DashboardHeader';
import Footer from './Footer';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <DashboardHeader />
      {children}
      <Footer />
    </div>
  );
}
