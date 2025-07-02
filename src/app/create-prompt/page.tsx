
"use client";

import React, { Suspense } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import Container from '@/components/layout/Container';
import { Loader2 } from 'lucide-react';
import { PromptWorkspace } from '@/components/prompt/PromptWorkspace';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

function CreatePromptPageContent() {
  const { currentUser, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !currentUser) {
      router.push('/login');
    }
  }, [currentUser, loading, router]);
  
  if (loading || !currentUser) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <DashboardLayout>
      <main className="flex-grow bg-gradient-to-br from-background via-indigo-50/30 to-mint-50/30 py-8">
        <Container>
          <PromptWorkspace />
        </Container>
      </main>
    </DashboardLayout>
  );
}

export default function CreatePromptPage() {
  return (
    <Suspense fallback={
        <div className="flex h-screen w-screen items-center justify-center bg-background">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">Loading Workspace...</p>
        </div>
      }>
      <CreatePromptPageContent />
    </Suspense>
  );
}
