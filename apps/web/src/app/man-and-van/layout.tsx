import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Man and Van Services UK | 24/7 Removals | Speedy Van',
  description: 'Professional man and van services across the UK. 24/7 online booking, fast quotes, fully insured. From £25/hour. Same-day service subject to availability.',
  keywords: 'man and van uk, removals uk, van hire uk, delivery service uk',
  openGraph: {
    title: 'Man and Van Services UK | Speedy Van',
    description: 'Professional man and van services across the UK. 24/7 online booking, fast quotes, fully insured.',
    url: 'https://speedy-van.co.uk/man-and-van',
  },
  alternates: {
    canonical: 'https://speedy-van.co.uk/man-and-van',
  },
};

export default function ManAndVanLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
