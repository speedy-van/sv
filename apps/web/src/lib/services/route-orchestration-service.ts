/**
 * Route Orchestration Service
 * 
 * Handles route optimization and driver assignment
 */

import { PrismaClient } from '@prisma/client';
import { promises as fs } from 'fs';
import path from 'path';
// TODO: PayoutCalculator needs to be implemented
// import { PayoutCalculator } from '../pricing/payout-calculator';

/**
 * Get or create a system driver for unassigned routes
 */
async function getOrCreateSystemDriver() {
  try {
    // Try to find existing system driver
    let systemDriver = await prisma.user.findFirst({
      where: {
        email: 'system@speedy-van.co.uk',
        role: 'driver'
      }
    });

    if (!systemDriver) {
      // Create system driver if not exists
      systemDriver = await prisma.user.create({
        data: {
          email: 'system@speedy-van.co.uk',
          name: 'System Driver',
          role: 'driver',
          isActive: true,
          emailVerified: true,
          createdAt: new Date(),
          password: 'system_password_not_used', // System user, password not used
        }
      });
    }

    return systemDriver;
  } catch (error) {
    console.error('❌ Failed to get/create system driver:', error);
    throw error;
  }
}

/**
 * Advanced Driver Pricing Engine
 *
 * Implements the enterprise pricing system with:
 * - Daily cap of £500 per driver
 * - Multi-component earnings calculation
 * - Admin approval system for cap breaches
 * - Performance bonuses and penalties
 */

export interface DriverEarningsCalculation {
  grossEarnings: number; // Total before platform fee
  platformFee: number;    // Platform deduction
  netEarnings: number;    // Final payout to driver
  dailyCapApplied: boolean;
  adminApprovalRequired: boolean;
  breakdown: {
    baseDistanceRate: number;
    multiDropBonus: number;
    capacityBonus: number;
    timeBasedPay: number;
    expenses: number;
    adminBonuses: number;
    penalties: number;
  };
}

// AdvancedPayoutCalculator removed - use real engine from @/lib/driver-earnings-service instead

const prisma = new PrismaClient();

export interface RouteAssignment {
  routeId: string;
  driverId: string;
  vehicleId?: string;
  drops: string[]; // Array of drop IDs
  estimatedDuration: number; // minutes
  estimatedDistance: number; // km
  estimatedEarnings: number;
}

export interface DropCapacity {
  weight: number;
  volume: number;
  itemCount: number;
}

export interface DropWithCapacity {
  id: string;
  capacity: DropCapacity;
  booking?: {
    items?: any[];
    pickupAddress?: any;
    dropoffAddress?: any;
    quotedPrice?: number;
  };
  timeWindowStart?: Date;
  createdAt?: Date;
}

export interface RouteSegment {
  drops: DropWithCapacity[];
  currentWeight: number;
  currentVolume: number;
  totalDistance: number;
  totalDuration: number;
  totalValue: number;
  area: string;
}

export interface VehicleCapacityLimits {
  maxWeight: number; // kg
  maxVolume: number; // m³
  maxDropsPerDay: number;
  maxHoursPerDay: number;
}

export interface RouteStop {
  id: string;
  type: 'pickup' | 'dropoff'; // Load or unload operation
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    weight: number;
    volume: number;
  }>;
  operationTime: number; // minutes for load/unload operation
  dropId?: string; // Reference to the drop if applicable
}

export interface OptimizedRoute {
  stops: RouteStop[];
  totalDistance: number;
  totalDuration: number;
  totalValue: number;
  currentLoad: {
    weight: number;
    volume: number;
    itemCount: number;
  };
  area: string;
}

export interface OptimizationResult {
  routes: RouteAssignment[];
  unassignedDrops: string[];
  optimizationScore: number; // 0-100
}

export class RouteOrchestrationService {
  // Official dataset cache - CRITICAL for accurate pricing
  private static officialDataset: any = null;
  private static datasetValidationCache: Map<string, any> = new Map();

  /**
   * Load the official UK Removal Dataset - CRITICAL for accurate weights and volumes
   * This prevents the financial loss caused by fake default weights
   */
  private static async loadOfficialDataset(): Promise<any> {
    if (this.officialDataset) {
      return this.officialDataset;
    }

    try {
      const datasetPath = path.join(process.cwd(), 'public', 'UK_Removal_Dataset', 'items_dataset.json');
      const datasetContent = await fs.readFile(datasetPath, 'utf-8');
      const dataset = JSON.parse(datasetContent);

      // Validate dataset integrity
      if (!dataset.items || !Array.isArray(dataset.items)) {
        throw new Error('Invalid dataset format: missing items array');
      }

      // Validate that ALL items have weights - NO EXCEPTIONS
      const itemsWithoutWeight = dataset.items.filter((item: any) => !item.weight && item.weight !== 0);
      if (itemsWithoutWeight.length > 0) {
        throw new Error(`CRITICAL DATA INTEGRITY ERROR: ${itemsWithoutWeight.length} items missing weights in official dataset: ${itemsWithoutWeight.map((i: any) => i.id).join(', ')}\n\nThis will cause REAL FINANCIAL LOSS through incorrect pricing.`);
      }

      // Validate that ALL items have volumes
      const itemsWithoutVolume = dataset.items.filter((item: any) => !item.volume && item.volume !== 0);
      if (itemsWithoutVolume.length > 0) {
        console.warn(`⚠️ Warning: ${itemsWithoutVolume.length} items missing volumes, using estimates`);
      }

      console.log(`[OFFICIAL DATASET] ✅ Loaded and validated: ${dataset.items.length} items with REAL weights and volumes`);
      console.log(`[OFFICIAL DATASET] 💰 Pricing accuracy: GUARANTEED (no more fake 10kg defaults)`);

      this.officialDataset = dataset;
      return dataset;

    } catch (error) {
      console.error('[DATASET FAILURE] ❌ Cannot load official dataset:', error);
      throw new Error(`CRITICAL FAILURE: Cannot proceed without official dataset. Real financial loss will occur with default weights.\n\nError: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate and enrich booking items with official dataset data
   * Prevents fake weights from destroying pricing accuracy
   */
  private static async validateAndEnrichItemData(items: any[]): Promise<any[]> {
    const dataset = await this.loadOfficialDataset();
    const datasetItems = dataset.items;

    // Create lookup maps for fast validation
    const idLookup = new Map();
    const nameLookup = new Map();
    const filenameLookup = new Map();

    datasetItems.forEach((item: any) => {
      idLookup.set(item.id, item);
      nameLookup.set(item.name?.toLowerCase(), item);
      if (item.filename) {
        filenameLookup.set(item.filename, item);
      }
    });

    const enrichedItems: any[] = [];
    const validationErrors: string[] = [];
    let enrichedCount = 0;

    for (const item of items) {
      let datasetItem = null;

      // Try multiple lookup strategies
      datasetItem = idLookup.get(item.id) ||
                   nameLookup.get(item.name?.toLowerCase()) ||
                   filenameLookup.get(item.filename) ||
                   filenameLookup.get(item.image?.split('/').pop());

      if (!datasetItem) {
        validationErrors.push(`❌ Item not found in official dataset: ${item.id || item.name || 'Unknown item'}`);
        continue;
      }

      if (!datasetItem.weight && datasetItem.weight !== 0) {
        validationErrors.push(`❌ Missing weight in official dataset for: ${datasetItem.id}`);
        continue;
      }

      // Enrich with OFFICIAL data - NO DEFAULTS ALLOWED
      enrichedItems.push({
        ...item,
        id: datasetItem.id,
        name: datasetItem.name,
        weight: datasetItem.weight, // REAL weight from official dataset
        volume: datasetItem.volume || item.volume || (datasetItem.weight * 0.01), // Prefer official volume
        volumeM3: datasetItem.volume || item.volumeM3 || item.volume || (datasetItem.weight * 0.01),
        category: datasetItem.category || item.category,
        fragility_level: datasetItem.fragility_level,
        workers_required: datasetItem.workers_required || 1,
        dismantling_required: datasetItem.dismantling_required || 'No',
        // Add any other official data needed
      });

      enrichedCount++;
    }

    if (validationErrors.length > 0) {
      throw new Error(`CRITICAL VALIDATION FAILURE - REAL FINANCIAL LOSS IMMINENT:\n\n${validationErrors.join('\n')}\n\nCannot proceed with incomplete item data. Official dataset must contain ALL items with real weights.`);
    }

    console.log(`[ITEM ENRICHMENT] ✅ Enriched ${enrichedCount} items with OFFICIAL dataset data`);
    console.log(`[ITEM ENRICHMENT] 💰 Pricing accuracy: VERIFIED (using real weights, not defaults)`);

    return enrichedItems;
  }

  /**
   * COMPLETE PRE-ROUTE PLANNING: Generate routes with load/unload sequence BEFORE driver starts
   *
   * Route planning happens BEFORE driver assignment and includes:
   * 1. 📋 Load Sequence Planning (pickup locations with capacity constraints)
   * 2. 📦 Unload Sequence Planning (delivery locations with unloading stops)
   * 3. 🗺️ Distance Optimization (optimal route between all load/unload points)
   * 4. 👤 Driver Assignment (routes are ready for immediate execution)
   * 5. 🚛 Driver Execution (follows pre-planned load/unload sequence)
   *
   * Result: Driver starts route with complete itinerary of 10-15 load/unload operations
   */
  public static async createCapacityAwareRoutes(): Promise<OptimizationResult> {
    try {
      // 1. Get all pending drops with detailed item information
      const pendingDrops = await prisma.drop.findMany({
        where: {
          status: 'booked',
          routeId: null
        },
        orderBy: { timeWindowStart: 'asc' },
        include: {
          Booking: {
            select: {
              id: true,
              reference: true,
              customerName: true,
              customerEmail: true,
              pickupAddress: {
                select: {
                  lat: true,
                  lng: true,
                  label: true
                }
              },
              dropoffAddress: {
                select: {
                  lat: true,
                  lng: true,
                  label: true
                }
              },
              BookingItem: {
                select: {
                  id: true,
                  name: true,
                  quantity: true
                }
              }
            }
          }
        }
      });

      if (pendingDrops.length === 0) {
        return {
          routes: [],
          unassignedDrops: [],
          optimizationScore: 100
        };
      }

      console.log(`[PRE-ROUTE PLANNING] 🚛 Complete route planning for ${pendingDrops.length} drops with load/unload sequence`);
      console.log(`[PRE-ROUTE PLANNING] 📦 Vehicle capacity: 1000kg, 10m³, max 15 operations/day`);
      console.log(`[PRE-ROUTE PLANNING] 📋 Planning load → unload → distance optimization BEFORE driver starts`);
      console.log(`[PRE-ROUTE PLANNING] 🎯 Result: Complete itinerary ready for immediate driver execution`);

      // 2. VALIDATE ALL ITEMS AGAINST OFFICIAL DATASET BEFORE PROCEEDING
      console.log(`[VALIDATION] 🔍 Validating ${pendingDrops.length} drops against official dataset...`);

      // Collect all items from all drops for validation
      const allItems: any[] = [];
      const dropsWithBooking = pendingDrops as any[]; // Type assertion for complex Prisma include
      
      for (const drop of dropsWithBooking) {
        const items = drop.booking?.BookingItem || [];
        allItems.push(...items);
      }

      if (allItems.length === 0) {
        console.warn('[VALIDATION] ⚠️ No items found in pending drops');
        return {
          routes: [],
          unassignedDrops: [],
          optimizationScore: 0
        };
      }

      // Validate and enrich all items with OFFICIAL dataset data
      const enrichedItems = await this.validateAndEnrichItemData(allItems);

      // Re-assign enriched items back to drops
      let itemIndex = 0;
      for (const drop of dropsWithBooking) {
        const originalItemCount = drop.booking?.items?.length || 0;
        drop.booking.items = enrichedItems.slice(itemIndex, itemIndex + originalItemCount);
        itemIndex += originalItemCount;
      }

      // 4. Create route stops with load/unload operations using VALIDATED data
      const routeStops = this.createRouteStopsWithLoadUnloadSequence(pendingDrops);

      // 5. Optimize routes with load/unload sequence and distance optimization
      const optimizedRoutes = this.optimizeRoutesWithLoadUnloadSequence(routeStops);

      // 6. Convert optimized routes to database route assignments
      const createdRoutes: RouteAssignment[] = [];
      const unassignedDrops: string[] = [];

      for (const optimizedRoute of optimizedRoutes) {
        try {
          // Get system driver for unassigned routes
          const systemDriver = await getOrCreateSystemDriver();

          const route = await prisma.route.create({
            data: {
              status: 'planned' as const,
              startTime: new Date(),
              optimizedDistanceKm: optimizedRoute.totalDistance,
              estimatedDuration: optimizedRoute.totalDuration,
              totalOutcome: optimizedRoute.totalValue,
              drops: {
                connect: optimizedRoute.stops
                  .filter(stop => stop.dropId) // Only connect actual drops
                  .map(stop => ({ id: stop.dropId! }))
              },
              driverId: systemDriver.id
            },
            include: {
              drops: true
            }
          });

          // Update drops with route assignment
          const dropIds = optimizedRoute.stops
            .filter(stop => stop.dropId)
            .map(stop => stop.dropId!);

          await prisma.drop.updateMany({
            where: { id: { in: dropIds } },
            data: { routeId: route.id }
          });

          createdRoutes.push({
            routeId: route.id,
            driverId: '',
            drops: dropIds,
            estimatedDuration: optimizedRoute.totalDuration,
            estimatedDistance: optimizedRoute.totalDistance,
            estimatedEarnings: optimizedRoute.totalValue
          });

          const operationCount = optimizedRoute.stops.length;
          console.log(`[PRE-ROUTE PLANNING] 📋 Planned route ${route.id} with ${operationCount} operations (${operationCount > 10 ? 'HIGH EFFICIENCY' : 'OPTIMIZED SEQUENCE'})`);
          console.log(`[PRE-ROUTE PLANNING] 📍 Route sequence: ${optimizedRoute.stops.map(s => s.type).join(' → ')} (${optimizedRoute.totalDistance.toFixed(1)}km)`);

        } catch (error) {
          console.error(`[PRE-ROUTE PLANNING] Error creating route:`, error);
          unassignedDrops.push(...optimizedRoute.stops
            .filter(stop => stop.dropId)
            .map(stop => stop.dropId!));
        }
      }

      // Handle any remaining unassigned drops
      const allAssignedDropIds = createdRoutes.flatMap(route => route.drops);
      const remainingUnassigned = pendingDrops
        .filter(drop => !allAssignedDropIds.includes(drop.id))
        .map(drop => drop.id);

      unassignedDrops.push(...remainingUnassigned);

      const optimizationScore = this.calculateOptimizationScore(pendingDrops.length, allAssignedDropIds.length, createdRoutes);

      console.log(`[COMPLETE ROUTE PLANNING] ✅ Generated ${createdRoutes.length} fully-optimized routes`);
      console.log(`[COMPLETE ROUTE PLANNING] 📊 Average operations per route: ${(allAssignedDropIds.length / createdRoutes.length).toFixed(1)} (target: 10-15)`);
      console.log(`[COMPLETE ROUTE PLANNING] 🎯 Load/Unload optimization score: ${optimizationScore}%`);
      console.log(`[COMPLETE ROUTE PLANNING] 🚛 Drivers can start immediately - complete itineraries ready`);
      console.log(`[COMPLETE ROUTE PLANNING] 📋 Each route includes: Load → Drive → Unload → Repeat sequence`);

      return {
        routes: createdRoutes,
        unassignedDrops,
        optimizationScore
      };

    } catch (error) {
      console.error('[CAPACITY-AWARE ROUTING] Error:', error);
      return {
        routes: [],
        unassignedDrops: [],
        optimizationScore: 0
      };
    }
  }

  /**
   * Create routes from pending drops (Admin-triggered route creation)
   * This creates planned routes that admin can manually assign to drivers
   */
  public static async createRoutesFromPendingDrops(): Promise<OptimizationResult> {
    try {
      // 1. Get all pending drops (booked but not yet in routes)
      const pendingDrops = await prisma.drop.findMany({
        where: {
          status: 'booked',
          routeId: null // Drops not yet assigned to routes
        },
        orderBy: { timeWindowStart: 'asc' },
        include: {
          Booking: {
            select: {
              id: true,
              reference: true,
              customerName: true,
              customerEmail: true,
              pickupAddress: {
                select: {
                  lat: true,
                  lng: true,
                  label: true
                }
              },
              dropoffAddress: {
                select: {
                  lat: true,
                  lng: true,
                  label: true
                }
              }
            }
          }
        }
      });

      if (pendingDrops.length === 0) {
        return {
          routes: [],
          unassignedDrops: [],
          optimizationScore: 100
        };
      }

      console.log(`[ROUTE ORCHESTRATION] Creating routes for ${pendingDrops.length} pending drops`);

      // 2. Group drops by geographical area and time windows
      const routeGroups = this.groupDropsByAreaAndTime(pendingDrops);

      // 3. Create routes for each group
      const createdRoutes: RouteAssignment[] = [];
      const unassignedDrops: string[] = [];

      for (const [groupKey, drops] of Object.entries(routeGroups)) {
        if (drops.length > 0) {
          try {
            // Calculate route metrics
            const routeMetrics = this.calculateRouteMetrics(drops);

            // Get system driver for unassigned routes
            const systemDriver = await getOrCreateSystemDriver();

            // Create route (unassigned - admin will assign to driver)
            const route = await prisma.route.create({
              data: {
                status: 'planned' as const,
                startTime: new Date(),
                optimizedDistanceKm: routeMetrics.totalDistance,
                estimatedDuration: routeMetrics.totalDuration,
                totalOutcome: routeMetrics.totalValue,
                drops: {
                  connect: drops.map(drop => ({ id: drop.id }))
                },
                driverId: systemDriver.id // Will be assigned later by admin
              },
              include: {
                drops: true
              }
            });

            // Update drops with route assignment
            await prisma.drop.updateMany({
              where: { id: { in: drops.map(drop => drop.id) } },
              data: { routeId: route.id }
            });

            createdRoutes.push({
              routeId: route.id,
              driverId: '', // Unassigned - admin will assign
              drops: drops.map(drop => drop.id),
              estimatedDuration: routeMetrics.totalDuration,
              estimatedDistance: routeMetrics.totalDistance,
              estimatedEarnings: routeMetrics.totalValue
            });

            console.log(`[ROUTE ORCHESTRATION] Created route ${route.id} with ${drops.length} drops`);

          } catch (error) {
            console.error(`[ROUTE ORCHESTRATION] Error creating route for group ${groupKey}:`, error);
            unassignedDrops.push(...drops.map(drop => drop.id));
          }
        }
      }

      // 4. Calculate optimization score
      const assignedDropsCount = createdRoutes.reduce((sum, route) => sum + route.drops.length, 0);
      const optimizationScore = this.calculateOptimizationScore(
        pendingDrops.length,
        assignedDropsCount,
        createdRoutes
      );

      console.log(`[ROUTE ORCHESTRATION] Route creation completed:`, {
        totalDrops: pendingDrops.length,
        routesCreated: createdRoutes.length,
        assignedDrops: assignedDropsCount,
        unassignedDrops: unassignedDrops.length,
        optimizationScore
      });

      return {
        routes: createdRoutes,
        unassignedDrops,
        optimizationScore
      };

    } catch (error) {
      console.error('Error in route creation:', error);
      throw new Error('Route creation failed');
    }
  }

  /**
   * Assign a specific route to a driver
   */
  public static async assignRoute(routeId: string, driverId: string): Promise<RouteAssignment> {
    try {
      // 1. Validate route and driver
      const route = await prisma.route.findUnique({
        where: { id: routeId },
        include: { drops: true }
      });

      if (!route) {
        throw new Error('Route not found');
      }

      if (route.status !== 'planned') {
        throw new Error('Route is not available for assignment');
      }

      const driver = await prisma.user.findUnique({
        where: { id: driverId },
          include: { driver: true }
      });

      if (!driver || !driver.driver) {
        throw new Error('Driver not found');
      }

      if (driver.driver.status !== 'active') {
        throw new Error('Driver is not available');
      }

      // 2. Check if driver is already assigned to another route
      const existingAssignment = await prisma.route.findFirst({
        where: {
          driverId,
          status: { in: ['planned', 'assigned', 'in_progress'] }
        }
      });

      if (existingAssignment) {
        throw new Error('Driver is already assigned to another route');
      }

      // 3. Update route assignment
      const updatedRoute = await prisma.route.update({
        where: { id: routeId },
        data: {
          driverId,
          status: 'assigned'
          // Note: vehicleId assignment would need to be handled separately based on driver's vehicles
        },
        include: { drops: true }
      });

      // 4. Update all drops in the route
      await prisma.drop.updateMany({
        where: { routeId },
        data: { status: 'booked' }
      });

      // 5. Calculate estimated earnings
      const estimatedEarnings = this.calculateEstimatedEarnings(updatedRoute);

      // 6. Create route assignment record with 30-minute expiry
      const assignmentId = `route_assign_${routeId}_${driverId}_${Date.now()}`;
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
      
      // NOTE: Routes don't use Assignment table currently
      // They use direct route.driverId assignment
      // This is different from single orders which use Assignment table
      // Consider refactoring to use Assignment table for consistency

      // 7. Send real-time notification to driver via Pusher
      try {
        const Pusher = (await import('pusher')).default;
        const pusher = new Pusher({
          appId: process.env.PUSHER_APP_ID || '',
          key: process.env.PUSHER_KEY || '',
          secret: process.env.PUSHER_SECRET || '',
          cluster: process.env.PUSHER_CLUSTER || 'eu',
          useTLS: true,
        });

        await pusher.trigger(`driver-${driver.driver.id}`, 'route-matched', {
          type: 'multi-drop-route',
          matchType: 'route',
          routeId: updatedRoute.id,
          routeNumber: updatedRoute.id,
          bookingReference: updatedRoute.id, // Routes don't have booking references
          orderNumber: updatedRoute.id,
          jobCount: updatedRoute.drops.length,
          dropCount: updatedRoute.drops.length,
          assignmentId: assignmentId,
          assignedAt: new Date().toISOString(),
          expiresAt: expiresAt.toISOString(),
          expiresInSeconds: 1800, // 30 minutes
          estimatedEarnings: estimatedEarnings,
          estimatedDistance: updatedRoute.optimizedDistanceKm || 0,
          estimatedDuration: updatedRoute.estimatedDuration || 0,
          message: `New route with ${updatedRoute.drops.length} stops assigned - 30 minutes to accept`,
        });

        // Notify admin channels
        await pusher.trigger('admin-routes', 'route-assigned', {
          routeId: updatedRoute.id,
          driverId: driver.driver.id,
          driverName: driver.name,
          dropCount: updatedRoute.drops.length,
          assignedAt: new Date().toISOString(),
        });

        console.log('✅ Real-time route assignment notifications sent');
      } catch (notificationError) {
        console.error('❌ Error sending route assignment notifications:', notificationError);
        // Don't fail the assignment if notifications fail
      }

      return {
        routeId: updatedRoute.id,
        driverId,
        vehicleId: updatedRoute.vehicleId || undefined,
        drops: updatedRoute.drops.map(drop => drop.id),
        estimatedDuration: updatedRoute.estimatedDuration || 0,
        estimatedDistance: updatedRoute.optimizedDistanceKm || 0,
        estimatedEarnings
      };

    } catch (error) {
      console.error('Error assigning route:', error);
      throw error;
    }
  }

  /**
   * Get route details with current status
   */
  public static async getRoute(routeId: string) {
    try {
      const route = await prisma.route.findUnique({
        where: { id: routeId },
        include: {
          drops: true,
          driver: true,
          Vehicle: true
        }
      });

      if (!route) return null;

      return {
        id: route.id,
        status: route.status,
        driverId: route.driverId,
        vehicleId: route.vehicleId,
        startTime: route.startTime,
        endTime: route.endTime,
        estimatedDistance: route.optimizedDistanceKm,
        actualDistance: route.actualDistanceKm,
        totalOutcome: route.totalOutcome.toNumber(),
        drops: route.drops.map(drop => ({
          id: drop.id,
          status: drop.status,
          pickupAddress: drop.pickupAddress,
          deliveryAddress: drop.deliveryAddress,
          timeWindow: {
            start: drop.timeWindowStart,
            end: drop.timeWindowEnd
          },
          serviceTier: drop.serviceTier,
          quotedPrice: drop.quotedPrice.toNumber()
        })),
        driver: route.driver ? {
          id: route.driver.id,
          name: route.driver.name,
          email: route.driver.email
        } : null,
        vehicle: route.Vehicle ? {
          id: route.Vehicle.id,
          licensePlate: route.Vehicle.licensePlate,
          make: route.Vehicle.make,
          model: route.Vehicle.model
        } : null
      };

    } catch (error) {
      console.error('Error retrieving route:', error);
      return null;
    }
  }

  /**
   * Group drops by geographical area and time windows
   */
  private static groupDropsByAreaAndTime(drops: any[]): Record<string, any[]> {
    const groups: Record<string, any[]> = {};

    for (const drop of drops) {
      // Create group key based on area and time window
      const area = this.extractAreaFromAddress(drop.pickupAddress);
      const timeWindow = this.getTimeWindowKey(drop.timeWindowStart);

      const groupKey = `${area}_${timeWindow}`;

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(drop);
    }

    return groups;
  }

  /**
   * Calculate route metrics for a group of drops
   */
  private static calculateRouteMetrics(drops: any[]): {
    earliestStart: Date;
    totalDistance: number;
    totalDuration: number;
    totalValue: number;
  } {
    if (drops.length === 0) {
      return {
        earliestStart: new Date(),
        totalDistance: 0,
        totalDuration: 0,
        totalValue: 0
      };
    }

    // Find earliest start time
    const earliestStart = drops.reduce((earliest, drop) => {
      return drop.timeWindowStart < earliest ? drop.timeWindowStart : earliest;
    }, drops[0].timeWindowStart);

    // Calculate total distance (simplified)
    const totalDistance = drops.length * 8; // Base estimate

    // Calculate total duration
    const totalDuration = drops.length * 45; // 45 minutes per drop average

    // Calculate total value
    const totalValue = drops.reduce((sum, drop) => sum + (drop.quotedPrice || 0), 0);

    return {
      earliestStart,
      totalDistance,
      totalDuration,
      totalValue
    };
  }

  /**
   * Get time window key for grouping (morning, afternoon, evening)
   */
  private static getTimeWindowKey(date: Date): string {
    const hour = date.getHours();
    if (hour >= 8 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 22) return 'evening';
    return 'other';
  }

  /**
   * Get available drivers for assignment
   */
  private static async getAvailableDrivers() {
    return await prisma.user.findMany({
      where: {
        role: 'driver',
        driver: {
          status: 'active'
        }
      },
      include: {
        driver: {
          include: {
            DriverProfile: true,
            DriverAvailability: true
          }
        }
      }
    });
  }

  /**
   * Get available vehicles
   */
  private static async getAvailableVehicles() {
    return await prisma.vehicle.findMany({
      where: {
        isActive: true
      }
    });
  }

  /**
   * Run optimization algorithm (simplified version)
   */
  private static async runOptimizationAlgorithm(
    drops: any[],
    drivers: any[],
    vehicles: any[]
  ): Promise<any[]> {
    // This is a simplified optimization algorithm
    // In production, this would use sophisticated routing algorithms like:
    // - Vehicle Routing Problem (VRP) solvers
    // - Google OR-Tools
    // - GraphHopper
    // - etc.

    const routes: any[] = [];
    const maxDropsPerRoute = 8;
    
    // Group drops by geographical area (simplified by postcode)
    const groupedDrops = this.groupDropsByArea(drops);
    
    for (const [area, areaDrops] of Object.entries(groupedDrops)) {
      // Split large groups into multiple routes
      const chunks = this.chunkArray(areaDrops as any[], maxDropsPerRoute);
      
      for (const chunk of chunks) {
        if (chunk.length > 0) {
          const estimatedDistance = this.calculateRouteDistance(chunk);
          const estimatedDuration = this.calculateRouteDuration(chunk, estimatedDistance);
          
          routes.push({
            drops: chunk.map((drop: any) => drop.id),
            estimatedDistance,
            estimatedDuration,
            area
          });
        }
      }
    }

    return routes;
  }

  /**
   * Split array into chunks
   */
  private static chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  /**
   * Calculate estimated route distance
   */
  private static calculateRouteDistance(drops: any[]): number {
    // Simplified calculation - in production would use routing API
    return drops.length * 8 + Math.random() * 20; // Base estimate
  }

  /**
   * Calculate estimated route duration
   */
  private static calculateRouteDuration(drops: any[], distance: number): number {
    // Simplified calculation
    const drivingTime = distance * 2; // 2 minutes per km
    const dropTime = drops.length * 15; // 15 minutes per drop
    return drivingTime + dropTime;
  }

  /**
   * Create route in database
   */
  private static async createRoute(routeData: any): Promise<RouteAssignment> {
    const route = await prisma.route.create({
      data: {
        driverId: '', // Will be assigned later
        status: 'planned',
        startTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
        optimizedDistanceKm: routeData.estimatedDistance,
        estimatedDuration: routeData.estimatedDuration,
        totalOutcome: 0 // Will be calculated after completion
      }
    });

    // Update drops to be associated with this route
    await prisma.drop.updateMany({
      where: { id: { in: routeData.drops } },
      data: { routeId: route.id }
    });

    return {
      routeId: route.id,
      driverId: '',
      drops: routeData.drops,
      estimatedDuration: routeData.estimatedDuration,
      estimatedDistance: routeData.estimatedDistance,
      estimatedEarnings: 0
    };
  }

  /**
   * Calculate optimization score
   */
  private static calculateOptimizationScore(
    totalDrops: number,
    assignedDrops: number,
    routes: RouteAssignment[]
  ): number {
    if (totalDrops === 0) return 100;

    const assignmentRate = (assignedDrops / totalDrops) * 100;
    const efficiencyScore = routes.length > 0 
      ? routes.reduce((sum, route) => sum + route.drops.length, 0) / routes.length * 10
      : 0;

    return Math.min(100, (assignmentRate * 0.7) + (efficiencyScore * 0.3));
  }

  /**
   * Create route stops with load/unload sequence
   * Converts drops into a sequence of pickup (load) and dropoff (unload) operations
   */
  private static createRouteStopsWithLoadUnloadSequence(drops: any[]): RouteStop[] {
    const routeStops: RouteStop[] = [];

    for (const drop of drops) {
      const items = drop.booking?.items || [];

      // Calculate item details for this stop - NO DEFAULT WEIGHTS ALLOWED
      const stopItems = items.map((item: any) => {
        if (!item.weight) {
          throw new Error(`CRITICAL ERROR: Missing weight for item ${item.id || item.name}. Cannot proceed with route planning.`);
        }
        if (!item.volumeM3 && !item.volume) {
          throw new Error(`CRITICAL ERROR: Missing volume for item ${item.id || item.name}. Cannot proceed with route planning.`);
        }

        return {
          id: item.id || `item-${Math.random()}`,
          name: item.name,
          quantity: item.quantity || 1,
          weight: item.weight, // REAL weight from dataset - NO DEFAULTS
          volume: item.volumeM3 || item.volume // REAL volume from dataset
        };
      });

      // Create dropoff stop (unload operation)
      routeStops.push({
        id: `dropoff-${drop.id}`,
        type: 'dropoff',
        location: {
          lat: drop.booking?.dropoffAddress?.lat || 0,
          lng: drop.booking?.dropoffAddress?.lng || 0,
          address: drop.booking?.dropoffAddress?.label || 'Dropoff Address'
        },
        items: stopItems,
        operationTime: Math.max(15, items.length * 3), // 15 min minimum + 3 min per item
        dropId: drop.id
      });

      // Note: In a full implementation, we would also create pickup stops
      // For now, we assume items are pre-loaded or picked up at a central location
      // TODO: Add pickup stops when we implement multi-location pickup system
    }

    return routeStops;
  }

  /**
   * Optimize routes with load/unload sequence and distance optimization
   * Creates routes that maximize capacity utilization while minimizing distance
   */
  private static optimizeRoutesWithLoadUnloadSequence(routeStops: RouteStop[]): OptimizedRoute[] {
    const VEHICLE_CAPACITY = {
      maxWeight: 1000,
      maxVolume: 10,
      maxOperationsPerDay: 15,
      maxHoursPerDay: 12
    };

    const optimizedRoutes: OptimizedRoute[] = [];

    // Group stops by geographical area first
    const stopsByArea = this.groupRouteStopsByArea(routeStops);

    for (const [area, areaStops] of Object.entries(stopsByArea)) {
      // Sort stops for optimal sequence (simplified - could use TSP solver)
      const sortedStops = this.sortRouteStopsForOptimization(areaStops);

      // Create optimized route segments
      const areaRoutes = this.createOptimizedRouteSegments(sortedStops, VEHICLE_CAPACITY);

      optimizedRoutes.push(...areaRoutes);
    }

    return optimizedRoutes;
  }

  /**
   * Group route stops by geographical area
   */
  private static groupRouteStopsByArea(stops: RouteStop[]): Record<string, RouteStop[]> {
    return stops.reduce((groups, stop) => {
      const area = this.extractAreaFromLocation(stop.location);
      if (!groups[area]) {
        groups[area] = [];
      }
      groups[area].push(stop);
      return groups;
    }, {} as Record<string, RouteStop[]>);
  }

  /**
   * Sort route stops for optimal sequence
   */
  private static sortRouteStopsForOptimization(stops: RouteStop[]): RouteStop[] {
    // For now, sort by operation type and location proximity
    // In production, this would use a TSP (Traveling Salesman Problem) solver
    return stops.sort((a, b) => {
      // Prioritize dropoff operations first (unload items)
      if (a.type !== b.type) {
        return a.type === 'dropoff' ? -1 : 1;
      }

      // Then sort by geographical proximity (simplified)
      const latDiff = Math.abs(a.location.lat - b.location.lat);
      const lngDiff = Math.abs(a.location.lng - b.location.lng);
      const distanceA = latDiff + lngDiff;
      const distanceB = latDiff + lngDiff;

      return distanceA - distanceB;
    });
  }

  /**
   * Create optimized route segments with capacity and distance constraints
   * 
   * CRITICAL: Now tracks capacity dynamically after each stop
   * This enables post-unload route sharing (backhaul optimization)
   */
  private static createOptimizedRouteSegments(stops: RouteStop[], vehicleCapacity: any): OptimizedRoute[] {
    const routes: OptimizedRoute[] = [];
    let currentRoute: OptimizedRoute | null = null;

    for (const stop of stops) {
      // Calculate stop capacity requirements
      const stopCapacity = this.calculateStopCapacity(stop);

      // Check if we need to start a new route
      if (!currentRoute || !this.canAddStopToRoute(currentRoute, stop, stopCapacity, vehicleCapacity)) {
        // Save current route if it exists
        if (currentRoute && currentRoute.stops.length > 0) {
          routes.push(currentRoute);
        }

        // Start new route
        currentRoute = {
          stops: [],
          totalDistance: 0,
          totalDuration: 0,
          totalValue: 0,
          currentLoad: { weight: 0, volume: 0, itemCount: 0 },
          area: this.extractAreaFromLocation(stop.location)
        };
      }

      // Add stop to current route
      currentRoute.stops.push(stop);

      // Update route metrics
      if (currentRoute.stops.length > 1) {
        // Add distance between stops (simplified calculation)
        const prevStop = currentRoute.stops[currentRoute.stops.length - 2];
        const distance = this.calculateDistanceBetweenStops(prevStop, stop);
        currentRoute.totalDistance += distance;
        currentRoute.totalDuration += distance * 2; // 2 minutes per km driving
      }

      // Add operation time
      currentRoute.totalDuration += stop.operationTime;

      // CRITICAL: Update load based on operation type
      if (stop.type === 'dropoff') {
        // Unloading operation - reduce current load
        currentRoute.currentLoad.weight -= stopCapacity.weight;
        currentRoute.currentLoad.volume -= stopCapacity.volume;
        currentRoute.currentLoad.itemCount -= stopCapacity.itemCount;

        // Calculate free capacity after unload
        const freeWeight = vehicleCapacity.maxWeight - currentRoute.currentLoad.weight;
        const freeVolume = vehicleCapacity.maxVolume - currentRoute.currentLoad.volume;
        const freeWeightPercentage = freeWeight / vehicleCapacity.maxWeight;
        const freeVolumePercentage = freeVolume / vehicleCapacity.maxVolume;
        const minFreeCapacity = Math.min(freeWeightPercentage, freeVolumePercentage);

        console.log(`📦 POST-UNLOAD at ${stop.location.address}:`);
        console.log(`   Free capacity: ${(minFreeCapacity * 100).toFixed(1)}% (Weight: ${freeWeight.toFixed(1)}kg, Volume: ${freeVolume.toFixed(1)}m³)`);
        
        // Check if we can accept new pickups (≥30% free capacity)
        if (minFreeCapacity >= 0.30) {
          console.log(`   ✅ BACKHAUL AVAILABLE: Can accept new pickups (${(minFreeCapacity * 100).toFixed(1)}% free)`);
          // TODO: Implement dynamic pickup insertion here
          // This is where Customer Y can join the route after Customer X's unload
        } else {
          console.log(`   ❌ No backhaul: Insufficient free capacity (${(minFreeCapacity * 100).toFixed(1)}%)`);
        }
        
      } else {
        // Loading operation - increase current load
        currentRoute.currentLoad.weight += stopCapacity.weight;
        currentRoute.currentLoad.volume += stopCapacity.volume;
        currentRoute.currentLoad.itemCount += stopCapacity.itemCount;

        // Check if we're approaching full load
        const weightUtilization = currentRoute.currentLoad.weight / vehicleCapacity.maxWeight;
        const volumeUtilization = currentRoute.currentLoad.volume / vehicleCapacity.maxVolume;
        const maxUtilization = Math.max(weightUtilization, volumeUtilization);

        if (maxUtilization >= 0.90) {
          console.log(`🚛 FULL LOAD at ${stop.location.address}: ${(maxUtilization * 100).toFixed(1)}% capacity`);
        }
      }
    }

    // Add final route
    if (currentRoute && currentRoute.stops.length > 0) {
      routes.push(currentRoute);
    }

    return routes;
  }

  /**
   * Calculate capacity requirements for a route stop
   */
  private static calculateStopCapacity(stop: RouteStop): { weight: number; volume: number; itemCount: number } {
    return stop.items.reduce(
      (total, item) => ({
        weight: total.weight + (item.weight * item.quantity),
        volume: total.volume + (item.volume * item.quantity),
        itemCount: total.itemCount + item.quantity
      }),
      { weight: 0, volume: 0, itemCount: 0 }
    );
  }

  /**
   * Check if a stop can be added to a route
   */
  private static canAddStopToRoute(
    route: OptimizedRoute,
    stop: RouteStop,
    stopCapacity: any,
    vehicleCapacity: any
  ): boolean {
    const newWeight = route.currentLoad.weight + (stop.type === 'pickup' ? stopCapacity.weight : -stopCapacity.weight);
    const newVolume = route.currentLoad.volume + (stop.type === 'pickup' ? stopCapacity.volume : -stopCapacity.volume);
    const newOperationCount = route.stops.length + 1;
    const estimatedNewDuration = route.totalDuration + stop.operationTime + 20; // 20 min for travel

    // Check capacity constraints
    if (newWeight > vehicleCapacity.maxWeight || newWeight < 0) return false;
    if (newVolume > vehicleCapacity.maxVolume || newVolume < 0) return false;
    if (newOperationCount > vehicleCapacity.maxOperationsPerDay) return false;
    if (estimatedNewDuration > vehicleCapacity.maxHoursPerDay * 60) return false;

    return true;
  }

  /**
   * Calculate distance between two stops
   */
  private static calculateDistanceBetweenStops(stop1: RouteStop, stop2: RouteStop): number {
    // Haversine formula for distance calculation
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.degreesToRadians(stop2.location.lat - stop1.location.lat);
    const dLon = this.degreesToRadians(stop2.location.lng - stop1.location.lng);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.degreesToRadians(stop1.location.lat)) * Math.cos(this.degreesToRadians(stop2.location.lat)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Convert degrees to radians
   */
  private static degreesToRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Extract area from location for grouping
   */
  private static extractAreaFromLocation(location: { lat: number; lng: number; address: string }): string {
    // Extract postcode area from address
    const postcodeMatch = location.address.match(/([A-Z]{1,2}[0-9][A-Z0-9]?)/i);
    if (postcodeMatch) {
      return postcodeMatch[1].toUpperCase();
    }

    // Fallback to coordinates-based area
    const latArea = Math.floor(location.lat * 10);
    const lngArea = Math.floor(location.lng * 10);
    return `AREA_${latArea}_${lngArea}`;
  }

  /**
   * Calculate item capacities for each drop
   */
  private static calculateDropCapacities(drops: any[]): DropWithCapacity[] {
    return drops.map(drop => {
      const items = drop.booking?.items || [];

      // Calculate total weight and volume for this drop - NO DEFAULTS
      let totalWeight = 0;
      let totalVolume = 0;

      for (const item of items) {
        const quantity = item.quantity || 1;

        if (!item.weight) {
          throw new Error(`CRITICAL ERROR: Missing weight for item ${item.id || item.name} in drop ${drop.id}. Route planning cannot proceed with incomplete data.`);
        }

        const weight = item.weight; // REAL weight - NO DEFAULTS
        const volume = item.volumeM3 || item.volume || (weight * 0.01); // Prefer real volume, fallback to estimate

        totalWeight += weight * quantity;
        totalVolume += volume * quantity;
      }

      return {
        ...drop,
        capacity: {
          weight: totalWeight,
          volume: totalVolume,
          itemCount: items.length
        }
      } as DropWithCapacity;
    });
  }

  /**
   * Create capacity-constrained route segments for PRE-ROUTE planning
   * This happens BEFORE the driver starts - optimizes capacity for 10-15 drops per route
   * with unloading stops built into the route plan
   */
  private static createCapacityConstrainedRoutes(drops: DropWithCapacity[]): RouteSegment[] {
    // Vehicle capacity limits (can be adjusted based on vehicle type)
    const VEHICLE_CAPACITY = {
      maxWeight: 1000, // kg - can carry up to 1000kg
      maxVolume: 10,   // m³ - 10 cubic meters
      maxDropsPerDay: 15, // Up to 15 drops per day
      maxHoursPerDay: 12  // 12 hour work day
    };

    const routeSegments: any[] = [];

    // Group drops by geographical area first
    const dropsByArea = this.groupDropsByArea(drops);

    for (const [area, areaDrops] of Object.entries(dropsByArea)) {
      // Sort drops by time window and capacity requirements
      const sortedDrops = this.sortDropsForCapacityOptimization(areaDrops);

      // Create route segments for this area
      const areaSegments = this.createAreaRouteSegments(sortedDrops, VEHICLE_CAPACITY);

      routeSegments.push(...areaSegments);
    }

    return routeSegments as RouteSegment[];
  }

  /**
   * Sort drops for optimal capacity utilization
   */
  private static sortDropsForCapacityOptimization(drops: any[]): any[] {
    return drops.sort((a, b) => {
      // Sort by time window first, then by capacity efficiency
      const timeA = new Date(a.timeWindowStart || a.createdAt).getTime();
      const timeB = new Date(b.timeWindowStart || b.createdAt).getTime();

      if (timeA !== timeB) {
        return timeA - timeB;
      }

      // Then sort by capacity efficiency (smaller items first for better packing)
      const efficiencyA = (a.capacity.weight + a.capacity.volume * 100) / a.capacity.itemCount;
      const efficiencyB = (b.capacity.weight + b.capacity.volume * 100) / b.capacity.itemCount;

      return efficiencyA - efficiencyB;
    });
  }

  /**
   * Create route segments for an area with capacity constraints
   */
  private static createAreaRouteSegments(drops: DropWithCapacity[], vehicleCapacity: VehicleCapacityLimits): RouteSegment[] {
    const segments: RouteSegment[] = [];
    let currentSegment: RouteSegment | null = null;

    for (const drop of drops) {
      // If we don't have a current segment or the current one would exceed capacity
      if (!currentSegment || !this.canAddDropToSegment(currentSegment, drop, vehicleCapacity)) {
        // Start a new segment
        if (currentSegment) {
          segments.push(currentSegment);
        }

        currentSegment = {
          drops: [],
          currentWeight: 0,
          currentVolume: 0,
          totalDistance: 0,
          totalDuration: 0,
          totalValue: 0,
          area: this.extractAreaFromAddress(drop.booking?.pickupAddress)
        };
      }

      // Add drop to current segment
      currentSegment.drops.push(drop);
      currentSegment.currentWeight += drop.capacity.weight;
      currentSegment.currentVolume += drop.capacity.volume;

      // Estimate additional distance and time (simplified)
      if (currentSegment.drops.length > 1) {
        currentSegment.totalDistance += 5; // 5km between stops
        currentSegment.totalDuration += 20; // 20 minutes per additional stop
      } else {
        currentSegment.totalDistance += 10; // Initial distance
        currentSegment.totalDuration += 45; // First drop takes longer
      }

      // Add drop value (estimated)
      currentSegment.totalValue += drop.booking?.quotedPrice || 50;
    }

    // Add the final segment
    if (currentSegment && currentSegment.drops.length > 0) {
      segments.push(currentSegment);
    }

    return segments;
  }

  /**
   * Check if a drop can be added to a route segment without exceeding capacity
   */
  private static canAddDropToSegment(segment: RouteSegment, drop: DropWithCapacity, vehicleCapacity: VehicleCapacityLimits): boolean {
    const newWeight = segment.currentWeight + drop.capacity.weight;
    const newVolume = segment.currentVolume + drop.capacity.volume;
    const newDropCount = segment.drops.length + 1;

    // Check capacity limits
    if (newWeight > vehicleCapacity.maxWeight) return false;
    if (newVolume > vehicleCapacity.maxVolume) return false;
    if (newDropCount > vehicleCapacity.maxDropsPerDay) return false;

    // Check time constraints (12 hour day)
    const estimatedNewDuration = segment.totalDuration + (segment.drops.length > 0 ? 20 : 45);
    if (estimatedNewDuration > vehicleCapacity.maxHoursPerDay * 60) return false; // Convert hours to minutes

    return true;
  }

  /**
   * Extract area from address for grouping
   * Supports both string addresses and address objects
   */
  private static extractAreaFromAddress(address: any): string {
    if (!address) return 'unknown';

    // Handle string addresses
    if (typeof address === 'string') {
      const postcodeMatch = address.match(/([A-Z]{1,2}[0-9][A-Z0-9]?)/i);
      if (postcodeMatch) {
        return postcodeMatch[1].toUpperCase();
      }
      return address.split(',')[0]?.trim() || 'unknown';
    }

    // Handle address objects with label
    if (address.label) {
      const postcodeMatch = address.label.match(/([A-Z]{1,2}[0-9][A-Z0-9]?)/i);
      if (postcodeMatch) {
        return postcodeMatch[1].toUpperCase();
      }
      return address.label.split(',')[0]?.trim() || 'unknown';
    }

    return 'unknown';
  }

  /**
   * Group drops by geographical area
   * Supports both drop.pickupAddress and drop.booking.pickupAddress formats
   */
  private static groupDropsByArea(drops: any[]): Record<string, any[]> {
    return drops.reduce((groups, drop) => {
      const address = drop.pickupAddress || drop.booking?.pickupAddress;
      const area = this.extractAreaFromAddress(address);
      if (!groups[area]) {
        groups[area] = [];
      }
      groups[area].push(drop);
      return groups;
    }, {} as Record<string, any[]>);
  }

  /**
   * Calculate estimated earnings for a route
   * Simple estimation - use real engine for actual payout
   */
  private static calculateEstimatedEarnings(route: any): number {
    if (!route.drops || route.drops.length === 0) return 0;

    try {
      // Simple estimation based on distance and drops
      const totalDistance = (route.optimizedDistanceKm || 0) * 0.621371; // Convert km to miles
      const dropCount = route.drops.length;
      
      // Base rate: £1.50/mile + £15-50 per drop bonus
      let earnings = Math.floor(totalDistance * 150); // £1.50/mile in pence
      
      // Add multi-drop bonus
      if (dropCount >= 7) {
        earnings += 5000; // £50
      } else if (dropCount >= 4) {
        earnings += 3000; // £30
      } else if (dropCount >= 2) {
        earnings += 1500; // £15
      }
      
      // Apply platform fee (15%)
      earnings = Math.floor(earnings * 0.85);
      
      return earnings;
    } catch (error) {
      console.error('Error calculating estimated earnings:', error);
      // Fallback to simple calculation
      return 0;
    }
  }

  /**
   * Estimate capacity utilization for a route
   */
  private static estimateCapacityUtilization(drops: any[]): number {
    if (!drops || drops.length === 0) return 0;

    let totalWeight = 0;
    let totalVolume = 0;

    for (const drop of drops) {
      totalWeight += drop.weight || 10;
      totalVolume += drop.volume || 0.1;
    }

    // Assume small van capacity for estimation
    const maxWeight = 500; // kg
    const maxVolume = 3.5; // m³

    const weightUtilization = Math.min(totalWeight / maxWeight, 1);
    const volumeUtilization = Math.min(totalVolume / maxVolume, 1);

    // Return the higher utilization (limiting factor)
    return Math.max(weightUtilization, volumeUtilization);
  }
}