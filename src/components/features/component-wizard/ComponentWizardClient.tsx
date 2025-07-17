
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LoaderCircle, Sparkles, Wand2, ChevronsRight, FileCode2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { generateSectionSuggestions } from "@/ai/flows/generate-section-suggestions-flow";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";

const STEPS = [
  { step: 1, title: "The Core Idea", icon: <Wand2 /> },
  { step: 2, title: "Structure & Style", icon: <Sparkles /> },
  { step: 3, title: "Review & Generate", icon: <FileCode2 /> },
];

export default function ComponentWizardClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const [step, setStep] = useState(1);
  const [generationMode, setGenerationMode] = useState("existing");
  const [description, setDescription] = useState("");
  const [style, setStyle] = useState("minimalist");
  const [suggestedSections, setSuggestedSections] = useState<string[]>([]);
  const [selectedSections, setSelectedSections] = useState<Set<string>>(new Set());
  const [customSection, setCustomSection] = useState("");
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);

  useEffect(() => {
    const urlDescription = searchParams.get('description');
    if (urlDescription) {
      setDescription(urlDescription);
    }
  }, [searchParams]);
  
  const dataPoints = useMemo(() => {
      // Create an ordered list based on original suggestions and then custom ones
      const orderedSelection = [
        ...suggestedSections.filter(section => selectedSections.has(section)),
        ...Array.from(selectedSections).filter(section => !suggestedSections.includes(section))
      ];
      return orderedSelection.join(', ');
  }, [selectedSections, suggestedSections]);

  const handleNextStep = async () => {
    if (step === 1 && description.trim().split(/\s+/).length >= 3) {
      setIsSuggesting(true);
      try {
        const result = await generateSectionSuggestions({ description });
        const initialSections = result.suggestions || [];
        setSuggestedSections(initialSections);
        setSelectedSections(new Set(initialSections));
      } catch (error) {
        console.error("Failed to get suggestions:", error);
        setSuggestedSections([]);
        setSelectedSections(new Set());
      } finally {
        setIsSuggesting(false);
        setStep(2);
      }
    } else {
      setStep(s => Math.min(s + 1, STEPS.length));
    }
  };

  const handleToggleSection = (section: string) => {
    setSelectedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  };

  const handleAddCustomSection = () => {
    if (customSection.trim()) {
        setSelectedSections(prev => {
            const newSet = new Set(prev);
            newSet.add(customSection.trim());
            return newSet;
        });
        setCustomSection("");
    }
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
    <>
        {/* Stepper */}
        <div className="mb-12 flex items-center justify-center gap-4 md:gap-8">
          {STEPS.map((s, index) => (
            <React.Fragment key={s.step}>
              <div className="flex flex-col items-center gap-2 text-center">
                <div
                  className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-full border-2 transition-all",
                    step === s.step ? "border-primary bg-primary/10 text-primary" : "border-border bg-secondary text-muted-foreground",
                    step > s.step ? "border-primary bg-primary/10 text-primary" : ""
                  )}
                >
                  {s.icon}
                </div>
                <p className={cn("text-sm font-medium", step >= s.step ? "text-foreground" : "text-muted-foreground")}>{s.title}</p>
              </div>
              {index < STEPS.length - 1 && (
                <div className={cn("h-1 flex-1 rounded-full", step > index + 1 ? "bg-primary" : "bg-border")} />
              )}
            </React.Fragment>
          ))}
        </div>

        <div className="w-full">
            <form onSubmit={handleSubmit} className="space-y-8">
              {step === 1 && (
                <div className="space-y-8 animate-fade-in">
                  <div className="grid w-full items-center gap-2">
                    <h3 className="text-xl font-medium text-white">In plain English, describe what you want to build.</h3>
                    <p className="text-muted-foreground">Be descriptive! The more detail you provide, the better the result.</p>
                    <Textarea
                      id="component-description"
                      placeholder="e.g., 'A modern landing page for a new AI-powered mobile app that helps with scheduling' or 'A user dashboard for an e-commerce store that shows recent orders and account details.'"
                      className="min-h-[150px] text-base"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      required
                    />
                  </div>
                  <div className="flex justify-end pt-4">
                    <Button type="button" size="lg" className="text-lg" onClick={handleNextStep} disabled={description.trim().split(/\s+/).length < 5 || isSuggesting}>
                       {isSuggesting ? (
                          <>
                            <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                            Analyzing...
                          </>
                        ) : (
                          <>
                            Next: Structure & Style
                            <ChevronsRight className="ml-2 h-4 w-4" />
                          </>
                        )}
                    </Button>
                  </div>
                </div>
              )}

              {step === 2 && (
                 <div className="space-y-8 animate-fade-in">
                    {/* Sections */}
                    <div className="space-y-4">
                        <h3 className="text-xl font-medium text-white">Define Page Structure</h3>
                        <p className="text-muted-foreground">We've suggested some sections based on your description. Add, remove, or customize them as needed.</p>
                        <div className="flex flex-wrap gap-3">
                        {suggestedSections.map(section => (
                            <button
                            key={section}
                            type="button"
                            onClick={() => handleToggleSection(section)}
                            className={cn(
                                "rounded-full px-4 py-2 text-sm font-medium transition-colors border-2",
                                selectedSections.has(section)
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-secondary text-secondary-foreground border-accent hover:bg-accent"
                            )}
                            >
                            {selectedSections.has(section) ? '✓ ' : '+ '}{section}
                            </button>
                        ))}
                        </div>
                         <div className="flex gap-2">
                            <Input
                                placeholder="Add a custom section..."
                                value={customSection}
                                onChange={(e) => setCustomSection(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddCustomSection(); }}}
                            />
                            <Button type="button" variant="outline" onClick={handleAddCustomSection}>Add</Button>
                        </div>
                    </div>

                    {/* Style */}
                    <div className="grid w-full items-center gap-4">
                        <h3 className="text-xl font-medium text-white">Define Visual Style</h3>
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
                              <Label htmlFor={`style-${value}`} className="flex h-full min-h-[60px] flex-col items-center justify-center rounded-md border-2 border-accent bg-secondary p-4 text-center hover:cursor-pointer hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 [&:has([data-state=checked])]:border-primary">
                                {label}
                              </Label>
                            </div>
                          ))}
                        </RadioGroup>
                    </div>

                    <div className="flex justify-between pt-4">
                        <Button type="button" variant="outline" size="lg" onClick={() => setStep(1)}>Back</Button>
                        <Button type="button" size="lg" className="text-lg" onClick={handleNextStep}>
                            Next: Review & Generate
                            <ChevronsRight className="ml-2 h-4 w-4" />
                        </Button>
                    </div>
                 </div>
              )}

              {step === 3 && (
                <div className="space-y-8 animate-fade-in">
                    <Card>
                        <CardHeader>
                            <CardTitle>Review Your Configuration</CardTitle>
                            <CardDescription>This is what we'll send to the AI architect. You can go back to change anything.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <h4 className="font-semibold text-muted-foreground">Description</h4>
                                <p className="rounded-md bg-secondary p-3 mt-1">{description}</p>
                            </div>
                             <div>
                                <h4 className="font-semibold text-muted-foreground">Generation Mode</h4>
                                 <RadioGroup
                                    id="generation-mode"
                                    value={generationMode}
                                    onValueChange={setGenerationMode}
                                    className="grid grid-cols-1 gap-4 sm:grid-cols-2 mt-2"
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
                            <div>
                                <h4 className="font-semibold text-muted-foreground">Page Sections</h4>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {dataPoints.split(', ').filter(Boolean).map(section => (
                                        <Badge key={section} variant="secondary" className="text-base">{section}</Badge>
                                    ))}
                                </div>
                            </div>
                             <div>
                                <h4 className="font-semibold text-muted-foreground">Visual Style</h4>
                                <Badge variant="secondary" className="text-base mt-2">{style}</Badge>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex justify-between pt-4">
                        <Button type="button" variant="outline" size="lg" onClick={() => setStep(2)}>Back</Button>
                        <Button type="submit" size="lg" className="text-lg" disabled={isLoading || !user}>
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
                </div>
              )}
            </form>
        </div>
    </>
  );
}
