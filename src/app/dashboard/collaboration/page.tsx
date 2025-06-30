"use client";

import React, { useState, useEffect, useCallback, useMemo, type FormEvent, useRef } from 'react';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { MinimalFooter } from '@/components/layout/MinimalFooter';
import Container from '@/components/layout/Container';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users, Shield, PlusCircle, Loader2, Trash2, Settings, Eye, User, Tag, Copy, Send, Lock } from 'lucide-react';
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
  addDoc,
  collection,
  query,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  Timestamp,
  deleteDoc,
  orderBy,
  deleteField,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from '@/components/ui/textarea';
import type { PromptHistory } from '@/components/dashboard/PromptHistoryItem';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

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
  members: Record<string, TeamMember>;
}

interface ChatMessage {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  senderPhotoURL?: string;
  timestamp: Timestamp;
}

export default function CollaborationPage() {
  const { currentUser, teamId, teamRole, loading: authLoading, displayName, avatarUrl, subscription, subscriptionLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [team, setTeam] = useState<Team | null>(null);
  const [sharedPrompts, setSharedPrompts] = useState<PromptHistory[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [showCreateTeamDialog, setShowCreateTeamDialog] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'editor' | 'viewer'>('viewer');
  const [isInviting, setIsInviting] = useState(false);
  
  const [showNewPromptDialog, setShowNewPromptDialog] = useState(false);
  const [newPromptName, setNewPromptName] = useState('');
  const [newPromptGoal, setNewPromptGoal] = useState('');
  const [isCreatingPrompt, setIsCreatingPrompt] = useState(false);

  const [showManageTeamDialog, setShowManageTeamDialog] = useState(false);
  const [editableTeamName, setEditableTeamName] = useState('');
  const [isUpdatingTeam, setIsUpdatingTeam] = useState(false);
  const [isUpdatingMember, setIsUpdatingMember] = useState<string | null>(null);
  
  const [viewingSharedPrompt, setViewingSharedPrompt] = useState<PromptHistory | null>(null);
  
  const [newMessage, setNewMessage] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const chatScrollAreaRef = useRef<HTMLDivElement>(null);

  const canManageTeam = useMemo(() => teamRole === 'admin', [teamRole]);
  const canEditPrompts = useMemo(() => teamRole === 'admin' || teamRole === 'editor', [teamRole]);
  const canCreateTeam = useMemo(() => subscription?.planId === 'unlimited', [subscription]);

  useEffect(() => {
    if (chatScrollAreaRef.current) {
        chatScrollAreaRef.current.scrollTo({ top: chatScrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [chatMessages]);

  useEffect(() => {
    if (team) {
      setEditableTeamName(team.name);
    }
  }, [team]);

  useEffect(() => {
    if (authLoading || subscriptionLoading) return;
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
             sharedBy: data.sharedBy || null,
           } as PromptHistory;
        });
        setSharedPrompts(fetchedPrompts);
      });

      const chatQuery = query(collection(db, 'teams', teamId, 'chatMessages'), orderBy('timestamp', 'asc'));
      const chatUnsubscribe = onSnapshot(chatQuery, (querySnapshot) => {
        const fetchedMessages = querySnapshot.docs.map(docSnap => ({
            id: docSnap.id,
            ...docSnap.data()
        } as ChatMessage));
        setChatMessages(fetchedMessages);
      });


      return () => {
        teamUnsubscribe();
        promptsUnsubscribe();
        chatUnsubscribe();
      };
    } else {
      setIsLoading(false);
      setTeam(null);
    }
  }, [currentUser, teamId, authLoading, router, toast, subscriptionLoading]);

  const handleCreateTeam = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentUser || !newTeamName.trim() || !canCreateTeam) return;

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

  const handleUpdateTeamName = async (e: FormEvent) => {
    e.preventDefault();
    if (!team || !canManageTeam || !editableTeamName.trim()) {
      toast({ title: "Error", description: "Invalid team name or insufficient permissions.", variant: "destructive" });
      return;
    }

    setIsUpdatingTeam(true);
    try {
      const teamDocRef = doc(db, 'teams', team.id);
      await updateDoc(teamDocRef, {
        name: editableTeamName.trim()
      });
      toast({ title: "Team Updated", description: "Your team's name has been changed." });
    } catch (error) {
      console.error("Error updating team name:", error);
      toast({ title: "Update Failed", description: "Could not update team name.", variant: "destructive" });
    } finally {
      setIsUpdatingTeam(false);
    }
  };

  const handleInviteMember = async (e: FormEvent) => {
    e.preventDefault();
    toast({
        title: "Feature In Development",
        description: "Inviting members by email is coming soon! This requires a backend service for secure user lookups, which is our next priority.",
        variant: "default",
        duration: 8000
    });
  };

  const handleUpdateMemberRole = async (memberUid: string, newRole: 'editor' | 'viewer') => {
    if (!team || !canManageTeam) return;
    setIsUpdatingMember(memberUid);
    try {
      const teamDocRef = doc(db, 'teams', team.id);
      await updateDoc(teamDocRef, {
        [`members.${memberUid}.role`]: newRole
      });
      toast({ title: "Role Updated", description: `The member's role has been changed to ${newRole}.` });
    } catch (error) {
      toast({ title: "Error", description: "Could not update member role.", variant: "destructive" });
      console.error("Error updating member role:", error);
    } finally {
      setIsUpdatingMember(null);
    }
  };

  const handleRemoveMember = async (memberUid: string) => {
    if (!team || !canManageTeam) return;
    setIsUpdatingMember(memberUid);
    try {
      const teamDocRef = doc(db, 'teams', team.id);
      await updateDoc(teamDocRef, {
        [`members.${memberUid}`]: deleteField()
      });
      // Also need to remove teamId from the user's document
      const userDocRef = doc(db, 'users', memberUid);
      await updateDoc(userDocRef, { teamId: null });

      toast({ title: "Member Removed", description: "The user has been removed from the team." });
    } catch (error) {
      toast({ title: "Error", description: "Could not remove member.", variant: "destructive" });
      console.error("Error removing member:", error);
    } finally {
      setIsUpdatingMember(null);
    }
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
        optimizedPrompt: `As a ${newPromptGoal}, I need to... (Start refining here)`,
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
  
  const handleCopySharedPrompt = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast({ title: "Prompt Copied!", description: "The shared prompt text has been copied." });
  };
  
  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!team || !currentUser || !newMessage.trim()) return;
    
    setIsSendingMessage(true);
    try {
      const chatColRef = collection(db, 'teams', team.id, 'chatMessages');
      await addDoc(chatColRef, {
        text: newMessage.trim(),
        senderId: currentUser.uid,
        senderName: displayName,
        senderPhotoURL: avatarUrl,
        timestamp: serverTimestamp(),
      });
      setNewMessage('');
    } catch (error) {
      console.error("Error sending chat message:", error);
      toast({ title: "Send Error", description: "Could not send message.", variant: "destructive" });
    } finally {
      setIsSendingMessage(false);
    }
  };


  if (isLoading || authLoading || subscriptionLoading) {
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
                {!canCreateTeam ? (
                    <div className="flex flex-col items-center gap-4">
                        <p className="text-muted-foreground">Team creation is an upcoming premium feature.</p>
                        <Button size="lg" asChild className="bg-accent hover:bg-accent/90 text-accent-foreground">
                            <Link href="/#pricing">
                                <Lock className="mr-2 h-4 w-4" /> Learn More About Future Plans
                            </Link>
                        </Button>
                    </div>
                ) : (
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
                )}
              </GlassCardContent>
            </GlassCard>
          ) : (
            <>
              <GlassCard className="mb-8">
                <GlassCardHeader>
                  <div className="flex justify-between items-center flex-wrap gap-2">
                    <GlassCardTitle className="font-headline text-3xl flex items-center">
                      <Users className="mr-3 h-8 w-8 text-primary" />
                      {team.name}
                    </GlassCardTitle>
                    {canManageTeam && (
                      <Dialog open={showManageTeamDialog} onOpenChange={setShowManageTeamDialog}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Settings className="mr-2 h-4 w-4"/> Manage Team
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-xl">
                          <DialogHeader>
                            <DialogTitle>Manage Team</DialogTitle>
                            <DialogDescription>Update settings and manage members for {team.name}.</DialogDescription>
                          </DialogHeader>
                          <Tabs defaultValue="general" className="mt-4">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="general">General</TabsTrigger>
                                <TabsTrigger value="members">Members</TabsTrigger>
                            </TabsList>
                            <TabsContent value="general" className="py-4">
                               <form onSubmit={handleUpdateTeamName} className="space-y-4">
                                  <div>
                                    <Label htmlFor="teamNameManage">Team Name</Label>
                                    <Input id="teamNameManage" value={editableTeamName} onChange={(e) => setEditableTeamName(e.target.value)} required />
                                  </div>
                                  <Button type="submit" disabled={isUpdatingTeam}>
                                    {isUpdatingTeam ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                    Save Changes
                                  </Button>
                                </form>
                            </TabsContent>
                            <TabsContent value="members" className="py-4">
                                <div className="space-y-4">
                                    <h4 className="font-medium">Current Members</h4>
                                    {Object.values(team.members).map(member => (
                                       <div key={member.uid} className="flex items-center justify-between p-2 rounded-md border">
                                          <div className="flex items-center gap-3">
                                              <Avatar>
                                                  <AvatarImage src={member.photoURL} alt={member.displayName} data-ai-hint="user avatar"/>
                                                  <AvatarFallback>{member.displayName?.charAt(0) || '?'}</AvatarFallback>
                                              </Avatar>
                                              <div>
                                                  <p className="text-sm font-medium">{member.displayName}</p>
                                                  <p className="text-xs text-muted-foreground">{member.email}</p>
                                              </div>
                                          </div>
                                          <div className="flex items-center gap-2">
                                             {isUpdatingMember === member.uid ? (
                                                <Loader2 className="h-5 w-5 animate-spin" />
                                             ) : (
                                                <>
                                                    {team.ownerId === member.uid ? (
                                                        <Badge variant="default"><Shield className="h-3 w-3 mr-1"/>Admin</Badge>
                                                    ) : (
                                                        <>
                                                            <Select
                                                                defaultValue={member.role}
                                                                onValueChange={(value: 'editor' | 'viewer') => handleUpdateMemberRole(member.uid, value)}
                                                            >
                                                                <SelectTrigger className="w-[100px] h-8 text-xs"><SelectValue/></SelectTrigger>
                                                                <SelectContent><SelectItem value="editor">Editor</SelectItem><SelectItem value="viewer">Viewer</SelectItem></SelectContent>
                                                            </Select>
                                                            <Button variant="ghost" size="icon" className="text-destructive h-8 w-8" onClick={() => handleRemoveMember(member.uid)}>
                                                                <Trash2 className="h-4 w-4"/>
                                                            </Button>
                                                        </>
                                                    )}
                                                </>
                                             )}
                                          </div>
                                       </div>
                                    ))}
                                </div>
                                <div className="mt-8 border-t pt-4">
                                  <h4 className="font-medium">Invite New Member</h4>
                                   <form onSubmit={handleInviteMember} className="flex items-center gap-2 mt-2">
                                      <Input type="email" placeholder="user@example.com" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} required />
                                      <Select onValueChange={(value: 'editor' | 'viewer') => setInviteRole(value)} defaultValue="viewer">
                                        <SelectTrigger className="w-[120px]"><SelectValue/></SelectTrigger>
                                        <SelectContent><SelectItem value="editor">Editor</SelectItem><SelectItem value="viewer">Viewer</SelectItem></SelectContent>
                                      </Select>
                                      <Button type="submit" disabled={isInviting}>
                                        {isInviting ? <Loader2 className="h-4 w-4 animate-spin"/> : 'Invite'}
                                      </Button>
                                   </form>
                                </div>
                            </TabsContent>
                          </Tabs>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                  <GlassCardDescription className="mt-2 text-lg">
                    A shared workspace to create, manage, and discuss prompts as a team.
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
                                      {prompt.sharedBy?.displayName && <span className="ml-2">by {prompt.sharedBy.displayName}</span>}
                                    </p>
                                </div>
                                <div className="flex items-center flex-shrink-0">
                                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground h-8 w-8" onClick={() => setViewingSharedPrompt(prompt)}>
                                        <Eye className="h-4 w-4"/>
                                    </Button>
                                    {canEditPrompts && (
                                        <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 h-8 w-8" onClick={() => handleDeletePrompt(prompt.id)}>
                                            <Trash2 className="h-4 w-4"/>
                                        </Button>
                                    )}
                                </div>
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
                  <GlassCard className="h-full flex flex-col">
                    <GlassCardHeader>
                        <GlassCardTitle>Team Chat</GlassCardTitle>
                      <GlassCardDescription>Discuss prompts and ideas.</GlassCardDescription>
                    </GlassCardHeader>
                    <GlassCardContent className="flex-grow flex flex-col p-0">
                      <ScrollArea className="flex-grow p-4 space-y-4" ref={chatScrollAreaRef}>
                         {chatMessages.length > 0 ? chatMessages.map(msg => (
                            <div key={msg.id} className={cn("flex items-start gap-2.5", msg.senderId === currentUser?.uid && "justify-end")}>
                                <Avatar className={cn("h-8 w-8", msg.senderId === currentUser?.uid && "order-2")}>
                                    <AvatarImage src={msg.senderPhotoURL} alt={msg.senderName} />
                                    <AvatarFallback>{msg.senderName?.charAt(0) || '?'}</AvatarFallback>
                                </Avatar>
                                <div className={cn("p-2.5 rounded-lg shadow-sm max-w-[80%]", msg.senderId === currentUser?.uid ? "bg-primary text-primary-foreground rounded-br-none" : "bg-muted text-muted-foreground rounded-bl-none")}>
                                    <p className="text-xs font-semibold mb-1">{msg.senderId === currentUser?.uid ? 'You' : msg.senderName}</p>
                                    <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                                </div>
                            </div>
                         )) : (
                             <div className="text-center text-sm text-muted-foreground py-10">
                                No messages yet. Say hello!
                            </div>
                         )}
                      </ScrollArea>
                      <div className="p-4 border-t mt-auto">
                        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                          <Input 
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Type a message..."
                            disabled={isSendingMessage}
                          />
                          <Button type="submit" size="icon" disabled={isSendingMessage || !newMessage.trim()}>
                            {isSendingMessage ? <Loader2 className="h-4 w-4 animate-spin"/> : <Send className="h-4 w-4"/>}
                          </Button>
                        </form>
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

      {viewingSharedPrompt && (
        <Dialog open={!!viewingSharedPrompt} onOpenChange={(isOpen) => { if (!isOpen) setViewingSharedPrompt(null); }}>
          <DialogContent className="sm:max-w-xl max-h-[80vh] flex flex-col">
            <DialogHeader>
              <DialogTitle className="text-2xl font-headline">{viewingSharedPrompt.name}</DialogTitle>
              <DialogDescription>Review the shared prompt details.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4 overflow-y-auto px-1 flex-grow">
              <div>
                <Label htmlFor="viewGoal" className="text-sm font-semibold text-foreground">Original Goal</Label>
                <p id="viewGoal" className="mt-1 text-sm text-muted-foreground p-3 bg-muted/50 rounded-md border whitespace-pre-wrap">
                  {viewingSharedPrompt.goal}
                </p>
              </div>
              <div>
                <Label htmlFor="viewOptimizedPrompt" className="text-sm font-semibold text-foreground">Optimized Prompt</Label>
                <Textarea id="viewOptimizedPrompt" value={viewingSharedPrompt.optimizedPrompt} readOnly rows={10} className="text-sm leading-relaxed font-code bg-muted/50 border whitespace-pre-wrap" />
              </div>
              {viewingSharedPrompt.tags && viewingSharedPrompt.tags.length > 0 && (
                <div>
                  <Label className="text-sm font-semibold text-foreground flex items-center"><Tag className="mr-2 h-4 w-4"/>Tags</Label>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {viewingSharedPrompt.tags.map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}
                  </div>
                </div>
              )}
              {viewingSharedPrompt.sharedBy?.displayName && (
                  <div>
                      <Label className="text-sm font-semibold text-foreground flex items-center"><User className="mr-2 h-4 w-4"/>Shared By</Label>
                      <p className="mt-1 text-sm text-muted-foreground">{viewingSharedPrompt.sharedBy.displayName}</p>
                  </div>
              )}
              <div>
                <Label className="text-sm font-semibold text-foreground">Last Updated</Label>
                <p className="mt-1 text-xs text-muted-foreground">
                  {new Date(viewingSharedPrompt.timestamp).toLocaleString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => handleCopySharedPrompt(viewingSharedPrompt.optimizedPrompt)}><Copy className="mr-2 h-4 w-4" />Copy Prompt</Button>
              <DialogClose asChild><Button variant="outline">Close</Button></DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
