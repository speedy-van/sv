import type { Metadata } from 'next';
import Link from 'next/link';
import { getPlaceBySlug } from '@/lib/places';
import '@/styles/route-pages.css';

// ✅ Force Node runtime for SSG/ISR
export const runtime = 'nodejs';
export const dynamic = 'force-static';
export const revalidate = 86400;

type Params = { from: string; to: string };

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  try {
    const from = await getPlaceBySlug(params.from);
    const to = await getPlaceBySlug(params.to);
    if (!from || !to) return {};

    const title = `Man and Van ${from.name} to ${to.name} | Speedy Van`;
    const description = `Trusted removals between ${from.name} and ${to.name}. Fixed quotes and tracking.`;

    return {
      title,
      description,
      alternates: {
        canonical: `https://speedy-van.co.uk/routes/${from.slug}-to-${to.slug}`,
      },
    };
  } catch (error) {
    console.error('Error generating metadata for route:', error);
    return {};
  }
}

function JsonLd({ from, to }: any) {
  const json = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: `Removals ${from.name} → ${to.name}`,
    areaServed: [from.name, to.name],
    url: `https://speedy-van.co.uk/routes/${from.slug}-to-${to.slug}`,
    provider: {
      '@type': 'Organization',
      name: 'Speedy Van',
      url: 'https://speedy-van.co.uk',
    },
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'GBP',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }}
    />
  );
}

export default async function RoutePage({ params }: { params: Params }) {
  try {
    const from = await getPlaceBySlug(params.from);
    const to = await getPlaceBySlug(params.to);

    if (!from || !to) {
      return (
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            Route not found
          </h1>
          <p className="text-gray-600">
            The requested route could not be found. Please check the URL and try again.
          </p>
        </div>
      );
    }


    return (
      <main className="route-container">
        <JsonLd from={from} to={to} />

        <section className="route-hero">
          <h1>
            Man and Van {from.name} to {to.name}
          </h1>
          <p>
            Trusted removals between {from.name} and {to.name}. Fixed quotes and
            real-time tracking.
          </p>
          <div className="route-cta">
            <Link className="btn btn-primary" href="/booking-luxury">
              Get a quote
            </Link>
            <Link className="btn btn-secondary" href="/how-it-works">
              How it works
            </Link>
          </div>
        </section>

        <section className="route-info">
          <h2>Route Information</h2>
          <div className="route-details">
            <div className="from-to">
              <div className="location from">
                <h3>From: {from.name}</h3>
                <p>
                  {(from as any).type || 'location'} • {from.region}
                </p>
                {(from as any).population && (
                  <p>Population: {(from as any).population.toLocaleString()}</p>
                )}
              </div>
              <div className="arrow">→</div>
              <div className="location to">
                <h3>To: {to.name}</h3>
                <p>
                  {(to as any).type || 'location'} • {to.region}
                </p>
                {(to as any).population && (
                  <p>Population: {(to as any).population.toLocaleString()}</p>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="route-services">
          <h2>Our Services</h2>
          <ul className="services-list">
            <li>House removals</li>
            <li>Office relocations</li>
            <li>Student moves</li>
            <li>Storage solutions</li>
            <li>Packing services</li>
            <li>Furniture assembly</li>
          </ul>
        </section>
      </main>
    );
  } catch (error) {
    console.error('Error rendering route page:', error);
    return (
      <div className="error-container">
        <h1>Error</h1>
        <p>Something went wrong while loading this route.</p>
        <Link href="/uk" className="btn btn-primary">
          Back to UK areas
        </Link>
      </div>
    );
  }
}
