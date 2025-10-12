/**
 * Address Structure Validation for Enterprise Engine
 * MANDATORY: All addresses must be full structured addresses from autocomplete
 * NO postcode-only shortcuts allowed
 */

import { z } from 'zod';

/**
 * Full structured address schema - ENTERPRISE REQUIREMENT
 * Rejects any address without complete structure
 */
export const FullStructuredAddressSchema = z.object({
  street: z.string().min(1, 'Street name is required'),
  number: z.string().min(1, 'House/building number is required'),
  city: z.string().min(1, 'City is required'),
  postcode: z.string().regex(/^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/i, 'Valid UK postcode is required'),
  county: z.string().optional(),
  coordinates: z.object({
    lat: z.number().min(-90).max(90, 'Invalid latitude'),
    lng: z.number().min(-180).max(180, 'Invalid longitude')
  }, { required_error: 'Coordinates are required for Enterprise Engine' })
});

/**
 * Legacy address schema (for compatibility)
 */
export const LegacyAddressSchema = z.object({
  full: z.string().optional(),
  line1: z.string().optional(),
  line2: z.string().optional(),
  city: z.string().optional(),
  postcode: z.string().optional(),
  coordinates: z.object({
    lat: z.number(),
    lng: z.number()
  }).optional(),
  formatted: z.object({
    street: z.string().optional(),
    houseNumber: z.string().optional(),
    flatNumber: z.string().optional()
  }).optional(),
  houseNumber: z.string().optional(),
});

export type FullStructuredAddress = z.infer<typeof FullStructuredAddressSchema>;
export type LegacyAddress = z.infer<typeof LegacyAddressSchema>;

/**
 * Convert legacy address format to Enterprise Engine format
 * Extracts required fields or throws validation error
 */
export function convertToFullStructuredAddress(
  legacyAddress: LegacyAddress,
  context: string = 'address'
): FullStructuredAddress {
  try {
    // Extract street and number from various possible fields
    const street = legacyAddress.formatted?.street || 
                  (legacyAddress.line1?.split(' ').slice(1).join(' ')) || 
                  '';
    
    const number = legacyAddress.formatted?.houseNumber || 
                  legacyAddress.houseNumber || 
                  (legacyAddress.line1?.split(' ')[0]) || 
                  '';

    const fullAddress = {
      street,
      number,
      city: legacyAddress.city || '',
      postcode: legacyAddress.postcode || '',
      coordinates: legacyAddress.coordinates || { lat: 0, lng: 0 }
    };

    // Validate using strict schema
    return FullStructuredAddressSchema.parse(fullAddress);
    
  } catch (error) {
    throw new Error(
      `${context}: Invalid address structure for Enterprise Engine. ` +
      `Required: street, number, city, postcode, coordinates. ` +
      `Error: ${error instanceof Error ? error.message : 'Unknown validation error'}`
    );
  }
}

/**
 * Validate array of addresses (for multi-drop)
 */
export function validateAddressArray(
  addresses: LegacyAddress[], 
  context: string = 'addresses'
): FullStructuredAddress[] {
  return addresses.map((address, index) => 
    convertToFullStructuredAddress(address, `${context}[${index}]`)
  );
}

/**
 * Check if legacy address has sufficient data for conversion
 */
export function hasMinimumAddressData(address: LegacyAddress): boolean {
  const hasCoordinates = address.coordinates?.lat && address.coordinates?.lng;
  const hasStreetInfo = address.line1 || address.formatted?.street;
  const hasLocationInfo = address.city && address.postcode;
  
  return !!(hasCoordinates && hasStreetInfo && hasLocationInfo);
}

/**
 * Get validation status for UI display
 */
export function getAddressValidationStatus(address: LegacyAddress) {
  try {
    convertToFullStructuredAddress(address);
    return {
      isValid: true,
      status: 'complete' as const,
      message: 'Address ready for Enterprise Engine'
    };
  } catch (error) {
    const hasMinimal = hasMinimumAddressData(address);
    return {
      isValid: false,
      status: hasMinimal ? 'partial' as const : 'missing' as const,
      message: error instanceof Error ? error.message : 'Address validation failed'
    };
  }
}

/**
 * Sanitize address for logging (remove sensitive data)
 */
export function sanitizeAddressForLog(address: FullStructuredAddress | LegacyAddress) {
  const baseInfo = {
    city: 'city' in address ? address.city : 'unknown',
    postcode: 'postcode' in address && address.postcode 
      ? address.postcode.substring(0, 4) + '***' 
      : 'unknown',
  };

  if ('coordinates' in address && address.coordinates) {
    return {
      ...baseInfo,
      coordinates: address.coordinates
    };
  }

  return baseInfo;
}

/**
 * Middleware for API route validation
 */
export function createAddressValidationMiddleware() {
  return (addresses: any[], context: string) => {
    if (!Array.isArray(addresses) || addresses.length === 0) {
      throw new Error(`${context}: No addresses provided`);
    }

    return addresses.map((address, index) => {
      if (!address) {
        throw new Error(`${context}[${index}]: Null or undefined address`);
      }

      // Check for postcode-only pattern (FORBIDDEN)
      if (typeof address === 'string' || 
          (typeof address === 'object' && Object.keys(address).length === 1 && address.postcode)) {
        throw new Error(
          `${context}[${index}]: Postcode-only addresses are forbidden. ` +
          `Enterprise Engine requires full structured addresses from autocomplete.`
        );
      }

      return convertToFullStructuredAddress(address, `${context}[${index}]`);
    });
  };
}

/**
 * Runtime assertion for API endpoints
 */
export function assertFullStructuredAddresses(
  addresses: any[], 
  context: string = 'API request'
): FullStructuredAddress[] {
  const validator = createAddressValidationMiddleware();
  return validator(addresses, context);
}