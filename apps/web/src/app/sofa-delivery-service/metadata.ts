import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sofa Delivery Service UK | Collect & Deliver Sofas | Speedy Van',
  description:
    'Professional sofa delivery service across the UK. We collect sofas from Facebook Marketplace, Gumtree, stores or private sellers and deliver to your door. 2-man team, stairs handled.',
  keywords:
    'sofa delivery, sofa collection, deliver sofa, sofa delivery service, collect sofa from seller, Facebook Marketplace sofa delivery, corner sofa delivery, sofa delivery UK, furniture delivery sofa',
  alternates: {
    canonical: 'https://speedy-van.co.uk/sofa-delivery-service',
  },
  openGraph: {
    title: 'Sofa Delivery Service | Collect & Deliver UK | Speedy Van',
    description:
      'Professional sofa collection and delivery. 2-seaters to corner sofas. We collect from sellers and deliver to your living room.',
    url: 'https://speedy-van.co.uk/sofa-delivery-service',
    siteName: 'Speedy Van',
    images: [
      {
        url: '/og/og-sofa-delivery.jpg',
        width: 1200,
        height: 630,
        alt: 'Sofa delivery service',
      },
    ],
    locale: 'en_GB',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sofa Delivery Service UK | Speedy Van',
    description:
      'Professional sofa collection and delivery. From Facebook Marketplace to your living room. Same-day available.',
  },
};
