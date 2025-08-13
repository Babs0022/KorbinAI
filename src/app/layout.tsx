
import { Suspense } from 'react';
import type { Metadata } from 'next';
import { Instrument_Sans } from 'next/font/google';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from '@/components/ui/toaster';
import GoogleAnalytics from '@/components/GoogleAnalytics';
import './globals.css';

const instrumentSans = Instrument_Sans({ subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL('https://korbinai.com'),
  title: 'KorbinAI - An AI That Actually Gets It',
  description: 'KorbinAI is your AI co-pilot for turning ideas into products. Move seamlessly from brainstorming to building within a single, cohesive environment.',
  keywords: ['ai content creation', 'automation tools', 'ai copilot', 'content marketing', 'ai writing assistant', 'genkit', 'nextjs'],
  authors: [{ name: 'KorbinAI Team', url: 'https://korbinai.com' }],
  creator: 'KorbinAI',
  publisher: 'KorbinAI',
  
  manifest: '/manifest.json',

  icons: {
    icon: '/icon.png',
    shortcut: '/icon.png',
    apple: '/icon.png',
    other: {
      rel: 'apple-touch-icon-precomposed',
      url: '/icon.png',
    },
  },
  
  openGraph: {
    title: 'KorbinAI - An AI That Actually Gets It',
    description: 'Your AI co-pilot for turning ideas into products. Move seamlessly from brainstorming to building within a single, cohesive environment.',
    url: 'https://korbinai.com',
    siteName: 'KorbinAI',
    images: [
      {
        url: '/og-image.png', // This is the image that will be shown in the preview
        width: 1200,
        height: 630,
        alt: 'KorbinAI application interface showing the chat feature.',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  
  twitter: {
    card: 'summary_large_image',
    title: 'KorbinAI - An AI That Actually Gets It',
    description: 'Your AI co-pilot for turning ideas into products.',
    creator: '@korbinai', // Your X (Twitter) handle
    images: ['/og-image.png'], // This image will be used for Twitter cards
  },
  
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  
  verification: {
    google: 'your-google-site-verification-code', // You can replace this later
  },
  
  alternates: {
    canonical: 'https://korbinai.com',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={instrumentSans.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <Suspense fallback={null}>
              <GoogleAnalytics />
            </Suspense>
            {children}
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
