
"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, FileWarning, LoaderCircle } from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import type { Workspace } from '@/types/workspace';
import { getWorkspace } from '@/services/workspaceService';

import DashboardLayout from '@/components/layout/DashboardLayout';
import MultiCodeDisplay from '@/components/wizards/CodeDisplay';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// Helper component for error state
const ErrorState = ({ message }: { message: string }) => (
    <Card className="w-full border-destructive bg-destructive/10">
      <CardHeader>
        <div className="flex items-center gap-4">
          <FileWarning className="h-10 w-10 text-destructive" />
          <div>
            <CardTitle className="text-destructive">Error</CardTitle>
            <CardDescription className="text-destructive/80">Could not load workspace.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
          <p className="rounded-md bg-destructive/10 p-4 font-mono text-sm text-destructive">
              {message}
          </p>
      </CardContent>
    </Card>
);

// Helper component for loading state
const LoadingState = () => (
    <div className="flex flex-col items-center justify-center gap-4 text-center">
      <LoaderCircle className="h-12 w-12 animate-spin text-primary" />
      <h2 className="text-2xl font-bold">Loading Workspace...</h2>
      <p className="text-muted-foreground">Please wait a moment.</p>
    </div>
);

export default function WorkspaceViewerPage() {
    const router = useRouter();
    const params = useParams();
    const { user, loading: authLoading } = useAuth();
    
    const [workspace, setWorkspace] = useState<Workspace | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const workspaceId = typeof params.workspaceId === 'string' ? params.workspaceId : '';

    useEffect(() => {
        if (authLoading) return; // Wait for auth to be ready
        if (!user) {
            // Redirect to login if not authenticated
            router.push('/login');
            return;
        }
        if (!workspaceId) {
            setError("No workspace ID provided.");
            setIsLoading(false);
            return;
        }

        const fetchWorkspace = async () => {
            try {
                const data = await getWorkspace({ workspaceId, userId: user.uid });
                if (!data) {
                    setError("Workspace not found or you don't have permission to view it.");
                } else if (data.type !== 'component-wizard') {
                    setError("This viewer is only for application workspaces.");
                }
                else {
                    setWorkspace(data);
                }
            } catch (e: any) {
                setError(e.message || "An unknown error occurred while fetching the workspace.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchWorkspace();
    }, [workspaceId, user, authLoading, router]);

    const renderContent = () => {
        if (isLoading || authLoading) {
            return <LoadingState />;
        }

        if (error) {
            return <ErrorState message={error} />;
        }

        if (workspace && workspace.type === 'component-wizard') {
            const output = workspace.output as any;
            if (output?.files && output?.finalInstructions) {
                 return <MultiCodeDisplay files={output.files} finalInstructions={output.finalInstructions} />;
            }
        }
        
        return <ErrorState message="The workspace data is invalid or could not be displayed." />;
    };

    return (
        <DashboardLayout>
            <main className="flex min-h-screen flex-col items-center p-4 md:p-8">
                <div className="w-full max-w-6xl">
                    <Button variant="ghost" asChild className="mb-8 -ml-4">
                        <Link href="/dashboard/workspaces">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Workspaces
                        </Link>
                    </Button>
                    
                    {renderContent()}
                </div>
            </main>
        </DashboardLayout>
    );
}
