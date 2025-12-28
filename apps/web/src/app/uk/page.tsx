import Link from 'next/link';
import type { Metadata } from 'next';
import places from '@/data/places.json';
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
  // ❌ Do not call cookies(), headers(), or any request-bound APIs.
  // ❌ No runtime = "edge" here.
  // ✅ Render pure server components + fetch() with default cache.

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
        <div className="uk-index-search-container">
          <div className="uk-index-search-placeholder">
            <p>Search for your city, town, or village above to get started</p>
            <p>Or browse popular areas below:</p>
          </div>
        </div>
      </section>

      <section className="uk-index-popular-areas">
        <h2>Popular Areas</h2>
        <div className="uk-index-areas-grid">
          {places.places.slice(0, 12).map((place: any) => (
            <Link
              key={place.slug}
              href={`/uk/${place.slug}`}
              className="uk-index-area-card"
            >
              <h3>{place.name}</h3>
              <p className="uk-index-place-type">{place.type}</p>
              {place.population && (
                <p className="uk-index-population">
                  {place.population.toLocaleString()} people
                </p>
              )}
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
