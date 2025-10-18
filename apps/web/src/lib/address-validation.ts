/**
 * Address Validation Service
 * Validates address selections and provides user feedback
 */

import { useToast } from '@chakra-ui/react';
import type { AddressSuggestion } from '@/types/dual-provider-address';
import type { Address } from '@/app/booking-luxury/hooks/useBookingForm';

export interface AddressValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export class AddressValidationService {
  /**
   * Validate a single address
   */
  static validateAddress(address: Address | null, fieldName: string = 'Address'): AddressValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!address) {
      errors.push(`${fieldName} is required`);
      return { isValid: false, errors, warnings };
    }

    // Check if address string is present and not empty
    if (!address.address || address.address.trim().length === 0) {
      errors.push(`${fieldName} cannot be empty`);
    }

    // Check if city is present
    if (!address.city || address.city.trim().length === 0) {
      errors.push(`${fieldName} must include a city`);
    }

    // Check if postcode is present and valid UK format
    if (!address.postcode || address.postcode.trim().length === 0) {
      errors.push(`${fieldName} must include a postcode`);
    } else {
      const ukPostcodeRegex = /^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/i;
      if (!ukPostcodeRegex.test(address.postcode)) {
        errors.push(`${fieldName} postcode format is invalid (use UK format like SW1A 1AA)`);
      }
    }

    // Check if coordinates are present and valid
    if (!address.coordinates) {
      errors.push(`${fieldName} location could not be found`);
    } else {
      const { lat, lng } = address.coordinates;
      
      if (lat === 0 && lng === 0) {
        errors.push(`${fieldName} location could not be determined`);
      }
      
      // Check if coordinates are within UK bounds (roughly)
      const isWithinUK = (
        lat !== undefined && lng !== undefined &&
        lat >= 49.5 && lat <= 61.0 && // Latitude range for UK
        lng >= -8.5 && lng <= 2.0      // Longitude range for UK
      );
      
      if (!isWithinUK) {
        warnings.push(`${fieldName} appears to be outside the UK - please verify this is correct`);
      }
    }

    // Check address length
    if (address.address && address.address.length > 100) {
      warnings.push(`${fieldName} is quite long - please ensure it's accurate`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate pickup and dropoff addresses together
   */
  static validateAddressPair(
    pickupAddress: Address | null, 
    dropoffAddress: Address | null
  ): AddressValidationResult {
    const pickupResult = this.validateAddress(pickupAddress, 'Pickup address');
    const dropoffResult = this.validateAddress(dropoffAddress, 'Dropoff address');

    const allErrors = [...pickupResult.errors, ...dropoffResult.errors];
    const allWarnings = [...pickupResult.warnings, ...dropoffResult.warnings];

    // Check if addresses are the same
    if (pickupAddress && dropoffAddress && 
        pickupAddress.address === dropoffAddress.address &&
        pickupAddress.postcode === dropoffAddress.postcode) {
      allErrors.push('Pickup and dropoff addresses cannot be the same');
    }

    // Check distance (warn if too short or too long)
    if (pickupAddress?.coordinates && dropoffAddress?.coordinates &&
        pickupAddress.coordinates.lat !== 0 && dropoffAddress.coordinates.lat !== 0) {
      
      const distance = this.calculateDistance( // DEPRECATED - internal use only
        { lat: pickupAddress.coordinates.lat || 0, lng: pickupAddress.coordinates.lng || 0 },
        { lat: dropoffAddress.coordinates.lat || 0, lng: dropoffAddress.coordinates.lng || 0 }
      );

      if (distance < 0.1) { // Less than 0.1 miles
        allWarnings.push('The distance between addresses is very short - please verify both addresses');
      } else if (distance > 200) { // More than 200 miles
        allWarnings.push('The distance between addresses is quite long - additional charges may apply');
      }
    }

    return {
      isValid: allErrors.length === 0,
      errors: allErrors,
      warnings: allWarnings,
    };
  }

  /**
   * Convert AddressSuggestion to Address format
   */
  static convertSuggestionToAddress(suggestion: AddressSuggestion): Address {
    return {
      address: suggestion.displayText,
      city: suggestion.components.city,
      postcode: suggestion.components.postcode,
      coordinates: {
        lat: suggestion.coordinates.lat,
        lng: suggestion.coordinates.lng,
      },
      houseNumber: suggestion.components.houseNumber || '',
      flatNumber: '',
      formatted_address: suggestion.fullAddress,
      place_name: suggestion.displayText,
    };
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  private static calculateDistance( // DEPRECATED - internal use only
    coord1: { lat: number; lng: number },
    coord2: { lat: number; lng: number }
  ): number {
    const R = 3959; // Earth's radius in miles
    const dLat = (coord2.lat - coord1.lat) * Math.PI / 180;
    const dLng = (coord2.lng - coord1.lng) * Math.PI / 180;
    
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(coord1.lat * Math.PI / 180) * Math.cos(coord2.lat * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }
}

/**
 * React hook for address validation with toast notifications
 */
export const useAddressValidation = () => {
  const toast = useToast();

  const validateAndNotify = (
    pickupAddress: Address | null,
    dropoffAddress: Address | null,
    showToasts: boolean = true
  ): boolean => {
    const result = AddressValidationService.validateAddressPair(pickupAddress, dropoffAddress);

    if (showToasts) {
      // Show error toasts
      result.errors.forEach(error => {
        toast({
          title: 'Address Validation Error',
          description: error,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      });

      // Show warning toasts
      result.warnings.forEach(warning => {
        toast({
          title: 'Address Warning',
          description: warning,
          status: 'warning',
          duration: 4000,
          isClosable: true,
        });
      });

      // Show success toast if everything is valid
      if (result.isValid && result.warnings.length === 0) {
        toast({
          title: 'Addresses Validated',
          description: 'Both pickup and dropoff addresses are valid',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
    }

    return result.isValid;
  };

  const validateSingleAddress = (
    address: Address | null,
    fieldName: string,
    showToasts: boolean = true
  ): boolean => {
    const result = AddressValidationService.validateAddress(address, fieldName);

    if (showToasts) {
      result.errors.forEach(error => {
        toast({
          title: `${fieldName} Error`,
          description: error,
          status: 'error',
          duration: 4000,
          isClosable: true,
        });
      });

      result.warnings.forEach(warning => {
        toast({
          title: `${fieldName} Warning`,
          description: warning,
          status: 'warning',
          duration: 3000,
          isClosable: true,
        });
      });
    }

    return result.isValid;
  };

  return {
    validateAndNotify,
    validateSingleAddress,
    validateAddressPair: AddressValidationService.validateAddressPair,
    validateAddress: AddressValidationService.validateAddress,
  };
};

export default AddressValidationService;