
"use client";

import { Suspense } from 'react';
import DashboardLayout from "@/components/layout/DashboardLayout";
import ChatClient from "@/components/features/chat/ChatClient";

export default function HomePage() {
  return (
    <DashboardLayout>
      <main className="flex-1 flex flex-col">
        <Suspense fallback={<div className="flex flex-1 items-center justify-center">Loading...</div>}>
          <ChatClient />
        </Suspense>
      </main>
    </DashboardLayout>
  );
}
