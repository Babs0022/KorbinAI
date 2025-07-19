
import { Suspense } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import ChatClient from "@/components/features/chat/ChatClient";

export default function ChatPage() {
  return (
    <div className="flex flex-col h-screen">
        <div className="w-full max-w-4xl mx-auto px-4 pt-4 md:pt-8">
             <Link
                href="/"
                className="mb-4 inline-flex items-center gap-2 text-muted-foreground hover:text-foreground"
                >
                <ArrowLeft className="h-4 w-4" />
                Back to Creation Hub
            </Link>
        </div>
        <main className="flex-1 overflow-hidden">
            <Suspense fallback={<div className="flex h-full items-center justify-center">Loading...</div>}>
                <ChatClient />
            </Suspense>
        </main>
    </div>
  );
}
