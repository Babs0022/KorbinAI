
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import DashboardHeader from '@/components/layout/DashboardHeader';
import Footer from '@/components/layout/Footer';

export default function TermsOfServicePage() {
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
            <h1>Terms of Service</h1>
            <p className="text-muted-foreground">Last Updated: {effectiveDate}</p>
            
            <p>Welcome to BrieflyAI. These Terms of Service ("Terms") govern your access to and use of the BrieflyAI website, applications, and services (collectively, the "Service"). Please read these Terms carefully. By accessing or using the Service, you agree to be bound by these Terms and our Privacy Policy.</p>

            <h2>1. Acceptance of Terms</h2>
            <p>By creating an account, using the Service, or clicking "I Agree," you acknowledge that you have read, understood, and agree to be bound by these Terms. If you are using the Service on behalf of an organization, you are agreeing to these Terms for that organization and promising that you have the authority to bind that organization to these terms.</p>

            <h2>2. The Service</h2>
            <p>BrieflyAI provides a suite of artificial intelligence tools to assist in the creation of applications, written content, images, structured data, and AI prompts ("Generated Content"). The Service is provided on an "as-is" and "as-available" basis. We may modify, suspend, or discontinue the Service at any time without notice.</p>

            <h2>3. User Accounts & Security</h2>
            <p>You must register for an account to access most features of the Service. You agree to provide accurate, current, and complete information during registration and to update such information to keep it accurate. You are responsible for safeguarding your password and for all activities that occur under your account. You must notify us immediately of any unauthorized use of your account.</p>

            <h2>4. Content and Ownership</h2>
            <h3>a. Your Content</h3>
            <p>You retain all ownership rights to the text, images, data, or other materials you provide to the Service ("Input"). By providing Input to the Service, you grant BrieflyAI a worldwide, non-exclusive, royalty-free, sublicensable, and transferable license to use, reproduce, modify, distribute, and prepare derivative works of your Input solely for the purpose of providing, operating, and improving the Service.</p>
            <h3>b. Generated Content</h3>
            <p>To the extent permitted by applicable law, and subject to your compliance with these Terms, you own the Generated Content created by the Service from your Input. However, due to the nature of machine learning, output may not be unique across users, and the Service may generate the same or similar output for other users. As such, we do not grant you any exclusive rights to the Generated Content.</p>
            <h3>c. BrieflyAI Content</h3>
            <p>The Service itself, including its "look and feel," text, graphics, logos, and software, are the exclusive property of BrieflyAI and its licensors and are protected by copyright, trademark, and other laws.</p>
            
            <h2>5. Prohibited Conduct</h2>
            <p>You agree not to use the Service to:</p>
            <ul>
                <li>Engage in any illegal, fraudulent, or abusive activities.</li>
                <li>Generate content that is defamatory, obscene, pornographic, vulgar, or offensive.</li>
                <li>Promote discrimination, bigotry, racism, hatred, harassment, or harm against any individual or group.</li>
                <li>Violate the intellectual property rights or any other rights of any third party.</li>
                <li>Attempt to reverse-engineer, decompile, or discover the source code of the Service.</li>
                <li>Introduce any viruses, malware, or other harmful code.</li>
            </ul>

            <h2>6. Fees and Payment</h2>
            <p>Certain features of the Service may require payment. We use third-party payment processors (e.g., Paystack, NOWPayments) to handle transactions. By providing a payment method, you agree to the terms of our payment processors. All fees are non-refundable except as required by law or as explicitly stated in our pricing plans. You are responsible for all applicable taxes.</p>

            <h2>7. Termination</h2>
            <p>We may terminate or suspend your access to the Service at any time, for any reason, including for a breach of these Terms. You may terminate your account at any time by contacting us or through your account settings. Upon termination, your right to use the Service will immediately cease.</p>

            <h2>8. Disclaimers and Limitation of Liability</h2>
            <p>THE SERVICE AND GENERATED CONTENT ARE PROVIDED "AS IS" WITHOUT WARRANTY OF ANY KIND. WE DISCLAIM ALL WARRANTIES, WHETHER EXPRESS OR IMPLIED, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. BRIEFLYAI MAKES NO WARRANTY THAT THE GENERATED CONTENT WILL BE ACCURATE, COMPLETE, RELIABLE, OR MEET YOUR REQUIREMENTS. YOU USE THE SERVICE AND RELY ON ANY GENERATED CONTENT AT YOUR OWN RISK.</p>
            <p>TO THE MAXIMUM EXTENT PERMITTED BY LAW, BRIEFLYAI SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES.</p>

            <h2>9. Indemnification</h2>
            <p>You agree to defend, indemnify, and hold harmless BrieflyAI, its officers, directors, employees, and agents from and against any claims, liabilities, damages, losses, and expenses, including reasonable legal fees, arising out of or in any way connected with your access to or use of the Service, your Input, or your violation of these Terms.</p>

            <h2>10. Governing Law and Dispute Resolution</h2>
            <p>These Terms shall be governed by the laws of the jurisdiction in which BrieflyAI is headquartered, without regard to its conflict of law provisions. Any disputes arising from these Terms will be resolved through binding arbitration.</p>

            <h2>11. Miscellaneous</h2>
            <p>These Terms constitute the entire agreement between you and BrieflyAI regarding the Service. If any provision is held to be invalid or unenforceable, that provision will be limited or eliminated to the minimum extent necessary, and the remaining provisions will remain in full force and effect. Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights.</p>
            <p>We may revise these Terms from time to time. We will notify you of any material changes by posting the new Terms on the Service. Your continued use of the Service after the changes have been posted will constitute your acceptance of the changes.</p>

            <h2>12. Contact Information</h2>
            <p>If you have any questions about these Terms, please contact us at <a href={`mailto:${supportEmail}`}>{supportEmail}</a>.</p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
