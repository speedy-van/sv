/**
 * Forward geocoding: address string → lat/lng
 * Uses Google Geocoding API when lat/lng are not already available.
 * UK-biased (region=gb, country:GB).
 */

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const GOOGLE_GEOCODE_URL = 'https://maps.googleapis.com/maps/api/geocode/json';

function getGoogleApiKey(): string | undefined {
  return (
    process.env.GOOGLE_MAPS_API_KEY ||
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  );
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');

    if (!address || typeof address !== 'string' || address.trim().length === 0) {
      return NextResponse.json(
        { error: 'Query parameter "address" is required and must be non-empty' },
        { status: 400 }
      );
    }

    const apiKey = getGoogleApiKey();
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Google API key not configured' },
        { status: 500 }
      );
    }

    const params = new URLSearchParams({
      address: address.trim(),
      key: apiKey,
      region: 'gb',
      components: 'country:GB',
    });

    const url = `${GOOGLE_GEOCODE_URL}?${params.toString()}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Google Geocoding API error: ${response.status}`);
    }

    const data = (await response.json()) as {
      status: string;
      results?: Array<{
        geometry?: { location?: { lat: number; lng: number } };
        formatted_address?: string;
      }>;
    };

    if (data.status !== 'OK' || !data.results?.[0]?.geometry?.location) {
      return NextResponse.json(
        { error: 'No results for the given address', lat: null, lng: null },
        { status: 200 }
      );
    }

    const { lat, lng } = data.results[0].geometry!.location!;
    const formatted = data.results[0].formatted_address ?? undefined;

    return NextResponse.json({
      lat: Number(lat),
      lng: Number(lng),
      formatted_address: formatted,
    });
  } catch (error) {
    console.error('[geocoding/forward] Error:', error);
    return NextResponse.json(
      { error: 'Failed to geocode address' },
      { status: 500 }
    );
  }
}
