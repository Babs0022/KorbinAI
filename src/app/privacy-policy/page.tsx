
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import DashboardHeader from '@/components/layout/DashboardHeader';

export default function PrivacyPolicyPage() {
  const effectiveDate = "June 12, 2025";
  const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'team@brieflyai.xyz';

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <DashboardHeader />
      <main className="flex-1 py-12 md:py-16">
        <div className="container mx-auto max-w-4xl">
          <Link href="/" className="mb-8 inline-flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
          <div className="prose dark:prose-invert max-w-none">
            <h1>Privacy Policy</h1>
            <p className="text-muted-foreground">Last Updated: {effectiveDate}</p>

            <h2>1. Introduction</h2>
            <p>BrieflyAI ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our Service. By using the Service, you consent to the data practices described in this policy.</p>

            <h2>2. Information We Collect</h2>
            <p>We may collect the following types of information:</p>
            <ul>
              <li><strong>Personal Information:</strong> When you register for an account, we collect information such as your name, email address, and password.</li>
              <li><strong>Payment Information:</strong> We use third-party payment processors (e.g., Paystack, NOWPayments) to handle payments. We do not store your full credit card or financial account information on our servers.</li>
              <li><strong>Content Data:</strong> We collect the Inputs you provide to the Service (e.g., prompts, text, images, data descriptions) and the Generated Content. This is necessary to provide and improve the Service.</li>
              <li><strong>Usage Data:</strong> We automatically collect information about your interactions with the Service, such as your IP address, browser type, operating system, and the pages or features you accessed.</li>
              <li><strong>Cookies:</strong> We use cookies and similar tracking technologies to operate and personalize the Service.</li>
            </ul>

            <h2>3. How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul>
              <li>Provide, operate, maintain, and improve the Service.</li>
              <li>Process your transactions and manage your subscriptions.</li>
              <li>Communicate with you, including sending service-related notices and promotional materials.</li>
              <li>Monitor and analyze usage and trends to improve user experience.</li>
              <li>Personalize the Service and provide content or features that match your interests.</li>
              <li>For research and development to train and enhance our AI models, but only in an aggregated and anonymized form where possible.</li>
            </ul>

            <h2>4. How We Share and Disclose Information</h2>
            <p>We do not sell your personal information. We may share your information in the following circumstances:</p>
            <ul>
              <li><strong>With Service Providers:</strong> We share information with third-party vendors and service providers that perform services on our behalf, such as AI model providers (e.g., Google AI), cloud hosting, payment processing, and analytics. These providers only have access to the information necessary to perform their functions and are contractually obligated to protect it.</li>
              <li><strong>For Legal Reasons:</strong> We may disclose your information if required to do so by law or in the good faith belief that such action is necessary to comply with a legal obligation, protect our rights or property, or prevent fraud or illegal activity.</li>
              <li><strong>Business Transfers:</strong> In the event of a merger, acquisition, or sale of all or a portion of our assets, your information may be transferred as part of that transaction.</li>
            </ul>

            <h2>5. Data Security and Retention</h2>
            <p>We implement industry-standard security measures to protect your information from unauthorized access, alteration, disclosure, or destruction. However, no internet-based service is 100% secure. We retain your information for as long as your account is active or as needed to provide you with the Service, comply with our legal obligations, resolve disputes, and enforce our agreements.</p>

            <h2>6. Your Data Protection Rights</h2>
            <p>Depending on your location, you may have the following rights regarding your personal information:</p>
            <ul>
              <li>The right to access, update, or delete the information we have on you.</li>
              <li>The right of rectification if that information is inaccurate or incomplete.</li>
              <li>The right to object to our processing of your personal information.</li>
              <li>The right to request that we restrict the processing of your personal information.</li>
              <li>The right to data portability.</li>
            </ul>
            <p>You can exercise these rights through your account settings or by contacting us directly.</p>

            <h2>7. International Data Transfers</h2>
            <p>Your information, including personal data, may be transferred to — and maintained on — computers located outside of your state, province, country, or other governmental jurisdiction where the data protection laws may differ. Your consent to this Privacy Policy followed by your submission of such information represents your agreement to that transfer.</p>
            
            <h2>8. Children's Privacy</h2>
            <p>Our Service is not intended for use by children under the age of 13. We do not knowingly collect personally identifiable information from children under 13. If we become aware that we have collected such information, we will take steps to delete it.</p>

            <h2>9. Changes to This Privacy Policy</h2>
            <p>We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date. You are advised to review this Privacy Policy periodically for any changes.</p>

            <h2>10. Contact Us</h2>
            <p>If you have any questions about this Privacy Policy, please contact us at <a href={`mailto:${supportEmail}`}>{supportEmail}</a>.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
