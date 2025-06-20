
import React from 'react'; // Added React for React.memo
import { Button } from '@/components/ui/button';
import { Eye, Edit, Download, Trash2, Tag } from 'lucide-react';
import { GlassCard } from '../shared/GlassCard';
import { Badge } from '../ui/badge';

export interface PromptHistory {
  id: string;
  name: string; // Display name for the prompt
  goal: string; // Original goal
  optimizedPrompt: string;
  timestamp: string; // ISO string or formatted date
  tags?: string[];
  qualityScore?: number; // Optional: For analytics
  targetModel?: string;  // Optional: For analytics
}

interface PromptHistoryItemProps {
  prompt: PromptHistory;
  onView: (prompt: PromptHistory) => void;
  onEdit: (prompt: PromptHistory) => void;
  onExport: (prompt: PromptHistory) => void;
  onDelete: (promptId: string) => void;
}

// Wrapped component with React.memo
export const PromptHistoryItem = React.memo(function PromptHistoryItem({ prompt, onView, onEdit, onExport, onDelete }: PromptHistoryItemProps) {
  const formattedDate = new Date(prompt.timestamp).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  return (
    <GlassCard className="p-4 transition-shadow hover:shadow-xl">
      <div className="flex flex-col sm:flex-row justify-between items-start">
        <div className="flex-grow overflow-hidden">
          <h4 className="font-semibold text-md text-foreground mb-1 line-clamp-1" title={prompt.name}>
            {prompt.name}
          </h4>
          <p className="text-xs text-muted-foreground mb-2">Last updated: {formattedDate}</p>
          {prompt.tags && prompt.tags.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-1 items-center">
              <Tag className="h-3 w-3 text-muted-foreground mr-1 flex-shrink-0" />
              {prompt.tags.map(tag => <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>)}
            </div>
          )}
        </div>
        <div className="flex space-x-1 sm:space-x-2 mt-3 sm:mt-0 sm:ml-4 flex-shrink-0">
          <Button variant="ghost" size="icon" onClick={() => onView(prompt)} title="View Details">
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onEdit(prompt)} title="Edit in Generator">
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onExport(prompt)} title="Export Text">
            <Download className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onDelete(prompt.id)} title="Delete" className="text-destructive hover:text-destructive hover:bg-destructive/10">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </GlassCard>
  );
});
PromptHistoryItem.displayName = 'PromptHistoryItem';
