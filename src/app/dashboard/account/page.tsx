"use client";

import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { Footer } from '@/components/layout/Footer';
import Container from '@/components/layout/Container';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle, GlassCardDescription } from '@/components/shared/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Mail, KeyRound, Shield, CreditCard, Trash2 } from 'lucide-react';

// Placeholder user data
const user = {
  name: 'Babs',
  email: 'babs@example.com',
  avatarUrl: 'https://placehold.co/100x100.png',
  plan: 'Premium',
};
const userInitials = user.name.split(" ").map(n => n[0]).join("").toUpperCase() || "U";

export default function AccountPage() {
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
                <GlassCardContent className="space-y-6">
                  <div className="flex flex-col items-center space-y-4">
                    <Avatar className="h-24 w-24">
                      <AvatarImage src={user.avatarUrl} alt={user.name} data-ai-hint="user profile large"/>
                      <AvatarFallback>{userInitials}</AvatarFallback>
                    </Avatar>
                    <Button variant="outline" size="sm">Change Avatar</Button>
                  </div>
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" defaultValue={user.name} className="mt-1"/>
                  </div>
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" type="email" defaultValue={user.email} disabled className="mt-1"/>
                    <p className="text-xs text-muted-foreground mt-1">Email cannot be changed.</p>
                  </div>
                  <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">Save Profile Changes</Button>
                </GlassCardContent>
              </GlassCard>
            </div>

            <div className="md:col-span-2 space-y-8">
              <GlassCard>
                <GlassCardHeader>
                  <GlassCardTitle className="flex items-center"><KeyRound className="mr-2 h-5 w-5"/> Change Password</GlassCardTitle>
                </GlassCardHeader>
                <GlassCardContent className="space-y-4">
                    <div>
                        <Label htmlFor="currentPassword">Current Password</Label>
                        <Input id="currentPassword" type="password" className="mt-1"/>
                    </div>
                    <div>
                        <Label htmlFor="newPassword">New Password</Label>
                        <Input id="newPassword" type="password" className="mt-1"/>
                    </div>
                    <div>
                        <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
                        <Input id="confirmNewPassword" type="password" className="mt-1"/>
                    </div>
                    <Button variant="outline" className="w-full">Update Password</Button>
                </GlassCardContent>
              </GlassCard>

              <GlassCard>
                <GlassCardHeader>
                  <GlassCardTitle className="flex items-center"><CreditCard className="mr-2 h-5 w-5"/> Subscription</GlassCardTitle>
                  <GlassCardDescription>Manage your BrieflyAI plan.</GlassCardDescription>
                </GlassCardHeader>
                <GlassCardContent>
                  <p className="text-sm">Current Plan: <span className="font-semibold text-primary">{user.plan}</span></p>
                  {/* Add details like next billing date, usage, etc. */}
                  <div className="mt-4 flex gap-2">
                    <Button variant="outline">Change Plan</Button>
                    {user.plan !== 'Free' && <Button variant="ghost">Cancel Subscription</Button>}
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
                  <Button variant="destructive" className="w-full">Delete My Account</Button>
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
