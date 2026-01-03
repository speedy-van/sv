import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  getPlaceBySlug,
  getNearbyPlaces,
  canonicalFor,
  getAllPlaces,
  routeSlug,
} from '@/lib/places';
import { APP_BASE_URL, BRAND_NAME } from '@/lib/seo/constants';
import '@/styles/uk-place-pages.css';
import { FaTruck, FaShieldAlt, FaClock, FaStar, FaMapMarkerAlt, FaRoute, FaCheckCircle, FaPhone, FaArrowRight } from 'react-icons/fa';
import Header from '@/components/site/Header';
import MobileHeader from '@/components/mobile/MobileHeader';

// ✅ Force Node runtime for dynamic rendering
export const runtime = 'nodejs';

// CRITICAL: Use ISR with on-demand generation instead of pre-rendering all 700+ pages
// This prevents Render build timeouts by only generating pages when first requested
export const revalidate = 86400; // 24h ISR - pages are cached after first request

// CRITICAL: Allow ALL params to be handled dynamically
// Do NOT pre-render any pages at build time to avoid Render timeout
export const dynamicParams = true;

// CRITICAL FIX: Return EMPTY array to prevent pre-rendering 700+ pages at build time
// Pages will be generated on-demand (ISR) when first requested
// This is the key fix for Render deployment timeouts
export async function generateStaticParams() {
  // Return empty array - all pages will be generated on-demand via ISR
  // This prevents the build from trying to generate 700+ static pages
  return [];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ place: string }>;
}): Promise<Metadata> {
  const { place: placeSlug } = await params;
  const place = await getPlaceBySlug(placeSlug);
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
    <div className="place-content-card city-content">
      <div className="content-icon">🏙️</div>
      <h2>Major City Removals in {place.name}</h2>
      <p>
        As one of the UK&apos;s largest cities, {place.name} offers extensive removal
        services with our network of professional movers covering all postcodes.
      </p>
      <ul className="feature-list">
        <li><FaCheckCircle className="check-icon" /> Same-day collection across {place.name}</li>
        <li><FaCheckCircle className="check-icon" /> Storage solutions for city living</li>
        <li><FaCheckCircle className="check-icon" /> Packing and unpacking services</li>
        <li><FaCheckCircle className="check-icon" /> Furniture assembly and disassembly</li>
      </ul>
    </div>
  );
}

function TownContent({ place }: { place: any }) {
  return (
    <div className="place-content-card town-content">
      <div className="content-icon">🏘️</div>
      <h2>Local Town Removals in {place.name}</h2>
      <p>
        Trusted local removal services in {place.name} and surrounding villages.
        We know the area and provide reliable, affordable moving solutions.
      </p>
      <ul className="feature-list">
        <li><FaCheckCircle className="check-icon" /> Local area expertise</li>
        <li><FaCheckCircle className="check-icon" /> Flexible scheduling</li>
        <li><FaCheckCircle className="check-icon" /> Competitive local rates</li>
        <li><FaCheckCircle className="check-icon" /> Community-focused service</li>
      </ul>
    </div>
  );
}

function VillageContent({ place }: { place: any }) {
  return (
    <div className="place-content-card village-content">
      <div className="content-icon">🏡</div>
      <h2>Village Removals in {place.name}</h2>
      <p>
        Personalized removal services for {place.name} and nearby areas. We
        understand rural moving challenges and provide tailored solutions.
      </p>
      <ul className="feature-list">
        <li><FaCheckCircle className="check-icon" /> Rural area navigation</li>
        <li><FaCheckCircle className="check-icon" /> Flexible access arrangements</li>
        <li><FaCheckCircle className="check-icon" /> Local knowledge and connections</li>
        <li><FaCheckCircle className="check-icon" /> Personalized service</li>
      </ul>
    </div>
  );
}

// Trust badges component
function TrustBadges() {
  return (
    <div className="trust-badges">
      <div className="trust-badge">
        <FaShieldAlt className="badge-icon shield" />
        <span>Fully Insured</span>
      </div>
      <div className="trust-badge">
        <FaStar className="badge-icon star" />
        <span>5-Star Rated</span>
      </div>
      <div className="trust-badge">
        <FaClock className="badge-icon clock" />
        <span>24/7 Support</span>
      </div>
    </div>
  );
}

// Stats component
function PlaceStats({ place }: { place: any }) {
  return (
    <div className="place-stats">
      <div className="stat-card">
        <div className="stat-number">500+</div>
        <div className="stat-label">Moves in {place.name}</div>
      </div>
      <div className="stat-card">
        <div className="stat-number">4.9</div>
        <div className="stat-label">Customer Rating</div>
      </div>
      <div className="stat-card">
        <div className="stat-number">30min</div>
        <div className="stat-label">Avg Response</div>
      </div>
      <div className="stat-card">
        <div className="stat-number">£25</div>
        <div className="stat-label">From /hour</div>
      </div>
    </div>
  );
}

export default async function PlacePage({
  params,
}: {
  params: Promise<{ place: string }>;
}) {
  const { place: placeSlug } = await params;
  const place = await getPlaceBySlug(placeSlug);
  if (!place) {
    notFound();
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
    <main className="uk-place-container enhanced">
      <Header />
      <MobileHeader />
      <JsonLd place={place} nearby={nearby} />

      {/* Hero Section */}
      <section className="uk-place-hero enhanced-hero">
        <div className="hero-background">
          <div className="hero-gradient"></div>
          <div className="hero-particles"></div>
        </div>
        <div className="hero-content">
          <div className="location-badge">
            <FaMapMarkerAlt className="location-icon" />
            <span>{place.name}, UK</span>
          </div>
          <h1>
            <span className="title-line">Man and Van in</span>
            <span className="title-highlight">{place.name}</span>
          </h1>
          <p className="hero-description">
            Fast, insured removals in {place.name} and surrounding areas.
            Transparent pricing and real-time tracking for your peace of mind.
          </p>
          <TrustBadges />
          <div className="uk-place-cta">
            <Link className="btn btn-primary btn-glow" href="/booking-luxury">
              <FaTruck className="btn-icon" />
              Get Instant Quote
              <FaArrowRight className="btn-arrow" />
            </Link>
            <Link className="btn btn-secondary" href="/how-it-works">
              How it works
            </Link>
            <a className="btn btn-call" href="tel:+441202129746">
              <FaPhone className="btn-icon" />
              Call Now
            </a>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <PlaceStats place={place} />

      {/* Content Block */}
      {renderContentBlock()}

      {/* Popular Routes Section */}
      <section className="uk-place-routes enhanced-routes">
        <div className="section-header">
          <FaRoute className="section-icon" />
          <h2>Popular Routes from {place.name}</h2>
          <p className="section-subtitle">Most requested moving destinations</p>
        </div>
        <ul className="uk-routes-grid">
          {nearby.slice(0, 6).map((n: any, index: number) => (
            <li key={n.slug} className="route-card" style={{ animationDelay: `${index * 0.1}s` }}>
              <Link href={routeSlug(place, n)}>
                <div className="route-from">{place.name}</div>
                <div className="route-arrow">→</div>
                <div className="route-to">{n.name}</div>
                <span className="route-label">View route</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Nearby Areas Section */}
      <section className="uk-place-nearby enhanced-nearby">
        <div className="section-header">
          <FaMapMarkerAlt className="section-icon" />
          <h3>Nearby Areas We Cover</h3>
        </div>
        <ul className="uk-nearby-chips">
          {nearby.map((n: any, index: number) => (
            <li key={n.slug} style={{ animationDelay: `${index * 0.05}s` }}>
              <Link href={`/uk/${n.slug}`}>
                <FaMapMarkerAlt className="chip-icon" />
                {n.name}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* CTA Section */}
      <section className="uk-place-final-cta">
        <div className="cta-content">
          <h2>Ready to Move in {place.name}?</h2>
          <p>Get your instant quote now. No hidden fees, no surprises.</p>
          <Link className="btn btn-primary btn-large btn-glow" href="/booking-luxury">
            Get Your Free Quote
            <FaArrowRight className="btn-arrow" />
          </Link>
        </div>
      </section>
    </main>
  );
}
