
"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, LoaderCircle, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { generateWrittenContent, GenerateWrittenContentInput } from "@/ai/flows/generate-written-content-flow";


export default function WrittenContentPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [generatedContent, setGeneratedContent] = useState("");
  const [copied, setCopied] = useState(false);
  const [tone, setTone] = useState("professional");
  const { toast } = useToast();

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setGeneratedContent("");
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const input: GenerateWrittenContentInput = {
      contentType: formData.get("contentType") as string,
      tone: tone,
      topic: formData.get("topic") as string,
      audience: (formData.get("audience") as string) || undefined,
      keywords: (formData.get("keywords") as string) || undefined,
    };

    if (!input.topic) {
        toast({
            variant: "destructive",
            title: "Topic is required",
            description: "Please describe the main topic or message for your content.",
        });
        setIsLoading(false);
        return;
    }

    try {
      const result = await generateWrittenContent(input);
      if (result.generatedContent) {
        setGeneratedContent(result.generatedContent);
      } else {
        throw new Error("The AI did not return any content.");
      }
    } catch (error) {
      console.error("Failed to generate content:", error);
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
            Generate Written Content
          </h1>
          <p className="mb-12 text-lg text-muted-foreground">
            Describe the content you want to create, and our AI will write it for you.
          </p>
        </div>

        <Card className="w-full rounded-xl">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                <div className="space-y-2">
                  <h3 className="text-lg font-medium text-white">
                    What type of content do you need?
                  </h3>
                  <Select name="contentType" defaultValue="blog-post">
                    <SelectTrigger id="content-type" className="text-base">
                      <SelectValue placeholder="Select a content type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="blog-post">Blog Post</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="social-media-update">Social Media Update</SelectItem>
                      <SelectItem value="ad-copy">Ad Copy</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-white">
                    Choose a tone of voice
                  </h3>
                   <RadioGroup
                    value={tone}
                    onValueChange={setTone}
                    className="grid grid-cols-2 gap-4 pt-2"
                  >
                    {[
                      { value: 'professional', label: 'Professional' },
                      { value: 'casual', label: 'Casual' },
                      { value: 'witty', label: 'Witty' },
                      { value: 'persuasive', label: 'Persuasive' },
                    ].map(({ value, label }) => (
                      <div key={value}>
                        <RadioGroupItem value={value} id={`tone-${value}`} className="peer sr-only" />
                        <Label htmlFor={`tone-${value}`} className="flex h-full items-center justify-center rounded-md border-2 border-accent bg-secondary px-4 py-2 hover:cursor-pointer hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 [&:has([data-state=checked])]:border-primary">
                          {label}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-medium text-white">
                  What is the main topic or message?
                </h3>
                <Textarea
                  id="topic"
                  name="topic"
                  placeholder="e.g., 'Announcing our new feature that helps users save time' or 'The benefits of using our product for small businesses'."
                  className="min-h-[120px] text-base"
                  required
                />
              </div>

              <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                 <div className="space-y-2">
                    <h3 className="text-lg font-medium text-white">
                      Who is the target audience? <span className="font-normal text-muted-foreground">(optional)</span>
                    </h3>
                    <Input id="audience" name="audience" placeholder="e.g., 'Software developers' or 'Mothers in their 30s'" className="text-base" />
                </div>
                 <div className="space-y-2">
                    <h3 className="text-lg font-medium text-white">
                      Keywords to include <span className="font-normal text-muted-foreground">(comma-separated, optional)</span>
                    </h3>
                    <Input id="keywords" name="keywords" placeholder="e.g., 'AI, productivity, automation'" className="text-base" />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button type="submit" size="lg" className="text-lg" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    "Generate Content"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {generatedContent && (
          <Card className="mt-12 rounded-xl">
            <CardHeader className="flex flex-row items-center justify-between p-4">
              <CardTitle>Your Generated Content</CardTitle>
              <Button variant="ghost" size="icon" onClick={handleCopy}>
                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                <span className="sr-only">Copy Content</span>
              </Button>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="prose dark:prose-invert max-w-none whitespace-pre-wrap rounded-md bg-secondary p-4">
                {generatedContent}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
