// Premium Location Services with Quadruple Provider Support
// Royal Mail PAF (Primary) + Mapbox (Secondary) + Google Places (Luxury Booking + Fallback) + UK Database (Final Fallback)

import { ukAddressDatabase, ukAddressUtils } from './uk-address-database';
import { royalMailPAFService, pafUtils } from './royal-mail-paf-service';

export interface LocationCoordinates {
  lat: number;
  lng: number;
  accuracy?: number;
}

export interface AddressSuggestion {
  id: string;
  text: string;
  place_name: string;
  center: [number, number]; // [lng, lat]
  context: Array<{
    id: string;
    text: string;
    short_code?: string;
  }>;
  properties?: {
    accuracy?: string;
    address?: string;
  };
  bbox?: [number, number, number, number];
  // Enhanced fields for premium experience
  icon?: string;
  type?: string;
  formatted_address?: string;
  postcode?: string;
  provider?: 'mapbox' | 'google';
  // Enhanced address structure
  address?: {
    line1: string;
    line2?: string;
    city: string;
    postcode: string;
    country: string;
    full_address?: string;
  };
  coords?: {
    lat: number;
    lng: number;
  };
  priority?: number;
  isPostcodeMatch?: boolean;
  hasCompleteAddress?: boolean;
  confidence?: number;
}

// Google Places API interfaces
export interface GooglePlacePrediction {
  description: string;
  place_id: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
  types: string[];
}

export interface GooglePlaceDetails {
  place_id: string;
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  address_components: Array<{
    long_name: string;
    short_name: string;
    types: string[];
  }>;
}

export interface GeolocationResult {
  coordinates: LocationCoordinates;
  address?: string;
  accuracy: 'high' | 'medium' | 'low';
  source: 'gps' | 'ip' | 'manual';
}

// Dual provider configuration for premium autocomplete experience
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || 'pk.eyJ1IjoiYWhtYWRhbHdha2FpIiwiYSI6ImNtZGNsZ3RsZDEzdGsya3F0ODFxeGRzbXoifQ.jfgGW0KNFTwATOShRDtQsg';
const GOOGLE_PLACES_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

// API endpoints
const MAPBOX_GEOCODING_URL = 'https://api.mapbox.com/geocoding/v5/mapbox.places';
const GOOGLE_PLACES_AUTOCOMPLETE_URL = 'https://maps.googleapis.com/maps/api/place/autocomplete/json';
const GOOGLE_PLACES_DETAILS_URL = 'https://maps.googleapis.com/maps/api/place/details/json';

// Debug configuration
console.log('Premium Location Services Debug:', {
  mapboxToken: MAPBOX_TOKEN ? 'SET' : 'NOT SET',
  googlePlacesKey: GOOGLE_PLACES_API_KEY ? 'SET' : 'NOT SET',
  mapboxTokenLength: MAPBOX_TOKEN.length,
  mapboxTokenStart: MAPBOX_TOKEN.substring(0, 10) + '...',
  hasFallback: !!GOOGLE_PLACES_API_KEY,
  environment: process.env.NODE_ENV
});

// UK bounds for restricting search results
const UK_BOUNDS = {
  southwest: { lat: 49.9, lng: -8.2 },
  northeast: { lat: 60.9, lng: 1.8 },
};

// UK Postcode validation and formatting
const UK_POSTCODE_REGEX = /^[A-Z]{1,2}[0-9R][0-9A-Z]? [0-9][ABD-HJLNP-UW-Z]{2}$/i;

// Debug function to test postcode validation
const debugPostcodeValidation = (postcode: string) => {
  const trimmed = postcode.trim();
  const isValid = UK_POSTCODE_REGEX.test(trimmed);
  console.log(`Postcode validation debug: "${postcode}" -> "${trimmed}" -> ${isValid ? 'VALID' : 'INVALID'}`);
  return isValid;
};

const isValidUKPostcode = (postcode: string): boolean => {
  return UK_POSTCODE_REGEX.test(postcode.trim());
};

const formatUKPostcode = (postcode: string): string => {
  return postcode.trim().toUpperCase().replace(/\s+/g, ' ');
};

// Helper functions for data transformation
const getIconForPlaceType = (types: string[]): string => {
  if (types.includes('premise') || types.includes('street_address')) return '🏠';
  if (types.includes('establishment') || types.includes('point_of_interest')) return '🏢';
  if (types.includes('postal_code')) return '📮';
  if (types.includes('locality') || types.includes('administrative_area_level_1')) return '🏘️';
  return '📍';
};

const getSearchType = (query: string): 'postcode' | 'address' => {
  const trimmedQuery = query.trim();
  const isValidPostcode = isValidUKPostcode(trimmedQuery);
  const searchType = isValidPostcode ? 'postcode' : 'address';
  console.log(`Search type detection: "${query}" -> "${trimmedQuery}" -> ${isValidPostcode ? 'POSTCODE' : 'ADDRESS'} (${searchType})`);
  return searchType;
};

const extractPostcode = (addressComponents: any[]): string => {
  const postcodeComponent = addressComponents.find(component => 
    component.types.includes('postal_code')
  );
  return postcodeComponent?.short_name || '';
};

const convertGooglePlaceToAddressSuggestion = (
  prediction: GooglePlacePrediction,
  details?: GooglePlaceDetails
): AddressSuggestion => {
  const postcode = details ? extractPostcode(details.address_components) : '';
  
  // Enhanced address parsing for Google Places
  let line1 = prediction.structured_formatting.main_text;
  let line2 = '';
  
  if (details) {
    const components = details.address_components || [];
    const streetNumber = components.find((c: any) => c.types.includes('street_number'))?.long_name || '';
    const route = components.find((c: any) => c.types.includes('route'))?.long_name || '';
    const subpremise = components.find((c: any) => c.types.includes('subpremise'))?.long_name || '';
    const premise = components.find((c: any) => c.types.includes('premise'))?.long_name || '';
    
    if (streetNumber && route) {
      line1 = `${streetNumber} ${route}`.trim();
      if (subpremise) {
        line2 = `Flat ${subpremise}`;
      } else if (premise) {
        line2 = premise;
      }
    } else if (route) {
      line1 = route;
      if (streetNumber) {
        line1 = `${streetNumber} ${route}`.trim();
      }
    }
  }
  
  const hasCompleteAddress = !!(line1 && line1.length > 5);
  
  return {
    id: prediction.place_id,
    text: line1,
    place_name: prediction.description,
    center: details ? [details.geometry.location.lng, details.geometry.location.lat] : [0, 0],
    context: [],
    icon: hasCompleteAddress ? '🏠' : getIconForPlaceType(prediction.types),
    type: prediction.types[0] || 'address',
    formatted_address: details?.formatted_address || prediction.description,
    postcode,
    provider: 'google',
    address: {
      line1: line1.trim(),
      line2: line2.trim() || undefined,
      city: details ? extractCity(details.address_components) : '',
      postcode: postcode,
      country: 'GB',
      full_address: details?.formatted_address || prediction.description,
    },
    coords: details ? { lat: details.geometry.location.lat, lng: details.geometry.location.lng } : undefined,
    hasCompleteAddress,
    priority: hasCompleteAddress ? 9 : 6,
    isPostcodeMatch: false,
    confidence: 0.9,
  };
};

// Helper function to extract city from Google address components
const extractCity = (addressComponents: any[]): string => {
  const locality = addressComponents.find((c: any) => c.types.includes('locality'))?.long_name || '';
  const postalTown = addressComponents.find((c: any) => c.types.includes('postal_town'))?.long_name || '';
  const administrativeArea = addressComponents.find((c: any) => c.types.includes('administrative_area_level_2'))?.long_name || '';
  
  return postalTown || locality || administrativeArea || '';
};

// Premium Address Autocomplete Service with Dual Provider Support
export class PremiumAddressAutocompleteService {
  private static instance: PremiumAddressAutocompleteService;
  private debounceTimer: NodeJS.Timeout | null = null;
  private cache = new Map<string, AddressSuggestion[]>();
  private readonly DEBOUNCE_DELAY = 300; // ms
  private readonly CACHE_DURATION = 300000; // 5 minutes

  static getInstance(): PremiumAddressAutocompleteService {
    if (!PremiumAddressAutocompleteService.instance) {
      PremiumAddressAutocompleteService.instance = new PremiumAddressAutocompleteService();
    }
    return PremiumAddressAutocompleteService.instance;
  }

  // Debounced address search with dual provider support
  async searchAddresses(
    query: string,
    options?: {
      proximity?: LocationCoordinates;
      types?: string[];
      limit?: number;
      useGooglePlaces?: boolean; // Flag for luxury booking flow
    }
  ): Promise<AddressSuggestion[]> {
    return new Promise((resolve, reject) => {
      // Clear existing timer
      if (this.debounceTimer) {
        clearTimeout(this.debounceTimer);
      }

      // Set new debounce timer
      this.debounceTimer = setTimeout(async () => {
        try {
          const results = await this.performSearch(query, options);
          resolve(results);
        } catch (error) {
          reject(error);
        }
      }, this.DEBOUNCE_DELAY);
    });
  }

  // Perform the actual search with dual provider support
  private async performSearch(
    query: string,
    options?: {
      proximity?: LocationCoordinates;
      types?: string[];
      limit?: number;
      useGooglePlaces?: boolean; // Flag for luxury booking flow
    }
  ): Promise<AddressSuggestion[]> {
    console.log(`Starting search for: "${query}"`, { options });
    
    if (query.length < 3) {
      console.log(`Query too short: "${query}" (length: ${query.length})`);
      return [];
    }

    // Check cache first
    const cacheKey = this.getCacheKey(query, options);
    const cached = this.cache.get(cacheKey);
    if (cached) {
      console.log(`Using cached results for: "${query}"`);
      return cached;
    }

    // Try Royal Mail PAF first (primary provider for UK addresses)
    if (pafUtils.isValidUKPostcode(query) || this.isUKAddressQuery(query)) {
      try {
        console.log(`Attempting Royal Mail PAF search for: "${query}"`);
        const pafResults = await this.searchWithPAF(query, options);
        console.log(`PAF results: ${pafResults.length} found`);
        if (pafResults.length > 0) {
          this.cache.set(cacheKey, pafResults);
          return pafResults;
        }
      } catch (error) {
        console.warn('PAF search failed, trying Mapbox fallback:', error);
      }
    }

    // Try Mapbox second (secondary provider)
    try {
      console.log(`Attempting Mapbox search for: "${query}"`);
      const mapboxResults = await this.searchWithMapbox(query, options);
      console.log(`Mapbox results: ${mapboxResults.length} found`);
      if (mapboxResults.length > 0) {
        this.cache.set(cacheKey, mapboxResults);
        return mapboxResults;
      }
    } catch (error) {
      console.warn('Mapbox search failed, trying Google Places fallback:', error);
    }

    // Fallback to Google Places if Mapbox fails or for luxury booking
    if (GOOGLE_PLACES_API_KEY && (options?.useGooglePlaces || !MAPBOX_TOKEN)) {
      try {
        console.log(`Attempting Google Places search for: "${query}"`);
        const googleResults = await this.searchWithGooglePlaces(query, options);
        console.log(`Google Places results: ${googleResults.length} found`);
        if (googleResults.length > 0) {
          this.cache.set(cacheKey, googleResults);
          return googleResults;
        }
      } catch (error) {
        console.error('Google Places search also failed:', error);
      }
    }

    // Final fallback to UK address database
    try {
      console.log(`Attempting UK database search for: "${query}"`);
      const databaseResults = await this.searchWithUKDatabase(query, options);
      console.log(`UK database results: ${databaseResults.length} found`);
      if (databaseResults.length > 0) {
        this.cache.set(cacheKey, databaseResults);
        return databaseResults;
      }
    } catch (error) {
      console.error('UK database search also failed:', error);
    }

    console.log(`No results found for: "${query}"`);
    return [];
  }

  // Mapbox search implementation
  private async searchWithMapbox(
    query: string,
    options?: {
      proximity?: LocationCoordinates;
      types?: string[];
      limit?: number;
    }
  ): Promise<AddressSuggestion[]> {
    if (!MAPBOX_TOKEN) {
      throw new Error('Mapbox token not configured');
    }

    const searchType = getSearchType(query);
    const formattedQuery = searchType === 'postcode' ? formatUKPostcode(query) : query;
    console.log(`Mapbox search: query="${query}", type="${searchType}", formatted="${formattedQuery}"`);

    const params = new URLSearchParams({
      access_token: MAPBOX_TOKEN,
      country: 'GB', // Restrict to UK only
      limit: (options?.limit || 5).toString(),
      types: searchType === 'postcode' 
        ? 'postcode' 
        : (options?.types || ['address', 'poi']).join(','),
    });

    // Add proximity if provided
    if (options?.proximity) {
      params.append(
        'proximity',
        `${options.proximity.lng},${options.proximity.lat}`
      );
    }

    // Add bbox to restrict to UK bounds
    params.append(
      'bbox',
      `${UK_BOUNDS.southwest.lng},${UK_BOUNDS.southwest.lat},${UK_BOUNDS.northeast.lng},${UK_BOUNDS.northeast.lat}`
    );

    const url = `${MAPBOX_GEOCODING_URL}/${encodeURIComponent(formattedQuery)}.json?${params}`;
    console.log(`Mapbox API URL: ${url}`);
    const response = await fetch(url);

    if (!response.ok) {
      const errorMessage = response.status === 401 
        ? 'Mapbox token is invalid or expired. Please check your NEXT_PUBLIC_MAPBOX_TOKEN environment variable.'
        : `Mapbox API error: ${response.status}`;
      console.error(`Mapbox API Error: ${errorMessage}`);
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log(`Mapbox API Response:`, { 
      query: formattedQuery, 
      type: searchType, 
      featuresCount: data.features?.length || 0,
      features: data.features?.slice(0, 2) // Show first 2 results for debugging
    });
    return data.features.map((feature: any) => {
      const ctx = feature.context || [];
      const get = (prefix: string) =>
        ctx.find((c: any) => typeof c?.id === 'string' && c.id.startsWith(prefix))?.text || '';

      const postcode = feature.properties?.postcode || get('postcode');
      const city = get('place') || get('locality') || get('district') || feature.properties?.place || '';
      const number = feature.address || '';
      const street = feature.text || '';

      // Build complete address
      let line1 = '';
      let line2 = '';

      if (number && street) {
        line1 = `${number} ${street}`.trim();
      } else if (street) {
        line1 = street;
        if (number) {
          line1 = `${number} ${street}`.trim();
        }
      } else {
        const parts = feature.place_name?.split(',') || [];
        if (parts.length > 0) {
          line1 = parts[0].trim();
        }
      }

      const hasCompleteAddress = !!(number && street && line1.length > 5);

      return {
        id: feature.id,
        text: line1,
        place_name: feature.place_name,
        center: feature.center,
        context: feature.context || [],
        properties: feature.properties,
        bbox: feature.bbox,
        provider: 'mapbox',
        icon: hasCompleteAddress ? '🏠' : (searchType === 'postcode' ? '📮' : '📍'),
        type: searchType === 'postcode' ? 'postcode' : 'address',
        postcode: searchType === 'postcode' ? formattedQuery : postcode,
        address: {
          line1: line1.trim(),
          line2: line2.trim() || undefined,
          city: city.trim(),
          postcode: searchType === 'postcode' ? formattedQuery : postcode,
          country: 'GB',
          full_address: feature.place_name,
        },
        coords: feature.center ? { lat: feature.center[1], lng: feature.center[0] } : undefined,
        hasCompleteAddress,
        priority: hasCompleteAddress ? 8 : 5,
        isPostcodeMatch: searchType === 'postcode',
        confidence: 0.8,
      };
    });
  }

  // Google Places search implementation
  private async searchWithGooglePlaces(
    query: string,
    options?: {
      proximity?: LocationCoordinates;
      types?: string[];
      limit?: number;
    }
  ): Promise<AddressSuggestion[]> {
    if (!GOOGLE_PLACES_API_KEY) {
      throw new Error('Google Places API key not configured');
    }

    const searchType = getSearchType(query);
    const formattedQuery = searchType === 'postcode' ? formatUKPostcode(query) : query;
    console.log(`Google Places search: query="${query}", type="${searchType}", formatted="${formattedQuery}"`);

    const params = new URLSearchParams({
      input: formattedQuery,
      key: GOOGLE_PLACES_API_KEY,
      components: 'country:gb', // Restrict to UK
      types: searchType === 'postcode' ? 'postal_code' : 'address|establishment',
      language: 'en-GB'
    });

    // Add location bias if proximity is provided
    if (options?.proximity) {
      params.append('location', `${options.proximity.lat},${options.proximity.lng}`);
      params.append('radius', '50000'); // 50km radius
    }

    const url = `${GOOGLE_PLACES_AUTOCOMPLETE_URL}?${params}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Google Places API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      throw new Error(`Google Places API error: ${data.status}`);
    }

    const predictions = data.predictions || [];
    const suggestions: AddressSuggestion[] = [];

    // Convert Google predictions to our format
    for (const prediction of predictions.slice(0, options?.limit || 5)) {
      const suggestion = convertGooglePlaceToAddressSuggestion(prediction);
      // Add search type information
      suggestion.type = searchType === 'postcode' ? 'postcode' : 'address';
      if (searchType === 'postcode') {
        suggestion.icon = '📮';
        suggestion.postcode = formattedQuery;
      }
      suggestions.push(suggestion);
    }

    return suggestions;
  }

  // Get place details from Google Places (for luxury booking)
  async getPlaceDetails(placeId: string): Promise<GooglePlaceDetails | null> {
    if (!GOOGLE_PLACES_API_KEY) {
      throw new Error('Google Places API key not configured');
    }

    const params = new URLSearchParams({
      place_id: placeId,
      key: GOOGLE_PLACES_API_KEY,
      fields: 'place_id,formatted_address,geometry,address_components',
      language: 'en-GB'
    });

    const url = `${GOOGLE_PLACES_DETAILS_URL}?${params}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Google Places Details API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.status !== 'OK') {
      throw new Error(`Google Places Details API error: ${data.status}`);
    }

    return data.result;
  }

  // Generate cache key
  private getCacheKey(query: string, options?: any): string {
    const optionsStr = options ? JSON.stringify(options) : '';
    return `${query.toLowerCase()}_${optionsStr}`;
  }

  // Clear cache
  clearCache(): void {
    this.cache.clear();
  }

  // Royal Mail PAF search implementation
  private async searchWithPAF(
    query: string,
    options?: {
      proximity?: LocationCoordinates;
      types?: string[];
      limit?: number;
    }
  ): Promise<AddressSuggestion[]> {
    console.log(`PAF search: query="${query}"`);
    
    const limit = options?.limit || 5;
    
    try {
      const pafResults = await royalMailPAFService.searchAddresses(query, {
        limit,
        includeSubBuildings: true
      });
      
      // Convert PAF results to AddressSuggestion format
      return pafResults.map((result: any) => ({
        id: result.id,
        text: result.text,
        place_name: result.description,
        center: [result.coordinates.lng, result.coordinates.lat],
        context: [] as any[],
        properties: {
          accuracy: 'high',
          address: result.text
        },
        icon: result.address.buildingType === 'house' ? '🏠' : 
              result.address.buildingType === 'flat' ? '🏢' : '🏬',
        type: 'address',
        formatted_address: result.description,
        postcode: result.postcode,
        provider: result.source,
        address: {
          line1: result.address.line1,
          line2: result.address.line2,
          line3: result.address.line3,
          city: result.address.city,
          postcode: result.address.postcode,
          county: result.address.county,
          country: 'GB',
          full_address: result.description,
          building_type: result.address.buildingType,
          sub_building: result.address.subBuilding
        },
        coords: result.coordinates,
        priority: 10, // Highest priority for PAF results
        isPostcodeMatch: pafUtils.isValidUKPostcode(query),
        hasCompleteAddress: true,
        confidence: result.confidence,
        source: 'paf'
      }));
    } catch (error) {
      console.error('PAF search failed:', error);
      return [];
    }
  }

  // Check if query is UK-related
  private isUKAddressQuery(query: string): boolean {
    const ukKeywords = [
      'street', 'road', 'avenue', 'lane', 'close', 'drive', 'way', 'place',
      'glasgow', 'london', 'manchester', 'birmingham', 'edinburgh', 'liverpool',
      'bristol', 'leeds', 'sheffield', 'bradford', 'newcastle', 'nottingham'
    ];
    
    const queryLower = query.toLowerCase();
    return ukKeywords.some(keyword => queryLower.includes(keyword));
  }

  // UK Database search implementation
  private async searchWithUKDatabase(
    query: string,
    options?: {
      proximity?: LocationCoordinates;
      types?: string[];
      limit?: number;
    }
  ): Promise<AddressSuggestion[]> {
    console.log(`UK Database search: query="${query}"`);
    
    const searchType = getSearchType(query);
    const formattedQuery = searchType === 'postcode' ? formatUKPostcode(query) : query;
    const limit = options?.limit || 5;
    
    let results: any[] = [];
    
    if (searchType === 'postcode') {
      // Search by exact postcode first
      if (ukAddressUtils.isValidUKPostcode(formattedQuery)) {
        results = ukAddressDatabase.searchByPostcode(formattedQuery, limit);
      }
      
      // If no exact matches, try partial postcode search
      if (results.length === 0) {
        results = ukAddressDatabase.searchByPartialPostcode(formattedQuery, limit);
      }
    } else {
      // Search by street name
      results = ukAddressDatabase.searchByStreet(formattedQuery, limit);
      
      // If no street matches, try city search
      if (results.length === 0) {
        results = ukAddressDatabase.searchByCity(formattedQuery, limit);
      }
    }
    
    // Convert database results to AddressSuggestion format
    return results.map(record => ukAddressDatabase.convertToAddressSuggestion(record));
  }

  // Get cache stats
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Export singleton instance
export const premiumAddressService = PremiumAddressAutocompleteService.getInstance();

// Export for luxury booking flow
export const useLuxuryBookingAutocomplete = () => {
  const service = PremiumAddressAutocompleteService.getInstance();
  
  return {
    searchAddresses: (query: string, options?: any) => 
      service.searchAddresses(query, { ...options, useGooglePlaces: true }),
    getPlaceDetails: (placeId: string) => service.getPlaceDetails(placeId)
  };
};

// Export for standard booking flow (Mapbox primary)
export const useStandardBookingAutocomplete = () => {
  const service = PremiumAddressAutocompleteService.getInstance();
  
  return {
    searchAddresses: (query: string, options?: any) => 
      service.searchAddresses(query, { ...options, useGooglePlaces: false })
  };
};

// Export utility functions for postcode handling
export const postcodeUtils = {
  isValidUKPostcode,
  formatUKPostcode,
  getSearchType
};
