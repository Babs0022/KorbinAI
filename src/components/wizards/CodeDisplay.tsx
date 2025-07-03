"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Check, Terminal, Folder, File as FileIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";

interface File {
  filePath: string;
  componentCode: string;
  instructions: string;
}

interface MultiCodeDisplayProps {
  files: File[];
  finalInstructions: string;
}

interface FileTree {
  [key: string]: FileTree | File;
}

// --- UI COMPONENTS ---

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative">
      <Button variant="ghost" size="icon" className="absolute right-2 top-2 h-7 w-7" onClick={handleCopy}>
        {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
        <span className="sr-only">Copy Code</span>
      </Button>
      <pre className="p-4 bg-muted/50 rounded-lg overflow-x-auto text-sm">
        <code>{code}</code>
      </pre>
    </div>
  );
}

const FileNode = ({ file }: { file: File }) => (
  <Card className="mt-4 bg-card/50">
    <CardHeader className="flex-row items-center gap-4 space-y-0 p-4">
        <FileIcon className="h-6 w-6 shrink-0" />
        <div className="flex-1">
            <CardTitle className="text-lg">{file.filePath}</CardTitle>
            <CardDescription className="text-base">{file.instructions}</CardDescription>
        </div>
    </CardHeader>
    <CardContent className="p-0">
        <CodeBlock code={file.componentCode} />
    </CardContent>
  </Card>
);

const FolderNode = ({ name, content }: { name: string; content: FileTree }) => (
  <div className="mt-4">
    <div className="flex items-center gap-2">
      <Folder className="h-6 w-6 text-muted-foreground" />
      <span className="text-lg font-semibold text-muted-foreground">{name}</span>
    </div>
    <RenderFileTree tree={content} />
  </div>
);

const RenderFileTree = ({ tree }: { tree: FileTree }) => {
  return (
    <div className="ml-5 pl-5 border-l-2 border-dashed border-muted-foreground/30">
      {Object.entries(tree).map(([name, node]) => {
        // Check if node is a file by looking for filePath property
        if (node && typeof node === 'object' && 'filePath' in node) {
          return <FileNode key={name} file={node as File} />;
        } else {
          return <FolderNode key={name} name={name} content={node as FileTree} />;
        }
      })}
    </div>
  );
};


// --- HELPER FUNCTIONS ---

const buildFileTree = (files: File[]): FileTree => {
    const tree: FileTree = {};
    files.forEach(file => {
      const parts = file.filePath.split('/');
      let currentLevel = tree;
      parts.forEach((part, index) => {
        if (index === parts.length - 1) {
          currentLevel[part] = file;
        } else {
            // Ensure we are not overwriting a file with a directory
            if (currentLevel[part] && 'filePath' in currentLevel[part]) {
                return; 
            }
            if (!currentLevel[part]) {
                currentLevel[part] = {};
            }
            currentLevel = currentLevel[part] as FileTree;
        }
      });
    });
    return tree;
  };

// --- MAIN COMPONENT ---

export default function MultiCodeDisplay({ files, finalInstructions }: MultiCodeDisplayProps) {
  const fileTree = buildFileTree(files);

  return (
    <div className="space-y-12">
      <div>
        <h2 className="text-3xl font-bold">Your Application is Ready!</h2>
        <p className="mt-2 text-lg text-muted-foreground">Create the files below to set up your new application.</p>
      </div>
      
      <div className="file-tree-container">
        <RenderFileTree tree={fileTree} />
      </div>

      <Card className="bg-card/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Terminal />
            Final Steps
          </CardTitle>
          <CardDescription>Complete these final steps to run your application.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="rounded-md bg-muted/80 p-4 font-mono text-sm">{finalInstructions}</p>
        </CardContent>
      </Card>
    </div>
  );
}
