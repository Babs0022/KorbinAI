
"use client";

import { useState } from "react";
import Link from "next/link";
import NextImage from "next/image";
import { ArrowLeft, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { generateImage } from "@/ai/flows/generate-image-flow";
import type { GenerateImageInput } from "@/ai/flows/generate-image-flow";

export default function ImageGeneratorPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState("");
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setGeneratedImage("");
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const input: GenerateImageInput = {
      prompt: formData.get("prompt") as string,
    };

    if (!input.prompt) {
      toast({
        variant: "destructive",
        title: "Prompt is required",
        description: "Please describe the image you want to create.",
      });
      setIsLoading(false);
      return;
    }

    try {
      const result = await generateImage(input);
      if (result.imageUrl) {
        setGeneratedImage(result.imageUrl);
      } else {
        throw new Error("The AI did not return an image.");
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

  return (
    <main className="flex min-h-screen flex-col items-center p-4 md:p-8">
      <div className="w-full max-w-4xl">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Creation Hub
        </Link>

        <div className="text-center">
          <h1 className="mb-2 text-4xl font-bold md:text-5xl">
            Image Generator
          </h1>
          <p className="mb-12 text-lg text-muted-foreground">
            Describe the image you want to create, and the AI will bring it to life.
          </p>
        </div>

        <Card className="w-full border-0 bg-card/50 sm:border">
          <CardContent className="p-0 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-2">
                <Label htmlFor="prompt" className="text-base font-semibold">
                  What should the image look like?
                </Label>
                <Textarea
                  id="prompt"
                  name="prompt"
                  placeholder="e.g., 'A photorealistic image of a red panda wearing a tiny wizard hat, sitting in a magical forest.'"
                  className="min-h-[120px] text-base"
                  required
                />
              </div>

              <div className="flex justify-end pt-4">
                <Button type="submit" size="lg" className="text-lg" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    "Generate Image"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {isLoading && (
          <Card className="mt-12">
            <CardHeader>
              <CardTitle>Generating Your Image...</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-center p-16">
                <LoaderCircle className="h-12 w-12 animate-spin text-primary" />
            </CardContent>
          </Card>
        )}

        {generatedImage && !isLoading && (
          <Card className="mt-12">
            <CardHeader>
              <CardTitle>Your Generated Image</CardTitle>
            </CardHeader>
            <CardContent>
              <NextImage
                src={generatedImage}
                alt="Generated image"
                width={1024}
                height={1024}
                className="rounded-lg border"
              />
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
