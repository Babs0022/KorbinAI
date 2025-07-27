
"use client";

import { useState, useEffect } from "react";
import NextImage from "next/image";
import Link from 'next/link';
import { useSearchParams } from "next/navigation";
import { LoaderCircle, Download, Save, ImagePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { saveProject } from '@/services/projectService';
import { generateImage } from "@/ai/flows/generate-image-flow";
import type { GenerateImageInput } from "@/types/ai";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import AnimatedLoadingText from "@/components/shared/AnimatedLoadingText";

const styleOptions = [
  { value: "photorealistic", label: "Photorealistic" },
  { value: "digital art", label: "Digital Art" },
  { value: "anime", label: "Anime / Manga" },
  { value: "minimalist line art", label: "Line Art" },
];


export default function ImageGeneratorClient() {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { user } = useAuth();

  // Form State
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState(styleOptions[0].value);
  const [images, setImages] = useState<string[]>([]);
  
  // Generation State
  const [isLoading, setIsLoading] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [projectId, setProjectId] = useState<string | null>(null);
  
  // Dialog State
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    const urlPrompt = searchParams.get('prompt');
    if (urlPrompt) {
      setPrompt(urlPrompt);
    }
  }, [searchParams]);

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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setGeneratedImages([]);
    setIsLoading(true);
    setProjectId(null); // Reset save state on new generation

    if (!prompt) {
      toast({
        variant: "destructive",
        title: "Prompt is required",
        description: "Please describe what you want to create or modify.",
      });
      setIsLoading(false);
      return;
    }

    const input: GenerateImageInput = {
      prompt: prompt,
      style: style,
      imageDataUris: images.length > 0 ? images : undefined,
    };

    try {
      const result = await generateImage(input);
      if (result.imageUrls && result.imageUrls.length > 0) {
        setGeneratedImages(result.imageUrls);
      } else {
        throw new Error("The AI did not return any images.");
      }
    } catch (error) {
      console.error("Failed to generate image:", error);
      toast({
        variant: "destructive",
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred.",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSave = async () => {
    if (!user || generatedImages.length === 0) return;
    setIsSaving(true);
    try {
        const id = await saveProject({
            userId: user.uid,
            type: 'image-generator',
            content: generatedImages,
        });
        setProjectId(id);
        toast({
            title: "Project Saved!",
            description: "Your generated image(s) have been saved to your projects.",
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
    <>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            <form onSubmit={handleSubmit} className="space-y-8 lg:col-span-4">
                <div className="space-y-6 sticky top-8">
                    <div className="space-y-2">
                        <Label htmlFor="prompt" className="text-lg font-medium">1. Describe your vision</Label>
                        <Textarea
                        id="prompt"
                        name="prompt"
                        placeholder="e.g., 'A red panda wearing a tiny wizard hat...' or 'Make the background of this image a futuristic city.'"
                        className="min-h-[150px] text-base"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        required
                        />
                    </div>
                    
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium">
                            2. Add Context Images <span className="font-normal text-muted-foreground">(optional)</span>
                        </h3>
                        <div className="flex flex-wrap gap-4">
                            {images.map((image, index) => (
                            <div key={index} className="relative w-24 h-24">
                                <NextImage src={image} alt={`Image preview ${index + 1}`} fill sizes="96px" className="object-cover rounded-lg" data-ai-hint="context image" />
                                <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="absolute -top-2 -right-2 h-6 w-6 rounded-full z-10"
                                onClick={() => removeImage(index)}
                                >
                                <X className="h-4 w-4" />
                                <span className="sr-only">Remove image</span>
                                </Button>
                            </div>
                            ))}
                            
                            <Label htmlFor="image-upload" className="flex flex-col items-center justify-center w-24 h-24 border-2 border-border border-dashed rounded-lg cursor-pointer bg-secondary hover:bg-accent">
                            <div className="flex flex-col items-center justify-center">
                                <ImagePlus className="w-8 h-8 text-muted-foreground" />
                                <span className="sr-only">Add image</span>
                            </div>
                            <Input id="image-upload" type="file" className="hidden" accept="image/png, image/jpeg" onChange={handleImageChange} multiple />
                            </Label>
                        </div>
                    </div>
                    
                    <div className="space-y-3">
                        <h3 className="text-lg font-medium">3. Select a style <span className="text-sm font-normal text-muted-foreground">(for new images)</span></h3>
                         <RadioGroup value={style} onValueChange={setStyle} className="grid grid-cols-2 gap-2">
                            {styleOptions.map(({ value, label }) => (
                                <div key={value}>
                                <RadioGroupItem value={value} id={`style-${value}`} className="peer sr-only" />
                                <Label htmlFor={`style-${value}`} className="flex h-full min-h-[50px] flex-col items-center justify-center rounded-md border-2 border-accent bg-secondary p-3 text-center text-sm hover:cursor-pointer hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 [&:has([data-state=checked])]:border-primary">
                                    {label}
                                </Label>
                                </div>
                            ))}
                        </RadioGroup>
                    </div>

                    <Button type="submit" size="lg" className="w-full text-lg" disabled={isLoading || !user}>
                    {isLoading ? (
                        <>
                        <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                        </>
                    ) : (
                        "Generate"
                    )}
                    </Button>
                </div>
            </form>

            <div className="lg:col-span-8">
                {isLoading && (
                    <div className="flex h-full items-center justify-center rounded-xl border border-dashed p-16">
                        <AnimatedLoadingText />
                    </div>
                )}
                
                {!isLoading && generatedImages.length === 0 && (
                     <div className="flex h-full items-center justify-center rounded-xl border border-dashed p-16">
                        <div className="text-center">
                           <h3 className="text-xl font-semibold">Your gallery awaits</h3>
                           <p className="text-muted-foreground">Describe your vision and click "Generate" to see the magic.</p>
                        </div>
                    </div>
                )}

                {generatedImages.length > 0 && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {generatedImages.map((src, index) => (
                            <button
                                key={index}
                                className="group relative aspect-square w-full overflow-hidden rounded-lg transition-all hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
                                onClick={() => setSelectedImage(src)}
                            >
                                <NextImage
                                src={src}
                                alt={`Generated image ${index + 1}`}
                                fill
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                className="object-cover"
                                />
                                <div className="absolute inset-0 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100 flex items-center justify-center">
                                    <span className="text-white font-semibold">View & Download</span>
                                </div>
                            </button>
                            ))}
                        </div>
                        <div className="flex justify-center">
                            <Button onClick={handleSave} disabled={isSaving || !user || !!projectId} size="lg">
                                {isSaving ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                {projectId ? 'Saved!' : 'Save Project'}
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>

        <Dialog open={!!selectedImage} onOpenChange={(open) => !open && setSelectedImage(null)}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Generated Image</DialogTitle>
                </DialogHeader>
                {selectedImage && (
                    <div className="space-y-4">
                        <div className="relative aspect-square w-full">
                           <NextImage
                                src={selectedImage}
                                alt="Selected generated image"
                                fill
                                className="rounded-md object-contain"
                           />
                        </div>
                         <a href={selectedImage} download={`generated-image-${Date.now()}.png`}>
                            <Button className="w-full">
                                <Download className="mr-2 h-4 w-4" />
                                Download Image
                            </Button>
                        </a>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    </>
  );
}
