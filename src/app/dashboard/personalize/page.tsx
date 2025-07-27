
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { updateProfile } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { auth, db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Save, LoaderCircle } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";

// The customSystemPrompt is now optional and can be an empty string
const personalizeFormSchema = z.object({
  preferredName: z.string().min(1, "Preferred name cannot be empty."),
  customSystemPrompt: z.string().optional(),
});

type PersonalizeFormValues = z.infer<typeof personalizeFormSchema>;

export default function PersonalizePage() {
    const { user, loading: authLoading } = useAuth();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isFormLoading, setIsFormLoading] = useState(true);
    const [currentSystemPrompt, setCurrentSystemPrompt] = useState("");

    const form = useForm<PersonalizeFormValues>({
        resolver: zodResolver(personalizeFormSchema),
        defaultValues: {
            preferredName: "",
            customSystemPrompt: "",
        },
    });

    useEffect(() => {
        async function fetchUserSettings() {
            if (user) {
                setIsFormLoading(true);
                const userDocRef = doc(db, "users", user.uid);
                const userDoc = await getDoc(userDocRef);
                if (userDoc.exists()) {
                    const data = userDoc.data();
                    form.setValue('preferredName', data.name || user.displayName || "");
                    setCurrentSystemPrompt(data.customSystemPrompt || "");
                } else {
                     form.setValue('preferredName', user.displayName || "");
                     setCurrentSystemPrompt("");
                }
                setIsFormLoading(false);
            }
        }
        if (!authLoading) {
            fetchUserSettings();
        }
    }, [user, authLoading, form]);
    
    async function onSubmit(values: PersonalizeFormValues) {
        if (!user || !auth.currentUser) return;
        setIsSubmitting(true);
        try {
            // Update Auth profile
            if (auth.currentUser.displayName !== values.preferredName) {
                await updateProfile(auth.currentUser, { displayName: values.preferredName });
            }
            
            // Update Firestore document
            const userDocRef = doc(db, "users", user.uid);
            await setDoc(userDocRef, {
                name: values.preferredName,
                // Only update the prompt if the user entered something new. Otherwise, keep the existing one.
                customSystemPrompt: values.customSystemPrompt ? values.customSystemPrompt : currentSystemPrompt,
            }, { merge: true });

            toast({
                title: "Settings Saved",
                description: "Your personalization settings have been updated.",
            });
            // Re-fetch the user context to reflect name changes across the app
            // This is handled by the AuthProvider, a page reload would also work.
            window.location.reload(); 
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Save Failed",
                description: error.message,
            });
        } finally {
            setIsSubmitting(false);
        }
    }
    
    const renderForm = () => {
        if (isFormLoading || authLoading) {
            return (
                 <div className="space-y-6">
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                     <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-36 w-full" />
                    </div>
                     <div className="flex justify-end">
                        <Skeleton className="h-10 w-36" />
                    </div>
                </div>
            )
        }
        
        return (
             <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                     <FormField
                        control={form.control}
                        name="preferredName"
                        render={({ field }) => (
                            <FormItem>
                                <Label htmlFor="preferred-name">Preferred Name</Label>
                                <FormControl>
                                    <Input id="preferred-name" placeholder="How should Briefly call you?" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                        />
                         <FormField
                        control={form.control}
                        name="customSystemPrompt"
                        render={({ field }) => (
                            <FormItem>
                                <Label htmlFor="custom-prompt">Custom System Prompt</Label>
                                <FormControl>
                                     <Textarea 
                                        id="custom-prompt" 
                                        placeholder={"Enter a custom system prompt to define Briefly's personality, or leave blank to use the default."}
                                        className="min-h-[250px] font-mono text-sm"
                                        {...field}
                                    />
                                </FormControl>
                                <p className="text-xs text-muted-foreground">
                                    Leave this blank to use the default prompt. Enter new text to overwrite your current one.
                                </p>
                                <FormMessage />
                            </FormItem>
                        )}
                        />
                    <div className="flex justify-end">
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                            Save Changes
                        </Button>
                    </div>
                </form>
            </Form>
        );
    };

    return (
        <DashboardLayout>
            <main className="flex-1 p-4 md:p-8">
                <div className="w-full max-w-2xl mx-auto">
                    <div className="mb-10">
                        <h1 className="text-4xl font-bold">Personalize Briefly</h1>
                        <p className="mt-2 text-lg text-muted-foreground">
                            Customize your experience and teach Briefly how to respond to you.
                        </p>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Sparkles className="h-6 w-6 text-primary" />
                                Interaction Settings
                            </CardTitle>
                            <CardDescription>
                                These settings will influence how Briefly addresses you and generates responses.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                           {renderForm()}
                        </CardContent>
                    </Card>
                </div>
            </main>
        </DashboardLayout>
    );
}
