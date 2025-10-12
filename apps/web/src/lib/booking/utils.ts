// Define Item type locally to avoid import issues
export interface Item {
  id: string;
  name: string;
  description: string;
  category: string;
  size: 'small' | 'medium' | 'large';
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  weight: number;
  volume: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  image?: string;
}
import { COMPREHENSIVE_CATALOG, type CatalogItem } from '../pricing/catalog-dataset';
import { getItemImageWithFallback } from '../images/item-images';

// Utility function to round to 2 decimal places and fix floating-point precision
export const roundToTwoDecimals = (value: number): number => {
  if (typeof value !== 'number' || isNaN(value)) {
    console.warn('⚠️ Invalid value passed to roundToTwoDecimals:', value, typeof value);
    return 0;
  }
  return Math.round(value * 100) / 100;
};

// Calculate required workers based on items
export const calculateRequiredWorkers = (items: Item[]): number => {
  let requiredWorkers = 2; // Base crew size
  
  items.forEach(item => {
    // Heavy items require additional workers
    const itemWeight = item.weight * item.quantity;
    const itemVolume = item.volume * item.quantity;
    
    // Heavy furniture requires extra workers
    if (item.category === 'furniture' && (itemWeight > 50 || itemVolume > 2)) {
      requiredWorkers += Math.ceil(itemWeight / 100); // 1 extra worker per 100kg
    }
    
    // Large appliances require extra workers
    if (item.category === 'appliances' && itemWeight > 40) {
      requiredWorkers += 1;
    }
    
    // Special items like piano require extra workers
    if (item.id === 'piano' || item.name.toLowerCase().includes('piano')) {
      requiredWorkers += 2; // Piano needs 4 people total
    }
  });
  
  return Math.min(requiredWorkers, 6); // Max 6 workers
};

// Convert comprehensive catalog to Item format for compatibility with proper image handling
export const convertCatalogToItems = (catalogItems: CatalogItem[]): Item[] => {
  return catalogItems.map(catalogItem => {
    // Get appropriate image using the image system
    const imageInfo = getItemImageWithFallback(catalogItem.id, catalogItem.category);
    
    // Calculate dimensions from volume (assuming roughly cubic shape)
    const cubeRoot = Math.cbrt(catalogItem.volume);
    const dimensions = {
      length: cubeRoot * 100, // Convert to cm
      width: cubeRoot * 100,
      height: cubeRoot * 100,
    };
    
    return {
      id: catalogItem.id,
      name: catalogItem.name,
      description: `${catalogItem.name} - ${catalogItem.keywords[0]}`,
      category: catalogItem.category as any,
      size: catalogItem.volume > 1.5 ? 'large' : catalogItem.volume > 0.5 ? 'medium' : 'small',
      quantity: 1,
      unitPrice: Math.round(catalogItem.volume * 20 + catalogItem.weight * 0.5), // Dynamic pricing based on volume and weight
      totalPrice: Math.round(catalogItem.volume * 20 + catalogItem.weight * 0.5),
      weight: catalogItem.weight,
      volume: catalogItem.volume,
      dimensions,
      image: imageInfo.primary, // Use the image system instead of hardcoded path
    };
  });
};

// Calculate total weight and volume for items
export const calculateTotals = (items: Item[]) => {
  const totalWeight = items.reduce((sum, item) => sum + (item.weight * item.quantity), 0);
  const totalVolume = items.reduce((sum, item) => sum + (item.volume * item.quantity), 0);
  return { totalWeight, totalVolume };
};

// Deep equality check for pricing objects
export const deepEqual = (obj1: any, obj2: any): boolean => {
  if (obj1 === obj2) return true;
  if (obj1 == null || obj2 == null) return false;
  if (typeof obj1 !== typeof obj2) return false;
  
  if (typeof obj1 === 'object') {
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);
    
    if (keys1.length !== keys2.length) return false;
    
    for (let key of keys1) {
      if (!keys2.includes(key)) return false;
      if (!deepEqual(obj1[key], obj2[key])) return false;
    }
    
    return true;
  }
  
  return obj1 === obj2;
};

// Build enhanced booking data for pricing
export const buildEnhancedBookingData = (step1: any) => {
  const { totalWeight, totalVolume } = calculateTotals(step1.items);
  
  return {
    items: step1.items,
    scheduledDate: new Date().toISOString(),
    serviceType: step1.serviceType || 'standard',
    pickupProperty: step1.pickupProperty,
    dropoffProperty: step1.dropoffProperty,
    // Ensure proper address format for distance calculation
    pickupAddress: {
      ...(step1.pickupAddress || {}),
      formatted_address: `${step1.pickupAddress?.address || ''}, ${step1.pickupAddress?.city || ''}, ${step1.pickupAddress?.postcode || ''}`.trim(),
    },
    dropoffAddress: {
      ...(step1.dropoffAddress || {}),
      formatted_address: `${step1.dropoffAddress?.address || ''}, ${step1.dropoffAddress?.city || ''}, ${step1.dropoffAddress?.postcode || ''}`.trim(),
    },
    // Add worker count calculation based on items
    workerCount: calculateRequiredWorkers(step1.items),
    // Add total weight and volume for pricing
    totalWeight: totalWeight,
    totalVolume: totalVolume,
  };
};

// Calculate property surcharges
export const calculatePropertySurcharges = (pickupProperty: any, dropoffProperty: any) => {
  let propertySurcharge = 0;
  let propertyDetails: string[] = [];
  
  // Pickup property surcharge (only if floors > 0)
  const pickupFloors = pickupProperty?.floors || 0;
  if (pickupFloors > 0) {
    const pickupHasElevator = pickupProperty?.hasLift || false;
    const pickupFloorFee = roundToTwoDecimals(pickupFloors * (pickupHasElevator ? 2 : 5));
    propertySurcharge = roundToTwoDecimals(propertySurcharge + pickupFloorFee);
    propertyDetails.push(`Pickup: Floor ${pickupFloors} ${pickupHasElevator ? '(£2/floor with elevator)' : '(£5/floor without elevator)'}`);
  }
  
  // Dropoff property surcharge (only if floors > 0)
  const dropoffFloors = dropoffProperty?.floors || 0;
  if (dropoffFloors > 0) {
    const dropoffHasElevator = dropoffProperty?.hasLift || false;
    const dropoffFloorFee = roundToTwoDecimals(dropoffFloors * (dropoffHasElevator ? 2 : 5));
    propertySurcharge = roundToTwoDecimals(propertySurcharge + dropoffFloorFee);
    propertyDetails.push(`Dropoff: Floor ${dropoffFloors} ${dropoffHasElevator ? '(£2/floor with elevator)' : '(£5/floor without elevator)'}`);
  }
  
  return { propertySurcharge, propertyDetails };
};

// Calculate building type multiplier
export const calculateBuildingMultiplier = (pickupProperty: any, dropoffProperty: any) => {
  const buildingTypeMultiplier = {
    'house': 1.0,
    'apartment': 1.1,
    'office': 1.2,
    'warehouse': 0.9,
    'other': 1.1,
  };
  
  const pickupMultiplier = buildingTypeMultiplier[(pickupProperty?.type as keyof typeof buildingTypeMultiplier) || 'house'];
  const dropoffMultiplier = buildingTypeMultiplier[(dropoffProperty?.type as keyof typeof buildingTypeMultiplier) || 'house'];
  return (pickupMultiplier + dropoffMultiplier) / 2;
};

// Calculate worker surcharge
export const calculateWorkerSurcharge = (items: Item[]) => {
  const workerCount = calculateRequiredWorkers(items);
  return roundToTwoDecimals(workerCount > 2 ? (workerCount - 2) * 15 : 0); // £15 per additional worker
};
