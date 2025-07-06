

"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { PlusCircle, FolderKanban, Feather, Bolt, LayoutTemplate, Code2, MoreVertical, Eye, Download, Trash2, LoaderCircle, Edit } from 'lucide-react';
import type { Project } from '@/types/workspace';
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
import { deleteProject, getProject } from '@/services/workspaceService';
import ProjectPreviewDialog from '@/components/wizards/WorkspacePreviewDialog';


const ProjectIcon = ({ type }: { type: Project['type'] }) => {
  const props = { className: 'h-6 w-6 text-muted-foreground' };
  switch (type) {
    case 'written-content': return <Feather {...props} />;
    case 'prompt': return <Bolt {...props} />;
    case 'component-wizard': return <LayoutTemplate {...props} />;
    case 'structured-data': return <Code2 {...props} />;
    default: return <FolderKanban {...props} />;
  }
};

const ProjectCardSkeleton = () => (
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

// Type guard to check for a valid path
function isValidPath(path: any): path is string {
    return typeof path === 'string' && path.trim().startsWith('/');
}


export default function ProjectsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // State for dialogs
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [projectToAction, setProjectToAction] = useState<Project | null>(null);
  const [viewingProject, setViewingProject] = useState<Project | null>(null);

  useEffect(() => {
    if (user) {
      setIsLoading(true);
      const q = query(
        collection(db, 'projects'),
        where('userId', '==', user.uid),
        orderBy('updatedAt', 'desc')
      );

      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const userProjects: Project[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          userProjects.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate(),
            updatedAt: data.updatedAt?.toDate(),
          } as Project);
        });
        setProjects(userProjects);
        setIsLoading(false);
      }, (error) => {
        console.error("Error fetching projects: ", error);
        toast({
          variant: "destructive",
          title: "Error fetching projects",
          description: error.message,
        });
        setIsLoading(false);
      });

      return () => unsubscribe();
    } else {
      setIsLoading(false);
      setProjects([]);
    }
  }, [user, toast]);
  
  const handleViewClick = (project: Project) => {
    if (project.type === 'component-wizard') {
        router.push(`/dashboard/workspaces/${project.id}`);
    } else {
        setViewingProject(project);
    }
  };

  const handleEditClick = (project: Project) => {
    if (!project.id || !user) return;
    
    // Since the list view doesn't have input, we must fetch it first.
    getProject({ projectId: project.id, userId: user.uid }).then(fullProject => {
        if (fullProject && isValidPath(fullProject.featurePath)) {
            router.push({
                pathname: fullProject.featurePath,
                query: fullProject.input as any,
            });
        } else {
            toast({
                variant: "destructive",
                title: "Cannot Edit",
                description: "Could not load project for editing. It might be an older version.",
            });
        }
    });
  };

  const handleDeleteClick = (project: Project) => {
    setProjectToAction(project);
    setIsDeleteDialogOpen(true);
  };
  
  const handleDeleteConfirm = async () => {
    if (!projectToAction || !user) return;
    setIsDeleting(true);
    try {
      await deleteProject({ projectId: projectToAction.id, userId: user.uid });
      toast({
        title: "Project Deleted",
        description: `"${projectToAction.name}" has been permanently deleted.`,
      });
    } catch (error) {
      console.error("Failed to delete project:", error);
      toast({
        variant: "destructive",
        title: "Deletion Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred.",
      });
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
      setProjectToAction(null);
    }
  };

  const handleExport = async (project: Project) => {
    if (!project || !user) return;
    
    // For other types, we need the full content which isn't in the list view
    const fullProject = await getProject({ projectId: project.id, userId: user.uid });
    if (!fullProject || !fullProject.output) {
      toast({ variant: "destructive", title: "Export Failed", description: "Could not load project content." });
      return;
    }
    
    let content: string;
    let filename: string;
    let mimeType: string;

    const sanitizedName = fullProject.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    
    switch (fullProject.type) {
        case 'written-content':
        case 'prompt':
            content = fullProject.output as string;
            filename = `${sanitizedName}.md`;
            mimeType = 'text/markdown';
            break;
        case 'structured-data':
            content = typeof fullProject.output === 'string' ? fullProject.output : JSON.stringify(fullProject.output, null, 2);
            const format = (fullProject.input as any).format || 'json';
            filename = `${sanitizedName}.${format}`;
            mimeType = format === 'csv' ? 'text/csv' : 'application/json';
            break;
        case 'component-wizard':
            content = JSON.stringify(fullProject.output, null, 2);
            filename = `${sanitizedName}_files.json`;
            mimeType = 'application/json';
            break;
        default:
            content = typeof fullProject.output === 'string' ? fullProject.output : JSON.stringify(fullProject.output, null, 2);
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
                {[...Array(6)].map((_, i) => <ProjectCardSkeleton key={i} />)}
            </div>
        );
    }
    
    if (projects.length === 0) {
        return (
            <div className="text-center py-16 border-2 border-dashed rounded-lg">
                <FolderKanban className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">No Projects Yet</h3>
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
            {projects.map((project) => (
                <Card key={project.id} className="h-full flex flex-col hover:border-primary/80 transition-colors duration-200">
                    <CardHeader className="flex-row items-start gap-4 space-y-0">
                        <ProjectIcon type={project.type} />
                        <div className="flex-1">
                            <CardTitle>{project.name}</CardTitle>
                            <CardDescription className="line-clamp-2 mt-1">{project.summary}</CardDescription>
                        </div>
                         <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 -mr-2 -mt-2">
                                    <MoreVertical className="h-4 w-4" />
                                    <span className="sr-only">More options</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onSelect={() => handleViewClick(project)}>
                                    <Eye className="mr-2 h-4 w-4" /> View
                                </DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => handleEditClick(project)} disabled={!isValidPath(project.featurePath)}>
                                    <Edit className="mr-2 h-4 w-4" /> Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => handleExport(project)}>
                                    <Download className="mr-2 h-4 w-4" /> Export
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onSelect={() => handleDeleteClick(project)} className="text-destructive focus:text-destructive">
                                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </CardHeader>
                    <CardFooter className="mt-auto pt-4 text-xs text-muted-foreground">
                        {project.updatedAt && `Last updated ${formatDistanceToNow(new Date(project.updatedAt), { addSuffix: true })}`}
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
          <h1 className="text-3xl font-bold">Your Projects</h1>
          <p className="text-muted-foreground mt-2 mb-10">
            All your generated content is automatically saved here for you to revisit and reuse.
          </p>
          {renderContent()}
        </div>
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the project
                <span className="font-bold"> "{projectToAction?.name}"</span>.
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

        <ProjectPreviewDialog
          projectMetadata={viewingProject}
          isOpen={!!viewingProject}
          onOpenChange={(open) => !open && setViewingProject(null)}
          onExport={handleExport}
        />
      </main>
    </DashboardLayout>
  );
}
