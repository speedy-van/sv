import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import LocationDeliveryPage from './LocationDeliveryPage';
import { getLocationData, getAllLocationSlugs } from './locationData';

// Force dynamic rendering for ISR
export const dynamic = 'force-dynamic';
export const revalidate = 86400; // 24h

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const slugs = getAllLocationSlugs();
  return slugs.map((slug: string) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const location = getLocationData(slug);

  if (!location) {
    return {
      title: 'Location Not Found | Speedy Van',
    };
  }

  return {
    title: `${location.title} | Speedy Van`,
    description: location.description,
    keywords: location.keywords.join(', '),
    alternates: {
      canonical: `https://speedy-van.co.uk/delivery/${slug}`,
    },
    openGraph: {
      title: `${location.title} | Speedy Van`,
      description: location.description,
      url: `https://speedy-van.co.uk/delivery/${slug}`,
      siteName: 'Speedy Van',
      locale: 'en_GB',
      type: 'website',
    },
  };
}

export default async function DeliveryLocationPage({ params }: Props) {
  const { slug } = await params;
  const location = getLocationData(slug);

  if (!location) {
    notFound();
  }

  return <LocationDeliveryPage location={location} />;
}
