import { useState, useCallback, useRef, useEffect } from 'react';
import { 
  premiumAddressService, 
  useLuxuryBookingAutocomplete, 
  useStandardBookingAutocomplete,
  postcodeUtils,
  AddressSuggestion,
  LocationCoordinates 
} from '@/lib/premium-location-services';

interface UsePremiumAddressAutocompleteOptions {
  proximity?: LocationCoordinates;
  isLuxuryBooking?: boolean;
  debounceMs?: number;
  maxSuggestions?: number;
  enableCache?: boolean;
}

interface UsePremiumAddressAutocompleteReturn {
  // State
  suggestions: AddressSuggestion[];
  isLoading: boolean;
  error: string | null;
  selectedSuggestion: AddressSuggestion | null;
  
  // Actions
  searchAddresses: (query: string) => Promise<void>;
  searchByPostcode: (postcode: string) => Promise<void>;
  selectSuggestion: (suggestion: AddressSuggestion) => void;
  clearSuggestions: () => void;
  clearError: () => void;
  
  // Utils
  getPlaceDetails: (placeId: string) => Promise<any>;
  getCacheStats: () => { size: number; keys: string[] };
  isValidPostcode: (postcode: string) => boolean;
  formatPostcode: (postcode: string) => string;
}

export const usePremiumAddressAutocomplete = (
  options: UsePremiumAddressAutocompleteOptions = {}
): UsePremiumAddressAutocompleteReturn => {
  const {
    proximity,
    isLuxuryBooking = false,
    debounceMs = 300,
    maxSuggestions = 5,
    enableCache = true
  } = options;

  // State
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSuggestion, setSelectedSuggestion] = useState<AddressSuggestion | null>(null);

  // Refs
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastQueryRef = useRef<string>('');

  // Get the appropriate service based on booking type
  const autocompleteService = isLuxuryBooking 
    ? useLuxuryBookingAutocomplete() 
    : useStandardBookingAutocomplete();

  // Debounced search function
  const searchAddresses = useCallback(async (query: string) => {
    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Update last query
    lastQueryRef.current = query;

    // Clear suggestions for short queries
    if (query.length < 3) {
      setSuggestions([]);
      setError(null);
      return;
    }

    // Set loading state
    setIsLoading(true);
    setError(null);

    // Set debounced timer
    debounceTimerRef.current = setTimeout(async () => {
      try {
        // Check if query is still the latest
        if (lastQueryRef.current !== query) {
          return;
        }

        const results = await autocompleteService.searchAddresses(query, {
          proximity,
          limit: maxSuggestions
        });

        // Check if query is still the latest
        if (lastQueryRef.current !== query) {
          return;
        }

        setSuggestions(results);
        setError(null);
      } catch (err) {
        // Check if query is still the latest
        if (lastQueryRef.current !== query) {
          return;
        }

        const errorMessage = err instanceof Error ? err.message : 'Search failed';
        setError(errorMessage);
        setSuggestions([]);
        console.error('Address search error:', err);
      } finally {
        setIsLoading(false);
      }
    }, debounceMs);
  }, [autocompleteService, proximity, maxSuggestions, debounceMs]);

  // Select suggestion
  const selectSuggestion = useCallback((suggestion: AddressSuggestion) => {
    setSelectedSuggestion(suggestion);
    setSuggestions([]);
    setError(null);
  }, []);

  // Clear suggestions
  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
    setError(null);
    setSelectedSuggestion(null);
    
    // Clear debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Get place details (for luxury booking)
  const getPlaceDetails = useCallback(async (placeId: string, provider: 'google' | 'mapbox' = 'google') => {
    if (!isLuxuryBooking) {
      throw new Error('Place details only available for luxury booking');
    }

    try {
      // Check if autocompleteService has getPlaceDetails method
      if ('getPlaceDetails' in autocompleteService) {
        const details = await (autocompleteService as any).getPlaceDetails(placeId);
        return details;
      } else {
        throw new Error('Place details not available for this service');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get place details';
      setError(errorMessage);
      throw err;
    }
  }, [autocompleteService, isLuxuryBooking]);

  // Search by postcode specifically
  const searchByPostcode = useCallback(async (postcode: string) => {
    const formattedPostcode = postcodeUtils.formatUKPostcode(postcode);
    if (!postcodeUtils.isValidUKPostcode(formattedPostcode)) {
      setError('Invalid UK postcode format');
      return;
    }
    
    await searchAddresses(formattedPostcode);
  }, [searchAddresses]);

  // Get cache stats
  const getCacheStats = useCallback(() => {
    return premiumAddressService.getCacheStats();
  }, []);

  // Postcode validation
  const isValidPostcode = useCallback((postcode: string) => {
    return postcodeUtils.isValidUKPostcode(postcode);
  }, []);

  // Postcode formatting
  const formatPostcode = useCallback((postcode: string) => {
    return postcodeUtils.formatUKPostcode(postcode);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return {
    // State
    suggestions,
    isLoading,
    error,
    selectedSuggestion,
    
    // Actions
    searchAddresses,
    searchByPostcode,
    selectSuggestion,
    clearSuggestions,
    clearError,
    
    // Utils
    getPlaceDetails,
    getCacheStats,
    isValidPostcode,
    formatPostcode
  };
};

export default usePremiumAddressAutocomplete;
