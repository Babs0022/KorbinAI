
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
import { Lightbulb, Wand2, CheckCircle, Loader2, Copy, Send, MessageSquare, Settings2, Palette, AlertTriangle, Cpu, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DemoScene {
  id: string;
  title: string;
  duration: number; // in ms
  element: JSX.Element;
}

const AnimatedDemo: React.FC = () => {
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  // Scene 1: Define Goal
  const [typedGoal, setTypedGoal] = useState('');
  const [goalButtonEnabled, setGoalButtonEnabled] = useState(false);

  // Scene 2: Refine with Details (Survey)
  const [surveyAnswers, setSurveyAnswers] = useState<Record<string, string | string[]>>({});
  const [surveyProgress, setSurveyProgress] = useState(0); // 0: none, 1: q1, 2: q2, 3: q3
  const [surveyButtonEnabled, setSurveyButtonEnabled] = useState(false);

  // Scene 3: Model Selection (Simplified)
  const [selectedModel, setSelectedModel] = useState('');
  const [modelButtonEnabled, setModelButtonEnabled] = useState(false);

  // Scene 4: AI Optimizing
  const [optimizingProgress, setOptimizingProgress] = useState(0);

  // Scene 5: Optimized Prompt & Grading
  const [showOptimizedPromptText, setShowOptimizedPromptText] = useState('');
  const [promptScore, setPromptScore] = useState<number | null>(null);
  const [copyButtonEnabled, setCopyButtonEnabled] = useState(false);
  const [copied, setCopied] = useState(false);

  const fullGoal = "Create a social media campaign for a new eco-friendly coffee brand targeting millennials.";
  const optimizedPromptExample = `Develop a 3-post Instagram campaign for 'TerraSip Coffee', a new sustainable coffee brand. 
Audience: Millennials (25-35) interested in eco-conscious products.
Key Message: Premium taste, ethically sourced, 100% compostable packaging.
Post 1: Introduce TerraSip, highlight unique selling points.
Post 2: Showcase sourcing/sustainability story with visuals.
Post 3: Call to action (e.g., launch discount, store locator).
Tone: Authentic, vibrant, inspiring.
Hashtags: #TerraSip #SustainableCoffee #EcoFriendly #MillennialBrew
Model: GPT-4 (for copy), DALL-E 3 (for image ideas).`;
  
  const typingSpeed = 40; 
  const surveyStepDuration = 1200;
  const modelSelectDuration = 1500;
  const optimizingDuration = 2500;

  const scenes: DemoScene[] = [
    {
      id: 'defineGoal',
      title: 'User Enters Goal',
      duration: fullGoal.length * typingSpeed + 1000,
      element: (
        <div className="p-4 md:p-6 space-y-3 h-full flex flex-col">
          <div className="flex items-center text-lg font-semibold text-foreground">
            <Lightbulb className="mr-2 h-5 w-5 text-primary" />
            1. Define Your Goal
          </div>
          <Label htmlFor="goal-demo" className="text-sm text-muted-foreground">
            What task do you want your AI prompt to achieve?
          </Label>
          <Textarea id="goal-demo" value={typedGoal} readOnly rows={5} className="bg-background/70 border-border focus-visible:ring-primary text-foreground placeholder-muted-foreground text-sm resize-none" placeholder="e.g., Launch a new product..." />
          <Button variant="outline" className="w-full sm:w-auto mt-auto" disabled={!goalButtonEnabled} size="sm">
            <Send className="mr-2 h-4 w-4" /> Get Tailored Questions
          </Button>
        </div>
      ),
    },
    {
      id: 'refineDetails',
      title: 'Answering Adaptive Survey',
      duration: surveyStepDuration * 3 + 1000,
      element: (
        <div className="p-4 md:p-6 space-y-3 h-full flex flex-col">
          <div className="flex items-center text-lg font-semibold text-foreground">
            <Wand2 className="mr-2 h-5 w-5 text-primary" />
            2. Refine with Details
          </div>
          <div className="space-y-3 text-sm flex-grow overflow-y-auto pr-1">
            <div className={cn("transition-opacity duration-500", surveyProgress >= 1 ? "opacity-100" : "opacity-0")}>
              <Label htmlFor="q1-demo" className="text-muted-foreground text-xs">Key message to convey?</Label>
              <Input id="q1-demo" readOnly value={surveyAnswers.q1 as string || ''} className="mt-1 bg-background/70 border-border text-foreground placeholder-muted-foreground h-8 text-xs" placeholder="e.g., Sustainability, Quality" />
            </div>
            <div className={cn("transition-opacity duration-500", surveyProgress >= 2 ? "opacity-100" : "opacity-0")}>
              <Label className="text-muted-foreground text-xs">Desired tone?</Label>
              <RadioGroup value={surveyAnswers.q2 as string || ''} className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
                {['Vibrant', 'Professional', 'Minimalist'].map(opt => (
                  <div key={opt} className="flex items-center space-x-1.5">
                    <RadioGroupItem value={opt} id={`q2-demo-${opt}`} checked={(surveyAnswers.q2 as string) === opt} readOnly className="border-primary data-[state=checked]:border-primary data-[state=checked]:text-primary h-3.5 w-3.5" />
                    <Label htmlFor={`q2-demo-${opt}`} className="font-normal text-muted-foreground text-xs">{opt}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
            <div className={cn("transition-opacity duration-500", surveyProgress >= 3 ? "opacity-100" : "opacity-0")}>
              <Label className="text-muted-foreground text-xs">Specific platforms?</Label>
              <div className="mt-1 space-y-0.5">
                {['Instagram', 'Twitter/X', 'Blog Post'].map(opt => (
                  <div key={opt} className="flex items-center space-x-1.5">
                    <Checkbox id={`q3-demo-${opt}`} checked={(surveyAnswers.q3 as string[])?.includes(opt)} readOnly className="border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground h-3.5 w-3.5" />
                    <Label htmlFor={`q3-demo-${opt}`} className="font-normal text-muted-foreground text-xs">{opt}</Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <Button variant="outline" className="w-full sm:w-auto mt-auto" disabled={!surveyButtonEnabled} size="sm">
             <Cpu className="mr-2 h-4 w-4" /> Select Target Model
          </Button>
        </div>
      ),
    },
     {
      id: 'selectModel',
      title: 'Select AI Model',
      duration: modelSelectDuration + 1000,
      element: (
        <div className="p-4 md:p-6 space-y-3 h-full flex flex-col">
          <div className="flex items-center text-lg font-semibold text-foreground">
            <Cpu className="mr-2 h-5 w-5 text-primary" />
            3. Target AI Model
          </div>
          <RadioGroup value={selectedModel} className="mt-1 space-y-2 flex-grow">
            {['GPT-4', 'Claude 3 Opus', 'DALL-E 3'].map(model => (
                 <Label 
                    key={model} 
                    htmlFor={`model-demo-${model}`} 
                    className={cn("flex items-center space-x-2 p-2.5 rounded-md border cursor-pointer transition-colors hover:bg-primary/5", selectedModel === model ? "bg-primary/10 border-primary ring-1 ring-primary" : "border-border")}
                >
                    <RadioGroupItem value={model} id={`model-demo-${model}`} className="border-primary data-[state=checked]:border-primary data-[state=checked]:text-primary h-4 w-4"/>
                    <span className="text-sm font-medium text-foreground">{model}</span>
                </Label>
            ))}
          </RadioGroup>
          <Button className="w-full sm:w-auto mt-auto bg-primary hover:bg-primary/90 text-primary-foreground" disabled={!modelButtonEnabled} size="sm">
            <Wand2 className="mr-2 h-4 w-4" /> Optimize My Prompt
          </Button>
        </div>
      )
    },
    {
      id: 'aiOptimizing',
      title: 'AI Optimizing & Grading...',
      duration: optimizingDuration,
      element: (
        <div className="p-4 md:p-6 flex flex-col items-center justify-center h-full space-y-4">
          <div className="flex items-center justify-center gap-4">
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
            <BarChart3 className="h-10 w-10 text-accent animate-pulse" />
          </div>
          <p className="text-lg text-muted-foreground">Optimizing & Grading...</p>
          <div className="w-full max-w-xs h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-150" style={{ width: `${optimizingProgress}%` }}></div>
          </div>
        </div>
      ),
    },
    {
      id: 'optimizedPrompt',
      title: 'Optimized Prompt & Grade',
      duration: optimizedPromptExample.length * (typingSpeed / 2.5) + 2000,
      element: (
        <div className="p-4 md:p-6 space-y-3 h-full flex flex-col">
          <div className="flex items-center text-lg font-semibold text-foreground">
            <CheckCircle className="mr-2 h-5 w-5 text-accent" />
            4. Your Optimized Prompt
          </div>
          <Textarea value={showOptimizedPromptText} readOnly rows={7} className="bg-background/70 border-border focus-visible:ring-accent text-foreground placeholder-muted-foreground font-code text-xs leading-relaxed resize-none flex-grow" />
           <div className={cn("flex items-center justify-between p-2.5 rounded-md border transition-opacity duration-500", promptScore ? "opacity-100 bg-accent/10 border-accent/30" : "opacity-0")}>
              <div className="flex items-center">
                <BarChart3 className="mr-2 h-5 w-5 text-accent" />
                <span className="text-sm font-medium text-accent">Prompt Quality Score:</span>
              </div>
              <span className="text-lg font-bold text-accent">{promptScore ? `${promptScore}/10` : '-'}</span>
          </div>
          <Button variant="outline" onClick={() => { if (!copyButtonEnabled) return; setCopied(true); setTimeout(() => setCopied(false), 1500); }} className={cn("w-full sm:w-auto mt-auto", copied ? "bg-accent text-accent-foreground hover:bg-accent/90" : "hover:bg-accent/10")} disabled={!copyButtonEnabled} size="sm">
            <Copy className="mr-2 h-4 w-4" /> {copied ? "Copied!" : "Copy Prompt"}
          </Button>
        </div>
      ),
    },
  ];

  const sceneContainerRef = useRef<HTMLDivElement>(null);
  const sceneTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const typingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const effectTimeoutRefs = useRef<NodeJS.Timeout[]>([]);

  useEffect(() => {
    if (sceneTimeoutRef.current) clearTimeout(sceneTimeoutRef.current);
    if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
    effectTimeoutRefs.current.forEach(clearTimeout);
    effectTimeoutRefs.current = [];

    setTypedGoal(''); setGoalButtonEnabled(false);
    setSurveyAnswers({}); setSurveyProgress(0); setSurveyButtonEnabled(false);
    setSelectedModel(''); setModelButtonEnabled(false);
    setOptimizingProgress(0);
    setShowOptimizedPromptText(''); setPromptScore(null); setCopyButtonEnabled(false); setCopied(false);

    const currentSceneConfig = scenes[currentSceneIndex];

    if (currentSceneConfig.id === 'defineGoal') {
      let charIndex = 0;
      typingIntervalRef.current = setInterval(() => {
        setTypedGoal(fullGoal.substring(0, charIndex + 1));
        charIndex++;
        if (charIndex > fullGoal.length) {
          if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
          setGoalButtonEnabled(true);
        }
      }, typingSpeed);
    } else if (currentSceneConfig.id === 'refineDetails') {
      effectTimeoutRefs.current.push(setTimeout(() => { setSurveyAnswers(prev => ({ ...prev, q1: 'Sustainability & Quality' })); setSurveyProgress(1); }, 0));
      effectTimeoutRefs.current.push(setTimeout(() => { setSurveyAnswers(prev => ({ ...prev, q2: 'Vibrant' })); setSurveyProgress(2); }, surveyStepDuration));
      effectTimeoutRefs.current.push(setTimeout(() => { setSurveyAnswers(prev => ({ ...prev, q3: ['Instagram', 'Blog Post'] })); setSurveyProgress(3); setSurveyButtonEnabled(true); }, surveyStepDuration * 2));
    } else if (currentSceneConfig.id === 'selectModel') {
        effectTimeoutRefs.current.push(setTimeout(() => { setSelectedModel('GPT-4'); setModelButtonEnabled(true); }, modelSelectDuration/2));
    } else if (currentSceneConfig.id === 'aiOptimizing') {
      let progress = 0;
      const intervalTime = optimizingDuration / 20;
      typingIntervalRef.current = setInterval(() => {
        progress += 5;
        if (progress <= 100) setOptimizingProgress(progress);
        else if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
      }, intervalTime);
    } else if (currentSceneConfig.id === 'optimizedPrompt') {
      let charIndex = 0;
      typingIntervalRef.current = setInterval(() => {
        setShowOptimizedPromptText(optimizedPromptExample.substring(0, charIndex + 1));
        charIndex++;
        if (charIndex > optimizedPromptExample.length) {
          if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
          setPromptScore(9.2); 
          setCopyButtonEnabled(true);
        }
      }, typingSpeed / 2.5);
    }

    sceneTimeoutRef.current = setTimeout(() => {
      setCurrentSceneIndex((prevIndex) => (prevIndex + 1) % scenes.length);
    }, currentSceneConfig.duration);

    if (sceneContainerRef.current) {
      sceneContainerRef.current.classList.remove('fade-in');
      void sceneContainerRef.current.offsetWidth;
      sceneContainerRef.current.classList.add('fade-in');
    }

    return () => {
      if (sceneTimeoutRef.current) clearTimeout(sceneTimeoutRef.current);
      if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
      effectTimeoutRefs.current.forEach(clearTimeout);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSceneIndex]); // Dependencies intentionally limited to currentSceneIndex

  const progressPercentage = ((currentSceneIndex + 1) / scenes.length) * 100;

  return (
    <GlassCard
      className={cn(
        "aspect-[16/10] sm:aspect-video overflow-hidden shadow-2xl bg-card/80 backdrop-blur-md border-white/30",
        "w-full max-w-md sm:max-w-lg md:max-w-xl lg:max-w-3xl xl:max-w-5xl mx-auto transition-opacity duration-500 ease-in-out relative"
      )}
    >
      <div className="w-full h-1.5 bg-muted absolute top-0 left-0 z-10 rounded-t-lg overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-300 ease-linear"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
      <div ref={sceneContainerRef} className="pt-1.5 h-full w-full flex flex-col justify-center text-foreground">
        {scenes[currentSceneIndex].element}
      </div>
    </GlassCard>
  );
};

export function InteractiveDemoSection() { // Renamed from DemoVideoSection
  return (
    <section id="interactive-demo" className="py-12 md:py-16 lg:py-24 bg-gradient-to-b from-background via-indigo-50/30 to-mint-50/30">
      <Container className="text-center">
        <h2 className="font-headline text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Experience BrieflyAI Live
        </h2>
        <p className="mx-auto mt-3 sm:mt-4 max-w-xl sm:max-w-2xl text-md sm:text-lg text-muted-foreground">
          Watch our interactive demo to see how easy it is to go from idea to perfectly optimized AI prompt, adapted for your chosen model and graded for quality.
        </p>
        <div className="mt-8 sm:mt-10">
          <AnimatedDemo />
        </div>
        <p className="mt-3 sm:mt-4 text-xs sm:text-sm text-muted-foreground">
          Define Goal → Refine Details → Target Model → Get Optimized & Graded Prompt.
        </p>
      </Container>
    </section>
  );
}

