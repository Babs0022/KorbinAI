import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";

export default function ComponentWizardPage() {
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
            Let's build your Web Component
          </h1>
          <p className="mb-12 text-lg text-muted-foreground">
            Answer these simple questions so we can generate the best possible
            result for you.
          </p>
        </div>

        <Card className="w-full border-0 bg-card/50 sm:border">
          <CardContent className="p-0 sm:p-8">
            <form className="space-y-8">
              <div className="grid w-full items-center gap-2">
                <Label htmlFor="component-description" className="text-base font-semibold">
                  In plain English, describe the component you want to build.
                </Label>
                <Textarea
                  id="component-description"
                  placeholder="e.g., 'A contact form with fields for name, email, and message,' or 'A pricing table with three tiers.'"
                  className="min-h-[120px] text-base"
                />
              </div>

              <div className="grid w-full items-center gap-4">
                <Label htmlFor="visual-style" className="text-base font-semibold">
                  What is the visual style of your brand?
                </Label>
                <RadioGroup defaultValue="minimalist" id="visual-style" className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
                  <div>
                    <RadioGroupItem value="minimalist" id="style-minimalist" className="peer sr-only" />
                    <Label htmlFor="style-minimalist" className="flex h-full flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:cursor-pointer hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                      Minimalist & Modern
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem value="playful" id="style-playful" className="peer sr-only" />
                    <Label htmlFor="style-playful" className="flex h-full flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:cursor-pointer hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                      Playful & Creative
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem value="corporate" id="style-corporate" className="peer sr-only" />
                    <Label htmlFor="style-corporate" className="flex h-full flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:cursor-pointer hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                      Corporate & Professional
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem value="futuristic" id="style-futuristic" className="peer sr-only" />
                    <Label htmlFor="style-futuristic" className="flex h-full flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:cursor-pointer hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                      Bold & Futuristic
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="grid w-full items-center gap-2">
                <Label htmlFor="data-points" className="text-base font-semibold">
                  Are there any specific data points it should display?
                </Label>
                <Input
                  id="data-points"
                  placeholder="e.g., 'name, price, user_testimonial,' or 'event_title, date, location.'"
                  className="text-base"
                />
              </div>

              <div className="flex justify-end pt-4">
                <Button type="submit" size="lg" className="text-lg">
                  Next
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
