"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, LoaderCircle, Copy, Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { generatePrompt, type GeneratePromptInput } from "@/ai/flows/generate-prompt-flow";

export default function PromptGeneratorPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [generatedPrompt, setGeneratedPrompt] = useState("");
  const [explanation, setExplanation] = useState("");
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setGeneratedPrompt("");
    setExplanation("");
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const input: GeneratePromptInput = {
      taskDescription: formData.get("taskDescription") as string,
      targetModel: (formData.get("targetModel") as string) || undefined,
      outputFormat: (formData.get("outputFormat") as string) || undefined,
    };

    if (!input.taskDescription) {
      toast({
        variant: "destructive",
        title: "Task description is required",
        description: "Please describe the task you want the AI to perform.",
      });
      setIsLoading(false);
      return;
    }

    try {
      const result = await generatePrompt(input);
      if (result.generatedPrompt) {
        setGeneratedPrompt(result.generatedPrompt);
        setExplanation(result.explanation);
      } else {
        throw new Error("The AI did not return a prompt.");
      }
    } catch (error) {
      console.error("Failed to generate prompt:", error);
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
            Prompt Generator
          </h1>
          <p className="mb-12 text-lg text-muted-foreground">
            Describe a task, and our AI will craft an optimized prompt for you.
          </p>
        </div>

        <Card className="w-full border-0 bg-card/50 sm:border">
          <CardContent className="p-0 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-2">
                <Label htmlFor="task-description" className="text-base font-semibold">
                  What task do you want the AI to perform?
                </Label>
                <Textarea
                  id="task-description"
                  name="taskDescription"
                  placeholder="e.g., 'Write a tweet about our new product launch' or 'Summarize a long article about climate change'."
                  className="min-h-[120px] text-base"
                  required
                />
              </div>

              <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="target-model" className="text-base font-semibold">
                    Target AI Model <span className="text-muted-foreground">(optional)</span>
                  </Label>
                  <Input id="target-model" name="targetModel" placeholder="e.g., 'Gemini 1.5 Pro'" className="text-base" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="output-format" className="text-base font-semibold">
                    Desired Output Format <span className="text-muted-foreground">(optional)</span>
                  </Label>
                  <Input id="output-format" name="outputFormat" placeholder="e.g., 'JSON with 'name' and 'summary' keys'" className="text-base" />
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
                    "Generate Prompt"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {generatedPrompt && (
          <div className="mt-12 space-y-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Your Generated Prompt</CardTitle>
                <Button variant="ghost" size="icon" onClick={handleCopy}>
                  {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  <span className="sr-only">Copy Prompt</span>
                </Button>
              </CardHeader>
              <CardContent>
                <div className="prose dark:prose-invert max-w-none whitespace-pre-wrap rounded-md border bg-muted/50 p-4">
                  {generatedPrompt}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50">
               <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl">
                        <Sparkles className="h-5 w-5 text-primary" />
                        Prompt Engineering Tips
                    </CardTitle>
                    <CardDescription>Here’s why this prompt is effective:</CardDescription>
                </CardHeader>
               <CardContent>
                 <div className="prose-sm dark:prose-invert max-w-none text-muted-foreground">
                    {explanation}
                 </div>
               </CardContent>
            </Card>
          </div>
        )}
      </div>
    </main>
  );
}
