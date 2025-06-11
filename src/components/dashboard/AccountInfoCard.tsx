import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/shared/GlassCard';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { UserCircle, Edit3 } from 'lucide-react';

// Placeholder data, replace with actual user data from auth context
const user = {
  name: 'Babs',
  email: 'babs@example.com',
  avatarUrl: 'https://placehold.co/100x100.png',
  plan: 'Premium', // or 'Free', 'Unlimited'
  promptsUsed: 23,
  promptLimit: 50, // or Infinity for unlimited
};

export function AccountInfoCard() {
  const userInitials = user.name.split(" ").map(n => n[0]).join("").toUpperCase() || "U";
  const promptsRemaining = user.plan === 'Unlimited' ? 'Unlimited' : Math.max(0, user.promptLimit - user.promptsUsed);

  return (
    <GlassCard className="w-full">
      <GlassCardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <GlassCardTitle className="text-xl font-medium font-headline">My Account</GlassCardTitle>
        <UserCircle className="h-6 w-6 text-muted-foreground" />
      </GlassCardHeader>
      <GlassCardContent>
        <div className="flex items-center space-x-4 py-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src={user.avatarUrl} alt={user.name} data-ai-hint="user profile" />
            <AvatarFallback>{userInitials}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-2xl font-semibold font-headline">{user.name}</h3>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            <Badge variant={user.plan === 'Premium' ? 'default' : 'secondary'} className="mt-2 bg-primary text-primary-foreground">
              {user.plan} Plan
            </Badge>
          </div>
        </div>
        <div className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Prompts Used:</span>
            <span className="font-medium">{user.promptsUsed}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Prompts Remaining:</span>
            <span className="font-medium">{promptsRemaining}</span>
          </div>
        </div>
        <Button variant="outline" className="mt-6 w-full">
          <Edit3 className="mr-2 h-4 w-4" /> Manage Account
        </Button>
      </GlassCardContent>
    </GlassCard>
  );
}
