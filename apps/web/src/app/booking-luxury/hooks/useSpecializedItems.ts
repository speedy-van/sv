'use client';

import { useState, useCallback } from 'react';
import { useToast } from '@chakra-ui/react';
import {
  SpecializedItemCategory,
  InsuranceTier,
  type InsuranceQuote,
} from '@/types/specialized-logistics';
import {
  detectSpecializedItem,
  requiresSpecializedHandling,
  getDefaultTechnicalSpecs,
} from '../specialized/specialized-detection';

interface SpecializedItemData {
  bookingItemId: string;
  category: SpecializedItemCategory;
  technicalSpecs: Record<string, any>;
  declaredValue: number;
  insuranceTier?: InsuranceTier;
  insuranceQuote?: InsuranceQuote;
}

export function useSpecializedItems() {
  const [specializedItems, setSpecializedItems] = useState<Record<string, SpecializedItemData>>({});
  const [activeWizardItemId, setActiveWizardItemId] = useState<string | null>(null);
  const toast = useToast();

  /**
   * Check if an item requires specialized handling
   */
  const checkIfSpecialized = useCallback((item: any): boolean => {
    return requiresSpecializedHandling(item);
  }, []);

  /**
   * Detect the specialized category of an item
   */
  const detectCategory = useCallback((itemName: string): SpecializedItemCategory | null => {
    return detectSpecializedItem(itemName);
  }, []);

  /**
   * Open the specialized item wizard for a specific item
   */
  const openWizard = useCallback((itemId: string) => {
    setActiveWizardItemId(itemId);
  }, []);

  /**
   * Close the specialized item wizard
   */
  const closeWizard = useCallback(() => {
    setActiveWizardItemId(null);
  }, []);

  /**
   * Save specialized item data
   */
  const saveSpecializedItem = useCallback((itemId: string, data: Partial<SpecializedItemData>) => {
    setSpecializedItems(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        ...data,
        bookingItemId: itemId,
      } as SpecializedItemData,
    }));

    toast({
      title: 'Specialized Item Saved',
      description: 'Your specialized item details have been recorded.',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  }, [toast]);

  /**
   * Get specialized item data for a specific item
   */
  const getSpecializedItem = useCallback((itemId: string): SpecializedItemData | null => {
    return specializedItems[itemId] || null;
  }, [specializedItems]);

  /**
   * Check if an item has specialized data saved
   */
  const hasSpecializedData = useCallback((itemId: string): boolean => {
    return !!specializedItems[itemId];
  }, [specializedItems]);

  /**
   * Remove specialized item data
   */
  const removeSpecializedItem = useCallback((itemId: string) => {
    setSpecializedItems(prev => {
      const newItems = { ...prev };
      delete newItems[itemId];
      return newItems;
    });
  }, []);

  /**
   * Get total insurance premium for all specialized items
   */
  const getTotalInsurancePremium = useCallback((): number => {
    return Object.values(specializedItems).reduce((total, item) => {
      return total + (item.insuranceQuote?.finalPremium || 0);
    }, 0);
  }, [specializedItems]);

  /**
   * Get count of specialized items
   */
  const getSpecializedItemCount = useCallback((): number => {
    return Object.keys(specializedItems).length;
  }, [specializedItems]);

  /**
   * Get summary of all specialized items
   */
  const getSpecializedItemsSummary = useCallback(() => {
    return Object.values(specializedItems).map(item => ({
      id: item.bookingItemId,
      category: item.category,
      declaredValue: item.declaredValue,
      insuranceTier: item.insuranceTier,
      premium: item.insuranceQuote?.finalPremium || 0,
    }));
  }, [specializedItems]);

  /**
   * Get default technical specs for an item
   */
  const getDefaultSpecs = useCallback((category: SpecializedItemCategory, item: any) => {
    return getDefaultTechnicalSpecs(category, item);
  }, []);

  /**
   * Validate that all required specialized items have been configured
   */
  const validateSpecializedItems = useCallback((items: any[]): { valid: boolean; missingItems: string[] } => {
    const missingItems: string[] = [];

    items.forEach(item => {
      if (requiresSpecializedHandling(item) && !specializedItems[item.id]) {
        missingItems.push(item.name);
      }
    });

    return {
      valid: missingItems.length === 0,
      missingItems,
    };
  }, [specializedItems]);

  return {
    // State
    specializedItems,
    activeWizardItemId,
    
    // Detection
    checkIfSpecialized,
    detectCategory,
    
    // Wizard control
    openWizard,
    closeWizard,
    
    // Data management
    saveSpecializedItem,
    getSpecializedItem,
    hasSpecializedData,
    removeSpecializedItem,
    
    // Calculations
    getTotalInsurancePremium,
    getSpecializedItemCount,
    getSpecializedItemsSummary,
    
    // Utilities
    getDefaultSpecs,
    validateSpecializedItems,
  };
}
