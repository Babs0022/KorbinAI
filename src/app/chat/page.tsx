
import Link from "next/link";
import { Suspense } from 'react';
import { ArrowLeft } from "lucide-react";
import ChatClient from "@/components/features/chat/ChatClient";

export default function ChatPage() {
  return (
    <main className="flex min-h-screen flex-col items-center p-4 md:p-8">
      <div className="w-full max-w-4xl">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Creation Hub
        </Link>

        <div className="text-center">
          <h1 className="mb-2 text-4xl font-bold md:text-5xl">
            Chat with Briefly
          </h1>
          <p className="mb-12 text-lg text-muted-foreground">
            Your conversational AI assistant. Ask me anything!
          </p>
        </div>
        
        <Suspense fallback={<div>Loading...</div>}>
            <ChatClient />
        </Suspense>

      </div>
    </main>
  );
}
