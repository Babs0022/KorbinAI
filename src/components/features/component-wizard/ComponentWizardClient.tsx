
"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LoaderCircle, Sparkles, Wand2, ChevronsRight, FileCode2, Code, LayoutTemplate, Plus, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { generateSectionSuggestions } from "@/ai/flows/generate-section-suggestions-flow";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";

const STEPS = [
  { step: 1, title: "The Core Idea", icon: <Wand2 /> },
  { step: 2, title: "Architecture", icon: <LayoutTemplate /> },
  { step: 3, title: "Build & Preview", icon: <Code /> },
];

export default function ComponentWizardClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const [step, setStep] = useState(1);
  const [description, setDescription] = useState("");
  
  const [suggestedSections, setSuggestedSections] = useState<string[]>([]);
  const [finalSections, setFinalSections] = useState<Set<string>>(new Set());
  const [customSection, setCustomSection] = useState("");
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);

  useEffect(() => {
    const urlDescription = searchParams.get('description');
    if (urlDescription) {
      setDescription(urlDescription);
    }
  }, [searchParams]);

  const handleNextStep = async () => {
    if (step === 1 && description.trim().split(/\s+/).length >= 5) {
      setIsSuggesting(true);
      try {
        const result = await generateSectionSuggestions({ description });
        const initialSections = result.suggestions || [];
        setSuggestedSections(initialSections);
        setFinalSections(new Set(initialSections));
      } catch (error) {
        console.error("Failed to get suggestions:", error);
        setSuggestedSections([]);
        setFinalSections(new Set());
      } finally {
        setIsSuggesting(false);
        setStep(2);
      }
    } else {
      setStep(s => Math.min(s + 1, STEPS.length));
    }
  };

  const handleToggleSection = (section: string) => {
    setFinalSections(prev => {
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
      const trimmedSection = customSection.trim();
      setFinalSections(prev => {
        const newSet = new Set(prev);
        newSet.add(trimmedSection);
        return newSet;
      });
      // Also add to suggestedSections to keep it in the list for re-ordering purposes
      if (!suggestedSections.includes(trimmedSection)) {
        setSuggestedSections(prev => [...prev, trimmedSection]);
      }
      setCustomSection("");
    }
  };

  const handleRemoveSection = (sectionToRemove: string) => {
    setFinalSections(prev => {
        const newSet = new Set(prev);
        newSet.delete(sectionToRemove);
        return newSet;
    });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!description || finalSections.size === 0) return;
    setIsLoading(true);

    const orderedSections = suggestedSections.filter(s => finalSections.has(s));
    
    const params = new URLSearchParams({
      description,
      dataPoints: JSON.stringify(orderedSections),
    });

    // In a future step, this will push to a page that generates file-by-file.
    // For now, it will go to the old result page.
    router.push(`/component-wizard/result?${params.toString()}`);
  };

  return (
    <>
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
                <h3 className="text-xl font-medium text-white">In plain English, describe the application you want to build.</h3>
                <p className="text-muted-foreground">Be descriptive! The more detail you provide, the better the AI can architect your project.</p>
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
                        Architecting...
                      </>
                    ) : (
                      <>
                        Next: Architecture
                        <ChevronsRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                </Button>
              </div>
            </div>
          )}
          
          {step === 2 && (
             <div className="space-y-8 animate-fade-in">
                <Card>
                    <CardHeader>
                        <CardTitle>Proposed Architecture</CardTitle>
                        <CardDescription>The AI has proposed the following pages and components based on your description. Review, add, or remove items to finalize the plan.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-3">
                            {suggestedSections.filter(s => finalSections.has(s)).map(section => (
                                <div key={section} className="flex items-center justify-between gap-2 p-3 rounded-md bg-secondary">
                                    <span className="font-medium">{section}</span>
                                    <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive/70 hover:text-destructive" onClick={() => handleRemoveSection(section)}>
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>

                        <div className="pt-4 space-y-3">
                            <Label>Add a new page or component</Label>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="e.g., 'Settings Page' or 'Header Component'"
                                    value={customSection}
                                    onChange={(e) => setCustomSection(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddCustomSection(); }}}
                                />
                                <Button type="button" variant="outline" onClick={handleAddCustomSection}>
                                    <Plus className="mr-2 h-4 w-4"/>
                                    Add
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                
                <div className="flex justify-between pt-4">
                    <Button type="button" variant="outline" size="lg" onClick={() => setStep(1)}>Back</Button>
                    <Button type="button" size="lg" className="text-lg" onClick={handleNextStep} disabled={finalSections.size === 0}>
                        Next: Build & Preview
                        <ChevronsRight className="ml-2 h-4 w-4" />
                    </Button>
                </div>
             </div>
          )}

          {step === 3 && (
            <div className="space-y-8 animate-fade-in">
                <Card>
                    <CardHeader>
                        <CardTitle>Final Blueprint</CardTitle>
                        <CardDescription>This is the final plan for your application. We will now generate the file structure and then build each component.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <h4 className="font-semibold text-muted-foreground">Core Idea</h4>
                            <p className="rounded-md bg-secondary p-3 mt-1">{description}</p>
                        </div>
                        <div>
                            <h4 className="font-semibold text-muted-foreground">Pages & Components</h4>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {suggestedSections.filter(s => finalSections.has(s)).map(section => (
                                    <Badge key={section} variant="secondary" className="text-base">{section}</Badge>
                                ))}
                            </div>
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
                        "Generate Project"
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
