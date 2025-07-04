
"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { PlusCircle, FolderKanban, Feather, Bolt, LayoutTemplate, Image, Code2 } from 'lucide-react';
import type { Workspace } from '@/types/workspace';
import DashboardLayout from '@/components/layout/DashboardLayout';

const WorkspaceIcon = ({ type }: { type: Workspace['type'] }) => {
  const props = { className: 'h-6 w-6 text-muted-foreground' };
  switch (type) {
    case 'written-content': return <Feather {...props} />;
    case 'prompt': return <Bolt {...props} />;
    case 'component-wizard': return <LayoutTemplate {...props} />;
    case 'image': return <Image {...props} />;
    case 'structured-data': return <Code2 {...props} />;
    default: return <FolderKanban {...props} />;
  }
};

const WorkspaceCardSkeleton = () => (
    <Card>
        <CardHeader>
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full mt-2" />
        </CardHeader>
        <CardFooter>
            <Skeleton className="h-4 w-1/4" />
        </CardFooter>
    </Card>
);

export default function WorkspacesPage() {
  const { user } = useAuth();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      setIsLoading(true);
      const q = query(
        collection(db, 'workspaces'),
        where('userId', '==', user.uid),
        orderBy('updatedAt', 'desc')
      );

      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const userWorkspaces: Workspace[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          userWorkspaces.push({
            id: doc.id,
            ...data,
            // Convert Firestore Timestamps to JS Dates
            createdAt: data.createdAt?.toDate(),
            updatedAt: data.updatedAt?.toDate(),
          } as Workspace);
        });
        setWorkspaces(userWorkspaces);
        setIsLoading(false);
      }, (error) => {
        console.error("Error fetching workspaces: ", error);
        setIsLoading(false);
      });

      return () => unsubscribe();
    } else {
      setIsLoading(false);
      setWorkspaces([]);
    }
  }, [user]);

  const renderContent = () => {
    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => <WorkspaceCardSkeleton key={i} />)}
            </div>
        );
    }
    
    if (workspaces.length === 0) {
        return (
            <div className="text-center py-16 border-2 border-dashed rounded-lg">
                <FolderKanban className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">No Workspaces Yet</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                    Create some content and it will appear here automatically.
                </p>
                <Button asChild className="mt-6">
                    <Link href="/">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Create Something New
                    </Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {workspaces.map((workspace) => (
                <Link key={workspace.id} href={{ pathname: workspace.featurePath, query: workspace.input as any }} legacyBehavior>
                    <a className="block h-full">
                        <Card className="h-full flex flex-col hover:border-primary/80 transition-colors duration-200">
                            <CardHeader className="flex-row items-start gap-4 space-y-0">
                                <WorkspaceIcon type={workspace.type} />
                                <div className="flex-1">
                                    <CardTitle>{workspace.name}</CardTitle>
                                    <CardDescription className="line-clamp-2 mt-1">{workspace.summary}</CardDescription>
                                </div>
                            </CardHeader>
                            <CardFooter className="mt-auto pt-4 text-xs text-muted-foreground">
                                {workspace.updatedAt && `Last updated ${formatDistanceToNow(new Date(workspace.updatedAt), { addSuffix: true })}`}
                            </CardFooter>
                        </Card>
                    </a>
                </Link>
            ))}
        </div>
    );
  };

  return (
    <DashboardLayout>
      <main className="flex-1 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold">Your Workspaces</h1>
          <p className="text-muted-foreground mt-2 mb-10">
            All your generated content is automatically saved here for you to revisit and reuse.
          </p>
          {renderContent()}
        </div>
      </main>
    </DashboardLayout>
  );
}
