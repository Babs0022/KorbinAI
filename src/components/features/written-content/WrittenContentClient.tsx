
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight } from "lucide-react";
import ContentIdeaForm, { type ContentIdeaFormData } from '@/components/content-workflow/ContentIdeaForm';

const steps = [
  { step: 1, name: 'Idea Definition' },
  { step: 2, name: 'Outline' },
  { step: 3, name: 'Drafting' },
  { step: 4, name: 'Optimization' },
  { step: 5, name: 'Review & Export' },
];

export default function WrittenContentClient() {
  const [currentStep, setCurrentStep] = useState(1);
  const [contentIdea, setContentIdea] = useState<Partial<ContentIdeaFormData>>({});

  const handleNext = () => {
    setCurrentStep((prev) => Math.min(prev + 1, steps.length));
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };
  
  const handleDataChange = (data: ContentIdeaFormData) => {
    setContentIdea(data);
  };

  const progressPercentage = (currentStep / steps.length) * 100;

  const isStep1Complete = contentIdea.mainTopic && contentIdea.mainTopic.trim() !== '' && contentIdea.purpose && contentIdea.purpose.trim() !== '';

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
        {currentStep === 1 && (
          <div className="animate-fade-in">
            <ContentIdeaForm onDataChange={handleDataChange} initialData={contentIdea} />
          </div>
        )}

        {currentStep === 2 && (
          <div className="animate-fade-in">
            <h3 className="text-lg font-semibold">Outline Generation</h3>
            <p className="text-muted-foreground mb-4">The next step will be to generate an outline based on this data.</p>
            <pre className="mt-4 p-4 bg-secondary rounded-md text-sm overflow-auto max-h-[500px]">
              {JSON.stringify(contentIdea, null, 2)}
            </pre>
          </div>
        )}

        {currentStep === 3 && (
          <div className="animate-fade-in">
            <h3 className="text-lg font-semibold">Drafting</h3>
             <p className="text-muted-foreground">This step will generate the first draft.</p>
          </div>
        )}

        {currentStep === 4 && (
          <div className="animate-fade-in">
             <h3 className="text-lg font-semibold">Optimization</h3>
             <p className="text-muted-foreground">This step will provide tools to optimize the draft.</p>
          </div>
        )}

        {currentStep === 5 && (
          <div className="animate-fade-in">
             <h3 className="text-lg font-semibold">Review & Export</h3>
             <p className="text-muted-foreground">This step will allow for final review and export.</p>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button
          onClick={handlePrevious}
          disabled={currentStep === 1}
          variant="outline"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Previous
        </Button>
        <Button
          onClick={handleNext}
          disabled={currentStep === steps.length || (currentStep === 1 && !isStep1Complete)}
        >
          Next
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}
