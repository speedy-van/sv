/**
 * Specialized Logistics - TypeScript Type Definitions
 * These types mirror the Prisma schema for frontend use
 */

// ============================================================================
// ENUMS
// ============================================================================

export enum SpecializedItemCategory {
  PIANO_UPRIGHT = 'PIANO_UPRIGHT',
  PIANO_GRAND = 'PIANO_GRAND',
  FINE_ART_PAINTING = 'FINE_ART_PAINTING',
  FINE_ART_SCULPTURE = 'FINE_ART_SCULPTURE',
  MEDICAL_EQUIPMENT = 'MEDICAL_EQUIPMENT',
  ANTIQUE_FURNITURE = 'ANTIQUE_FURNITURE',
  LUXURY_FURNITURE = 'LUXURY_FURNITURE',
  FRAGILE_ELECTRONICS = 'FRAGILE_ELECTRONICS',
  CUSTOM_SPECIALIZED = 'CUSTOM_SPECIALIZED'
}

export enum InsuranceTier {
  STANDARD = 'STANDARD',
  PREMIUM = 'PREMIUM',
  PLATINUM = 'PLATINUM',
  BESPOKE = 'BESPOKE'
}

export enum EquipmentType {
  PIANO_DOLLY = 'PIANO_DOLLY',
  PIANO_BOARD = 'PIANO_BOARD',
  TAIL_LIFT = 'TAIL_LIFT',
  STAIR_CLIMBER = 'STAIR_CLIMBER',
  ART_CRATE = 'ART_CRATE',
  CLIMATE_CONTROLLED_VAN = 'CLIMATE_CONTROLLED_VAN',
  HYDRAULIC_LIFT = 'HYDRAULIC_LIFT',
  NON_MARKING_STRAPS = 'NON_MARKING_STRAPS',
  PROTECTIVE_BLANKETS = 'PROTECTIVE_BLANKETS',
  SPECIALIZED_TROLLEY = 'SPECIALIZED_TROLLEY'
}

export enum ReportType {
  PRE_MOVE = 'PRE_MOVE',
  POST_MOVE = 'POST_MOVE',
  INCIDENT = 'INCIDENT'
}

export enum ConditionGrade {
  EXCELLENT = 'EXCELLENT',
  GOOD = 'GOOD',
  FAIR = 'FAIR',
  POOR = 'POOR',
  DAMAGED = 'DAMAGED'
}

// ============================================================================
// INTERFACES
// ============================================================================

export interface SpecializedItem {
  id: string;
  bookingItemId: string;
  category: SpecializedItemCategory;
  technicalSpecs: Record<string, any>;
  handlingRequirements: string[];
  requiredEquipment: string[];
  declaredValue: number; // in pence
  insuranceTier: InsuranceTier;
  fragilityScore: number; // 1-10
  complexityScore: number; // 1-10
  temperatureControl: boolean;
  humidityControl: boolean;
  verticalTransport: boolean;
  requiresOnSiteVisit: boolean;
  assessmentNotes?: string;
  assessedBy?: string;
  assessedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface SpecializedEquipment {
  id: string;
  name: string;
  equipmentType: EquipmentType;
  description?: string;
  verificationRequired: boolean;
  certificationTypes: string[];
  maxWeight?: number; // kg
  suitableFor: SpecializedItemCategory[];
  dailyRentalCost?: number; // pence
  insurancePremium?: number; // pence
  createdAt: Date;
  updatedAt: Date;
}

export interface DriverEquipment {
  id: string;
  driverId: string;
  equipmentId: string;
  verified: boolean;
  verifiedBy?: string;
  verifiedAt?: Date;
  expiresAt?: Date;
  photoUrl?: string;
  certificateUrl?: string;
  serialNumber?: string;
  isOperational: boolean;
  lastMaintenanceDate?: Date;
  nextMaintenanceDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConditionReport {
  id: string;
  specializedItemId: string;
  bookingId: string;
  reportType: ReportType;
  reportedBy: string;
  reportedAt: Date;
  photos: PhotoRecord[];
  videoUrl?: string;
  overallCondition: ConditionGrade;
  damagePre: string[];
  specialNotes?: string;
  measurements?: {
    length?: number;
    width?: number;
    height?: number;
    weight?: number;
  };
  customerSigned: boolean;
  customerSignature?: string;
  customerSignedAt?: Date;
  syncedToCustomer: boolean;
  syncedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface PhotoRecord {
  id: string;
  url: string;
  caption?: string;
  timestamp: string;
  geoLocation?: {
    lat: number;
    lng: number;
  };
}

export interface SpecializedWorkflow {
  id: string;
  itemCategory: SpecializedItemCategory;
  workflowName: string;
  requiredFields: DynamicFormField[];
  optionalFields?: DynamicFormField[];
  minInsuranceValue: number; // pence
  requiresPhotos: boolean;
  requiresOnSiteVisit: boolean;
  mandatoryEquipment: string[];
  recommendedEquipment: string[];
  basePriceMultiplier: number;
  insuranceMultiplier: number;
  customerGuidance?: string;
  driverInstructions?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface DynamicFormField {
  name: string;
  type: 'text' | 'number' | 'select' | 'boolean' | 'textarea' | 'currency' | 'date';
  label: string;
  required?: boolean;
  placeholder?: string;
  helpText?: string;
  min?: number;
  max?: number;
  options?: string[];
  dependsOn?: string;
  showWhen?: boolean | string;
}

export interface InsuranceQuote {
  id: string;
  itemCategory: SpecializedItemCategory;
  declaredValue: number; // pence
  insuranceTier: InsuranceTier;
  basePremium: number; // pence
  riskModifier: number;
  finalPremium: number; // pence
  validUntil: Date;
  quoteData?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

export interface CreateSpecializedItemRequest {
  bookingItemId: string;
  category: SpecializedItemCategory;
  technicalSpecs: Record<string, any>;
  declaredValue: number; // pence
  handlingRequirements?: string[];
  requiredEquipment?: string[];
}

export interface CreateSpecializedItemResponse {
  success: boolean;
  specializedItem: SpecializedItem;
}

export interface GetWorkflowRequest {
  category: SpecializedItemCategory;
}

export interface GetWorkflowResponse {
  success: boolean;
  workflow: SpecializedWorkflow;
}

export interface CalculateInsuranceQuoteRequest {
  category: SpecializedItemCategory;
  declaredValue: number; // pence
  tier: InsuranceTier;
  additionalInfo?: {
    stairsRequired?: boolean;
    complexityScore?: number;
    useSpecializedEquipment?: boolean;
    includePhotoDocumentation?: boolean;
    climateControlled?: boolean;
    onSiteVisitCompleted?: boolean;
    age?: string;
  };
}

export interface CalculateInsuranceQuoteResponse {
  success: boolean;
  premium: number; // pence
  premiumGBP: number; // pounds
  coverage: number; // pence
  coverageGBP: number; // pounds
  tier: InsuranceTier;
  breakdown: {
    declaredValue: number;
    basePremium: number;
    categoryRisk: number;
    riskAdjustment: number;
    finalPremium: number;
  };
  discountsApplied: {
    specializedEquipment: boolean;
    photoDocumentation: boolean;
    climateControl: boolean;
    onSiteVisit: boolean;
  };
  validUntil: string;
}

export interface RequiredEquipmentResult {
  required: EquipmentType[];
  recommended: EquipmentType[];
  warnings: string[];
  estimatedCost: number; // pence
}

// ============================================================================
// DISPLAY HELPERS
// ============================================================================

export const CATEGORY_DISPLAY_NAMES: Record<SpecializedItemCategory, string> = {
  [SpecializedItemCategory.PIANO_UPRIGHT]: 'Upright Piano',
  [SpecializedItemCategory.PIANO_GRAND]: 'Grand Piano',
  [SpecializedItemCategory.FINE_ART_PAINTING]: 'Fine Art Painting',
  [SpecializedItemCategory.FINE_ART_SCULPTURE]: 'Fine Art Sculpture',
  [SpecializedItemCategory.MEDICAL_EQUIPMENT]: 'Medical Equipment',
  [SpecializedItemCategory.ANTIQUE_FURNITURE]: 'Antique Furniture',
  [SpecializedItemCategory.LUXURY_FURNITURE]: 'Luxury Furniture',
  [SpecializedItemCategory.FRAGILE_ELECTRONICS]: 'Fragile Electronics',
  [SpecializedItemCategory.CUSTOM_SPECIALIZED]: 'Custom Specialized Item'
};

export const INSURANCE_TIER_DISPLAY: Record<InsuranceTier, { name: string; coverage: string; description: string }> = {
  [InsuranceTier.STANDARD]: {
    name: 'Standard Coverage',
    coverage: 'Up to £5,000',
    description: 'Basic goods-in-transit insurance'
  },
  [InsuranceTier.PREMIUM]: {
    name: 'Premium Protection',
    coverage: 'Up to £25,000',
    description: 'Enhanced coverage with photo documentation'
  },
  [InsuranceTier.PLATINUM]: {
    name: 'Platinum Care',
    coverage: 'Up to £100,000',
    description: 'Comprehensive specialist coverage'
  },
  [InsuranceTier.BESPOKE]: {
    name: 'Bespoke Coverage',
    coverage: 'Custom',
    description: 'Tailored for unique high-value items'
  }
};

export const EQUIPMENT_DISPLAY_NAMES: Record<EquipmentType, string> = {
  [EquipmentType.PIANO_DOLLY]: 'Professional Piano Dolly',
  [EquipmentType.PIANO_BOARD]: 'Piano Board',
  [EquipmentType.TAIL_LIFT]: 'Hydraulic Tail Lift',
  [EquipmentType.STAIR_CLIMBER]: 'Motorized Stair Climber',
  [EquipmentType.ART_CRATE]: 'Custom Art Crate',
  [EquipmentType.CLIMATE_CONTROLLED_VAN]: 'Climate-Controlled Van',
  [EquipmentType.HYDRAULIC_LIFT]: 'Industrial Hydraulic Lift',
  [EquipmentType.NON_MARKING_STRAPS]: 'Non-Marking Straps',
  [EquipmentType.PROTECTIVE_BLANKETS]: 'Protective Moving Blankets',
  [EquipmentType.SPECIALIZED_TROLLEY]: 'Specialized Furniture Trolley'
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Convert pence to pounds for display
 */
export function penceToPounds(pence: number): number {
  return pence / 100;
}

/**
 * Convert pounds to pence for API calls
 */
export function poundsToPence(pounds: number): number {
  return Math.round(pounds * 100);
}

/**
 * Format currency for display
 */
export function formatCurrency(pence: number): string {
  return `£${penceToPounds(pence).toFixed(2)}`;
}

/**
 * Get category icon emoji
 */
export function getCategoryIcon(category: SpecializedItemCategory): string {
  const iconMap: Record<SpecializedItemCategory, string> = {
    [SpecializedItemCategory.PIANO_UPRIGHT]: '🎹',
    [SpecializedItemCategory.PIANO_GRAND]: '🎹',
    [SpecializedItemCategory.FINE_ART_PAINTING]: '🖼️',
    [SpecializedItemCategory.FINE_ART_SCULPTURE]: '🗿',
    [SpecializedItemCategory.MEDICAL_EQUIPMENT]: '🏥',
    [SpecializedItemCategory.ANTIQUE_FURNITURE]: '🪑',
    [SpecializedItemCategory.LUXURY_FURNITURE]: '🛋️',
    [SpecializedItemCategory.FRAGILE_ELECTRONICS]: '📱',
    [SpecializedItemCategory.CUSTOM_SPECIALIZED]: '📦'
  };
  return iconMap[category] || '📦';
}

/**
 * Check if item is a piano
 */
export function isPiano(category: SpecializedItemCategory): boolean {
  return category === SpecializedItemCategory.PIANO_UPRIGHT || 
         category === SpecializedItemCategory.PIANO_GRAND;
}

/**
 * Check if item is fine art
 */
export function isFineArt(category: SpecializedItemCategory): boolean {
  return category === SpecializedItemCategory.FINE_ART_PAINTING || 
         category === SpecializedItemCategory.FINE_ART_SCULPTURE;
}

/**
 * Get recommended insurance tier based on declared value
 */
export function getRecommendedInsuranceTier(declaredValuePence: number): InsuranceTier {
  if (declaredValuePence <= 500000) return InsuranceTier.STANDARD;
  if (declaredValuePence <= 2500000) return InsuranceTier.PREMIUM;
  if (declaredValuePence <= 10000000) return InsuranceTier.PLATINUM;
  return InsuranceTier.BESPOKE;
}
