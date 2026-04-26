import type { Metadata } from "next";
import { ClientShell } from "@/components/layout/ClientShell";
import { PageHero } from "@/components/layout/PageHero";
import { PricingSection } from "@/components/home/PricingSection";
import { FAQ } from "@/components/home/FAQ";
import { FinalCTA } from "@/components/home/FinalCTA";

export const metadata: Metadata = {
  title: "Pricing — Fixed quotes, no surprises",
  description:
    "Premium Scottish removals from £45. Transparent fixed pricing for every van class. No fuel surcharges, no hourly creep, no hidden fees.",
  alternates: { canonical: "/pricing" },
};

export default function PricingPage() {
  return (
    <ClientShell>
      <PageHero
        eyebrow="Pricing"
        title="Honest prices. Beautifully simple."
        subtitle="Pick a van class. See the price. Lock it in. We never quote one figure and charge another."
      />
      <PricingSection />
      <FAQ />
      <FinalCTA />
    </ClientShell>
  );
}