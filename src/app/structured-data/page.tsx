
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, LoaderCircle, Copy, Check, Sparkles, Wand2 } from "lucide-react";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { generateStructuredData, type GenerateStructuredDataInput } from "@/ai/flows/generate-structured-data-flow";
import { generateJsonSchemaSuggestions } from "@/ai/flows/generate-json-schema-suggestions-flow";
import { useAuth } from "@/contexts/AuthContext";

export default function StructuredDataPage() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  
  // Form State
  const [format, setFormat] = useState("json");
  const [description, setDescription] = useState("");
  const [schemaDefinition, setSchemaDefinition] = useState("");

  // Generation State
  const [isLoading, setIsLoading] = useState(false);
  const [isRefining, setIsRefining] = useState<string | false>(false);
  const [generatedData, setGeneratedData] = useState("");
  const [copied, setCopied] = useState(false);

  // Suggestion State
  const [suggestion, setSuggestion] = useState("");
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [debounceTimeout, setDebounceTimeout] = useState<NodeJS.Timeout | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    const urlDescription = searchParams.get('description');
    if (urlDescription) {
      setDescription(urlDescription);
    }
  }, [searchParams]);

  // Debounced effect for schema suggestions
  useEffect(() => {
    if (debounceTimeout) clearTimeout(debounceTimeout);
    
    if (format !== 'json' || description.trim().split(/\s+/).length < 4) {
      setSuggestion("");
      return;
    }

    setIsSuggesting(true);
    const timeout = setTimeout(async () => {
      try {
        const result = await generateJsonSchemaSuggestions({ description });
        setSuggestion(result.suggestedSchema || "");
      } catch (error) {
        console.error("Failed to get schema suggestions:", error);
        setSuggestion("");
      } finally {
        setIsSuggesting(false);
      }
    }, 1000);

    setDebounceTimeout(timeout);

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [description, format]);


  const handleCopy = () => {
    navigator.clipboard.writeText(generatedData);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setGeneratedData("");
    setIsLoading(true);

    const input: GenerateStructuredDataInput = {
      description,
      format,
      schemaDefinition: schemaDefinition || undefined,
      userId: user?.uid,
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
  
  const handleRefine = async (instruction: string) => {
    setIsRefining(instruction);
    
    const input: GenerateStructuredDataInput = {
      description, // Pass original description for context
      format,
      schemaDefinition: schemaDefinition || undefined,
      originalData: generatedData,
      refinementInstruction: instruction,
      userId: user?.uid,
    };

    try {
      const result = await generateStructuredData(input);
      if (result.generatedData) {
        setGeneratedData(result.generatedData);
        toast({ title: "Data Refined", description: "The data has been updated." });
      } else {
        throw new Error("The AI did not return any refined data.");
      }
    } catch (error) {
      console.error("Failed to refine data:", error);
      toast({
        variant: "destructive",
        title: "Refinement Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred.",
      });
    } finally {
      setIsRefining(false);
    }
  };

  const refinementOptions = [
    { label: "Add 10 more records", instruction: "Add 10 more records to the list, keeping the same structure." },
    { label: "Add unique ID field", instruction: "Add a new field to each record called 'id' with a unique identifier (e.g., a UUID or an incrementing number)." },
    { label: "Sanitize data", instruction: "Review all data and sanitize it for a professional presentation. For example, ensure names are capitalized correctly and emails look realistic." },
  ];

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
            Structured Data Assistant
          </h1>
          <p className="mb-12 text-lg text-muted-foreground">
            Describe the data you need, and our AI will generate and refine it with you.
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
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
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
                   <div className="flex items-center gap-2">
                    <h3 className="text-lg font-medium text-white">
                      JSON Schema/Example <span className="font-normal text-muted-foreground">(optional)</span>
                    </h3>
                    {isSuggesting && <LoaderCircle className="h-4 w-4 animate-spin" />}
                  </div>
                  <Textarea
                    id="schemaDefinition"
                    name="schemaDefinition"
                    placeholder={`e.g., {\n  "name": "string",\n  "class": "string",\n  "level": "number"\n}`}
                    className="min-h-[100px] font-mono text-xs"
                    value={schemaDefinition}
                    onChange={(e) => setSchemaDefinition(e.target.value)}
                    disabled={format !== 'json'}
                  />
                  {format === 'json' && suggestion && (
                    <div className="mt-2 rounded-md border border-dashed border-primary/50 bg-secondary p-2">
                        <div className="flex items-center justify-between gap-2">
                            <p className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Sparkles className="h-4 w-4 text-primary" />
                                <span className="font-semibold text-primary">Suggestion:</span>{" "}
                                We can generate a schema for you.
                            </p>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setSchemaDefinition(suggestion)}
                            >
                                Use Schema
                            </Button>
                        </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button type="submit" size="lg" className="text-lg" disabled={isLoading || !!isRefining || !user}>
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
          <div className="mt-12 space-y-8 animate-fade-in">
            <Card className="rounded-xl">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Your Generated Data</CardTitle>
                <Button variant="ghost" size="icon" onClick={handleCopy}>
                  {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  <span className="sr-only">Copy Data</span>
                </Button>
              </CardHeader>
              <CardContent>
                <SyntaxHighlighter
                  language={format}
                  style={vscDarkPlus}
                  customStyle={{ margin: 0, backgroundColor: 'hsl(var(--secondary))', borderRadius: 'var(--radius)', padding: '1rem' }}
                  codeTagProps={{
                    style: {
                      fontFamily: "var(--font-code, monospace)",
                      fontSize: "0.875rem",
                    },
                  }}
                >
                  {generatedData}
                </SyntaxHighlighter>
              </CardContent>
            </Card>

            <Card className="rounded-xl border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wand2 className="h-5 w-5 text-primary" />
                  Refine Data
                </CardTitle>
                <CardDescription>Not quite right? Let's try improving it.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-3">
                {refinementOptions.map(opt => (
                  <Button 
                    key={opt.instruction}
                    variant="outline"
                    onClick={() => handleRefine(opt.instruction)}
                    disabled={!!isRefining}
                  >
                    {isRefining === opt.instruction && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                    {opt.label}
                  </Button>
                ))}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </main>
  );
}
