import fs from 'fs';
import path from 'path';
import { PricingInput, PricingResult, MultiDropCalculation, createRequestId } from './schemas';
import { AdvancedMultiDropRouter, type MultiDropPricing, type OptimizedRoute } from '../routing/multi-drop-router';

// Export types for hooks
export type UnifiedPricingRequest = PricingInput;
export type UnifiedPricingResult = PricingResult;

// UK Dataset Item Interface
interface UKDatasetItem {
  id: string;
  name: string;
  category: string;
  filename: string;
  dimensions: string;
  weight: number;
  volume: string;
  workers_required: number;
  dismantling_required: string;
  dismantling_time_minutes: number;
  reassembly_time_minutes: number;
  luton_van_fit: boolean;
  van_capacity_estimate: number;
  load_priority: string;
  fragility_level: string;
  stackability: string;
  packaging_requirement: string;
  special_handling_notes: string;
  unload_difficulty: string;
  door_width_clearance_cm: number;
  staircase_compatibility: string;
  elevator_requirement: string;
  insurance_category: string;
  keywords: string[];
  price?: number; // Optional price field
}

// Enriched Item Interface (extends PricingInput item with catalog data)
interface EnrichedItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  weight?: number;
  volume?: number;
  fragile?: boolean;
  oversize?: boolean;
  disassemblyRequired?: boolean;
  specialHandling?: string[];
  catalogData: UKDatasetItem | null;
  basePrice: number;
  item_base_cost: number;
  labor_cost: number;
}

// Van Capacity Specifications (from operational insights)
interface VanSpecifications {
  maxVolumeM3: number; // 14-15 m³
  maxWeightKg: number; // Approximately 3500kg payload
  maxItems: number; // Practical limit for efficient loading
  loadingTimeMinutes: number; // Base loading time
  unloadingTimeMinutes: number; // Base unloading time per stop
}

interface ItemCatalog {
  version: string;
  items: UKDatasetItem[];
  metadata: {
    totalItems: number;
    categories: string[];
    lastUpdated: string;
  };
}

interface PricingConfig {
  version: string;
  vanSpecs: VanSpecifications;
  baseRates: {
    perKm: number; // £ per km
    perMinute: number; // £ per minute
    perKg: number; // £ per kg
    perM3: number; // £ per cubic meter
    baseFee: number; // Base job fee
    multiDropDiscount: number; // % discount per additional drop
  };
  serviceMultipliers: {
    economy: number;
    standard: number;
    premium: number;
  };
  surcharges: {
    stairs: number; // £ per flight
    parking: number; // £ for difficult parking
    congestion: number; // £ for congestion zones
    timeWindows: number; // £ for specific time requirements
  };
  laborRates: {
    workerPerHour: number; // £ per worker per hour
    dismantlingPerMinute: number; // £ per minute of dismantling
  };
}

export class UnifiedPricingEngine {
  private static instance: UnifiedPricingEngine;
  private itemCatalog: ItemCatalog | null = null;
  private pricingConfig: PricingConfig | null = null;
  private multiDropRouter: AdvancedMultiDropRouter | null = null;
  private readonly version = '2.0.0';

  private constructor() {}

  static getInstance(): UnifiedPricingEngine {
    if (!UnifiedPricingEngine.instance) {
      UnifiedPricingEngine.instance = new UnifiedPricingEngine();
    }
    return UnifiedPricingEngine.instance;
  }

  /**
   * Load data sources from UK Removal Dataset
   */
  private async loadDataSources(): Promise<void> {
    const repoRoot = this.findRepoRoot();

    try {
      // Load UK Removal Dataset
      const datasetPath = path.join(repoRoot, 'apps', 'web', 'public', 'UK_Removal_Dataset', 'items_dataset.json');
      if (fs.existsSync(datasetPath)) {
        const datasetData = fs.readFileSync(datasetPath, 'utf-8');
        const dataset = JSON.parse(datasetData);

        // Transform dataset to catalog format
        this.itemCatalog = {
          version: '2.0.0',
          items: dataset.items,
          metadata: {
            totalItems: dataset.items.length,
            categories: [...new Set((dataset.items as UKDatasetItem[]).map((item: UKDatasetItem) => item.category))],
            lastUpdated: dataset.metadata?.date || new Date().toISOString()
          }
        };

        this.logInfo('Loaded UK Removal Dataset', {
          version: this.itemCatalog!.version,
          totalItems: this.itemCatalog!.metadata.totalItems,
          categories: this.itemCatalog!.metadata.categories.length
        });
      } else {
        throw new Error(`UK Removal Dataset not found at ${datasetPath}`);
      }

      // Initialize pricing configuration with van specs and rates
      this.pricingConfig = this.createDefaultPricingConfig();
      this.logInfo('Initialized pricing configuration', {
        vanMaxVolume: this.pricingConfig.vanSpecs.maxVolumeM3,
        vanMaxWeight: this.pricingConfig.vanSpecs.maxWeightKg
      });

      // Initialize advanced multi-drop router with updated config
      this.multiDropRouter = new AdvancedMultiDropRouter(this.pricingConfig);
      this.logInfo('Initialized advanced multi-drop router');

    } catch (error) {
      this.logError('Failed to load data sources', { error: error instanceof Error ? error.message : String(error) });
      throw new Error(`Data source loading failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Create default pricing configuration based on operational insights
   */
  private createDefaultPricingConfig(): PricingConfig {
    return {
      version: '2.0.0',
      vanSpecs: {
        maxVolumeM3: 14.5, // Standard Luton van capacity
        maxWeightKg: 3500, // Approximate payload capacity
        maxItems: 150, // Practical limit for efficient operations
        loadingTimeMinutes: 60, // Base loading time for full van
        unloadingTimeMinutes: 45 // Base unloading time per stop
      },
      baseRates: {
        perKm: 0.625, // £0.625 per km (reduced by 4x)
        perMinute: 0.19, // £0.19 per minute (reduced by 4x)
        perKg: 0.0625, // £0.0625 per kg (reduced by 4x)
        perM3: 3.75, // £3.75 per cubic meter (reduced by 4x)
        baseFee: 37.50, // £37.50 base job fee (reduced by 4x)
        multiDropDiscount: 0.15 // 15% discount per additional drop
      },
      serviceMultipliers: {
        economy: 0.85,
        standard: 1.0,
        premium: 1.35
      },
      surcharges: {
        stairs: 15.00, // £15 per flight of stairs
        parking: 25.00, // £25 for difficult parking
        congestion: 20.00, // £20 for congestion zones
        timeWindows: 35.00 // £35 for specific time requirements
      },
      laborRates: {
        workerPerHour: 6.25, // £6.25 per worker per hour (reduced by 4x)
        dismantlingPerMinute: 0.125 // £0.125 per minute of dismantling (reduced by 4x)
      }
    };
  }

  /**
   * Find repository root by looking for package.json
   */
  private findRepoRoot(): string {
    let currentDir = process.cwd();
    
    // First, go up to find the repo root (contains turbo.json or pnpm-workspace.yaml)
    while (currentDir !== path.dirname(currentDir)) {
      if (fs.existsSync(path.join(currentDir, 'turbo.json')) || 
          fs.existsSync(path.join(currentDir, 'pnpm-workspace.yaml'))) {
        return currentDir;
      }
      currentDir = path.dirname(currentDir);
    }
    
    // Fallback: if not found, try from process.cwd() and go up until we find data/config folders
    currentDir = process.cwd();
    while (currentDir !== path.dirname(currentDir)) {
      if (fs.existsSync(path.join(currentDir, 'src', 'data', 'items', 'catalog.json'))) {
        return currentDir;
      }
      currentDir = path.dirname(currentDir);
    }
    
    throw new Error('Could not find repository root (no data sources found)');
  }

  /**
   * Main pricing calculation method
   */
  async calculatePrice(input: PricingInput): Promise<PricingResult> {
    const requestId = createRequestId();
    const calculatedAt = new Date().toISOString();

    this.logInfo('Starting pricing calculation', { requestId, inputHash: this.hashInput(input) });

    // Ensure data sources are loaded
    if (!this.itemCatalog || !this.pricingConfig) {
      await this.loadDataSources();
    }

    try {
      // 1. Validate and enrich items with UK dataset data
      const enrichedItems = this.enrichItems(input.items);

      // 2. Check van capacity constraints
      const capacityCheck = this.checkVanCapacity(enrichedItems);
      if (!capacityCheck.isValid) {
        this.logWarn('Capacity constraints detected', {
          warnings: capacityCheck.warnings.length,
          recommendations: capacityCheck.recommendations.length
        });
      }

      // 3. Calculate route and distances with capacity awareness
      const routeCalculation = this.calculateRoute(input.pickup, input.dropoffs, enrichedItems);

      // 4. Determine optimal vehicle and check capacity
      const vehicleRecommendation = this.recommendVehicle(enrichedItems, routeCalculation, capacityCheck);
      
      // 5. Calculate pricing components using UK dataset
      const baseFee = this.calculateBaseFee(input.dropoffs.length);
      const itemsFee = this.calculateItemsFee(enrichedItems);
      const laborFee = this.calculateLaborFee(enrichedItems);
      const distanceFee = this.calculateDistanceFee(routeCalculation.totalDistance, input.dropoffs.length); // DEPRECATED - internal use only
      const serviceFee = this.calculateServiceFee(input.serviceLevel);
      const vehicleFee = this.calculateVehicleFee(vehicleRecommendation);
      const propertyAccessFee = this.calculatePropertyAccessFee(input.pickup, input.dropoffs);
      const addOnsFee = this.calculateAddOnsFee(input.addOns, enrichedItems);
      
      // 5. Calculate surcharges
      const surcharges = this.calculateSurcharges(input, enrichedItems, routeCalculation);
      const totalSurcharges = surcharges.reduce((sum, s) => sum + s.amount, 0);
      
      // 6. Calculate discounts
      const discounts = this.calculateDiscounts(input, enrichedItems, routeCalculation);
      const totalDiscounts = discounts.reduce((sum, d) => sum + Math.abs(d.amount), 0);
      
      // 7. Apply service multiplier
      const serviceMultiplier = this.getServiceMultiplier(input.serviceLevel);
      const subtotalBeforeMultiplier = baseFee + itemsFee + distanceFee + serviceFee + vehicleFee + propertyAccessFee + addOnsFee + totalSurcharges;
      const subtotalAfterMultiplier = Math.round(subtotalBeforeMultiplier * serviceMultiplier);
      const subtotalAfterDiscounts = Math.max(0, subtotalAfterMultiplier - totalDiscounts);
      
      // 8. Calculate VAT
      const vatAmount = Math.round(subtotalAfterDiscounts * 0.2); // 20% VAT
      const amountGbpMinor = subtotalAfterDiscounts + vatAmount;

      // 9. Multi-drop calculation
      const multiDropDetails = this.calculateMultiDrop(input.dropoffs, enrichedItems);

      const result: PricingResult = {
        amountGbpMinor,
        subtotalBeforeVat: subtotalAfterDiscounts,
        vatAmount,
        vatRate: 0.2,
        
        breakdown: {
          baseFee,
          itemsFee,
          distanceFee,
          serviceFee,
          vehicleFee,
          propertyAccessFee,
          addOnsFee,
          surcharges: totalSurcharges,
          discounts: -totalDiscounts
        },

        surcharges,
        discounts,
        route: routeCalculation,
        recommendedVehicle: vehicleRecommendation,
        multiDrop: multiDropDetails,

        metadata: {
          requestId,
          calculatedAt,
          version: this.version,
          currency: 'GBP',
          dataSourceVersion: `${this.itemCatalog!.version}:${this.pricingConfig!.version}`,
          warnings: [
            ...capacityCheck.warnings,
            ...(routeCalculation.warnings || [])
          ],
          recommendations: [
            ...(routeCalculation.recommendations || []),
            ...this.generateRecommendations(input, enrichedItems, vehicleRecommendation)
          ],
        }
      };

      this.logInfo('Pricing calculation completed', { 
        requestId, 
        amountGbpMinor, 
        totalItems: enrichedItems.length,
        multiDrop: input.dropoffs.length > 1
      });

      return result;

    } catch (error) {
      this.logError('Pricing calculation failed', { requestId, error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  /**
   * Enrich items with full UK dataset data
   */
  private enrichItems(items: PricingInput['items']): EnrichedItem[] {
    return items.map(item => {
      // Find item in UK dataset
      const datasetItem = this.findDatasetItem(item.id, item.name);

      if (!datasetItem) {
        this.logWarn('Item not found in dataset', { itemId: item.id, itemName: item.name });
        return {
          id: item.id,
          name: item.name,
          category: item.category,
          quantity: item.quantity,
          weight: item.weight || 10,
          volume: item.volume || 0.1,
          fragile: item.fragile || false,
          oversize: item.oversize || false,
          disassemblyRequired: item.disassemblyRequired || false,
          specialHandling: item.specialHandling || [],
          catalogData: null,
          basePrice: 18.75,
          item_base_cost: 18.75, // Default item cost (reduced by 4x)
          labor_cost: 12.50 // Default labor cost (reduced by 4x)
        };
      }

      // Calculate labor costs based on dataset
      const laborCost = this.calculateLaborCost(datasetItem, item.quantity || 1);

      // Calculate item base cost based on weight, volume, and category
      const weightCost = (item.weight || datasetItem.weight) * this.pricingConfig!.baseRates.perKg;
      const volumeCost = (parseFloat(datasetItem.volume) || item.volume || 0.1) * this.pricingConfig!.baseRates.perM3;

      // Special handling for large/heavy items
      let categoryMultiplier = 1.0;
      if (datasetItem.category.toLowerCase().includes('special') ||
          datasetItem.category.toLowerCase().includes('musical') ||
          item.name.toLowerCase().includes('piano')) {
        categoryMultiplier = 3.0; // 3x multiplier for special items like pianos
      } else if (datasetItem.category.toLowerCase().includes('antiques') ||
                 datasetItem.category.toLowerCase().includes('gym')) {
        categoryMultiplier = 2.5; // 2.5x for valuable items
      } else if ((item.weight || datasetItem.weight) > 100) {
        categoryMultiplier = 2.0; // 2x for heavy items
      }

      const baseItemCost = Math.max(weightCost, volumeCost, 18.75) * categoryMultiplier; // Minimum £18.75 per item (reduced by 4x)

      return {
        id: item.id,
        name: item.name,
        category: item.category,
        quantity: item.quantity,
        weight: item.weight || datasetItem.weight,
        volume: parseFloat(datasetItem.volume) || item.volume || 0.1,
        fragile: item.fragile || false,
        oversize: item.oversize || false,
        disassemblyRequired: item.disassemblyRequired || false,
        specialHandling: item.specialHandling || [],
        catalogData: datasetItem,
        basePrice: datasetItem.price || baseItemCost,
        item_base_cost: baseItemCost,
        labor_cost: laborCost
      };
    });
  }

  /**
   * Calculate labor costs based on dataset specifications
   */
  private calculateLaborCost(datasetItem: UKDatasetItem, quantity: number): number {
    const config = this.pricingConfig!;

    // Base handling time per item (2-5 minutes as per operational insights)
    const baseHandlingMinutes = 3;

    // Add dismantling time if required
    const dismantlingMinutes = datasetItem.dismantling_required === 'Yes' ?
      datasetItem.dismantling_time_minutes + datasetItem.reassembly_time_minutes : 0;

    // Calculate total labor minutes for this item
    const totalLaborMinutes = (baseHandlingMinutes + dismantlingMinutes) * quantity;

    // Calculate labor cost (workers_required × time × hourly rate)
    const laborCostPerHour = config.laborRates.workerPerHour * datasetItem.workers_required;
    const laborCost = (laborCostPerHour / 60) * totalLaborMinutes;

    return laborCost;
  }

  /**
   * Find item in UK dataset by ID or name
   */
  private findDatasetItem(id?: string, name?: string): UKDatasetItem | null {
    if (!this.itemCatalog?.items) return null;

    // Search by ID first
    if (id) {
      const itemById = this.itemCatalog.items.find(item => item.id === id);
      if (itemById) return itemById;
    }

    // Search by name
    if (name) {
      const itemByName = this.itemCatalog.items.find(item =>
        item.name.toLowerCase() === name.toLowerCase()
      );
      if (itemByName) return itemByName;
    }

    return null;
  }

  /**
   * Check if items fit within van capacity constraints
   */
  private checkVanCapacity(enrichedItems: any[]): { isValid: boolean; warnings: string[]; recommendations: string[] } {
    const config = this.pricingConfig!;
    const vanSpecs = config.vanSpecs;

    let totalWeight = 0;
    let totalVolume = 0;
    let totalItems = 0;
    let oversizedItems: string[] = [];
    let overweightItems: string[] = [];

    // Calculate totals
    enrichedItems.forEach(item => {
      const quantity = item.quantity || 1;
      totalWeight += (item.weight || 0) * quantity;
      totalVolume += (item.volume || 0) * quantity;
      totalItems += quantity;

      // Check individual item constraints
      if (!item.luton_van_fit && quantity > 0) {
        oversizedItems.push(`${item.name} (${quantity}x)`);
      }
      if ((item.weight || 0) > 200 && quantity > 0) { // Items over 200kg may need special handling
        overweightItems.push(`${item.name} (${item.weight}kg x ${quantity})`);
      }
    });

    const warnings: string[] = [];
    const recommendations: string[] = [];

    // Check capacity limits
    if (totalWeight > vanSpecs.maxWeightKg) {
      warnings.push(`Total weight (${totalWeight.toFixed(1)}kg) exceeds van capacity (${vanSpecs.maxWeightKg}kg)`);
      recommendations.push('Consider splitting into multiple jobs or removing heavy items');
    }

    if (totalVolume > vanSpecs.maxVolumeM3) {
      warnings.push(`Total volume (${totalVolume.toFixed(1)}m³) exceeds van capacity (${vanSpecs.maxVolumeM3}m³)`);
      recommendations.push('Consider dismantling items or using additional van capacity');
    }

    if (totalItems > vanSpecs.maxItems) {
      warnings.push(`Total items (${totalItems}) exceeds practical limit (${vanSpecs.maxItems})`);
      recommendations.push('Consider consolidating similar items or splitting the job');
    }

    if (oversizedItems.length > 0) {
      warnings.push(`Oversized items detected: ${oversizedItems.join(', ')}`);
      recommendations.push('Oversized items may require special transport arrangements');
    }

    if (overweightItems.length > 0) {
      warnings.push(`Heavy items requiring special handling: ${overweightItems.join(', ')}`);
      recommendations.push('Heavy items may require additional workers or equipment');
    }

    // Calculate capacity utilization
    const weightUtilization = (totalWeight / vanSpecs.maxWeightKg) * 100;
    const volumeUtilization = (totalVolume / vanSpecs.maxVolumeM3) * 100;

    if (weightUtilization > 95) {
      warnings.push(`Very high weight utilization (${weightUtilization.toFixed(1)}%) - risk of overload`);
    }

    if (volumeUtilization > 95) {
      warnings.push(`Very high volume utilization (${volumeUtilization.toFixed(1)}%) - may be difficult to load`);
    }

    return {
      isValid: warnings.length === 0,
      warnings,
      recommendations
    };
  }

  /**
   * Calculate route for multi-drop deliveries
   */
  private calculateRoute(pickup: PricingInput['pickup'], dropoffs: PricingInput['dropoffs'], items?: any[]) {
    // Use advanced multi-drop router for capacity-aware routing
    if (this.multiDropRouter && dropoffs.length > 0) {
      try {
        // Convert to router format
        const pickupWaypoint = {
          address: pickup.address || '',
          postcode: pickup.postcode || '',
          coordinates: {
            lat: pickup.coordinates?.lat || 0,
            lng: pickup.coordinates?.lng || 0
          },
          propertyDetails: {
            type: 'house' as const,
            floors: 0,
            hasLift: true,
            hasParking: true,
            accessNotes: '',
            requiresPermit: false
          }
        };

        const dropoffWaypoints = dropoffs.map(dropoff => ({
          address: dropoff.address || '',
          postcode: dropoff.postcode || '',
          coordinates: {
            lat: dropoff.coordinates?.lat || 0,
            lng: dropoff.coordinates?.lng || 0
          },
          propertyDetails: {
            type: 'house' as const,
            floors: 0,
            hasLift: true,
            hasParking: true,
            accessNotes: '',
            requiresPermit: false
          }
        }));

        // Get optimized route with capacity awareness
        const optimizedRoute = this.multiDropRouter.optimizeRoute(
          pickupWaypoint,
          dropoffWaypoints,
          'luton_van',
          items
        );

        return {
          totalDistance: optimizedRoute.totalDistanceKm,
          totalDuration: optimizedRoute.totalDurationMinutes,
          legs: optimizedRoute.legs.map(leg => ({
            fromAddress: leg.from.address,
            toAddress: leg.to.address,
            distance: leg.distanceKm,
            duration: leg.durationMinutes
          })),
          optimization: optimizedRoute.optimization,
          warnings: optimizedRoute.warnings,
          recommendations: optimizedRoute.recommendations
        };

      } catch (error) {
        this.logError('Advanced routing failed, falling back to simple calculation', { error });
      }
    }

    // Fallback: Simple distance calculation
    let totalDistance = 0;
    let totalDuration = 0;
    const legs = [];

    let currentLocation = pickup.coordinates;

    for (const dropoff of dropoffs) {
      const distance = this.calculateDistanceBetweenPoints( // DEPRECATED - internal use only
        { lat: currentLocation?.lat || 0, lng: currentLocation?.lng || 0 },
        { lat: dropoff.coordinates?.lat || 0, lng: dropoff.coordinates?.lng || 0 }
      );
      const duration = distance * 2; // Rough estimate: 2 minutes per km

      legs.push({
        fromAddress: currentLocation === pickup.coordinates ? pickup.address : 'Previous stop',
        toAddress: dropoff.address,
        distance,
        duration
      });

      totalDistance += distance;
      totalDuration += duration;
      currentLocation = dropoff.coordinates;
    }

    return {
      totalDistance,
      totalDuration,
      legs
    };
  }

  /**
   * Calculate distance between two points (simplified)
   */
  private calculateDistanceBetweenPoints( // DEPRECATED - internal use only
    point1: { lat: number; lng: number },
    point2: { lat: number; lng: number }
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(point2.lat - point1.lat);
    const dLon = this.toRad(point2.lng - point1.lng);
    
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(this.toRad(point1.lat)) * Math.cos(this.toRad(point2.lat)) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Recommend optimal vehicle based on items and route
   */
  private recommendVehicle(items: any[], route: any, capacityCheck?: any) {
    const vanSpecs = this.pricingConfig!.vanSpecs;

    const totalWeight = items.reduce((sum, item) => sum + ((item.weight || 0) * (item.quantity || 1)), 0);
    const totalVolume = items.reduce((sum, item) => sum + ((item.volume || 0) * (item.quantity || 1)), 0);
    const totalItems = items.reduce((sum, item) => sum + (item.quantity || 1), 0);

    // Calculate capacity utilization
    const weightUtilization = (totalWeight / vanSpecs.maxWeightKg) * 100;
    const volumeUtilization = (totalVolume / vanSpecs.maxVolumeM3) * 100;
    const itemUtilization = (totalItems / vanSpecs.maxItems) * 100;

    let recommendation = {
      type: 'luton_van',
      name: 'Standard Luton Van',
      capacity: vanSpecs.maxVolumeM3,
      totalWeight,
      totalVolume,
      totalItems,
      weightUtilization: Math.round(weightUtilization),
      volumeUtilization: Math.round(volumeUtilization),
      itemUtilization: Math.round(itemUtilization),
      capacityIssue: false,
      recommendedUpgrades: [] as string[]
    };

    // Check for capacity issues
    if (capacityCheck && !capacityCheck.isValid) {
      recommendation.capacityIssue = true;

      // Recommend solutions based on issues
      if (totalWeight > vanSpecs.maxWeightKg) {
        recommendation.recommendedUpgrades.push('larger_vehicle');
        recommendation.type = 'large_van';
        recommendation.name = 'Large Van (7.5T)';
      }

      if (totalVolume > vanSpecs.maxVolumeM3) {
        recommendation.recommendedUpgrades.push('additional_vehicle');
      }

      if (totalItems > vanSpecs.maxItems) {
        recommendation.recommendedUpgrades.push('split_job');
      }
    }

    // Check for oversized items
    const hasOversizedItems = items.some(item => !item.luton_van_fit);
    if (hasOversizedItems) {
      recommendation.capacityIssue = true;
      recommendation.recommendedUpgrades.push('special_transport');
    }

    return recommendation;
  }

  /**
   * Calculate pricing components
   */
  private calculateBaseFee(dropCount: number = 1): number {
    const baseFee = this.pricingConfig!.baseRates.baseFee;

    // Multi-drop discount: reduce base fee for additional drops
    if (dropCount > 1) {
      const discount = Math.min(dropCount - 1, 3) * 0.15; // Max 45% discount for 4+ drops
      return Math.round(baseFee * (1 - discount) * 100); // Convert to pence
    }

    return Math.round(baseFee * 100); // Convert to pence
  }

  private calculateItemsFee(items: any[]): number {
    return items.reduce((sum, item) => {
      const quantity = item.quantity || 1;
      const itemBaseCost = item.item_base_cost || 0;
      return sum + Math.round(itemBaseCost * quantity * 100); // Convert to pence
    }, 0);
  }

  private calculateLaborFee(items: any[]): number {
    return items.reduce((sum, item) => {
      const quantity = item.quantity || 1;
      const laborCost = item.labor_cost || 0;
      return sum + Math.round(laborCost * quantity * 100); // Convert to pence
    }, 0);
  }

  private calculateDistanceFee(distance: number, dropCount: number = 1): number { // DEPRECATED - internal use only
    const baseDistanceFee = distance * this.pricingConfig!.baseRates.perKm;

    // Multi-drop efficiency: slight discount for optimized routes
    if (dropCount > 1) {
      const efficiencyDiscount = Math.min(dropCount - 1, 4) * 0.05; // Max 20% discount
      return Math.round(baseDistanceFee * (1 - efficiencyDiscount) * 100); // Convert to pence
    }

    return Math.round(baseDistanceFee * 100); // Convert to pence
  }

  private calculateServiceFee(serviceLevel: string): number {
    // Service multipliers are now in the config
    const multiplier = (this.pricingConfig!.serviceMultipliers as any)[serviceLevel] || 1.0;
    return Math.round(this.pricingConfig!.baseRates.baseFee * (multiplier - 1.0) * 100); // Convert to pence
  }

  private calculateVehicleFee(vehicle: any): number {
    // Vehicle fee is now included in base rates - additional fees for special vehicles
    if (vehicle.type === 'large_van') {
      return 7500; // £75 Additional fee for larger vehicles (in pence, reduced by 4x)
    } else if (vehicle.capacityIssue) {
      return 3750; // £37.50 Additional fee for capacity issues (in pence, reduced by 4x)
    }
    return 0; // Standard Luton van included in base fee
  }

  private calculatePropertyAccessFee(pickup: PricingInput['pickup'], dropoffs: PricingInput['dropoffs']): number {
    // Property access fees are now handled in calculateSurcharges
    // to ensure they appear in the surcharges array
    return 0;
  }

  private calculateAddOnsFee(addOns: PricingInput['addOns'], items: any[]): number {
    if (!addOns) return 0;
    
    let totalFee = 0;
    
    if (addOns.packing && addOns.packingVolume) {
      totalFee += addOns.packingVolume * 2.50; // £2.50 per m³ packing
    }

    if (addOns.disassembly?.length) {
      totalFee += addOns.disassembly.length * 15.00; // £15 per item disassembly
    }

    if (addOns.reassembly?.length) {
      totalFee += addOns.reassembly.length * 12.00; // £12 per item reassembly
    }

    if (addOns.insurance) {
      const insuranceRates: Record<string, number> = { 'basic': 50, 'standard': 100, 'premium': 200 };
      totalFee += insuranceRates[addOns.insurance] || 100;
      // Insurance is already included in the base rate above
    }
    
    return Math.round(totalFee * 100); // Convert to pence
  }

  /**
   * Calculate all surcharges
   */
  private calculateSurcharges(input: PricingInput, items: any[], route: any) {
    const surcharges = [];
    
    // Extra stops surcharge (multi-drop)
    if (input.dropoffs.length > 1) {
      const extraStops = input.dropoffs.length - 1;
      surcharges.push({
        category: 'extra_stops',
        amount: Math.round(extraStops * 6.25 * 100), // £6.25 per extra stop (in pence, reduced by 4x)
        reason: `${extraStops} additional stop(s)`
      });
    }
    
    // Fragile items
    const fragileItems = items.filter(item => item.fragile);
    if (fragileItems.length > 0) {
      surcharges.push({
        category: 'fragile',
        amount: Math.round(fragileItems.length * 2.00 * 100), // £2 per fragile item (in pence, reduced by 4x)
        reason: `${fragileItems.length} fragile item(s)`
      });
    }
    
    // Oversize items
    const oversizeItems = items.filter(item => item.oversize);
    if (oversizeItems.length > 0) {
      surcharges.push({
        category: 'oversize',
        amount: Math.round(oversizeItems.length * 3.75 * 100), // £3.75 per oversize item (in pence, reduced by 4x)
        reason: `${oversizeItems.length} oversize item(s)`
      });
    }

    // Property access surcharges (stairs)
    let totalStairsFee = 0;
    let totalFloors = 0;
    
    // Check pickup
    if (input.pickup.propertyDetails && !input.pickup.propertyDetails.hasLift && input.pickup.propertyDetails.floors > 0) {
      totalStairsFee += input.pickup.propertyDetails.floors * 0.875; // £0.875 per floor (reduced by 4x)
      totalFloors += input.pickup.propertyDetails.floors;
    }

    // Check dropoffs
    for (const dropoff of input.dropoffs) {
      if (dropoff.propertyDetails && !dropoff.propertyDetails.hasLift && dropoff.propertyDetails.floors > 0) {
        totalStairsFee += dropoff.propertyDetails.floors * 0.875; // £0.875 per floor (reduced by 4x)
        totalFloors += dropoff.propertyDetails.floors;
      }
    }

    if (totalStairsFee > 0) {
      surcharges.push({
        category: 'property_access',
        amount: Math.round(totalStairsFee * 100), // Convert to pence
        reason: `${totalFloors} floors without lift access`
      });
    }
    
    return surcharges;
  }

  /**
   * Calculate discounts
   */
  private calculateDiscounts(input: PricingInput, items: any[], route: any) {
    const discounts = [];
    
    // Volume discount
    const totalVolume = items.reduce((sum, item) => sum + (item.volume * item.quantity), 0);
    // Volume-based discounts
    if (totalVolume >= 50) {
      discounts.push({
        type: 'volume',
        amount: -Math.round(items.reduce((sum, item) => sum + item.basePrice * item.quantity, 0) * 0.05 * 100), // 5% discount (in pence)
        description: 'Large volume discount (50+ m³)'
      });
    } else if (totalVolume >= 20) {
      discounts.push({
        type: 'volume',
        amount: -Math.round(items.reduce((sum, item) => sum + item.basePrice * item.quantity, 0) * 0.03 * 100), // 3% discount (in pence)
        description: 'Volume discount (20+ m³)'
      });
    } else if (totalVolume >= 10) {
      discounts.push({
        type: 'volume',
        amount: -Math.round(items.reduce((sum, item) => sum + item.basePrice * item.quantity, 0) * 0.02 * 100), // 2% discount (in pence)
        description: 'Volume discount (10+ m³)'
      });
    }
    
    // Customer loyalty
    if (input.userContext?.isReturningCustomer) {
      const loyaltyDiscount = 0.05; // 5% discount for returning customers
      const totalItemsValue = items.reduce((sum, item) => sum + item.basePrice * item.quantity, 0);
      discounts.push({
        type: 'loyalty',
        amount: -Math.round(totalItemsValue * loyaltyDiscount * 100), // Convert to pence
        description: 'Returning customer discount'
      });
    }
    
    return discounts;
  }

  /**
   * Get service multiplier
   */
  private getServiceMultiplier(serviceLevel: string): number {
    const multipliers = this.pricingConfig!.serviceMultipliers;
    return multipliers?.[serviceLevel as keyof typeof multipliers] || 1.0;
  }

  /**
   * Get category multiplier
   */
  private getCategoryMultiplier(category: string): number {
    // Simple category multipliers - could be enhanced with catalog lookup
    const categoryMultipliers: Record<string, number> = {
      'furniture': 1.3,
      'appliances': 1.2,
      'electronics': 1.1,
      'books': 0.8,
      'clothing': 0.9,
      'default': 1.0
    };
    return categoryMultipliers[category] || categoryMultipliers.default;
  }

  /**
   * Calculate advanced multi-drop routing and pricing
   */
  private calculateMultiDrop(dropoffs: PricingInput['dropoffs'], enrichedItems: any[]): MultiDropPricing {
    // Ensure multi-drop router is available
    if (!this.multiDropRouter) {
      throw new Error('Multi-drop router not initialized');
    }

    // Single dropoff - use simple calculation
    if (dropoffs.length === 1) {
      return this.calculateSingleDropPricing(dropoffs[0], enrichedItems);
    }

    // Convert input format to router format
    const pickup = {
      address: 'Pickup Location', // This would come from input.pickup in full implementation
      postcode: '',
      coordinates: { lat: 51.5074, lng: -0.1278 }, // Default London coordinates
      propertyDetails: {
        type: 'house' as const,
        floors: 0,
        hasLift: false,
        hasParking: true,
        accessNotes: '',
        requiresPermit: false
      }
    };

    const routeDropoffs = dropoffs.map(dropoff => ({
      address: dropoff.address,
      postcode: dropoff.postcode || '',
      coordinates: dropoff.coordinates,
      propertyDetails: dropoff.propertyDetails
    }));

    // Optimize the route
    const optimizedRoute = this.multiDropRouter.optimizeRoute(pickup, routeDropoffs as any);
    
    // Calculate comprehensive pricing
    const multiDropPricing = this.multiDropRouter.calculateMultiDropPricing(optimizedRoute, enrichedItems);
    
    this.logInfo('Advanced multi-drop calculation completed', {
      totalStops: optimizedRoute.totalStops,
      totalDistance: optimizedRoute.totalDistanceKm,
      totalDuration: optimizedRoute.totalDurationMinutes,
      efficiencyScore: optimizedRoute.optimization.efficiencyScore,
      extraStops: multiDropPricing.perLegCharges.length - 1
    });

    return multiDropPricing;
  }

  /**
   * Calculate pricing for single dropoff
   */
  private calculateSingleDropPricing(dropoff: PricingInput['dropoffs'][0], items: any[]): MultiDropPricing {
    // Create a simple single-leg pricing structure
    const baseFee = this.pricingConfig!.baseRates.baseFee;
    const distanceFee = 15 * this.pricingConfig!.baseRates.perKm; // Assume 15km
    
    return {
      routeDetails: {
        legs: [],
        totalDistanceKm: 15,
        totalDurationMinutes: 45,
        totalStops: 2,
        optimization: {
          algorithm: 'direct-route',
          timeSavedMinutes: 0,
          distanceSavedKm: 0,
          efficiencyScore: 95
        },
        warnings: [],
        recommendations: []
      },
      perLegCharges: [{
        legIndex: 0,
        baseFee,
        distanceFee,
        timeFee: 0,
        difficultyFee: 0,
        propertyAccessFee: 0,
        surcharges: []
      }],
      totalStopSurcharge: 0,
      routeOptimizationDiscount: 0,
      capacityUtilization: {
        maximumLoad: 50,
        averageLoad: 50,
        emptyLegs: 0
      }
    };
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(input: PricingInput, items: any[], vehicle: any): string[] {
    const recommendations = [];
    
    if (vehicle.totalVolume > vehicle.capacity * 0.9) {
      recommendations.push('Consider splitting items across multiple trips for better efficiency');
    }
    
    if (input.serviceLevel === 'standard' && items.some(item => item.fragile)) {
      recommendations.push('Consider premium service for fragile items');
    }
    
    if (input.dropoffs.length > 2) {
      recommendations.push('Route optimization applied for multiple stops');
    }
    
    return recommendations;
  }

  /**
   * Utility methods for logging
   */
  private hashInput(input: PricingInput): string {
    return Buffer.from(JSON.stringify(input)).toString('base64').substring(0, 8);
  }

  private logInfo(message: string, data?: any) {
    console.log(`[PRICING ENGINE] ${message}`, data || '');
  }

  private logWarn(message: string, data?: any) {
    console.warn(`[PRICING ENGINE WARNING] ${message}`, data || '');
  }

  private logError(message: string, data?: any) {
    console.error(`[PRICING ENGINE ERROR] ${message}`, data || '');
  }

  // Alias for backward compatibility
  async calculatePricing(input: PricingInput): Promise<PricingResult> {
    return this.calculatePrice(input);
  }
}

// Export singleton instance
export const unifiedPricingEngine = UnifiedPricingEngine.getInstance();