
"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, LoaderCircle } from "lucide-react";

// Workflow components
import ContentIdeaForm, { type ContentIdeaFormData } from '@/components/content-workflow/ContentIdeaForm';
import OutlineEditor, { type OutlineItem } from '@/components/content-workflow/OutlineEditor';
import ContentDrafting, { type GenerationMode } from "@/components/content-workflow/ContentDrafting";
import ContentOptimizer, { type OptimizationSettings } from "@/components/content-workflow/ContentOptimizer";
import ContentExporter from "@/components/content-workflow/ContentExporter";

// AI Flows
import { generateContentOutline } from "@/ai/flows/generate-content-outline-flow";
import { generateFullContentDraft } from "@/ai/flows/generate-full-content-draft-flow";
import { generateSectionDraft } from "@/ai/flows/generate-section-draft-flow";
import { optimizeContent } from "@/ai/flows/optimize-content-flow";

// Services
import { saveProject } from "@/services/projectService";
import { submitFeedback } from "@/services/feedbackService";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { ToastAction } from "@/components/ui/toast";

const steps = [
  { step: 1, name: 'Idea Definition' },
  { step: 2, name: 'Outline Generation' },
  { step: 3, name: 'Content Drafting' },
  { step: 4, name: 'AI Optimization' },
  { step: 5, name: 'Review & Export' },
];

const initialState = {
    contentIdea: {},
    generatedOutline: '',
    finalOutline: [],
    draftContent: '',
    optimizationSuggestions: '',
    isLoading: false,
    isSaving: false,
    projectId: null,
};


export default function WrittenContentClient() {
  const [currentStep, setCurrentStep] = useState(1);
  const [state, setState] = useState<{
      contentIdea: Partial<ContentIdeaFormData>;
      generatedOutline: string;
      finalOutline: OutlineItem[];
      draftContent: string;
      optimizationSuggestions: string;
      isLoading: boolean;
      isSaving: boolean;
      projectId: string | null;
  }>(initialState);

  const { user } = useAuth();
  const { toast } = useToast();

  const handleReset = useCallback(() => {
    setState(initialState);
    setCurrentStep(1);
  }, []);
  
  const handleDataChange = useCallback((data: ContentIdeaFormData) => {
    setState(s => ({ ...s, contentIdea: data }));
  }, []);

  const handleOutlineChange = useCallback((items: OutlineItem[]) => {
    setState(s => ({ ...s, finalOutline: items }));
  }, []);

  const handleGenerateOutline = async (isRegenerating = false) => {
      if (!isStep1Complete || !user) return;
      
      setState(s => ({ ...s, isLoading: true, generatedOutline: '' }));
      if (!isRegenerating) {
        setCurrentStep(2);
      }
      
      try {
          const { otherAudience, ...rest } = state.contentIdea;
          const result = await generateContentOutline({
            ...rest,
            targetAudience: state.contentIdea.targetAudience === 'Other' ? otherAudience || '' : state.contentIdea.targetAudience || '',
            keywords: state.contentIdea.keywords || [],
          });
          setState(s => ({ ...s, generatedOutline: result.outline.join('\n') }));
      } catch (error) {
          console.error("Outline generation failed:", error);
          toast({ variant: 'destructive', title: 'Outline Generation Failed', description: error instanceof Error ? error.message : 'An unknown error occurred.' });
      } finally {
          setState(s => ({ ...s, isLoading: false }));
      }
  };

  const handleDrafting = async (mode: GenerationMode) => {
    if (!user || state.finalOutline.length === 0) return;
    setState(s => ({ ...s, isLoading: true }));

    const commonInput = {
        mainTopic: state.contentIdea.mainTopic!,
        purpose: state.contentIdea.purpose!,
        contentType: state.contentIdea.contentType!,
        targetAudience: state.contentIdea.targetAudience!,
        desiredTone: state.contentIdea.desiredTone!,
        desiredLength: state.contentIdea.desiredLength!,
        keywords: state.contentIdea.keywords,
    };

    try {
        if (mode === 'full') {
            const result = await generateFullContentDraft({
                ...commonInput,
                finalOutline: state.finalOutline.map(item => item.text),
            });
            setState(s => ({ ...s, draftContent: result.generatedContent }));
        } else {
            // For section-by-section, we'll need to add which section is selected.
            // For now, let's just draft the first one.
            const firstSection = state.finalOutline[0]?.text;
            if (!firstSection) throw new Error("No section available to draft.");

            const result = await generateSectionDraft({
                ...commonInput,
                sectionToDraft: firstSection,
                fullOutline: state.finalOutline.map(item => item.text),
            });
            setState(s => ({ ...s, draftContent: s.draftContent + '\n\n' + result.generatedSectionContent }));
        }
    } catch (error) {
        console.error("Drafting failed:", error);
        toast({ variant: 'destructive', title: 'Drafting Failed', description: error instanceof Error ? error.message : 'An unknown error occurred.' });
    } finally {
        setState(s => ({ ...s, isLoading: false }));
    }
  };

  const handleOptimization = async (settings: OptimizationSettings) => {
    setState(s => ({ ...s, isLoading: true, optimizationSuggestions: '' }));
    try {
        const optimizationPromises: Promise<any>[] = [];
        if (settings.optimizeSeo) optimizationPromises.push(optimizeContent({ content: state.draftContent, optimizationType: 'seo' }));
        if (settings.improveReadability) optimizationPromises.push(optimizeContent({ content: state.draftContent, optimizationType: 'readability' }));
        if (settings.adjustTone) optimizationPromises.push(optimizeContent({ content: state.draftContent, optimizationType: 'tone', toneParameter: settings.newTone }));
        if (settings.generateCta) optimizationPromises.push(optimizeContent({ content: state.draftContent, optimizationType: 'cta' }));
        if (settings.suggestHeadlines) optimizationPromises.push(optimizeContent({ content: state.draftContent, optimizationType: 'headlines' }));

        const results = await Promise.all(optimizationPromises);
        const allSuggestions = results.map(r => r.optimizedContent).join('\n\n---\n\n');
        setState(s => ({ ...s, optimizationSuggestions: allSuggestions }));
        
    } catch (error) {
        console.error("Optimization failed:", error);
        toast({ variant: 'destructive', title: 'Optimization Failed', description: error instanceof Error ? error.message : 'An unknown error occurred.' });
    } finally {
        setState(s => ({ ...s, isLoading: false }));
    }
  };

  const handleSave = async () => {
    if (!user || !state.draftContent) return;
    setState(s => ({ ...s, isSaving: true }));
    try {
        const id = await saveProject({
            userId: user.uid,
            type: 'written-content',
            content: state.draftContent,
        });
        setState(s => ({ ...s, projectId: id }));
        toast({
            title: "Project Saved!",
            description: "Your content has been saved to your projects.",
            action: <ToastAction altText="View Project" asChild><Link href={`/dashboard/projects/${id}`}>View</Link></ToastAction>,
        });
    } catch (error) {
        console.error("Failed to save project:", error);
        toast({ variant: "destructive", title: "Save Failed", description: error instanceof Error ? error.message : "An unknown error occurred." });
    } finally {
        setState(s => ({ ...s, isSaving: false }));
    }
  };
  
  const handleFeedback = (rating: 'good' | 'bad') => {
    if (!user || !state.projectId) {
        toast({ variant: 'destructive', title: "Cannot give feedback", description: "You must save the project first." });
        return;
    }
    submitFeedback({ userId: user.uid, projectId: state.projectId, rating });
  };


  const handlePrevious = () => setCurrentStep((prev) => Math.max(prev - 1, 1));
  
  const handleNext = () => {
      if (currentStep === 1) {
          handleGenerateOutline();
      } else {
          setCurrentStep((prev) => Math.min(prev + 1, steps.length));
      }
  };

  const progressPercentage = (currentStep / steps.length) * 100;
  const isStep1Complete = state.contentIdea.mainTopic && state.contentIdea.mainTopic.trim() !== '' && state.contentIdea.purpose && state.contentIdea.purpose.trim() !== '';

  const renderStepContent = () => {
      if (state.isLoading && currentStep !== 1) {
          return (
              <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
                  <LoaderCircle className="h-12 w-12 animate-spin text-primary" />
                  <p className="mt-4 text-muted-foreground">AI is thinking...</p>
              </div>
          );
      }

      switch (currentStep) {
          case 1:
              return <ContentIdeaForm onDataChange={handleDataChange} initialData={state.contentIdea} />;
          case 2:
              return <OutlineEditor aiGeneratedOutline={state.generatedOutline} onGenerateNewOutline={() => handleGenerateOutline(true)} onOutlineChange={handleOutlineChange} />;
          case 3:
              return <ContentDrafting initialContent={state.draftContent} onGenerate={handleDrafting} onRegenerate={() => {}} />;
          case 4:
              return <ContentOptimizer originalContent={state.draftContent} suggestions={state.optimizationSuggestions} onApplyOptimization={handleOptimization} isLoading={state.isLoading} />;
          case 5:
              return <ContentExporter finalContent={state.draftContent} isSaving={state.isSaving} onSaveContent={handleSave} onStartNew={handleReset} onFeedback={handleFeedback} />;
          default:
              return null;
      }
  };

  const getNextButtonDisabledState = () => {
    if (state.isLoading) return true;
    if (currentStep === 1 && !isStep1Complete) return true;
    if (currentStep === 2 && state.finalOutline.length === 0) return true;
    if (currentStep === 3 && state.draftContent.trim() === '') return true;
    if (currentStep === 5) return true; // No "Next" on the last step
    return false;
  };

  return (
    <Card className="w-full rounded-xl">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Content Wizard</CardTitle>
          <span className="text-sm text-muted-foreground">
            Step {currentStep} of {steps.length}
          </span>
        </div>
        <CardDescription>{steps[currentStep - 1].name}</CardDescription>
        <Progress value={progressPercentage} className="w-full mt-2" />
      </CardHeader>
      
      <CardContent className="min-h-[400px] p-6">
        {renderStepContent()}
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button onClick={handlePrevious} disabled={currentStep === 1} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Previous
        </Button>
        {currentStep < steps.length && (
            <Button onClick={handleNext} disabled={getNextButtonDisabledState()}>
                {state.isLoading ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null}
                {currentStep === 1 ? 'Generate Outline' : 'Next'}
                <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
        )}
      </CardFooter>
    </Card>
  );
}
