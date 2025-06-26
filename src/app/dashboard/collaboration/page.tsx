
"use client";

import React, { useState } from 'react';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { MinimalFooter } from '@/components/layout/MinimalFooter';
import Container from '@/components/layout/Container';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users, Shield, PlusCircle, Search } from 'lucide-react';
import Link from 'next/link';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle, GlassCardDescription } from '@/components/shared/GlassCard';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

// Mock data for demonstration
const teamMembers = [
  { name: 'You', email: 'you@example.com', role: 'Admin', avatar: 'https://avatar.iran.liara.run/public/1' },
  { name: 'Alex Johnson', email: 'alex@example.com', role: 'Editor', avatar: 'https://avatar.iran.liara.run/public/2' },
  { name: 'Samantha Lee', email: 'samantha@example.com', role: 'Viewer', avatar: 'https://avatar.iran.liara.run/public/3' },
];

const sharedPrompts = [
    { id: 'p1', name: 'Q3 Marketing Campaign Slogans', lastUpdated: '2 days ago', updatedBy: 'Alex Johnson', tags: ['marketing', 'q3', 'slogans'] },
    { id: 'p2', name: 'New Feature Announcement Email', lastUpdated: '5 days ago', updatedBy: 'You', tags: ['email', 'product', 'launch'] },
    { id: 'p3', name: 'Onboarding Documentation Prompts', lastUpdated: '1 week ago', updatedBy: 'Samantha Lee', tags: ['docs', 'onboarding', 'customer-support'] },
];

export default function CollaborationPage() {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardHeader />
      <main className="flex-grow bg-gradient-to-br from-background via-indigo-50/30 to-mint-50/30 py-8">
        <Container>
          <div className="mb-6">
            <Button variant="outline" asChild size="sm">
              <Link href="/dashboard">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Link>
            </Button>
          </div>

          <GlassCard className="mb-8">
            <GlassCardHeader>
              <GlassCardTitle className="font-headline text-3xl flex items-center">
                <Users className="mr-3 h-8 w-8 text-primary" />
                Team Collaboration Hub
              </GlassCardTitle>
              <GlassCardDescription className="mt-2 text-lg">
                A shared workspace to create, manage, and refine prompts as a team.
              </GlassCardDescription>
            </GlassCardHeader>
          </GlassCard>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main content: Shared Prompt Vault */}
            <div className="lg:col-span-2">
              <GlassCard className="h-full">
                <GlassCardHeader>
                  <GlassCardTitle>Shared Prompt Vault</GlassCardTitle>
                  <div className="flex justify-between items-center mt-2">
                    <div className="relative flex-grow mr-4">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Search shared prompts..."
                            className="pl-10 h-9"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button size="sm">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        New Shared Prompt
                    </Button>
                  </div>
                </GlassCardHeader>
                <GlassCardContent>
                    <div className="space-y-4">
                        {sharedPrompts.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())).map(prompt => (
                            <GlassCard key={prompt.id} className="p-4 bg-muted/30 hover:shadow-md transition-shadow">
                                <h4 className="font-semibold text-md text-foreground">{prompt.name}</h4>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Updated by {prompt.updatedBy} • {prompt.lastUpdated}
                                </p>
                                <div className="mt-2 flex flex-wrap gap-1">
                                    {prompt.tags.map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}
                                </div>
                            </GlassCard>
                        ))}
                    </div>
                </GlassCardContent>
              </GlassCard>
            </div>

            {/* Sidebar: Team Members */}
            <div className="lg:col-span-1">
              <GlassCard>
                <GlassCardHeader>
                  <GlassCardTitle>Team Members</GlassCardTitle>
                  <GlassCardDescription>Manage roles and permissions.</GlassCardDescription>
                </GlassCardHeader>
                <GlassCardContent>
                  <div className="space-y-4">
                    {teamMembers.map((member) => (
                      <div key={member.email} className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarImage src={member.avatar} alt={member.name} data-ai-hint="user avatar"/>
                          <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-grow">
                          <p className="text-sm font-medium text-foreground">{member.name}</p>
                          <p className="text-xs text-muted-foreground">{member.email}</p>
                        </div>
                        <Badge variant={member.role === 'Admin' ? 'default' : 'outline'} className="flex items-center gap-1">
                            <Shield className="h-3 w-3"/>
                            {member.role}
                        </Badge>
                      </div>
                    ))}
                  </div>
                  <Button variant="outline" className="w-full mt-6">
                    Invite Members
                  </Button>
                </GlassCardContent>
              </GlassCard>
            </div>
          </div>

        </Container>
      </main>
      <MinimalFooter />
    </div>
  );
}
