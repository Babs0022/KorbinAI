
import { Suspense } from 'react';
import Link from 'next/link';
import { ArrowLeft, FileWarning, LoaderCircle } from 'lucide-react';
import { generateApp } from '@/ai/flows/generate-component-flow';
import type { GenerateAppInput } from '@/types/ai';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import ComponentResultDisplay from '@/components/wizards/ComponentResultDisplay';

export const dynamic = 'force-dynamic';

// This is the main component that fetches the data on the server
async function GeneratedApp({ searchParams }: { searchParams: GenerateAppInput }) {
  try {
    const result = await generateApp(searchParams);

    if (!result?.files || result.files.length === 0) {
      console.error("AI flow returned invalid data:", result);
      throw new Error("The AI returned an invalid or empty file structure.");
    }

    return <ComponentResultDisplay result={result} />;
  } catch (error) {
    console.error("Failed to generate application:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return (
      <Card className="w-full border-destructive bg-destructive/10">
        <CardHeader>
          <div className="flex items-center gap-4">
            <FileWarning className="h-10 w-10 text-destructive" />
            <div>
              <CardTitle className="text-destructive">Generation Failed</CardTitle>
              <CardDescription className="text-destructive/80">There was an error generating your application.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
            <p className="rounded-md bg-destructive/10 p-4 font-mono text-sm text-destructive">
                {errorMessage}
            </p>
        </CardContent>
      </Card>
    );
  }
}

// A simple loading skeleton
function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 text-center">
      <LoaderCircle className="h-12 w-12 animate-spin text-primary" />
      <h2 className="text-2xl font-bold">Generating your application...</h2>
      <p className="text-muted-foreground">The AI architect is thinking. This may take a few moments.</p>
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
            <GeneratedApp searchParams={searchParams} />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
