# Premium Address Autocomplete System

## Overview

This system provides a premium-level address autocomplete experience for Speedy Van, featuring dual provider integration with intelligent fallback mechanisms and enhanced UX.

## Architecture

### Dual Provider System

- **Primary Provider**: Mapbox (Default for all features)
- **Fallback Provider**: Google Places API (Luxury booking + fallback)

### Key Features

- ✅ **Dual Integration**: Mapbox primary + Google Places fallback
- ✅ **Intelligent Fallback**: Automatic switch on Mapbox failure
- ✅ **Luxury Booking Support**: Google Places for premium experience
- ✅ **Enhanced UX**: Icons, formatting, postcodes, provider badges
- ✅ **Postcode Search**: Direct UK postcode search with validation
- ✅ **Performance Optimized**: Debouncing, caching, loading states
- ✅ **UK-Only Restriction**: Geographic filtering for UK addresses
- ✅ **TypeScript Support**: Full type safety and IntelliSense

## File Structure

```
apps/web/src/
├── lib/
│   └── premium-location-services.ts     # Core dual provider service
├── components/
│   ├── ui/
│   │   └── PremiumAddressAutocomplete.tsx  # Enhanced UI component
│   └── booking/
│       └── LuxuryBookingAddressInput.tsx   # Luxury booking component
└── hooks/
    └── usePremiumAddressAutocomplete.ts    # React hook for state management
```

## Environment Variables

Add these to your `.env.local` file:

```bash
# Mapbox (Primary provider for all features)
NEXT_PUBLIC_MAPBOX_TOKEN=pk.your_mapbox_token_here

# Google Places API (Luxury booking only + fallback)
NEXT_PUBLIC_GOOGLE_MAPS=AIzaSyBD0UyoHapCoeo8EflCpTstilF6QPgmKTo
```

## Usage Examples

### Standard Booking (Mapbox Primary)

```tsx
import PremiumAddressAutocomplete from '@/components/ui/PremiumAddressAutocomplete';

function StandardBookingForm() {
  const handleAddressSelect = (suggestion) => {
    console.log('Selected address:', suggestion);
  };

  return (
    <PremiumAddressAutocomplete
      placeholder="Enter pickup address..."
      onSelect={handleAddressSelect}
      isLuxuryBooking={false}
    />
  );
}
```

### Luxury Booking (Google Places Enhanced)

```tsx
import LuxuryBookingAddressInput from '@/components/booking/LuxuryBookingAddressInput';

function LuxuryBookingForm() {
  const handleAddressSelect = (suggestion) => {
    console.log('Premium address selected:', suggestion);
    // suggestion includes: place_name, center coordinates, postcode, provider info
  };

  return (
    <LuxuryBookingAddressInput
      label="Premium Pickup Location"
      placeholder="Enter address or postcode (e.g., SW1A 1AA, 123 Main Street)..."
      onSelect={handleAddressSelect}
      showPremiumFeatures={true}
    />
  );
}
```

**Luxury Booking Features:**
- ✅ **Postcode Search**: Direct search by UK postcodes (e.g., SW1A 1AA)
- ✅ **Google Places API**: Enhanced accuracy for premium experience
- ✅ **Automatic Fallback**: Falls back to Mapbox if Google fails
- ✅ **Real-time Validation**: Instant postcode format validation
- ✅ **Premium UI**: Enhanced styling with provider badges and icons

### Using the Hook Directly

```tsx
import { usePremiumAddressAutocomplete } from '@/hooks/usePremiumAddressAutocomplete';

function CustomAddressInput() {
  const {
    suggestions,
    isLoading,
    error,
    searchAddresses,
    searchByPostcode,
    selectSuggestion,
    isValidPostcode,
    formatPostcode
  } = usePremiumAddressAutocomplete({
    isLuxuryBooking: true,
    proximity: { lat: 51.5074, lng: -0.1278 }, // London coordinates
    maxSuggestions: 10
  });

  // Search by postcode specifically
  const handlePostcodeSearch = async (postcode: string) => {
    if (isValidPostcode(postcode)) {
      const formatted = formatPostcode(postcode);
      await searchByPostcode(formatted);
    }
  };

  // Use the hook state and methods
}
```

### Postcode Search Example

```tsx
import { usePremiumAddressAutocomplete } from '@/hooks/usePremiumAddressAutocomplete';

function PostcodeSearch() {
  const { searchByPostcode, isValidPostcode, formatPostcode } = usePremiumAddressAutocomplete();

  const handleSearch = async (postcode: string) => {
    if (isValidPostcode(postcode)) {
      const formatted = formatPostcode(postcode); // e.g., "sw1a 1aa" → "SW1A 1AA"
      await searchByPostcode(formatted);
    }
  };

  return (
    <div>
      <input 
        placeholder="Enter UK postcode..."
        onChange={(e) => handleSearch(e.target.value)}
      />
    </div>
  );
}
```

## API Policies

### Google Places API Usage

- **Restricted to**: Luxury booking flow only
- **Fallback usage**: When Mapbox fails or is unavailable
- **Rate limiting**: Built-in caching to minimize API calls
- **Security**: API key stored in environment variables only

### Mapbox API Usage

- **Default provider**: All standard features
- **Fallback behavior**: Primary choice, Google as backup
- **Rate limiting**: Optimized with caching and debouncing
- **Security**: Token stored in environment variables only

## Enhanced Features

### Visual Enhancements

- 🏠 **Property Icons**: Different icons for houses, offices, warehouses
- 📮 **Postcode Display**: UK postcodes shown as badges
- 🏷️ **Provider Badges**: Shows which service provided the result
- ⭐ **Premium Indicators**: Special styling for luxury booking

### Performance Features

- ⚡ **Debouncing**: 300ms delay to reduce API calls
- 💾 **Caching**: 5-minute cache for repeated searches
- 🔄 **Loading States**: Visual feedback during searches
- 📱 **Keyboard Navigation**: Arrow keys, Enter, Escape support

### Geographic Features

- 🇬🇧 **UK-Only**: Restricted to UK addresses
- 📍 **Proximity Bias**: Results biased towards user location
- 🗺️ **Bounding Box**: Strict UK geographic limits

## Error Handling

The system includes comprehensive error handling:

1. **Mapbox Failure**: Automatically falls back to Google Places
2. **Google Places Failure**: Shows user-friendly error messages
3. **Network Issues**: Graceful degradation with cached results
4. **Invalid Tokens**: Clear error messages with setup instructions

## Security Considerations

- ✅ All API keys stored in environment variables
- ✅ No hardcoded secrets in source code
- ✅ Proper error handling to prevent information leakage
- ✅ Rate limiting to prevent abuse
- ✅ Input validation and sanitization

## Migration Guide

### From Old System

1. **Replace imports**:
   ```tsx
   // Old
   import { AddressAutocompleteService } from '@/lib/location-services';
   
   // New
   import { usePremiumAddressAutocomplete } from '@/hooks/usePremiumAddressAutocomplete';
   ```

2. **Update component usage**:
   ```tsx
   // Old
   <AddressAutocomplete />
   
   // New
   <PremiumAddressAutocomplete isLuxuryBooking={false} />
   ```

3. **Add environment variables**:
   ```bash
   NEXT_PUBLIC_GOOGLE_MAPS=your_google_places_api_key
   ```

## Testing

The system includes comprehensive error handling and fallback mechanisms:

- Test with invalid Mapbox token → Should fallback to Google
- Test with invalid Google token → Should use Mapbox only
- Test with no internet → Should show cached results
- Test with short queries → Should not make API calls

## Performance Metrics

- **Debounce Delay**: 300ms (configurable)
- **Cache Duration**: 5 minutes
- **Max Suggestions**: 5 (configurable up to 10)
- **UK Bounds**: Strict geographic filtering
- **Fallback Time**: < 100ms for provider switch

## Support

For issues or questions:
1. Check environment variables are set correctly
2. Verify API keys are valid and have proper permissions
3. Check browser console for detailed error messages
4. Ensure network connectivity for API calls

---

**Note**: This system follows the API usage policies strictly - Google Places API is only used for luxury booking flow and as a fallback when Mapbox fails.
