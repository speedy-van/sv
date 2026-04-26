import type { Metadata } from "next";
import { ClientShell } from "@/components/layout/ClientShell";
import { TrackingView } from "@/components/tracking/TrackingView";

export const metadata: Metadata = {
  title: "Track Your Move",
  description: "Live tracking for your Speedy Van booking — driver location, ETA and timeline.",
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ ref: string }>;
}

export default async function TrackingPage({ params }: PageProps) {
  const { ref } = await params;
  return (
    <ClientShell>
      <TrackingView reference={ref} />
    </ClientShell>
  );
}
