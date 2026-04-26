import type { Metadata } from "next";
import { ClientShell } from "@/components/layout/ClientShell";
import { SuccessView } from "@/components/book/SuccessView";

export const metadata: Metadata = {
  title: "Booking Confirmed",
  description: "Your Speedy Van booking has been confirmed. We'll be in touch shortly.",
  robots: { index: false, follow: false },
};

interface PageProps {
  searchParams: Promise<{ session_id?: string; booking_ref?: string; email?: string }>;
}

export default async function BookingSuccessPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const ref = sp.booking_ref || sp.session_id?.slice(-8).toUpperCase() || "";
  return (
    <ClientShell>
      <SuccessView reference={ref} sessionId={sp.session_id || ""} email={sp.email || ""} />
    </ClientShell>
  );
}
