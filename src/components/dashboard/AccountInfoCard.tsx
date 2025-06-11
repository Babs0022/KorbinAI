
"use client";

import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/shared/GlassCard';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { UserCircle, Edit3, Loader2, BadgeInfo } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

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
            <Badge variant="secondary" className="mt-2 flex items-center gap-1">
             <BadgeInfo className="h-3 w-3"/> Basic Plan
            </Badge>
          </div>
        </div>
        <div className="mt-4 space-y-2 text-sm">
          <p className="text-xs text-muted-foreground">
            Prompt usage and limits will be displayed here with an active subscription.
          </p>
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
