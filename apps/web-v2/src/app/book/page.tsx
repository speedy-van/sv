import type { Metadata } from "next";
import { ClientShell } from "@/components/layout/ClientShell";
import { BookingFlow } from "@/components/book/BookingFlow";

export const metadata: Metadata = {
  title: "Book Your Move",
  description:
    "Premium 3-step booking. Fixed price, no callbacks. Quote in seconds, paid securely via Stripe.",
  alternates: { canonical: "/book" },
  robots: { index: true, follow: true },
};

export default function BookPage() {
  return (
    <ClientShell>
      <BookingFlow />
    </ClientShell>
  );
}
