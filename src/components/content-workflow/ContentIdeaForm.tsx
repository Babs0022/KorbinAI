
"use client";

import { useState, KeyboardEvent, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X, Wand2, LoaderCircle } from 'lucide-react';
import { generateContentSuggestions } from '@/ai/flows/generate-content-suggestions-flow';
import type { GenerateContentSuggestionsInput } from '@/types/ai';

// Define the shape of the form data
export interface ContentIdeaFormData {
  contentType: string;
  mainTopic: string;
  purpose: string;
  targetAudience: string;
  otherAudience: string;
  desiredTone: string;
  desiredLength: string;
  keywords: string[];
}

interface ContentIdeaFormProps {
  onDataChange: (data: ContentIdeaFormData) => void;
  initialData?: Partial<ContentIdeaFormData>;
}

const contentTypes = ["Blog Post", "Article", "Email Series", "Report", "Social Media Campaign", "Website Page Copy"];
const audiences = ["General Public", "Technical Developers", "Creative Professionals", "Students", "Entrepreneurs", "Parents", "Other"];
const tones = ["Informative", "Persuasive", "Friendly", "Professional", "Witty", "Empathetic", "Creative"];
const lengths = ["Short (~500 words)", "Medium (~1000 words)", "Long (2000+ words)"];

export default function ContentIdeaForm({ onDataChange, initialData }: ContentIdeaFormProps) {
    const [formData, setFormData] = useState<ContentIdeaFormData>({
        contentType: initialData?.contentType || contentTypes[0],
        mainTopic: initialData?.mainTopic || '',
        purpose: initialData?.purpose || '',
        targetAudience: initialData?.targetAudience || audiences[0],
        otherAudience: initialData?.otherAudience || '',
        desiredTone: initialData?.desiredTone || tones[0],
        desiredLength: initialData?.desiredLength || lengths[0],
        keywords: initialData?.keywords || [],
    });

    const [keywordInput, setKeywordInput] = useState('');
    const [suggestedKeywords, setSuggestedKeywords] = useState<string[]>([]);
    const [isSuggesting, setIsSuggesting] = useState(false);
    const [debounceTimeout, setDebounceTimeout] = useState<NodeJS.Timeout | null>(null);

    const handleChange = (field: keyof ContentIdeaFormData, value: any) => {
        const newData = { ...formData, [field]: value };
        setFormData(newData);
        onDataChange(newData);
    };

    // Debounced effect for AI suggestions
    useEffect(() => {
        if (debounceTimeout) clearTimeout(debounceTimeout);

        if (formData.mainTopic.trim().split(/\s+/).length < 4) {
            setSuggestedKeywords([]);
            return;
        }

        setIsSuggesting(true);
        const timeout = setTimeout(async () => {
            try {
                const result = await generateContentSuggestions({ topic: formData.mainTopic });
                if (result) {
                    setSuggestedKeywords(result.suggestedKeywords || []);
                    if (result.suggestedAudience) {
                        const newAudience = result.suggestedAudience;
                        const isCustom = !audiences.includes(newAudience);

                        // Use a functional update to avoid issues with stale state
                        setFormData(currentData => {
                           const updatedData = {
                                ...currentData,
                                targetAudience: isCustom ? 'Other' : newAudience,
                                otherAudience: isCustom ? newAudience : currentData.otherAudience
                            };
                            // Manually call onDataChange here since we are in a functional update
                            onDataChange(updatedData);
                            return updatedData;
                        });
                    }
                }
            } catch (error) {
                console.error("Failed to get content suggestions:", error);
                setSuggestedKeywords([]);
            } finally {
                setIsSuggesting(false);
            }
        }, 1500);

        setDebounceTimeout(timeout);

        return () => {
            if (timeout) clearTimeout(timeout);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formData.mainTopic]);
    
    const handleSelectChange = (field: keyof ContentIdeaFormData) => (value: string) => {
        handleChange(field, value);
    };

    const handleAddKeyword = (keyword: string) => {
        const trimmedKeyword = keyword.trim();
        if (trimmedKeyword) {
            const newKeywords = [...new Set([...formData.keywords, trimmedKeyword])];
            handleChange('keywords', newKeywords);
        }
    };

    const handleKeywordKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddKeyword(keywordInput);
            setKeywordInput('');
        }
    };

    const removeKeyword = (keywordToRemove: string) => {
        const newKeywords = formData.keywords.filter(k => k !== keywordToRemove);
        handleChange('keywords', newKeywords);
    };

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <div className="flex justify-between items-center">
                    <Label htmlFor="mainTopic">Main Topic/Idea</Label>
                    {isSuggesting && <LoaderCircle className="h-4 w-4 animate-spin text-muted-foreground" />}
                </div>
                <Textarea
                    id="mainTopic"
                    placeholder="What's the main idea or topic? Be descriptive for better suggestions."
                    className="min-h-[120px]"
                    value={formData.mainTopic}
                    onChange={(e) => handleChange('mainTopic', e.target.value)}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="contentType">Content Type</Label>
                    <Select value={formData.contentType} onValueChange={handleSelectChange('contentType')}>
                        <SelectTrigger id="contentType">
                            <SelectValue placeholder="Select a content type" />
                        </SelectTrigger>
                        <SelectContent>
                            {contentTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="purpose">Purpose</Label>
                    <Input
                        id="purpose"
                        placeholder="e.g., drive sign-ups, educate users"
                        value={formData.purpose}
                        onChange={(e) => handleChange('purpose', e.target.value)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="targetAudience">Target Audience</Label>
                    <Select value={formData.targetAudience} onValueChange={handleSelectChange('targetAudience')}>
                        <SelectTrigger id="targetAudience">
                            <SelectValue placeholder="Select an audience" />
                        </SelectTrigger>
                        <SelectContent>
                            {audiences.map(audience => <SelectItem key={audience} value={audience}>{audience}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    {formData.targetAudience === 'Other' && (
                        <Input
                            placeholder="Please specify other audience"
                            className="mt-2"
                            value={formData.otherAudience}
                            onChange={(e) => handleChange('otherAudience', e.target.value)}
                        />
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="desiredTone">Desired Tone</Label>
                    <Select value={formData.desiredTone} onValueChange={handleSelectChange('desiredTone')}>
                        <SelectTrigger id="desiredTone">
                            <SelectValue placeholder="Select a tone" />
                        </SelectTrigger>
                        <SelectContent>
                            {tones.map(tone => <SelectItem key={tone} value={tone}>{tone}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            </div>

             <div className="space-y-2">
                <Label htmlFor="desiredLength">Desired Length</Label>
                <Select value={formData.desiredLength} onValueChange={handleSelectChange('desiredLength')}>
                    <SelectTrigger id="desiredLength">
                        <SelectValue placeholder="Select a length" />
                    </SelectTrigger>
                    <SelectContent>
                        {lengths.map(length => <SelectItem key={length} value={length}>{length}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label htmlFor="keywords">Keywords</Label>
                <div className="flex gap-2">
                    <Input
                        id="keywords"
                        placeholder="Type a keyword and press Enter"
                        value={keywordInput}
                        onChange={(e) => setKeywordInput(e.target.value)}
                        onKeyDown={handleKeywordKeyDown}
                    />
                     <Button type="button" variant="outline" onClick={() => { handleAddKeyword(keywordInput); setKeywordInput(''); }}>Add</Button>
                </div>
                <div className="flex flex-wrap gap-2 pt-2 min-h-[28px]">
                    {formData.keywords.map((keyword, index) => (
                        <Badge key={index} variant="secondary" className="pl-3 pr-1 py-1">
                            {keyword}
                            <button
                                type="button"
                                className="ml-1.5 rounded-full p-0.5 hover:bg-destructive/80 focus:outline-none"
                                onClick={() => removeKeyword(keyword)}
                            >
                                <X className="h-3 w-3" />
                                <span className="sr-only">Remove {keyword}</span>
                            </button>
                        </Badge>
                    ))}
                </div>
                 {suggestedKeywords.length > 0 && (
                    <div className="pt-2">
                         <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                            <Wand2 className="h-4 w-4" />
                            Suggested Keywords
                        </h4>
                        <div className="flex flex-wrap gap-2">
                        {suggestedKeywords.map(keyword => (
                            <Button
                                key={keyword}
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleAddKeyword(keyword)}
                                className="text-xs"
                            >
                                + {keyword}
                            </Button>
                        ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
