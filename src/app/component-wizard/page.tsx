"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, LoaderCircle } from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { generateSectionSuggestions } from "@/ai/flows/generate-section-suggestions-flow";
import { cn } from "@/lib/utils";

export default function ComponentWizardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [generationMode, setGenerationMode] = useState("existing");
  const [description, setDescription] = useState("");
  const [style, setStyle] = useState("minimalist");
  const [dataPoints, setDataPoints] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<string>>(new Set());
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [debounceTimeout, setDebounceTimeout] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const urlDescription = searchParams.get('description');
    if (urlDescription) {
      setDescription(urlDescription);
    }
  }, [searchParams]);

  useEffect(() => {
    setDataPoints(Array.from(selectedSuggestions).join(", "));
  }, [selectedSuggestions]);

  useEffect(() => {
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }

    if (description.trim().split(/\s+/).length < 3) {
      setSuggestions([]);
      return;
    }

    setIsSuggesting(true);
    const timeout = setTimeout(async () => {
      try {
        const result = await generateSectionSuggestions({ description });
        setSuggestions(result.suggestions || []);
      } catch (error) {
        console.error("Failed to get suggestions:", error);
        setSuggestions([]);
      } finally {
        setIsSuggesting(false);
      }
    }, 750);

    setDebounceTimeout(timeout);

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [description]);

  const handleToggleSuggestion = (suggestion: string) => {
    setSelectedSuggestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(suggestion)) {
        newSet.delete(suggestion);
      } else {
        newSet.add(suggestion);
      }
      return newSet;
    });
  };

  const handleDataPointsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDataPoints(value);
    const newSelected = new Set(value.split(',').map(s => s.trim()).filter(Boolean));
    setSelectedSuggestions(newSelected);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!description) return;
    setIsLoading(true);

    const params = new URLSearchParams({
      generationMode,
      description,
      style,
      dataPoints,
    });

    router.push(`/component-wizard/result?${params.toString()}`);
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
          <h1 className="mb-2 text-4xl font-bold text-white md:text-5xl">
            Let's build your Application
          </h1>
          <p className="mb-12 text-lg text-white/70">
            Describe the application, page, or feature you want to build.
          </p>
        </div>

        <Card className="w-full rounded-xl">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-8">

               <div className="grid w-full items-center gap-4">
                <h3 className="text-lg font-medium text-white">What are you building?</h3>
                <RadioGroup
                  id="generation-mode"
                  value={generationMode}
                  onValueChange={setGenerationMode}
                  className="grid grid-cols-1 gap-4 sm:grid-cols-2"
                >
                  <div>
                    <RadioGroupItem value="existing" id="mode-existing" className="peer sr-only" />
                    <Label htmlFor="mode-existing" className="flex h-full flex-col items-center justify-center rounded-md border-2 border-accent bg-secondary p-4 text-center hover:cursor-pointer hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 [&:has([data-state=checked])]:border-primary">
                      A new page for my existing app
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem value="new" id="mode-new" className="peer sr-only" />
                    <Label htmlFor="mode-new" className="flex h-full flex-col items-center justify-center rounded-md border-2 border-accent bg-secondary p-4 text-center hover:cursor-pointer hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 [&:has([data-state=checked])]:border-primary">
                      A complete, new application
                    </Label>
                  </div>
                </RadioGroup>
              </div>
              
              <div className="grid w-full items-center gap-2">
                <h3 className="text-lg font-medium text-white">
                  In plain English, describe what you want to build.
                </h3>
                <Textarea
                  id="component-description"
                  placeholder="e.g., 'A landing page for a new SaaS app' or 'A dashboard for an e-commerce store.'"
                  className="min-h-[120px] text-base"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>

              <div className="grid w-full items-center gap-4">
                <h3 className="text-lg font-medium text-white">
                  What is the visual style of your brand?
                </h3>
                <RadioGroup
                  id="visual-style"
                  value={style}
                  onValueChange={setStyle}
                  className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4"
                >
                  {[
                    { value: 'minimalist', label: 'Minimalist & Modern' },
                    { value: 'playful', label: 'Playful & Creative' },
                    { value: 'corporate', label: 'Corporate & Professional' },
                    { value: 'futuristic', label: 'Bold & Futuristic' },
                  ].map(({ value, label }) => (
                    <div key={value}>
                      <RadioGroupItem value={value} id={`style-${value}`} className="peer sr-only" />
                      <Label htmlFor={`style-${value}`} className="flex h-full flex-col items-center justify-center rounded-md border-2 border-accent bg-secondary p-4 hover:cursor-pointer hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 [&:has([data-state=checked])]:border-primary">
                        {label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <h3 className="text-lg font-medium text-white">
                        Suggested Sections
                    </h3>
                    {isSuggesting && <LoaderCircle className="h-4 w-4 animate-spin" />}
                </div>
                {suggestions.length > 0 && (
                    <div className="flex flex-wrap gap-3">
                    {suggestions.map(suggestion => (
                        <button
                        key={suggestion}
                        type="button"
                        onClick={() => handleToggleSuggestion(suggestion)}
                        className={cn(
                            "rounded-md px-4 py-2 text-sm font-medium transition-colors",
                            selectedSuggestions.has(suggestion)
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-secondary-foreground hover:bg-accent"
                        )}
                        >
                        {suggestion}
                        </button>
                    ))}
                    </div>
                )}
              </div>

              <div className="grid w-full items-center gap-2">
                <h3 className="text-lg font-medium text-white">
                  Are there any specific sections or data points you want to include? (Optional)
                </h3>
                <Input
                  id="data-points"
                  placeholder="e.g., Hero Section, Features, Testimonials"
                  className="text-base"
                  value={dataPoints}
                  onChange={handleDataPointsChange}
                />
              </div>

              <div className="flex justify-end pt-4">
                <Button type="submit" size="lg" className="text-lg" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    "Generate Application"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
