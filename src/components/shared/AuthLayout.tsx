
import type { ReactNode } from 'react';

export default function AuthLayout({
  children,
}: {
  children: React.Node;
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {children}
      </div>
    </main>
  );
}
