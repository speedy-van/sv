import type { Metadata } from "next";
import { ClientShell } from "@/components/layout/ClientShell";
import { PageHero } from "@/components/layout/PageHero";
import { LegalShell } from "@/components/layout/LegalShell";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "The terms that apply when you book a move with Speedy Van Ltd. Plain English, fair conditions.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <ClientShell>
      <PageHero eyebrow="Legal" title="Terms of Service" particles={false} />
      <LegalShell title="Terms of Service" lastUpdated="26 April 2026">
        <p>
          These Terms govern every booking placed through {SITE.url}. By confirming a
          booking you agree to them. They are written in plain English and intended to
          be fair to both sides.
        </p>

        <h2>Quotes &amp; pricing</h2>
        <p>
          Prices shown at booking are fixed once you confirm and pay, provided the move
          you describe matches the move we deliver. Material differences (significantly
          more items, additional addresses, restricted access not declared) may attract
          an agreed surcharge before work begins.
        </p>

        <h2>Cancellation &amp; rescheduling</h2>
        <ul>
          <li>Free reschedule up to 24 hours before your slot.</li>
          <li>Cancellations more than 24 hours ahead receive a full refund.</li>
          <li>
            Cancellations within 24 hours may incur a driver fee equal to one hour at the
            standard hourly rate of your van class.
          </li>
        </ul>

        <h2>Liability &amp; insurance</h2>
        <p>
          Every booking is covered by Goods in Transit insurance up to the limit of your
          van class, and by our Public Liability cover. Liability is limited to repair
          or replacement value. Items of unusual value (£500+) must be declared in
          advance.
        </p>

        <h2>Conduct</h2>
        <p>
          We reserve the right to refuse to move illegal, hazardous, or perishable
          goods, or to discontinue a job where staff face threats to safety. In such
          cases a fair pro-rata refund will be provided.
        </p>

        <h2>Disputes</h2>
        <p>
          We aim to resolve any concerns within 14 days. These Terms are governed by the
          law of Scotland and disputes are subject to the exclusive jurisdiction of the
          Scottish courts.
        </p>

        <h2>Contact</h2>
        <p>
          Email <a href={`mailto:${SITE.email}`}>{SITE.email}</a> or call{" "}
          <a href={SITE.phone.href}>{SITE.phone.display}</a>.
        </p>
      </LegalShell>
    </ClientShell>
  );
}