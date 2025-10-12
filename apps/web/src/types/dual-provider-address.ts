/**
 * Dual Provider Address Autocomplete Types
 * Comprehensive type definitions for Google Places + Mapbox fallback system
 */

export type Provider = 'google' | 'mapbox' | 'uk-postcode' | 'getaddress' | 'ideal-postcodes';

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface AddressComponents {
  street: string;
  city: string;
  postcode: string;
  country: string;
  region?: string;
  district?: string;
  houseNumber?: string;
  flatNumber?: string;
  buildingName?: string;
  floor?: string;
  businessName?: string;
}

export interface AddressSuggestion {
  id: string;
  displayText: string;
  mainText: string;
  secondaryText: string;
  fullAddress: string;
  coordinates: Coordinates;
  components: AddressComponents;
  type: 'address' | 'home' | 'office' | 'warehouse' | 'establishment';
  provider: Provider;
  confidence: number;
  metadata?: {
    placeId?: string;
    businessStatus?: string;
    rating?: number;
    userRatingsTotal?: number;
    openingHours?: boolean;
    priceLevel?: number;
  };
}

export interface PropertyDetails {
  houseNumber?: string;
  flatNumber?: string;
  buildingName?: string;
  floor?: string;
  businessName?: string;
}

export interface CompleteAddress extends AddressSuggestion {
  propertyDetails: PropertyDetails;
  isPostcodeValidated: boolean;
  stepCompletedAt: string;
}

export interface DistanceResult {
  distance: number; // meters
  duration: number; // seconds
  durationInTraffic?: number; // seconds
  provider: Provider;
  route?: {
    geometry: any;
    summary: string;
    warnings?: string[];
  };
}

export interface ProviderConfig {
  google: {
    apiKey: string;
    enabled: boolean;
    timeout: number;
    sessionToken: boolean;
    componentRestrictions: {
      country: string;
    };
  };
  mapbox: {
    accessToken: string;
    enabled: boolean;
    timeout: number;
    country: string;
    proximity?: string;
  };
  cache: {
    enabled: boolean;
    defaultTtl: number;
    maxSize: number;
  };
  debounce: {
    delay: number;
  };
}

export interface AutocompleteResponse {
  success: boolean;
  suggestions?: AddressSuggestion[];
  provider?: Provider;
  cached?: boolean;
  responseTime: number;
  error?: {
    type: 'network' | 'quota' | 'invalid' | 'timeout';
    message: string;
    provider: Provider;
    originalError?: any;
    timestamp: number;
  };
  fallbackAttempted?: boolean;
}

export interface HealthMetrics {
  provider: Provider;
  responseTime: number;
  errorRate: number;
  successRate: number;
  quotaUsage: number;
  lastUpdated: number;
  score: number; // 0-100
}

export interface ProviderHealth {
  google: HealthMetrics;
  mapbox: HealthMetrics;
  overall: {
    primaryProvider: Provider;
    fallbackActive: boolean;
    lastSwitchTime?: number;
    switchReason?: string;
  };
}

export interface PostcodeValidationResult {
  isValid: boolean;
  formatted: string;
  type: 'complete' | 'partial' | 'invalid';
  suggestions?: string[];
}

export interface CostMetrics {
  provider: Provider;
  requestType: 'autocomplete' | 'details' | 'distance' | 'directions';
  cost: number;
  currency: 'USD';
  timestamp: number;
}

export interface AddressInputProps {
  id: string;
  label?: string;
  placeholder?: string;
  value?: string;
  onChange: (suggestion: AddressSuggestion | null) => void;
  onValidation?: (isValid: boolean) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
  className?: string;
  disableSuccessToast?: boolean; // Prevent duplicate notifications
  context?: {
    pickupAddress?: AddressSuggestion;
    preferredProvider?: Provider;
  };
}

export interface ConfusedComPatternProps {
  step: 'postcode' | 'address' | 'confirmation';
  onStepComplete: (step: string, data: any) => void;
  onStepChange: (step: string) => void;
  pickupAddress?: AddressSuggestion;
  dropoffAddress?: AddressSuggestion;
  distance?: DistanceResult;
}

// Google Places API specific types
export interface GooglePlacePrediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
  types: string[];
  terms: Array<{
    value: string;
    offset: number;
  }>;
}

export interface GooglePlacesResponse {
  predictions: GooglePlacePrediction[];
  status: string;
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
  business_status?: string;
  rating?: number;
  user_ratings_total?: number;
  opening_hours?: {
    open_now: boolean;
  };
  price_level?: number;
}

// Mapbox API specific types
export interface MapboxFeature {
  id: string;
  type: string;
  place_type: string[];
  relevance: number;
  properties: {
    accuracy: string;
    address?: string;
    category?: string;
    maki?: string;
    wikidata?: string;
  };
  text: string;
  place_name: string;
  center: [number, number];
  geometry: {
    type: string;
    coordinates: [number, number];
  };
  context?: Array<{
    id: string;
    text: string;
    wikidata?: string;
    short_code?: string;
  }>;
}

export interface MapboxGeocodingResponse {
  type: string;
  query: string[];
  features: MapboxFeature[];
  attribution: string;
}

export interface MapboxDirectionsResponse {
  routes: Array<{
    distance: number;
    duration: number;
    duration_typical?: number;
    geometry: any;
    summary: string;
    warnings?: string[];
  }>;
  waypoints: Array<{
    distance: number;
    name: string;
    location: [number, number];
  }>;
  code: string;
  uuid: string;
}

// Cache types
export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  provider: Provider;
}

export interface CacheStats {
  size: number;
  hits: number;
  misses: number;
  hitRate: number;
  providers: {
    google: number;
    mapbox: number;
  };
}

// Monitoring types
export interface MonitoringEvent {
  type: 'request' | 'response' | 'error' | 'fallback' | 'cache_hit' | 'cache_miss';
  provider: Provider;
  timestamp: number;
  duration?: number;
  error?: string;
  metadata?: Record<string, any>;
}

export interface PerformanceMetrics {
  averageResponseTime: number;
  errorRate: number;
  successRate: number;
  cacheHitRate: number;
  fallbackUsage: number;
  providerDistribution: Record<Provider, number>;
}

// API Route types
export interface AutocompleteApiRequest {
  query: string;
  limit?: number;
  country?: string;
  types?: string;
  proximity?: string;
  preferredProvider?: Provider;
}

export interface AutocompleteApiResponse {
  success: boolean;
  data?: {
    suggestions: AddressSuggestion[];
    provider: Provider;
    cached: boolean;
    responseTime: number;
  };
  error?: {
    type: string;
    message: string;
    provider: Provider;
  };
}

export interface DistanceApiRequest {
  pickup: Coordinates;
  dropoff: Coordinates;
  provider?: Provider;
}

export interface DistanceApiResponse {
  success: boolean;
  data?: DistanceResult;
  error?: {
    type: string;
    message: string;
    provider: Provider;
  };
}

// Legacy compatibility types
export interface AddressCache {
  get<T>(key: string): T | null;
  set<T>(key: string, value: T, ttl?: number): void;
  delete(key: string): boolean;
  clear(): void;
  getStats(): { size: number; hits: number; misses: number; hitRate: number };
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export interface MapPreviewProps {
  pickupAddress?: AddressSuggestion;
  dropoffAddress?: AddressSuggestion;
  route?: RoutePreview;
  height?: string | number;
  width?: string | number;
  showControls?: boolean;
  onMapLoad?: () => void;
  className?: string;
  // Legacy support
  coordinates?: {
    lat: number;
    lng: number;
  };
  address?: string;
  zoom?: number;
  marker?: boolean;
  style?: string;
}

export interface RoutePreview {
  distance: number;
  duration: number;
  pickup: {
    lat: number;
    lng: number;
  };
  dropoff: {
    lat: number;
    lng: number;
  };
  route?: number[][];
  geometry?: any;
  summary?: string;
  warnings?: string[];
}
