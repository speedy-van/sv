/**
 * Unified pricing hook for Speedy Van
 */

import { useState, useCallback } from 'react';
import { unifiedPricingEngine, type UnifiedPricingRequest, type UnifiedPricingResult } from '@/lib/pricing/unified-engine';

export function useUnifiedPricing() {
  const [pricing, setPricing] = useState<UnifiedPricingResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculatePricing = useCallback(async (request: UnifiedPricingRequest) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await unifiedPricingEngine.calculatePricing(request);
      setPricing(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Pricing calculation failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearPricing = useCallback(() => {
    setPricing(null);
    setError(null);
  }, []);

  return {
    pricing,
    isLoading,
    error,
    calculatePricing,
    clearPricing,
  };
}

export function useAutomaticPricing() {
  const { calculatePricing, ...rest } = useUnifiedPricing();
  
  const calculateAutomaticPricing = async (request: UnifiedPricingRequest) => {
    // Add automatic pricing logic here
    return await calculatePricing(request);
  };

  return {
    ...rest,
    calculateAutomaticPricing,
  };
}