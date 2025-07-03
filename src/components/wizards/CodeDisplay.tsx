"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Check, Terminal } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
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

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
  };

  return (
    <div className="relative">
      <Button variant="ghost" size="icon" className="absolute right-2 top-2 h-7 w-7" onClick={handleCopy}>
        {copied ? (
          <Check className="h-4 w-4 text-green-500" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
        <span className="sr-only">Copy Code</span>
      </Button>
      <pre className="p-4 bg-muted/50 rounded-lg overflow-x-auto text-sm">
        <code>{code}</code>
      </pre>
    </div>
  );
}

export default function MultiCodeDisplay({ files, finalInstructions }: MultiCodeDisplayProps) {
  // Automatically open the first file, which is typically page.tsx
  const defaultValue = files.length > 0 ? files[0].filePath : undefined;

  return (
    <div className="space-y-8">
        <div>
            <h2 className="text-3xl font-bold">Your Application is Ready!</h2>
            <p className="mt-2 text-lg text-muted-foreground">Follow the steps below to set up your new application files.</p>
        </div>

      <Accordion type="single" collapsible className="w-full" defaultValue={defaultValue}>
        {files.map((file) => (
          <AccordionItem value={file.filePath} key={file.filePath}>
            <AccordionTrigger className="text-lg font-semibold hover:no-underline">
                {file.filePath}
            </AccordionTrigger>
            <AccordionContent className="space-y-4">
              <p className="text-muted-foreground">{file.instructions}</p>
              <CodeBlock code={file.componentCode} />
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <Terminal />
                Final Steps
            </CardTitle>
            <CardDescription>
                Complete these final steps to run your application.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <p className="text-foreground">{finalInstructions}</p>
        </CardContent>
      </Card>
    </div>
  );
}
