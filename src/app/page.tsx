
"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import ChatClient from "@/components/features/chat/ChatClient";
import { Suspense } from "react";

export default function HomePage() {
  return (
    <DashboardLayout>
      <main className="flex-1">
        <Suspense fallback={<div className="flex h-full items-center justify-center">Loading Chat...</div>}>
            <ChatClient />
        </Suspense>
      </main>
    </DashboardLayout>
  );
}
