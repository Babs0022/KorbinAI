
"use client";

import { useState, useEffect } from "react";
import NextImage from "next/image";
import Link from 'next/link';
import { useSearchParams } from "next/navigation";
import { LoaderCircle, Download, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { saveProject } from '@/services/projectService';
import { generateImage, type GenerateImageInput } from "@/ai/flows/generate-image-flow";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";

const styleOptions = [
  { value: "photorealistic", label: "Photorealistic" },
  { value: "digital art", label: "Digital Art" },
  { value: "anime", label: "Anime / Manga" },
  { value: "minimalist line art", label: "Line Art" },
];

const ratioOptions = [
    { value: "1:1", label: "Square (1:1)" },
    { value: "2:3", label: "Portrait (2:3)" },
    { value: "16:9", label: "Landscape (16:9)" },
];

export default function ImageGeneratorClient() {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { user } = useAuth();

  // Form State
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState(styleOptions[0].value);
  const [aspectRatio, setAspectRatio] = useState(ratioOptions[0].value);
  
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setGeneratedImages([]);
    setIsLoading(true);
    setProjectId(null); // Reset save state on new generation

    if (!prompt) {
      toast({
        variant: "destructive",
        title: "Prompt is required",
        description: "Please describe the image you want to create.",
      });
      setIsLoading(false);
      return;
    }

    const finalPrompt = `${prompt}, ${style}, aspect ratio ${aspectRatio}`;

    const input: GenerateImageInput = {
      prompt: finalPrompt,
      count: 1, // Let's keep it to 1 image per generation for simplicity
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
                <Card className="w-full rounded-xl sticky top-8">
                <CardContent className="p-6 space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="prompt" className="text-lg font-medium text-white">1. Describe your image</Label>
                        <Textarea
                        id="prompt"
                        name="prompt"
                        placeholder="e.g., 'A red panda wearing a tiny wizard hat, sitting in a magical forest.'"
                        className="min-h-[150px] text-base"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        required
                        />
                    </div>
                    
                    <div className="space-y-3">
                        <h3 className="text-lg font-medium text-white">2. Select a style</h3>
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

                    <div className="space-y-3">
                        <h3 className="text-lg font-medium text-white">3. Choose an aspect ratio</h3>
                        <RadioGroup value={aspectRatio} onValueChange={setAspectRatio}>
                            {ratioOptions.map(({ value, label }) => (
                                <div key={value} className="flex items-center space-x-2">
                                    <RadioGroupItem value={value} id={`ratio-${value}`} />
                                    <Label htmlFor={`ratio-${value}`} className="text-base">{label}</Label>
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
                        "Generate Image"
                    )}
                    </Button>
                </CardContent>
                </Card>
            </form>

            <div className="lg:col-span-8">
                {isLoading && (
                    <div className="flex h-full items-center justify-center rounded-xl border border-dashed p-16">
                        <div className="text-center">
                            <LoaderCircle className="mx-auto h-12 w-12 animate-spin text-primary" />
                            <h3 className="mt-4 text-xl font-semibold">Generating your masterpiece...</h3>
                            <p className="text-muted-foreground">The AI is warming up its paintbrushes.</p>
                        </div>
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
                        <div className="flex justify-center items-center">
                            {generatedImages.map((src, index) => (
                            <button
                                key={index}
                                className="group relative aspect-square w-full max-w-lg overflow-hidden rounded-lg transition-all hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
                                onClick={() => setSelectedImage(src)}
                            >
                                <NextImage
                                src={src}
                                alt={`Generated image ${index + 1}`}
                                fill
                                sizes="(max-width: 1024px) 100vw, 50vw"
                                className="object-cover"
                                />
                                <div className="absolute inset-0 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100 flex items-center justify-center">
                                    <span className="text-white font-semibold">View & Download</span>
                                </div>
                            </button>
                            ))}
                        </div>
                        <div className="flex justify-center">
                            <Button onClick={handleSave} disabled={isSaving || !!projectId} size="lg">
                                {isSaving ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                {projectId ? 'Saved' : 'Save Project'}
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
