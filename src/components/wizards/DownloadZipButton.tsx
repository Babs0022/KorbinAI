
"use client";

import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface File {
  filePath: string;
  componentCode: string;
}

interface DownloadZipButtonProps {
  files: File[];
  projectName?: string;
  disabled?: boolean;
}

export default function DownloadZipButton({ files, projectName = 'brieflyai-app', disabled = false }: DownloadZipButtonProps) {
  const { toast } = useToast();

  const handleDownload = async () => {
    if (disabled || !files || files.length === 0 || !files[0].componentCode) {
        toast({
            variant: 'destructive',
            title: 'Download Failed',
            description: 'There is no code to download.',
        });
        return;
    }
    
    try {
        const zip = new JSZip();

        files.forEach(file => {
          zip.file(file.filePath, file.componentCode);
        });

        const content = await zip.generateAsync({ type: 'blob' });
        saveAs(content, `${projectName}.zip`);
        toast({
            title: 'Download Started',
            description: `Your project ${projectName}.zip is being downloaded.`,
        });
    } catch (error) {
        console.error("Failed to create zip file:", error);
        toast({
            variant: 'destructive',
            title: 'Download Failed',
            description: 'There was an error creating the zip file.',
        });
    }
  };

  return (
    <Button onClick={handleDownload} variant="outline" size="lg" disabled={disabled}>
      <Download className="mr-2 h-4 w-4" />
      Download as .zip
    </Button>
  );
}
