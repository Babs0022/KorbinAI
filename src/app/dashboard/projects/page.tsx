
"use client";

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { LoaderCircle, FolderKanban, FileText, Code, Image as ImageIcon, LayoutTemplate, ListFilter, Search } from 'lucide-react';
import type { Project } from '@/services/projectService';
import { getProjectsForUser } from '@/services/projectService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { formatDistanceToNow } from 'date-fns';
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const projectTypes: Project['type'][] = ['written-content', 'prompt', 'structured-data', 'image-generator', 'component-wizard'];

const typeInfo: Record<Project['type'], { icon: React.ReactNode; label: string }> = {
  'written-content': { icon: <FileText className="h-4 w-4" />, label: 'Written Content' },
  'prompt': { icon: <FileText className="h-4 w-4" />, label: 'Prompt' },
  'structured-data': { icon: <Code className="h-4 w-4" />, label: 'Structured Data' },
  'image-generator': { icon: <ImageIcon className="h-4 w-4" />, label: 'Image' },
  'component-wizard': { icon: <LayoutTemplate className="h-4 w-4" />, label: 'Application' },
  'chat': { icon: <div />, label: 'Chat' }, // Empty icon/label as it will be filtered out.
};


function ProjectList({ projects }: { projects: Project[] }) {
    if (projects.length === 0) {
        return (
            <div className="text-center py-16 border border-dashed rounded-lg bg-card/50">
                <FolderKanban className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-xl font-semibold">No Matching Projects Found</h3>
                <p className="mt-2 text-muted-foreground">Try adjusting your search or filters.</p>
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
                                {typeInfo[project.type].icon}
                                {typeInfo[project.type].label}
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

function ProjectsPageClient() {
    const { user, loading: authLoading } = useAuth();
    const [projects, setProjects] = useState<Project[]>([]);
    const [projectsLoading, setProjectsLoading] = useState(true);
    
    // State for filtering
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTypes, setSelectedTypes] = useState<Set<Project['type']>>(new Set());

    useEffect(() => {
        if (user) {
            setProjectsLoading(true);
            getProjectsForUser(user.uid)
                .then(allProjects => {
                    // Filter out chat projects before setting the state
                    const nonChatProjects = allProjects.filter(p => p.type !== 'chat');
                    setProjects(nonChatProjects);
                })
                .catch(console.error)
                .finally(() => setProjectsLoading(false));
        } else if (!authLoading) {
            setProjectsLoading(false);
        }
    }, [user, authLoading]);

    const handleTypeToggle = (type: Project['type']) => {
        setSelectedTypes(prev => {
            const newSet = new Set(prev);
            if (newSet.has(type)) {
                newSet.delete(type);
            } else {
                newSet.add(type);
            }
            return newSet;
        });
    };

    const filteredProjects = useMemo(() => {
        return projects
            .filter(p => {
                if (selectedTypes.size > 0 && !selectedTypes.has(p.type)) {
                    return false;
                }
                return true;
            })
            .filter(p => {
                if (searchTerm.trim() === '') return true;
                const lowercasedTerm = searchTerm.toLowerCase();
                return p.name.toLowerCase().includes(lowercasedTerm) || p.summary.toLowerCase().includes(lowercasedTerm);
            });
    }, [projects, searchTerm, selectedTypes]);

    if (authLoading) {
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
    
    return (
        <>
            <div className="mb-8 flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                        placeholder="Search by name or summary..."
                        className="pl-10 h-11"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="h-11">
                            <ListFilter className="mr-2 h-4 w-4" />
                            Filter by Type {selectedTypes.size > 0 && `(${selectedTypes.size})`}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel>Project Types</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {projectTypes.map(type => (
                            <DropdownMenuCheckboxItem
                                key={type}
                                checked={selectedTypes.has(type)}
                                onCheckedChange={() => handleTypeToggle(type)}
                            >
                                {typeInfo[type].label}
                            </DropdownMenuCheckboxItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {projectsLoading ? (
                <div className="flex flex-1 items-center justify-center p-16"><LoaderCircle className="h-12 w-12 animate-spin text-primary" /></div>
            ) : (
                <ProjectList projects={filteredProjects} />
            )}
        </>
    );
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

    
