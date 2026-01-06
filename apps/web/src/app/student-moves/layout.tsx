import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Student Moving Service | Affordable Uni Moves | Speedy Van',
  description: 'Affordable student moving service. University halls, shared houses, storage runs. Student discounts available. From £59. Fully insured, flexible scheduling.',
  keywords: [
    'student moving service',
    'university moves',
    'student man and van',
    'uni moving',
    'student removals',
    'cheap student moves',
    'halls move',
    'student storage',
    'term time moving',
    'affordable student transport',
  ].join(', '),
  alternates: {
    canonical: 'https://speedy-van.co.uk/student-moves',
  },
  openGraph: {
    title: 'Student Moving Service | Speedy Van',
    description: 'Affordable student moving. From £59, student discounts available.',
    url: 'https://speedy-van.co.uk/student-moves',
    siteName: 'Speedy Van',
    locale: 'en_GB',
    type: 'website',
  },
};

export default function StudentMovesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
