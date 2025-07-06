
"use client";

import { Suspense } from 'react';
import Link from 'next/link';
import { LoaderCircle, FolderKanban, FileText, Code, Image as ImageIcon, LayoutTemplate } from 'lucide-react';
import type { Project } from '@/types/project';
import { getProjectsForUser } from '@/services/projectService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { formatDistanceToNow } from 'date-fns';

const typeIcons: Record<Project['type'], React.ReactNode> = {
  'written-content': <FileText className="h-4 w-4" />,
  'prompt': <FileText className="h-4 w-4" />,
  'structured-data': <Code className="h-4 w-4" />,
  'image-generator': <ImageIcon className="h-4 w-4" />,
  'component-wizard': <LayoutTemplate className="h-4 w-4" />,
};

function ProjectList({ projects }: { projects: Project[] }) {
    if (projects.length === 0) {
        return (
            <div className="text-center py-16 border border-dashed rounded-lg bg-card/50">
                <FolderKanban className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-xl font-semibold">No Projects Saved Yet</h3>
                <p className="mt-2 text-muted-foreground">Generate some content and save it to see your projects here.</p>
                <Button asChild className="mt-6">
                    <Link href="/">Back to Creation Hub</Link>
                </Button>
            </div>
        );
    }
    
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map(project => (
                <Card key={project.id} className="flex flex-col transition-all hover:border-primary/50 hover:shadow-lg">
                    <CardHeader>
                        <div className="flex justify-between items-start gap-4">
                            <CardTitle className="line-clamp-2">{project.name}</CardTitle>
                            <Badge variant="outline" className="shrink-0 flex items-center gap-1.5 capitalize">
                                {typeIcons[project.type]}
                                {project.type.replace('-', ' ')}
                            </Badge>
                        </div>
                        <CardDescription className="line-clamp-3 h-[60px] pt-1">{project.summary}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow" />
                    <CardFooter className="flex justify-between items-center text-xs text-muted-foreground">
                        <span>
                            Updated {formatDistanceToNow(new Date(project.updatedAt), { addSuffix: true })}
                        </span>
                        <Button asChild size="sm" variant="secondary">
                            <Link href={`/dashboard/projects/${project.id}`}>View Project</Link>
                        </Button>
                    </CardFooter>
                </Card>
            ))}
        </div>
    );
}

// Client component to get user and pass to server component child
function ProjectsPageClient() {
    const { user, loading } = useAuth();

    if (loading) {
        return <div className="flex flex-1 items-center justify-center p-16"><LoaderCircle className="h-12 w-12 animate-spin text-primary" /></div>;
    }

    if (!user) {
         return (
             <Card className="w-full max-w-md text-center mx-auto mt-16">
                 <CardHeader>
                     <CardTitle>Access Denied</CardTitle>
                     <CardDescription>You need to be signed in to view your projects.</CardDescription>
                 </CardHeader>
                 <CardContent>
                     <Button asChild>
                         <Link href="/login">Sign In</Link>
                     </Button>
                 </CardContent>
             </Card>
         );
    }

    // This pattern uses Suspense to stream the server-rendered list while the page loads.
    return (
        <Suspense fallback={<div className="flex flex-1 items-center justify-center p-16"><LoaderCircle className="h-12 w-12 animate-spin text-primary" /></div>}>
            <ProjectsFetcher userId={user.uid} />
        </Suspense>
    );
}

// Server component that actually fetches the data
async function ProjectsFetcher({ userId }: { userId: string }) {
    const projects = await getProjectsForUser(userId);
    return <ProjectList projects={projects} />;
}


export default function ProjectsPage() {
    return (
        <DashboardLayout>
            <main className="flex-1 p-4 md:p-8">
                <div className="max-w-7xl mx-auto">
                    <h1 className="text-3xl font-bold mb-2">My Projects</h1>
                    <p className="text-muted-foreground mb-8">All your saved generations in one place.</p>
                    <ProjectsPageClient />
                </div>
            </main>
        </DashboardLayout>
    );
}
