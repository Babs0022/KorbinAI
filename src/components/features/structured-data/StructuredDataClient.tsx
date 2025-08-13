
"use client";

import { useState, useEffect } from "react";
import Link from 'next/link';
import { useSearchParams } from "next/navigation";
import { LoaderCircle, Sparkles, Wand2, Save, ImagePlus, X } from "lucide-react";
import NextImage from "next/image";

import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { saveProject } from '@/services/projectService';

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { generateStructuredData } from "@/ai/flows/generate-structured-data-flow";
import { generateJsonSchemaSuggestions } from "@/ai/flows/generate-json-schema-suggestions-flow";
import { generateDataRefinementSuggestions } from "@/ai/flows/generate-data-refinement-suggestions-flow";
import type { GenerateStructuredDataInput, RefinementSuggestion } from "@/types/ai";
import GenerationResultCard from "@/components/shared/GenerationResultCard";
import Logo from "@/components/shared/Logo";
import AnimatedLoadingText from "@/components/shared/AnimatedLoadingText";

export default function StructuredDataClient() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  
  // Form State
  const [format, setFormat] = useState("json");
  const [description, setDescription] = useState("");
  const [schemaDefinition, setSchemaDefinition] = useState("");
  const [images, setImages] = useState<string[]>([]);

  // Generation State
  const [isLoading, setIsLoading] = useState(false);
  const [isRefining, setIsRefining] = useState<string | false>(false);
  const [generatedData, setGeneratedData] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [projectId, setProjectId] = useState<string | null>(null);

  // Suggestion State
  const [schemaSuggestion, setSchemaSuggestion] = useState("");
  const [refinementSuggestions, setRefinementSuggestions] = useState<RefinementSuggestion[]>([]);
  const [isSuggestingSchema, setIsSuggestingSchema] = useState(false);
  const [debounceTimeout, setDebounceTimeout] = useState<NodeJS.Timeout | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    const urlDescription = searchParams.get('description');
    if (urlDescription) {
      setDescription(urlDescription);
    }
  }, [searchParams]);

  // Debounced effect for schema suggestions
  useEffect(() => {
    if (debounceTimeout) clearTimeout(debounceTimeout);
    
    if (format !== 'json' || description.trim().split(/\s+/).length < 4) {
      setSchemaSuggestion("");
      return;
    }

    setIsSuggestingSchema(true);
    const timeout = setTimeout(async () => {
      try {
        const result = await generateJsonSchemaSuggestions({ description });
        setSchemaSuggestion(result.suggestedSchema || "");
      } catch (error) {
        console.error("Failed to get schema suggestions:", error);
        setSchemaSuggestion("");
      } finally {
        setIsSuggestingSchema(false);
      }
    }, 1000);

    setDebounceTimeout(timeout);

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [description, format]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      const newImagesPromises = filesArray.map(file => {
        return new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      });

      Promise.all(newImagesPromises).then(newImages => {
        setImages(prev => [...prev, ...newImages]);
      });
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const getRefinementSuggestions = async (data: string, dataFormat: string) => {
    try {
        const result = await generateDataRefinementSuggestions({ data, format: dataFormat });
        setRefinementSuggestions(result.suggestions || []);
    } catch (error) {
        console.error("Failed to get refinement suggestions:", error);
        setRefinementSuggestions([]);
    }
  };


  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setGeneratedData("");
    setRefinementSuggestions([]);
    setIsLoading(true);
    setProjectId(null); // Reset save state

    const input: GenerateStructuredDataInput = {
      description,
      format,
      schemaDefinition: schemaDefinition || undefined,
      imageDataUris: images.length > 0 ? images : undefined,
      userId: user?.uid,
    };

    if (!input.description) {
      toast({
        variant: "destructive",
        title: "Description is required",
        description: "Please describe the data you want to generate.",
      });
      setIsLoading(false);
      return;
    }

    try {
      const result = await generateStructuredData(input);
      if (result.generatedData) {
        let finalData = result.generatedData;
        if (format === 'json') {
          try {
            const parsedJson = JSON.parse(finalData);
            finalData = JSON.stringify(parsedJson, null, 2);
          } catch (e) {
            console.warn("Could not parse and format generated JSON, displaying as is.", e);
          }
        }
        setGeneratedData(finalData);
        await getRefinementSuggestions(finalData, format);
      } else {
        throw new Error("The AI did not return any data.");
      }
    } catch (error) {
      console.error("Failed to generate data:", error);
      toast({
        variant: "destructive",
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred.",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleRefine = async (instruction: string) => {
    setIsRefining(instruction);
    setProjectId(null); // Content changed, allow re-saving
    
    const input: GenerateStructuredDataInput = {
      description,
      format,
      schemaDefinition: schemaDefinition || undefined,
      originalData: generatedData,
      refinementInstruction: instruction,
      userId: user?.uid,
    };

    try {
      const result = await generateStructuredData(input);
      if (result.generatedData) {
        let finalData = result.generatedData;
        if (format === 'json') {
          try {
            const parsedJson = JSON.parse(finalData);
            finalData = JSON.stringify(parsedJson, null, 2);
          } catch (e) {
            console.warn("Could not parse and format refined JSON, displaying as is.", e);
          }
        }
        setGeneratedData(finalData);
        await getRefinementSuggestions(finalData, format);
        toast({ title: "Data Refined", description: "The data has been updated." });
      } else {
        throw new Error("The AI did not return any refined data.");
      }
    } catch (error) {
      console.error("Failed to refine data:", error);
      toast({
        variant: "destructive",
        title: "Refinement Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred.",
      });
    } finally {
      setIsRefining(false);
    }
  };
  
  const handleSave = async () => {
    if (!user || !generatedData) return;
    setIsSaving(true);
    try {
      const id = await saveProject({
        userId: user.uid,
        type: 'structured-data',
        content: generatedData,
      });
      setProjectId(id);
      toast({
        title: "Project Saved!",
        description: "Your data has been saved to your projects.",
        action: (
          <ToastAction altText="View Project" asChild>
            <Link href={`/dashboard/projects/${id}`}>View</Link>
          </ToastAction>
        ),
      });
    } catch (error) {
      console.error("Failed to save project:", error);
      toast({
        variant: "destructive",
        title: "Save Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="space-y-2">
          <h3 className="text-lg font-medium">
            What data do you want to generate?
          </h3>
          <Textarea
            id="description"
            name="description"
            placeholder="e.g., 'A list of 5 fantasy book characters with names, classes, and levels' or 'A CSV of 10 sample customers with first name, last name, and email'."
            className="min-h-[120px] text-base"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">
            Add Context Images <span className="font-normal text-muted-foreground">(optional)</span>
          </h3>
          <div className="flex flex-wrap gap-4">
            {images.map((image, index) => (
              <div key={index} className="relative w-32 h-32">
                <NextImage src={image} alt={`Image preview ${index + 1}`} fill sizes="128px" className="object-cover rounded-lg" data-ai-hint="context image" />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute -top-2 -right-2 h-7 w-7 rounded-full z-10"
                  onClick={() => removeImage(index)}
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Remove image</span>
                </Button>
              </div>
            ))}
            
            <Label htmlFor="image-upload" className="flex flex-col items-center justify-center w-32 h-32 border-2 border-border border-dashed rounded-lg cursor-pointer bg-secondary hover:bg-accent">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <ImagePlus className="w-8 h-8 text-muted-foreground" />
                <span className="sr-only">Add image</span>
              </div>
              <Input id="image-upload" type="file" className="hidden" accept="image/png, image/jpeg" onChange={handleImageChange} multiple />
            </Label>
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">
              Output Format
            </h3>
            <RadioGroup
              value={format}
              onValueChange={setFormat}
              className="flex flex-wrap items-center gap-6 pt-1"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="json" id="format-json" />
                <Label htmlFor="format-json" className="text-base">JSON</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="csv" id="format-csv" />
                <Label htmlFor="format-csv" className="text-base">CSV</Label>
              </div>
               <div className="flex items-center space-x-2">
                <RadioGroupItem value="kml" id="format-kml" />
                <Label htmlFor="format-kml" className="text-base">KML</Label>
              </div>
               <div className="flex items-center space-x-2">
                <RadioGroupItem value="xml" id="format-xml" />
                <Label htmlFor="format-xml" className="text-base">XML</Label>
              </div>
            </RadioGroup>
          </div>
          
          <div className="space-y-2">
             <div className="flex items-center gap-2">
              <h3 className="text-lg font-medium">
                Schema/Example <span className="font-normal text-muted-foreground">(optional)</span>
              </h3>
              {isSuggestingSchema && format === 'json' && <LoaderCircle className="h-4 w-4 animate-spin" />}
            </div>
            <Textarea
              id="schemaDefinition"
              name="schemaDefinition"
              placeholder={`e.g., {\n  "name": "string",\n  "level": "number"\n} or an XML structure`}
              className="min-h-[100px] font-mono text-xs"
              value={schemaDefinition}
              onChange={(e) => setSchemaDefinition(e.target.value)}
              disabled={format === 'csv'}
            />
            {format === 'json' && schemaSuggestion && (
              <div className="mt-2 rounded-md border border-dashed border-primary/50 bg-secondary p-2">
                  <div className="flex items-center justify-between gap-2">
                      <p className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Sparkles className="h-4 w-4 text-primary" />
                          <span className="font-semibold text-primary">Suggestion:</span>{" "}
                          I can generate a schema for you.
                      </p>
                      <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setSchemaDefinition(schemaSuggestion)}
                      >
                          Use Schema
                      </Button>
                  </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button type="submit" size="lg" className="text-lg" disabled={isLoading || !!isRefining || !user}>
            {isLoading ? (
              <>
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              "Generate Data"
            )}
          </Button>
        </div>
      </form>
    
      {isLoading && (
        <div className="mt-12 flex items-center justify-center">
          <AnimatedLoadingText />
        </div>
      )}

      {generatedData && !isLoading && (
        <div className="mt-12 space-y-8 animate-fade-in">
          <GenerationResultCard
            title="Your Generated Data"
            content={generatedData}
            language={format === 'kml' ? 'xml' : format}
            variant="code"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <Wand2 className="h-5 w-5 text-primary" />
                Refinement Suggestions
              </h3>
              <div className="flex flex-wrap gap-3">
                {refinementSuggestions.length > 0 ? (
                    refinementSuggestions.map(opt => (
                    <Button 
                        key={opt.instruction}
                        variant="secondary"
                        onClick={() => handleRefine(opt.instruction)}
                        disabled={!!isRefining}
                    >
                        {isRefining === opt.instruction && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                        {opt.label}
                    </Button>
                    ))
                ) : (
                    <p className="text-sm text-muted-foreground">No suggestions available for this data structure.</p>
                )}
              </div>
            </div>

            <div className="flex justify-center md:justify-end">
                <Button onClick={handleSave} disabled={isSaving || !user || !!projectId} size="lg">
                    {isSaving ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    {projectId ? 'Saved!' : 'Save Project'}
                </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
