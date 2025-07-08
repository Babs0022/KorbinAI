
"use client";

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { GripVertical, Trash2, Plus, ChevronRight, Wand2, RefreshCw } from 'lucide-react';
import MarkdownRenderer from '@/components/shared/MarkdownRenderer';

export interface OutlineItem {
  id: string;
  text: string;
}

interface OutlineEditorProps {
  aiGeneratedOutline: string;
  onGenerateNewOutline: () => void;
  onOutlineChange: (items: OutlineItem[]) => void;
}

// Helper function to parse the initial outline
const parseOutline = (outlineString: string): OutlineItem[] => {
  if (!outlineString) return [];
  return outlineString
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    // Remove markdown list characters like *, -, 1.
    .map(line => line.replace(/^[\*\-\d\.]+\s*/, ''))
    .map(text => ({ id: `item-${Math.random().toString(36).substr(2, 9)}`, text }));
};

export default function OutlineEditor({
  aiGeneratedOutline,
  onGenerateNewOutline,
  onOutlineChange,
}: OutlineEditorProps) {
  const [editableItems, setEditableItems] = useState<OutlineItem[]>([]);
  const [newItemText, setNewItemText] = useState('');
  
  // Ref for drag-and-drop
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  // Initialize and reset logic
  useEffect(() => {
    const initialItems = parseOutline(aiGeneratedOutline);
    setEditableItems(initialItems);
    onOutlineChange(initialItems);
  }, [aiGeneratedOutline, onOutlineChange]);

  const handleReset = () => {
    const initialItems = parseOutline(aiGeneratedOutline);
    setEditableItems(initialItems);
    onOutlineChange(initialItems);
  };

  // CRUD operations
  const handleItemChange = (id: string, newText: string) => {
    const newItems = editableItems.map(item =>
      item.id === id ? { ...item, text: newText } : item
    );
    setEditableItems(newItems);
    onOutlineChange(newItems);
  };

  const handleAddItem = () => {
    if (newItemText.trim()) {
      const newItem: OutlineItem = {
        id: `item-${Math.random().toString(36).substr(2, 9)}`,
        text: newItemText.trim(),
      };
      const newItems = [...editableItems, newItem];
      setEditableItems(newItems);
      onOutlineChange(newItems);
      setNewItemText('');
    }
  };

  const handleDeleteItem = (id: string) => {
    const newItems = editableItems.filter(item => item.id !== id);
    setEditableItems(newItems);
    onOutlineChange(newItems);
  };

  // Drag and drop handler
  const handleDrop = () => {
    if (dragItem.current === null || dragOverItem.current === null) return;
    
    const newItems = [...editableItems];
    const draggedItemContent = newItems.splice(dragItem.current, 1)[0];
    newItems.splice(dragOverItem.current, 0, draggedItemContent);
    
    dragItem.current = null;
    dragOverItem.current = null;
    
    setEditableItems(newItems);
    onOutlineChange(newItems);
  };

  return (
    <div className="space-y-6">
      {/* AI Generated Outline */}
      <Card className="border-dashed border-primary/50 bg-primary/5">
        <CardHeader>
          <CardTitle>AI-Generated Outline</CardTitle>
          <CardDescription>
            This is the starting point from the AI. Use it as a reference.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm dark:prose-invert max-w-none rounded-md bg-background/50 p-4">
            <MarkdownRenderer>{aiGeneratedOutline || "No outline generated yet."}</MarkdownRenderer>
          </div>
        </CardContent>
      </Card>

      {/* Editable Outline */}
      <Card>
        <CardHeader>
          <CardTitle>Your Editable Outline</CardTitle>
          <CardDescription>
            Drag to reorder, edit, add, or delete sections to craft the perfect structure.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {editableItems.map((item, index) => (
              <div
                key={item.id}
                className="group flex items-center gap-2 rounded-md p-2 bg-secondary hover:bg-accent transition-colors"
                draggable
                onDragStart={() => (dragItem.current = index)}
                onDragEnter={() => (dragOverItem.current = index)}
                onDragEnd={handleDrop}
                onDragOver={(e) => e.preventDefault()}
              >
                <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                <Input
                  value={item.text}
                  onChange={(e) => handleItemChange(item.id, e.target.value)}
                  className="flex-grow bg-transparent border-0 focus-visible:ring-1"
                />
                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-50 group-hover:opacity-100">
                    <ChevronRight className="h-4 w-4" />
                    <span className="sr-only">Expand Section</span>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive/50 hover:text-destructive opacity-50 group-hover:opacity-100"
                  onClick={() => handleDeleteItem(item.id)}
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Delete Section</span>
                </Button>
              </div>
            ))}
          </div>
          
          <div className="mt-4 flex gap-2">
            <Input
              placeholder="Add new section title..."
              value={newItemText}
              onChange={(e) => setNewItemText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAddItem(); }}
            />
            <Button onClick={handleAddItem} variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Add
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={onGenerateNewOutline}>
            <Wand2 className="mr-2 h-4 w-4"/>
            Generate New Outline
        </Button>
        <Button variant="secondary" onClick={handleReset}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Reset Outline
        </Button>
      </div>
    </div>
  );
}
