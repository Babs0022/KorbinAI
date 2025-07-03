import { Suspense } from 'react';
import Link from 'next/link';
import { ArrowLeft, LoaderCircle } from 'lucide-react';
import { generateComponent, type GenerateComponentInput } from '@/ai/flows/generate-component-flow';
import CodeDisplay from '@/components/wizards/CodeDisplay';

// This is the main component that fetches the data on the server
async function GeneratedComponent({ searchParams }: { searchParams: GenerateComponentInput }) {
  try {
    const result = await generateComponent(searchParams);
    return <CodeDisplay componentName={result.componentName} componentCode={result.componentCode} />;
  } catch (error) {
    console.error("Failed to generate component:", error);
    return (
      <div className="text-center text-destructive">
        <h2 className="text-2xl font-bold">Generation Failed</h2>
        <p className="mt-2">There was an error generating your component. Please try again.</p>
      </div>
    );
  }
}

// A simple loading skeleton
function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 text-center">
      <LoaderCircle className="h-12 w-12 animate-spin text-primary" />
      <h2 className="text-2xl font-bold">Generating your component...</h2>
      <p className="text-muted-foreground">The AI is thinking. This may take a moment.</p>
    </div>
  );
}

// The page component that wraps everything in Suspense
export default function ResultPage({
  searchParams,
}: {
  searchParams: GenerateComponentInput;
}) {
  return (
    <main className="flex min-h-screen flex-col items-center p-4 md:p-8">
      <div className="w-full max-w-4xl">
        <Link
          href="/component-wizard"
          className="mb-8 inline-flex items-center gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Wizard
        </Link>
        
        <div className="mt-12">
          <Suspense fallback={<LoadingState />}>
            <GeneratedComponent searchParams={searchParams} />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
