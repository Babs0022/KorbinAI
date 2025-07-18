
import { Suspense } from 'react';
import Link from 'next/link';
import { ArrowLeft, LoaderCircle } from 'lucide-react';
import type { GenerateAppInput } from '@/types/ai';
import ComponentResultDisplay from '@/components/wizards/ComponentResultDisplay';

export const dynamic = 'force-dynamic';

// A simple loading skeleton shown while the page and its initial data are loading
function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 text-center">
      <LoaderCircle className="h-12 w-12 animate-spin text-primary" />
      <h2 className="text-2xl font-bold">Initializing Generator...</h2>
      <p className="text-muted-foreground">Please wait a moment while we set up the AI architect.</p>
    </div>
  );
}

// The page component that wraps everything in Suspense
export default function ResultPage({
  searchParams,
}: {
  searchParams: GenerateAppInput;
}) {
  return (
    <main className="flex min-h-screen flex-col items-center p-4 md:p-8">
      <div className="w-full max-w-6xl">
        <Link
          href="/component-wizard"
          className="mb-8 inline-flex items-center gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Wizard
        </Link>
        
        <div className="mt-8">
          <Suspense fallback={<LoadingState />}>
            <ComponentResultDisplay searchParams={searchParams} />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
