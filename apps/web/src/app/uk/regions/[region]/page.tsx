import type { Metadata } from 'next';
import Link from 'next/link';
import places from '@/data/places.json';
import '@/styles/uk-place-pages.css';

// ✅ Force Node runtime for SSG/ISR
export const runtime = 'nodejs';
export const dynamic = 'force-static';
export const revalidate = 86400; // 24h ISR

// If we pre-generate specific slugs, set dynamicParams=false
export const dynamicParams = false;

export async function generateStaticParams() {
  // Generate params for unique regions
  const regions = [
    ...new Set(places.places.map((p: any) => p.region).filter(Boolean)),
  ];
  return regions.map(region => ({
    region: (region as string).toLowerCase().replace(/\s+/g, '-'),
  }));
}

export async function generateMetadata({
  params,
}: {
  params: { region: string };
}) {
  const regionName = params.region
    .replace(/-/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
  const title = `Man & Van in ${regionName} | Speedy Van`;
  const description = `Professional man & van and full removals across ${regionName}. Fixed quotes, same-day availability, insured movers.`;

  return {
    title,
    description,
    alternates: { canonical: `/uk/regions/${params.region}` },
    openGraph: {
      title: `Speedy Van — ${regionName}`,
      description: `Premium removals across ${regionName}. Book in minutes.`,
      type: 'website',
    },
  };
}

export default async function RegionPage({
  params,
}: {
  params: { region: string };
}) {
  const regionName = params.region
    .replace(/-/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
  const regionPlaces = places.places.filter(
    (p: any) =>
      p.region && p.region.toLowerCase().replace(/\s+/g, '-') === params.region
  );

  // ❌ Do not call cookies(), headers(), or any request-bound APIs.
  // ❌ No runtime = "edge" here.
  // ✅ Render pure server components + fetch() with default cache.

  return (
    <main className="uk-place-container">
      <section className="uk-place-hero">
        <h1>Man and Van in {regionName}</h1>
        <p>
          Professional removal services across {regionName}. Fast, reliable, and
          fully insured moving solutions.
        </p>
        <div className="uk-place-cta">
          <Link className="btn btn-primary" href="/booking-luxury">
            Get a quote
          </Link>
          <Link className="btn btn-secondary" href="/how-it-works">
            How it works
          </Link>
        </div>
      </section>

      <section className="uk-place-content">
        <h2>Coverage in {regionName}</h2>
        <p>
          We provide comprehensive removal services across {regionName}, from
          major cities to smaller towns and villages. Our network of
          professional movers ensures reliable service wherever you are.
        </p>

        <div className="coverage-stats">
          <div className="stat">
            <h3>{regionPlaces.length}</h3>
            <p>Areas covered</p>
          </div>
          <div className="stat">
            <h3>24/7</h3>
            <p>Availability</p>
          </div>
          <div className="stat">
            <h3>100%</h3>
            <p>Insured</p>
          </div>
        </div>
      </section>

      <section className="uk-place-areas">
        <h3>Areas we cover in {regionName}</h3>
        <div className="areas-grid">
          {regionPlaces.map((place: any) => (
            <Link
              key={place.slug}
              href={`/uk/${place.slug}`}
              className="area-card"
            >
              <h4>{place.name}</h4>
              <p className="place-type">{place.type}</p>
              {place.population && (
                <p className="population">
                  {place.population.toLocaleString()} people
                </p>
              )}
            </Link>
          ))}
        </div>
      </section>

      <section className="uk-place-navigation">
        <h3>Other regions</h3>
        <div className="region-links">
          {[...new Set(places.places.map((p: any) => p.region).filter(Boolean))]
            .filter(r => r !== regionName)
            .slice(0, 6)
            .map(region => (
              <Link
                key={region as string}
                href={`/uk/regions/${(region as string).toLowerCase().replace(/\s+/g, '-')}`}
                className="region-link"
              >
                {region as string}
              </Link>
            ))}
        </div>
      </section>
    </main>
  );
}
