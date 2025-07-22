
"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import ChatClient from "@/components/features/chat/ChatClient";

export default function HomePage() {
  return (
    <DashboardLayout>
      <main className="flex-1 flex flex-col">
        {/* Render ChatClient directly for a new chat session */}
        <ChatClient />
      </main>
    </DashboardLayout>
  );
}
