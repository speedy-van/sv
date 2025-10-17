# UK Location Pages v2 - Enterprise SEO System

A comprehensive, scalable system for generating high-quality location-based pages across the United Kingdom with enterprise-grade SEO, internal linking, and automated sitemap generation.

## 🎯 Key Features

### Core Functionality

- **Programmatic Page Generation**: Automatically creates pages for cities, towns, villages, boroughs, districts, and neighbourhoods
- **A/B Content Blocks**: Different content based on place type (city/town/village) for uniqueness
- **Region Hubs**: Organized by England/Scotland/Wales for better navigation
- **Autocomplete Search**: Real-time search with prefix matching and fuzzy search
- **Route Pages**: From-to removal pages (e.g., "London to Manchester")

### SEO & Performance

- **SSR/ISR**: Server-side rendering with incremental static regeneration
- **Structured Data**: Complete JSON-LD (Service, BreadcrumbList, FAQPage)
- **OpenGraph Images**: Dynamic OG images generated for each location
- **Canonical URLs**: Smart canonical logic for small places
- **Hreflang**: Proper en-GB language targeting
- **Sitemap System**: Chunked sitemaps with dynamic priorities

### Anti-Doorway Protection

- **Population-based Canonicals**: Small places redirect to parent cities
- **Dynamic Priorities**: Sitemap priorities based on population size
- **Content Variation**: Unique content blocks per place type
- **Link Weighting**: Optional nofollow for small place links

## 🏗️ Architecture

### Data Layer

```
src/data/
├── places.schema.ts          # Zod schema for type safety
├── places.sample.json        # Sample data (replace with ONS/OS data)
└── places.json              # Generated from ingest script
```

### Core Library

```
src/lib/places.ts            # Spatial indexing, nearby calculation, caching
```

### Pages & Routes

```
src/app/
├── uk/
│   ├── page.tsx             # UK index with search
│   └── [place]/
│       ├── page.tsx         # Individual place page
│       └── opengraph-image.tsx # Dynamic OG image
├── routes/
│   └── [from]-to-[to]/
│       └── page.tsx         # Route pages
├── sitemap-index.xml/       # Sitemap index
├── sitemaps/
│   └── [n].xml/            # Chunked sitemaps
└── api/
    ├── places/autocomplete/ # Search API
    └── revalidate-places/   # Cache invalidation
```

### Components

```
src/components/
└── LocationLinks.tsx        # Reusable internal linking widget
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
# or
pnpm install
```

### 2. Run Development Server

```bash
npm run dev
```

### 3. Test the System

```bash
# Test place functionality
npm run test:places

# Build and test
npm run build
npm run test:unit
```

### 4. Access Pages

- UK Index: `/uk`
- Place Pages: `/uk/london`, `/uk/manchester`
- Route Pages: `/routes/london-to-manchester`
- Sitemaps: `/sitemap-index.xml`

## 📊 Data Management

### Current Sample Data

The system includes sample data for 6 UK locations:

- London (City, England)
- Manchester (City, England)
- Glasgow (City, Scotland)
- Edinburgh (City, Scotland)
- Inverness (Town, Scotland)
- Abingdon (Town, England, parent: Oxford)

### Adding Real Data

1. **ONS/OS Integration**: Use the ingest script to process official data
2. **Manual Addition**: Add to `places.sample.json` following the schema
3. **API Integration**: Connect to external data sources

### Data Schema

```typescript
interface UkPlace {
  slug: string; // URL-friendly identifier
  name: string; // Display name
  type: PlaceType; // city|town|village|borough|district|neighbourhood
  county?: string; // Optional county
  region: string; // England|Scotland|Wales|Northern Ireland
  lat: number; // Latitude (-90 to 90)
  lon: number; // Longitude (-180 to 180)
  population?: number; // Population size
  parentSlug?: string; // Parent city for small places
}
```

## 🔧 Configuration

### Environment Variables

```bash
# For cache revalidation
REVALIDATE_TOKEN=your-secure-token

# Base URL for canonical URLs
NEXT_PUBLIC_BASE_URL=https://speedy-van.co.uk
```

### Cache Settings

- **Places Cache**: 24 hours with `places` tag
- **ISR Pages**: Daily regeneration
- **OG Images**: Edge runtime for fast generation

### Sitemap Configuration

- **Chunk Size**: 45,000 URLs per file (safe margin)
- **Priorities**: Dynamic based on population
- **Change Frequency**: Weekly for cities, monthly for towns/villages

## 📈 Performance Features

### Spatial Indexing

- **Bucket System**: 0.5° geographic buckets for O(k) nearby search
- **Haversine Calculation**: Accurate distance calculation
- **Directional Variety**: Balanced north/south/east/west distribution

### Caching Strategy

- **Next.js Cache**: `unstable_cache` with revalidation tags
- **ISR**: Incremental static regeneration for all pages
- **Edge Runtime**: OpenGraph images generated at edge

### Optimization

- **Lazy Loading**: Components load only when needed
- **Minimal JavaScript**: Server-side rendering where possible
- **Image Optimization**: Dynamic OG images with edge runtime

## 🧪 Testing

### Unit Tests

```bash
npm run test:places
```

### Test Coverage

- Schema validation
- Canonical URL logic
- Spatial calculations
- Cache invalidation

### CI/CD Integration

GitHub Actions workflow (`/.github/workflows/seo.yml`) ensures:

- Build success
- Route generation
- Sitemap creation
- Data validation

## 🔄 Maintenance

### Cache Revalidation

```bash
# Manual revalidation
curl -X POST /api/revalidate-places \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Data Updates

1. Update `places.json` or source data
2. Call revalidation endpoint
3. Pages automatically regenerate

### Monitoring

- Check sitemap generation
- Monitor crawl stats
- Verify canonical URLs
- Test internal linking

## 🚨 Anti-Doorway Measures

### Content Uniqueness

- **Type-based Content**: Different content blocks for cities vs towns
- **Dynamic FAQs**: Location-specific questions and answers
- **Variable CTAs**: Context-aware call-to-action buttons

### Link Management

- **Population Thresholds**: Small places get nofollow links
- **Canonical Logic**: Villages redirect to parent cities
- **Sitemap Priorities**: Lower priority for small locations

### Technical Safeguards

- **Schema Validation**: Zod ensures data integrity
- **Coordinate Validation**: Geographic bounds checking
- **Slug Generation**: Safe URL creation

## 🔮 Future Enhancements

### Planned Features

- **Real-time Data**: Live population and boundary updates
- **Advanced Search**: Fuzzy matching and synonyms
- **Analytics Integration**: Track page performance and user behavior
- **A/B Testing**: Content variation testing framework

### Scalability Improvements

- **Database Integration**: Move from JSON to database
- **CDN Integration**: Global content delivery
- **API Rate Limiting**: Protect against abuse
- **Monitoring Dashboard**: Real-time system health

## 📚 API Reference

### Places API

```typescript
// Get all places
GET /api/places

// Search places
GET /api/places/autocomplete?q=london

// Revalidate cache
POST /api/revalidate-places
Authorization: Bearer TOKEN
```

### Sitemap Endpoints

```typescript
// Main sitemap (redirects to index)
GET /sitemap.xml

// Sitemap index
GET /sitemap-index.xml

// Individual sitemap chunks
GET /sitemaps/1.xml
GET /sitemaps/2.xml
```

## 🆘 Troubleshooting

### Common Issues

**Pages not generating**

- Check data file exists and is valid JSON
- Verify schema validation passes
- Check build logs for errors

**Sitemaps not working**

- Ensure routes are properly configured
- Check file permissions
- Verify chunk size configuration

**Cache not updating**

- Verify revalidation token
- Check cache tags are correct
- Monitor revalidation endpoint

**Performance issues**

- Check spatial bucket size
- Monitor memory usage
- Verify ISR settings

### Debug Commands

```bash
# Check data integrity
npm run test:places

# Validate JSON structure
node -e "console.log(JSON.parse(require('fs').readFileSync('src/data/places.sample.json')))"

# Build and analyze
npm run build
npm run analyze
```

## 📞 Support

For technical support or questions about the UK Location Pages system:

1. Check this documentation
2. Review the test suite
3. Examine the CI/CD logs
4. Contact the development team

---

**Version**: 2.0.0  
**Last Updated**: 2025-08-23  
**Maintainer**: Speedy Van Technical Team

---

## 👥 Development Team

* **Lead Developer:** *Mr. Ahmad Alwakai*
* **Team:** *Speedy Van Technical Team* (internal full-stack engineers, backend specialists, and mobile developers)
* **Core Stack:** Next.js, Node.js, TypeScript, Prisma, PostgreSQL, Expo (React Native), Chakra UI
* **Infrastructure:** Neon (PostgreSQL), Render (hosting), Stripe (payments), Pusher (real-time), ZeptoMail (email)

**Support:** support@speedy-van.co.uk | +44 7901 846297
