
"use client";

import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/shared/GlassCard';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { UserCircle, Edit3, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

// Placeholder data that will eventually come from Firestore
const plan = 'Premium'; // or 'Free', 'Unlimited'
const promptsUsed = 23;
const promptLimit = 50; // or Infinity for unlimited

export function AccountInfoCard() {
  const { currentUser, loading, displayName, displayEmail, avatarUrl, userInitials } = useAuth();

  if (loading) {
    return (
      <GlassCard className="w-full">
        <GlassCardContent className="flex justify-center items-center h-48">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </GlassCardContent>
      </GlassCard>
    );
  }

  if (!currentUser) {
    return (
      <GlassCard className="w-full">
         <GlassCardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <GlassCardTitle className="text-xl font-medium font-headline">My Account</GlassCardTitle>
          <UserCircle className="h-6 w-6 text-muted-foreground" />
        </GlassCardHeader>
        <GlassCardContent>
          <p className="text-muted-foreground">Please log in to view account details.</p>
          <Button asChild className="w-full mt-4"><Link href="/login">Login</Link></Button>
        </GlassCardContent>
      </GlassCard>
    );
  }

  const promptsRemaining = plan === 'Unlimited' ? 'Unlimited' : Math.max(0, promptLimit - promptsUsed);

  return (
    <GlassCard className="w-full">
      <GlassCardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <GlassCardTitle className="text-xl font-medium font-headline">My Account</GlassCardTitle>
        <UserCircle className="h-6 w-6 text-muted-foreground" />
      </GlassCardHeader>
      <GlassCardContent>
        <div className="flex items-center space-x-4 py-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src={avatarUrl} alt={displayName} data-ai-hint="user profile" />
            <AvatarFallback>{userInitials}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-2xl font-semibold font-headline">{displayName}</h3>
            <p className="text-sm text-muted-foreground">{displayEmail}</p>
            <Badge variant={plan === 'Premium' ? 'default' : 'secondary'} className="mt-2 bg-primary text-primary-foreground">
              {plan} Plan
            </Badge>
          </div>
        </div>
        <div className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Prompts Used:</span>
            <span className="font-medium">{promptsUsed}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Prompts Remaining:</span>
            <span className="font-medium">{promptsRemaining}</span>
          </div>
        </div>
        <Button variant="outline" className="mt-6 w-full" asChild>
          <Link href="/dashboard/account">
            <Edit3 className="mr-2 h-4 w-4" /> Manage Account
          </Link>
        </Button>
      </GlassCardContent>
    </GlassCard>
  );
}
