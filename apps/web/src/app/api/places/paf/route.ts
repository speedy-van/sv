import { NextResponse } from 'next/server';
import { royalMailPAFService, pafUtils } from '@/lib/royal-mail-paf-service';

const TIMEOUT_MS = 5000;

function withTimeout<T>(p: Promise<T>, ms: number) {
  return Promise.race([
    p,
    new Promise<never>((_, rej) =>
      setTimeout(() => rej(new Error('PAF_TIMEOUT')), ms)
    ),
  ]);
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = (url.searchParams.get('q') || '').trim();
  const limit = Number(url.searchParams.get('limit') || '10');
  const includeSubBuildings = url.searchParams.get('includeSubBuildings') === 'true';

  // Validate input
  if (q.length < 2) {
    return NextResponse.json([], { 
      status: 200, 
      headers: { 'Cache-Control': 'no-store' } 
    });
  }

  // Check if it's a postcode query
  const isPostcodeQuery = pafUtils.isValidUKPostcode(q);
  
  console.log('[PAF API] Search request:', {
    query: q,
    isPostcodeQuery,
    limit,
    includeSubBuildings
  });

  try {
    const results = await withTimeout(
      royalMailPAFService.searchAddresses(q, {
        limit,
        includeSubBuildings
      }),
      TIMEOUT_MS
    );

    console.log(`[PAF API] Found ${results.length} results for: "${q}"`);

    // Convert to expected format for frontend
    const formattedResults = results.map(result => ({
      id: result.id,
      text: result.text,
      place_name: result.description,
      center: [result.coordinates.lng, result.coordinates.lat],
      context: [],
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
      isPostcodeMatch: isPostcodeQuery,
      hasCompleteAddress: true,
      confidence: result.confidence,
      source: 'paf'
    }));

    return NextResponse.json(formattedResults, {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=300, s-maxage=600',
        'X-PAF-Provider': results[0]?.source || 'none',
        'X-PAF-Results-Count': results.length.toString()
      }
    });

  } catch (error: any) {
    console.error('[PAF API] Error:', error.message);
    
    // Return empty results on error (don't break the UI)
    return NextResponse.json([], {
      status: 200,
      headers: {
        'Cache-Control': 'no-store',
        'X-PAF-Error': error.message
      }
    });
  }
}

// POST endpoint for batch processing
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { queries, options = {} } = body;

    if (!Array.isArray(queries) || queries.length === 0) {
      return NextResponse.json(
        { error: 'Queries array is required' },
        { status: 400 }
      );
    }

    const results = await Promise.all(
      queries.map(async (query: string) => {
        try {
          const searchResults = await royalMailPAFService.searchAddresses(query, options);
          return {
            query,
            results: searchResults,
            success: true
          };
        } catch (error) {
          return {
            query,
            results: [],
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      })
    );

    return NextResponse.json({
      results,
      totalQueries: queries.length,
      successfulQueries: results.filter(r => r.success).length
    });

  } catch (error: any) {
    console.error('[PAF API] Batch processing error:', error.message);
    
    return NextResponse.json(
      { error: 'Batch processing failed', details: error.message },
      { status: 500 }
    );
  }
}

