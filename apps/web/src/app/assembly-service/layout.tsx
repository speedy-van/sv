import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Furniture Assembly Service | Flatpack Assembly | Speedy Van',
  description: 'Professional furniture assembly and disassembly service. IKEA, Argos, flatpack - we build it all. From £35/item. Delivery and assembly packages available.',
  keywords: [
    'furniture assembly',
    'flatpack assembly',
    'ikea assembly',
    'furniture disassembly',
    'flatpack building',
    'furniture assembly service',
    'argos assembly',
    'bed assembly',
    'wardrobe assembly',
    'assembly service near me',
  ].join(', '),
  alternates: {
    canonical: 'https://speedy-van.co.uk/assembly-service',
  },
  openGraph: {
    title: 'Furniture Assembly Service | Speedy Van',
    description: 'Professional flatpack assembly. IKEA, Argos, any brand. From £35/item.',
    url: 'https://speedy-van.co.uk/assembly-service',
    siteName: 'Speedy Van',
    locale: 'en_GB',
    type: 'website',
  },
};

export default function AssemblyServiceLayout({ children }: { children: React.ReactNode }) {
  return children;
}
