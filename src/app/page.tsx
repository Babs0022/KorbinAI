
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from "@/components/layout/DashboardLayout";
import { LoaderCircle } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to a new chat session immediately
    router.replace('/chat/new');
  }, [router]);

  return (
    <DashboardLayout>
      <main className="flex-1 flex flex-col items-center justify-center">
        <LoaderCircle className="h-8 w-8 animate-spin" />
        <p className="mt-4 text-muted-foreground">Starting a new chat...</p>
      </main>
    </DashboardLayout>
  );
}
