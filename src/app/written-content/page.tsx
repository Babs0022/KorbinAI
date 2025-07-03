
"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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

export default function WrittenContentPage() {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Logic to handle form submission will be added later
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

        <Card className="w-full border-0 bg-card/50 sm:border">
          <CardContent className="p-0 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="content-type" className="text-base font-semibold">
                    What type of content do you need?
                  </Label>
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
                <div className="space-y-2">
                  <Label htmlFor="tone" className="text-base font-semibold">
                    Choose a tone of voice
                  </Label>
                   <RadioGroup
                    id="tone"
                    defaultValue="professional"
                    className="grid grid-cols-2 gap-4 pt-2"
                  >
                    <div>
                      <RadioGroupItem value="professional" id="tone-professional" className="peer sr-only" />
                      <Label htmlFor="tone-professional" className="flex h-full items-center justify-center rounded-md border-2 border-muted bg-popover px-4 py-2 hover:cursor-pointer hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                        Professional
                      </Label>
                    </div>
                     <div>
                      <RadioGroupItem value="casual" id="tone-casual" className="peer sr-only" />
                      <Label htmlFor="tone-casual" className="flex h-full items-center justify-center rounded-md border-2 border-muted bg-popover px-4 py-2 hover:cursor-pointer hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                        Casual
                      </Label>
                    </div>
                     <div>
                      <RadioGroupItem value="witty" id="tone-witty" className="peer sr-only" />
                      <Label htmlFor="tone-witty" className="flex h-full items-center justify-center rounded-md border-2 border-muted bg-popover px-4 py-2 hover:cursor-pointer hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                        Witty
                      </Label>
                    </div>
                     <div>
                      <RadioGroupItem value="persuasive" id="tone-persuasive" className="peer sr-only" />
                      <Label htmlFor="tone-persuasive" className="flex h-full items-center justify-center rounded-md border-2 border-muted bg-popover px-4 py-2 hover:cursor-pointer hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                        Persuasive
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="topic" className="text-base font-semibold">
                  What is the main topic or message?
                </Label>
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
                    <Label htmlFor="audience" className="text-base font-semibold">
                      Who is the target audience? <span className="text-muted-foreground">(optional)</span>
                    </Label>
                    <Input id="audience" name="audience" placeholder="e.g., 'Software developers' or 'Mothers in their 30s'" className="text-base" />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="keywords" className="text-base font-semibold">
                      Keywords to include <span className="text-muted-foreground">(comma-separated, optional)</span>
                    </Label>
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
      </div>
    </main>
  );
}
