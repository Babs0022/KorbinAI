
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight } from "lucide-react";

const steps = [
  { step: 1, name: 'Idea Definition' },
  { step: 2, name: 'Outline' },
  { step: 3, name: 'Drafting' },
  { step: 4, name: 'Optimization' },
  { step: 5, name: 'Review & Export' },
];

export default function WrittenContentClient() {
  const [currentStep, setCurrentStep] = useState(1);

  const handleNext = () => {
    setCurrentStep((prev) => Math.min(prev + 1, steps.length));
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const progressPercentage = (currentStep / steps.length) * 100;

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
      
      <CardContent className="min-h-[300px]">
        {/* Step 1: Idea Definition */}
        {currentStep === 1 && (
          <div className="animate-fade-in">
            {/* Placeholder for Idea Definition components */}
          </div>
        )}

        {/* Step 2: Outline */}
        {currentStep === 2 && (
          <div className="animate-fade-in">
            {/* Placeholder for Outline components */}
          </div>
        )}

        {/* Step 3: Drafting */}
        {currentStep === 3 && (
          <div className="animate-fade-in">
            {/* Placeholder for Drafting components */}
          </div>
        )}

        {/* Step 4: Optimization */}
        {currentStep === 4 && (
          <div className="animate-fade-in">
            {/* Placeholder for Optimization components */}
          </div>
        )}

        {/* Step 5: Review & Export */}
        {currentStep === 5 && (
          <div className="animate-fade-in">
            {/* Placeholder for Review & Export components */}
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
          disabled={currentStep === steps.length}
        >
          Next
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}
