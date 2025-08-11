
"use client";

import { useState, useEffect } from "react";
import NextImage from 'next/image';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { updateProfile, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import { doc, updateDoc, getDoc, onSnapshot } from "firebase/firestore";
import { getStorage, ref, uploadString, getDownloadURL } from "firebase/storage";
import { LoaderCircle, User, Key, Image as ImageIcon, CreditCard, Eye, EyeOff, Upload, CheckCircle, Award } from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { auth, db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { submitVerificationRequest } from "@/services/feedbackService";

import { SidebarProvider, Sidebar, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import DashboardHeader from "@/components/layout/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { UserSubscription } from "@/types/subscription";
import { format } from 'date-fns';
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";

const profileFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
});

const passwordFormSchema = z.object({
  currentPassword: z.string().min(1, { message: "Current password is required." }),
  newPassword: z.string().min(6, { message: "New password must be at least 6 characters." }),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"],
});

const verificationSchema = z.object({
  tweetUrl: z.string().url({ message: "Please enter a valid URL." }),
});

export default function AccountManagementPage() {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [isProfileSubmitting, setIsProfileSubmitting] = useState(false);
  const [isPasswordSubmitting, setIsPasswordSubmitting] = useState(false);
  const [isVerificationSubmitting, setIsVerificationSubmitting] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState("");
  const [customAvatarFile, setCustomAvatarFile] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [isSubscriptionLoading, setIsSubscriptionLoading] = useState(true);
  const [isVerified, setIsVerified] = useState(false);
  
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const profileForm = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    values: { name: user?.displayName || "" },
  });

  const passwordForm = useForm<z.infer<typeof passwordFormSchema>>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const verificationForm = useForm<z.infer<typeof verificationSchema>>({
    resolver: zodResolver(verificationSchema),
    defaultValues: {
      tweetUrl: "",
    },
  });

  useEffect(() => {
    if (user) {
      profileForm.reset({ name: user.displayName || "" });
      setSelectedAvatar(user.photoURL || '');
      
      setIsSubscriptionLoading(true);
      const userDocRef = doc(db, "users", user.uid);
      const subDocRef = doc(db, "userSubscriptions", user.uid);
      
      const unsubscribeUser = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
              setIsVerified(docSnap.data()?.isVerified === true);
          }
      });

      const unsubscribeSub = onSnapshot(subDocRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setSubscription({
            ...data,
            currentPeriodEnd: data.currentPeriodEnd?.toDate(),
            currentPeriodStart: data.currentPeriodStart?.toDate(),
          } as UserSubscription);
        } else {
          setSubscription(null);
        }
        setIsSubscriptionLoading(false);
      });

      return () => {
          unsubscribeUser();
          unsubscribeSub();
      };
    }
  }, [user, profileForm]);

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        toast({
          variant: "destructive",
          title: "File too large",
          description: "Please upload an image smaller than 2MB.",
        });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setCustomAvatarFile(result); // Store the base64 string
        setSelectedAvatar(result); // Show preview
      };
      reader.readAsDataURL(file);
    }
  };


  async function onProfileSubmit(values: z.infer<typeof profileFormSchema>) {
    if (!user || !auth.currentUser) return;
    setIsProfileSubmitting(true);
    let photoURL = selectedAvatar;

    try {
      if (customAvatarFile) {
        const storage = getStorage();
        const storageRef = ref(storage, `avatars/${user.uid}`);
        
        // Upload the base64 string
        const snapshot = await uploadString(storageRef, customAvatarFile, 'data_url');
        photoURL = await getDownloadURL(snapshot.ref);
      }

      await updateProfile(auth.currentUser, { displayName: values.name, photoURL: photoURL });
      const userDocRef = doc(db, "users", user.uid);
      await updateDoc(userDocRef, { name: values.name, photoURL: photoURL });
      toast({ title: "Profile Updated", description: "Your profile has been successfully updated." });
      setCustomAvatarFile(null); // Clear custom file after successful upload
    } catch (error: any) {
      console.error("Profile update error: ", error);
      toast({ variant: "destructive", title: "Update Failed", description: error.message });
    } finally {
      setIsProfileSubmitting(false);
    }
  }
  
  async function onPasswordSubmit(values: z.infer<typeof passwordFormSchema>>) {
    if (!user || !auth.currentUser || !user.email) return;

    setIsPasswordSubmitting(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, values.currentPassword);
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, values.newPassword);
      
      toast({ title: "Password Updated", description: "Your password has been changed successfully." });
      passwordForm.reset();

    } catch (error: any) {
       toast({
        variant: "destructive",
        title: "Password Change Failed",
        description: error.code === 'auth/wrong-password' ? 'The current password you entered is incorrect.' : error.message,
      });
    } finally {
      setIsPasswordSubmitting(false);
    }
  }

  async function onVerificationSubmit(values: z.infer<typeof verificationSchema>>) {
    if (!user) return;
    setIsVerificationSubmitting(true);
    try {
        await submitVerificationRequest({
            userId: user.uid,
            tweetUrl: values.tweetUrl,
        });
        toast({
            title: "Submission Received!",
            description: "Thank you! We will review your submission shortly.",
        });
        verificationForm.reset();
    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Submission Failed",
            description: error.message,
        });
    } finally {
        setIsVerificationSubmitting(false);
    }
  }
  
  const renderSubscriptionStatus = () => {
    if (isSubscriptionLoading) {
      return (
        <div className="space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
        </div>
      );
    }

    if (subscription?.status === 'active') {
      return (
        <div className="space-y-1">
          <p className="font-medium text-foreground">
            Current Plan: <span className="capitalize text-primary">{subscription.planId}</span>
          </p>
          <p className="text-sm text-muted-foreground">
            {subscription.currentPeriodEnd ? `Your plan will renew on ${format(subscription.currentPeriodEnd, 'PPP')}.` : 'Subscription is active.'}
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-1">
        <p className="font-medium text-foreground">Current Plan: <span className="text-muted-foreground">Free</span></p>
        <p className="text-sm text-muted-foreground">Upgrade to a paid plan to unlock more features.</p>
      </div>
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <main className="flex flex-1 flex-col p-4 md:p-8">
            <div className="w-full max-w-2xl mx-auto space-y-10">
                <Skeleton className="h-10 w-72 mb-2" />
                <Skeleton className="h-6 w-96 mb-10" />
                <Skeleton className="h-[400px] w-full" />
                <Skeleton className="h-[400px] w-full" />
            </div>
        </main>
      );
    }
    
    if (!user) {
      return (
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
      )
    }

    return (
      <main className="flex flex-1 flex-col p-4 md:p-8">
        <div className="w-full max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            Account Management 
            {isVerified && <CheckCircle className="h-7 w-7 text-yellow-400" />}
          </h1>
          <p className="text-muted-foreground mt-2 mb-10">Manage your profile, password, and subscription.</p>

          <div className="space-y-12">
            {/* Profile Information Section */}
            <div className="space-y-6">
                <h2 className="text-2xl font-semibold flex items-center gap-3"><User /> Profile Information</h2>
                <Separator />
                <Form {...profileForm}>
                  <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-8">
                    <div className="flex flex-col items-center gap-6">
                        <div className="relative">
                            <Avatar className="w-24 h-24">
                                <AvatarImage src={selectedAvatar} alt="Selected Avatar" />
                                <AvatarFallback>{user.displayName?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <Button asChild variant="outline" size="icon" className="absolute -bottom-2 -right-2 rounded-full">
                                <Label htmlFor="custom-avatar-upload">
                                    <Upload className="h-4 w-4" />
                                    <span className="sr-only">Upload Image</span>
                                    <Input id="custom-avatar-upload" type="file" className="sr-only" accept="image/png, image/jpeg" onChange={handleAvatarFileChange} />
                                </Label>
                            </Button>
                        </div>
                    </div>
                    
                    <FormField
                      control={profileForm.control}
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
                      <p className="text-xs text-muted-foreground pt-1">Email cannot be changed.</p>
                    </FormItem>
                    <div className="flex justify-end">
                      <Button type="submit" disabled={isProfileSubmitting}>
                        {isProfileSubmitting && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                        Save Profile Changes
                      </Button>
                    </div>
                  </form>
                </Form>
            </div>
            
            {/* Verification Section */}
            {!isVerified && (
                <div className="space-y-6">
                    <h2 className="text-2xl font-semibold flex items-center gap-3"><Award /> Get Verified</h2>
                    <p className="text-muted-foreground">Get a golden checkmark on your profile! Just make a post about KorbinAI on X (Twitter) and submit the link below.</p>
                    <Separator />
                    <Form {...verificationForm}>
                        <form onSubmit={verificationForm.handleSubmit(onVerificationSubmit)} className="space-y-4">
                            <FormField
                            control={verificationForm.control}
                            name="tweetUrl"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Tweet URL</FormLabel>
                                <FormControl>
                                    <Input placeholder="https://x.com/your-username/status/..." {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                            <div className="flex justify-end">
                                <Button type="submit" disabled={isVerificationSubmitting}>
                                    {isVerificationSubmitting && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                                    Submit for Review
                                </Button>
                            </div>
                        </form>
                    </Form>
                </div>
            )}

            {/* Change Password Section */}
            <div className="space-y-6">
                <h2 className="text-2xl font-semibold flex items-center gap-3"><Key /> Change Password</h2>
                <Separator />
                <Form {...passwordForm}>
                  <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-6">
                    <FormField
                      control={passwordForm.control}
                      name="currentPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current Password</FormLabel>
                          <div className="relative">
                            <FormControl>
                                <Input type={showCurrentPassword ? "text" : "password"} {...field} />
                            </FormControl>
                            <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground">
                                {showCurrentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <FormField
                      control={passwordForm.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>New Password (min. 6 characters)</FormLabel>
                           <div className="relative">
                            <FormControl>
                                <Input type={showNewPassword ? "text" : "password"} {...field} />
                            </FormControl>
                            <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground">
                                {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <FormField
                      control={passwordForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm New Password</FormLabel>
                           <div className="relative">
                            <FormControl>
                                <Input type={showConfirmPassword ? "text" : "password"} {...field} />
                            </FormControl>
                            <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground">
                                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end">
                      <Button variant="secondary" type="submit" disabled={isPasswordSubmitting}>
                         {isPasswordSubmitting && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                        Update Password
                      </Button>
                    </div>
                  </form>
                </Form>
            </div>

             {/* Subscription Section */}
            <div className="space-y-6">
                <h2 className="text-2xl font-semibold flex items-center gap-3"><CreditCard /> Subscription</h2>
                <p className="text-muted-foreground">View your current plan and manage your subscription.</p>
                <Separator />
                <div className="p-6 rounded-lg border bg-secondary/50 space-y-4">
                 {renderSubscriptionStatus()}
                 <div className="relative w-fit">
                    <Button disabled={true}>
                        Manage Subscription
                    </Button>
                    <Badge variant="secondary" className="absolute -top-2 -right-3">Coming Soon</Badge>
                </div>
                </div>
            </div>
          </div>
        </div>
      </main>
    );
  };
  
  return (
    <SidebarProvider>
        <Sidebar>
            <DashboardHeader variant="sidebar" />
        </Sidebar>
        <SidebarInset>
            <DashboardHeader variant="main" />
            {renderContent()}
        </SidebarInset>
    </SidebarProvider>
  );
}
