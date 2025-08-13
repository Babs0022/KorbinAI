
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, RefreshCw, ThumbsUp, ThumbsDown, Check } from 'lucide-react';
import FeedbackModal from './FeedbackModal';
import { useToast } from '@/hooks/use-toast';
import { submitFeedback } from '@/services/feedbackService';
import { useAuth } from '@/contexts/AuthContext';
import { type Message } from '@/types/ai';
import Logo from '@/components/shared/Logo';


interface ChatMessageActionsProps {
  message: Message;
  onRegenerate: () => void;
  projectId?: string; // The chat session ID
}

export default function ChatMessageActions({ message, onRegenerate, projectId }: ChatMessageActionsProps) {
    const [copied, setCopied] = useState(false);
    const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
    const [feedbackRating, setFeedbackRating] = useState<'good' | 'bad' | null>(null);
    const { toast } = useToast();
    const { user } = useAuth();
    
    // We can use the message object itself as a pseudo-ID if it's unique enough for the session
    const contentId = JSON.stringify(message);
    const [feedbackGiven, setFeedbackGiven] = useState<'good' | 'bad' | null>(null);

    const handleCopy = () => {
        if (!message.content) return;
        navigator.clipboard.writeText(message.content);
        setCopied(true);
        toast({ title: 'Copied to clipboard' });
        setTimeout(() => setCopied(false), 2000);
    };

    const openFeedbackModal = (rating: 'good' | 'bad') => {
        if (!projectId) {
            toast({
                variant: 'destructive',
                title: 'Cannot Give Feedback',
                description: 'A chat session must be saved before providing feedback.',
            });
            return;
        }
        setFeedbackRating(rating);
        setIsFeedbackModalOpen(true);
    };
    
    const handleFeedbackSubmit = async (feedback: { tags: string[]; comment: string }) => {
        if (!user || !feedbackRating || !projectId) return;

        try {
            await submitFeedback({
                userId: user.uid,
                projectId: projectId, // This is the chat session ID
                contentId: contentId, 
                rating: feedbackRating,
                tags: feedback.tags,
                comment: feedback.comment,
            });
            toast({ title: "Thank you!", description: "Your feedback has been submitted." });
            setFeedbackGiven(feedbackRating);
        } catch (error) {
            console.error("Failed to submit feedback:", error);
            toast({ variant: 'destructive', title: "Error", description: "Could not submit feedback." });
        } finally {
            setIsFeedbackModalOpen(false);
            setFeedbackRating(null);
        }
    };


    return (
        <div className="flex items-center gap-2 mt-2">
            <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => openFeedbackModal('good')}
                disabled={!!feedbackGiven}
            >
                <ThumbsUp className={`h-4 w-4 ${feedbackGiven === 'good' ? 'text-primary' : ''}`} />
            </Button>
            <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => openFeedbackModal('bad')}
                disabled={!!feedbackGiven}
            >
                <ThumbsDown className={`h-4 w-4 ${feedbackGiven === 'bad' ? 'text-destructive' : ''}`} />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCopy}>
                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onRegenerate}>
                <RefreshCw className="h-4 w-4" />
            </Button>
            
            <div className="ml-2">
                <Logo width={20} height={20} />
            </div>

            {feedbackRating && (
                <FeedbackModal
                    isOpen={isFeedbackModalOpen}
                    onClose={() => setIsFeedbackModalOpen(false)}
                    onSubmit={handleFeedbackSubmit}
                    rating={feedbackRating}
                />
            )}
        </div>
    );
}
