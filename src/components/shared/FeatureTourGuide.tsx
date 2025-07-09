
"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles, X } from 'lucide-react';

const tourStops = [
    {
        target: '#feature-written-content',
        title: 'Written Content',
        content: 'Generate high-quality blog posts, emails, social media updates, and more from a simple description.',
    },
    {
        target: '#feature-prompt-generator',
        title: 'Prompt Generator',
        content: 'Need to use another AI? Craft detailed, optimized prompts for any model or task to get the best results.',
    },
    {
        target: '#feature-web-page-app',
        title: 'Web Page / App',
        content: 'Build multi-file, production-ready web pages and applications with Next.js from a single prompt.',
    },
    {
        target: '#feature-image-generator',
        title: 'Image Generator',
        content: 'Create unique, stunning images and art from a text description. You can even provide your own images for context.',
    },
    {
        target: '#feature-structured-data',
        title: 'Structured Data',
        content: 'Generate structured data like JSON or CSV from a plain-English description, perfect for populating components.',
    },
];

export default function FeatureTourGuide() {
    const [step, setStep] = useState(-1); // -1 is the welcome step
    const [isTourActive, setIsTourActive] = useState(false);

    useEffect(() => {
        const hasSeenTour = localStorage.getItem('hasSeenBrieflyAIFeatureTour');
        if (!hasSeenTour) {
            // Start the tour after a short delay to ensure the page is rendered
            setTimeout(() => {
                setIsTourActive(true);
            }, 500);
        }
    }, []);

    // Effect to manage highlighting elements
    useEffect(() => {
        // Clear previous highlights
        document.querySelectorAll('.tour-highlight').forEach(el => {
            el.classList.remove('tour-highlight');
        });

        if (isTourActive && step >= 0) {
            const currentStop = tourStops[step];
            const targetElement = document.querySelector(currentStop.target);
            if (targetElement) {
                targetElement.classList.add('tour-highlight');
                targetElement.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
            }
        }
    }, [step, isTourActive]);


    const handleNext = () => {
        if (step < tourStops.length - 1) {
            setStep(prev => prev + 1);
        } else {
            handleFinish();
        }
    };

    const handleFinish = () => {
        setIsTourActive(false);
        // Clean up the final highlight
        document.querySelectorAll('.tour-highlight').forEach(el => {
            el.classList.remove('tour-highlight');
        });
        localStorage.setItem('hasSeenBrieflyAIFeatureTour', 'true');
    };

    if (!isTourActive) {
        return null;
    }

    const currentStop = step >= 0 ? tourStops[step] : null;

    return (
        <div className="fixed inset-0 bg-transparent z-[99]" style={{ pointerEvents: 'none' }}>
            <div 
                className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[90vw] max-w-lg bg-card border border-border shadow-2xl rounded-xl p-6 animate-fade-in"
                style={{ pointerEvents: 'auto' }}
            >
                 <Button variant="ghost" size="icon" className="absolute top-3 right-3 h-7 w-7" onClick={handleFinish}><X className="h-4 w-4" /></Button>

                {step === -1 ? (
                     <div className="text-center space-y-4">
                        <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                            <Sparkles className="w-8 h-8 text-primary" />
                        </div>
                        <h2 className="text-2xl font-bold text-foreground">Welcome to BrieflyAI!</h2>
                        <p className="text-muted-foreground">Let's take a quick tour of the creation tools available to you.</p>
                        <Button size="lg" onClick={() => setStep(0)}>Start Tour</Button>
                    </div>
                ) : (
                    currentStop && (
                        <div className="space-y-4">
                             <h3 className="font-bold text-xl text-foreground">{currentStop.title}</h3>
                             <p className="text-muted-foreground">{currentStop.content}</p>
                             <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-muted-foreground">{step + 1} / {tourStops.length}</span>
                                <Button size="sm" onClick={handleNext}>
                                    {step < tourStops.length - 1 ? 'Next' : 'Finish Tour'}
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                             </div>
                        </div>
                    )
                )}
            </div>
        </div>
    );
}
