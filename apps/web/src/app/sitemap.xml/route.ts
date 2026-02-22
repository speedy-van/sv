import { NextResponse } from 'next/server';
import { APP_BASE_URL } from '@/lib/seo/constants';

export async function GET() {
  const baseUrl = APP_BASE_URL;
  const currentDate = new Date().toISOString().split('T')[0];

  // Complete UK cities and regions for location-based SEO
  const ukRegions = [
    // Countries
    'england', 'scotland', 'wales',
    
    // Major Cities - England
    'london', 'birmingham', 'manchester', 'liverpool', 'leeds', 'sheffield', 
    'bristol', 'newcastle-upon-tyne', 'nottingham', 'leicester', 'southampton', 
    'portsmouth', 'coventry', 'bradford', 'stoke-on-trent', 'wolverhampton', 
    'derby', 'plymouth', 'hull', 'sunderland', 'york', 'cambridge', 'oxford', 
    'exeter', 'canterbury', 'carlisle', 'lancaster', 'chester', 'bath', 'durham', 
    'middlesbrough', 'brighton-hove', 'bournemouth', 'milton-keynes', 'reading', 
    'luton', 'swindon', 'watford', 'bolton', 'stockport', 'oldham', 'rochdale', 
    'wigan', 'warrington', 'blackpool', 'southend-on-sea', 'maidstone', 
    'guildford', 'basingstoke', 'chelmsford', 'ipswich', 'colchester',
    
    // Scotland
    'edinburgh', 'glasgow', 'aberdeen', 'dundee', 'inverness', 'stirling', 
    'perth', 'paisley',
    
    // Wales  
    'cardiff', 'swansea', 'newport', 'wrexham', 'bangor', 'st-davids',
    
    // Notable Towns
    'shrewsbury', 'telford', 'torquay', 'scarborough', 'hastings', 'harrogate'
  ];

  // Actual blog post slugs (routes that exist under /blog)
  const blogPostSlugs = [
    'moving-to-london-guide', 'ultimate-london-moving-guide', 'professional-packing-tips',
    'student-moving-service', 'same-day-man-and-van', 'cheap-man-and-van-near-me'
  ];

  const urls = [
    // Main pages
    {
      url: `${baseUrl}/`,
      lastmod: currentDate,
      changefreq: 'daily',
      priority: '1.0'
    },
    // High-priority SEO landing pages
    {
      url: `${baseUrl}/man-and-van/london`,
      lastmod: currentDate,
      changefreq: 'weekly',
      priority: '0.95'
    },
    {
      url: `${baseUrl}/furniture-removal`,
      lastmod: currentDate,
      changefreq: 'weekly',
      priority: '0.95'
    },
    {
      url: `${baseUrl}/furniture-movers`,
      lastmod: currentDate,
      changefreq: 'weekly',
      priority: '0.95'
    },
    {
      url: `${baseUrl}/van-hire`,
      lastmod: currentDate,
      changefreq: 'weekly',
      priority: '0.95'
    },
    // Marketplace & Collection SEO Pages (High Intent)
    {
      url: `${baseUrl}/facebook-marketplace-delivery`,
      lastmod: currentDate,
      changefreq: 'weekly',
      priority: '0.95'
    },
    {
      url: `${baseUrl}/gumtree-pickup-delivery`,
      lastmod: currentDate,
      changefreq: 'weekly',
      priority: '0.95'
    },
    {
      url: `${baseUrl}/furniture-collection-delivery`,
      lastmod: currentDate,
      changefreq: 'weekly',
      priority: '0.95'
    },
    {
      url: `${baseUrl}/sofa-delivery-service`,
      lastmod: currentDate,
      changefreq: 'weekly',
      priority: '0.95'
    },
    // Location-based delivery routes
    {
      url: `${baseUrl}/delivery/gloucestershire-to-bristol`,
      lastmod: currentDate,
      changefreq: 'weekly',
      priority: '0.9'
    },
    {
      url: `${baseUrl}/delivery/london-to-kent`,
      lastmod: currentDate,
      changefreq: 'weekly',
      priority: '0.9'
    },
    {
      url: `${baseUrl}/delivery/manchester-to-liverpool`,
      lastmod: currentDate,
      changefreq: 'weekly',
      priority: '0.9'
    },
    {
      url: `${baseUrl}/delivery/birmingham-to-coventry`,
      lastmod: currentDate,
      changefreq: 'weekly',
      priority: '0.9'
    },
    {
      url: `${baseUrl}/delivery/glasgow-to-edinburgh`,
      lastmod: currentDate,
      changefreq: 'weekly',
      priority: '0.9'
    },
    {
      url: `${baseUrl}/delivery/leeds-to-sheffield`,
      lastmod: currentDate,
      changefreq: 'weekly',
      priority: '0.9'
    },
    {
      url: `${baseUrl}/delivery/london-to-brighton`,
      lastmod: currentDate,
      changefreq: 'weekly',
      priority: '0.9'
    },
    {
      url: `${baseUrl}/delivery/london-to-oxford`,
      lastmod: currentDate,
      changefreq: 'weekly',
      priority: '0.9'
    },
    {
      url: `${baseUrl}/delivery/cardiff-to-bristol`,
      lastmod: currentDate,
      changefreq: 'weekly',
      priority: '0.9'
    },
    // Marketplace pickup by location
    {
      url: `${baseUrl}/delivery/facebook-marketplace-pickup-london`,
      lastmod: currentDate,
      changefreq: 'weekly',
      priority: '0.9'
    },
    {
      url: `${baseUrl}/delivery/facebook-marketplace-pickup-manchester`,
      lastmod: currentDate,
      changefreq: 'weekly',
      priority: '0.9'
    },
    {
      url: `${baseUrl}/delivery/facebook-marketplace-pickup-birmingham`,
      lastmod: currentDate,
      changefreq: 'weekly',
      priority: '0.9'
    },
    {
      url: `${baseUrl}/delivery/gumtree-pickup-bristol`,
      lastmod: currentDate,
      changefreq: 'weekly',
      priority: '0.9'
    },
    {
      url: `${baseUrl}/affordable-man-and-van`,
      lastmod: currentDate,
      changefreq: 'weekly',
      priority: '0.9'
    },
    // Core info & conversion pages
    {
      url: `${baseUrl}/how-it-works`,
      lastmod: currentDate,
      changefreq: 'monthly',
      priority: '0.9'
    },
    {
      url: `${baseUrl}/contact`,
      lastmod: currentDate,
      changefreq: 'monthly',
      priority: '0.9'
    },
    {
      url: `${baseUrl}/pricing`,
      lastmod: currentDate,
      changefreq: 'weekly',
      priority: '0.9'
    },
    {
      url: `${baseUrl}/about`,
      lastmod: currentDate,
      changefreq: 'monthly',
      priority: '0.85'
    },
    {
      url: `${baseUrl}/faq`,
      lastmod: currentDate,
      changefreq: 'monthly',
      priority: '0.85'
    },
    // Core Service Hub
    {
      url: `${baseUrl}/services`,
      lastmod: currentDate,
      changefreq: 'weekly',
      priority: '0.95'
    },
    // Core Service Pages - High Priority
    {
      url: `${baseUrl}/house-removals`,
      lastmod: currentDate,
      changefreq: 'weekly',
      priority: '0.95'
    },
    {
      url: `${baseUrl}/single-item-delivery`,
      lastmod: currentDate,
      changefreq: 'weekly',
      priority: '0.95'
    },
    {
      url: `${baseUrl}/same-day-delivery`,
      lastmod: currentDate,
      changefreq: 'weekly',
      priority: '0.95'
    },
    {
      url: `${baseUrl}/student-moves`,
      lastmod: currentDate,
      changefreq: 'weekly',
      priority: '0.9'
    },
    {
      url: `${baseUrl}/office-removals`,
      lastmod: currentDate,
      changefreq: 'weekly',
      priority: '0.9'
    },
    {
      url: `${baseUrl}/storage-services`,
      lastmod: currentDate,
      changefreq: 'weekly',
      priority: '0.9'
    },
    {
      url: `${baseUrl}/multi-stop-delivery`,
      lastmod: currentDate,
      changefreq: 'weekly',
      priority: '0.9'
    },
    {
      url: `${baseUrl}/assembly-service`,
      lastmod: currentDate,
      changefreq: 'weekly',
      priority: '0.9'
    },
    // Service pages
    {
      url: `${baseUrl}/services/furniture`,
      lastmod: currentDate,
      changefreq: 'weekly',
      priority: '0.9'
    },
    {
      url: `${baseUrl}/services/house-moving`,
      lastmod: currentDate,
      changefreq: 'weekly',
      priority: '0.9'
    },
    {
      url: `${baseUrl}/services/office`,
      lastmod: currentDate,
      changefreq: 'weekly',
      priority: '0.85'
    },
    {
      url: `${baseUrl}/services/student`,
      lastmod: currentDate,
      changefreq: 'weekly',
      priority: '0.85'
    },
    // Location pages
    {
      url: `${baseUrl}/uk/london`,
      lastmod: currentDate,
      changefreq: 'weekly',
      priority: '0.9'
    },
    // Booking and core pages
    {
      url: `${baseUrl}/booking-luxury`,
      lastmod: currentDate,
      changefreq: 'weekly',
      priority: '0.8'
    },
    {
      url: `${baseUrl}/driver/application`,
      lastmod: currentDate,
      changefreq: 'monthly',
      priority: '0.7'
    },
    // UK region pages
    ...ukRegions.map(region => ({
      url: `${baseUrl}/uk/${region}`,
      lastmod: currentDate,
      changefreq: 'weekly',
      priority: '0.9'
    })),
    // Blog pages
    {
      url: `${baseUrl}/blog`,
      lastmod: currentDate,
      changefreq: 'weekly',
      priority: '0.7'
    },
    ...blogPostSlugs.map(slug => ({
      url: `${baseUrl}/blog/${slug}`,
      lastmod: currentDate,
      changefreq: 'monthly',
      priority: '0.6'
    })),
    {
      url: `${baseUrl}/track`,
      lastmod: currentDate,
      changefreq: 'monthly',
      priority: '0.7'
    },
    {
      url: `${baseUrl}/van-hire-near-me`,
      lastmod: currentDate,
      changefreq: 'weekly',
      priority: '0.9'
    }
  ];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${urls.map(({ url, lastmod, changefreq, priority }) => `  <url>
    <loc>${url}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  return new NextResponse(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600'
    }
  });
}