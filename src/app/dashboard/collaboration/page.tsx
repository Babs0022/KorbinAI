
"use client";

import React, { useState, useEffect, useCallback, useMemo, type FormEvent } from 'react';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { MinimalFooter } from '@/components/layout/MinimalFooter';
import Container from '@/components/layout/Container';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users, Shield, PlusCircle, Search, Loader2, Send, Edit, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle, GlassCardDescription } from '@/components/shared/GlassCard';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import {
  doc,
  setDoc,
  getDoc,
  addDoc,
  collection,
  query,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  Timestamp,
  deleteDoc,
} from 'firebase/firestore';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from '@/components/ui/textarea';
import type { PromptHistory } from '@/components/dashboard/PromptHistoryItem';

interface TeamMember {
  uid: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  displayName?: string;
  photoURL?: string;
}

interface Team {
  id: string;
  name: string;
  ownerId: string;
  members: Record<string, TeamMember>; // Changed to a map
}

export default function CollaborationPage() {
  const { currentUser, teamId, teamRole, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [team, setTeam] = useState<Team | null>(null);
  const [sharedPrompts, setSharedPrompts] = useState<PromptHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [showCreateTeamDialog, setShowCreateTeamDialog] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);

  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'editor' | 'viewer'>('viewer');
  const [isInviting, setIsInviting] = useState(false);
  
  const [showNewPromptDialog, setShowNewPromptDialog] = useState(false);
  const [newPromptName, setNewPromptName] = useState('');
  const [newPromptGoal, setNewPromptGoal] = useState('');
  const [isCreatingPrompt, setIsCreatingPrompt] = useState(false);

  const canManageTeam = useMemo(() => teamRole === 'admin', [teamRole]);
  const canEditPrompts = useMemo(() => teamRole === 'admin' || teamRole === 'editor', [teamRole]);

  // Fetch team details and listen for real-time updates on prompts
  useEffect(() => {
    if (authLoading) return;
    if (!currentUser) {
      router.push('/login');
      return;
    }

    if (teamId) {
      setIsLoading(true);
      const teamDocRef = doc(db, 'teams', teamId);
      const teamUnsubscribe = onSnapshot(teamDocRef, (docSnap) => {
        if (docSnap.exists()) {
          setTeam({ id: docSnap.id, ...docSnap.data() } as Team);
        } else {
          setTeam(null);
          toast({ title: "Team not found", description: "The team associated with your account could not be found.", variant: "destructive" });
        }
        setIsLoading(false);
      });
      
      const promptsQuery = query(collection(db, 'teams', teamId, 'sharedPrompts'), orderBy('timestamp', 'desc'));
      const promptsUnsubscribe = onSnapshot(promptsQuery, (querySnapshot) => {
        const fetchedPrompts = querySnapshot.docs.map(docSnap => {
           const data = docSnap.data();
           let timestampStr = new Date().toISOString();
           if (data.timestamp instanceof Timestamp) {
               timestampStr = data.timestamp.toDate().toISOString();
           }
           return {
             id: docSnap.id,
             name: data.name || 'Untitled',
             goal: data.goal || '',
             optimizedPrompt: data.optimizedPrompt || '',
             timestamp: timestampStr,
             tags: data.tags || [],
           } as PromptHistory;
        });
        setSharedPrompts(fetchedPrompts);
      });

      return () => {
        teamUnsubscribe();
        promptsUnsubscribe();
      };
    } else {
      setIsLoading(false);
      setTeam(null);
    }
  }, [currentUser, teamId, authLoading, router, toast]);

  const handleCreateTeam = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentUser || !newTeamName.trim()) return;

    setIsCreatingTeam(true);
    try {
      const newTeamRef = doc(collection(db, 'teams'));
      const newTeamData = {
        name: newTeamName,
        ownerId: currentUser.uid,
        createdAt: serverTimestamp(),
        members: {
            [currentUser.uid]: {
                uid: currentUser.uid,
                email: currentUser.email,
                role: 'admin',
                displayName: currentUser.displayName,
                photoURL: currentUser.photoURL,
            }
        }
      };
      await setDoc(newTeamRef, newTeamData);

      const userDocRef = doc(db, 'users', currentUser.uid);
      // Use set with merge to safely create or update the document.
      await setDoc(userDocRef, { teamId: newTeamRef.id }, { merge: true });

      toast({ title: "Team Created!", description: `Welcome to ${newTeamName}!` });
      setShowCreateTeamDialog(false);
      setNewTeamName('');
    } catch (error) {
      console.error("Error creating team:", error);
      toast({ title: "Error", description: "Could not create team. Please try again.", variant: "destructive" });
    } finally {
      setIsCreatingTeam(false);
    }
  };

  const handleInviteMember = async (e: FormEvent) => {
    e.preventDefault();
    // This functionality is complex and requires a backend or Cloud Function to securely
    // map an email to a UID. For now, this is a placeholder.
    toast({
        title: "Feature In Development",
        description: "Inviting members by email is coming soon in a future update!",
        variant: "default"
    });
    setShowInviteDialog(false);
  };

  const handleCreateSharedPrompt = async (e: FormEvent) => {
    e.preventDefault();
    if (!team || !newPromptName.trim() || !newPromptGoal.trim()) return;

    setIsCreatingPrompt(true);
    try {
      const promptsColRef = collection(db, 'teams', team.id, 'sharedPrompts');
      await addDoc(promptsColRef, {
        name: newPromptName,
        goal: newPromptGoal,
        optimizedPrompt: `As a ${newPromptGoal}, I need to... (Start refining here)`, // Basic prompt
        tags: ['new', 'shared'],
        createdBy: currentUser?.uid,
        timestamp: serverTimestamp(),
      });
      toast({ title: "Shared Prompt Created!", description: `"${newPromptName}" is now available to the team.` });
      setShowNewPromptDialog(false);
      setNewPromptName('');
      setNewPromptGoal('');
    } catch (error) {
      console.error("Error creating shared prompt:", error);
      toast({ title: "Error", description: "Could not create shared prompt. Please try again.", variant: "destructive" });
    } finally {
      setIsCreatingPrompt(false);
    }
  };
  
  const handleDeletePrompt = async (promptId: string) => {
      if (!team || !canEditPrompts) return;
      try {
          await deleteDoc(doc(db, 'teams', team.id, 'sharedPrompts', promptId));
          toast({title: "Prompt Deleted", description: "The shared prompt has been removed."});
      } catch (error) {
          console.error("Error deleting shared prompt: ", error);
          toast({title: "Error", description: "Could not delete shared prompt.", variant: "destructive"});
      }
  };


  if (isLoading || authLoading) {
    return <div className="flex h-screen w-screen items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }

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

          {!team ? (
            <GlassCard className="text-center py-16">
              <GlassCardHeader>
                <GlassCardTitle className="font-headline text-3xl flex items-center justify-center">
                  <Users className="mr-3 h-8 w-8 text-primary" />
                  Team Collaboration Hub
                </GlassCardTitle>
                <GlassCardDescription className="mt-2 text-lg">
                  Create a team to share prompts and collaborate in real-time.
                </GlassCardDescription>
              </GlassCardHeader>
              <GlassCardContent>
                <Dialog open={showCreateTeamDialog} onOpenChange={setShowCreateTeamDialog}>
                    <DialogTrigger asChild>
                        <Button size="lg"><PlusCircle className="mr-2 h-5 w-5" />Create Your Team</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create a New Team</DialogTitle>
                            <DialogDescription>Give your team a name to get started.</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleCreateTeam}>
                            <div className="py-4">
                                <Label htmlFor="teamName">Team Name</Label>
                                <Input id="teamName" value={newTeamName} onChange={(e) => setNewTeamName(e.target.value)} placeholder="e.g., Marketing Crew" required />
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={isCreatingTeam}>
                                    {isCreatingTeam ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                                    Create Team
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
              </GlassCardContent>
            </GlassCard>
          ) : (
            <>
              <GlassCard className="mb-8">
                <GlassCardHeader>
                  <GlassCardTitle className="font-headline text-3xl flex items-center">
                    <Users className="mr-3 h-8 w-8 text-primary" />
                    {team.name}
                  </GlassCardTitle>
                  <GlassCardDescription className="mt-2 text-lg">
                    A shared workspace to create, manage, and refine prompts as a team.
                  </GlassCardDescription>
                </GlassCardHeader>
              </GlassCard>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                  <GlassCard className="h-full">
                    <GlassCardHeader>
                      <div className="flex justify-between items-center">
                        <GlassCardTitle>Shared Prompt Vault</GlassCardTitle>
                        {canEditPrompts && (
                          <Dialog open={showNewPromptDialog} onOpenChange={setShowNewPromptDialog}>
                            <DialogTrigger asChild>
                                <Button size="sm"><PlusCircle className="mr-2 h-4 w-4" />New Shared Prompt</Button>
                            </DialogTrigger>
                             <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Create New Shared Prompt</DialogTitle>
                                    <DialogDescription>This prompt will be visible to your entire team.</DialogDescription>
                                </DialogHeader>
                                <form onSubmit={handleCreateSharedPrompt} className="space-y-4 py-4">
                                    <div>
                                        <Label htmlFor="newPromptName">Prompt Name</Label>
                                        <Input id="newPromptName" value={newPromptName} onChange={e => setNewPromptName(e.target.value)} required />
                                    </div>
                                    <div>
                                        <Label htmlFor="newPromptGoal">Prompt Goal</Label>
                                        <Textarea id="newPromptGoal" value={newPromptGoal} onChange={e => setNewPromptGoal(e.target.value)} required />
                                    </div>
                                    <DialogFooter>
                                        <Button type="submit" disabled={isCreatingPrompt}>
                                            {isCreatingPrompt ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                            Create Prompt
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                          </Dialog>
                        )}
                      </div>
                    </GlassCardHeader>
                    <GlassCardContent>
                      <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                        {sharedPrompts.length > 0 ? sharedPrompts.map(prompt => (
                          <GlassCard key={prompt.id} className="p-4 bg-muted/30 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="font-semibold text-md text-foreground">{prompt.name}</h4>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      Last updated: {new Date(prompt.timestamp).toLocaleDateString()}
                                    </p>
                                </div>
                                {canEditPrompts && (
                                    <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 h-8 w-8" onClick={() => handleDeletePrompt(prompt.id)}>
                                        <Trash2 className="h-4 w-4"/>
                                    </Button>
                                )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{prompt.goal}</p>
                          </GlassCard>
                        )) : (
                            <div className="text-center py-10">
                                <p className="text-muted-foreground">No shared prompts yet.</p>
                                {canEditPrompts && <p className="text-xs text-muted-foreground">Click "New Shared Prompt" to add one.</p>}
                            </div>
                        )}
                      </div>
                    </GlassCardContent>
                  </GlassCard>
                </div>
                <div className="lg:col-span-1">
                  <GlassCard>
                    <GlassCardHeader>
                      <div className="flex justify-between items-center">
                        <GlassCardTitle>Team Members</GlassCardTitle>
                         {canManageTeam && (
                             <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
                                <DialogTrigger asChild>
                                    <Button variant="outline" size="sm">Invite</Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Invite New Member</DialogTitle>
                                        <DialogDescription>Enter the email and select a role for the new member.</DialogDescription>
                                    </DialogHeader>
                                    <form onSubmit={handleInviteMember} className="space-y-4 py-4">
                                        <div>
                                            <Label htmlFor="inviteEmail">Email Address</Label>
                                            <Input id="inviteEmail" type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} required />
                                        </div>
                                        <div>
                                            <Label htmlFor="inviteRole">Role</Label>
                                            <Select onValueChange={(value: 'editor' | 'viewer') => setInviteRole(value)} defaultValue={inviteRole}>
                                                <SelectTrigger id="inviteRole"><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="editor">Editor</SelectItem>
                                                    <SelectItem value="viewer">Viewer</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <DialogFooter>
                                            <Button type="submit" disabled={isInviting}>
                                                {isInviting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                                Send Invite
                                            </Button>
                                        </DialogFooter>
                                    </form>
                                </DialogContent>
                             </Dialog>
                         )}
                      </div>
                      <GlassCardDescription>Manage roles and permissions.</GlassCardDescription>
                    </GlassCardHeader>
                    <GlassCardContent>
                      <div className="space-y-4">
                        {Object.values(team.members).map((member) => (
                          <div key={member.email} className="flex items-center space-x-3">
                            <Avatar>
                              <AvatarImage src={member.photoURL} alt={member.displayName} data-ai-hint="user avatar" />
                              <AvatarFallback>{member.displayName?.charAt(0) || member.email.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-grow">
                              <p className="text-sm font-medium text-foreground">{member.displayName || member.email}</p>
                              <p className="text-xs text-muted-foreground">{member.email}</p>
                            </div>
                            <Badge variant={member.role === 'admin' ? 'default' : 'outline'} className="flex items-center gap-1">
                              <Shield className="h-3 w-3" />
                              {member.role}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </GlassCardContent>
                  </GlassCard>
                </div>
              </div>
            </>
          )}
        </Container>
      </main>
      <MinimalFooter />
    </div>
  );
}
