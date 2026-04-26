import { ClientShell } from "@/components/layout/ClientShell";
import { Hero } from "@/components/home/Hero";
import { ServicesSection } from "@/components/home/ServicesSection";
import { HowItWorks } from "@/components/home/HowItWorks";
import { CoverageSection } from "@/components/home/CoverageSection";
import { Testimonials } from "@/components/home/Testimonials";
import { PricingSection } from "@/components/home/PricingSection";
import { FAQ } from "@/components/home/FAQ";
import { FinalCTA } from "@/components/home/FinalCTA";

export default function HomePage() {
  return (
    <ClientShell>
      <Hero />
      <ServicesSection />
      <HowItWorks />
      <CoverageSection />
      <Testimonials />
      <PricingSection />
      <FAQ />
      <FinalCTA />
    </ClientShell>
  );
}
