import type { ReactNode } from 'react';
import Link from 'next/link';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Link href="/" className="text-2xl font-bold text-foreground">
            BrieflyAI
          </Link>
        </div>
        {children}
      </div>
    </main>
  );
}
