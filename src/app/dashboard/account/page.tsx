"use client";

import { useState } from "react";
import Link from 'next/link';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { updateProfile } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { LoaderCircle } from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { auth, db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
});

export default function AccountPage() {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    values: {
      name: user?.displayName || "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user || !auth.currentUser) {
      toast({
        variant: "destructive",
        title: "Not Authenticated",
        description: "You must be logged in to update your profile.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Update Firebase Auth profile
      await updateProfile(auth.currentUser, { displayName: values.name });

      // Update Firestore user document
      const userDocRef = doc(db, "users", user.uid);
      await updateDoc(userDocRef, { name: values.name });

      toast({
        title: "Profile Updated",
        description: "Your name has been successfully updated.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  }
  
  if (loading) {
    return (
        <DashboardLayout>
            <main className="flex flex-1 flex-col p-4 md:p-8">
                <div className="w-full max-w-2xl mx-auto">
                    <Skeleton className="h-8 w-48 mb-2" />
                    <Skeleton className="h-6 w-64 mb-10" />
                    <Card>
                        <CardHeader>
                            <Skeleton className="h-7 w-32" />
                            <Skeleton className="h-5 w-48" />
                        </CardHeader>
                        <CardContent className="space-y-6">
                           <div className="space-y-2">
                             <Skeleton className="h-5 w-16" />
                             <Skeleton className="h-10 w-full" />
                           </div>
                           <div className="space-y-2">
                             <Skeleton className="h-5 w-16" />
                             <Skeleton className="h-10 w-full" />
                           </div>
                           <div className="flex justify-end">
                             <Skeleton className="h-11 w-24" />
                           </div>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </DashboardLayout>
    );
  }

  if (!user) {
    return (
        <DashboardLayout>
            <main className="flex flex-1 items-center justify-center p-4 md:p-8">
                <Card className="w-full max-w-md text-center">
                    <CardHeader>
                        <CardTitle>Access Denied</CardTitle>
                        <CardDescription>You need to be signed in to view this page.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button asChild>
                            <Link href="/login">Sign In</Link>
                        </Button>
                    </CardContent>
                </Card>
            </main>
        </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <main className="flex flex-1 flex-col p-4 md:p-8">
        <div className="w-full max-w-2xl mx-auto">
            <h1 className="text-4xl font-bold">Account Settings</h1>
            <p className="text-muted-foreground mt-2 mb-10">Manage your profile and account information.</p>
            <Card>
                <CardHeader>
                    <CardTitle>Profile Details</CardTitle>
                    <CardDescription>Update your personal information here.</CardDescription>
                </CardHeader>
                <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Full Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="Your full name" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormItem>
                            <FormLabel>Email Address</FormLabel>
                            <FormControl>
                                <Input value={user.email || ""} disabled />
                            </FormControl>
                        </FormItem>
                        <div className="flex justify-end">
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                                Save Changes
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
