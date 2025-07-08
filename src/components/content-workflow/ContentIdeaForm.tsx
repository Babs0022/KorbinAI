
"use client";

import { useState, KeyboardEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';

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

    const handleChange = (field: keyof ContentIdeaFormData, value: any) => {
        const newData = { ...formData, [field]: value };
        setFormData(newData);
        onDataChange(newData);
    };
    
    const handleSelectChange = (field: keyof ContentIdeaFormData) => (value: string) => {
        handleChange(field, value);
    };

    const handleKeywordKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && keywordInput.trim() !== '') {
            e.preventDefault();
            const newKeywords = [...new Set([...formData.keywords, keywordInput.trim()])];
            handleChange('keywords', newKeywords);
            setKeywordInput('');
        }
    };

    const removeKeyword = (keywordToRemove: string) => {
        const newKeywords = formData.keywords.filter(k => k !== keywordToRemove);
        handleChange('keywords', newKeywords);
    };

    return (
        <div className="space-y-6">
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
            </div>

            <div className="space-y-2">
                <Label htmlFor="mainTopic">Main Topic/Idea</Label>
                <Textarea
                    id="mainTopic"
                    placeholder="What's the main idea or topic?"
                    className="min-h-[120px]"
                    value={formData.mainTopic}
                    onChange={(e) => handleChange('mainTopic', e.target.value)}
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="purpose">Purpose</Label>
                <Textarea
                    id="purpose"
                    placeholder="What do you want this content to achieve? (e.g., drive sign-ups, educate users)"
                    className="min-h-[80px]"
                    value={formData.purpose}
                    onChange={(e) => handleChange('purpose', e.target.value)}
                />
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
                <Input
                    id="keywords"
                    placeholder="Type a keyword and press Enter"
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    onKeyDown={handleKeywordKeyDown}
                />
                <div className="flex flex-wrap gap-2 pt-2">
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
            </div>
        </div>
    );
}
