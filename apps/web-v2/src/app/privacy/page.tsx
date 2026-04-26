import type { Metadata } from "next";
import { ClientShell } from "@/components/layout/ClientShell";
import { PageHero } from "@/components/layout/PageHero";
import { LegalShell } from "@/components/layout/LegalShell";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How Speedy Van collects, uses, and protects your personal information when you book a move.",
  alternates: { canonical: "/privacy" },
  robots: { index: true, follow: true },
};

export default function PrivacyPage() {
  return (
    <ClientShell>
      <PageHero eyebrow="Legal" title="Privacy Policy" particles={false} />
      <LegalShell title="Privacy Policy" lastUpdated="26 April 2026">
        <p>
          This Privacy Policy describes how Speedy Van Ltd ("we", "us") collects, uses,
          and shares personal information when you visit {SITE.url}, book a move, or
          contact us. We are registered in Scotland and act as the data controller for
          the personal information described below.
        </p>

        <h2>Information we collect</h2>
        <ul>
          <li>Contact details you provide when booking: name, phone, email, addresses.</li>
          <li>Payment metadata returned by Stripe (we never store full card numbers).</li>
          <li>Move details: dates, items, access notes, photos you choose to upload.</li>
          <li>Technical data: IP address, browser type, pages visited, anonymised usage.</li>
        </ul>

        <h2>How we use your information</h2>
        <ul>
          <li>To deliver the moving service you booked and communicate about it.</li>
          <li>To process payments, refunds, and invoices.</li>
          <li>To improve our service through aggregated, non-identifying analytics.</li>
          <li>To comply with legal and regulatory obligations.</li>
        </ul>

        <h2>Sharing</h2>
        <p>
          We share information only with the providers that make your move possible:
          drivers assigned to your booking, payment processors (Stripe), email and SMS
          providers, and our authentication partner. We never sell your data.
        </p>

        <h2>Your rights</h2>
        <p>
          Under UK GDPR you have the right to access, correct, delete, and port your
          personal data. Contact us at{" "}
          <a href={`mailto:${SITE.email}`}>{SITE.email}</a> to exercise any of these
          rights.
        </p>

        <h2>Retention</h2>
        <p>
          Booking records are retained for 7 years to comply with HMRC obligations.
          Marketing preferences and account data are retained until you ask us to delete
          them.
        </p>

        <h2>Contact</h2>
        <p>
          Questions about this policy? Email{" "}
          <a href={`mailto:${SITE.email}`}>{SITE.email}</a> or write to us at{" "}
          {SITE.address}.
        </p>
      </LegalShell>
    </ClientShell>
  );
}