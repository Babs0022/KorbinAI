
import { AuthLayout } from "@/components/shared/AuthLayout";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Forgot Password - BrieflyAI',
  description: 'Reset your BrieflyAI account password.',
};

export default function ForgotPasswordPage() {
  return (
    <AuthLayout 
      title="Forgot Your Password?"
      description="No problem. Enter your email below and we'll send you a link to reset it."
    >
      <ForgotPasswordForm />
    </AuthLayout>
  );
}
