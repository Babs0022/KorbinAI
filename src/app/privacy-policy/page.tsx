
"use client";

import React from 'react';
import { MainHeader } from '@/components/layout/MainHeader';
import { Footer } from '@/components/layout/Footer';
import Container from '@/components/layout/Container';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/shared/GlassCard';

export default function PrivacyPolicyPage() {
  // Using a static date to prevent hydration mismatches.
  // This value should be updated manually when the policy changes.
  const lastUpdatedDate = "June 12, 2025";

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <MainHeader />
      <main className="flex-grow py-12 md:py-16">
        <Container>
          <GlassCard className="max-w-3xl mx-auto">
            <GlassCardHeader>
              <GlassCardTitle className="font-headline text-3xl">Privacy Policy</GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent className="prose prose-indigo dark:prose-invert max-w-none">
              <p><em>Last Updated: {lastUpdatedDate}</em></p>
              
              <h2>1. Introduction</h2>
              <p>Welcome to BrieflyAI ("we", "our", "us"). We are committed to protecting your personal information and your right to privacy. If you have any questions or concerns about this privacy notice, or our practices with regards to your personal information, please contact us at babseli933@gmail.com.</p>

              <h2>2. Information We Collect</h2>
              <p>We collect personal information that you voluntarily provide to us when you register on the BrieflyAI, express an interest in obtaining information about us or our products and Services, when you participate in activities on the BrieflyAI or otherwise when you contact us.</p>
              <p>The personal information that we collect depends on the context of your interactions with us and the BrieflyAI, the choices you make and the products and features you use. The personal information we collect may include the following: name, email address, password, payment information (via Paystack), and any prompts or data you input into our service.</p>

              <h2>3. How We Use Your Information</h2>
              <p>We use personal information collected via our BrieflyAI for a variety of business purposes described below. We process your personal information for these purposes in reliance on our legitimate business interests, in order to enter into or perform a contract with you, with your consent, and/or for compliance with our legal obligations.</p>
              <ul>
                <li>To facilitate account creation and logon process.</li>
                <li>To manage user accounts.</li>
                <li>To send administrative information to you.</li>
                <li>To fulfill and manage your orders (subscriptions).</li>
                <li>To deliver and facilitate delivery of services to the user.</li>
                <li>To respond to user inquiries/offer support to users.</li>
              </ul>

              <h2>4. Will Your Information Be Shared With Anyone?</h2>
              <p>We only share information with your consent, to comply with laws, to provide you with services, to protect your rights, or to fulfill business obligations.</p>
              <p>Specifically, we may need to process your data or share your personal information in the following situations:</p>
              <ul>
                <li><strong>Vendors, Consultants and Other Third-Party Service Providers.</strong> We may share your data with third-party vendors, service providers, contractors or agents who perform services for us or on our behalf and require access to such information to do that work. Examples include: payment processing (Paystack), data analysis, email delivery, hosting services, customer service and marketing efforts.</li>
                <li><strong>AI Model Providers (e.g., OpenAI).</strong> When you use our prompt optimization service, the content of your prompts and related survey answers will be sent to our AI model providers to generate the optimized prompt. These providers have their own privacy policies.</li>
              </ul>

              <h2>5. How Long Do We Keep Your Information?</h2>
              <p>We will only keep your personal information for as long as it is necessary for the purposes set out in this privacy notice, unless a longer retention period is required or permitted by law (such as tax, accounting or other legal requirements).</p>

              <h2>6. How Do We Keep Your Information Safe?</h2>
              <p>We have implemented appropriate technical and organizational security measures designed to protect the security of any personal information we process. However, despite our safeguards and efforts to secure your information, no electronic transmission over the Internet or information storage technology can be guaranteed to be 100% secure.</p>
              
              <h2>7. Your Privacy Rights</h2>
              <p>Depending on your location, you may have certain rights regarding your personal information under applicable data protection laws. These may include the right (i) to request access and obtain a copy of your personal information, (ii) to request rectification or erasure; (iii) to restrict the processing of your personal information; and (iv) if applicable, to data portability.</p>

              <h2>8. Updates To This Notice</h2>
              <p>We may update this privacy notice from time to time. The updated version will be indicated by an updated "Last Updated" date and the updated version will be effective as soon as it is accessible.</p>

              <h2>9. How To Contact Us</h2>
              <p>If you have questions or comments about this notice, you may email us at babseli933@gmail.com.</p>
            </GlassCardContent>
          </GlassCard>
        </Container>
      </main>
      <Footer />
    </div>
  );
}
