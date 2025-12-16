import places from '@/data/places.json';
import RegionPageClient from '@/components/regions/RegionPageClient';
import Header from '@/components/site/Header';
import type { Metadata } from 'next';

interface RegionPageProps {
  params: { region: string };
}

// Generate static params for all regions at build time
export async function generateStaticParams() {
  const regions = Array.from(new Set(
    places.places
      .filter((p: any) => p.region)
      .map((p: any) => p.region.toLowerCase().replace(/\s+/g, '-'))
  ));
  
  return regions.map((region) => ({
    region,
  }));
}

// Generate metadata
export async function generateMetadata({ params }: RegionPageProps): Promise<Metadata> {
  const regionName = params.region
    .replace(/-/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
  
  return {
    title: `Man and Van in ${regionName} - Speedy Van`,
    description: `Professional man and van services in ${regionName}. Fast, reliable, and fully insured removal services with instant online quotes. Available 24/7.`,
  };
}

export default function RegionPage({ params }: RegionPageProps) {
  const regionName = params.region
    .replace(/-/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
  
  const regionPlaces = places.places.filter(
    (p: any) =>
      p.region && p.region.toLowerCase().replace(/\s+/g, '-') === params.region
  );

  return (
    <>
      <Header />
      <RegionPageClient regionName={regionName} regionPlaces={regionPlaces} />
    </>
  );
}
