/**
 * Google Places API Proxy
 * Server-side API route to handle Google Places Autocomplete requests
 * Prevents CORS issues and secures API key
 */

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('input');
    const types = searchParams.get('types') || 'address';
    
    if (!query || query.length < 2) {
      return NextResponse.json({ 
        status: 'INVALID_REQUEST',
        error_message: 'Query must be at least 2 characters',
        predictions: []
      });
    }

    // Check if query is a postcode
    function isPostcodeQuery(q: string): boolean {
      const trimmed = q.trim();
      const patterns = [
        /^[A-Z]{1,2}\d$/i,                    // SW1, M1, B1 (partial)
        /^[A-Z]{1,2}\d[A-Z]$/i,               // SW1A, M1A (partial with letter)
        /^[A-Z]{1,2}\d\s?\d[A-Z]{2}$/i,       // SW1 1AA, M1 1AA (full)
        /^[A-Z]{1,2}\d[A-Z]\s?\d[A-Z]{2}$/i,  // SW1A 1AA (full with letter)
      ];
      return patterns.some(pattern => pattern.test(trimmed));
    }

    // Enhance postcode query for better API results
    function enhancePostcodeQuery(q: string): string {
      const trimmed = q.trim().toUpperCase();
      if (/^[A-Z]{1,2}\d[A-Z]?\s\d[A-Z]{2}$/i.test(trimmed)) {
        return trimmed;
      }
      if (/^[A-Z]{1,2}\d[A-Z]?$/i.test(trimmed)) {
        return trimmed + ' ';
      }
      return trimmed;
    }

    const isPostcode = isPostcodeQuery(query);
    const enhancedQuery = isPostcode ? enhancePostcodeQuery(query) : query;
    // For postcodes, include address types to get full addresses within that postcode
    const searchTypes = isPostcode ? 'address|establishment|geocode' : types;

    // Build Google Places API request
    const googleParams = new URLSearchParams({
      input: enhancedQuery,
      key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
      components: 'country:uk',
      language: 'en',
      types: searchTypes,
    });

    const googleResponse = await fetch(
      `https://maps.googleapis.com/maps/api/place/autocomplete/json?${googleParams}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!googleResponse.ok) {
      throw new Error(`Google API responded with status ${googleResponse.status}`);
    }

    const data = await googleResponse.json();

    // Transform response for our needs
    if (data.status === 'OK') {
      let predictions = data.predictions;
      
      // For postcodes, try to get more detailed address results
      if (isPostcode && predictions.length > 0) {
        try {
          // Make additional search for detailed addresses in this postcode area
          const detailedParams = new URLSearchParams({
            input: query + ' UK', // Add UK to get more specific results
            key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
            components: 'country:uk',
            language: 'en',
            types: 'street_address|premise|subpremise', // Get specific addresses
          });

          const detailedResponse = await fetch(
            `https://maps.googleapis.com/maps/api/place/autocomplete/json?${detailedParams}`
          );

          if (detailedResponse.ok) {
            const detailedData = await detailedResponse.json();
            if (detailedData.status === 'OK' && detailedData.predictions.length > 0) {
              // Combine postcode results with detailed addresses
              predictions = [
                ...predictions.slice(0, 2), // Keep first 2 postcode results
                ...detailedData.predictions.slice(0, 8) // Add up to 8 detailed addresses
              ];
            }
          }
        } catch (error) {
          console.log('Could not fetch detailed addresses for postcode:', error);
        }
      }

      // Boost confidence for postcode results
      const enhancedPredictions = predictions.map((prediction: any, index: number) => ({
        ...prediction,
        confidence: isPostcode && index < 2 ? 
          Math.min(prediction.confidence || 0.9, 1.0) + 0.3 : 
          prediction.confidence || 0.8,
        isPostcode: isPostcode && index < 2,
      }));

      return NextResponse.json({
        ...data,
        predictions: enhancedPredictions,
        query: enhancedQuery,
        isPostcode,
      });
    }

    return NextResponse.json(data);
    
  } catch (error: any) {
    console.error('Google Places API Error:', error);
    
    return NextResponse.json(
      { 
        status: 'REQUEST_DENIED',
        error_message: error.message || 'Internal server error',
        predictions: []
      },
      { status: 500 }
    );
  }
}