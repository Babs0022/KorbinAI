
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { getPendingVerificationRequests, approveVerificationRequest, denyVerificationRequest, getAllUserReports, getAllUsers } from '@/services/adminService';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { LoaderCircle, CheckCircle, XCircle, ExternalLink, ShieldAlert, MessageCircle, Bug, FileText, BadgeCheck, User, Users, Mail, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow, format } from 'date-fns';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { UserReport } from '@/types/feedback';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import type { AdminUserView } from '@/services/adminService';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface VerificationRequest {
    id: string;
    userId: string;
    tweetUrl: string;
    status: 'pending' | 'approved' | 'denied';
    createdAt: string;
    userName?: string;
    userEmail?: string;
}

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [reports, setReports] = useState<UserReport[]>([]);
  const [users, setUsers] = useState<AdminUserView[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');

  // Check for admin status
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
        setIsAdmin(false);
        setIsLoading(false);
        return;
    }

    const adminRef = doc(db, 'admins', user.uid);
    const unsubscribe = onSnapshot(adminRef, (docSnap) => {
        setIsAdmin(docSnap.exists());
    });
    
    return () => unsubscribe();
  }, [user, authLoading]);
  
  // Fetch data if user is an admin
  useEffect(() => {
      if (isAdmin === true && user) {
          setIsLoading(true);
          Promise.all([
            getPendingVerificationRequests(user.uid),
            getAllUserReports(user.uid),
            getAllUsers(user.uid),
          ]).then(([verificationRequests, userReports, userList]) => {
              setRequests(verificationRequests);
              setReports(userReports);
              setUsers(userList);
          }).catch(err => {
              toast({ variant: 'destructive', title: 'Error', description: err.message });
          }).finally(() => {
              setIsLoading(false);
          });
      } else if (isAdmin === false) {
          setIsLoading(false);
      }
  }, [isAdmin, user, toast]);

  const handleApprove = async (requestUserId: string) => {
    if (!user) return;
    setIsProcessing(requestUserId);
    try {
      await approveVerificationRequest(user.uid, requestUserId);
      toast({ title: 'Request Approved', description: 'User has been verified.' });
      setRequests(prev => prev.filter(r => r.userId !== requestUserId));
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setIsProcessing(null);
    }
  };

  const handleDeny = async (requestUserId: string) => {
    if (!user) return;
    setIsProcessing(requestUserId);
    try {
      await denyVerificationRequest(user.uid, requestUserId);
      toast({ title: 'Request Denied' });
      setRequests(prev => prev.filter(r => r.userId !== requestUserId));
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setIsProcessing(null);
    }
  };
  
  const handleCopyEmails = () => {
    const allEmails = users.map(u => u.email).filter(Boolean).join(', ');
    navigator.clipboard.writeText(allEmails);
    toast({ title: 'Emails Copied', description: 'All user emails have been copied to your clipboard.' });
  };

  const getInitials = (name?: string | null) => {
    if (!name) return "U";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase() || 'U';
  };
  
  const renderContent = () => {
      if (isLoading || isAdmin === null) {
          return (
            <div className="flex items-center justify-center py-16">
              <LoaderCircle className="h-8 w-8 animate-spin" />
            </div>
          )
      }

      if (!isAdmin) {
          return (
            <Card className="mt-8 border-destructive bg-destructive/10">
                <CardHeader className="text-center">
                    <ShieldAlert className="mx-auto h-12 w-12 text-destructive" />
                    <CardTitle className="text-destructive">Access Denied</CardTitle>
                    <CardDescription className="text-destructive/80">You do not have permission to view this page.</CardDescription>
                </CardHeader>
            </Card>
          )
      }

      return (
        <Tabs defaultValue="users" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="users">Users</TabsTrigger>
                <TabsTrigger value="verification">Verification</TabsTrigger>
                <TabsTrigger value="feedback">Feedback/Bugs</TabsTrigger>
                <TabsTrigger value="email">Email</TabsTrigger>
            </TabsList>
            <TabsContent value="users" className="mt-6">
                <Card>
                    <CardHeader>
                        <CardTitle>User Management</CardTitle>
                        <CardDescription>A list of all registered users in the application.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>User</TableHead>
                                    <TableHead>Subscription</TableHead>
                                    <TableHead>Joined</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.length > 0 ? users.map((u) => (
                                    <TableRow key={u.uid}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-10 w-10">
                                                    <AvatarImage src={u.photoURL} alt={u.displayName} />
                                                    <AvatarFallback>{getInitials(u.displayName)}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <div className="font-medium flex items-center gap-1.5">
                                                        {u.displayName || 'No name'}
                                                        {u.isVerified && <BadgeCheck className="h-4 w-4 text-primary" />}
                                                    </div>
                                                    <div className="text-sm text-muted-foreground">{u.email}</div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={u.subscriptionStatus === 'active' ? 'default' : 'secondary'} className="capitalize">
                                                {u.subscriptionPlan}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{format(new Date(u.creationTime), 'PP')}</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm" disabled>View Details</Button>
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center h-24">
                                            No users found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="verification" className="mt-6">
                 <Card>
                    <CardHeader>
                    <CardTitle>Pending Verification Requests</CardTitle>
                    <CardDescription>Review the submissions below to approve or deny verification checkmarks.</CardDescription>
                    </CardHeader>
                    <CardContent>
                    <Table>
                        <TableHeader>
                        <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Submitted</TableHead>
                            <TableHead>Tweet Link</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {requests.length > 0 ? requests.map((req) => (
                            <TableRow key={req.id}>
                            <TableCell>
                                <div className="font-medium">{req.userName}</div>
                                <div className="text-sm text-muted-foreground">{req.userEmail}</div>
                            </TableCell>
                            <TableCell>{formatDistanceToNow(new Date(req.createdAt), { addSuffix: true })}</TableCell>
                            <TableCell>
                                <a href={req.tweetUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                                View Tweet <ExternalLink className="h-3 w-3" />
                                </a>
                            </TableCell>
                            <TableCell className="text-right">
                                <Button
                                variant="ghost"
                                size="sm"
                                className="text-green-500 hover:text-green-500 hover:bg-green-500/10"
                                onClick={() => handleApprove(req.userId)}
                                disabled={isProcessing === req.userId}
                                >
                                {isProcessing === req.userId ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                                <span className="ml-2">Approve</span>
                                </Button>
                                <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-500 hover:text-red-500 hover:bg-red-500/10"
                                onClick={() => handleDeny(req.userId)}
                                disabled={isProcessing === req.userId}
                                >
                                {isProcessing === req.userId ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                                <span className="ml-2">Deny</span>
                                </Button>
                            </TableCell>
                            </TableRow>
                        )) : (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center h-24">
                                    No pending requests. Great job!
                                </TableCell>
                            </TableRow>
                        )}
                        </TableBody>
                    </Table>
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="feedback" className="mt-6">
                <Card>
                    <CardHeader>
                    <CardTitle>User Feedback & Bug Reports</CardTitle>
                    <CardDescription>All user-submitted reports are listed here.</CardDescription>
                    </CardHeader>
                    <CardContent>
                    <Table>
                        <TableHeader>
                        <TableRow>
                            <TableHead>Type</TableHead>
                            <TableHead>Subject</TableHead>
                            <TableHead>User</TableHead>
                            <TableHead>Submitted</TableHead>
                            <TableHead>Attachment</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {reports.length > 0 ? reports.map((report) => (
                            <TableRow key={report.id}>
                            <TableCell>
                                <Badge variant={report.reportType === 'bug' ? 'destructive' : 'secondary'} className="capitalize">
                                    {report.reportType === 'bug' ? <Bug className="mr-2 h-3.5 w-3.5" /> : <MessageCircle className="mr-2 h-3.5 w-3.5" />}
                                    {report.reportType}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                <p className="font-medium truncate max-w-xs">{report.subject}</p>
                                <p className="text-sm text-muted-foreground truncate max-w-xs">{report.message}</p>
                            </TableCell>
                            <TableCell>{report.email}</TableCell>
                            <TableCell>{formatDistanceToNow(new Date(report.createdAt), { addSuffix: true })}</TableCell>
                            <TableCell>
                                {report.attachmentUrl ? (
                                    <a href={report.attachmentUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                                        View <FileText className="h-3 w-3" />
                                    </a>
                                ) : 'None'}
                            </TableCell>
                            </TableRow>
                        )) : (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center h-24">
                                    No user reports have been submitted yet.
                                </TableCell>
                            </TableRow>
                        )}
                        </TableBody>
                    </Table>
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="email" className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2">
                         <Card>
                            <CardHeader>
                                <CardTitle>Draft Email</CardTitle>
                                <CardDescription>Compose an email to send to all users.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="subject">Subject</Label>
                                    <Input id="subject" placeholder="Announcing our new feature!" value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="body">Body</Label>
                                    <Textarea id="body" placeholder="Hi {{user.name}}, we're excited to share..." className="min-h-[300px]" value={emailBody} onChange={(e) => setEmailBody(e.target.value)} />
                                </div>
                                <div className="flex justify-end">
                                    <Button disabled>
                                        Send to {users.length} Users (Coming Soon)
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                    <div>
                        <Card>
                             <CardHeader>
                                <CardTitle>User Emails</CardTitle>
                                <CardDescription>A list of all registered user emails.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Button variant="outline" className="w-full" onClick={handleCopyEmails}>
                                    <Copy className="mr-2 h-4 w-4" />
                                    Copy All Emails
                                </Button>
                                <div className="h-96 overflow-y-auto rounded-md border p-3 bg-secondary/50">
                                    <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">
                                        {users.map(u => u.email).filter(Boolean).join('\n')}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </TabsContent>
        </Tabs>
      );
  }

  return (
    <DashboardLayout>
      <main className="flex-1 p-4 md:p-8">
        <div className="w-full max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold">Admin Dashboard</h1>
          <p className="mt-2 text-lg text-muted-foreground">User and application management.</p>
          <div className="mt-8">
            {renderContent()}
          </div>
        </div>
      </main>
    </DashboardLayout>
  );
}
