import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Van Hire with Driver | Man and Van Service UK | Speedy Van',
  description: 'Affordable van hire with a professional driver. Our man and van service is perfect for moving anything from single items to full loads. Book your van with driver online for a fixed hourly rate.',
  keywords: 'van hire, van with driver, hire a van and driver, man and van hire, van hire with driver uk, cheap van hire with driver',
  alternates: { canonical: 'https://speedy-van.co.uk/van-hire' },
  openGraph: {
    title: 'Van Hire with Driver | Man and Van Service UK | Speedy Van',
    description: 'Affordable van hire with a professional driver. Our man and van service is perfect for moving anything from single items to full loads.',
    url: 'https://speedy-van.co.uk/van-hire',
    siteName: 'Speedy Van',
    images: [
      { url: '/og/og-van-hire.jpg', width: 1200, height: 630, alt: 'Van hire with driver service' },
    ],
    locale: 'en_GB',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@speedyvan',
    creator: '@speedyvan',
    title: 'Van Hire with Driver | Man and Van Service UK',
    description: 'Affordable van hire with a professional driver. Book online for a fixed hourly rate.',
  },
};
