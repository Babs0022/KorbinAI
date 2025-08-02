
"use client";

import { Globe, Paperclip } from "lucide-react";

interface Source {
  title: string;
  url: string;
}

interface SourcesProps {
  sources: Source[];
}

export default function Sources({ sources }: SourcesProps) {
  if (!sources || sources.length === 0) {
    return null;
  }

  const isWebSource = (url: string) => url.startsWith('http');

  return (
    <div className="mt-4 bg-secondary/50 rounded-lg p-3 animate-fade-in">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Globe className="h-5 w-5" />
        <span>Sources</span>
      </div>
      <div className="mt-2 space-y-2 text-sm">
        <ol className="list-decimal list-inside">
          {sources.map((source, index) => (
            <li key={index} className="mb-1">
              {isWebSource(source.url) ? (
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline"
                >
                  {source.title}
                </a>
              ) : (
                <span className="flex items-center gap-2">
                    <Paperclip className="h-4 w-4" />
                    <span>{source.title}</span>
                </span>
              )}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
