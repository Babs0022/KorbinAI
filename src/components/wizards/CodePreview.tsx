
"use client";

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertCircle } from 'lucide-react';

interface File {
    filePath: string;
    componentCode: string;
}

interface CodePreviewProps {
  mainPageFile: File | undefined;
  globalsCssFile: File | undefined;
  tailwindConfigFile: File | undefined;
}

// A simple parser to extract the body content from a TSX file's return statement.
// This is a basic implementation and might not cover all edge cases.
const extractBodyFromTsx = (tsxCode: string): string => {
    // Find the main return statement of the component.
    const returnMatch = tsxCode.match(/return\s*\(([\s\S]*?)\);/);
    if (!returnMatch) return "<div>Preview generation failed: Could not find return statement.</div>";
    
    let body = returnMatch[1];
    // Remove the root fragment tags if they exist
    body = body.replace(/^\s*<>([\s\S]*)<\/>\s*$/, '$1');
    // Remove className props as they won't work in the iframe without React.
    body = body.replace(/className="[^"]*"/g, '');
    // Replace next/image with standard img tags
    body = body.replace(/<NextImage/g, '<img');
    body = body.replace(/<\/NextImage>/g, '</img>');
    return body;
};

// A simple parser for tailwind.config.ts to generate a style block
const generateTailwindStyles = (configCode: string, cssCode: string): string => {
    // This is a placeholder for a more sophisticated parser.
    // For now, we just return the user's globals.css directly.
    return cssCode;
};


export default function CodePreview({ mainPageFile, globalsCssFile, tailwindConfigFile }: CodePreviewProps) {
  
  const previewHtml = useMemo(() => {
    if (!mainPageFile || !globalsCssFile || !tailwindConfigFile) {
      return null;
    }

    try {
        const bodyContent = extractBodyFromTsx(mainPageFile.componentCode);
        const customStyles = generateTailwindStyles(tailwindConfigFile.componentCode, globalsCssFile.componentCode);

        // We use the Tailwind CDN for simplicity in this preview environment.
        return `
            <!DOCTYPE html>
            <html lang="en" class="dark">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <script src="https://cdn.tailwindcss.com"></script>
                <style>
                    /* Basic body styles to match the app */
                    body { margin: 0; background-color: hsl(0 0% 7%); }
                    /* Inject the user's generated globals.css */
                    ${customStyles}
                </style>
            </head>
            <body>
                ${bodyContent}
            </body>
            </html>
        `;
    } catch(error) {
        console.error("Failed to generate preview HTML:", error);
        return null;
    }
  }, [mainPageFile, globalsCssFile, tailwindConfigFile]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Component Preview</CardTitle>
        <CardDescription>
          This is a static preview of your main page component. Live interactions are not available here.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative w-full h-[600px] overflow-hidden rounded-lg border bg-background">
          {previewHtml ? (
            <iframe
              srcDoc={previewHtml}
              title="Component Preview"
              sandbox="allow-same-origin" // Sandboxed for security, but allows same-origin to load resources if needed
              className="w-full h-full border-0"
            />
          ) : (
             <div className="flex h-full items-center justify-center">
                <div className="text-center text-muted-foreground">
                <AlertCircle className="mx-auto h-12 w-12" />
                <h3 className="mt-4 text-lg font-semibold">Preview Generation Failed</h3>
                <p className="mt-2 text-sm">
                    We couldn't generate a preview from the provided code.
                </p>
                </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
