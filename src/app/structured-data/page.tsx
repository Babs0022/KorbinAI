
import Link from "next/link";
import { Suspense } from 'react';
import { ArrowLeft } from "lucide-react";
import StructuredDataClient from "@/components/features/structured-data/StructuredDataClient";

export default function StructuredDataPage() {
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
            Briefly for Analysts
          </h1>
          <p className="mb-12 text-lg text-muted-foreground">
            Describe the data you need, and I'll generate and refine it with you.
          </p>
        </div>
        
        <Suspense fallback={<div>Loading...</div>}>
            <StructuredDataClient />
        </Suspense>

      </div>
    </main>
  );
}
