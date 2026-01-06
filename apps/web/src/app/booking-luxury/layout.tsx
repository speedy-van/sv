import React from 'react';

export const metadata = {
  title: 'Book Your Move | Man & Van Service | House, Office & Furniture Removal | Speedy Van UK',
  description: 'Professional man and van service for all your moving needs. House removals, office relocations, furniture delivery, Facebook Marketplace pickups, Gumtree collections, IKEA & store deliveries. Same-day service available across the UK. Get an instant quote!',
  keywords: [
    'man and van',
    'house removal',
    'office removal',
    'furniture removal',
    'furniture delivery',
    'Facebook Marketplace delivery',
    'Gumtree pickup',
    'IKEA delivery',
    'store delivery',
    'sofa delivery',
    'bed delivery',
    'appliance delivery',
    'same day delivery',
    'removal service UK',
    'moving service',
    'van hire with driver',
    'business relocation',
    'student moves',
    'single item delivery',
    'eBay collection',
    'auction pickup',
  ],
  openGraph: {
    title: 'Book Your Move | Speedy Van - UK\'s Trusted Man & Van Service',
    description: 'Move anything, anywhere. House removals, furniture delivery, marketplace pickups & more. Professional drivers, instant quotes, same-day service available.',
    type: 'website',
    locale: 'en_GB',
    siteName: 'Speedy Van',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Book Your Move | Speedy Van UK',
    description: 'Professional man and van for house moves, furniture delivery, marketplace pickups & store collections. Get your instant quote now!',
  },
  alternates: {
    canonical: 'https://speedy-van.co.uk/booking-luxury',
  },
};

export default function BookingLuxuryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

