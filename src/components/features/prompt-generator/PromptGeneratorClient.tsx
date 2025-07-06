
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { LoaderCircle, Sparkles, ArrowRight, Save } from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { saveProject } from '@/services/projectService';

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { generatePrompt, type GeneratePromptInput } from "@/ai/flows/generate-prompt-flow";
import { generatePromptFormatSuggestions } from "@/ai/flows/generate-prompt-format-suggestions-flow";
import { analyzePrompt, type AnalyzePromptOutput } from "@/ai/flows/analyze-prompt-flow";
import GenerationResultCard from "@/components/shared/GenerationResultCard";

export default function PromptGeneratorClient() {
  // Form State
  const [taskDescription, setTaskDescription] = useState("");
  const [targetModel, setTargetModel] = useState("");
  const [outputFormat, setOutputFormat] = useState("");

  // Generation State
  const [isLoading, setIsLoading] = useState(false);
  const [generatedPrompt, setGeneratedPrompt] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [projectId, setProjectId] = useState<string | null>(null);

  // Suggestion State
  const [formatSuggestions, setFormatSuggestions] = useState<string[]>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [debounceTimeout, setDebounceTimeout] = useState<NodeJS.Timeout | null>(null);
  const [toolSuggestion, setToolSuggestion] = useState<AnalyzePromptOutput | null>(null);

  const { toast } = useToast();
  const { user } = useAuth();

  const toolMap: Record<string, { href: string; queryParam: string }> = {
    'image-generator': { href: '/image-generator', queryParam: 'prompt' },
    'written-content': { href: '/written-content', queryParam: 'topic' },
    'component-wizard': { href: '/component-wizard', queryParam: 'description' },
    'structured-data': { href: '/structured-data', queryParam: 'description' },
  };

  useEffect(() => {
    if (debounceTimeout) clearTimeout(debounceTimeout);
    
    if (taskDescription.trim().split(/\s+/).length < 3) {
      setFormatSuggestions([]);
      return;
    }

    setIsSuggesting(true);
    const timeout = setTimeout(async () => {
      try {
        const result = await generatePromptFormatSuggestions({ taskDescription });
        setFormatSuggestions(result.suggestions || []);
      } catch (error) {
        console.error("Failed to get suggestions:", error);
        setFormatSuggestions([]);
      } finally {
        setIsSuggesting(false);
      }
    }, 1000);

    setDebounceTimeout(timeout);

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [taskDescription]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setGeneratedPrompt("");
    setToolSuggestion(null);
    setIsLoading(true);
    setProjectId(null); // Reset save state

    const input: GeneratePromptInput = {
      taskDescription,
      targetModel: targetModel || undefined,
      outputFormat: outputFormat || undefined,
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
        
        const analysisResult = await analyzePrompt({ prompt: result.generatedPrompt });
        if (analysisResult && analysisResult.tool !== 'none') {
            setToolSuggestion(analysisResult);
        }
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

  const handleSave = async () => {
    if (!user || !generatedPrompt) return;
    setIsSaving(true);
    try {
      const id = await saveProject({
        userId: user.uid,
        type: 'prompt',
        content: generatedPrompt,
      });
      setProjectId(id);
      toast({
        title: "Project Saved!",
        description: "Your prompt has been saved to your projects.",
        action: (
          <ToastAction altText="View Project" asChild>
            <Link href={`/dashboard/projects/${id}`}>View</Link>
          </ToastAction>
        ),
      });
    } catch (error) {
      console.error("Failed to save project:", error);
      toast({
        variant: "destructive",
        title: "Save Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred.",
      });
    } finally {
      setIsSaving(false);
    }
  };


  return (
    <>
      <Card className="w-full rounded-xl">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-2">
              <h3 className="text-lg font-medium text-white">
                What task do you want the AI to perform?
              </h3>
              <Textarea
                id="task-description"
                name="taskDescription"
                placeholder="e.g., 'Write a tweet about our new product launch' or 'Summarize a long article about climate change'."
                className="min-h-[120px] text-base"
                value={taskDescription}
                onChange={(e) => setTaskDescription(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              <div className="space-y-2">
                <h3 className="text-lg font-medium text-white">
                  Target AI Model <span className="font-normal text-muted-foreground">(optional)</span>
                </h3>
                <Input 
                  id="target-model" 
                  name="targetModel" 
                  placeholder="e.g., 'Gemini 1.5 Pro'" 
                  className="text-base" 
                  value={targetModel}
                  onChange={(e) => setTargetModel(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-medium text-white">
                    Desired Output Format <span className="font-normal text-muted-foreground">(optional)</span>
                  </h3>
                  {isSuggesting && <LoaderCircle className="h-4 w-4 animate-spin" />}
                </div>
                <Input 
                  id="output-format" 
                  name="outputFormat" 
                  placeholder="e.g., 'JSON with 'name' and 'summary' keys'" 
                  className="text-base" 
                  value={outputFormat}
                  onChange={(e) => setOutputFormat(e.target.value)}
                />
                 {formatSuggestions.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2">
                        {formatSuggestions.map(suggestion => (
                            <Button
                                key={suggestion}
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setOutputFormat(suggestion)}
                                className="text-xs"
                            >
                                <Sparkles className="mr-1 h-3 w-3 text-primary" /> {suggestion}
                            </Button>
                        ))}
                    </div>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button type="submit" size="lg" className="text-lg" disabled={isLoading || !user}>
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

      {isLoading && !generatedPrompt && (
        <div className="flex items-center justify-center pt-12">
            <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {generatedPrompt && (
        <div className="mt-12 space-y-8">
          <GenerationResultCard
            title="Your Generated Prompt"
            content={generatedPrompt}
            variant="prose"
          />

          <div className="flex justify-between items-center">
            {toolSuggestion && toolSuggestion.tool !== 'none' && toolMap[toolSuggestion.tool] ? (
              <Card className="rounded-xl bg-primary/10 border border-dashed border-primary/50 animate-fade-in">
                <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Sparkles className="h-8 w-8 text-primary shrink-0" />
                        <div className="text-center sm:text-left">
                            <h3 className="text-lg font-semibold text-white">Let's Create!</h3>
                            <p className="text-muted-foreground">{toolSuggestion.suggestion}</p>
                        </div>
                    </div>
                    <Button size="lg" className="shrink-0" asChild>
                      <Link
                          href={{
                              pathname: toolMap[toolSuggestion.tool].href,
                              query: { [toolMap[toolSuggestion.tool].queryParam]: generatedPrompt },
                          }}
                      >
                          Try It Now
                          <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                </CardContent>
              </Card>
            ) : <div />}

            <Button onClick={handleSave} disabled={isSaving || !!projectId} size="lg">
              {isSaving ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              {projectId ? 'Saved' : 'Save Project'}
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
