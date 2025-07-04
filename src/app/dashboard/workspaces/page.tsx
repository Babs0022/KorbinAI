
"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { PlusCircle, FolderKanban, Feather, Bolt, LayoutTemplate, Image, Code2, MoreVertical, Eye, Download, Trash2, LoaderCircle } from 'lucide-react';
import type { Workspace } from '@/types/workspace';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { deleteWorkspace } from '@/services/workspaceService';


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
  const router = useRouter();
  const { toast } = useToast();
  
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // State for delete confirmation
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [workspaceToAction, setWorkspaceToAction] = useState<Workspace | null>(null);

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

  const handleDeleteClick = (workspace: Workspace) => {
    setWorkspaceToAction(workspace);
    setIsDialogOpen(true);
  };
  
  const handleDeleteConfirm = async () => {
    if (!workspaceToAction || !user) return;
    setIsDeleting(true);
    try {
      await deleteWorkspace({ workspaceId: workspaceToAction.id, userId: user.uid });
      toast({
        title: "Workspace Deleted",
        description: `"${workspaceToAction.name}" has been permanently deleted.`,
      });
    } catch (error) {
      console.error("Failed to delete workspace:", error);
      toast({
        variant: "destructive",
        title: "Deletion Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred.",
      });
    } finally {
      setIsDeleting(false);
      setIsDialogOpen(false);
      setWorkspaceToAction(null);
    }
  };

  const handleExport = (workspace: Workspace) => {
    if (!workspace) return;

    let content: string;
    let filename: string;
    let mimeType: string;

    const sanitizedName = workspace.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();

    // Special case for image export
    if (workspace.type === 'image') {
        const previewUrl = (workspace.output as any)?.previewUrl;
        if (previewUrl && typeof previewUrl === 'string') {
            const a = document.createElement('a');
            a.href = previewUrl;
            a.download = `${sanitizedName || 'image'}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            toast({ title: "Image downloading..."});
            return;
        }
    }
    
    // Logic for text-based content
    switch (workspace.type) {
        case 'written-content':
        case 'prompt':
            content = workspace.output as string;
            filename = `${sanitizedName}.md`;
            mimeType = 'text/markdown';
            break;
        case 'structured-data':
            content = typeof workspace.output === 'string' ? workspace.output : JSON.stringify(workspace.output, null, 2);
            const format = (workspace.input as any).format || 'json';
            filename = `${sanitizedName}.${format}`;
            mimeType = format === 'csv' ? 'text/csv' : 'application/json';
            break;
        case 'component-wizard':
            content = JSON.stringify(workspace.output, null, 2);
            filename = `${sanitizedName}_files.json`;
            mimeType = 'application/json';
            break;
        default:
            content = typeof workspace.output === 'string' ? workspace.output : JSON.stringify(workspace.output, null, 2);
            filename = `${sanitizedName}.txt`;
            mimeType = 'text/plain';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: "Export Started", description: `Downloading ${filename}` });
};


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
                <Card key={workspace.id} className="h-full flex flex-col hover:border-primary/80 transition-colors duration-200">
                    <CardHeader className="flex-row items-start gap-4 space-y-0">
                        <WorkspaceIcon type={workspace.type} />
                        <div className="flex-1">
                            <CardTitle>{workspace.name}</CardTitle>
                            <CardDescription className="line-clamp-2 mt-1">{workspace.summary}</CardDescription>
                        </div>
                         <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 -mr-2 -mt-2">
                                    <MoreVertical className="h-4 w-4" />
                                    <span className="sr-only">More options</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onSelect={() => router.push({ pathname: workspace.featurePath, query: workspace.input as any })}>
                                    <Eye className="mr-2 h-4 w-4" /> View / Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => handleExport(workspace)}>
                                    <Download className="mr-2 h-4 w-4" /> Export
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onSelect={() => handleDeleteClick(workspace)} className="text-destructive focus:text-destructive">
                                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </CardHeader>
                    <CardFooter className="mt-auto pt-4 text-xs text-muted-foreground">
                        {workspace.updatedAt && `Last updated ${formatDistanceToNow(new Date(workspace.updatedAt), { addSuffix: true })}`}
                    </CardFooter>
                </Card>
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
        <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the workspace
                <span className="font-bold"> "{workspaceToAction?.name}"</span>.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="bg-destructive hover:bg-destructive/90"
              >
                {isDeleting && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                Yes, delete it
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </DashboardLayout>
  );
}
