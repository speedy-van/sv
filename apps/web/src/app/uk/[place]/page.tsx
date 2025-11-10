import type { Metadata } from 'next';
import Link from 'next/link';
import {
  getPlaceBySlug,
  getNearbyPlaces,
  canonicalFor,
  getAllPlaces,
  routeSlug,
} from '@/lib/places';
import { APP_BASE_URL, BRAND_NAME } from '@/lib/seo/constants';
import '@/styles/uk-place-pages.css';

// ✅ Force Node runtime for SSG/ISR
export const runtime = 'nodejs';
export const revalidate = 86400; // 24h ISR

// If we pre-generate specific slugs, set dynamicParams=false
export const dynamicParams = true;

export async function generateMetadata({
  params,
}: {
  params: { place: string };
}): Promise<Metadata> {
  const place = await getPlaceBySlug(params.place);
  if (!place) return {};

  const title = `Man and Van in ${place.name} | ${BRAND_NAME}`;
  const description = `Local and long-distance removals in ${place.name}. Transparent pricing, real-time tracking, insured movers.`;
  const url = `${APP_BASE_URL}/uk/${place.slug}`;

  return {
    metadataBase: new URL(APP_BASE_URL),
    title,
    description,
    alternates: {
      canonical: canonicalFor(place),
      languages: { 'en-GB': url, 'x-default': url },
    },
    robots: {
      index: true,
      follow: true,
      'max-snippet': -1,
      'max-image-preview': 'large',
      'max-video-preview': -1,
    },
    openGraph: {
      title,
      description,
      url,
      type: 'website',
      locale: 'en_GB',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

function JsonLd({ place, nearby }: { place: any; nearby: any[] }) {
  const json = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: `Man and Van in ${place.name}`,
    areaServed: {
      '@type': 'Place',
      name: place.name,
      geo: {
        '@type': 'GeoCoordinates',
        latitude: place.lat,
        longitude: place.lon,
      },
    },
    provider: {
      '@type': 'Organization',
      name: BRAND_NAME,
      url: APP_BASE_URL,
    },
    url: `${APP_BASE_URL}/uk/${place.slug}`,
    offers: { '@type': 'AggregateOffer', priceCurrency: 'GBP' },
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: APP_BASE_URL,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'UK',
          item: `${APP_BASE_URL}/uk`,
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: place.name,
          item: `${APP_BASE_URL}/uk/${place.slug}`,
        },
      ],
    },
  };

  const faq = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `How fast can you collect in ${place.name}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Same-day in most ${place.name} postcodes; next-day nationwide.`,
        },
      },
      {
        '@type': 'Question',
        name: 'Are my items insured?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'All moves include goods-in-transit and public liability cover.',
        },
      },
      {
        '@type': 'Question',
        name: 'Do you offer fixed prices?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: "Yes. You'll see a guaranteed price before booking, based on distance, items and access.",
        },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faq) }}
      />
    </>
  );
}

// A/B content blocks based on place type
function CityContent({ place }: { place: any }) {
  return (
    <div className="city-content">
      <h2>Major City Removals in {place.name}</h2>
      <p>
        As one of the UK's largest cities, {place.name} offers extensive removal
        services with our network of professional movers covering all postcodes.
      </p>
      <ul>
        <li>Same-day collection across {place.name}</li>
        <li>Storage solutions for city living</li>
        <li>Packing and unpacking services</li>
        <li>Furniture assembly and disassembly</li>
      </ul>
    </div>
  );
}

function TownContent({ place }: { place: any }) {
  return (
    <div className="town-content">
      <h2>Local Town Removals in {place.name}</h2>
      <p>
        Trusted local removal services in {place.name} and surrounding villages.
        We know the area and provide reliable, affordable moving solutions.
      </p>
      <ul>
        <li>Local area expertise</li>
        <li>Flexible scheduling</li>
        <li>Competitive local rates</li>
        <li>Community-focused service</li>
      </ul>
    </div>
  );
}

function VillageContent({ place }: { place: any }) {
  return (
    <div className="village-content">
      <h2>Village Removals in {place.name}</h2>
      <p>
        Personalized removal services for {place.name} and nearby areas. We
        understand rural moving challenges and provide tailored solutions.
      </p>
      <ul>
        <li>Rural area navigation</li>
        <li>Flexible access arrangements</li>
        <li>Local knowledge and connections</li>
        <li>Personalized service</li>
      </ul>
    </div>
  );
}

export default async function PlacePage({
  params,
}: {
  params: { place: string };
}) {
  const place = await getPlaceBySlug(params.place);
  if (!place) {
    return (
      <div className="error-container">
        <h1>Place Not Found</h1>
        <p>The place you're looking for doesn't exist.</p>
        <Link href="/uk" className="btn btn-primary">
          Back to UK areas
        </Link>
      </div>
    );
  }

  const nearby = await getNearbyPlaces(place, 12);

  const renderContentBlock = () => {
    switch ((place as any).type) {
      case 'city':
        return <CityContent place={place} />;
      case 'town':
        return <TownContent place={place} />;
      case 'village':
        return <VillageContent place={place} />;
      default:
        return <TownContent place={place} />;
    }
  };

  return (
    <main className="uk-place-container">
      <JsonLd place={place} nearby={nearby} />

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

      {renderContentBlock()}

      <section className="uk-place-routes">
        <h2>Popular routes from {place.name}</h2>
        <ul className="uk-routes-grid">
          {nearby.slice(0, 6).map((n: any) => (
            <li key={n.slug}>
              <Link href={routeSlug(place, n)}>
                {place.name} → {n.name} removals
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="uk-place-nearby">
        <h3>Nearby areas</h3>
        <ul className="uk-nearby-chips">
          {nearby.map((n: any) => (
            <li key={n.slug}>
              <Link href={`/uk/${n.slug}`}>{n.name}</Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
