
"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (feedback: { tags: string[]; comment: string }) => void;
  rating: 'good' | 'bad';
}

const goodFeedbackTags = ["Factually Correct", "Easy to Understand", "Informative", "Creative / Interesting", "Other"];
const badFeedbackTags = ["Factually Incorrect", "Unhelpful", "Too Long / Short", "Off-topic", "Other"];

export default function FeedbackModal({ isOpen, onClose, onSubmit, rating }: FeedbackModalProps) {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [comment, setComment] = useState('');

  const tagsToShow = rating === 'good' ? goodFeedbackTags : badFeedbackTags;

  const handleTagClick = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = () => {
    onSubmit({ tags: selectedTags, comment });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Why did you choose this rating? (Optional)</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-6">
          <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Select what you liked or disliked:</p>
              <div className="flex flex-wrap gap-2">
                  {tagsToShow.map(tag => (
                      <Button
                          key={tag}
                          variant="outline"
                          size="sm"
                          onClick={() => handleTagClick(tag)}
                          className={cn(
                              selectedTags.includes(tag) && 'bg-primary/10 border-primary'
                          )}
                      >
                          {tag}
                      </Button>
                  ))}
              </div>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Provide additional feedback:</p>
            <Textarea
              placeholder="Your comments help me improve..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit}>Submit Feedback</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
