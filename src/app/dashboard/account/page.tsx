
"use client";

import React, { useState, useEffect, type FormEvent } from 'react';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { Footer } from '@/components/layout/Footer';
import Container from '@/components/layout/Container';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle, GlassCardDescription } from '@/components/shared/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Mail, KeyRound, CreditCard, Trash2, Loader2, ShieldAlert, Info, UploadCloud } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { auth, storage } from '@/lib/firebase';
import { updateProfile, updatePassword, EmailAuthProvider, reauthenticateWithCredential, deleteUser } from 'firebase/auth';
import { ref as storageRef, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function AccountPage() {
  const authContext = useAuth();
  const { currentUser, loading } = authContext;
  const router = useRouter();
  const { toast } = useToast();

  const [newDisplayName, setNewDisplayName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [reAuthPassword, setReAuthPassword] = useState('');

  useEffect(() => {
    if (!loading && !currentUser) {
      router.push('/login');
    } else if (currentUser) {
      setNewDisplayName(authContext.displayName || '');
    }
  }, [currentUser, loading, router, authContext.displayName]);

  // Cleanup for imagePreview object URL
  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (imagePreview) { // Revoke old preview if one exists
        URL.revokeObjectURL(imagePreview);
    }
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({ title: "File Too Large", description: "Please select an image smaller than 5MB.", variant: "destructive" });
        setSelectedFile(null);
        setImagePreview(null);
        e.target.value = ""; // Reset file input
        return;
      }
      setSelectedFile(file);
      setImagePreview(URL.createObjectURL(file));
    } else {
      setSelectedFile(null);
      setImagePreview(null);
    }
  };

  const handleSaveProfile = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setIsSavingProfile(true);
    
    let finalPhotoURL = authContext.avatarUrl; // Start with current or default from context

    try {
      if (selectedFile) {
        setIsUploading(true);
        const fileRef = storageRef(storage, `avatars/${currentUser.uid}/${Date.now()}_${selectedFile.name}`);
        const uploadTaskSnapshot = await uploadBytesResumable(fileRef, selectedFile);
        finalPhotoURL = await getDownloadURL(uploadTaskSnapshot.ref);
        setIsUploading(false);
        setSelectedFile(null); 
      }

      const profileUpdates: { displayName?: string; photoURL?: string } = {};
      let profileChanged = false;

      if (newDisplayName !== (currentUser.displayName || '')) {
        profileUpdates.displayName = newDisplayName;
        profileChanged = true;
      }

      // Only update photoURL if a new one was uploaded and it's different or if the original was the placeholder
      if (finalPhotoURL !== authContext.avatarUrl && finalPhotoURL !== "https://placehold.co/40x40.png") {
          profileUpdates.photoURL = finalPhotoURL;
          profileChanged = true;
      } else if (selectedFile && finalPhotoURL === "https://placehold.co/40x40.png") { // case where default placeholder was there and new image uploaded
          profileUpdates.photoURL = finalPhotoURL;
          profileChanged = true;
      }


      if (profileChanged) {
        await updateProfile(currentUser, profileUpdates);
        toast({ title: "Profile Updated", description: "Your profile has been successfully updated." });
        if (imagePreview && finalPhotoURL !== authContext.avatarUrl) { // if a new image was processed
             URL.revokeObjectURL(imagePreview); // Clean up the local preview
             setImagePreview(null); // Reset preview state
        }
      } else if (!selectedFile) { // if no file selected and name didn't change
        toast({ title: "No Changes", description: "No changes were made to your profile." });
      } else if (selectedFile && !profileChanged) { // if file was selected but something prevented an update (e.g. name was same)
         toast({ title: "Profile Updated", description: "Your profile picture has been updated." });
         if (imagePreview) { URL.revokeObjectURL(imagePreview); setImagePreview(null); }
      }
      
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast({ title: "Error Updating Profile", description: error.message, variant: "destructive" });
      setIsUploading(false); 
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleUpdatePassword = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (newPassword !== confirmNewPassword) {
      toast({ title: "Passwords Mismatch", description: "New passwords do not match.", variant: "destructive" });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: "Password Too Short", description: "New password must be at least 6 characters.", variant: "destructive" });
      return;
    }

    setIsUpdatingPassword(true);
    try {
      if (currentUser.providerData.some(p => p.providerId === EmailAuthProvider.PROVIDER_ID) && !currentPassword) {
         toast({ title: "Current Password Required", description: "Please enter your current password to change it.", variant: "destructive" });
         setIsUpdatingPassword(false);
         return;
      }
      
      if (currentUser.providerData.some(p => p.providerId === EmailAuthProvider.PROVIDER_ID)) {
        const credential = EmailAuthProvider.credential(currentUser.email!, currentPassword);
        await reauthenticateWithCredential(currentUser, credential);
      }
      await updatePassword(currentUser, newPassword);
      toast({ title: "Password Updated", description: "Your password has been successfully updated." });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (error: any)
     {
      console.error("Error updating password:", error);
      let description = "Could not update password. Please try again.";
      if (error.code === 'auth/wrong-password') {
        description = "Incorrect current password. Please try again.";
      } else if (error.code === 'auth/requires-recent-login') {
        description = "This action requires a recent login. Please log out and log back in to update your password.";
      }
      toast({ title: "Error Updating Password", description, variant: "destructive" });
    } finally {
      setIsUpdatingPassword(false);
    }
  };
  
  const triggerDeleteConfirmation = () => {
    setShowDeleteConfirm(true);
  };

  const handleDeleteAccount = async () => {
     if (!currentUser) return;
     setIsDeletingAccount(true);

    try {
      if (currentUser.providerData.some(p => p.providerId === EmailAuthProvider.PROVIDER_ID)) {
        if (!reAuthPassword) {
          toast({ title: "Password Required", description: "Please enter your password to confirm account deletion.", variant: "destructive"});
          setIsDeletingAccount(false);
          return;
        }
        const credential = EmailAuthProvider.credential(currentUser.email!, reAuthPassword);
        await reauthenticateWithCredential(currentUser, credential);
      }
      
      await deleteUser(currentUser);
      toast({ title: "Account Deleted", description: "Your account has been permanently deleted." });
      router.push('/login'); 
    } catch (error: any) {
      console.error("Error deleting account:", error);
      let description = "Could not delete account. Please try again.";
       if (error.code === 'auth/wrong-password') {
        description = "Incorrect password. Account not deleted.";
      } else if (error.code === 'auth/requires-recent-login') {
        description = "This action requires a recent login. Please log out and log back in to delete your account.";
      }
      toast({ title: "Error Deleting Account", description, variant: "destructive" });
      setIsDeletingAccount(false);
      setShowDeleteConfirm(false); 
      setReAuthPassword('');
    } 
  };


  if (loading || !currentUser) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading account details...</p>
      </div>
    );
  }
  
  const isEmailPasswordUser = currentUser.providerData.some(p => p.providerId === EmailAuthProvider.PROVIDER_ID);

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardHeader />
      <main className="flex-grow bg-gradient-to-br from-background via-indigo-50/30 to-mint-50/30 py-8">
        <Container>
          <h1 className="font-headline text-3xl font-bold text-foreground mb-8">Account Management</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-1">
              <GlassCard>
                <GlassCardHeader>
                  <GlassCardTitle className="flex items-center"><User className="mr-2 h-5 w-5"/> Profile Information</GlassCardTitle>
                </GlassCardHeader>
                <GlassCardContent>
                  <form onSubmit={handleSaveProfile} className="space-y-6">
                    <div className="flex flex-col items-center space-y-4">
                      <Avatar className="h-24 w-24">
                        <AvatarImage src={imagePreview || authContext.avatarUrl} alt={newDisplayName || authContext.displayName} data-ai-hint="user profile large"/>
                        <AvatarFallback>{authContext.userInitials}</AvatarFallback>
                      </Avatar>
                       <div className="w-full">
                        <Label htmlFor="avatarFile" className="mb-1 flex items-center text-sm font-medium text-foreground">
                          <UploadCloud className="mr-2 h-4 w-4" /> Change Avatar (max 5MB)
                        </Label>
                        <Input 
                          id="avatarFile" 
                          type="file" 
                          accept="image/*" 
                          onChange={handleFileChange} 
                          className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                          disabled={isSavingProfile || isUploading}
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="name">Full Name</Label>
                      <Input 
                        id="name" 
                        value={newDisplayName} 
                        onChange={(e) => setNewDisplayName(e.target.value)} 
                        className="mt-1"
                        disabled={isSavingProfile}
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email Address</Label>
                      <Input id="email" type="email" value={authContext.displayEmail} disabled className="mt-1"/>
                      <p className="text-xs text-muted-foreground mt-1">Email cannot be changed.</p>
                    </div>
                    <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90" disabled={isSavingProfile || isUploading}>
                      {isUploading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...</> : isSavingProfile ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : "Save Profile Changes"}
                    </Button>
                  </form>
                </GlassCardContent>
              </GlassCard>
            </div>

            <div className="md:col-span-2 space-y-8">
              {isEmailPasswordUser ? (
                <GlassCard>
                  <GlassCardHeader>
                    <GlassCardTitle className="flex items-center"><KeyRound className="mr-2 h-5 w-5"/> Change Password</GlassCardTitle>
                  </GlassCardHeader>
                  <GlassCardContent>
                    <form onSubmit={handleUpdatePassword} className="space-y-4">
                      <div>
                          <Label htmlFor="currentPassword">Current Password</Label>
                          <Input id="currentPassword" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="mt-1" required/>
                      </div>
                      <div>
                          <Label htmlFor="newPassword">New Password (min. 6 characters)</Label>
                          <Input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="mt-1" required/>
                      </div>
                      <div>
                          <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
                          <Input id="confirmNewPassword" type="password" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} className="mt-1" required/>
                      </div>
                      <Button type="submit" variant="outline" className="w-full" disabled={isUpdatingPassword}>
                         {isUpdatingPassword ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...</> : "Update Password"}
                      </Button>
                    </form>
                  </GlassCardContent>
                </GlassCard>
              ) : (
                <GlassCard>
                  <GlassCardHeader>
                    <GlassCardTitle className="flex items-center"><KeyRound className="mr-2 h-5 w-5"/> Change Password</GlassCardTitle>
                  </GlassCardHeader>
                  <GlassCardContent>
                    <div className="flex items-start space-x-2 rounded-lg border border-blue-500/30 bg-blue-500/10 p-3 text-sm text-blue-700 dark:text-blue-300">
                        <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <p>Password changes are managed through your social login provider (e.g., Google).</p>
                    </div>
                  </GlassCardContent>
                </GlassCard>
              )}


              <GlassCard>
                <GlassCardHeader>
                  <GlassCardTitle className="flex items-center"><CreditCard className="mr-2 h-5 w-5"/> Subscription</GlassCardTitle>
                  <GlassCardDescription>Manage your BrieflyAI plan.</GlassCardDescription>
                </GlassCardHeader>
                <GlassCardContent>
                  <p className="text-sm">Current Plan: <span className="font-semibold text-primary">Basic Plan</span></p>
                  <p className="text-xs text-muted-foreground mt-1">Full subscription management coming soon!</p>
                  <div className="mt-4 flex gap-2">
                    <Button variant="outline" disabled>Change Plan</Button>
                    <Button variant="ghost" disabled>Cancel Subscription</Button>
                  </div>
                </GlassCardContent>
              </GlassCard>

              <GlassCard className="border-destructive/50">
                <GlassCardHeader>
                  <GlassCardTitle className="flex items-center text-destructive"><Trash2 className="mr-2 h-5 w-5"/> Delete Account</GlassCardTitle>
                </GlassCardHeader>
                <GlassCardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Permanently delete your BrieflyAI account and all associated data. This action cannot be undone.
                  </p>
                  <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" className="w-full" onClick={triggerDeleteConfirmation} disabled={isDeletingAccount}>
                        Delete My Account
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete your account and remove your data from our servers.
                          {isEmailPasswordUser && " Please enter your password to confirm."}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      {isEmailPasswordUser && (
                        <div className="space-y-2 py-2">
                          <Label htmlFor="reAuthPasswordForDelete" className="sr-only">Password</Label>
                          <Input 
                            id="reAuthPasswordForDelete" 
                            type="password"
                            placeholder="Enter your password" 
                            value={reAuthPassword}
                            onChange={(e) => setReAuthPassword(e.target.value)}
                          />
                        </div>
                      )}
                      <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => {setShowDeleteConfirm(false); setReAuthPassword('');}} disabled={isDeletingAccount}>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={handleDeleteAccount} 
                          disabled={isDeletingAccount || (isEmailPasswordUser && !reAuthPassword)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {isDeletingAccount ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting...</> : "Yes, delete my account"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  {!isEmailPasswordUser && (
                    <div className="mt-3 flex items-start space-x-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-300">
                        <ShieldAlert className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <p>If you signed up using a social provider, you may need to re-authenticate with them to complete this action.</p>
                    </div>
                  )}
                </GlassCardContent>
              </GlassCard>
            </div>
          </div>
        </Container>
      </main>
      <Footer />
    </div>
  );
}
