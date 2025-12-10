import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Office Removals UK | Commercial Moving Services | Speedy Van',
  description: 'Professional office removals and commercial moving services across the UK. Minimize downtime with expert office relocation. IT equipment, furniture, and document handling. Free quote available.',
  keywords: 'office removals, office moving, commercial removals, office relocation, business moving, office furniture removal, commercial moving service, office relocation services, business relocation',
  alternates: { canonical: 'https://speedy-van.co.uk/services/office' },
  openGraph: {
    title: 'Office Removals UK | Commercial Moving Services',
    description: 'Professional office removals and commercial moving services. Minimize downtime with expert office relocation.',
    url: 'https://speedy-van.co.uk/services/office',
    siteName: 'Speedy Van',
    images: [
      { url: '/og/og-office.jpg', width: 1200, height: 630, alt: 'Professional office removals service' },
    ],
    locale: 'en_GB',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@speedyvan',
    creator: '@speedyvan',
    title: 'Office Removals UK | Commercial Moving Services',
    description: 'Professional office removals. Minimize downtime with expert office relocation. Free quote.',
  },
};

