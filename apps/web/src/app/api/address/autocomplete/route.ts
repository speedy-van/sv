/**
 * Dual Provider Address Autocomplete API Route
 * Handles Google Places + Mapbox fallback requests
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { dualProviderService } from '@/lib/dual-provider-service';

export const dynamic = 'force-dynamic';

const autocompleteSchema = z.object({
  query: z.string().min(2).max(200),
  limit: z.number().min(1).max(20).optional().default(5), // Increased max to 20 for postcode searches
  country: z.string().optional().default('GB'),
  types: z.string().optional(),
  proximity: z.string().optional(),
  preferredProvider: z.enum(['google', 'mapbox']).optional(),
});

const querySchema = z.object({
  query: z.string().min(2).max(200),
  limit: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  types: z.string().nullable().optional(),
  proximity: z.string().nullable().optional(),
  preferredProvider: z.string().nullable().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    const limitStr = searchParams.get('limit');
    const country = searchParams.get('country');
    const types = searchParams.get('types');
    const proximity = searchParams.get('proximity');
    const preferredProvider = searchParams.get('preferredProvider');

    // Validate query parameters first
    const queryValidation = querySchema.safeParse({
      query,
      limit: limitStr,
      country,
      types,
      proximity,
      preferredProvider,
    });

    if (!queryValidation.success) {

      return NextResponse.json(
        {
          success: false,
          error: {
            type: 'invalid',
            message: 'Invalid query parameters',
            provider: 'google',
            details: queryValidation.error.issues,
          },
        },
        { status: 400 }
      );
    }

    // Parse and validate the processed parameters
    const parsedLimit = parseInt(limitStr || '5');
    const limit = isNaN(parsedLimit) ? 5 : Math.min(Math.max(parsedLimit, 1), 20); // Increased max to 20
    
    const processedParams = {
      query: query!,
      limit,
      country: country || 'GB',
      types: types || undefined,
      proximity: proximity || undefined,
      preferredProvider: (preferredProvider as 'google' | 'mapbox') || undefined,
    };

    const validation = autocompleteSchema.safeParse(processedParams);

    if (!validation.success) {

      return NextResponse.json(
        {
          success: false,
          error: {
            type: 'invalid',
            message: 'Invalid processed parameters',
            provider: 'google',
            details: validation.error.issues,
          },
        },
        { status: 400 }
      );
    }

    const { query: searchQuery } = validation.data;

    // Get address suggestions using dual provider service
    const result = await dualProviderService.getAddressSuggestions(searchQuery);

    if (result.success) {
      // Limit results if requested
      let suggestions = (result.suggestions || []).slice(0, limit);
      
      // Enhanced postcode extraction and validation for better results
      suggestions = suggestions.map(suggestion => {
        // If no postcode in components but query looks like a postcode, use the query
        if ((!suggestion.components?.postcode || suggestion.components.postcode.length < 4) && 
            /^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/i.test(searchQuery.trim())) {
          
          // Extract postcode from display text or full address as fallback
          let extractedPostcode = searchQuery.trim().toUpperCase();
          
          // Try to extract from displayText or fullAddress
          const postcodeMatch = (suggestion.displayText || suggestion.fullAddress || '')
            .match(/\b([A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2})\b/i);
          
          if (postcodeMatch) {
            extractedPostcode = postcodeMatch[1].toUpperCase();
          }
          
          // Update the suggestion with the extracted postcode
          return {
            ...suggestion,
            components: {
              ...suggestion.components,
              postcode: extractedPostcode
            }
          };
        }
        return suggestion;
      });
      
      // Only filter out suggestions that truly have no valid postcode after enhancement
      suggestions = suggestions.filter(suggestion => {
        const hasValidPostcode = suggestion.components && 
                                suggestion.components.postcode && 
                                suggestion.components.postcode.length >= 4 &&
                                /^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/i.test(suggestion.components.postcode);
        
        if (!hasValidPostcode) {
          console.warn('Filtered suggestion without valid postcode:', suggestion.displayText);
        }
        
        return hasValidPostcode;
      });

      return NextResponse.json({
        success: true,
        data: {
          suggestions,
          provider: result.provider,
          cached: result.cached,
          responseTime: result.responseTime,
          fallbackAttempted: result.fallbackAttempted,
          filteredCount: (result.suggestions || []).length - suggestions.length, // Track filtered addresses
        },
        timestamp: new Date().toISOString(),
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Address autocomplete API error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: {
          type: 'network',
          message: 'Internal server error',
          provider: 'google',
          originalError: error instanceof Error ? error.message : 'Unknown error',
          timestamp: Date.now(),
        },
      },
      { status: 500 }
    );
  }
}
