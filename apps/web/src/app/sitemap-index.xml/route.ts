import { getAllPlaces } from '@/lib/places';

// Force Node runtime for SSG/ISR compatibility
export const runtime = 'nodejs';
export const dynamic = 'force-static';
export const revalidate = 86400;

const BASE = 'https://speedy-van.co.uk';
const CHUNK = 45000; // safe margin

export async function GET() {
  const places = await getAllPlaces();
  const chunks = Math.max(1, Math.ceil(places.length / CHUNK));

  const urls = Array.from(
    { length: chunks },
    (_, i) => `<sitemap><loc>${BASE}/sitemaps/${i + 1}.xml</loc></sitemap>`
  ).join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
  <sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</sitemapindex>`;

  return new Response(xml, { headers: { 'Content-Type': 'application/xml' } });
}
