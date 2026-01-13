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
  serviceTier?: ServiceTier;  // NEW: Service tier selection
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
  serviceTier?: ServiceTier;  // NEW: Applied service tier
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

/**
 * Service Tier Levels for Competitive Pricing
 * 
 * ECONOMY: Competitive with market leaders (AnyVan, Shiply)
 * STANDARD: Premium service with enhanced features
 * PREMIUM: Full "Luxury" service with white-glove treatment
 */
export enum ServiceTier {
  ECONOMY = 'economy',
  STANDARD = 'standard',
  PREMIUM = 'premium'
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

/**
 * Service Tier Pricing - Competitive with Market Leaders
 * 
 * Price comparison with AnyVan for 3-mile single-sofa move:
 * - AnyVan: £39-58
 * - Our Economy: £42-55
 * - Our Standard: £68-85
 * - Our Premium: £150-180
 */
export const VEHICLE_CAPACITIES_BY_TIER: Record<ServiceTier, Record<VehicleType, VehicleCapacity>> = {
  [ServiceTier.ECONOMY]: {
    [VehicleType.VAN]: {
      maxWeight: 1000,
      maxVolume: 10,
      maxItems: 50,
      basePrice: 15,          // Competitive with AnyVan (£12-15)
      pricePerKm: 0.40,       // £0.40/MILE - UK uses MILES not KM!
      pricePerMinute: 0.20,   // Minimal time cost
    },
    [VehicleType.TRUCK]: {
      maxWeight: 3000,
      maxVolume: 25,
      maxItems: 100,
      basePrice: 30,
      pricePerKm: 0.65,       // £0.65/MILE
      pricePerMinute: 0.35,
    },
    [VehicleType.PICKUP]: {
      maxWeight: 500,
      maxVolume: 5,
      maxItems: 25,
      basePrice: 12,          // Very competitive entry point
      pricePerKm: 0.35,       // £0.35/MILE
      pricePerMinute: 0.15,
    },
  },
  [ServiceTier.STANDARD]: {
    [VehicleType.VAN]: {
      maxWeight: 1000,
      maxVolume: 10,
      maxItems: 50,
      basePrice: 22,          // £22 base as per requirements
      pricePerKm: 0.65,       // £0.65/MILE
      pricePerMinute: 0.40,
    },
    [VehicleType.TRUCK]: {
      maxWeight: 3000,
      maxVolume: 25,
      maxItems: 100,
      basePrice: 50,
      pricePerKm: 1.05,       // £1.05/MILE (scaled from economy)
      pricePerMinute: 0.60,
    },
    [VehicleType.PICKUP]: {
      maxWeight: 500,
      maxVolume: 5,
      maxItems: 25,
      basePrice: 20,
      pricePerKm: 0.55,       // £0.55/MILE
      pricePerMinute: 0.30,
    },
  },
  [ServiceTier.PREMIUM]: {
    [VehicleType.VAN]: {
      maxWeight: 1000,
      maxVolume: 10,
      maxItems: 50,
      basePrice: 45,          // £45 base as per requirements
      pricePerKm: 1.20,       // £1.20/MILE - premium pricing
      pricePerMinute: 1.0,
    },
    [VehicleType.TRUCK]: {
      maxWeight: 3000,
      maxVolume: 25,
      maxItems: 100,
      basePrice: 100,
      pricePerKm: 2.00,       // £2.00/MILE
      pricePerMinute: 1.5,
    },
    [VehicleType.PICKUP]: {
      maxWeight: 500,
      maxVolume: 5,
      maxItems: 25,
      basePrice: 40,
      pricePerKm: 1.00,       // £1.00/MILE
      pricePerMinute: 0.80,
    },
  },
};

/**
 * Item Category Multipliers - Optimized for Competitive Pricing
 * 
 * ECONOMY TIER: Reduced multipliers for price-sensitive customers
 * STANDARD/PREMIUM TIERS: Use original multipliers
 */
export const ITEM_CATEGORY_MULTIPLIERS_ECONOMY: Record<ItemCategory, number> = {
  // Legacy categories
  [ItemCategory.FURNITURE]: 1.2,        // Reduced from 1.5
  [ItemCategory.APPLIANCES]: 1.3,       // Reduced from 1.8
  [ItemCategory.BOXES]: 1.0,            // No change
  [ItemCategory.FRAGILE]: 1.5,          // Reduced from 2.0
  [ItemCategory.MISC]: 1.1,             // Reduced from 1.3
  [ItemCategory.OTHER]: 1.1,            // Reduced from 1.2

  // New comprehensive categories - Reduced for Economy
  [ItemCategory.ANTIQUES_COLLECTIBLES]: 1.8,      // Reduced from 2.5
  [ItemCategory.BAG_LUGGAGE_BOX]: 1.0,            // Reduced from 1.4
  [ItemCategory.BATHROOM_FURNITURE]: 1.3,         // Reduced from 1.7
  [ItemCategory.BEDROOM]: 1.2,                    // Reduced from 1.6
  [ItemCategory.CARPETS_RUGS]: 1.4,               // Reduced from 1.8
  [ItemCategory.CHILDREN_BABY_ITEMS]: 1.6,        // Reduced from 2.2
  [ItemCategory.DINING_ROOM_FURNITURE]: 1.3,      // Reduced from 1.7
  [ItemCategory.ELECTRICAL_ELECTRONIC]: 1.6,      // Reduced from 2.3
  [ItemCategory.GARDEN_OUTDOOR]: 1.4,             // Reduced from 1.9
  [ItemCategory.GYM_FITNESS_EQUIPMENT]: 1.5,      // Reduced from 2.0
  [ItemCategory.KITCHEN_APPLIANCES]: 1.5,         // Reduced from 2.1
  [ItemCategory.LIVING_ROOM_FURNITURE]: 1.2,      // Reduced from 1.6
  [ItemCategory.MISCELLANEOUS_HOUSEHOLD]: 1.1,    // Reduced from 1.4
  [ItemCategory.MUSICAL_INSTRUMENTS]: 1.8,        // Reduced from 2.4
  [ItemCategory.OFFICE_FURNITURE]: 1.2,           // Reduced from 1.5
  [ItemCategory.PET_ITEMS]: 1.4,                  // Reduced from 1.8
  [ItemCategory.SPECIAL_AWKWARD_ITEMS]: 2.0,      // Reduced from 3.0
  [ItemCategory.WARDROBES_CLOSET]: 1.4,           // Reduced from 1.8
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

