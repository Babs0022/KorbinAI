import { Button } from '@/components/ui/button';
import { Eye, Edit, Download, Trash2 } from 'lucide-react';
import { GlassCard } from '../shared/GlassCard';
import { Badge } from '../ui/badge';

export interface PromptHistory {
  id: string;
  goal: string;
  optimizedPrompt: string;
  timestamp: string; // ISO string or formatted date
  tags?: string[];
}

interface PromptHistoryItemProps {
  prompt: PromptHistory;
  onView: (prompt: PromptHistory) => void;
  onEdit: (prompt: PromptHistory) => void;
  onExport: (prompt: PromptHistory) => void;
  onDelete: (promptId: string) => void;
}

export function PromptHistoryItem({ prompt, onView, onEdit, onExport, onDelete }: PromptHistoryItemProps) {
  const formattedDate = new Date(prompt.timestamp).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  return (
    <GlassCard className="p-4 transition-shadow hover:shadow-xl">
      <div className="flex flex-col sm:flex-row justify-between items-start">
        <div>
          <h4 className="font-semibold text-md text-foreground mb-1 line-clamp-1" title={prompt.goal}>
            Goal: {prompt.goal}
          </h4>
          <p className="text-xs text-muted-foreground mb-2">Created: {formattedDate}</p>
          {prompt.tags && prompt.tags.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-1">
              {prompt.tags.map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}
            </div>
          )}
          <p className="text-sm text-muted-foreground line-clamp-2" title={prompt.optimizedPrompt}>
            <span className="font-medium text-foreground/80">Optimized: </span>{prompt.optimizedPrompt}
          </p>
        </div>
        <div className="flex space-x-2 mt-3 sm:mt-0 sm:ml-4 flex-shrink-0">
          <Button variant="ghost" size="icon" onClick={() => onView(prompt)} title="View">
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onEdit(prompt)} title="Edit">
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onExport(prompt)} title="Export">
            <Download className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onDelete(prompt.id)} title="Delete" className="text-destructive hover:text-destructive hover:bg-destructive/10">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </GlassCard>
  );
}
