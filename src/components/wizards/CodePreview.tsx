
"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertCircle } from 'lucide-react';

interface CodePreviewProps {
  htmlContent?: string;
}

export default function CodePreview({ htmlContent }: CodePreviewProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Interactive Preview</CardTitle>
        <CardDescription>
          This is a live, interactive preview of your generated application.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative w-full h-[600px] overflow-hidden rounded-lg border bg-background">
          {htmlContent ? (
            <iframe
              srcDoc={htmlContent}
              title="Component Preview"
              sandbox="allow-scripts allow-forms" // Allow scripts and forms for interactivity
              className="w-full h-full border-0"
            />
          ) : (
             <div className="flex h-full items-center justify-center">
                <div className="text-center text-muted-foreground">
                <AlertCircle className="mx-auto h-12 w-12" />
                <h3 className="mt-4 text-lg font-semibold">Preview Not Available</h3>
                <p className="mt-2 text-sm">
                    No HTML content was provided for the preview.
                </p>
                </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
