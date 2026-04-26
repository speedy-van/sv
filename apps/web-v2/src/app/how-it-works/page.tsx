import type { Metadata } from "next";
import { ClientShell } from "@/components/layout/ClientShell";
import { PageHero } from "@/components/layout/PageHero";
import { HowItWorks } from "@/components/home/HowItWorks";
import { FAQ } from "@/components/home/FAQ";
import { FinalCTA } from "@/components/home/FinalCTA";

export const metadata: Metadata = {
  title: "How It Works — Three steps, zero stress",
  description:
    "Booking a premium move with Speedy Van takes minutes. Quote, schedule, relax. See exactly how the process works from first click to final box.",
  alternates: { canonical: "/how-it-works" },
};

export default function HowItWorksPage() {
  return (
    <ClientShell>
      <PageHero
        eyebrow="How It Works"
        title="Three steps. One smooth move."
        subtitle="We rebuilt removals to feel like a great hotel check-in. Effortless, transparent, and respectful of your time."
      />
      <HowItWorks />
      <FAQ />
      <FinalCTA />
    </ClientShell>
  );
}