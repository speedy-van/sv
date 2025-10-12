/**
 * Mapbox integration for Speedy Van
 */

export interface GeocodeResult {
  place_name: string;
  geometry: {
    coordinates: [number, number]; // [lng, lat]
  };
  properties: {
    accuracy: string;
    address?: string;
    category?: string;
  };
  context?: Array<{
    id: string;
    text: string;
    short_code?: string;
  }>;
}

export interface GeocodeOptions {
  country?: string;
  proximity?: [number, number]; // [lng, lat]
  types?: string[];
  limit?: number;
}

export async function geocode(
  query: string,
  options: GeocodeOptions = {}
): Promise<GeocodeResult[]> {
  const accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  
  if (!accessToken) {
    throw new Error('Mapbox access token is required');
  }

  const params = new URLSearchParams({
    access_token: accessToken,
    country: options.country || 'GB',
    limit: String(options.limit || 5),
  });

  if (options.proximity) {
    params.append('proximity', `${options.proximity[0]},${options.proximity[1]}`);
  }

  if (options.types) {
    params.append('types', options.types.join(','));
  }

  try {
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?${params}`
    );

    if (!response.ok) {
      throw new Error(`Mapbox API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.features || [];
  } catch (error) {
    console.error('Geocoding error:', error);
    return [];
  }
}

export async function reverseGeocode(
  lng: number,
  lat: number,
  options: { types?: string[] } = {}
): Promise<GeocodeResult[]> {
  const accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  
  if (!accessToken) {
    throw new Error('Mapbox access token is required');
  }

  const params = new URLSearchParams({
    access_token: accessToken,
  });

  if (options.types) {
    params.append('types', options.types.join(','));
  }

  try {
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?${params}`
    );

    if (!response.ok) {
      throw new Error(`Mapbox API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.features || [];
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return [];
  }
}

export function formatAddress(geocodeResult: GeocodeResult): string {
  return geocodeResult.place_name;
}

export function extractCoordinates(geocodeResult: GeocodeResult): [number, number] {
  return geocodeResult.geometry.coordinates;
}

export function extractPostcode(geocodeResult: GeocodeResult): string | null {
  const postcodeContext = geocodeResult.context?.find(
    ctx => ctx.id.startsWith('postcode')
  );
  return postcodeContext?.text || null;
}