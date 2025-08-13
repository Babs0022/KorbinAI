
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { getPendingVerificationRequests, approveVerificationRequest, denyVerificationRequest, getAdminDashboardUsers } from '@/services/adminService';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { LoaderCircle, CheckCircle, XCircle, ExternalLink, ShieldAlert, MessageCircle, Bug, FileText, BadgeCheck, User, Users, Mail, Copy, FolderKanban, TrendingUp, CreditCard, Send, Coins } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow, format } from 'date-fns';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { UserReport } from '@/types/feedback';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import type { AdminDashboardData } from '@/services/adminService';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Line, LineChart, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { getAllUserReports } from '@/services/feedbackService';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import type { ChartConfig } from '@/components/ui/chart';
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { getFunctions, httpsCallable } from 'firebase/functions';


interface VerificationRequest {
    id: string;
    userId: string;
    tweetUrl: string;
    status: 'pending' | 'approved' | 'denied';
    createdAt: string;
    userName?: string;
    userEmail?: string;
}

const chartConfig = {
    users: {
      label: 'Users',
      color: 'hsl(var(--chart-1))',
    },
    projects: {
      label: 'Projects',
      color: 'hsl(var(--chart-2))',
    },
    chats: {
      label: 'Chats',
      color: 'hsl(var(--chart-3))',
    },
} satisfies ChartConfig

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [reports, setReports] = useState<UserReport[]>([]);
  const [dashboardData, setDashboardData] = useState<AdminDashboardData | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [activeChartMetrics, setActiveChartMetrics] = useState<string[]>(['users', 'projects', 'chats']);


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
            getAdminDashboardUsers(user.uid),
          ]).then(([verificationRequests, userReports, adminData]) => {
              setRequests(verificationRequests);
              setReports(userReports);
              setDashboardData(adminData);
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
      // Optionally re-fetch dashboard data
      getAdminDashboardUsers(user.uid).then(setDashboardData);
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
    if (!dashboardData) return;
    const allEmails = dashboardData.users.map(u => u.email).filter(Boolean).join(', ');
    navigator.clipboard.writeText(allEmails);
    toast({ title: 'Emails Copied', description: 'All user emails have been copied to your clipboard.' });
  };
  
   const handleSendEmail = async () => {
    if (!emailSubject.trim() || !emailBody.trim()) {
      toast({ variant: 'destructive', title: 'Error', description: 'Subject and body cannot be empty.' });
      return;
    }
    setIsSendingEmail(true);
    try {
      const functions = getFunctions();
      const sendBulkEmail = httpsCallable(functions, 'sendBulkEmail');
      const result = await sendBulkEmail({ subject: emailSubject, body: emailBody });
      toast({ title: 'Email Sent!', description: (result.data as any).message });
      setEmailSubject('');
      setEmailBody('');
    } catch (error: any) {
      console.error("Email sending failed:", error);
      toast({ variant: 'destructive', title: 'Failed to Send Email', description: error.message });
    } finally {
      setIsSendingEmail(false);
    }
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

      const users = dashboardData?.users || [];
      const timeSeriesData = dashboardData?.timeSeriesData || [];

      return (
        <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="users">Users</TabsTrigger>
                <TabsTrigger value="verification">Verification</TabsTrigger>
                <TabsTrigger value="feedback">Feedback/Bugs</TabsTrigger>
                <TabsTrigger value="email">Email</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="mt-6">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{dashboardData?.totalUsers ?? 0}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Verified Users</CardTitle>
                            <BadgeCheck className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{dashboardData?.totalVerifiedUsers ?? 0}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
                            <CreditCard className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{dashboardData?.totalActiveSubscriptions ?? 0}</div>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
                            <FolderKanban className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{dashboardData?.totalProjects ?? 0}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Chats</CardTitle>
                            <MessageCircle className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{dashboardData?.totalChats ?? 0}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Pending Verifications</CardTitle>
                            <User className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{requests.length}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Open Feedback</CardTitle>
                            <Bug className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{reports.length}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Credits Used</CardTitle>
                            <Coins className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{dashboardData?.totalCredits.toLocaleString() ?? 'N/A'}</div>
                            <p className="text-xs text-muted-foreground">Total credits across all users</p>
                        </CardContent>
                    </Card>
                </div>
                <div className="mt-6">
                    <Card>
                        <CardHeader>
                           <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <CardTitle>Application Analytics</CardTitle>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-4">
                                        {Object.entries(chartConfig).map(([key, config]) => (
                                            <div key={key} className="flex items-center space-x-2">
                                                <Checkbox id={`metric-${key}`} checked={activeChartMetrics.includes(key)} onCheckedChange={(checked) => {
                                                    setActiveChartMetrics(prev => checked ? [...prev, key] : prev.filter(m => m !== key))
                                                }} />
                                                <label htmlFor={`metric-${key}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                                    {config.label}
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                    <Select defaultValue="30days">
                                        <SelectTrigger className="w-[180px]">
                                            <SelectValue placeholder="Select time range" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="hour">Last Hour</SelectItem>
                                            <SelectItem value="day">Last 24 Hours</SelectItem>
                                            <SelectItem value="7days">Last 7 Days</SelectItem>
                                            <SelectItem value="30days">Last 30 Days</SelectItem>
                                            <SelectItem value="year">Last Year</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardHeader>
                         <CardContent className="h-[350px]">
                            <ChartContainer config={chartConfig}>
                                <LineChart data={timeSeriesData}>
                                    <CartesianGrid vertical={false} />
                                    <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
                                    <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
                                    <ChartLegend content={<ChartLegendContent />} />
                                    {activeChartMetrics.map((metric) => (
                                        <Line key={metric} dataKey={metric} type="natural" stroke={`var(--color-${metric})`} strokeWidth={2} dot={false} />
                                    ))}
                                </LineChart>
                            </ChartContainer>
                        </CardContent>
                    </Card>
                </div>
            </TabsContent>
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
                                    <TableHead>Credits</TableHead>
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
                                        <TableCell>{u.credits}</TableCell>
                                        <TableCell>{format(new Date(u.creationTime), 'PP')}</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm" disabled>View Details</Button>
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center h-24">
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
                                    <Label htmlFor="body">Body (HTML is supported)</Label>
                                    <Textarea id="body" placeholder="Hi {{user.name}}, we're excited to share..." className="min-h-[300px]" value={emailBody} onChange={(e) => setEmailBody(e.target.value)} />
                                </div>
                                <div className="flex justify-end">
                                    <Button onClick={handleSendEmail} disabled={isSendingEmail}>
                                        {isSendingEmail ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                                        Send to {users.length} Users
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
