/**
 * UK Postcode Validation Helper
 * 
 * Validates UK postcodes and checks for excluded areas (islands).
 * Uses the free postcodes.io API for validation.
 */

// Excluded postcode areas (UK islands that we don't service)
const EXCLUDED_AREAS = ['IM', 'GY', 'JE']; // Isle of Man, Guernsey, Jersey

export interface PostcodeValidationResult {
  valid: boolean;
  excluded: boolean;
  area: string;
  error?: string;
}

/**
 * Validates a UK postcode and checks if it's in an excluded area
 * @param postcode - The postcode to validate (e.g., "SW1A 1AA")
 * @returns Validation result with details
 */
export async function validateUKPostcode(postcode: string): Promise<PostcodeValidationResult> {
  try {
    // Normalize postcode (remove spaces, uppercase)
    const normalizedPostcode = postcode.replace(/\s+/g, '').toUpperCase();
    
    // Extract area prefix (first 1-2 letters)
    const areaMatch = normalizedPostcode.match(/^([A-Z]{1,2})/);
    const area = areaMatch ? areaMatch[1] : '';
    
    // Check if it's in an excluded area first (fast path)
    const excluded = EXCLUDED_AREAS.includes(area);
    
    // Validate postcode format with regex (basic check)
    const postcodeRegex = /^[A-Z]{1,2}\d{1,2}[A-Z]?\d[A-Z]{2}$/;
    if (!postcodeRegex.test(normalizedPostcode)) {
      return {
        valid: false,
        excluded: false,
        area,
        error: 'Invalid UK postcode format',
      };
    }
    
    // Call postcodes.io API for validation
    try {
      const response = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(normalizedPostcode)}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        // Timeout after 3 seconds
        signal: AbortSignal.timeout(3000),
      });
      
      if (response.status === 404) {
        // Postcode doesn't exist
        return {
          valid: false,
          excluded: false,
          area,
          error: 'Postcode not found',
        };
      }
      
      if (!response.ok) {
        // API error, but format is valid - allow it with warning
        console.warn(`[Postcode Validation] API error for ${postcode}: ${response.status}`);
        return {
          valid: true, // Assume valid if API fails but format is correct
          excluded,
          area,
          error: 'Could not verify postcode (API error)',
        };
      }
      
      const data = await response.json();
      
      if (data.result) {
        // Postcode exists and is valid
        return {
          valid: true,
          excluded,
          area,
        };
      }
      
      return {
        valid: false,
        excluded: false,
        area,
        error: 'Postcode validation failed',
      };
      
    } catch (apiError: any) {
      // Network error or timeout - don't block user, but log it
      console.error(`[Postcode Validation] API call failed for ${postcode}:`, apiError.message);
      
      // If format is valid, allow it (graceful degradation)
      return {
        valid: true,
        excluded,
        area,
        error: 'Could not verify postcode (network error)',
      };
    }
    
  } catch (error: any) {
    console.error('[Postcode Validation] Unexpected error:', error);
    return {
      valid: false,
      excluded: false,
      area: '',
      error: error.message || 'Validation error',
    };
  }
}

/**
 * Validates both pickup and dropoff postcodes
 * @param pickupPostcode - Pickup postcode
 * @param dropoffPostcode - Dropoff postcode
 * @returns Object with validation results for both
 */
export async function validateBothPostcodes(
  pickupPostcode: string,
  dropoffPostcode: string
): Promise<{
  pickupValid: PostcodeValidationResult;
  dropoffValid: PostcodeValidationResult;
  bothValid: boolean;
}> {
  const [pickupValid, dropoffValid] = await Promise.all([
    validateUKPostcode(pickupPostcode),
    validateUKPostcode(dropoffPostcode),
  ]);
  
  return {
    pickupValid,
    dropoffValid,
    bothValid: pickupValid.valid && dropoffValid.valid && !pickupValid.excluded && !dropoffValid.excluded,
  };
}

/**
 * Generates user-friendly error message for invalid postcodes
 */
export function getPostcodeErrorMessage(result: PostcodeValidationResult, locationType: 'pickup' | 'dropoff'): string {
  if (result.excluded) {
    return `We only serve UK mainland (England, Scotland, Wales, Northern Ireland). Unfortunately, we cannot reach the islands like Isle of Man or Channel Islands. The ${locationType} postcode "${result.area}" is in an excluded area.`;
  }
  
  if (!result.valid) {
    return `The ${locationType} postcode you provided seems invalid. Please double-check it (e.g., SW1A 1AA for London) and try again.`;
  }
  
  return '';
}
