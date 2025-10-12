# Speedy Van Enhanced System - Setup Instructions

## Quick Start Guide

This enhanced Speedy Van booking system is production-ready and includes comprehensive improvements for Full House Removal categories, postcode-driven address autocomplete, multiple drops routing, and mobile-optimized user experience.

## System Requirements

The system requires Node.js version 20.x or higher and uses pnpm as the package manager for optimal dependency management. The application is built with Next.js 14.2.33 and TypeScript for maximum reliability and developer experience.

## Installation Process

Begin by installing all project dependencies using pnpm, which provides faster installation and better dependency resolution than npm. The project uses a monorepo structure with multiple packages that are automatically linked during installation.

```bash
# Install all dependencies
pnpm install

# Generate Prisma client
pnpm exec prisma generate
```

## Environment Configuration

Copy the provided environment template and configure the necessary API keys and database connections. The system requires Google Maps API access for address autocomplete and Mapbox tokens for fallback functionality.

```bash
# Copy environment template
cp env.example .env.local
```

Configure the following essential environment variables in your `.env.local` file:

```env
# Google Maps API (Primary address provider)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# Mapbox API (Fallback address provider)
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_access_token

# Database connection
DATABASE_URL=your_postgresql_database_url

# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Database Setup

The system uses Prisma ORM for database management with PostgreSQL as the primary database. Run the database migrations to set up the required tables and relationships.

```bash
# Run database migrations
pnpm exec prisma migrate dev

# Seed initial data (optional)
pnpm exec prisma db seed
```

## Development Server

Start the development server to begin working with the enhanced system. The server includes hot reloading and comprehensive error reporting for optimal development experience.

```bash
# Start development server
pnpm dev

# Server will be available at http://localhost:3000
```

## Production Build

Create an optimized production build that includes all enhancements and performance optimizations. The build process includes TypeScript compilation, bundle optimization, and static asset generation.

```bash
# Create production build
pnpm build

# Start production server
pnpm start
```

## Key Features Verification

After setup, verify that the enhanced features are working correctly by testing the following functionality:

**Full House Removal Categories**: Navigate to the booking page and confirm that 1-6+ bedroom house removal options appear in the item selection with professional icons and enhanced search capabilities.

**Postcode Address Autocomplete**: Test address input fields by entering UK postcodes (e.g., "SW1A 1AA") and verify that structured address suggestions appear with full street, city, and postcode information.

**Multiple Drops Routing**: Access the admin panel to create routes with multiple drop-off points and test the driver notification system with the 5-minute response window.

**Postcode-Based Pricing**: Enter pickup and drop-off addresses using postcodes and confirm that accurate pricing calculations appear with detailed breakdowns including distance, service tier, and VAT.

**Mobile Responsiveness**: Test the booking flow on mobile devices to verify touch-friendly interfaces, proper viewport handling, and cross-browser compatibility.

## API Configuration

The enhanced system integrates with multiple external services for optimal functionality. Ensure proper API access and rate limits are configured for production use.

**Google Places API** requires enabling the Places API, Geocoding API, and Distance Matrix API in your Google Cloud Console. Configure appropriate usage quotas and billing to prevent service interruptions.

**Mapbox API** serves as the fallback provider and requires a valid access token with geocoding and directions permissions. The system automatically switches to Mapbox when Google services are unavailable.

## Performance Optimization

The system includes built-in performance monitoring and optimization features. Enable caching and configure CDN settings for optimal production performance.

**Caching Configuration**: The system uses intelligent caching for postcode searches with 24-hour TTL. Monitor cache hit rates and adjust TTL values based on usage patterns.

**Bundle Optimization**: The production build includes automatic code splitting and tree shaking. Monitor bundle sizes and loading performance using the built-in analytics.

## Security Considerations

Implement proper security measures for production deployment including API key protection, HTTPS enforcement, and input validation.

**Environment Variables**: Never commit API keys or sensitive configuration to version control. Use secure environment variable management in production.

**CORS Configuration**: Configure appropriate CORS policies for your domain and ensure API endpoints are properly secured against unauthorized access.

## Monitoring and Maintenance

The enhanced system includes comprehensive monitoring capabilities for tracking performance, errors, and user experience metrics.

**Health Monitoring**: The system automatically monitors API provider health and switches between Google and Mapbox based on performance metrics. Review health dashboards regularly.

**Error Tracking**: Implement error tracking services to monitor system reliability and user experience issues. The system includes detailed error boundaries and logging.

## Deployment Options

The system supports multiple deployment platforms including Vercel, Netlify, AWS, and traditional hosting providers. Choose the platform that best fits your infrastructure requirements.

**Vercel Deployment**: The system is optimized for Vercel deployment with automatic builds, preview deployments, and edge function support.

**Docker Deployment**: Use the provided Docker configuration for containerized deployments in cloud environments or on-premises infrastructure.

## Support and Troubleshooting

Common issues and their solutions are documented in the troubleshooting section. For additional support, refer to the comprehensive code documentation and error handling systems.

**Build Errors**: Ensure all environment variables are properly configured and API keys have appropriate permissions. Check the build logs for specific error messages.

**API Issues**: Verify API key validity and quota limits. The system includes automatic fallback mechanisms but requires valid credentials for both providers.

**Performance Issues**: Monitor network requests and caching behavior. The system includes performance profiling tools for identifying bottlenecks.

This enhanced Speedy Van system represents a significant upgrade in functionality, user experience, and technical capabilities, providing a competitive advantage in the moving services market while maintaining professional standards and reliability.
