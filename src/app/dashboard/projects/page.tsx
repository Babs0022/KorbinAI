
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { getProjectsForUser } from "@/services/projectService";
import type { Project } from "@/types/project";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { PlusCircle, FolderKanban, Feather, Code2, LayoutTemplate, Image, Bolt, MessageSquare, ArrowRight } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { formatDistanceToNow } from 'date-fns';
import { cn } from "@/lib/utils";

const projectTypeIcons: Record<Project['type'], React.ReactNode> = {
    'written-content': <Feather className="h-6 w-6" />,
    'prompt': <Bolt className="h-6 w-6" />,
    'component-wizard': <LayoutTemplate className="h-6 w-6" />,
    'structured-data': <Code2 className="h-6 w-6" />,
    'image-generator': <Image className="h-6 w-6" />,
    'chat': <MessageSquare className="h-6 w-6" />,
};

const ProjectCardSkeleton = () => (
    <div className="flex flex-col space-y-3">
        <Skeleton className="h-[125px] w-full rounded-xl" />
        <div className="space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
        </div>
    </div>
);

const EmptyState = () => (
     <div className="text-center py-16 px-4 border-2 border-dashed rounded-xl">
        <FolderKanban className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">No Projects Yet</h3>
        <p className="mt-1 text-sm text-muted-foreground">
            You haven't saved any projects. Start creating to see them here.
        </p>
        <Button asChild className="mt-6">
            <Link href="/">
                <PlusCircle className="mr-2 h-4 w-4" />
                Create New Project
            </Link>
        </Button>
    </div>
);

export default function ProjectsPage() {
    const { user, loading: authLoading } = useAuth();
    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            setIsLoading(false);
            return;
        }

        async function fetchProjects() {
            try {
                const userProjects = await getProjectsForUser(user.uid);
                setProjects(userProjects);
            } catch (error) {
                console.error("Failed to fetch projects:", error);
            } finally {
                setIsLoading(false);
            }
        }

        fetchProjects();
    }, [user, authLoading]);

    return (
        <DashboardLayout>
            <main className="flex-1 p-4 md:p-8">
                <div className="w-full max-w-6xl mx-auto">
                     <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
                        <div>
                            <h1 className="text-4xl font-bold">My Projects</h1>
                            <p className="mt-2 text-lg text-muted-foreground">
                                View and manage all your saved creations.
                            </p>
                        </div>
                        <Button asChild className="mt-4 md:mt-0">
                            <Link href="/">
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Create New Project
                            </Link>
                        </Button>
                    </div>

                    {isLoading ? (
                         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            <ProjectCardSkeleton />
                            <ProjectCardSkeleton />
                            <ProjectCardSkeleton />
                         </div>
                    ) : projects.length === 0 ? (
                        <EmptyState />
                    ) : (
                         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {projects.map((project) => (
                                <Link href={`/dashboard/projects/${project.id}`} key={project.id} className="group">
                                    <Card className={cn(
                                        "flex h-full transform flex-col justify-between text-left transition-all duration-300 rounded-xl",
                                        "bg-secondary/30",
                                        "hover:-translate-y-1 hover:border-primary/50"
                                    )}>
                                        <CardHeader>
                                            <div className="flex items-start justify-between">
                                                <div className="text-primary bg-primary/10 p-3 rounded-lg">
                                                    {projectTypeIcons[project.type] || <FolderKanban />}
                                                </div>
                                                <div className="flex items-center text-primary opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                                                    <span className="text-sm">View</span>
                                                    <ArrowRight className="ml-1 h-4 w-4" />
                                                </div>
                                            </div>
                                            <CardTitle className="pt-4 text-lg font-semibold transition-colors duration-300 group-hover:text-primary">
                                                {project.name}
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-sm text-muted-foreground line-clamp-2">{project.summary}</p>
                                        </CardContent>
                                        <CardFooter>
                                            <p className="text-xs text-muted-foreground">
                                                Updated {formatDistanceToNow(new Date(project.updatedAt), { addSuffix: true })}
                                            </p>
                                        </CardFooter>
                                    </Card>
                                </Link>
                            ))}
                         </div>
                    )}
                </div>
            </main>
        </DashboardLayout>
    );
}
