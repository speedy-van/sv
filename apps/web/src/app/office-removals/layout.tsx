import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Office Removals | Business Relocation Service | Speedy Van',
  description: 'Professional office removals and business relocation. Desks, IT equipment, filing systems. Evening and weekend moves available. Minimal downtime guaranteed.',
  keywords: [
    'office removals',
    'business relocation',
    'office moving',
    'commercial removals',
    'office furniture movers',
    'IT equipment moving',
    'business movers',
    'office relocation service',
    'company move',
    'corporate removals',
  ].join(', '),
  alternates: {
    canonical: 'https://speedy-van.co.uk/office-removals',
  },
  openGraph: {
    title: 'Office Removals | Business Relocation | Speedy Van',
    description: 'Professional office removals. Minimal downtime, evening/weekend moves available.',
    url: 'https://speedy-van.co.uk/office-removals',
    siteName: 'Speedy Van',
    locale: 'en_GB',
    type: 'website',
  },
};

export default function OfficeRemovalsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
