"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, LoaderCircle, Sparkles } from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { generateSectionSuggestions } from "@/ai/flows/generate-section-suggestions-flow";
import { cn } from "@/lib/utils";

export default function ComponentWizardPage() {
  const router = useRouter();
  const [description, setDescription] = useState("");
  const [style, setStyle] = useState("minimalist");
  const [isLoading, setIsLoading] = useState(false);

  // New state for suggestions
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<string>>(new Set());
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [debounceTimeout, setDebounceTimeout] = useState<NodeJS.Timeout | null>(null);

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
    }, 750); // 750ms debounce delay

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

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!description) return;
    setIsLoading(true);

    const params = new URLSearchParams({
      description,
      style,
      dataPoints: Array.from(selectedSuggestions).join(", "),
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
          <h1 className="mb-2 text-4xl font-bold md:text-5xl">
            Let's build your Application
          </h1>
          <p className="mb-12 text-lg text-muted-foreground">
            Describe the application, page, or feature you want to build.
          </p>
        </div>

        <Card className="w-full border-0 bg-card/50 sm:border">
          <CardContent className="p-0 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid w-full items-center gap-2">
                <Label htmlFor="component-description" className="text-base font-semibold">
                  In plain English, describe what you want to build.
                </Label>
                <Textarea
                  id="component-description"
                  placeholder="e.g., 'A SaaS landing page with a hero, features, and pricing sections' or 'A dashboard for an e-commerce store.'"
                  className="min-h-[120px] text-base"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>

              <div className="grid w-full items-center gap-4">
                <Label className="text-base font-semibold">
                  What is the visual style of your brand?
                </Label>
                <RadioGroup
                  id="visual-style"
                  value={style}
                  onValueChange={setStyle}
                  className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4"
                >
                  <div>
                    <RadioGroupItem value="minimalist" id="style-minimalist" className="peer sr-only" />
                    <Label htmlFor="style-minimalist" className="flex h-full flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:cursor-pointer hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                      Minimalist & Modern
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem value="playful" id="style-playful" className="peer sr-only" />
                    <Label htmlFor="style-playful" className="flex h-full flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:cursor-pointer hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                      Playful & Creative
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem value="corporate" id="style-corporate" className="peer sr-only" />
                    <Label htmlFor="style-corporate" className="flex h-full flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:cursor-pointer hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                      Corporate & Professional
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem value="futuristic" id="style-futuristic" className="peer sr-only" />
                    <Label htmlFor="style-futuristic" className="flex h-full flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:cursor-pointer hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                      Bold & Futuristic
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-4 rounded-lg bg-background/50 p-4">
                <div className="flex items-center gap-2">
                  <Label className="text-base font-semibold">
                    Suggested Sections
                  </Label>
                  {isSuggesting && <LoaderCircle className="h-4 w-4 animate-spin text-muted-foreground" />}
                </div>

                {suggestions.length > 0 ? (
                  <div className="flex flex-wrap gap-3">
                    {suggestions.map(suggestion => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => handleToggleSuggestion(suggestion)}
                        className={cn(
                          "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                          selectedSuggestions.has(suggestion)
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                        )}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                ) : (
                  !isSuggesting && description.trim().split(/\s+/).length >= 3 && (
                    <div className="flex items-center gap-3 rounded-lg border border-dashed border-border p-4">
                      <Sparkles className="h-6 w-6 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">We'll suggest sections here once you provide a more detailed description above.</p>
                    </div>
                  )
                )}
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
