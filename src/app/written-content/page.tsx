
import Link from "next/link";
import { Suspense } from 'react';
import { ArrowLeft } from "lucide-react";
import WrittenContentClient from "@/components/features/written-content/WrittenContentClient";

export default function WrittenContentPage() {
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
            Written Content Assistant
          </h1>
          <p className="mb-12 text-lg text-muted-foreground">
            Describe the content you want to create, and our AI will write and refine it with you.
          </p>
        </div>
        
        <Suspense fallback={<div>Loading...</div>}>
            <WrittenContentClient />
        </Suspense>

      </div>
    </main>
  );
}
