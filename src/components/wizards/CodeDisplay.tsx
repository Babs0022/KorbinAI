"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";

interface CodeDisplayProps {
  componentName: string;
  componentCode: string;
}

export default function CodeDisplay({ componentName, componentCode }: CodeDisplayProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(componentCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{componentName}.tsx</CardTitle>
        <Button variant="ghost" size="icon" onClick={handleCopy}>
          {copied ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
          <span className="sr-only">Copy Code</span>
        </Button>
      </CardHeader>
      <CardContent>
        <pre className="p-4 bg-muted/50 rounded-lg overflow-x-auto text-sm">
          <code>{componentCode}</code>
        </pre>
      </CardContent>
    </Card>
  );
}
