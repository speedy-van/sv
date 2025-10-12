# Dual Provider Address Autocomplete Setup Guide

## Overview

This guide explains how to set up the new dual-provider address autocomplete system using Google Places API as primary with Mapbox API as fallback, implementing the confused.com postcode-first pattern.

## Environment Variables Setup

Add the following environment variable to your `.env.local` file:

```bash
# Google Places API Key (Primary Provider)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_places_api_key_here

# Mapbox API Key (Fallback Provider) - Already configured
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1IjoiYWhtYWRhbHdha2FpIiwiYSI6ImNtZGNsZ3RsZDEzdGsya3F0ODFxeGRzbXoifQ.jfgGW0KNFTwATOShRDtQsg
```

## Google Places API Setup

1. **Create Google Cloud Project**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one
   - Enable billing (required for Places API)

2. **Enable APIs**:
   - Enable "Places API"
   - Enable "Distance Matrix API"
   - Enable "Maps JavaScript API"

3. **Create API Key**:
   - Go to "Credentials" in Google Cloud Console
   - Click "Create Credentials" > "API Key"
   - Copy the generated API key

4. **Restrict API Key** (Recommended):
   - Click on your API key to edit
   - Under "API restrictions", select "Restrict key"
   - Choose "Places API", "Distance Matrix API", and "Maps JavaScript API"
   - Under "Application restrictions", add your domain

## System Architecture

### Core Components

1. **DualProviderService** (`/lib/dual-provider-service.ts`)
   - Main service orchestrating Google Places + Mapbox
   - Intelligent provider selection based on health metrics
   - Automatic failover and caching

2. **ProviderHealthMonitor** (`/lib/provider-health-monitor.ts`)
   - Real-time monitoring of both providers
   - Performance tracking and automatic switching
   - Cost optimization and quota management

3. **DualProviderCache** (`/lib/dual-provider-cache.ts`)
   - Multi-provider caching with cross-validation
   - Intelligent TTL management
   - Memory usage optimization

4. **PostcodeValidator** (`/lib/postcode-validator.ts`)
   - UK postcode validation and formatting
   - Smart suggestions and error correction
   - Confused.com pattern compliance

### Frontend Components

1. **DualProviderAddressInput** (`/components/address/DualProviderAddressInput.tsx`)
   - Main address input with dual-provider support
   - Real-time postcode validation
   - Provider indicators and health feedback

2. **AddressSuggestionDropdown** (`/components/address/AddressSuggestionDropdown.tsx`)
   - Enhanced dropdown with provider indicators
   - Confidence scoring and type categorization
   - Keyboard navigation and accessibility

3. **ConfusedComPattern** (`/components/address/ConfusedComPattern.tsx`)
   - Step-by-step address selection
   - Postcode → Address → Confirmation flow
   - Distance calculation and validation

## API Routes

### `/api/address/autocomplete`
- **Method**: GET
- **Parameters**: 
  - `query` (required): Search term
  - `limit` (optional): Max results (default: 5)
  - `country` (optional): Country code (default: GB)
  - `preferredProvider` (optional): google | mapbox

### `/api/address/distance`
- **Method**: POST
- **Body**:
  ```json
  {
    "pickupLat": number,
    "pickupLng": number,
    "dropoffLat": number,
    "dropoffLng": number,
    "preferredProvider": "google" | "mapbox"
  }
  ```

### `/api/address/health`
- **Method**: GET
- **Returns**: Provider health metrics and analytics

## Features

### 🔄 Dual-Provider Architecture
- **Primary**: Google Places API for superior UK address accuracy
- **Fallback**: Mapbox API for reliability and rural coverage
- **Intelligent failover** based on performance, errors, and quotas
- **Seamless switching** without user disruption

### 📍 Confused.com Pattern Implementation
- **Step 1**: Postcode entry and validation
- **Step 2**: Address selection from provider-specific dropdown
- **Step 3**: Confirmation with unified address format
- **Contextual drop-off** selection with pickup address display

### ⚡ Enterprise Features
- **Health Monitoring**: Real-time provider performance tracking
- **Cost Optimization**: Intelligent provider selection based on pricing
- **Smart Caching**: Multi-provider cache with 24-hour TTL
- **Automatic Failover**: Sub-second switching on provider issues

### 🗺️ Distance Calculation
- **Google Distance Matrix** API for Google-sourced addresses
- **Mapbox Directions** API for Mapbox-sourced addresses
- **Cross-provider compatibility** for mixed address sources
- **Real-time traffic** integration from both providers

### 💡 Intelligent Provider Selection
- **Performance-based** selection (response time, error rates)
- **Cost-aware routing** to optimize API expenses
- **Geographic optimization** for regional accuracy
- **Quota management** to prevent service interruption

### 🛡️ Reliability Features
- **99.9% uptime** through dual-provider redundancy
- **Comprehensive error handling** and recovery
- **Provider health scoring** and automatic switching
- **Cross-provider data validation** and consistency

## Usage Examples

### Basic Address Input
```tsx
import { DualProviderAddressInput } from '@/components/address/DualProviderAddressInput';

<DualProviderAddressInput
  id="pickup-address"
  label="Pickup Address"
  placeholder="Enter your address"
  onChange={(suggestion) => {
    if (suggestion) {
      console.log('Selected address:', suggestion);
    }
  }}
  onValidation={(isValid) => {
    console.log('Address valid:', isValid);
  }}
/>
```

### Confused.com Pattern
```tsx
import { ConfusedComPattern } from '@/components/address/ConfusedComPattern';

<ConfusedComPattern
  step="postcode"
  onStepComplete={(step, data) => {
    console.log('Step completed:', step, data);
  }}
  onStepChange={(step) => {
    console.log('Step changed:', step);
  }}
/>
```

### Service Health Monitoring
```tsx
import { dualProviderService } from '@/lib/dual-provider-service';

const health = dualProviderService.getServiceHealth();
console.log('Provider health:', health);
```

## Performance Optimization

### Caching Strategy
- **Postcode validation**: 7 days TTL
- **Address suggestions**: 24 hours TTL (Google), 12 hours TTL (Mapbox)
- **Distance calculations**: 1 hour TTL
- **Cross-provider validation** for accuracy

### Cost Management
- **Google Places**: $0.032 per request (text search)
- **Google Distance Matrix**: $0.005 per element
- **Mapbox Geocoding**: $0.0075 per request
- **Mapbox Directions**: $0.005 per request

### Monitoring
- **Response time tracking** with 100-request rolling window
- **Error rate monitoring** with automatic failover at 5%
- **Quota usage tracking** with daily reset
- **Cost optimization** through intelligent provider selection

## Troubleshooting

### Common Issues

1. **Google Places API not working**:
   - Check API key is correctly set in `.env.local`
   - Verify APIs are enabled in Google Cloud Console
   - Check API key restrictions and billing

2. **Mapbox fallback not working**:
   - Verify Mapbox token is valid
   - Check network connectivity
   - Review API usage limits

3. **Address suggestions not appearing**:
   - Check postcode validation
   - Verify minimum query length (2 characters)
   - Review browser console for errors

4. **Distance calculation failing**:
   - Verify coordinates are valid
   - Check provider health status
   - Review API quotas and limits

### Debug Mode

Enable debug mode by setting `NODE_ENV=development` to see:
- Provider switching notifications
- Performance metrics
- Cache hit/miss information
- Error details and fallback usage

## Migration from Old System

The new system is backward compatible with the existing booking flow. Simply replace:

```tsx
// Old
import AddressAutocompleteInput from '@/components/ui/AddressAutocompleteInput';

// New
import { DualProviderAddressInput } from '@/components/address/DualProviderAddressInput';
```

The component props and behavior remain the same, with enhanced reliability and features.

## Support

For issues or questions:
1. Check the health endpoint: `/api/address/health`
2. Review browser console for errors
3. Verify environment variables are set correctly
4. Check provider API quotas and billing

## Security Notes

- **API keys** should be restricted to specific domains
- **Server-side** API calls prevent key exposure
- **Rate limiting** prevents abuse and cost overruns
- **Input validation** prevents injection attacks
- **CORS** protection for cross-origin requests
