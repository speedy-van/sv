/**
 * UK Postcode Validation System
 * Comprehensive postcode validation following UK postal standards
 */

import type { PostcodeValidationResult } from '@/types/dual-provider-address';

export class PostcodeValidator {
  private static readonly UK_POSTCODE_PATTERNS = {
    // Complete UK postcode patterns
    complete: [
      // Standard format: SW1A 1AA, M1 1AA, B33 8TH
      /^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/i,
      // Special cases: GIR 0AA (Girobank), SAN TA1 (Santa Claus)
      /^(GIR\s?0AA|SAN\s?TA1)$/i,
    ],
    // Partial postcode patterns (outward code only)
    partial: [
      // Outward codes: SW1A, M1, B33, EC1A
      /^[A-Z]{1,2}\d[A-Z\d]?$/i,
    ],
    // Area patterns for suggestions
    area: [
      // Area codes: SW, M, B, EC, WC
      /^[A-Z]{1,2}$/i,
    ],
  };

  private static readonly POSTCODE_AREAS = [
    'AB', 'AL', 'B', 'BA', 'BB', 'BD', 'BH', 'BL', 'BN', 'BR', 'BS', 'BT', 'CA', 'CB', 'CF', 'CH', 'CM', 'CO', 'CR', 'CT', 'CV', 'CW',
    'DA', 'DD', 'DE', 'DG', 'DH', 'DL', 'DN', 'DT', 'DY', 'E', 'EC', 'EH', 'EN', 'EX', 'FK', 'FY', 'G', 'GL', 'GU', 'GY', 'HA', 'HD',
    'HG', 'HP', 'HR', 'HS', 'HU', 'HX', 'IG', 'IP', 'IV', 'JE', 'KA', 'KT', 'KW', 'KY', 'L', 'LA', 'LD', 'LE', 'LL', 'LN', 'LS', 'LU',
    'M', 'ME', 'MK', 'ML', 'N', 'NE', 'NG', 'NN', 'NP', 'NR', 'NW', 'OL', 'OX', 'PA', 'PE', 'PH', 'PL', 'PO', 'PR', 'RG', 'RH', 'RM',
    'S', 'SA', 'SE', 'SG', 'SK', 'SL', 'SM', 'SN', 'SO', 'SP', 'SR', 'SS', 'ST', 'SW', 'SY', 'TA', 'TD', 'TF', 'TN', 'TQ', 'TR', 'TS',
    'TW', 'UB', 'W', 'WA', 'WC', 'WD', 'WF', 'WN', 'WR', 'WS', 'WV', 'YO', 'ZE'
  ];

  private static readonly COMMON_POSTCODES = [
    'SW1A 1AA', 'M1 1AA', 'B33 8TH', 'W1A 0AX', 'EC1A 1BB', 'WC1A 1AA',
    'N1 9GU', 'E1 6AN', 'SE1 9RT', 'SW1E 6LB', 'NW1 6XE', 'NE1 7RU'
  ];

  /**
   * Validate and format UK postcode
   */
  static validateUKPostcode(postcode: string): PostcodeValidationResult {
    const cleaned = postcode.trim().toUpperCase().replace(/\s+/g, '');
    
    if (!cleaned) {
      return {
        isValid: false,
        formatted: '',
        type: 'invalid',
      };
    }

    // Check complete postcode patterns
    for (const pattern of this.UK_POSTCODE_PATTERNS.complete) {
      if (pattern.test(cleaned)) {
        return {
          isValid: true,
          formatted: this.formatCompletePostcode(cleaned),
          type: 'complete',
        };
      }
    }

    // Check partial postcode patterns
    for (const pattern of this.UK_POSTCODE_PATTERNS.partial) {
      if (pattern.test(cleaned)) {
        return {
          isValid: true,
          formatted: cleaned,
          type: 'partial',
          suggestions: this.generatePostcodeSuggestions(cleaned),
        };
      }
    }

    // Check area patterns
    for (const pattern of this.UK_POSTCODE_PATTERNS.area) {
      if (pattern.test(cleaned)) {
        return {
          isValid: false,
          formatted: cleaned,
          type: 'invalid',
          suggestions: this.generateAreaSuggestions(cleaned),
        };
      }
    }

    // Try to fix common formatting issues
    const fixed = this.attemptPostcodeFix(cleaned);
    if (fixed) {
      return this.validateUKPostcode(fixed);
    }

    return {
      isValid: false,
      formatted: cleaned,
      type: 'invalid',
    };
  }

  /**
   * Format complete postcode with proper spacing
   */
  private static formatCompletePostcode(postcode: string): string {
    // Handle special cases
    if (postcode === 'GIR0AA') return 'GIR 0AA';
    if (postcode === 'SANTA1') return 'SAN TA1';

    // Standard formatting: outward code + space + inward code
    if (postcode.length >= 5) {
      const outward = postcode.slice(0, -3);
      const inward = postcode.slice(-3);
      return `${outward} ${inward}`;
    }

    return postcode;
  }

  /**
   * Generate suggestions for partial postcodes
   */
  private static generatePostcodeSuggestions(partial: string): string[] {
    const suggestions: string[] = [];
    
    // If it's a complete outward code, suggest some common inward codes
    if (partial.length >= 3 && partial.length <= 4) {
      const commonInward = ['1AA', '1AB', '1AD', '1AE', '1AF', '1AG', '2AA', '2AB', '3AA', '4AA'];
      
      commonInward.forEach(inward => {
        suggestions.push(`${partial} ${inward}`);
      });
    }

    return suggestions.slice(0, 5); // Limit to 5 suggestions
  }

  /**
   * Generate suggestions for area codes
   */
  private static generateAreaSuggestions(area: string): string[] {
    const suggestions: string[] = [];
    
    // Find matching areas
    const matchingAreas = this.POSTCODE_AREAS.filter(postcodeArea => 
      postcodeArea.startsWith(area.toUpperCase())
    );

    matchingAreas.forEach(areaCode => {
      // Add some common postcodes for this area
      suggestions.push(`${areaCode}1 1AA`);
      suggestions.push(`${areaCode}1 2AB`);
    });

    return suggestions.slice(0, 5);
  }

  /**
   * Attempt to fix common postcode formatting issues
   */
  private static attemptPostcodeFix(postcode: string): string | null {
    // Remove extra spaces and normalize
    const normalized = postcode.replace(/\s+/g, '').toUpperCase();
    
    // Try to insert space in the right place
    if (normalized.length === 6) {
      // Likely missing space: SW1A1AA -> SW1A 1AA
      const outward = normalized.slice(0, -3);
      const inward = normalized.slice(-3);
      
      if (/^[A-Z]{1,2}\d[A-Z\d]?$/.test(outward) && /^[A-Z]{2}$/.test(inward)) {
        return `${outward} ${inward}`;
      }
    }

    // Try to fix missing letters
    if (normalized.length === 5 && /^[A-Z]{1,2}\d{2}$/.test(normalized)) {
      // Likely missing letter: SW12 -> SW1A
      const area = normalized.slice(0, -2);
      const number = normalized.slice(-2);
      return `${area}${number.slice(0, 1)}A`;
    }

    return null;
  }

  /**
   * Check if a string looks like a UK postcode (loose validation)
   */
  static isPostcodeLike(text: string): boolean {
    const cleaned = text.trim().toUpperCase().replace(/\s+/g, '');
    
    // Check if it contains postcode-like patterns
    return /^[A-Z]{1,2}\d[A-Z\d]?[A-Z\d]{2,3}$/.test(cleaned) ||
           /^(GIR|SAN)/.test(cleaned) ||
           this.POSTCODE_AREAS.some(area => cleaned.startsWith(area));
  }

  /**
   * Normalize UK postcode for API calls
   * Ensures proper format: SW1A1AA → SW1A 1AA
   */
  static normalizeForAPI(postcode: string): string {
    const cleaned = postcode.trim().toUpperCase().replace(/\s+/g, '');
    
    // Handle special cases
    if (cleaned === 'GIR0AA') return 'GIR 0AA';
    if (cleaned === 'SANTA1') return 'SAN TA1';
    
    // Standard UK postcode: outward code + space + inward code
    if (cleaned.length >= 5 && cleaned.length <= 7) {
      const outward = cleaned.slice(0, -3);
      const inward = cleaned.slice(-3);
      
      // Validate outward and inward codes
      if (/^[A-Z]{1,2}\d[A-Z\d]?$/.test(outward) && /^\d[A-Z]{2}$/.test(inward)) {
        return `${outward} ${inward}`;
      }
    }
    
    return cleaned; // Return as-is if can't normalize
  }

  /**
   * Extract outcode from postcode (for area-based searches)
   */
  static getOutcode(postcode: string): string {
    const normalized = this.normalizeForAPI(postcode);
    const spaceIndex = normalized.indexOf(' ');
    
    return spaceIndex > 0 ? normalized.substring(0, spaceIndex) : normalized;
  }

  /**
   * Extract postcode from address string
   */
  static extractPostcodeFromAddress(address: string): string | null {
    const words = address.split(/\s+/);
    
    // Look for postcode patterns in the address
    for (const word of words.reverse()) { // Check from end first
      const cleaned = word.replace(/[^\w]/g, '').toUpperCase();
      
      if (this.isPostcodeLike(cleaned)) {
        const validation = this.validateUKPostcode(cleaned);
        if (validation.isValid) {
          return validation.formatted;
        }
      }
    }

    return null;
  }

  /**
   * Get postcode area information
   */
  static getPostcodeArea(postcode: string): { area: string; district?: string } | null {
    const validation = this.validateUKPostcode(postcode);
    
    if (!validation.isValid) {
      return null;
    }

    const formatted = validation.formatted;
    const outward = formatted.split(' ')[0];
    
    if (outward.length >= 2) {
      const area = outward.slice(0, 2);
      const district = outward.slice(2);
      
      return {
        area,
        district: district || undefined,
      };
    }

    return { area: outward };
  }

  /**
   * Validate postcode for specific use cases
   */
  static validateForUseCase(postcode: string, useCase: 'delivery' | 'service' | 'general'): PostcodeValidationResult {
    const validation = this.validateUKPostcode(postcode);
    
    if (!validation.isValid) {
      return validation;
    }

    // Additional validation for specific use cases
    switch (useCase) {
      case 'delivery':
        // For delivery, we prefer complete postcodes
        if (validation.type === 'partial') {
          return {
            ...validation,
            isValid: false,
            suggestions: validation.suggestions || [],
          };
        }
        break;
        
      case 'service':
        // For service areas, partial postcodes might be acceptable
        break;
        
      case 'general':
        // General validation - accept both complete and partial
        break;
    }

    return validation;
  }
}

export default PostcodeValidator;
