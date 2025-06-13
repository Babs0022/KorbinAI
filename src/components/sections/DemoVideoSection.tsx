
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { GlassCard } from '@/components/shared/GlassCard';
import Container from '@/components/layout/Container';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from '@/components/ui/checkbox';
import { Lightbulb, Wand2, CheckCircle, Loader2, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SceneInfo {
  title: string;
  duration: number; // in ms
}

const scenesData: SceneInfo[] = [
  { title: 'User Enters Goal', duration: 4500 },
  { title: 'Answering Adaptive Survey', duration: 7000 },
  { title: 'AI Optimizing...', duration: 3500 },
  { title: 'Optimized Prompt Generated', duration: 6000 },
];

export function DemoVideoSection() {
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [typedGoal, setTypedGoal] = useState('');
  const [surveyAnswers, setSurveyAnswers] = useState<Record<string, string | string[]>>({});
  const [showOptimizedPrompt, setShowOptimizedPrompt] = useState(false);
  const [optimizingProgress, setOptimizingProgress] = useState(0);

  const fullGoal = "Write a marketing email for a new SaaS product launch targeting small businesses.";
  const optimizedPromptExample = `Craft a compelling marketing email for the launch of "BrieflyAI", a new SaaS product designed to help small businesses optimize AI prompts. \nTarget Audience: Non-technical small business owners.\nDesired Tone: Professional and slightly casual.\nKey Benefit: Save time and improve AI output quality.\nCall to Action: Sign up for a free trial.\nConstraint: Avoid overly technical jargon.`;

  const sceneContainerRef = useRef<HTMLDivElement>(null);
  const sceneTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const typingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const surveyTimeoutRefs = useRef<NodeJS.Timeout[]>([]);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);


  useEffect(() => {
    // Clear previous timeouts and intervals
    if (sceneTimeoutRef.current) clearTimeout(sceneTimeoutRef.current);
    if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    surveyTimeoutRefs.current.forEach(clearTimeout);
    surveyTimeoutRefs.current = [];

    // Reset states for the current scene
    setTypedGoal('');
    setSurveyAnswers({});
    setShowOptimizedPrompt(false);
    setOptimizingProgress(0);
    
    const currentSceneConfig = scenesData[currentSceneIndex];

    if (currentSceneConfig.title === 'User Enters Goal') {
      let charIndex = 0;
      typingIntervalRef.current = setInterval(() => {
        setTypedGoal(fullGoal.substring(0, charIndex + 1));
        charIndex++;
        if (charIndex > fullGoal.length) { 
          if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
        }
      }, 60); 
    } else if (currentSceneConfig.title === 'Answering Adaptive Survey') {
      surveyTimeoutRefs.current.push(setTimeout(() => setSurveyAnswers(prev => ({ ...prev, q1: 'Small Business Owners' })), 500));
      surveyTimeoutRefs.current.push(setTimeout(() => setSurveyAnswers(prev => ({ ...prev, q2: 'Professional' })), 2000));
      surveyTimeoutRefs.current.push(setTimeout(() => setSurveyAnswers(prev => ({ ...prev, q3_include: 'free trial, easy to use' })), 3500));
      surveyTimeoutRefs.current.push(setTimeout(() => setSurveyAnswers(prev => ({ ...prev, q5: ['Avoid jargon'] })), 5000));
    } else if (currentSceneConfig.title === 'AI Optimizing...') {
        let progress = 0;
        progressIntervalRef.current = setInterval(() => {
            progress += 5;
            if (progress <= 100) {
                setOptimizingProgress(progress);
            } else {
                if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
            }
        }, (currentSceneConfig.duration - 500) / 20); 
    } else if (currentSceneConfig.title === 'Optimized Prompt Generated') {
        surveyTimeoutRefs.current.push(setTimeout(() => setShowOptimizedPrompt(true), 500));
    }

    sceneTimeoutRef.current = setTimeout(() => {
      setCurrentSceneIndex((prevIndex) => (prevIndex + 1) % scenesData.length);
    }, currentSceneConfig.duration);

    if (sceneContainerRef.current) {
      sceneContainerRef.current.classList.remove('fade-in'); // Changed from 'animate-fadeIn' as 'fade-in' is defined in globals.css
      void sceneContainerRef.current.offsetWidth; 
      sceneContainerRef.current.classList.add('fade-in');
    }

    return () => {
      if (sceneTimeoutRef.current) clearTimeout(sceneTimeoutRef.current);
      if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      surveyTimeoutRefs.current.forEach(clearTimeout);
    };
  }, [currentSceneIndex, fullGoal]); // Added fullGoal


  const renderSceneContent = () => {
    const currentSceneConfig = scenesData[currentSceneIndex];
    if (!currentSceneConfig) return null;

    // Styles for elements inside the GlassCard to ensure readability on a potentially lighter/gradient background
    const textClass = "text-foreground"; // Default to foreground
    const mutedTextClass = "text-muted-foreground";
    const inputBgClass = "bg-background/70 border-border focus-visible:ring-primary";
    const placeholderClass = "placeholder-muted-foreground";
    const radioCheckClass = "border-primary data-[state=checked]:border-primary data-[state=checked]:text-primary";


    switch (currentSceneConfig.title) {
      case 'User Enters Goal':
        return (
          <div className="p-3 sm:p-4 md:p-6 space-y-2 sm:space-y-3 md:space-y-4 h-full flex flex-col justify-center">
            <div className={`flex items-center text-sm sm:text-md md:text-lg font-semibold ${textClass}`}>
              <Lightbulb className="mr-2 h-4 w-4 sm:h-5 md:h-6 sm:w-5 md:w-6 text-primary" />
              1. Define Your Goal
            </div>
            <Label htmlFor="goal-demo" className={`text-xs sm:text-sm ${mutedTextClass}`}>
              What task or objective do you want your AI prompt to achieve?
            </Label>
            <Textarea
              id="goal-demo"
              value={typedGoal}
              readOnly
              rows={4}
              className={`${inputBgClass} ${textClass} ${placeholderClass} text-xs sm:text-sm resize-none`}
              placeholder="e.g., Write a marketing email..."
            />
          </div>
        );
      case 'Answering Adaptive Survey':
        return (
          <div className="p-3 sm:p-4 md:p-6 space-y-2 sm:space-y-3 md:space-y-4 h-full flex flex-col justify-center">
            <div className={`flex items-center text-sm sm:text-md md:text-lg font-semibold ${textClass}`}>
              <Wand2 className="mr-2 h-4 w-4 sm:h-5 md:h-6 sm:w-5 md:w-6 text-primary" />
              2. Refine with Details
            </div>
            <div className="space-y-1.5 sm:space-y-2 md:space-y-3 text-xs sm:text-sm">
              <div>
                <Label htmlFor="q1-demo" className={mutedTextClass}>Primary audience?</Label>
                <Input id="q1-demo" readOnly value={surveyAnswers.q1 as string || ''} className={`mt-1 ${inputBgClass} ${textClass} ${placeholderClass} h-7 sm:h-8 text-xs sm:text-sm`} placeholder="e.g., Developers, CEOs..." />
              </div>
              <div>
                <Label className={mutedTextClass}>Desired tone?</Label>
                <RadioGroup value={surveyAnswers.q2 as string || ''} className="mt-1 flex flex-wrap gap-x-2 md:gap-x-3 gap-y-1">
                  {['Formal', 'Casual', 'Professional'].map(opt => (
                    <div key={opt} className="flex items-center space-x-1">
                      <RadioGroupItem value={opt} id={`q2-demo-${opt}`} checked={(surveyAnswers.q2  as string) === opt} readOnly className={`${radioCheckClass} h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4`} />
                      <Label htmlFor={`q2-demo-${opt}`} className={`font-normal ${mutedTextClass} text-[10px] sm:text-xs md:text-sm`}>{opt}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
               <div>
                <Label htmlFor="q3-demo-include" className={mutedTextClass}>Keywords to include?</Label>
                <Input id="q3-demo-include" readOnly value={surveyAnswers.q3_include as string || ''} className={`mt-1 ${inputBgClass} ${textClass} ${placeholderClass} h-7 sm:h-8 text-xs sm:text-sm`} placeholder="e.g., innovation, efficiency" />
              </div>
              <div>
                <Label className={mutedTextClass}>Constraints?</Label>
                <div className="mt-1 flex items-center space-x-2">
                    <Checkbox id="q5-demo-jargon" checked={(surveyAnswers.q5 as string[])?.includes('Avoid jargon')} readOnly className={`${radioCheckClass} data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4`} />
                    <Label htmlFor="q5-demo-jargon" className={`font-normal ${mutedTextClass} text-[10px] sm:text-xs md:text-sm`}>Avoid jargon</Label>
                </div>
              </div>
            </div>
          </div>
        );
      case 'AI Optimizing...':
        return (
            <div className="p-3 sm:p-4 md:p-6 flex flex-col items-center justify-center h-full space-y-2 sm:space-y-3">
                <Loader2 className={`h-8 w-8 sm:h-10 md:h-12 sm:w-10 md:w-12 text-primary animate-spin`} />
                <p className={`text-sm sm:text-md md:text-lg ${mutedTextClass}`}>Optimizing your prompt...</p>
                <div className="w-full max-w-[200px] sm:max-w-xs h-1.5 sm:h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary transition-all duration-150" style={{width: `${optimizingProgress}%` }}></div>
                </div>
            </div>
        );
      case 'Optimized Prompt Generated':
        return (
          <div className="p-3 sm:p-4 md:p-6 space-y-2 sm:space-y-3 md:space-y-4 h-full flex flex-col justify-center">
            <div className={`flex items-center text-sm sm:text-md md:text-lg font-semibold ${textClass}`}>
              <CheckCircle className="mr-2 h-4 w-4 sm:h-5 md:h-6 sm:w-5 md:w-6 text-accent" />
              3. Your Optimized Prompt
            </div>
            <Textarea
              value={showOptimizedPrompt ? optimizedPromptExample : ''}
              readOnly
              rows={4}
              className={`${inputBgClass} ${textClass} ${placeholderClass} font-code text-[9px] sm:text-[10px] md:text-xs leading-snug resize-none`}
              placeholder="Generating prompt..."
            />
             <div className="flex justify-end">
                <Button size="sm" variant="outline" className="text-accent border-accent hover:bg-accent/10 hover:text-accent h-7 sm:h-8 text-[10px] sm:text-xs md:text-sm">
                    <Copy className="mr-1 h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" /> Copy
                </Button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
     <section id="demo-video" className="py-12 md:py-16 lg:py-24 bg-gradient-to-b from-background via-indigo-50/30 to-mint-50/30">
      <Container className="text-center">
        <h2 className="font-headline text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          See BrieflyAI in Action
        </h2>
        <p className="mx-auto mt-3 sm:mt-4 max-w-xl sm:max-w-2xl text-md sm:text-lg text-muted-foreground">
          Watch this interactive demo of how BrieflyAI optimizes your prompts.
        </p>
        <GlassCard
          className={cn(
            "mt-8 sm:mt-10 aspect-video overflow-hidden shadow-2xl bg-card/80 backdrop-blur-md border-white/30", // Standard GlassCard styling
            "w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-2xl xl:max-w-3xl mx-auto transition-opacity duration-500 ease-in-out relative" 
          )}
        >
           <div className="w-full h-1 sm:h-1.5 bg-muted absolute top-0 left-0 z-10 rounded-t-lg sm:rounded-t-xl overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300 ease-linear"
              style={{ width: `${((currentSceneIndex) / scenesData.length) * 100}%` }}
            />
          </div>
          <div ref={sceneContainerRef} className="pt-1 sm:pt-1.5 h-full w-full flex flex-col justify-center fade-in">
             {renderSceneContent()}
          </div>
        </GlassCard>
         <p className="mt-3 sm:mt-4 text-xs sm:text-sm text-muted-foreground">
          BrieflyAI: Input Goal → Answer Survey → Get Optimized Prompt.
        </p>
      </Container>
    </section>
  );
}
