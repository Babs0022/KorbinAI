
import { Suspense } from 'react';
import Link from 'next/link';
import { ArrowLeft, LoaderCircle, FileWarning } from 'lucide-react';
import { getProjectById } from '@/services/projectService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import GenerationResultCard from '@/components/shared/GenerationResultCard';
import MultiCodeDisplay from '@/components/wizards/CodeDisplay';
import DownloadZipButton from '@/components/wizards/DownloadZipButton';
import NextImage from 'next/image';

async function ProjectViewer({ projectId }: { projectId: string }) {
  // In a real app, you'd also want to verify user ownership of the project here.
  const project = await getProjectById(projectId);

  if (!project) {
    return (
      <Card className="w-full border-destructive bg-destructive/10">
        <CardHeader>
          <div className="flex items-center gap-4">
            <FileWarning className="h-10 w-10 text-destructive" />
            <div>
              <CardTitle className="text-destructive">Project Not Found</CardTitle>
              <CardDescription className="text-destructive/80">The requested project could not be found or you may not have permission to view it.</CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>
    );
  }

  const renderContent = () => {
    switch (project.type) {
      case 'written-content':
      case 'prompt':
        return <GenerationResultCard title="Saved Content" content={project.content as string} variant="prose" />;
      
      case 'structured-data':
        // Basic check to determine language for syntax highlighting
        const lang = (project.content as string).trim().startsWith('<') ? 'xml' : 'json';
        return <GenerationResultCard title="Saved Data" content={project.content as string} language={lang} variant="code" />;
      
      case 'image-generator':
        const imageUrls = project.content as string[];
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Saved Images</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {imageUrls.map((url, index) => (
                            <div key={index} className="relative aspect-square w-full overflow-hidden rounded-lg">
                                <a href={url} target="_blank" rel="noopener noreferrer">
                                    <NextImage src={url} alt={`Generated image ${index + 1}`} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover transition-transform hover:scale-105" />
                                </a>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        );

      case 'component-wizard':
        const { files, finalInstructions } = project.content as { files: any[], finalInstructions: string };
        return (
            <div className="space-y-6">
                <MultiCodeDisplay files={files} finalInstructions={finalInstructions} variant="preview" />
                 <div className="flex justify-end">
                    <DownloadZipButton files={files} projectName={project.name.replace(/\s+/g, '-').toLowerCase()} />
                </div>
            </div>
        );

      default:
        return <p>Unknown project type.</p>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{project.name}</h1>
        <p className="mt-1 text-muted-foreground">{project.summary}</p>
      </div>
      {renderContent()}
    </div>
  );
}

export default function ProjectPage({ params }: { params: { projectId: string } }) {
  return (
    <main className="flex min-h-screen flex-col items-center p-4 md:p-8">
      <div className="w-full max-w-6xl">
        <Link href="/dashboard/projects" className="mb-8 inline-flex items-center gap-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back to Projects
        </Link>
        
        <Suspense fallback={<div className="flex flex-1 items-center justify-center p-16"><LoaderCircle className="h-12 w-12 animate-spin text-primary" /></div>}>
          <ProjectViewer projectId={params.projectId} />
        </Suspense>
      </div>
    </main>
  );
}
