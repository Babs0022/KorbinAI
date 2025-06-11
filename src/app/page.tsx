import { MainHeader } from '@/components/layout/MainHeader';
import { Footer } from '@/components/layout/Footer';
import { HeroSection } from '@/components/sections/HeroSection';
import { DemoVideoSection } from '@/components/sections/DemoVideoSection';
import { HowItWorksSection } from '@/components/sections/HowItWorksSection';
import { UseCasesSection } from '@/components/sections/UseCasesSection';
import { PricingSection } from '@/components/sections/PricingSection';
import { AboutFounderSection } from '@/components/sections/AboutFounderSection';
import { FinalCTASection } from '@/components/sections/FinalCTASection';

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <MainHeader />
      <main className="flex-grow">
        <HeroSection />
        <DemoVideoSection />
        <HowItWorksSection />
        <UseCasesSection />
        <PricingSection />
        <AboutFounderSection />
        <FinalCTASection />
      </main>
      <Footer />
    </div>
  );
}
