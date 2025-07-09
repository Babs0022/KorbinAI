import Link from "next/link";
import { Suspense } from 'react';
import { ArrowLeft } from "lucide-react";
import ChatClient from "@/components/features/chat/ChatClient";

export default function ChatPage() {
  return (
    <main className="flex h-screen flex-col">
      <header className="shrink-0 border-b">
        <div className="container mx-auto flex h-16 max-w-4xl items-center px-4 md:px-0">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Creation Hub
          </Link>
        </div>
      </header>
      <div className="flex-1 overflow-hidden">
        <Suspense fallback={<div className="flex h-full items-center justify-center">Loading Chat...</div>}>
            <ChatClient />
        </Suspense>
      </div>
    </main>
  );
}
