
import Link from "next/link";
import { Suspense } from 'react';
import { ArrowLeft } from "lucide-react";
import ComponentWizardClient from "@/components/features/component-wizard/ComponentWizardClient";

export default function ComponentWizardPage() {
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
          <h1 className="mb-2 text-4xl font-bold text-white md:text-5xl">
            Application Wizard
          </h1>
          <p className="mb-8 text-lg text-white/70">
            Build anything from a single page to a full application, step-by-step.
          </p>
        </div>
        
        <Suspense fallback={<div>Loading...</div>}>
            <ComponentWizardClient />
        </Suspense>

      </div>
    </main>
  );
}
