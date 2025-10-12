/**
 * Cross-Provider Data Validation System
 * Validates address accuracy by comparing results from both Google Places and Mapbox APIs
 */

import type { Provider, AddressSuggestion, Coordinates } from '@/types/dual-provider-address';

interface ValidationResult {
  isValid: boolean;
  confidence: number;
  issues: string[];
  recommendations: string[];
  comparisonData?: {
    coordinateDistance: number;
    addressSimilarity: number;
    providerAgreement: number;
  };
}

interface CrossProviderComparison {
  primarySuggestions: AddressSuggestion[];
  fallbackSuggestions: AddressSuggestion[];
  validationResults: ValidationResult[];
  overallConfidence: number;
  recommendedProvider: Provider;
}

export class CrossProviderValidator {
  private static instance: CrossProviderValidator;
  
  // Distance thresholds for coordinate validation (in meters)
  private readonly COORDINATE_TOLERANCE_STRICT = 100;   // 100m for exact matches
  private readonly COORDINATE_TOLERANCE_LOOSE = 1000;   // 1km for general area matches
  
  // String similarity thresholds
  private readonly ADDRESS_SIMILARITY_THRESHOLD = 0.7;  // 70% similarity required
  private readonly POSTCODE_WEIGHT = 0.4;               // Postcode importance in validation
  private readonly COORDINATES_WEIGHT = 0.6;            // Coordinates importance in validation

  static getInstance(): CrossProviderValidator {
    if (!CrossProviderValidator.instance) {
      CrossProviderValidator.instance = new CrossProviderValidator();
    }
    return CrossProviderValidator.instance;
  }

  /**
   * Validate address suggestions by comparing results from both providers
   */
  async validateCrossProvider(
    primarySuggestions: AddressSuggestion[],
    fallbackSuggestions: AddressSuggestion[],
    query: string
  ): Promise<CrossProviderComparison> {
    const validationResults: ValidationResult[] = [];
    let totalConfidence = 0;

    // Validate each primary suggestion against fallback suggestions
    for (const primary of primarySuggestions) {
      const result = await this.validateSingleAddress(primary, fallbackSuggestions, query);
      validationResults.push(result);
      totalConfidence += result.confidence;
    }

    const overallConfidence = primarySuggestions.length > 0 
      ? totalConfidence / primarySuggestions.length 
      : 0;

    const recommendedProvider = this.determineRecommendedProvider(
      primarySuggestions,
      fallbackSuggestions,
      validationResults
    );

    return {
      primarySuggestions,
      fallbackSuggestions,
      validationResults,
      overallConfidence,
      recommendedProvider,
    };
  }

  /**
   * Validate a single address against alternative provider results
   */
  private async validateSingleAddress(
    targetAddress: AddressSuggestion,
    compareAgainst: AddressSuggestion[],
    originalQuery: string
  ): Promise<ValidationResult> {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let confidence = targetAddress.confidence;

    // Find the best match in comparison results
    const bestMatch = this.findBestMatch(targetAddress, compareAgainst);
    
    if (!bestMatch) {
      return {
        isValid: false,
        confidence: Math.max(0.1, confidence * 0.5),
        issues: ['No matching address found in fallback provider'],
        recommendations: ['Consider using alternative provider for this query'],
      };
    }

    // Compare coordinates
    const coordinateDistance = this.calculateDistance(
      targetAddress.coordinates,
      bestMatch.coordinates
    );

    // Compare address similarity
    const addressSimilarity = this.calculateStringSimilarity(
      targetAddress.fullAddress,
      bestMatch.fullAddress
    );

    // Calculate provider agreement score
    const providerAgreement = this.calculateProviderAgreement(
      targetAddress,
      bestMatch,
      coordinateDistance,
      addressSimilarity
    );

    // Validation checks
    if (coordinateDistance > this.COORDINATE_TOLERANCE_LOOSE) {
      issues.push(`Large coordinate discrepancy: ${Math.round(coordinateDistance)}m between providers`);
      confidence *= 0.7;
    } else if (coordinateDistance > this.COORDINATE_TOLERANCE_STRICT) {
      issues.push(`Moderate coordinate difference: ${Math.round(coordinateDistance)}m between providers`);
      confidence *= 0.9;
    }

    if (addressSimilarity < this.ADDRESS_SIMILARITY_THRESHOLD) {
      issues.push(`Low address similarity: ${(addressSimilarity * 100).toFixed(1)}% match between providers`);
      confidence *= 0.8;
    }

    // Postcode validation
    if (targetAddress.components.postcode !== bestMatch.components.postcode) {
      if (targetAddress.components.postcode && bestMatch.components.postcode) {
        issues.push('Postcode mismatch between providers');
        confidence *= 0.6;
      }
    }

    // Generate recommendations
    if (providerAgreement > 0.8) {
      recommendations.push('High provider agreement - result is reliable');
    } else if (providerAgreement > 0.6) {
      recommendations.push('Moderate provider agreement - consider validation');
    } else {
      recommendations.push('Low provider agreement - manual verification recommended');
    }

    if (coordinateDistance < this.COORDINATE_TOLERANCE_STRICT && addressSimilarity > 0.9) {
      recommendations.push('Excellent cross-provider validation - high confidence result');
    }

    return {
      isValid: issues.length === 0,
      confidence: Math.max(0.1, Math.min(1.0, confidence)),
      issues,
      recommendations,
      comparisonData: {
        coordinateDistance,
        addressSimilarity,
        providerAgreement,
      },
    };
  }

  /**
   * Find the best matching address from comparison results
   */
  private findBestMatch(
    target: AddressSuggestion,
    candidates: AddressSuggestion[]
  ): AddressSuggestion | null {
    if (candidates.length === 0) return null;

    let bestMatch: AddressSuggestion | null = null;
    let bestScore = 0;

    for (const candidate of candidates) {
      // Calculate composite matching score
      const coordinateDistance = this.calculateDistance(target.coordinates, candidate.coordinates);
      const addressSimilarity = this.calculateStringSimilarity(target.fullAddress, candidate.fullAddress);
      
      // Normalize coordinate score (closer = higher score)
      const coordinateScore = Math.max(0, 1 - (coordinateDistance / this.COORDINATE_TOLERANCE_LOOSE));
      
      // Composite score
      const compositeScore = (coordinateScore * this.COORDINATES_WEIGHT) + 
                           (addressSimilarity * (1 - this.COORDINATES_WEIGHT));

      if (compositeScore > bestScore) {
        bestScore = compositeScore;
        bestMatch = candidate;
      }
    }

    return bestScore > 0.3 ? bestMatch : null; // Minimum threshold for considering a match
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   */
  private calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (coord1.lat * Math.PI) / 180;
    const φ2 = (coord2.lat * Math.PI) / 180;
    const Δφ = ((coord2.lat - coord1.lat) * Math.PI) / 180;
    const Δλ = ((coord2.lng - coord1.lng) * Math.PI) / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  /**
   * Calculate string similarity using Jaro-Winkler algorithm
   */
  private calculateStringSimilarity(str1: string, str2: string): number {
    if (str1 === str2) return 1.0;
    
    const s1 = str1.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
    const s2 = str2.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
    
    if (s1 === s2) return 1.0;
    if (s1.length === 0 || s2.length === 0) return 0.0;

    // Simple similarity based on common words and character overlap
    const words1 = new Set(s1.split(/\s+/));
    const words2 = new Set(s2.split(/\s+/));
    
    const intersection = new Set([...words1].filter(word => words2.has(word)));
    const union = new Set([...words1, ...words2]);
    
    const wordSimilarity = intersection.size / union.size;
    
    // Character-level similarity
    const maxLength = Math.max(s1.length, s2.length);
    let matches = 0;
    const minLength = Math.min(s1.length, s2.length);
    
    for (let i = 0; i < minLength; i++) {
      if (s1[i] === s2[i]) matches++;
    }
    
    const charSimilarity = matches / maxLength;
    
    // Combined similarity
    return (wordSimilarity * 0.7) + (charSimilarity * 0.3);
  }

  /**
   * Calculate overall provider agreement score
   */
  private calculateProviderAgreement(
    address1: AddressSuggestion,
    address2: AddressSuggestion,
    coordinateDistance: number,
    addressSimilarity: number
  ): number {
    // Coordinate agreement (closer = higher agreement)
    const coordinateAgreement = Math.max(0, 1 - (coordinateDistance / this.COORDINATE_TOLERANCE_LOOSE));
    
    // Address text agreement
    const textAgreement = addressSimilarity;
    
    // Postcode agreement
    let postcodeAgreement = 1.0;
    if (address1.components.postcode && address2.components.postcode) {
      postcodeAgreement = address1.components.postcode === address2.components.postcode ? 1.0 : 0.0;
    }
    
    // Weighted agreement score
    return (coordinateAgreement * 0.4) + (textAgreement * 0.4) + (postcodeAgreement * 0.2);
  }

  /**
   * Determine which provider gives more reliable results
   */
  private determineRecommendedProvider(
    primarySuggestions: AddressSuggestion[],
    fallbackSuggestions: AddressSuggestion[],
    validationResults: ValidationResult[]
  ): Provider {
    if (primarySuggestions.length === 0) {
      return fallbackSuggestions.length > 0 
        ? fallbackSuggestions[0].provider 
        : 'google'; // Default fallback
    }

    const primaryProvider = primarySuggestions[0].provider;
    const validResults = validationResults.filter(r => r.isValid);
    const averageConfidence = validationResults.reduce((sum, r) => sum + r.confidence, 0) / validationResults.length;

    // If validation confidence is high, trust the primary provider
    if (averageConfidence > 0.8 && validResults.length > 0) {
      return primaryProvider;
    }

    // If validation shows low confidence, might need to consider fallback
    if (averageConfidence < 0.5 && fallbackSuggestions.length > 0) {
      const fallbackProvider = fallbackSuggestions[0].provider;
      return fallbackProvider;
    }

    // Default to primary provider
    return primaryProvider;
  }

  /**
   * Quick validation for a single address without cross-provider comparison
   */
  validateSingleAddressQuick(address: AddressSuggestion, originalQuery: string): ValidationResult {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let confidence = address.confidence;

    // Basic validation checks
    if (!address.coordinates || (address.coordinates.lat === 0 && address.coordinates.lng === 0)) {
      issues.push('Invalid or missing coordinates');
      confidence *= 0.5;
    }

    if (!address.components.postcode && originalQuery.match(/[A-Z]{1,2}[0-9][A-Z0-9]?\s?[0-9][A-Z]{2}/i)) {
      issues.push('Postcode query but no postcode in result');
      confidence *= 0.7;
    }

    if (address.fullAddress.length < 10) {
      issues.push('Address appears too short or incomplete');
      confidence *= 0.8;
    }

    // Generate recommendations
    if (confidence > 0.8) {
      recommendations.push('High confidence result - suitable for use');
    } else if (confidence > 0.5) {
      recommendations.push('Moderate confidence - consider additional validation');
    } else {
      recommendations.push('Low confidence - manual verification recommended');
    }

    return {
      isValid: issues.length === 0,
      confidence: Math.max(0.1, Math.min(1.0, confidence)),
      issues,
      recommendations,
    };
  }
}

export const crossProviderValidator = CrossProviderValidator.getInstance();
export default crossProviderValidator;