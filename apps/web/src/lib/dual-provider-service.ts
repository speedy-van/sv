/**
 * Dual Provider Address Autocomplete Service
 * Google Places API (primary) with Mapbox API fallback
 * Implements confused.com postcode-first pattern
 */

import type {
  Provider,
  AddressSuggestion,
  AutocompleteResponse,
  ProviderConfig,
  Coordinates,
  DistanceResult,
  GooglePlacesResponse,
  GooglePlaceDetails,
  MapboxGeocodingResponse,
  MapboxDirectionsResponse,
} from '@/types/dual-provider-address';

import { PostcodeValidator } from './postcode-validator';
import { providerHealthMonitor } from './provider-health-monitor';
import { dualProviderCache } from './dual-provider-cache';
import { costOptimizer } from './cost-optimizer';

export class DualProviderService {
  private static instance: DualProviderService;
  private config: ProviderConfig;
  private sessionId = Math.random().toString(36).substring(2);

  constructor(config?: Partial<ProviderConfig>) {
    this.config = {
      google: {
        apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
        enabled: !!(process.env.NEXT_PUBLIC_GOOGLE_MAPS || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY), // Only enable if API key is present
        timeout: 3000,
        sessionToken: true,
        componentRestrictions: {
          country: 'GB',
        },
      },
      mapbox: {
        accessToken: process.env.NEXT_PUBLIC_MAPBOX_TOKEN || 'pk.eyJ1IjoiYWhtYWRhbHdha2FpIiwiYSI6ImNtZGNsZ3RsZDEzdGsya3F0ODFxeGRzbXoifQ.jfgGW0KNFTwATOShRDtQsg',
        enabled: true,
        timeout: 3000,
        country: 'GB',
        proximity: undefined,
      },
      cache: {
        enabled: true,
        defaultTtl: 24 * 60 * 60 * 1000, // 24 hours
        maxSize: 1000,
      },
      debounce: {
        delay: 300,
      },
      ...config,
    };

    // Log configuration in development
    if (process.env.NODE_ENV === 'development') {
      console.log('DualProviderService config:', {
        google: { enabled: this.config.google.enabled, hasApiKey: !!this.config.google.apiKey },
        mapbox: { enabled: this.config.mapbox.enabled, hasToken: !!this.config.mapbox.accessToken },
      });
    }
  }

  static getInstance(config?: Partial<ProviderConfig>): DualProviderService {
    if (!DualProviderService.instance) {
      DualProviderService.instance = new DualProviderService(config);
    }
    return DualProviderService.instance;
  }

  /**
   * Main address autocomplete method with intelligent provider selection
   */
  async getAddressSuggestions(query: string): Promise<AutocompleteResponse> {
    const startTime = Date.now();
    
    if (!query || query.length < 2) {
      return {
        success: false,
        error: {
          type: 'invalid',
          message: 'Query too short',
          provider: 'google',
          timestamp: Date.now(),
        },
        fallbackAttempted: false,
        responseTime: 0,
      };
    }

    // Log the request in development
    if (process.env.NODE_ENV === 'development') {
      console.log('DualProviderService: Searching for query:', query);
    }

    // Check cache first
    if (this.config.cache.enabled) {
      const cached = dualProviderCache.getAddressSuggestions(query);
      if (cached) {
        providerHealthMonitor.recordCacheEvent('cache_hit', cached[0]?.provider || 'google');
        return {
          success: true,
          suggestions: cached,
          provider: cached[0]?.provider || 'google',
          cached: true,
          responseTime: Date.now() - startTime,
        };
      }
      providerHealthMonitor.recordCacheEvent('cache_miss', 'google');
    }

    // Determine best provider
    const primaryProvider = this.selectPrimaryProvider();
    
    try {
      const result = await this.fetchFromProvider(primaryProvider, query);
      const responseTime = Date.now() - startTime;

      // Check if we should try fallback for empty results on postcode queries
      const isPostcode = PostcodeValidator.isPostcodeLike(query);
      const shouldTryFallback = result.suggestions.length === 0 && isPostcode && primaryProvider === 'google';

      if (shouldTryFallback) {
        // Try fallback for empty postcode results
        try {
          const fallbackProvider = 'mapbox';
          const fallbackResult = await this.fetchFromProvider(fallbackProvider, query);
          
          if (fallbackResult.suggestions.length > 0) {
            providerHealthMonitor.recordFallback(
              primaryProvider,
              fallbackProvider,
              'Empty results for postcode query'
            );

            providerHealthMonitor.recordSuccess(
              fallbackProvider,
              Date.now() - startTime,
              fallbackResult.suggestions.length
            );

            // Cache fallback results
            if (this.config.cache.enabled) {
              dualProviderCache.setAddressSuggestions(query, fallbackResult.suggestions, fallbackProvider);
            }

            return {
              success: true,
              suggestions: fallbackResult.suggestions,
              provider: fallbackProvider,
              cached: false,
              responseTime: Date.now() - startTime,
              fallbackAttempted: true,
            };
          }
        } catch (fallbackError) {
          // Fallback failed, continue with original empty result
          if (process.env.NODE_ENV === 'development') {
            console.error(`DualProviderService: Fallback provider failed:`, fallbackError);
          }
        }
      }

      // Record success for primary provider
      providerHealthMonitor.recordSuccess(
        primaryProvider,
        responseTime,
        result.suggestions.length
      );

      // Cache results
      if (this.config.cache.enabled && result.suggestions.length > 0) {
        dualProviderCache.setAddressSuggestions(query, result.suggestions, primaryProvider);
      }

      return {
        success: true,
        suggestions: result.suggestions,
        provider: primaryProvider,
        cached: false,
        responseTime,
        fallbackAttempted: shouldTryFallback,
      };
    } catch (error) {
      // Primary provider failed - try fallback
      const fallbackProvider = primaryProvider === 'google' ? 'mapbox' : 'google';
      
      // Log the error in development
      if (process.env.NODE_ENV === 'development') {
        console.error(`DualProviderService: Primary provider (${primaryProvider}) failed:`, error);
      }
      
      providerHealthMonitor.recordFailure(
        primaryProvider,
        (error as any).name || 'NetworkError',
        (error as any).message || 'Unknown error',
        query,
        Date.now() - startTime,
        (error as any).status
      );

      try {
        const fallbackResult = await this.fetchFromProvider(fallbackProvider, query);
        const responseTime = Date.now() - startTime;

        providerHealthMonitor.recordFallback(
          primaryProvider,
          fallbackProvider,
          `Primary provider failed: ${(error as any).message}`
        );

        providerHealthMonitor.recordSuccess(
          fallbackProvider,
          responseTime,
          fallbackResult.suggestions.length
        );

        // Cache fallback results with shorter TTL
        if (this.config.cache.enabled && fallbackResult.suggestions.length > 0) {
          dualProviderCache.setAddressSuggestions(query, fallbackResult.suggestions, fallbackProvider);
        }

        return {
          success: true,
          suggestions: fallbackResult.suggestions,
          provider: fallbackProvider,
          cached: false,
          responseTime,
          fallbackAttempted: true,
        };
      } catch (fallbackError) {
        return {
          success: false,
          error: {
            type: 'network',
            message: 'Both providers failed',
            provider: fallbackProvider,
            originalError: fallbackError,
            timestamp: Date.now(),
          },
          fallbackAttempted: true,
          responseTime: Date.now() - startTime,
        };
      }
    }
  }

  /**
   * Get place details for a specific place ID
   */
  async getPlaceDetails(placeId: string, provider: Provider): Promise<AddressSuggestion | null> {
    try {
      if (provider === 'google') {
        return await this.getGooglePlaceDetails(placeId);
      } else {
        return await this.getMapboxPlaceDetails(placeId);
      }
    } catch (error) {
      console.error(`Failed to get place details from ${provider}:`, error);
      return null;
    }
  }

  /**
   * Calculate distance between two coordinates
   */
  async calculateDistance(
    pickup: Coordinates,
    dropoff: Coordinates,
    preferredProvider?: Provider
  ): Promise<DistanceResult | null> {
    const startTime = Date.now();

    // Check cache first
    if (this.config.cache.enabled) {
      const cached = dualProviderCache.getDistanceCalculation(pickup, dropoff);
      if (cached) {
        return cached;
      }
    }

    // Use cost-aware selection for distance calculations if no preference specified
    let provider = preferredProvider;
    if (!provider) {
      const providerHealth = providerHealthMonitor.getProviderHealth();
      const healthScores = {
        google: providerHealth.google.score,
        mapbox: providerHealth.mapbox.score
      };
      provider = costOptimizer.selectCostOptimalProvider('distanceMatrix', healthScores);
    }

    try {
      const result = await this.fetchDistanceFromProvider(provider, pickup, dropoff);
      
      // Cache result
      if (this.config.cache.enabled) {
        dualProviderCache.setDistanceCalculation(pickup, dropoff, result, provider);
      }

      providerHealthMonitor.recordSuccess(provider, Date.now() - startTime);

      return result;
    } catch (error) {
      // Try fallback provider
      const fallbackProvider = provider === 'google' ? 'mapbox' : 'google';
      
      try {
        const fallbackResult = await this.fetchDistanceFromProvider(fallbackProvider, pickup, dropoff);
        
        // Cache fallback result
        if (this.config.cache.enabled) {
          dualProviderCache.setDistanceCalculation(pickup, dropoff, fallbackResult, fallbackProvider);
        }

        providerHealthMonitor.recordFallback(provider, fallbackProvider, 'Distance calculation failed');
        providerHealthMonitor.recordSuccess(fallbackProvider, Date.now() - startTime);

        return fallbackResult;
      } catch (fallbackError) {
        console.error('Both distance calculation providers failed:', fallbackError);
        return null;
      }
    }
  }

  /**
   * Validate UK postcode
   */
  validatePostcode(postcode: string) {
    return PostcodeValidator.validateUKPostcode(postcode);
  }

  /**
   * Get service health status
   */
  getServiceHealth() {
    return {
      providerHealth: providerHealthMonitor.getProviderHealth(),
      cacheStats: dualProviderCache.getStats(),
      analytics: providerHealthMonitor.getAnalytics(),
      costAnalytics: costOptimizer.getCostAnalytics(),
    };
  }

  private selectPrimaryProvider(): Provider {
    // Get health scores for both providers
    const providerHealth = providerHealthMonitor.getProviderHealth();
    const healthScores = {
      google: providerHealth.google.score,
      mapbox: providerHealth.mapbox.score
    };

    // Use cost-aware selection for autocomplete requests
    return costOptimizer.selectCostOptimalProvider('autocomplete', healthScores);
  }

  private async fetchFromProvider(provider: Provider, query: string): Promise<{ suggestions: AddressSuggestion[] }> {
    if (provider === 'google') {
      return await this.fetchGoogleSuggestions(query);
    } else {
      return await this.fetchMapboxSuggestions(query);
    }
  }

  private async fetchGoogleSuggestions(query: string): Promise<{ suggestions: AddressSuggestion[] }> {
    if (!this.config.google.enabled || !this.config.google.apiKey) {
      throw new Error('Google Places API not configured');
    }

    const isPostcode = PostcodeValidator.isPostcodeLike(query);
    
    // URL encode the query to handle spaces and special characters properly
    const encodedQuery = encodeURIComponent(query.trim());
    
    const url = new URL('https://maps.googleapis.com/maps/api/place/autocomplete/json');
    url.searchParams.set('input', query.trim());
    url.searchParams.set('key', this.config.google.apiKey);
    url.searchParams.set('components', 'country:GB');
    // Support both postal_code and address types for better autocomplete on partial postcodes
    url.searchParams.set('types', isPostcode ? 'postal_code|address' : 'address');
    url.searchParams.set('language', 'en-GB');
    url.searchParams.set('region', 'uk');

    if (this.config.mapbox.proximity) {
      url.searchParams.set('location', this.config.mapbox.proximity);
      url.searchParams.set('radius', '50000');
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      signal: AbortSignal.timeout(this.config.google.timeout),
    });

    if (!response.ok) {
      throw new Error(`Google Places API error: ${response.status}`);
    }

    const data: GooglePlacesResponse = await response.json();

    // Record cost for Google Places API autocomplete request
    costOptimizer.recordRequest('google', 'autocomplete', 1);



    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      throw new Error(`Google Places API error: ${data.status} - ${(data as any).error_message || 'Unknown error'}`);
    }

    const suggestions: AddressSuggestion[] = data.predictions.map((prediction, index) => ({
      id: prediction.place_id,
      displayText: prediction.description,
      mainText: prediction.structured_formatting.main_text,
      secondaryText: prediction.structured_formatting.secondary_text,
      fullAddress: prediction.description,
      coordinates: { lat: 0, lng: 0 }, // Will be populated from place details
      components: this.parseGoogleComponents(prediction.terms),
      type: this.determineAddressType(prediction.types),
      provider: 'google',
      confidence: Math.max(0.1, 1 - (index * 0.1)),
      metadata: {
        placeId: prediction.place_id,
      },
    }));

    return { suggestions };
  }

  private async fetchMapboxSuggestions(query: string): Promise<{ suggestions: AddressSuggestion[] }> {
    if (!this.config.mapbox.enabled || !this.config.mapbox.accessToken) {
      throw new Error('Mapbox API not configured');
    }

    const isPostcode = PostcodeValidator.isPostcodeLike(query);
    const enhancedQuery = isPostcode ? this.enhancePostcodeQuery(query) : query;

    const url = new URL(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(enhancedQuery)}.json`);
    url.searchParams.set('access_token', this.config.mapbox.accessToken);
    url.searchParams.set('country', this.config.mapbox.country);
    url.searchParams.set('limit', '10');
    url.searchParams.set('language', 'en');

    if (isPostcode) {
      url.searchParams.set('types', 'postcode,address,place');
    } else {
      url.searchParams.set('types', 'address,poi,place');
    }

    if (this.config.mapbox.proximity) {
      url.searchParams.set('proximity', this.config.mapbox.proximity);
    }

    // Log the request in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Mapbox API request:', url.toString());
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      signal: AbortSignal.timeout(this.config.mapbox.timeout),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Mapbox API error: ${response.status} - ${errorText}`);
    }

    const data: MapboxGeocodingResponse = await response.json();

    // Record cost for Mapbox geocoding request
    costOptimizer.recordRequest('mapbox', 'autocomplete', 1);

    // Log the response in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Mapbox API response:', data);
    }

    const suggestions: AddressSuggestion[] = data.features.map((feature, index) => ({
      id: feature.id,
      displayText: feature.place_name,
      mainText: feature.text,
      secondaryText: this.getMapboxSecondaryText(feature),
      fullAddress: feature.place_name,
      coordinates: {
        lat: feature.center[1],
        lng: feature.center[0],
      },
      components: this.parseMapboxComponents(feature),
      type: this.determineAddressType(feature.place_type),
      provider: 'mapbox',
      confidence: Math.max(0.1, feature.relevance - (index * 0.05)),
    }));

    return { suggestions };
  }

  private async fetchDistanceFromProvider(
    provider: Provider,
    pickup: Coordinates,
    dropoff: Coordinates
  ): Promise<DistanceResult> {
    if (provider === 'google') {
      return await this.fetchGoogleDistance(pickup, dropoff);
    } else {
      return await this.fetchMapboxDistance(pickup, dropoff);
    }
  }

  private async fetchGoogleDistance(pickup: Coordinates, dropoff: Coordinates): Promise<DistanceResult> {
    const url = new URL('https://maps.googleapis.com/maps/api/distancematrix/json');
    url.searchParams.set('origins', `${pickup.lat},${pickup.lng}`);
    url.searchParams.set('destinations', `${dropoff.lat},${dropoff.lng}`);
    url.searchParams.set('units', 'metric');
    url.searchParams.set('mode', 'driving');
    url.searchParams.set('traffic_model', 'best_guess');
    url.searchParams.set('departure_time', 'now');
    url.searchParams.set('key', this.config.google.apiKey);

    const response = await fetch(url.toString(), {
      method: 'GET',
      signal: AbortSignal.timeout(this.config.google.timeout),
    });

    if (!response.ok) {
      throw new Error(`Google Distance Matrix API error: ${response.status}`);
    }

    const data = await response.json();

    // Record cost for Google Distance Matrix API request
    costOptimizer.recordRequest('google', 'distanceMatrix', 1);
    
    const element = data.rows[0]?.elements[0];

    if (!element || element.status !== 'OK') {
      throw new Error(`Google Distance Matrix API error: ${element?.status || 'NO_RESULTS'}`);
    }

    return {
      distance: element.distance.value,
      duration: element.duration.value,
      durationInTraffic: element.duration_in_traffic?.value,
      provider: 'google',
    };
  }

  private async fetchMapboxDistance(pickup: Coordinates, dropoff: Coordinates): Promise<DistanceResult> {
    const url = new URL(`https://api.mapbox.com/directions/v5/mapbox/driving-traffic/${pickup.lng},${pickup.lat};${dropoff.lng},${dropoff.lat}`);
    url.searchParams.set('access_token', this.config.mapbox.accessToken);
    url.searchParams.set('geometries', 'geojson');
    url.searchParams.set('overview', 'full');
    url.searchParams.set('steps', 'false');

    const response = await fetch(url.toString(), {
      method: 'GET',
      signal: AbortSignal.timeout(this.config.mapbox.timeout),
    });

    if (!response.ok) {
      throw new Error(`Mapbox Directions API error: ${response.status}`);
    }

    const data: MapboxDirectionsResponse = await response.json();

    // Record cost for Mapbox Directions API request
    costOptimizer.recordRequest('mapbox', 'directions', 1);
    const route = data.routes[0];

    if (!route) {
      throw new Error('Mapbox Directions API error: NO_ROUTE_FOUND');
    }

    return {
      distance: route.distance,
      duration: route.duration,
      provider: 'mapbox',
      route: {
        geometry: route.geometry,
        summary: route.summary,
        warnings: route.warnings,
      },
    };
  }

  private async getGooglePlaceDetails(placeId: string): Promise<AddressSuggestion | null> {
    const url = new URL('https://maps.googleapis.com/maps/api/place/details/json');
    url.searchParams.set('place_id', placeId);
    url.searchParams.set('key', this.config.google.apiKey);
    url.searchParams.set('fields', 'place_id,formatted_address,geometry,address_components,name,types');

    const response = await fetch(url.toString(), {
      method: 'GET',
      signal: AbortSignal.timeout(this.config.google.timeout),
    });

    if (!response.ok) {
      throw new Error(`Google Places Details API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.status !== 'OK' || !data.result) {
      throw new Error(`Google Places Details API error: ${data.status}`);
    }

    const place: GooglePlaceDetails = data.result;

    return {
      id: place.place_id,
      displayText: place.formatted_address,
      mainText: place.name || place.formatted_address,
      secondaryText: this.getGoogleSecondaryText(place),
      fullAddress: place.formatted_address,
      coordinates: {
        lat: place.geometry.location.lat,
        lng: place.geometry.location.lng,
      },
      components: this.parseGoogleAddressComponents(place.address_components),
      type: this.determineAddressType(place.types),
      provider: 'google',
      confidence: 1.0,
      metadata: {
        placeId: place.place_id,
        businessStatus: place.business_status,
        rating: place.rating,
        userRatingsTotal: place.user_ratings_total,
        openingHours: place.opening_hours?.open_now,
        priceLevel: place.price_level,
      },
    };
  }

  private async getMapboxPlaceDetails(placeId: string): Promise<AddressSuggestion | null> {
    // Mapbox doesn't have a separate place details API, so we return null
    // The coordinates are already available in the geocoding response
    return null;
  }

  private parseGoogleComponents(terms: Array<{ value: string; offset: number }>): any {
    const components = terms.map(term => term.value);
    
    return {
      street: components[0] || '',
      city: components[components.length - 2] || '',
      postcode: components[components.length - 1] || '',
      country: 'United Kingdom',
    };
  }

  private parseGoogleAddressComponents(addressComponents: any[]): any {
    const components: any = {
      street: '',
      city: '',
      postcode: '',
      country: 'United Kingdom',
    };

    for (const component of addressComponents) {
      const types = component.types;
      
      if (types.includes('street_number') || types.includes('route')) {
        components.street = component.long_name;
      } else if (types.includes('locality') || types.includes('administrative_area_level_2')) {
        components.city = component.long_name;
      } else if (types.includes('postal_code')) {
        components.postcode = component.long_name;
      }
    }

    return components;
  }

  private parseMapboxComponents(feature: any): any {
    const context = feature.context || [];
    
    return {
      street: feature.text || '',
      city: context.find((c: any) => c.id.includes('place'))?.text || '',
      postcode: context.find((c: any) => c.id.includes('postcode'))?.text || '',
      country: context.find((c: any) => c.id.includes('country'))?.text || 'United Kingdom',
    };
  }

  private getMapboxSecondaryText(feature: any): string {
    const context = feature.context || [];
    const city = context.find((c: any) => c.id.includes('place'))?.text;
    const postcode = context.find((c: any) => c.id.includes('postcode'))?.text;
    
    return [city, postcode].filter(Boolean).join(', ');
  }

  private getGoogleSecondaryText(place: GooglePlaceDetails): string {
    const components = place.address_components || [];
    const city = components.find(c => c.types.includes('locality'))?.long_name;
    const postcode = components.find(c => c.types.includes('postal_code'))?.long_name;
    
    return [city, postcode].filter(Boolean).join(', ');
  }

  private determineAddressType(types: string[]): AddressSuggestion['type'] {
    if (types.some(type => type.includes('postal_code') || type.includes('postcode'))) {
      return 'address';
    }
    
    if (types.some(type => type.includes('establishment') || type.includes('poi'))) {
      if (types.some(type => type.includes('lodging') || type.includes('home'))) return 'home';
      if (types.some(type => type.includes('office') || type.includes('business'))) return 'office';
      if (types.some(type => type.includes('warehouse') || type.includes('storage'))) return 'warehouse';
      return 'establishment';
    }
    
    return 'address';
  }

  private enhancePostcodeQuery(query: string): string {
    const cleaned = query.trim().toUpperCase().replace(/\s+/g, ' ');
    
    // If it looks like a partial postcode without space, try to format it
    const partialPostcodeMatch = cleaned.match(/^([A-Z]{1,2}\d[A-Z\d]?)([A-Z\d]{2,3})$/);
    if (partialPostcodeMatch) {
      return `${partialPostcodeMatch[1]} ${partialPostcodeMatch[2]}`;
    }
    
    return cleaned;
  }
}

export const dualProviderService = DualProviderService.getInstance();
export default dualProviderService;
