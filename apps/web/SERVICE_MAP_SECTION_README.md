# Service Map Section - Homepage Enhancement

## Overview

The ServiceMapSection component has been successfully added to the Speedy Van homepage, providing an SEO-friendly interactive service map showing UK coverage areas.

## Features Implemented

### 1. Interactive Mapbox Map

- **Dark Style**: Uses `mapbox://styles/mapbox/dark-v11` for the neon dark theme
- **UK Coverage**: Centered on UK with zoom level 5.5 for optimal view
- **City Markers**: Interactive markers for 13 major UK cities with neon blue styling
- **Hover Effects**: Markers scale and glow on hover for better user interaction

### 2. SEO Optimization

- **JSON-LD Structured Data**: Automatically injected with LocalBusiness schema
- **Area Served**: Includes all major UK cities for search engine recognition
- **Rich Snippets**: Optimized for Google and other search engines

### 3. Responsive Design

- **Mobile-First**: Responsive heights (300px mobile, 400px tablet, 500px desktop)
- **Neon Dark Theme**: Follows Speedy Van's design system with neon blue accents
- **Border Glow**: Subtle neon glow effect around the map container

### 4. Content Integration

- **Prominent Placement**: Positioned right below the hero section for maximum visibility
- **Service Cities Overlay**: Information panel showing all covered cities
- **Descriptive Text**: SEO-optimized content describing nationwide coverage

## Technical Implementation

### Component Location

- **File**: `apps/web/src/components/ServiceMapSection.tsx`
- **Integration**: Added to `apps/web/src/app/(public)/HomePageContent.tsx`
- **Position**: Between HeroMessage and Features sections

### Dependencies

- **Mapbox GL JS**: Already available in package.json
- **Chakra UI**: Uses existing theme tokens and components
- **Environment**: Requires `NEXT_PUBLIC_MAPBOX_TOKEN`

### CSS Integration

- **Global Styles**: Mapbox CSS imported in `globals.css`
- **Custom Styling**: Neon theme integration with border radius and glow effects
- **Control Hiding**: Mapbox controls hidden for cleaner appearance

## Environment Setup

### Required Environment Variable

```bash
NEXT_PUBLIC_MAPBOX_TOKEN="your_mapbox_public_token_here"
```

### Mapbox Account Setup

1. Create account at [mapbox.com](https://mapbox.com)
2. Generate public access token
3. Add to `.env.local` file
4. Ensure token has appropriate permissions for map display

## Cities Covered

The map displays service coverage for the following UK cities:

- London, Manchester, Birmingham
- Glasgow, Edinburgh, Leeds
- Liverpool, Sheffield, Newcastle
- Nottingham, Bristol, Cardiff
- Inverness

## Performance Considerations

- **Lazy Loading**: Map only initializes when component mounts
- **Efficient Markers**: Lightweight DOM elements for city markers
- **Cleanup**: Proper map instance cleanup on component unmount
- **Bundle Size**: No additional dependencies added

## Future Enhancements

- **Route Visualization**: Show service routes between cities
- **Real-time Updates**: Live driver locations and availability
- **Interactive Features**: Click markers for city-specific information
- **Animation**: Smooth transitions and loading states

## Testing

- **Build Success**: ✅ TypeScript compilation passes
- **Responsive Design**: ✅ Mobile, tablet, and desktop layouts
- **Theme Integration**: ✅ Neon dark design system compliance
- **SEO Ready**: ✅ Structured data injection working

## Maintenance

- **Mapbox Updates**: Monitor for new map styles and features
- **City Coverage**: Update coordinates when service areas expand
- **Performance**: Monitor map rendering performance on mobile devices
- **SEO**: Regular testing of structured data validation
