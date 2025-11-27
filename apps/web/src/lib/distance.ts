/**
 * Distance Calculation Helper
 * 
 * Calculates real distance between UK postcodes using Google Maps Distance Matrix API
 * with fallback to haversine distance calculation using postcodes.io coordinates.
 */

interface DistanceResult {
  distanceMiles: number;
  durationMinutes: number;
  method: 'google-maps' | 'haversine' | 'fallback';
  warning?: string;
}

interface PostcodeCoordinates {
  latitude: number;
  longitude: number;
}

/**
 * Haversine formula to calculate distance between two points on Earth
 * @param lat1 - Latitude of point 1
 * @param lon1 - Longitude of point 1
 * @param lat2 - Latitude of point 2
 * @param lon2 - Longitude of point 2
 * @returns Distance in miles
 */
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3958.8; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Get coordinates for a UK postcode using postcodes.io
 */
async function getPostcodeCoordinates(postcode: string): Promise<PostcodeCoordinates | null> {
  try {
    const normalizedPostcode = postcode.replace(/\s+/g, '').toUpperCase();
    const response = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(normalizedPostcode)}`, {
      method: 'GET',
      signal: AbortSignal.timeout(3000),
    });
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    if (data.result && data.result.latitude && data.result.longitude) {
      return {
        latitude: data.result.latitude,
        longitude: data.result.longitude,
      };
    }
    
    return null;
  } catch (error) {
    console.error(`[Distance] Failed to get coordinates for ${postcode}:`, error);
    return null;
  }
}

/**
 * Calculate distance using Google Maps Distance Matrix API
 */
async function calculateDistanceGoogleMaps(
  pickupPostcode: string,
  dropoffPostcode: string
): Promise<DistanceResult | null> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  
  if (!apiKey) {
    console.warn('[Distance] GOOGLE_MAPS_API_KEY not configured');
    return null;
  }
  
  try {
    const url = new URL('https://maps.googleapis.com/maps/api/distancematrix/json');
    url.searchParams.append('origins', pickupPostcode);
    url.searchParams.append('destinations', dropoffPostcode);
    url.searchParams.append('units', 'imperial'); // miles
    url.searchParams.append('key', apiKey);
    
    const response = await fetch(url.toString(), {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });
    
    if (!response.ok) {
      console.error(`[Distance] Google Maps API error: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    
    if (data.status !== 'OK') {
      console.error(`[Distance] Google Maps API status: ${data.status}`);
      return null;
    }
    
    const element = data.rows?.[0]?.elements?.[0];
    
    if (!element || element.status !== 'OK') {
      console.error(`[Distance] Google Maps element status: ${element?.status}`);
      return null;
    }
    
    // Extract distance in miles and duration in minutes
    const distanceMiles = element.distance.value / 1609.34; // meters to miles
    const durationMinutes = element.duration.value / 60; // seconds to minutes
    
    return {
      distanceMiles: Math.round(distanceMiles * 10) / 10, // Round to 1 decimal
      durationMinutes: Math.round(durationMinutes),
      method: 'google-maps',
    };
    
  } catch (error: any) {
    console.error('[Distance] Google Maps API call failed:', error.message);
    return null;
  }
}

/**
 * Calculate distance using haversine formula with postcodes.io coordinates
 */
async function calculateDistanceHaversine(
  pickupPostcode: string,
  dropoffPostcode: string
): Promise<DistanceResult | null> {
  try {
    const [pickupCoords, dropoffCoords] = await Promise.all([
      getPostcodeCoordinates(pickupPostcode),
      getPostcodeCoordinates(dropoffPostcode),
    ]);
    
    if (!pickupCoords || !dropoffCoords) {
      console.error('[Distance] Could not get coordinates for postcodes');
      return null;
    }
    
    const distanceMiles = haversineDistance(
      pickupCoords.latitude,
      pickupCoords.longitude,
      dropoffCoords.latitude,
      dropoffCoords.longitude
    );
    
    // Estimate duration: assume average 35 mph (city driving)
    const durationMinutes = Math.round((distanceMiles / 35) * 60);
    
    return {
      distanceMiles: Math.round(distanceMiles * 10) / 10,
      durationMinutes,
      method: 'haversine',
      warning: 'Distance calculated using straight-line formula (not road distance)',
    };
    
  } catch (error: any) {
    console.error('[Distance] Haversine calculation failed:', error.message);
    return null;
  }
}

/**
 * Calculate distance between two UK postcodes
 * Tries Google Maps first, falls back to haversine, then to safe default
 * 
 * @param pickupPostcode - Pickup postcode
 * @param dropoffPostcode - Dropoff postcode
 * @returns Distance result with method used
 */
export async function calculateDistance(
  pickupPostcode: string,
  dropoffPostcode: string
): Promise<DistanceResult> {
  // Try Google Maps first
  const googleResult = await calculateDistanceGoogleMaps(pickupPostcode, dropoffPostcode);
  if (googleResult) {
    console.log(`[Distance] Calculated via Google Maps: ${googleResult.distanceMiles} miles`);
    return googleResult;
  }
  
  // Fallback to haversine
  const haversineResult = await calculateDistanceHaversine(pickupPostcode, dropoffPostcode);
  if (haversineResult) {
    console.log(`[Distance] Calculated via haversine: ${haversineResult.distanceMiles} miles`);
    return haversineResult;
  }
  
  // TODO[SpeedyAI-Phase2-H3]: Replace hard-coded London coordinates with actual postcode geocoding
  // Use postcodes.io API to get real lat/lng for both postcodes, then calculate haversine
  // Remove LONDON_COORDS fallback entirely - make postcodes.io primary geocoding source
  
  // Final fallback: use safe default with clear warning
  console.warn('[Distance] All distance calculation methods failed, using fallback estimate');
  return {
    distanceMiles: 20, // Conservative estimate for UK average move
    durationMinutes: 45,
    method: 'fallback',
    warning: 'Could not calculate exact distance. Using estimated average for UK moves.',
  };
}

/**
 * Get a human-readable description of the distance calculation method
 */
export function getDistanceMethodDescription(method: DistanceResult['method']): string {
  switch (method) {
    case 'google-maps':
      return 'Road distance (Google Maps)';
    case 'haversine':
      return 'Straight-line distance';
    case 'fallback':
      return 'Estimated distance';
    default:
      return 'Unknown method';
  }
}
