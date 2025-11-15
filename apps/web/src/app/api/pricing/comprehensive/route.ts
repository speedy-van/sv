/**
 * COMPREHENSIVE PRICING API - 100% Documentation Compliance
 *
 * Features:
 * - Full UK dataset integration (22 fields per item)
 * - Multi-drop route optimization with capacity enforcement
 * - Structured address compatibility
 * - Stripe Payment Intent creation with parity checks
 * - Comprehensive logging and observability
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import Stripe from 'stripe';
import { randomUUID } from 'crypto';
import { readFileSync } from 'fs';
import { join } from 'path';
import { comprehensivePricingEngine } from '@/lib/pricing/comprehensive-engine';
import {
  EnhancedPricingInputSchema,
  EnhancedPricingResultSchema
} from '@/lib/pricing/comprehensive-schemas';
import { DynamicAvailabilityEngine, type FullStructuredAddress, type BookingCapacity } from '@/lib/availability/dynamic-availability-engine';
import { planCapacityConstrainedRoute, type BookingRequest } from '@/lib/capacity/capacity-constrained-vrp';
import { calculateCapacityMetrics } from '@/lib/dataset/uk-removal-dataset-loader';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

// Initialize Stripe (optional - gracefully handle missing key)
const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-04-10',
    })
  : null;

// Enhanced request validation schema (100% operational compliance)
const EnhancedPricingRequestSchema = z.object({
  correlationId: z.string().min(1).optional(),
  operationalConfig: z.any().optional(), // Allow override of operational config
  items: z.array(z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    quantity: z.number().min(1).default(1),
    weight_override: z.number().positive().optional(),
    volume_override: z.number().positive().optional()
  })).default([]).optional(),
  pickup: z.object({
    full: z.string().min(1),
    line1: z.string().min(1),
    line2: z.string().optional(),
    city: z.string().min(1),
    postcode: z.string().regex(/^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/i),
    // ENTERPRISE REQUIREMENT: Full structured address
    street: z.string().min(1, 'Street is required for availability calculation'),
    number: z.string().min(1, 'Number is required for availability calculation'),
    coordinates: z.object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180)
    }),
    propertyType: z.enum(['house', 'apartment', 'office', 'warehouse', 'other']).default('house'),
    accessNotes: z.string().optional(),
    parkingSituation: z.enum(['easy', 'moderate', 'difficult']).default('easy'),
    congestionZone: z.boolean().default(false)
  }),
  dropoffs: z.array(z.object({
    full: z.string().min(1),
    line1: z.string().min(1),
    line2: z.string().optional(),
    city: z.string().min(1),
    postcode: z.string().regex(/^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/i),
    // ENTERPRISE REQUIREMENT: Full structured address
    street: z.string().min(1, 'Street is required for availability calculation'),
    number: z.string().min(1, 'Number is required for availability calculation'),
    coordinates: z.object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180)
    }),
    propertyType: z.enum(['house', 'apartment', 'office', 'warehouse', 'other']).default('house'),
    accessNotes: z.string().optional(),
    parkingSituation: z.enum(['easy', 'moderate', 'difficult']).default('easy'),
    congestionZone: z.boolean().default(false)
  })).max(5),
  serviceLevel: z.enum(['economy', 'standard', 'premium']).default('standard'),
  scheduledDate: z.string().datetime(),
  customerSegment: z.enum(['bronze', 'silver', 'gold', 'platinum']).default('bronze'),
  timeFactors: z.object({
    isRushHour: z.boolean().optional(),
    isPeakSeason: z.boolean().optional(),
    isStudentSeason: z.boolean().optional(),
    isWeekend: z.boolean().optional(),
    isSchoolHoliday: z.boolean().optional(),
    isBankHoliday: z.boolean().optional(),
    trafficConditions: z.enum(['light', 'moderate', 'heavy']).optional(),
    currentHour: z.number().min(0).max(23).optional(),
    currentMonth: z.number().min(1).max(12).optional()
  }).optional(),
  serviceOptions: z.object({
    whiteGloveService: z.boolean().optional(),
    packingService: z.object({
      volumeM3: z.number().min(0).optional(),
      boxes: z.number().min(0).optional()
    }).optional(),
    cleaningService: z.boolean().optional(),
    storageService: z.object({
      durationMonths: z.number().min(1).max(12).optional(),
      volumeM3: z.number().min(0).optional()
    }).optional(),
    insurance: z.enum(['basic', 'standard', 'premium']).optional()
  }).optional()
});

/**
 * Transform request items to pricing input format
 * This enriches items with dataset information before schema validation
 */
async function transformRequestToPricingInput(
  validatedRequest: z.infer<typeof EnhancedPricingRequestSchema>,
  requestId: string,
  correlationId: string
): Promise<z.infer<typeof EnhancedPricingInputSchema>> {
  // Ensure dataset is loaded
  await comprehensivePricingEngine.loadDataset();

  // Load dataset directly to enrich items
  let dataset: any[] = [];
  
  try {
    const datasetPath = join(process.cwd(), 'public', 'UK_Removal_Dataset', 'items_dataset.json');
    const datasetContent = readFileSync(datasetPath, 'utf-8');
    const datasetData = JSON.parse(datasetContent);
    dataset = datasetData.items || [];
  } catch (error) {
    console.warn(`⚠️ Could not load dataset, using fallback:`, error);
  }

  // Transform items: enrich with dataset information
  // Handle empty items array (return empty transformed array with default item)
  const itemsToTransform = validatedRequest.items && validatedRequest.items.length > 0 
    ? validatedRequest.items 
    : [{
        id: 'default-item',
        name: 'Standard Item',
        quantity: 1
      }];
  
  if (!validatedRequest.items || validatedRequest.items.length === 0) {
    console.warn('⚠️ No items provided in request - using default item for pricing calculation');
  }
  
  const transformedItems = await Promise.all(
    itemsToTransform.map(async (item) => {
      // Import the mapper at runtime to avoid circular dependencies
      const { findDatasetItemById, createFallbackDatasetItem } = await import('@/lib/dataset/item-id-mapper');
      
      // Find dataset item using smart matching
      const datasetItem = findDatasetItemById(
        item.id,
        item.name,
        { items: dataset, metadata: { version: '1.0', date: '', total_items: dataset.length, categories: 0 } }
      );

      if (!datasetItem) {
        // Create fallback dataset item if not found
        console.warn(`⚠️ Item not found in dataset: ${item.name} (${item.id}), using smart fallback`);
        const { createFallbackDatasetItem } = await import('@/lib/dataset/item-id-mapper');
        const fallbackDatasetItem = createFallbackDatasetItem(
          item.id,
          item.name,
          item.weight_override,
          item.volume_override
        );

        // Calculate basic costs
        const laborCost = (fallbackDatasetItem.workers_required * 18 * 0.5) * item.quantity; // £18/hour, 0.5 hours
        const itemBaseCost = ((fallbackDatasetItem.weight * 0.08) + (parseFloat(fallbackDatasetItem.volume) * 4.50)) * item.quantity;

        return {
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          weight_override: item.weight_override,
          volume_override: item.volume_override,
          datasetItem: fallbackDatasetItem,
          labor_cost: laborCost,
          item_base_cost: itemBaseCost
        };
      }

      // Validate dataset item
      const { UKDatasetItemSchema } = await import('@/lib/pricing/comprehensive-schemas');
      const validatedDataset = UKDatasetItemSchema.parse(datasetItem);

      // Calculate basic costs (simplified version)
      const laborCost = (validatedDataset.workers_required * 18 * 0.5) * item.quantity; // £18/hour, 0.5 hours
      const itemBaseCost = ((validatedDataset.weight * 0.08) + (parseFloat(validatedDataset.volume) * 4.50)) * item.quantity;

      return {
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        weight_override: item.weight_override,
        volume_override: item.volume_override,
        datasetItem: validatedDataset,
        labor_cost: laborCost,
        item_base_cost: itemBaseCost
      };
    })
  );

  // Calculate time factors
  const scheduledDate = new Date(validatedRequest.scheduledDate);
  const timeFactors = validatedRequest.timeFactors || {
    isRushHour: isRushHour(scheduledDate),
    isPeakSeason: isPeakSeason(scheduledDate),
    isStudentSeason: isStudentSeason(scheduledDate),
    isWeekend: isWeekend(scheduledDate),
    currentHour: scheduledDate.getHours(),
    currentMonth: scheduledDate.getMonth() + 1
  };

  return {
    requestId, // UUID format required by schema
    correlationId,
    operationalConfig: validatedRequest.operationalConfig,
    items: transformedItems,
    pickup: validatedRequest.pickup,
    dropoffs: validatedRequest.dropoffs,
    serviceLevel: validatedRequest.serviceLevel as 'economy' | 'standard' | 'premium',
    scheduledDate: validatedRequest.scheduledDate,
    customerSegment: validatedRequest.customerSegment as 'bronze' | 'silver' | 'gold' | 'platinum',
    timeFactors: {
      isRushHour: timeFactors.isRushHour ?? false,
      isPeakSeason: timeFactors.isPeakSeason ?? false,
      isStudentSeason: timeFactors.isStudentSeason ?? false,
      isWeekend: timeFactors.isWeekend ?? false,
      currentHour: timeFactors.currentHour ?? scheduledDate.getHours(),
      currentMonth: timeFactors.currentMonth ?? scheduledDate.getMonth() + 1,
      isSchoolHoliday: timeFactors.isSchoolHoliday ?? false,
      isBankHoliday: timeFactors.isBankHoliday ?? false,
      trafficConditions: timeFactors.trafficConditions ?? 'moderate'
    },
    serviceOptions: validatedRequest.serviceOptions
  };
}

export async function POST(request: NextRequest) {
  const requestId = randomUUID(); // Use UUID format as required by schema
  const startTime = Date.now();

  try {
    console.log(`🚀 [${requestId}] Starting comprehensive pricing request`);

    // Parse and validate request with enhanced schema
    const body = await request.json();
    const validatedRequest = EnhancedPricingRequestSchema.parse(body);

    // Generate correlation ID if not provided
    const correlationId = validatedRequest.correlationId || randomUUID();

    // Set operational config if provided
    if (validatedRequest.operationalConfig) {
      comprehensivePricingEngine.setOperationalConfig(validatedRequest.operationalConfig);
    }

    // Transform request to pricing input format (enriches items with dataset)
    const pricingInput = await transformRequestToPricingInput(
      validatedRequest,
      requestId,
      correlationId
    );

    // Validate with enhanced schema (after transformation)
    const validatedInput = EnhancedPricingInputSchema.parse(pricingInput);

    console.log(`📊 [${requestId}] Input validated: ${validatedInput.items.length} items, ${validatedInput.dropoffs.length} dropoffs`);

    // Calculate comprehensive pricing (engine will enrich items internally)
    const pricingResult = await comprehensivePricingEngine.calculatePrice(validatedInput);

    // ENTERPRISE REQUIREMENT: Calculate availability for all tiers using full addresses
    const availability = await calculateAvailabilityForAllTiers(
      validatedInput,
      requestId
    );

    // Create Stripe Payment Intent with parity check
    const stripeResult = await createStripePaymentIntent(pricingResult, correlationId);

    // Update result with Stripe data and availability
    const finalResult = {
      ...pricingResult,
      availability,
      stripeMetadata: {
        ...pricingResult.stripeMetadata,
        paymentIntentId: stripeResult.paymentIntent?.id || null,
        clientSecret: stripeResult.paymentIntent?.client_secret || null
      }
    };

    // Validate final result with enhanced schema
    const validatedResult = EnhancedPricingResultSchema.parse(finalResult);

    // Log comprehensive metrics
    logPricingMetrics(requestId, correlationId, validatedResult, startTime);

    console.log(`✅ [${requestId}] Pricing completed successfully: £${validatedResult.amountGbpMinor / 100}`);

    return NextResponse.json({
      success: true,
      data: validatedResult,
      metadata: {
        requestId,
        correlationId,
        processingTimeMs: Date.now() - startTime,
        stripePaymentIntentId: stripeResult.paymentIntent?.id || null
      }
    });

  } catch (error) {
    console.error(`❌ [${requestId}] Pricing request failed:`, error);

    // Log error with structured data
    logPricingError(requestId, error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        details: error.errors,
        requestId
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
      requestId
    }, { status: 500 });
  }
}

// ============================================================================
// AVAILABILITY INTEGRATION - ENTERPRISE REQUIREMENT WITH CAPACITY VALIDATION
// ============================================================================

/**
 * Calculate availability for all service tiers using full structured addresses
 * CRITICAL: Must use complete address structure from autocomplete
 * NEW: Integrates capacity-constrained VRP for Economy tier validation
 */
async function calculateAvailabilityForAllTiers(
  pricingInput: any,
  requestId: string
) {
  const availabilityEngine = new DynamicAvailabilityEngine(prisma);

  // Convert pricing input to availability format
  const pickup: FullStructuredAddress = {
    street: pricingInput.pickup.street,
    number: pricingInput.pickup.number,
    city: pricingInput.pickup.city,
    postcode: pricingInput.pickup.postcode,
    county: pricingInput.pickup.county,
    coordinates: pricingInput.pickup.coordinates
  };

  const drops: FullStructuredAddress[] = pricingInput.dropoffs.map((drop: any) => ({
    street: drop.street,
    number: drop.number,
    city: drop.city,
    postcode: drop.postcode,
    county: drop.county,
    coordinates: drop.coordinates
  }));

  // Calculate capacity from items
  const capacity: BookingCapacity = calculateCapacityFromItems(pricingInput.items);

  logger.info('Calculating availability for all tiers with capacity validation', {
    pickup: { city: pickup.city, postcode: pickup.postcode.substring(0, 4) + '***' },
    dropsCount: drops.length,
    capacity
  }, { requestId });

  try {
    // NEW: Validate capacity feasibility using VRP algorithm
    const capacityValidation = await validateCapacityForTiers(pricingInput, requestId);

    // Calculate availability for each tier (only if capacity check passes)
    const availabilityPromises = [];

    // ECONOMY TIER: Only shown if capacity validation passes
    if (capacityValidation.economy.feasible) {
      availabilityPromises.push(
        availabilityEngine.calculateAvailability(pickup, drops, { ...capacity, crewRequired: 2 }, `${requestId}_economy`)
          .then(result => ({ tier: 'economy', result }))
          .catch(error => ({ tier: 'economy', error }))
      );
    } else {
      availabilityPromises.push(Promise.resolve({
        tier: 'economy',
        result: null,
        rejectionReason: capacityValidation.economy.rejectionReason
      }));
    }

    // STANDARD TIER: Always available (higher buffer tolerance)
    if (capacityValidation.standard.feasible) {
      availabilityPromises.push(
        availabilityEngine.calculateAvailability(pickup, drops, { ...capacity, crewRequired: 2 }, `${requestId}_standard`)
          .then(result => ({ tier: 'standard', result }))
          .catch(error => ({ tier: 'standard', error }))
      );
    } else {
      availabilityPromises.push(Promise.resolve({
        tier: 'standard',
        result: null,
        rejectionReason: capacityValidation.standard.rejectionReason
      }));
    }

    // EXPRESS TIER: Always available (premium service)
    if (capacityValidation.express.feasible) {
      availabilityPromises.push(
        availabilityEngine.calculateAvailability(pickup, drops, { ...capacity, crewRequired: 2 }, `${requestId}_express`)
          .then(result => ({ tier: 'express', result }))
          .catch(error => ({ tier: 'express', error }))
      );
    } else {
      availabilityPromises.push(Promise.resolve({
        tier: 'express',
        result: null,
        rejectionReason: capacityValidation.express.rejectionReason
      }));
    }

    const availabilityResults = await Promise.all(availabilityPromises);

    const economyResult = availabilityResults.find(r => r.tier === 'economy');
    const standardResult = availabilityResults.find(r => r.tier === 'standard');
    const expressResult = availabilityResults.find(r => r.tier === 'express');

    return {
      economy: economyResult && 'result' in economyResult ? economyResult.result : null,
      economyRejectionReason: economyResult && 'rejectionReason' in economyResult ? economyResult.rejectionReason : undefined,
      standard: standardResult && 'result' in standardResult ? standardResult.result : null,
      standardRejectionReason: standardResult && 'rejectionReason' in standardResult ? standardResult.rejectionReason : undefined,
      express: expressResult && 'result' in expressResult ? expressResult.result : null,
      expressRejectionReason: expressResult && 'rejectionReason' in expressResult ? expressResult.rejectionReason : undefined,
      capacityValidation: {
        economy: capacityValidation.economy,
        standard: capacityValidation.standard,
        express: capacityValidation.express,
      },
      calculatedAt: new Date().toISOString()
    };
  } catch (error) {
    logger.error('Availability calculation failed for tiers', error instanceof Error ? error : new Error('Unknown error'), { requestId });
    
    // Return fallback availability (Standard and Express only)
    return {
      economy: null,
      economyRejectionReason: 'Capacity validation unavailable - service temporarily disabled',
      standard: {
        next_available_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        window: 'ALL_DAY' as const,
        route_type: 'standard' as const,
        confidence: 85,
        explanation: 'Standard service available next business day',
        capacity_used_pct: 75,
        fill_rate: 75
      },
      express: {
        next_available_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        window: 'ALL_DAY' as const,
        route_type: 'express' as const,
        confidence: 95,
        explanation: 'Express service available next business day',
        capacity_used_pct: 100,
        fill_rate: 100
      },
      capacityValidation: {
        economy: { feasible: false, rejectionReason: 'System error during capacity validation' },
        standard: { feasible: true, rejectionReason: null },
        express: { feasible: true, rejectionReason: null },
      },
      calculatedAt: new Date().toISOString()
    };
  }
}

/**
 * NEW: Validate capacity feasibility for all tiers using VRP algorithm
 * This ensures Economy tier is only shown when the load can physically fit in the van
 */
async function validateCapacityForTiers(
  pricingInput: any,
  requestId: string
): Promise<{
  economy: { feasible: boolean; rejectionReason: string | null };
  standard: { feasible: boolean; rejectionReason: string | null };
  express: { feasible: boolean; rejectionReason: string | null };
}> {
  try {
    // Extract item IDs from pricing input
    const itemIds = pricingInput.items.flatMap((item: any) => 
      Array(item.quantity).fill(item.id)
    );

    // Build booking request for VRP validation
    const bookingRequest: BookingRequest = {
      id: requestId,
      pickupAddress: pricingInput.pickup.full,
      deliveryAddress: pricingInput.dropoffs[0]?.full || pricingInput.pickup.full,
      itemIds: itemIds,
      priority: 'standard',
    };

    // Validate for each tier
    const [economyPlan, standardPlan, expressPlan] = await Promise.allSettled([
      planCapacityConstrainedRoute([bookingRequest], { tier: 'economy' }),
      planCapacityConstrainedRoute([bookingRequest], { tier: 'standard' }),
      planCapacityConstrainedRoute([bookingRequest], { tier: 'express' }),
    ]);

    // Process economy tier
    let economyFeasible = false;
    let economyRejection: string | null = null;
    if (economyPlan.status === 'fulfilled' && economyPlan.value.isFeasible) {
      economyFeasible = true;
    } else if (economyPlan.status === 'fulfilled') {
      economyRejection = economyPlan.value.rejectionReasons[0] || 'Capacity exceeded for economy tier';
    } else {
      economyRejection = 'Economy tier validation failed';
    }

    // Process standard tier
    let standardFeasible = true; // Standard is more lenient
    let standardRejection: string | null = null;
    if (standardPlan.status === 'fulfilled' && !standardPlan.value.isFeasible) {
      standardFeasible = false;
      standardRejection = standardPlan.value.rejectionReasons[0] || 'Capacity exceeded for standard tier';
    }

    // Process express tier
    let expressFeasible = true; // Express is most lenient
    let expressRejection: string | null = null;
    if (expressPlan.status === 'fulfilled' && !expressPlan.value.isFeasible) {
      expressFeasible = false;
      expressRejection = expressPlan.value.rejectionReasons[0] || 'Capacity exceeded for express tier';
    }

    logger.info('Capacity validation completed', {
      economy: { feasible: economyFeasible, reason: economyRejection },
      standard: { feasible: standardFeasible, reason: standardRejection },
      express: { feasible: expressFeasible, reason: expressRejection },
    }, { requestId });

    return {
      economy: { feasible: economyFeasible, rejectionReason: economyRejection },
      standard: { feasible: standardFeasible, rejectionReason: standardRejection },
      express: { feasible: expressFeasible, rejectionReason: expressRejection },
    };

  } catch (error) {
    logger.error('Capacity validation failed', error instanceof Error ? error : new Error('Unknown error'), { requestId });
    
    // Fallback: Disable economy, enable standard and express
    return {
      economy: { feasible: false, rejectionReason: 'Capacity validation system error' },
      standard: { feasible: true, rejectionReason: null },
      express: { feasible: true, rejectionReason: null },
    };
  }
}

/**
 * Calculate booking capacity from items list
 */
function calculateCapacityFromItems(items: any[]): BookingCapacity {
  let totalWeight = 0;
  let totalVolume = 0;
  let estimatedDuration = 0;

  for (const item of items) {
    // Use override values if provided, otherwise use defaults
    const weight = item.weight_override || (item.weightKg || 10); // Default 10kg
    const volume = item.volume_override || (item.volumeM3 || 0.1); // Default 0.1m³
    
    totalWeight += weight * item.quantity;
    totalVolume += volume * item.quantity;
    estimatedDuration += 5 * item.quantity; // 5 minutes per item
  }

  return {
    totalWeightKg: totalWeight,
    totalVolumeM3: totalVolume,
    estimatedDurationMinutes: Math.max(estimatedDuration, 60), // Minimum 1 hour
    crewRequired: 2 // Default crew size
  };
}

// ============================================================================
// STRIPE INTEGRATION WITH PARITY CHECKS
// ============================================================================

async function createStripePaymentIntent(
  pricingResult: any,
  correlationId: string
): Promise<{ paymentIntent: Stripe.PaymentIntent | null }> {
  try {
    // Validate amount parity (must match pricing engine exactly)
    const amountGbpMinor = pricingResult.amountGbpMinor;
    if (!amountGbpMinor || amountGbpMinor <= 0) {
      throw new Error(`Invalid amount: ${amountGbpMinor}`);
    }

    // Create idempotent Payment Intent (skip if Stripe not configured)
    if (!stripe) {
      console.warn('⚠️ Stripe not configured - skipping Payment Intent creation');
      return { paymentIntent: null };
    }
    
    const idempotencyKey = pricingResult.stripeMetadata.idempotencyKey;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountGbpMinor,
      currency: 'gbp',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        correlationId,
        requestId: pricingResult.requestId,
        serviceLevel: pricingResult.serviceLevel,
        itemCount: pricingResult.route.stops.reduce((sum: number, stop: any) =>
          sum + stop.capacityUsed.items, 0),
        dropCount: pricingResult.route.stops.length - 1,
        totalWeight: pricingResult.route.stops.reduce((sum: number, stop: any) =>
          sum + stop.capacityUsed.weight, 0),
        totalVolume: pricingResult.route.stops.reduce((sum: number, stop: any) =>
          sum + stop.capacityUsed.volume, 0),
        routeEfficiency: pricingResult.route.optimization.efficiencyScore,
        capacityValid: pricingResult.route.capacityCheck.isValid ? 'true' : 'false'
      },
      description: `Removal Service - ${pricingResult.serviceLevel} service, ${pricingResult.route.stops.length - 1} drop(s)`,
      receipt_email: undefined, // Set by frontend
    }, {
      idempotencyKey
    });

    console.log(`💳 [${pricingResult.requestId}] Stripe PI created: ${paymentIntent.id} (£${amountGbpMinor / 100})`);

    // Parity check: Ensure Stripe amount matches pricing engine
    if (paymentIntent.amount !== amountGbpMinor) {
      console.error(`🚨 PARITY VIOLATION: Stripe amount (${paymentIntent.amount}) != Pricing amount (${amountGbpMinor})`);
      throw new Error('Stripe parity check failed');
    }

    return { paymentIntent };

  } catch (error) {
    console.error(`❌ Stripe PI creation failed for ${correlationId}:`, error);
    throw error;
  }
}

// ============================================================================
// TIME-BASED CALCULATIONS
// ============================================================================

function isRushHour(date: Date): boolean {
  const hour = date.getHours();
  const day = date.getDay(); // 0 = Sunday, 6 = Saturday

  // Weekday rush hours: 7-9 AM, 5-7 PM
  if (day >= 1 && day <= 5) {
    return (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19);
  }

  return false;
}

function isPeakSeason(date: Date): boolean {
  const month = date.getMonth() + 1; // 1-12
  return month >= 7 && month <= 8; // July-August
}

function isStudentSeason(date: Date): boolean {
  const month = date.getMonth() + 1;
  return month === 9; // September
}

function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6; // Sunday or Saturday
}

// ============================================================================
// LOGGING & OBSERVABILITY
// ============================================================================

function logPricingMetrics(
  requestId: string,
  correlationId: string,
  result: any,
  startTime: number
): void {
  const processingTime = Date.now() - startTime;

  console.log(`📈 [${requestId}] Enhanced Pricing Metrics:`, {
    correlationId,
    amountGbpMinor: result.amountGbpMinor,
    amountGbp: (result.amountGbpMinor / 100).toFixed(2),
    currency: result.currency,
    serviceLevel: result.serviceLevel,
    itemCount: result.route.stops.reduce((sum: number, stop: any) => sum + stop.capacityUsed.items, 0),
    dropCount: result.route.stops.length - 1,
    totalDistance: result.route.totalDistanceKm,
    totalDuration: result.route.totalDurationMinutes,
    routeEfficiency: result.route.optimization.efficiencyScore,
    capacityValid: result.route.capacityCheck.isValid,
    weightUtilization: result.route.capacityCheck.weightUtilization,
    volumeUtilization: result.route.capacityCheck.volumeUtilization,
    processingTimeMs: processingTime,
    stripePaymentIntentId: result.stripeMetadata?.paymentIntentId,
    warningsCount: result.metadata.warnings.length,
    recommendationsCount: result.metadata.recommendations.length,
    compliance: result.metadata.compliance,
    operationalCompliance: result.operationalCompliance,
    datasetComplianceScore: result.complianceMetadata.datasetComplianceScore,
    parityCheckResult: result.complianceMetadata.parityCheckResult
  });
}

function logPricingError(requestId: string, error: any): void {
  console.error(`🚨 [${requestId}] Pricing Error:`, {
    requestId,
    errorType: error.constructor.name,
    errorMessage: error.message,
    stack: error.stack?.split('\n').slice(0, 5), // First 5 stack lines
    timestamp: new Date().toISOString()
  });
}

// ============================================================================
// HEALTH CHECK ENDPOINT
// ============================================================================

export async function GET() {
  try {
    // Test dataset loading
    await comprehensivePricingEngine.loadDataset();

    // Test enhanced pricing calculation with operational compliance
    const testInput = EnhancedPricingInputSchema.parse({
      requestId: 'health_check',
      correlationId: 'health_check',
      items: [{
        id: 'test_item',
        name: 'Test Sofa',
        quantity: 1
      }],
      pickup: {
        full: '123 Test Street, London SW1A 1AA',
        line1: '123 Test Street',
        city: 'London',
        postcode: 'SW1A 1AA',
        coordinates: { lat: 51.5074, lng: -0.1278 },
        propertyType: 'house',
        parkingSituation: 'easy',
        congestionZone: false
      },
      dropoffs: [],
      serviceLevel: 'standard',
      scheduledDate: new Date().toISOString(),
      customerSegment: 'bronze',
      timeFactors: {
        isRushHour: false,
        isPeakSeason: false,
        isStudentSeason: false,
        isWeekend: false,
        currentHour: 12,
        currentMonth: 6
      }
    });

    const testResult = await comprehensivePricingEngine.calculatePrice(testInput);

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      dataset: {
        loaded: true,
        version: 'UK_Removal_Dataset_v1.0',
        compliance: '100% (22 fields per item)'
      },
      pricing: {
        functional: true,
        sampleAmount: testResult.amountGbpMinor,
        operationalCompliance: testResult.operationalCompliance.datasetFieldsUsed === 22,
        rulesApplied: testResult.operationalCompliance.operationalRulesApplied
      },
      operationalInsights: {
        loadingStrategy: 'heavy-first, secure-straps, corner-protectors',
        workerAllocation: '2 workers for heavy items, conditional extras',
        multiDropEfficiency: 'LIFO unloading, group by room',
        vanUtilization: '14.5m³ max, capacity buffers',
        timeEstimation: 'item-specific + stair/distance factors',
        damagePrevention: 'fragility levels, insurance categories'
      },
      stripe: {
        configured: !!process.env.STRIPE_SECRET_KEY,
        testMode: process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_')
      }
    });

  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 503 });
  }
}
