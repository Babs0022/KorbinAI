
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, LoaderCircle, Copy, Check, Sparkles, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { generateWrittenContent, GenerateWrittenContentInput } from "@/ai/flows/generate-written-content-flow";
import { generateContentSuggestions, GenerateContentSuggestionsOutput } from "@/ai/flows/generate-content-suggestions-flow";
import { useAuth } from "@/contexts/AuthContext";

export default function WrittenContentPage() {
  const searchParams = useSearchParams();
  const { user } = useAuth();

  // Form state
  const [contentType, setContentType] = useState("blog-post");
  const [tone, setTone] = useState("professional");
  const [topic, setTopic] = useState("");
  const [audience, setAudience] = useState("");
  const [keywords, setKeywords] = useState("");
  
  // Generation state
  const [isLoading, setIsLoading] = useState(false);
  const [isRefining, setIsRefining] = useState<string | false>(false);
  const [generatedContent, setGeneratedContent] = useState("");
  const [copied, setCopied] = useState(false);
  
  // Suggestion state
  const [suggestions, setSuggestions] = useState<GenerateContentSuggestionsOutput>({ suggestedAudience: '', suggestedKeywords: [] });
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [debounceTimeout, setDebounceTimeout] = useState<NodeJS.Timeout | null>(null);

  const { toast } = useToast();
  
  useEffect(() => {
    const urlTopic = searchParams.get('topic');
    if (urlTopic) {
      setTopic(urlTopic);
    }
  }, [searchParams]);

  // Debounced effect for suggestions
  useEffect(() => {
    if (debounceTimeout) clearTimeout(debounceTimeout);
    
    if (topic.trim().split(/\s+/).length < 4) {
      setSuggestions({ suggestedAudience: '', suggestedKeywords: [] });
      return;
    }

    setIsSuggesting(true);
    const timeout = setTimeout(async () => {
      try {
        const result = await generateContentSuggestions({ topic });
        setSuggestions(result);
      } catch (error) {
        console.error("Failed to get suggestions:", error);
        setSuggestions({ suggestedAudience: '', suggestedKeywords: [] });
      } finally {
        setIsSuggesting(false);
      }
    }, 1000);

    setDebounceTimeout(timeout);

    return () => {
      if (timeout) clearTimeout(timeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topic]);

  const handleAddKeyword = (keyword: string) => {
    setKeywords(prev => {
      const kwSet = new Set(prev.split(',').map(k => k.trim()).filter(Boolean));
      kwSet.add(keyword);
      return Array.from(kwSet).join(', ');
    });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setGeneratedContent("");
    setIsLoading(true);

    const input: GenerateWrittenContentInput = {
      contentType,
      tone,
      topic,
      audience,
      keywords,
      userId: user?.uid,
    };

    if (!input.topic) {
        toast({
            variant: "destructive",
            title: "Topic is required",
            description: "Please describe the main topic or message for your content.",
        });
        setIsLoading(false);
        return;
    }

    try {
      const result = await generateWrittenContent(input);
      if (result.generatedContent) {
        setGeneratedContent(result.generatedContent);
      } else {
        throw new Error("The AI did not return any content.");
      }
    } catch (error) {
      console.error("Failed to generate content:", error);
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
    
    const input: GenerateWrittenContentInput = {
      contentType, 
      tone,
      topic,
      originalContent: generatedContent,
      refinementInstruction: instruction,
      userId: user?.uid,
    };

    try {
      const result = await generateWrittenContent(input);
      if (result.generatedContent) {
        setGeneratedContent(result.generatedContent);
        toast({ title: "Content Refined", description: "The content has been updated." });
      } else {
        throw new Error("The AI did not return any refined content.");
      }
    } catch (error) {
      console.error("Failed to refine content:", error);
      toast({
        variant: "destructive",
        title: "Refinement Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred.",
      });
    } finally {
      setIsRefining(false);
    }
  }

  const refinementOptions = [
    { label: "Make Shorter", instruction: "Make it shorter" },
    { label: "Make Longer", instruction: "Make it longer and more detailed" },
    { label: `Change tone to ${tone === 'professional' ? 'Casual' : 'Professional'}`, instruction: `Change the tone of voice to be more ${tone === 'professional' ? 'casual and friendly' : 'professional and formal'}` },
    { label: "Add Call-to-Action", instruction: "Add a compelling call-to-action at the end" },
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
            Written Content Assistant
          </h1>
          <p className="mb-12 text-lg text-muted-foreground">
            Describe the content you want to create, and our AI will write and refine it with you.
          </p>
        </div>

        <Card className="w-full rounded-xl">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                <div className="space-y-2">
                  <h3 className="text-lg font-medium text-white">
                    What type of content do you need?
                  </h3>
                  <Select name="contentType" value={contentType} onValueChange={setContentType}>
                    <SelectTrigger id="content-type" className="text-base">
                      <SelectValue placeholder="Select a content type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="blog-post">Blog Post</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="social-media-update">Social Media Update</SelectItem>
                      <SelectItem value="ad-copy">Ad Copy</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-white">
                    Choose a tone of voice
                  </h3>
                   <RadioGroup
                    value={tone}
                    onValueChange={setTone}
                    className="grid grid-cols-2 gap-4 pt-2"
                  >
                    {[
                      { value: 'professional', label: 'Professional' },
                      { value: 'casual', label: 'Casual' },
                      { value: 'witty', label: 'Witty' },
                      { value: 'persuasive', label: 'Persuasive' },
                    ].map(({ value, label }) => (
                      <div key={value}>
                        <RadioGroupItem value={value} id={`tone-${value}`} className="peer sr-only" />
                        <Label htmlFor={`tone-${value}`} className="flex h-full items-center justify-center rounded-md border-2 border-accent bg-secondary px-4 py-2 hover:cursor-pointer hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 [&:has([data-state=checked])]:border-primary">
                          {label}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-medium text-white">
                    What is the main topic or message?
                  </h3>
                  {isSuggesting && <LoaderCircle className="h-4 w-4 animate-spin" />}
                </div>
                <Textarea
                  id="topic"
                  name="topic"
                  placeholder="e.g., 'Announcing our new feature that helps users save time' or 'The benefits of using our product for small businesses'."
                  className="min-h-[120px] text-base"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                 <div className="space-y-2">
                    <h3 className="text-lg font-medium text-white">
                      Who is the target audience? <span className="font-normal text-muted-foreground">(optional)</span>
                    </h3>
                    <Input id="audience" name="audience" placeholder="e.g., 'Software developers' or 'Mothers in their 30s'" className="text-base" value={audience} onChange={(e) => setAudience(e.target.value)} />
                    {suggestions.suggestedAudience && (
                        <div className="mt-2 rounded-md border border-dashed border-primary/50 bg-secondary p-2">
                            <div className="flex items-center justify-between gap-2">
                                <p className="text-sm text-muted-foreground">
                                    <span className="font-semibold text-primary">Suggestion:</span>{" "}
                                    {suggestions.suggestedAudience}
                                </p>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setAudience(suggestions.suggestedAudience)}
                                >
                                    Use
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
                 <div className="space-y-2">
                    <h3 className="text-lg font-medium text-white">
                      Keywords to include <span className="font-normal text-muted-foreground">(comma-separated, optional)</span>
                    </h3>
                    <Input id="keywords" name="keywords" placeholder="e.g., 'AI, productivity, automation'" className="text-base" value={keywords} onChange={(e) => setKeywords(e.target.value)} />
                    {suggestions.suggestedKeywords.length > 0 && (
                        <div className="mt-2 space-y-2">
                            <p className="text-xs text-muted-foreground flex items-center gap-1.5"><Sparkles className="h-3 w-3 text-primary" /> Suggestions:</p>
                            <div className="flex flex-wrap gap-2">
                                {suggestions.suggestedKeywords.map(kw => (
                                    <Button
                                        key={kw}
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleAddKeyword(kw)}
                                        className="text-xs"
                                    >
                                       + {kw}
                                    </Button>
                                ))}
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
                    "Generate Content"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {generatedContent && (
            <div className="mt-12 space-y-8 animate-fade-in">
                <Card className="rounded-xl">
                    <CardHeader className="flex flex-row items-center justify-between p-4">
                    <CardTitle>Your Generated Content</CardTitle>
                    <Button variant="ghost" size="icon" onClick={handleCopy}>
                        {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                        <span className="sr-only">Copy Content</span>
                    </Button>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                    <div className="prose dark:prose-invert max-w-none whitespace-pre-wrap rounded-md bg-secondary p-4">
                        {generatedContent}
                    </div>
                    </CardContent>
                </Card>

                <Card className="rounded-xl border-primary/20 bg-primary/5">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Wand2 className="h-5 w-5 text-primary" />
                            Refine & Improve
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
