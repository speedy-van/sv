import type { Metadata } from "next";
import { ClientShell } from "@/components/layout/ClientShell";
import { ReviewForm } from "@/components/review/ReviewForm";

export const metadata: Metadata = {
  title: "Rate Your Experience",
  description: "Tell us how your Speedy Van move went.",
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ ref: string }>;
}

export default async function ReviewPage({ params }: PageProps) {
  const { ref } = await params;
  return (
    <ClientShell>
      <ReviewForm reference={ref} />
    </ClientShell>
  );
}
