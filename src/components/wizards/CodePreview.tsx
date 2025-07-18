
"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertCircle } from 'lucide-react';

interface CodePreviewProps {
  mainPageFile: {
    filePath: string;
    componentCode: string;
  } | undefined;
}

export default function CodePreview({ mainPageFile }: CodePreviewProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Component Preview</CardTitle>
        <CardDescription>
          This is a static preview of your main page component. Live interactions are not available here.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative w-full h-[600px] overflow-hidden rounded-lg border bg-background p-4">
          <div className="flex h-full items-center justify-center">
            <div className="text-center text-muted-foreground">
              <AlertCircle className="mx-auto h-12 w-12" />
              <h3 className="mt-4 text-lg font-semibold">Live Preview Not Yet Available</h3>
              <p className="mt-2 text-sm">
                The full live preview feature is currently under construction.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
