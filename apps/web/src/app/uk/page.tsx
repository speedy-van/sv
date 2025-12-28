import Link from 'next/link';
import type { Metadata } from 'next';
import places from '@/data/places.json';
import PlaceSearch from '@/components/uk/PlaceSearch';
import '@/styles/uk-place-pages.css';

// ✅ Force Node runtime for ISR
export const runtime = 'nodejs';

// CRITICAL: This is the UK INDEX page (single page) - can be static
// Only the /uk page itself, not the 700+ place pages
export const revalidate = 86400; // 24h ISR

// This page is the index, no dynamic params needed
export const dynamicParams = false;

// NOTE: This page does NOT need generateStaticParams since it's a single page (/uk)
// The /uk/[place] and /uk/[...slug] routes handle individual places

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'UK Coverage | Speedy Van',
    description:
      'Professional man & van and full removals across the UK. Fixed quotes, same-day availability, insured movers.',
    alternates: { canonical: '/uk' },
    openGraph: {
      title: 'Speedy Van — UK Coverage',
      description: 'Premium removals across the UK. Book in minutes.',
      type: 'website',
    },
  };
}

export default function UkIndex() {
  // Group places by region for browsing
  const regions = ['England', 'Scotland', 'Wales', 'Northern Ireland'];
  const topCitiesByRegion = regions.map(region => ({
    region,
    places: (places.places as any[])
      .filter(p => p.region === region)
      .sort((a, b) => (b.population || 0) - (a.population || 0))
      .slice(0, 6)
  }));

  return (
    <main className="uk-index-container">
      <section className="uk-index-hero">
        <h1>UK Coverage</h1>
        <p>
          Choose your area to get an instant removal quote. We cover every
          corner of the United Kingdom.
        </p>
      </section>

      <section className="uk-index-search-section">
        <PlaceSearch />
      </section>

      <section className="uk-index-popular-areas">
        <h2>Browse by Region</h2>
        {topCitiesByRegion.filter(r => r.places.length > 0).map(({ region, places: regionPlaces }) => (
          <div key={region} className="uk-region-section">
            <h3 className="uk-region-title">
              <Link href={`/uk/regions/${region.toLowerCase().replace(' ', '-')}`}>
                {region} →
              </Link>
            </h3>
            <div className="uk-index-areas-grid">
              {regionPlaces.map((place: any) => (
                <Link
                  key={place.slug}
                  href={`/uk/${place.slug}`}
                  className="uk-index-area-card"
                >
                  <h4>{place.name}</h4>
                  <p className="uk-index-place-type">{place.type}</p>
                  {place.population && (
                    <p className="uk-index-population">
                      {place.population.toLocaleString()} people
                    </p>
                  )}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}
