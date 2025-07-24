
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, RefreshCw, ThumbsUp, ThumbsDown, Check } from 'lucide-react';
import FeedbackModal from './FeedbackModal';
import { useToast } from '@/hooks/use-toast';
import { submitFeedback } from '@/services/feedbackService';
import { useAuth } from '@/contexts/AuthContext';
import { type Message } from '@/types/ai';


interface ChatMessageActionsProps {
  message: Message;
  onRegenerate: () => void;
}

export default function ChatMessageActions({ message, onRegenerate }: ChatMessageActionsProps) {
    const [copied, setCopied] = useState(false);
    const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
    const [feedbackRating, setFeedbackRating] = useState<'good' | 'bad' | null>(null);
    const { toast } = useToast();
    const { user } = useAuth();
    
    // Feedback is identified by the message content for simplicity, in a real app you'd use a unique message ID.
    const feedbackId = message.content;
    const [feedbackGiven, setFeedbackGiven] = useState<'good' | 'bad' | null>(null);

    const handleCopy = () => {
        if (!message.content) return;
        navigator.clipboard.writeText(message.content);
        setCopied(true);
        toast({ title: 'Copied to clipboard' });
        setTimeout(() => setCopied(false), 2000);
    };

    const openFeedbackModal = (rating: 'good' | 'bad') => {
        setFeedbackRating(rating);
        setIsFeedbackModalOpen(true);
    };
    
    const handleFeedbackSubmit = async (feedback: { tags: string[]; comment: string }) => {
        if (!user || !feedbackRating) return;

        try {
            await submitFeedback({
                userId: user.uid,
                // In a real app, you would pass a unique message ID instead of content.
                contentId: feedbackId, 
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
