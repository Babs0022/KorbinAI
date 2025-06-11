import { AuthLayout } from "@/components/shared/AuthLayout";
import { SignupForm } from "@/components/auth/SignupForm";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign Up - BrieflyAI',
  description: 'Create your BrieflyAI account to start optimizing prompts.',
};

export default function SignupPage() {
  return (
    <AuthLayout
      title="Create Your Account"
      description="Join BrieflyAI and unlock the power of perfectly crafted prompts."
    >
      <SignupForm />
    </AuthLayout>
  );
}
