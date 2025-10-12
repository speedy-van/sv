import { VehicleType, ItemCategory } from '@speedy-van/shared';

export interface PricingRequest {
  pickupLocation: {
    latitude: number;
    longitude: number;
  };
  deliveryLocation: {
    latitude: number;
    longitude: number;
  };
  items: PricingItem[];
  scheduledAt: Date;
  vehicleType?: VehicleType;
  urgency?: 'standard' | 'express' | 'same-day';
}

export interface PricingItem {
  id?: string;
  name?: string;
  category: ItemCategory;
  quantity: number;
  weight?: number;
  volumeM3?: number;
  volume?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
}

export interface PricingResult {
  basePrice: number;
  distancePrice: number;
  itemsPrice: number;
  timePrice: number;
  urgencyPrice: number;
  totalPrice: number;
  estimatedDuration: number;
  recommendedVehicle: VehicleType;
  breakdown: PricingBreakdown[];
}

export interface PricingBreakdown {
  component: string;
  description: string;
  amount: number;
  unit?: string;
}

export interface PricingRule {
  id: string;
  name: string;
  description: string;
  priority: number;
  conditions: PricingCondition[];
  actions: PricingAction[];
  isActive: boolean;
}

export interface PricingCondition {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin';
  value: any;
}

export interface PricingAction {
  type: 'multiply' | 'add' | 'subtract' | 'set' | 'percentage';
  target: 'basePrice' | 'distancePrice' | 'itemsPrice' | 'timePrice' | 'totalPrice';
  value: number;
}

export interface DistanceMatrix {
  distance: number; // in kilometers
  duration: number; // in minutes
  route?: {
    coordinates: [number, number][];
    instructions?: string[];
  };
}

export interface VehicleCapacity {
  maxWeight: number; // kg
  maxVolume: number; // cubic meters
  maxItems: number;
  basePrice: number;
  pricePerKm: number;
  pricePerMinute: number;
}

export const VEHICLE_CAPACITIES: Record<VehicleType, VehicleCapacity> = {
  [VehicleType.VAN]: {
    maxWeight: 1000,
    maxVolume: 10,
    maxItems: 50,
    basePrice: 50,
    pricePerKm: 2.5,
    pricePerMinute: 1.0,
  },
  [VehicleType.TRUCK]: {
    maxWeight: 3000,
    maxVolume: 25,
    maxItems: 100,
    basePrice: 100,
    pricePerKm: 4.0,
    pricePerMinute: 1.5,
  },
  [VehicleType.PICKUP]: {
    maxWeight: 500,
    maxVolume: 5,
    maxItems: 25,
    basePrice: 30,
    pricePerKm: 2.0,
    pricePerMinute: 0.8,
  },
};

export const ITEM_CATEGORY_MULTIPLIERS: Record<ItemCategory, number> = {
  // Legacy categories
  [ItemCategory.FURNITURE]: 1.5,
  [ItemCategory.APPLIANCES]: 1.8,
  [ItemCategory.BOXES]: 1.0,
  [ItemCategory.FRAGILE]: 2.0,
  [ItemCategory.MISC]: 1.3,
  [ItemCategory.OTHER]: 1.2,

  // New comprehensive categories for booking-luxury (666+ items)
  [ItemCategory.ANTIQUES_COLLECTIBLES]: 2.5, // High value, fragile items
  [ItemCategory.BAG_LUGGAGE_BOX]: 1.4, // Standard boxes/luggage
  [ItemCategory.BATHROOM_FURNITURE]: 1.7, // Furniture with water damage risk
  [ItemCategory.BEDROOM]: 1.6, // Large bedroom furniture
  [ItemCategory.CARPETS_RUGS]: 1.8, // Heavy, bulky items
  [ItemCategory.CHILDREN_BABY_ITEMS]: 2.2, // Fragile, high care items
  [ItemCategory.DINING_ROOM_FURNITURE]: 1.7, // Large dining sets
  [ItemCategory.ELECTRICAL_ELECTRONIC]: 2.3, // Valuable, fragile electronics
  [ItemCategory.GARDEN_OUTDOOR]: 1.9, // Heavy outdoor items
  [ItemCategory.GYM_FITNESS_EQUIPMENT]: 2.0, // Heavy exercise equipment
  [ItemCategory.KITCHEN_APPLIANCES]: 2.1, // Heavy appliances
  [ItemCategory.LIVING_ROOM_FURNITURE]: 1.6, // Large living room items
  [ItemCategory.MISCELLANEOUS_HOUSEHOLD]: 1.4, // General household items
  [ItemCategory.MUSICAL_INSTRUMENTS]: 2.4, // Valuable, fragile instruments
  [ItemCategory.OFFICE_FURNITURE]: 1.5, // Office equipment
  [ItemCategory.PET_ITEMS]: 1.8, // Pet supplies, cages
  [ItemCategory.SPECIAL_AWKWARD_ITEMS]: 3.0, // Very heavy/large items (safes, pianos, hot tubs)
  [ItemCategory.WARDROBES_CLOSET]: 1.8, // Large wardrobe units
};

export const URGENCY_MULTIPLIERS = {
  standard: 1.0,
  express: 1.5,
  'same-day': 2.0,
} as const;

// Enhanced pricing interfaces for comprehensive calculations
export interface EnhancedPricingRequest {
  pickupLocation: {
    latitude: number;
    longitude: number;
  };
  deliveryLocation: {
    latitude: number;
    longitude: number;
  };
  items: EnhancedPricingItem[];
  scheduledAt: Date;
  vehicleType?: VehicleType;
  urgency?: 'standard' | 'express' | 'same-day';
  serviceType?: string;
  timeSlot?: string;
  promoCode?: string;
  pickupProperty?: PropertyDetails;
  dropoffProperty?: PropertyDetails;
}

export interface EnhancedPricingItem {
  name: string;
  category: ItemCategory;
  quantity: number;
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  estimatedVolume?: number;
  isFragile?: boolean;
  isValuable?: boolean;
  requiresDisassembly?: boolean;
}

export interface PropertyDetails {
  floor: number;
  hasElevator: boolean;
  hasParking: boolean;
  narrowAccess?: boolean;
  longCarry?: boolean;
}

export interface ComprehensivePricingResult extends PricingResult {
  subtotalBeforeVAT: number;
  vatAmount: number;
  promoDiscount: number;
  specialSurcharges: Array<{ name: string; amount: number; reason: string }>;
  accessSurcharges: Array<{ name: string; amount: number; reason: string }>;
  multipliers: {
    service: number;
    timeSlot: number;
    seasonal: number;
    demand: number;
  };
  recommendations: string[];
}

export const PricingConfig = {
  // Base rates
  baseFee: 25.0,
  vatRate: 0.2,

  // Distance-based pricing
  freeDistanceKm: 8, // First 8km free
  pricePerKm: 1.5,
  longDistanceThreshold: 80, // 50 miles ~ 80km
  longDistanceSurcharge: 0.25,

  // Volume-based pricing
  pricePerCubicMeter: 8.0,
  volumeDiscountThreshold: 10,
  volumeDiscountRate: 0.1,

  // Time-based pricing
  minimumDuration: 120, // 2 hours in minutes
  pricePerHour: 35.0,

  // Promotional limits
  maxDiscountPercentage: 0.3,
  maxDiscountAmount: 100.0,
} as const;

/**
 * Load Type Classification for Capacity-Based Pricing
 * 
 * CRITICAL: This determines whether multiple-drops pricing is applicable
 */
export enum LoadType {
  /** Full Load (90-100% capacity) - No route sharing, full price */
  FULL_LOAD = 'FULL_LOAD',
  
  /** Partial Load (<70% capacity) - Multiple drops available */
  PARTIAL_LOAD = 'PARTIAL_LOAD',
  
  /** Shared Backhaul - Post-unload capacity available for new pickups */
  SHARED_BACKHAUL = 'SHARED_BACKHAUL',
  
  /** Forward Shared - Pre-planned shared route with multiple pickups */
  FORWARD_SHARED = 'FORWARD_SHARED'
}

/**
 * Capacity Utilization Thresholds
 */
export const CAPACITY_THRESHOLDS = {
  /** Full load threshold - above this, no route sharing */
  FULL_LOAD: 0.90, // 90% or more = full load
  
  /** Partial load threshold - below this, route sharing allowed */
  PARTIAL_LOAD: 0.70, // 70% or less = partial load
  
  /** Minimum free capacity for new pickups after unload */
  MIN_FREE_CAPACITY: 0.30, // 30% minimum free space
} as const;

/**
 * Capacity Utilization Result
 */
export interface CapacityUtilization {
  /** Weight utilization (0-1) */
  weightUtilization: number;
  
  /** Volume utilization (0-1) */
  volumeUtilization: number;
  
  /** Overall utilization (max of weight/volume) */
  overallUtilization: number;
  
  /** Determined load type based on utilization */
  loadType: LoadType;
  
  /** Whether route sharing is available */
  routeSharingAvailable: boolean;
  
  /** Human-readable message */
  message: string;
}

/**
 * Enhanced Pricing Result with Capacity Information
 */
export interface CapacityAwarePricingResult extends PricingResult {
  /** Capacity utilization details */
  capacityUtilization: CapacityUtilization;
  
  /** Whether multi-drop discount was applied */
  multiDropDiscountApplied: boolean;
  
  /** Multi-drop discount amount (if any) */
  multiDropDiscount: number;
  
  /** Original price before multi-drop discount */
  priceBeforeMultiDrop: number;
}

