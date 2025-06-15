
import { MainHeader } from '@/components/layout/MainHeader';
import { Footer } from '@/components/layout/Footer';
import { HeroSection } from '@/components/sections/HeroSection';
import { KeyFeaturesHighlightSection } from '@/components/sections/KeyFeaturesHighlightSection';
import { InteractiveDemoSection } from '@/components/sections/DemoVideoSection';
import { HowItWorksSection } from '@/components/sections/HowItWorksSection';
import { TargetAudienceSection } from '@/components/sections/TargetAudienceSection';
import { SocialProofSection } from '@/components/sections/SocialProofSection';
import { PricingSection } from '@/components/sections/PricingSection';
import { FAQSection } from '@/components/sections/FAQSection';
import { FinalCTASection } from '@/components/sections/FinalCTASection';

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <MainHeader />
      <main className="flex-grow">
        <HeroSection />
        <KeyFeaturesHighlightSection />
        <InteractiveDemoSection />
        <HowItWorksSection />
        <TargetAudienceSection />
        <SocialProofSection />
        <PricingSection />
        <FAQSection />
        <FinalCTASection />
      </main>
      <Footer />
    </div>
  );
}
