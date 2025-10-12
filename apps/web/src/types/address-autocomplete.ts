/**
 * Address Autocomplete Types for Luxury Booking System
 * Supports Google Places API (primary) and Mapbox (fallback)
 */

// Google Places API Types
export interface GooglePlacesAutocompleteRequest {
  input: string;
  sessiontoken?: string;
  components?: {
    country: string;
  };
  types?: string[];
}

export interface GooglePlacesAutocompleteResponse {
  predictions: GooglePlacePrediction[];
  status: 'OK' | 'ZERO_RESULTS' | 'OVER_QUERY_LIMIT' | 'REQUEST_DENIED' | 'INVALID_REQUEST';
  isPostcode?: boolean; // Enhanced property from our API route
  query?: string; // Enhanced property from our API route
}

export interface GooglePlacePrediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
    main_text_matched_substrings?: Array<{
      offset: number;
      length: number;
    }>;
  };
  types: string[];
  terms: Array<{
    offset: number;
    value: string;
  }>;
  confidence?: number; // Enhanced property from our API route
  isPostcode?: boolean; // Enhanced property from our API route
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
  name?: string;
  types: string[];
}

// Mapbox API Types
export interface MapboxGeocodingRequest {
  query: string;
  proximity?: string;
  country?: string;
  types?: string;
  limit?: number;
}

export interface MapboxGeocodingResponse {
  type: 'FeatureCollection';
  query: string[];
  features: MapboxFeature[];
}

export interface MapboxFeature {
  id: string;
  type: 'Feature';
  place_name: string;
  properties: Record<string, any>;
  text: string;
  place_type: string[];
  center: [number, number]; // [lng, lat]
  geometry: {
    type: 'Point';
    coordinates: [number, number]; // [lng, lat]
  };
  context?: Array<{
    id: string;
    text: string;
    short_code?: string;
    wikidata?: string;
  }>;
}

// Unified Address Suggestion Type
export interface AddressSuggestion {
  id: string;
  displayText: string;
  mainText: string;
  secondaryText: string;
  fullAddress: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  components: {
    houseNumber?: string;
    street?: string;
    city: string;
    postcode: string;
    country: string;
  };
  type: 'home' | 'office' | 'warehouse' | 'address' | 'establishment';
  provider: 'google' | 'mapbox';
  confidence: number; // 0-1 score for ranking
}

// Cache Types
export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

export interface AddressCache {
  get<T>(key: string): T | null;
  set<T>(key: string, value: T, ttl?: number): void;
  clear(): void;
  cleanup(): void;
}

// Service Configuration
export interface AutocompleteConfig {
  google: {
    apiKey: string;
    enabled: boolean;
    timeout: number; // milliseconds
    sessionToken: boolean;
    componentRestrictions: {
      country: string;
    };
  };
  mapbox: {
    accessToken: string;
    enabled: boolean;
    timeout: number; // milliseconds
    country: string;
    proximity?: string; // "lng,lat" for location bias
  };
  cache: {
    enabled: boolean;
    defaultTtl: number; // milliseconds
    maxSize: number;
  };
  debounce: {
    delay: number; // milliseconds
  };
}

// Error Types
export interface AutocompleteError {
  type: 'network' | 'api' | 'timeout' | 'quota' | 'invalid' | 'unknown';
  message: string;
  provider: 'google' | 'mapbox';
  originalError?: any;
  timestamp: number;
}

// Service Response Types
export interface AutocompleteResult {
  success: true;
  suggestions: AddressSuggestion[];
  provider: 'google' | 'mapbox';
  cached: boolean;
  responseTime: number;
}

export interface AutocompleteFailure {
  success: false;
  error: AutocompleteError;
  fallbackAttempted: boolean;
  responseTime: number;
}

export type AutocompleteResponse = AutocompleteResult | AutocompleteFailure;

// Component Props Types
export interface AddressInputProps {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (address: AddressSuggestion | null) => void;
  onValidation?: (isValid: boolean) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
  className?: string;
}

export interface SuggestionDropdownProps {
  suggestions: AddressSuggestion[];
  onSelect: (suggestion: AddressSuggestion) => void;
  onClose: () => void;
  isOpen: boolean;
  loading: boolean;
  error?: string;
  highlightedIndex: number;
  maxHeight?: number;
}

// Analytics Types
export interface AutocompleteAnalytics {
  searchQuery: string;
  provider: 'google' | 'mapbox';
  responseTime: number;
  resultCount: number;
  selectedIndex?: number;
  fallbackUsed: boolean;
  timestamp: number;
  sessionId: string;
}

// Map Preview Types
export interface MapPreviewProps {
  coordinates: {
    lat: number;
    lng: number;
  };
  address: string;
  zoom?: number;
  marker?: boolean;
  style?: 'light' | 'streets' | 'outdoors' | 'satellite';
  className?: string;
}

export interface RoutePreview {
  pickup: {
    lat: number;
    lng: number;
    address: string;
  };
  dropoff: {
    lat: number;
    lng: number;
    address: string;
  };
  distance: number; // in miles
  duration: number; // in minutes
  route?: Array<[number, number]>; // [lng, lat] array for route line
}