import Link from "next/link";
import { Suspense } from 'react';
import { ArrowLeft } from "lucide-react";
import ChatClient from "@/components/features/chat/ChatClient";

export default function ChatPage() {
  return (
    <main className="flex h-screen flex-col items-center">
      <div className="flex-1 w-full max-w-4xl flex flex-col p-4 md:p-8 overflow-hidden">
        <Link
          href="/"
          className="mb-4 inline-flex items-center gap-2 text-muted-foreground hover:text-foreground shrink-0"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Creation Hub
        </Link>
        <Suspense fallback={<div className="flex-1 flex items-center justify-center">Loading Chat...</div>}>
            <ChatClient />
        </Suspense>
      </div>
    </main>
  );
}
