/**
 * UK Address Autocomplete API
 * Google Places API (Primary) with Mapbox fallback
 * Strict UK-only results with comprehensive logging
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const autocompleteSchema = z.object({
  query: z.string().min(1).max(200),
  sessionToken: z.string().optional(),
});

interface GooglePlacesAutocompleteResponse {
  predictions: Array<{
    place_id: string;
    description: string;
    structured_formatting: {
      main_text: string;
      secondary_text: string;
    };
    types: string[];
  }>;
  status: string;
  error_message?: string;
}

interface GooglePlaceDetailsResponse {
  result: {
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
  };
  status: string;
}

interface MapboxGeocodingResponse {
  features: Array<{
    id: string;
    type: string;
    place_name: string;
    center: [number, number];
    geometry: {
      coordinates: [number, number];
    };
    context: Array<{
      id: string;
      text: string;
      short_code?: string;
    }>;
    properties: {
      accuracy?: string;
    };
  }>;
}

// Generate session token for Google Places
function generateSessionToken(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

// Search with Google Places Autocomplete (Primary)
async function searchWithGooglePlaces(query: string, sessionToken?: string): Promise<any[]> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  
  if (!apiKey) {
    console.warn('⚠️ Google Maps API key not configured');
    throw new Error('Google Maps API key not configured');
  }

  const token = sessionToken || generateSessionToken();
  
  // Google Places Autocomplete with strict UK restrictions
  // Removed types restriction to support partial postcodes (ML3, W1S, etc.) and full addresses
  // The components=country:gb ensures UK-only results
  const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?` +
    `input=${encodeURIComponent(query.trim())}` +
    `&components=country:gb` +
    `&language=en` +
    `&sessiontoken=${token}` +
    `&key=${apiKey}`;

  console.log(`📍 Google Places Autocomplete Request:`, {
    url: url.replace(apiKey, '[API_KEY]'),
    query,
    sessionToken: token,
    timestamp: new Date().toISOString()
  });

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'Speedy-Van Address Service/1.0'
    }
  });

  console.log(`📡 Google Places Response Status: ${response.status} ${response.statusText}`);

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`❌ Google Places API error:`, {
      status: response.status,
      statusText: response.statusText,
      body: errorText,
      timestamp: new Date().toISOString()
    });
    throw new Error(`Google Places API failed: ${response.status}`);
  }

  const data: GooglePlacesAutocompleteResponse = await response.json();
  
  console.log(`📋 Google Places Response:`, {
    status: data.status,
    predictionCount: data.predictions?.length || 0,
    errorMessage: data.error_message,
    timestamp: new Date().toISOString()
  });

  if (data.status !== 'OK') {
    throw new Error(`Google Places API error: ${data.status} - ${data.error_message}`);
  }

  // Convert predictions to standardized format
  return data.predictions.map((prediction, index) => ({
    id: prediction.place_id,
    displayText: prediction.description,
    mainText: prediction.structured_formatting.main_text,
    secondaryText: prediction.structured_formatting.secondary_text,
    provider: 'google' as const,
    confidence: 0.95,
    sessionToken: token,
    types: prediction.types,
    priority: index
  }));
}

// Get full address details from Google Places
async function getGooglePlaceDetails(placeId: string, sessionToken?: string): Promise<any> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  
  if (!apiKey) {
    throw new Error('Google Maps API key not configured');
  }

  const url = `https://maps.googleapis.com/maps/api/place/details/json?` +
    `place_id=${encodeURIComponent(placeId)}` +
    `&fields=place_id,formatted_address,geometry,address_components` +
    `${sessionToken ? `&sessiontoken=${sessionToken}` : ''}` +
    `&key=${apiKey}`;

  console.log(`📍 Google Place Details Request:`, {
    placeId,
    sessionToken,
    timestamp: new Date().toISOString()
  });

  const response = await fetch(url);
  const data: GooglePlaceDetailsResponse = await response.json();

  console.log(`📋 Google Place Details Response:`, {
    status: data.status,
    hasResult: !!data.result,
    timestamp: new Date().toISOString()
  });

  if (data.status !== 'OK') {
    throw new Error(`Google Place Details API error: ${data.status}`);
  }

  // Extract address components
  const components: any = {};
  data.result.address_components.forEach(component => {
    if (component.types.includes('street_number')) {
      components.houseNumber = component.long_name;
    }
    if (component.types.includes('route')) {
      components.street = component.long_name;
    }
    if (component.types.includes('locality') || component.types.includes('postal_town')) {
      components.city = component.long_name;
    }
    if (component.types.includes('postal_code')) {
      components.postcode = component.long_name;
    }
    if (component.types.includes('country')) {
      components.country = component.long_name;
    }
    if (component.types.includes('subpremise')) {
      components.flatNumber = component.long_name;
    }
  });

  return {
    id: data.result.place_id,
    displayText: data.result.formatted_address,
    fullAddress: data.result.formatted_address,
    coordinates: {
      lat: data.result.geometry.location.lat,
      lng: data.result.geometry.location.lng
    },
    components,
    provider: 'google' as const,
    confidence: 0.98
  };
}

// Search with Mapbox (Fallback)
async function searchWithMapbox(query: string): Promise<any[]> {
  const apiKey = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  
  if (!apiKey) {
    console.warn('⚠️ Mapbox API key not configured');
    throw new Error('Mapbox API key not configured');
  }

  // Mapbox forward geocoding with UK restrictions
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?` +
    `country=gb` +
    `&types=address` +
    `&language=en` +
    `&limit=10` +
    `&access_token=${apiKey}`;

  console.log(`📍 Mapbox Geocoding Request:`, {
    url: url.replace(apiKey, '[API_KEY]'),
    query,
    timestamp: new Date().toISOString()
  });

  const response = await fetch(url);
  
  console.log(`📡 Mapbox Response Status: ${response.status} ${response.statusText}`);

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`❌ Mapbox API error:`, {
      status: response.status,
      statusText: response.statusText,
      body: errorText,
      timestamp: new Date().toISOString()
    });
    throw new Error(`Mapbox API failed: ${response.status}`);
  }

  const data: MapboxGeocodingResponse = await response.json();
  
  console.log(`📋 Mapbox Response:`, {
    featureCount: data.features?.length || 0,
    timestamp: new Date().toISOString()
  });

  // Filter out non-UK results (e.g., Bermuda, Gibraltar, etc.)
  // These are British Overseas Territories but not part of mainland UK
  const ukOnlyFeatures = data.features.filter(feature => {
    const placeName = feature.place_name?.toLowerCase() || '';
    const excludedTerritories = ['bermuda', 'gibraltar', 'cayman', 'virgin islands', 'falkland', 'turks', 'montserrat', 'anguilla'];
    return !excludedTerritories.some(territory => placeName.includes(territory));
  });

  // Convert features to standardized format
  return ukOnlyFeatures.map((feature, index) => {
    // Extract address components from context
    const components: any = { country: 'United Kingdom' };
    
    feature.context?.forEach(ctx => {
      if (ctx.id.startsWith('postcode')) {
        components.postcode = ctx.text;
      }
      if (ctx.id.startsWith('place')) {
        components.city = ctx.text;
      }
      if (ctx.id.startsWith('locality')) {
        components.locality = ctx.text;
      }
    });

    // Validate UK postcode format if present
    // UK postcodes follow pattern like: SW1A 1AA, M1 1AE, etc.
    if (components.postcode) {
      const ukPostcodeRegex = /^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/i;
      if (!ukPostcodeRegex.test(components.postcode.trim())) {
        // Skip non-UK postcodes (e.g., Bermuda GE04, HS02)
        return null;
      }
    }

    return {
      id: feature.id,
      displayText: feature.place_name,
      fullAddress: feature.place_name,
      coordinates: {
        lat: feature.center[1],
        lng: feature.center[0]
      },
      components,
      provider: 'mapbox' as const,
      confidence: 0.85,
      priority: index + 100 // Lower priority than Google
    };
  }).filter(Boolean); // Remove null entries from invalid postcodes
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    const sessionToken = searchParams.get('sessionToken');

    console.log(`🔍 UK Address Autocomplete Request:`, {
      query,
      sessionToken,
      userAgent: request.headers.get('user-agent'),
      timestamp: new Date().toISOString()
    });

    if (!query) {
      return NextResponse.json({
        success: false,
        error: 'Query parameter is required',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    const validation = autocompleteSchema.safeParse({ query, sessionToken });
    if (!validation.success) {
      return NextResponse.json({
        success: false,
        error: 'Invalid parameters',
        details: validation.error.errors,
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    let suggestions: any[] = [];
    let primaryProvider = '';
    let fallbackAttempted = false;

    // Primary: Google Places Autocomplete
    try {
      console.log(`🔄 Trying Google Places API for: "${query}"`);
      const googleResults = await searchWithGooglePlaces(query, sessionToken || undefined);
      suggestions = googleResults;
      primaryProvider = 'google';
      
      console.log(`✅ Google Places returned ${(suggestions || []).length} suggestions`);
      
    } catch (googleError) {
      console.warn('⚠️ Google Places failed, trying Mapbox fallback...', {
        error: googleError instanceof Error ? googleError.message : String(googleError),
        timestamp: new Date().toISOString()
      });

      // Fallback: Mapbox Geocoding
      try {
        fallbackAttempted = true;
        const mapboxResults = await searchWithMapbox(query);
        suggestions = mapboxResults;
        primaryProvider = 'mapbox';
        
        console.log(`✅ Mapbox fallback returned ${suggestions.length} suggestions`);
        
      } catch (mapboxError) {
        console.error('❌ Both Google and Mapbox failed:', {
          googleError: googleError instanceof Error ? googleError.message : String(googleError),
          mapboxError: mapboxError instanceof Error ? mapboxError.message : String(mapboxError),
          timestamp: new Date().toISOString()
        });

        return NextResponse.json({
          success: false,
          error: 'All address providers failed',
          provider: 'none',
          fallbackAttempted: true,
          responseTime: Date.now() - startTime,
          timestamp: new Date().toISOString()
        }, { status: 503 });
      }
    }

    // Sort by confidence and priority
    suggestions.sort((a, b) => {
      if (a.confidence !== b.confidence) {
        return b.confidence - a.confidence;
      }
      return (a.priority || 0) - (b.priority || 0);
    });

    const responseTime = Date.now() - startTime;
    
    console.log(`✅ UK Address Autocomplete Success:`, {
      query,
      provider: primaryProvider,
      suggestionCount: suggestions.length,
      fallbackAttempted,
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      data: {
        suggestions: suggestions.slice(0, 10), // Limit to 10 results
        provider: primaryProvider,
        fallbackAttempted,
        total: suggestions.length,
        sessionToken: sessionToken || generateSessionToken()
      },
      responseTime,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    console.error('❌ UK Address Autocomplete Error:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      responseTime,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// Place Details endpoint for Google Places
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    const { placeId, sessionToken } = body;

    console.log(`📍 Place Details Request:`, {
      placeId,
      sessionToken,
      timestamp: new Date().toISOString()
    });

    if (!placeId) {
      return NextResponse.json({
        success: false,
        error: 'placeId is required',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    const details = await getGooglePlaceDetails(placeId, sessionToken);
    const responseTime = Date.now() - startTime;

    console.log(`✅ Place Details Success:`, {
      placeId,
      address: details.displayText,
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      data: details,
      responseTime,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    console.error('❌ Place Details Error:', {
      error: error instanceof Error ? error.message : String(error),
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      responseTime,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}