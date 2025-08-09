
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { usePathname } from 'next/navigation';
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { submitUserReport } from "@/services/feedbackService";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { LoaderCircle } from "lucide-react";

const reportSchema = z.object({
  reportType: z.enum(["feedback", "bug"], {
    required_error: "You need to select a report type.",
  }),
  message: z.string().min(10, {
    message: "Your message must be at least 10 characters.",
  }),
});

interface FeedbackReporterProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export default function FeedbackReporter({ isOpen, onOpenChange }: FeedbackReporterProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof reportSchema>>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      reportType: "feedback",
      message: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof reportSchema>) => {
    if (!user) {
        toast({ variant: "destructive", title: "You must be logged in." });
        return;
    }
    setIsLoading(true);
    try {
        await submitUserReport({
            userId: user.uid,
            email: user.email || 'N/A',
            reportType: data.reportType,
            message: data.message,
            page: pathname,
        });
        toast({
            title: "Report Submitted",
            description: "Thank you! Your feedback helps us improve.",
        });
        form.reset();
        onOpenChange(false);
    } catch (error) {
        console.error("Failed to submit report:", error);
        toast({ variant: "destructive", title: "Submission Failed", description: "Could not submit your report. Please try again." });
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Submit Feedback or Report a Bug</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
            <FormField
              control={form.control}
              name="reportType"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>What are you reporting?</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex gap-4"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="feedback" />
                        </FormControl>
                        <FormLabel className="font-normal">General Feedback</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="bug" />
                        </FormControl>
                        <FormLabel className="font-normal">Report a Bug</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Message</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Please be as detailed as possible. If reporting a bug, describe the steps to reproduce it."
                      className="min-h-[150px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
                <DialogClose asChild>
                    <Button type="button" variant="outline">Cancel</Button>
                </DialogClose>
                <Button type="submit" disabled={isLoading}>
                    {isLoading && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                    Submit Report
                </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
