
"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { LoaderCircle, Sparkles, Wand2, Undo, ChevronsRight } from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

import { generateWrittenContent, GenerateWrittenContentInput } from "@/ai/flows/generate-written-content-flow";
import { generateContentSuggestions, GenerateContentSuggestionsOutput } from "@/ai/flows/generate-content-suggestions-flow";

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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";


export default function WrittenContentClient() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { toast } = useToast();

  // Form state
  const [contentType, setContentType] = useState("blog-post");
  const [tone, setTone] = useState("professional");
  const [topic, setTopic] = useState("");
  const [audience, setAudience] = useState("");
  const [keywords, setKeywords] = useState("");
  
  // Generation state
  const [isLoading, setIsLoading] = useState(false);
  const [generatedContent, setGeneratedContent] = useState("");
  
  // Suggestion state
  const [suggestions, setSuggestions] = useState<GenerateContentSuggestionsOutput>({ suggestedAudience: '', suggestedKeywords: [] });
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [debounceTimeout, setDebounceTimeout] = useState<NodeJS.Timeout | null>(null);

  // Refinement State
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const [isRefineModalOpen, setIsRefineModalOpen] = useState(false);
  const [textToRefine, setTextToRefine] = useState("");
  const [refinedText, setRefinedText] = useState("");
  const [isRefiningInModal, setIsRefiningInModal] = useState(false);
  const [contentBeforeRefinement, setContentBeforeRefinement] = useState("");
  const [customRefineInstruction, setCustomRefineInstruction] = useState("");
  
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
  
  const handleSelectionChange = (target: HTMLTextAreaElement) => {
    // Defensive check to ensure properties exist
    if (typeof target.selectionStart === 'number' && typeof target.selectionEnd === 'number') {
      setSelection({ start: target.selectionStart, end: target.selectionEnd });
    }
  };

  const openRefineModal = (isFullDocument: boolean) => {
    setRefinedText("");
    setCustomRefineInstruction("");
    const text = isFullDocument 
      ? generatedContent 
      : generatedContent.substring(selection.start, selection.end);

    if (!text) {
      toast({ variant: "destructive", title: "No text to refine", description: "Select some text in the editor or use the 'Refine Full Document' option." });
      return;
    }
    
    setTextToRefine(text);
    setIsRefineModalOpen(true);
  };
  
  const handleModalRefine = async (instruction: string) => {
    setIsRefiningInModal(true);
    const finalInstruction = instruction || customRefineInstruction;

    if (!finalInstruction) {
        toast({ variant: "destructive", title: "Instruction required", description: "Please select a refinement goal or provide a custom instruction." });
        setIsRefiningInModal(false);
        return;
    }

    try {
        const result = await generateWrittenContent({
            contentType, tone, topic, // Pass context from the main form
            originalContent: textToRefine,
            refinementInstruction: finalInstruction,
            userId: user?.uid,
        });
        if (result.generatedContent) {
            setRefinedText(result.generatedContent);
        } else {
            throw new Error("The AI did not return a refinement.");
        }
    } catch (error) {
        console.error("Failed to refine content:", error);
        toast({
            variant: "destructive",
            title: "Refinement Failed",
            description: error instanceof Error ? error.message : "An unknown error occurred.",
        });
    } finally {
        setIsRefiningInModal(false);
    }
  };

  const handleAcceptChanges = () => {
    setContentBeforeRefinement(generatedContent); // For undo
    
    const isFullDocumentRefinement = textToRefine === generatedContent;

    const newContent = isFullDocumentRefinement
      ? refinedText 
      : generatedContent.substring(0, selection.start) + refinedText + generatedContent.substring(selection.end);

    setGeneratedContent(newContent);
    setIsRefineModalOpen(false);
    toast({ title: "Content Updated", description: "Your changes have been applied to the editor." });
  };
  
  const handleUndo = () => {
    if (!contentBeforeRefinement) return;
    setGeneratedContent(contentBeforeRefinement);
    setContentBeforeRefinement("");
    toast({ title: "Undo Successful", description: "The last refinement has been reverted." });
  };

  const presetRefinementGoals = [
    "Make it more concise",
    "Improve grammar & spelling",
    "Enhance clarity",
    "Make it more engaging",
  ];

  return (
    <>
      <Card className="w-full rounded-xl">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Form Fields... */}
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
                  className="grid grid-cols-2 gap-4 pt-2 md:grid-cols-4"
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
              <Button type="submit" size="lg" className="text-lg" disabled={isLoading || !user}>
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

      {isLoading && (
        <div className="mt-12 flex flex-col items-center justify-center gap-4 text-center animate-fade-in">
          <LoaderCircle className="h-12 w-12 animate-spin text-primary" />
          <h2 className="text-2xl font-bold">Generating Content...</h2>
          <p className="text-muted-foreground">The AI is crafting your words. Please wait a moment.</p>
        </div>
      )}

      {generatedContent && !isLoading && (
          <div className="mt-12 space-y-4 animate-fade-in">
              <Card>
                <CardHeader>
                  <CardTitle>Your Generated Content</CardTitle>
                  <CardDescription>You can now edit the content directly or use the refinement tools below.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea 
                    value={generatedContent}
                    onChange={(e) => setGeneratedContent(e.target.value)}
                    onSelect={(e) => handleSelectionChange(e.currentTarget)}
                    onMouseUp={(e) => handleSelectionChange(e.currentTarget)}
                    onKeyUp={(e) => handleSelectionChange(e.currentTarget)}
                    className="h-[450px] text-base"
                  />
                </CardContent>
              </Card>

              <Card className="rounded-xl border-primary/20 bg-primary/5">
                  <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                          <Wand2 className="h-5 w-5 text-primary" />
                          Refine & Improve
                      </CardTitle>
                      <CardDescription>Select text in the editor to refine a specific part, or refine the whole document.</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-wrap gap-3">
                      <Button variant="secondary" onClick={() => openRefineModal(false)} disabled={selection.start === selection.end}>
                        Refine Selection
                      </Button>
                      <Button variant="secondary" onClick={() => openRefineModal(true)}>
                        Refine Full Document
                      </Button>
                      <Button variant="outline" onClick={handleUndo} disabled={!contentBeforeRefinement}>
                        <Undo className="mr-2 h-4 w-4" />
                        Undo Last Refinement
                      </Button>
                  </CardContent>
              </Card>
          </div>
      )}

      <Dialog open={isRefineModalOpen} onOpenChange={setIsRefineModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Refine Content</DialogTitle>
          </DialogHeader>
          
          {!refinedText ? (
            // Initial View: Select refinement goal
            <div className="space-y-6 py-4">
              <div>
                <Label className="text-muted-foreground">You are refining:</Label>
                <div className="mt-2 max-h-40 overflow-y-auto rounded-md border bg-secondary p-3 text-sm">
                    <p className="whitespace-pre-wrap">{textToRefine}</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Choose a refinement goal:</Label>
                <div className="grid grid-cols-2 gap-2">
                    {presetRefinementGoals.map(goal => (
                        <Button key={goal} variant="outline" onClick={() => handleModalRefine(goal)} disabled={isRefiningInModal}>
                             {isRefiningInModal && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                             {goal}
                        </Button>
                    ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="custom-instruction">Or, provide a custom instruction:</Label>
                <div className="flex gap-2">
                    <Input 
                        id="custom-instruction"
                        placeholder="e.g., 'Make this sound more professional'"
                        value={customRefineInstruction}
                        onChange={(e) => setCustomRefineInstruction(e.target.value)}
                    />
                    <Button onClick={() => handleModalRefine(customRefineInstruction)} disabled={isRefiningInModal || !customRefineInstruction}>
                        {isRefiningInModal && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                        Apply
                    </Button>
                </div>
              </div>
            </div>
          ) : (
            // Result View: Show refinement and accept/discard
            <div className="space-y-4 py-4">
                <Label className="text-muted-foreground">Suggested refinement:</Label>
                <div className="prose dark:prose-invert max-w-none whitespace-pre-wrap rounded-md border bg-secondary p-4">
                  {refinedText}
                </div>
                <DialogFooter className="pt-4">
                    <Button variant="ghost" onClick={() => setRefinedText("")}>Back to Options</Button>
                    <Button onClick={handleAcceptChanges}>
                        <ChevronsRight className="mr-2 h-4 w-4"/>
                        Accept Changes
                    </Button>
                </DialogFooter>
            </div>
          )}

        </DialogContent>
      </Dialog>
    </>
  );
}
