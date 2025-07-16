
"use client";

import { useState, useEffect } from "react";
import NextImage from 'next/image';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { updateProfile, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import { doc, updateDoc, getDoc, onSnapshot } from "firebase/firestore";
import { LoaderCircle, User, Key, Image as ImageIcon, CreditCard, Eye, EyeOff } from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { auth, db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

import { SidebarProvider, Sidebar, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import DashboardHeader from "@/components/layout/DashboardHeader";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { UserSubscription } from "@/types/subscription";
import { format } from 'date-fns';
import { Badge } from "@/components/ui/badge";

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

const avatarSeeds = [
  "Leo", "Mia", "Omar", "Sofia", "Kenji",
  "Priya", "Carlos", "Fatima", "Aiden", "Chloe"
];
const avatars = avatarSeeds.map(seed => `https://api.dicebear.com/8.x/avataaars/png?seed=${seed}&size=100`);


export default function AccountManagementPage() {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [isProfileSubmitting, setIsProfileSubmitting] = useState(false);
  const [isPasswordSubmitting, setIsPasswordSubmitting] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState("");
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [isSubscriptionLoading, setIsSubscriptionLoading] = useState(true);
  
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

  useEffect(() => {
    if (user) {
      profileForm.reset({ name: user.displayName || "" });
      const currentAvatar = user.photoURL;
      if (currentAvatar && avatars.includes(currentAvatar)) {
        setSelectedAvatar(currentAvatar);
      } else {
        setSelectedAvatar(avatars[0]);
      }

      setIsSubscriptionLoading(true);
      const subDocRef = doc(db, "userSubscriptions", user.uid);
      const unsubscribe = onSnapshot(subDocRef, (docSnap) => {
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

      return () => unsubscribe();
    }
  }, [user, profileForm]);

  async function onProfileSubmit(values: z.infer<typeof profileFormSchema>) {
    if (!user || !auth.currentUser) return;
    setIsProfileSubmitting(true);
    try {
      await updateProfile(auth.currentUser, { displayName: values.name, photoURL: selectedAvatar });
      const userDocRef = doc(db, "users", user.uid);
      await updateDoc(userDocRef, { name: values.name, photoURL: selectedAvatar });
      toast({ title: "Profile Updated", description: "Your profile has been successfully updated." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Update Failed", description: error.message });
    } finally {
      setIsProfileSubmitting(false);
    }
  }
  
  async function onPasswordSubmit(values: z.infer<typeof passwordFormSchema>) {
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
          <h1 className="text-3xl font-bold">Account Management</h1>
          <p className="text-muted-foreground mt-2 mb-10">Manage your profile, password, and subscription.</p>

          <div className="space-y-8">
            {/* Profile Information Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><User /> Profile Information</CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...profileForm}>
                  <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-8">
                    <div className="flex flex-col items-center gap-6">
                        <Avatar className="w-24 h-24">
                            <AvatarImage src={selectedAvatar} alt="Selected Avatar" />
                            <AvatarFallback>{user.displayName?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        
                        <div className="w-full space-y-2">
                            <h3 className="text-sm font-medium flex items-center gap-2 text-muted-foreground"><ImageIcon className="w-4 h-4"/> Select an Avatar</h3>
                            <div className="grid grid-cols-4 gap-4 sm:grid-cols-5">
                                {avatars.map((avatarUrl, index) => (
                                    <button type="button" key={index} onClick={() => setSelectedAvatar(avatarUrl)}>
                                        <NextImage 
                                            src={avatarUrl}
                                            width={100}
                                            height={100}
                                            alt={`Avatar ${index + 1}`}
                                            className={cn("rounded-full transition-all", selectedAvatar === avatarUrl ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : 'opacity-70 hover:opacity-100')}
                                            data-ai-hint="person avatar"
                                        />
                                    </button>
                                ))}
                            </div>
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
              </CardContent>
            </Card>

            {/* Change Password Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Key /> Change Password</CardTitle>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>

             {/* Subscription Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><CreditCard /> Subscription</CardTitle>
                 <CardDescription>View your current plan and manage your subscription.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                 {renderSubscriptionStatus()}
                 <div className="relative w-fit">
                    <Button disabled={true}>
                        Manage Subscription
                    </Button>
                    <Badge variant="secondary" className="absolute -top-2 -right-3">Coming Soon</Badge>
                </div>
              </CardContent>
            </Card>
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
