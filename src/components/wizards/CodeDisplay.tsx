
"use client";

import { useState } from "react";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Button } from "@/components/ui/button";
import { Copy, Check, Folder, File as FileIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface File {
  filePath: string;
  componentCode: string;
  instructions: string;
}

interface MultiCodeDisplayProps {
  files: File[];
}

interface FileTree {
  [key: string]: FileTree | File;
}

// --- HELPER FUNCTIONS ---
const buildFileTree = (files: File[]): FileTree => {
  const tree: FileTree = {};
  files.forEach(file => {
    const parts = file.filePath.split(/[\\/]/);
    let currentLevel = tree;
    parts.forEach((part, index) => {
      if (!part) return;
      if (index === parts.length - 1) {
        currentLevel[part] = file;
      } else {
        if (!currentLevel[part] || ('filePath' in currentLevel[part])) {
          currentLevel[part] = {};
        }
        currentLevel = currentLevel[part] as FileTree;
      }
    });
  });
  return tree;
};

const getLanguage = (filePath: string): string => {
  const extension = filePath.split('.').pop()?.toLowerCase() || '';
  switch (extension) {
    case 'tsx':
    case 'jsx':
      return 'tsx';
    case 'ts':
      return 'typescript';
    case 'js':
      return 'javascript';
    case 'json':
      return 'json';
    case 'css':
      return 'css';
    case 'md':
      return 'markdown';
    default:
      return 'plaintext';
  }
};

const CodeViewer = ({ file }: { file: File }) => {
    const [copied, setCopied] = useState(false);
    const language = getLanguage(file.filePath);
  
    const handleCopy = () => {
      navigator.clipboard.writeText(file.componentCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };
  
    return (
      <div className="relative h-full overflow-hidden rounded-lg border bg-secondary">
        <div className="flex items-center justify-between bg-muted/30 px-4 py-2">
           <p className="font-mono text-sm font-medium">{file.filePath}</p>
           <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={handleCopy}>
                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                <span className="sr-only">Copy Code</span>
            </Button>
        </div>
        <SyntaxHighlighter
          language={language}
          style={vscDarkPlus}
          customStyle={{ margin: 0, backgroundColor: 'transparent', height: '100%' }}
          codeTagProps={{
            style: {
              fontFamily: "var(--font-code, monospace)",
              fontSize: "0.875rem",
            },
          }}
          className="!p-4 h-[calc(100%-48px)] overflow-auto"
        >
          {file.componentCode}
        </SyntaxHighlighter>
      </div>
    );
};

const FileTree = ({ tree, level = 0, selectedFile, onSelectFile }: { tree: FileTree, level?: number, selectedFile: File | null, onSelectFile: (file: File) => void }) => {
  return (
    <div className="space-y-1">
      {Object.entries(tree)
        .sort(([aName, aNode], [bName, bNode]) => {
          const aIsFile = 'filePath' in aNode;
          const bIsFile = 'filePath' in bNode;
          if (aIsFile && !bIsFile) return 1;
          if (!aIsFile && bIsFile) return -1;
          return aName.localeCompare(bName);
        })
        .map(([name, node]) => {
          if (node && typeof node === 'object' && 'filePath' in node) {
            const file = node as File;
            return (
              <button key={name} onClick={() => onSelectFile(file)} className={cn("flex w-full items-center gap-2 rounded-md p-2 text-left text-sm hover:bg-accent", selectedFile?.filePath === file.filePath && "bg-accent font-medium")}>
                  <FileIcon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{name}</span>
              </button>
            );
          } else {
            return (
              <div key={name} className="space-y-1">
                <div className="flex items-center gap-2 p-2">
                  <Folder className="h-5 w-5 text-muted-foreground" />
                  <span className="font-semibold text-muted-foreground">{name}</span>
                </div>
                 <div className="ml-4 pl-2 border-l border-dashed border-border">
                    <FileTree tree={node as FileTree} level={level + 1} selectedFile={selectedFile} onSelectFile={onSelectFile} />
                 </div>
              </div>
            );
          }
        })}
    </div>
  );
};


// --- MAIN COMPONENT ---
export default function MultiCodeDisplay({ files }: MultiCodeDisplayProps) {
  const fileTree = buildFileTree(files);
  const [selectedFile, setSelectedFile] = useState<File | null>(files.length > 0 ? files.find(f => f.filePath.endsWith('page.tsx')) || files[0] : null);

  return (
    <div className="grid grid-cols-1 md:grid-cols-[1fr_3fr] gap-6 min-h-[60vh]">
        <div className="overflow-y-auto rounded-lg border p-2 bg-secondary/50">
            <h3 className="p-2 font-semibold">File Structure</h3>
            <FileTree tree={fileTree} selectedFile={selectedFile} onSelectFile={setSelectedFile} />
        </div>
        <div className="h-full">
            {selectedFile ? (
                <CodeViewer file={selectedFile} />
            ) : (
                <div className="flex items-center justify-center h-full rounded-lg border border-dashed">
                    <p className="text-muted-foreground">Select a file to view its code</p>
                </div>
            )}
        </div>
    </div>
  );
}
