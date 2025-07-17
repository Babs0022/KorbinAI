
import { Suspense } from 'react';
import ChatClient from "@/components/features/chat/ChatClient";

export default function ChatPage() {
  return (
    <main className="min-h-screen">
      <Suspense fallback={<div className="flex h-screen items-center justify-center">Loading...</div>}>
          <ChatClient />
      </Suspense>
    </main>
  );
}
