import { AuthLayout } from "@/components/shared/AuthLayout";
import { LoginForm } from "@/components/auth/LoginForm";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Login - BrieflyAI',
  description: 'Log in to your BrieflyAI account to optimize your prompts.',
};

export default function LoginPage() {
  return (
    <AuthLayout 
      title="Welcome Back!"
      description="Log in to access your dashboard and continue optimizing your prompts."
    >
      <LoginForm />
    </AuthLayout>
  );
}
