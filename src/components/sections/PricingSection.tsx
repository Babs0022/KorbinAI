import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { GlassCard, GlassCardContent, GlassCardDescription, GlassCardFooter, GlassCardHeader, GlassCardTitle } from '@/components/shared/GlassCard';
import Container from '@/components/layout/Container';
import { CheckCircle2 } from 'lucide-react';

const pricingTiers = [
  {
    name: 'Free',
    price: '$0',
    frequency: '/mo',
    description: 'Get started and experience the power of optimized prompts.',
    features: [
      '5 prompts per month',
      'Standard prompt optimization',
      'Access to basic survey questions',
      'Community support',
    ],
    cta: 'Start for Free',
    href: '/signup',
    emphasized: false,
  },
  {
    name: 'Premium',
    price: '$10',
    frequency: '/mo',
    description: 'For individuals who want to supercharge their AI interactions.',
    features: [
      '50 prompts per month',
      'Advanced prompt optimization',
      'Full access to adaptive survey',
      'Prompt history',
      'Priority email support',
    ],
    cta: 'Go Premium',
    href: '/signup?plan=premium', // Actual link would go to Paystack via a function
    emphasized: true,
  },
  {
    name: 'Unlimited',
    price: '$35',
    frequency: '/mo',
    description: 'For power users and teams who need unlimited prompting capabilities.',
    features: [
      'Unlimited prompts',
      'All Premium features',
      'Early access to new features',
      'Dedicated support channel',
    ],
    cta: 'Go Unlimited',
    href: '/signup?plan=unlimited', // Actual link would go to Paystack via a function
    emphasized: false,
  },
];

export function PricingSection() {
  return (
    <section id="pricing" className="py-16 md:py-24 bg-gradient-to-br from-background via-indigo-50/20 to-mint-50/20">
      <Container>
        <div className="text-center mb-12">
          <h2 className="font-headline text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Flexible Pricing for Everyone
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Choose the plan that’s right for you. No hidden fees, cancel anytime.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 items-stretch">
          {pricingTiers.map((tier) => (
            <GlassCard
              key={tier.name}
              className={`flex flex-col ${tier.emphasized ? 'border-2 border-primary shadow-2xl' : 'border-border'}`}
            >
              <GlassCardHeader className="pb-4">
                <GlassCardTitle className="font-headline text-2xl">{tier.name}</GlassCardTitle>
                <p className="mt-1">
                  <span className="text-4xl font-bold text-foreground">{tier.price}</span>
                  <span className="text-sm text-muted-foreground">{tier.frequency}</span>
                </p>
                <GlassCardDescription className="mt-2 text-sm">{tier.description}</GlassCardDescription>
              </GlassCardHeader>
              <GlassCardContent className="flex-grow">
                <ul className="space-y-2">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-center text-sm">
                      <CheckCircle2 className="mr-2 h-4 w-4 text-accent flex-shrink-0" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </GlassCardContent>
              <GlassCardFooter className="mt-6">
                <Button
                  asChild
                  size="lg"
                  className={`w-full ${tier.emphasized ? 'bg-primary hover:bg-primary/90 text-primary-foreground' : 'bg-accent hover:bg-accent/90 text-accent-foreground'}`}
                >
                  {/* For now, all link to signup. Actual implementation would involve Paystack. */}
                  <Link href={tier.href}>{tier.cta}</Link>
                </Button>
              </GlassCardFooter>
            </GlassCard>
          ))}
        </div>
        <p className="mt-8 text-center text-sm text-muted-foreground">
          Payments are securely processed by Paystack.
        </p>
      </Container>
    </section>
  );
}
