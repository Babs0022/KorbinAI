"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, LoaderCircle, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { generateStructuredData, type GenerateStructuredDataInput } from "@/ai/flows/generate-structured-data-flow";

export default function StructuredDataPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [generatedData, setGeneratedData] = useState("");
  const [copied, setCopied] = useState(false);
  const [format, setFormat] = useState("json");
  const { toast } = useToast();

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedData);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setGeneratedData("");
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const input: GenerateStructuredDataInput = {
      description: formData.get("description") as string,
      format: format,
      schemaDefinition: (formData.get("schemaDefinition") as string) || undefined,
    };

    if (!input.description) {
      toast({
        variant: "destructive",
        title: "Description is required",
        description: "Please describe the data you want to generate.",
      });
      setIsLoading(false);
      return;
    }

    try {
      const result = await generateStructuredData(input);
      if (result.generatedData) {
        setGeneratedData(result.generatedData);
      } else {
        throw new Error("The AI did not return any data.");
      }
    } catch (error) {
      console.error("Failed to generate data:", error);
      toast({
        variant: "destructive",
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-4 md:p-8">
      <div className="w-full max-w-4xl">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Creation Hub
        </Link>

        <div className="text-center">
          <h1 className="mb-2 text-4xl font-bold md:text-5xl">
            Generate Structured Data
          </h1>
          <p className="mb-12 text-lg text-muted-foreground">
            Describe the data you need, and the AI will generate it in your chosen format.
          </p>
        </div>

        <Card className="w-full rounded-xl">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-2">
                <h3 className="text-lg font-medium text-white">
                  What data do you want to generate?
                </h3>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="e.g., 'A list of 5 fantasy book characters with names, classes, and levels' or 'A CSV of 10 sample customers with first name, last name, and email'."
                  className="min-h-[120px] text-base"
                  required
                />
              </div>

              <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-white">
                    Output Format
                  </h3>
                  <RadioGroup
                    value={format}
                    onValueChange={setFormat}
                    className="flex items-center gap-6 pt-1"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="json" id="format-json" />
                      <Label htmlFor="format-json" className="text-base">JSON</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="csv" id="format-csv" />
                      <Label htmlFor="format-csv" className="text-base">CSV</Label>
                    </div>
                  </RadioGroup>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-lg font-medium text-white">
                    JSON Schema/Example <span className="font-normal text-muted-foreground">(optional)</span>
                  </h3>
                  <Textarea
                    id="schemaDefinition"
                    name="schemaDefinition"
                    placeholder={`e.g., {\n  "name": "string",\n  "class": "string",\n  "level": "number"\n}`}
                    className="min-h-[100px] font-mono text-xs"
                    disabled={format !== 'json'}
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button type="submit" size="lg" className="text-lg" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    "Generate Data"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {generatedData && (
          <Card className="mt-12 rounded-xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Your Generated Data</CardTitle>
              <Button variant="ghost" size="icon" onClick={handleCopy}>
                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                <span className="sr-only">Copy Data</span>
              </Button>
            </CardHeader>
            <CardContent>
              <pre className="prose dark:prose-invert max-w-none whitespace-pre-wrap rounded-md bg-secondary p-4">
                <code>{generatedData}</code>
              </pre>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
