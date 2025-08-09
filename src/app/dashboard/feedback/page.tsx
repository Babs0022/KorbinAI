
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { submitUserReport } from "@/services/feedbackService";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LoaderCircle, UploadCloud, X } from "lucide-react";

const reportSchema = z.object({
  reportType: z.enum(["feedback", "bug"], {
    required_error: "You need to select a report type.",
  }),
  subject: z.string().min(5, {
    message: "Subject must be at least 5 characters.",
  }),
  message: z.string().min(20, {
    message: "Your message must be at least 20 characters.",
  }),
});

export default function FeedbackPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(false);
  const [attachment, setAttachment] = useState<{ file: File, preview: string } | null>(null);

  const form = useForm<z.infer<typeof reportSchema>>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      reportType: "feedback",
      subject: "",
      message: "",
    },
  });
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          variant: "destructive",
          title: "File Too Large",
          description: "Please upload a file smaller than 5MB.",
        });
        return;
      }
      const preview = URL.createObjectURL(file);
      setAttachment({ file, preview });
    }
  };

  const removeAttachment = () => {
    if (attachment) {
      URL.revokeObjectURL(attachment.preview);
    }
    setAttachment(null);
  };

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
        subject: data.subject,
        message: data.message,
        page: pathname,
        attachmentFile: attachment?.file,
      });
      toast({
        title: "Report Submitted",
        description: "Thank you! Your feedback helps us improve KorbinAI.",
      });
      form.reset();
      removeAttachment();
    } catch (error) {
      console.error("Failed to submit report:", error);
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description: "Could not submit your report. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <main className="flex-1 p-4 md:p-8">
        <div className="w-full max-w-4xl mx-auto">
          <div className="mb-10 text-center">
            <h1 className="text-4xl font-bold">Submit Feedback</h1>
            <p className="mt-2 text-lg text-muted-foreground">
              Have a suggestion or found a bug? Let us know!
            </p>
          </div>

          <Card>
            <CardHeader>
                <CardTitle>New Report</CardTitle>
                <CardDescription>Please be as detailed as possible in your report.</CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
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
                            name="subject"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Subject</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g., Suggestion for the image generator" {...field} />
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
                                    placeholder="Please provide details. If it's a bug, what were the steps to reproduce it?"
                                    className="min-h-[200px]"
                                    {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        
                        <FormItem>
                           <FormLabel>Attach a Screenshot (optional, max 5MB)</FormLabel>
                           <FormControl>
                            <div className="mt-2 flex justify-center rounded-lg border border-dashed border-border px-6 py-10">
                              <div className="text-center">
                                  {attachment ? (
                                    <div className="relative mx-auto w-fit">
                                      <Image src={attachment.preview} alt="Preview" width={200} height={200} className="rounded-md max-h-48 w-auto" />
                                       <Button
                                            type="button"
                                            variant="destructive"
                                            size="icon"
                                            className="absolute -top-2 -right-2 h-7 w-7 rounded-full z-10"
                                            onClick={removeAttachment}
                                        >
                                            <X className="h-4 w-4" />
                                            <span className="sr-only">Remove image</span>
                                        </Button>
                                    </div>
                                  ) : (
                                    <>
                                      <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
                                      <div className="mt-4 flex text-sm leading-6 text-muted-foreground">
                                        <label
                                          htmlFor="file-upload"
                                          className="relative cursor-pointer rounded-md font-semibold text-primary focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 hover:text-primary/80"
                                        >
                                          <span>Upload a file</span>
                                          <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept="image/png, image/jpeg, image/gif" />
                                        </label>
                                        <p className="pl-1">or drag and drop</p>
                                      </div>
                                      <p className="text-xs leading-5 text-muted-foreground">PNG, JPG, GIF up to 5MB</p>
                                    </>
                                  )}
                              </div>
                            </div>
                           </FormControl>
                           <FormMessage />
                        </FormItem>


                        <div className="flex justify-end">
                             <Button type="submit" disabled={isLoading} size="lg">
                                {isLoading && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                                Submit Report
                            </Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
          </Card>
        </div>
      </main>
    </DashboardLayout>
  );
}
