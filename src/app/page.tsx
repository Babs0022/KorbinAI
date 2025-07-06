
import DashboardHeader from '@/components/layout/DashboardHeader';
import Footer from '@/components/layout/Footer';
import FinalCTASection from '@/components/sections/FinalCTASection';
import HeroSection from '@/components/sections/HeroSection';
import KeyFeaturesHighlightSection from '@/components/sections/KeyFeaturesHighlightSection';
import FAQSection from '@/components/sections/FAQSection';

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <DashboardHeader />
      <main className="flex-1">
        <HeroSection />
        <KeyFeaturesHighlightSection />
        <FAQSection />
        <FinalCTASection />
      </main>
      <Footer />
    </div>
  );
}
