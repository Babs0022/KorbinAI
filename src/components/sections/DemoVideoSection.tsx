
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
import { Lightbulb, Wand2, CheckCircle, Loader2, Copy, Send, MessageSquare, Settings2, Palette, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DemoScene {
  id: string;
  title: string;
  duration: number; // in ms
  element: JSX.Element;
}

// BlinkingCaret component is defined but will not be rendered *inside* Textarea to avoid the error.
// If a caret is desired, it would need to be positioned externally.
const BlinkingCaret = () => (
  <span className="animate-blinking-caret inline-block h-4 w-px bg-foreground ml-0.5" />
);

const AnimatedDemo: React.FC = () => {
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  // Scene 1: Define Goal
  const [typedGoal, setTypedGoal] = useState('');
  // const [showGoalCaret, setShowGoalCaret] = useState(true); // Caret state managed by typing logic
  const [goalButtonEnabled, setGoalButtonEnabled] = useState(false);

  // Scene 2: Refine with Details (Survey)
  const [surveyAnswers, setSurveyAnswers] = useState<Record<string, string | string[]>>({});
  const [surveyProgress, setSurveyProgress] = useState(0); // 0: none, 1: q1, 2: q2, 3: q3
  const [surveyButtonEnabled, setSurveyButtonEnabled] = useState(false);

  // Scene 3: AI Optimizing
  const [optimizingProgress, setOptimizingProgress] = useState(0);

  // Scene 4: Optimized Prompt Generated
  const [showOptimizedPromptText, setShowOptimizedPromptText] = useState('');
  // const [showOptimizedCaret, setShowOptimizedCaret] = useState(true); // Caret state managed by typing logic
  const [copyButtonEnabled, setCopyButtonEnabled] = useState(false);
  const [copied, setCopied] = useState(false);

  const fullGoal = "Write a marketing email for a new SaaS product launch targeting small businesses.";
  const optimizedPromptExample = `Craft a compelling marketing email for "BrieflyAI", a new SaaS product that helps small businesses optimize AI prompts. 

Target Audience: Non-technical small business owners.
Key Benefit: Improve AI output quality and save time.
Desired Tone: Professional yet approachable.
Call to Action: Sign up for a free 14-day trial.
Constraint: Keep the email concise and under 200 words. Avoid overly technical jargon.`;

  const typingSpeed = 50; // ms per character
  const surveyStepDuration = 1500; // ms per survey answer
  const optimizingDuration = 3000; // ms for optimization animation

  const scenes: DemoScene[] = [
    {
      id: 'defineGoal',
      title: 'User Enters Goal',
      duration: fullGoal.length * typingSpeed + 1000, // typing time + pause
      element: (
        <div className="p-4 md:p-6 space-y-3 h-full flex flex-col">
          <div className="flex items-center text-lg font-semibold">
            <Lightbulb className="mr-2 h-5 w-5 text-primary" />
            1. Define Your Goal
          </div>
          <Label htmlFor="goal-demo" className="text-sm text-muted-foreground">
            What task do you want your AI prompt to achieve?
          </Label>
          <Textarea
            id="goal-demo"
            value={typedGoal} // Content is handled by value prop
            readOnly
            rows={5}
            className="bg-background/70 border-border focus-visible:ring-primary text-foreground placeholder-muted-foreground text-sm resize-none"
            placeholder="e.g., Write a marketing email..."
          />
          <Button 
            variant="outline" 
            className="w-full sm:w-auto mt-auto" 
            disabled={!goalButtonEnabled}
            size="sm"
          >
            <Send className="mr-2 h-4 w-4" /> Get Tailored Questions
          </Button>
        </div>
      ),
    },
    {
      id: 'refineDetails',
      title: 'Answering Adaptive Survey',
      duration: surveyStepDuration * 3 + 1000, // 3 questions + pause
      element: (
        <div className="p-4 md:p-6 space-y-3 h-full flex flex-col">
          <div className="flex items-center text-lg font-semibold">
            <Wand2 className="mr-2 h-5 w-5 text-primary" />
            2. Refine with Details
          </div>
          <div className="space-y-4 text-sm flex-grow overflow-y-auto pr-1">
            {/* Question 1: Text Input */}
            <div className={cn("transition-opacity duration-500", surveyProgress >= 1 ? "opacity-100" : "opacity-0")}>
              <Label htmlFor="q1-audience-demo" className="text-muted-foreground">What is the primary audience for this prompt?</Label>
              <Input id="q1-audience-demo" readOnly value={surveyAnswers.q1_audience as string || ''} className="mt-1 bg-background/70 border-border text-foreground placeholder-muted-foreground h-8" placeholder="e.g., Developers, Marketing Managers" />
            </div>
            {/* Question 2: Radio Group */}
            <div className={cn("transition-opacity duration-500", surveyProgress >= 2 ? "opacity-100" : "opacity-0")}>
              <Label className="text-muted-foreground">What is the desired tone?</Label>
              <RadioGroup value={surveyAnswers.q2_tone as string || ''} className="mt-1 flex flex-wrap gap-x-4 gap-y-2">
                {['Professional', 'Casual', 'Persuasive'].map(opt => (
                  <div key={opt} className="flex items-center space-x-2">
                    <RadioGroupItem value={opt} id={`q2-demo-${opt}`} checked={(surveyAnswers.q2_tone as string) === opt} readOnly className="border-primary data-[state=checked]:border-primary data-[state=checked]:text-primary" />
                    <Label htmlFor={`q2-demo-${opt}`} className="font-normal text-muted-foreground text-xs">{opt}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
            {/* Question 3: Checkboxes */}
            <div className={cn("transition-opacity duration-500", surveyProgress >= 3 ? "opacity-100" : "opacity-0")}>
              <Label className="text-muted-foreground">Any specific constraints to consider?</Label>
              <div className="mt-1 space-y-1">
                {['Avoid jargon', 'Under 200 words', 'Include a CTA'].map(opt => (
                  <div key={opt} className="flex items-center space-x-2">
                    <Checkbox id={`q3-demo-${opt}`} checked={(surveyAnswers.q3_constraints as string[])?.includes(opt)} readOnly className="border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground" />
                    <Label htmlFor={`q3-demo-${opt}`} className="font-normal text-muted-foreground text-xs">{opt}</Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <Button 
            variant="default" 
            className="w-full sm:w-auto mt-auto bg-primary hover:bg-primary/90 text-primary-foreground" 
            disabled={!surveyButtonEnabled}
            size="sm"
          >
            <Wand2 className="mr-2 h-4 w-4" /> Optimize My Prompt
          </Button>
        </div>
      ),
    },
    {
      id: 'aiOptimizing',
      title: 'AI Optimizing...',
      duration: optimizingDuration,
      element: (
        <div className="p-4 md:p-6 flex flex-col items-center justify-center h-full space-y-4">
          <Loader2 className="h-12 w-12 text-primary animate-spin" />
          <p className="text-lg text-muted-foreground">Optimizing your prompt...</p>
          <div className="w-full max-w-xs h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary transition-all duration-150" style={{ width: `${optimizingProgress}%` }}></div>
          </div>
        </div>
      ),
    },
    {
      id: 'optimizedPrompt',
      title: 'Optimized Prompt Generated',
      duration: optimizedPromptExample.length * (typingSpeed / 2) + 2000, // faster typing + pause for copy
      element: (
        <div className="p-4 md:p-6 space-y-3 h-full flex flex-col">
          <div className="flex items-center text-lg font-semibold">
            <CheckCircle className="mr-2 h-5 w-5 text-accent" />
            3. Your Optimized Prompt
          </div>
          <Textarea
            value={showOptimizedPromptText} // Content is handled by value prop
            readOnly
            rows={8}
            className="bg-background/70 border-border focus-visible:ring-accent text-foreground placeholder-muted-foreground font-code text-xs leading-relaxed resize-none flex-grow"
          />
          <Button 
            variant="outline" 
            onClick={() => {
              if (!copyButtonEnabled) return;
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
            className={cn(
              "w-full sm:w-auto mt-auto",
              copied ? "bg-accent text-accent-foreground hover:bg-accent/90" : "hover:bg-accent/10"
            )}
            disabled={!copyButtonEnabled}
            size="sm"
          >
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
    // Clear all previous timeouts and intervals
    if (sceneTimeoutRef.current) clearTimeout(sceneTimeoutRef.current);
    if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
    effectTimeoutRefs.current.forEach(clearTimeout);
    effectTimeoutRefs.current = [];

    // Reset states for the current scene
    setTypedGoal('');
    // setShowGoalCaret(true);
    setGoalButtonEnabled(false);
    setSurveyAnswers({});
    setSurveyProgress(0);
    setSurveyButtonEnabled(false);
    setOptimizingProgress(0);
    setShowOptimizedPromptText('');
    // setShowOptimizedCaret(true);
    setCopyButtonEnabled(false);
    setCopied(false);

    const currentSceneConfig = scenes[currentSceneIndex];

    if (currentSceneConfig.id === 'defineGoal') {
      let charIndex = 0;
      // setShowGoalCaret(true);
      typingIntervalRef.current = setInterval(() => {
        setTypedGoal(fullGoal.substring(0, charIndex + 1));
        charIndex++;
        if (charIndex > fullGoal.length) {
          if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
          // setShowGoalCaret(false);
          setGoalButtonEnabled(true);
        }
      }, typingSpeed);
    } else if (currentSceneConfig.id === 'refineDetails') {
      effectTimeoutRefs.current.push(setTimeout(() => {
        setSurveyAnswers(prev => ({ ...prev, q1_audience: 'Small Business Owners' }));
        setSurveyProgress(1);
      }, 0));
      effectTimeoutRefs.current.push(setTimeout(() => {
        setSurveyAnswers(prev => ({ ...prev, q2_tone: 'Professional' }));
        setSurveyProgress(2);
      }, surveyStepDuration));
      effectTimeoutRefs.current.push(setTimeout(() => {
        setSurveyAnswers(prev => ({ ...prev, q3_constraints: ['Avoid jargon', 'Include a CTA'] }));
        setSurveyProgress(3);
        setSurveyButtonEnabled(true);
      }, surveyStepDuration * 2));
    } else if (currentSceneConfig.id === 'aiOptimizing') {
      let progress = 0;
      const intervalTime = optimizingDuration / 20; // 20 steps for 100%
      typingIntervalRef.current = setInterval(() => { // Re-using typingIntervalRef for progress
        progress += 5;
        if (progress <= 100) {
          setOptimizingProgress(progress);
        } else {
          if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
        }
      }, intervalTime);
    } else if (currentSceneConfig.id === 'optimizedPrompt') {
      let charIndex = 0;
      // setShowOptimizedCaret(true);
      typingIntervalRef.current = setInterval(() => {
        setShowOptimizedPromptText(optimizedPromptExample.substring(0, charIndex + 1));
        charIndex++;
        if (charIndex > optimizedPromptExample.length) {
          if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
          // setShowOptimizedCaret(false);
          setCopyButtonEnabled(true);
        }
      }, typingSpeed / 2); // Faster typing for output
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
  }, [currentSceneIndex]);

  const progressPercentage = ((currentSceneIndex) / scenes.length) * 100;

  return (
    <GlassCard
      className={cn(
        "aspect-[16/10] sm:aspect-video overflow-hidden shadow-2xl bg-card/80 backdrop-blur-md border-white/30",
        "w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-2xl xl:max-w-3xl mx-auto transition-opacity duration-500 ease-in-out relative"
      )}
    >
      <div className="w-full h-1.5 bg-muted absolute top-0 left-0 z-10 rounded-t-lg overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-300 ease-linear"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
      <div ref={sceneContainerRef} className="pt-1.5 h-full w-full flex flex-col justify-center text-foreground"> {/* Ensure text color for demo content */}
        {scenes[currentSceneIndex].element}
      </div>
      <style jsx global>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        .animate-blinking-caret {
          animation: blink 1s step-end infinite;
        }
      `}</style>
    </GlassCard>
  );
};


export function DemoVideoSection() {
  return (
    <section id="demo-video" className="py-12 md:py-16 lg:py-24 bg-gradient-to-b from-background via-indigo-50/30 to-mint-50/30">
      <Container className="text-center">
        <h2 className="font-headline text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          See BrieflyAI in Action
        </h2>
        <p className="mx-auto mt-3 sm:mt-4 max-w-xl sm:max-w-2xl text-md sm:text-lg text-muted-foreground">
          Watch this interactive demo of how BrieflyAI helps you craft perfect AI prompts.
        </p>
        <div className="mt-8 sm:mt-10">
          <AnimatedDemo />
        </div>
        <p className="mt-3 sm:mt-4 text-xs sm:text-sm text-muted-foreground">
          BrieflyAI: Define Goal → Refine with Details → Get Optimized Prompt. Effortless.
        </p>
      </Container>
    </section>
  );
}

