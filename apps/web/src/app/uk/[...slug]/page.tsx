import type { Metadata } from 'next';
import Link from 'next/link';
import places from '@/data/places.json';

// ✅ Force Node runtime for SSG/ISR
export const runtime = 'nodejs';
export const dynamic = 'force-static';
export const revalidate = 86400; // 24h ISR

// For catch-all routes, we can allow dynamic params
export const dynamicParams = true;

export async function generateStaticParams() {
  // Generate params for all places to ensure they're pre-built
  return places.places.map((p: any) => ({
    slug: [p.slug],
  }));
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string[] };
}) {
  const slug = params.slug[params.slug.length - 1]; // Get the last slug part
  const place = places.places.find((p: any) => p.slug === slug);

  if (!place) {
    return {
      title: 'Page Not Found | Speedy Van',
      description: "The page you're looking for doesn't exist.",
    };
  }

  const title = `Man & Van in ${place.name} | Speedy Van`;
  const description = `Professional man & van and full removals in ${place.name}. Fixed quotes, same-day availability, insured movers.`;

  return {
    title,
    description,
    alternates: { canonical: `/uk/${place.slug}` },
    openGraph: {
      title: `Speedy Van — ${place.name}`,
      description: `Premium removals in ${place.name}. Book in minutes.`,
      type: 'website',
    },
  };
}

export default async function CatchAllUkPage({
  params,
}: {
  params: { slug: string[] };
}) {
  const slug = params.slug[params.slug.length - 1]; // Get the last slug part
  const place = places.places.find((p: any) => p.slug === slug);

  if (!place) {
    return (
      <div className="error-container">
        <h1>Page Not Found</h1>
        <p>The page you're looking for doesn't exist.</p>
        <Link href="/uk" className="btn btn-primary">
          Back to UK areas
        </Link>
      </div>
    );
  }

  // ❌ Do not call cookies(), headers(), or any request-bound APIs.
  // ❌ No runtime = "edge" here.
  // ✅ Render pure server components + fetch() with default cache.

  return (
    <main className="uk-place-container">
      <section className="uk-place-hero">
        <h1>Man and Van in {place.name}</h1>
        <p>
          Fast, insured removals in {place.name} and surrounding areas.
          Transparent pricing and real-time tracking.
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
        <h2>Removals in {place.name}</h2>
        <p>
          Professional moving services in {place.name}. We provide reliable,
          affordable removals with transparent pricing and full insurance
          coverage.
        </p>

        <div className="service-features">
          <div className="feature">
            <h3>Same-day Collection</h3>
            <p>Available in most {place.name} postcodes</p>
          </div>
          <div className="feature">
            <h3>Full Insurance</h3>
            <p>Goods-in-transit and public liability cover</p>
          </div>
          <div className="feature">
            <h3>Fixed Pricing</h3>
            <p>No hidden costs, guaranteed quotes</p>
          </div>
        </div>
      </section>

      <section className="uk-place-navigation">
        <h3>Other areas</h3>
        <div className="area-links">
          {places.places
            .filter((p: any) => p.slug !== place.slug)
            .slice(0, 8)
            .map((nearby: any) => (
              <Link
                key={nearby.slug}
                href={`/uk/${nearby.slug}`}
                className="area-link"
              >
                {nearby.name}
              </Link>
            ))}
        </div>
      </section>
    </main>
  );
}
