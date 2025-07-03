
import type { Metadata } from 'next';
import { Toaster } from "@/components/ui/toaster";
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { AppFonts } from '@/components/shared/AppFonts';

export const metadata: Metadata = {
  title: 'BrieflyAI - Build & Ship with AI',
  description: 'BrieflyAI helps non-technical creatives and developers turn ideas into tangible products. Build apps, websites, and more with AI-guided assistance.',
  manifest: '/manifest.json',
  themeColor: '#804dff', // Set to dark mode accent color for better PWA themeing
  icons: {
    icon: '/logo.svg',
    shortcut: '/logo.svg',
    apple: '/logo.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <AppFonts />
      </head>
      <body className="font-body" suppressHydrationWarning={true}>
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
