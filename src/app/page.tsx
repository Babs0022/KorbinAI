
import { MarketingLayout } from '@/components/layout/MarketingLayout';
import { HeroSection } from '@/components/sections/HeroSection';
import { KeyFeaturesHighlightSection } from '@/components/sections/KeyFeaturesHighlightSection';
import { InteractiveDemoSection } from '@/components/sections/DemoVideoSection';
import { HowItWorksSection } from '@/components/sections/HowItWorksSection';
import { PricingSection } from '@/components/sections/PricingSection';
import { SocialProofSection } from '@/components/sections/SocialProofSection';
import { FAQSection } from '@/components/sections/FAQSection';
import { FinalCTASection } from '@/components/sections/FinalCTASection';
import { AboutFounderSection } from '@/components/sections/AboutFounderSection';

export default function HomePage() {
  return (
    <MarketingLayout>
      <main className="flex-grow">
        <HeroSection />
        <KeyFeaturesHighlightSection />
        <InteractiveDemoSection />
        <HowItWorksSection />
        <PricingSection />
        <AboutFounderSection />
        <SocialProofSection />
        <FAQSection />
        <FinalCTASection />
      </main>
    </MarketingLayout>
  );
}
