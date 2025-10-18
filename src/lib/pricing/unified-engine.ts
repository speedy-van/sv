import * as fs from 'fs';
import * as path from 'path';
import { PricingInput, PricingResult, MultiDropCalculation, createRequestId } from './schemas';

interface ItemCatalog {
  version: string;
  catalog: Record<string, Record<string, any>>;
  categories: Record<string, any>;
  metadata: any;
}

interface PricingConfig {
  version: string;
  config: {
    currency: string;
    pricesInPence: boolean;
    vatRate: number;
    baseRates: Record<string, number>;
    serviceTypes: Record<string, any>;
    vehicleTypes: Record<string, any>;
    surcharges: Record<string, any>;
    multipliers: Record<string, any>;
    discounts: Record<string, any>;
  };
  routing: any;
  limits: any;
}

export class UnifiedPricingEngine {
  private static instance: UnifiedPricingEngine;
  private itemCatalog: ItemCatalog | null = null;
  private pricingConfig: PricingConfig | null = null;
  private readonly version = '2.0.0';

  private constructor() {}

  static getInstance(): UnifiedPricingEngine {
    if (!UnifiedPricingEngine.instance) {
      UnifiedPricingEngine.instance = new UnifiedPricingEngine();
    }
    return UnifiedPricingEngine.instance;
  }

  /**
   * Load data sources from repository root
   */
  private async loadDataSources(): Promise<void> {
    const repoRoot = this.findRepoRoot();
    
    try {
      // Load item catalog
      const catalogPath = path.join(repoRoot, 'src', 'data', 'items', 'catalog.json');
      if (fs.existsSync(catalogPath)) {
        const catalogData = fs.readFileSync(catalogPath, 'utf-8');
        this.itemCatalog = JSON.parse(catalogData);
        this.logInfo('Loaded item catalog', { 
          version: this.itemCatalog?.version, 
          totalItems: this.itemCatalog?.metadata?.totalItems 
        });
      } else {
        throw new Error(`Item catalog not found at ${catalogPath}`);
      }

      // Load pricing config
      const configPath = path.join(repoRoot, 'src', 'config', 'pricing.json');
      if (fs.existsSync(configPath)) {
        const configData = fs.readFileSync(configPath, 'utf-8');
        this.pricingConfig = JSON.parse(configData);
        this.logInfo('Loaded pricing config', { 
          version: this.pricingConfig?.version,
          currency: this.pricingConfig?.config?.currency 
        });
      } else {
        throw new Error(`Pricing config not found at ${configPath}`);
      }

    } catch (error) {
      this.logError('Failed to load data sources', { error: error instanceof Error ? error.message : String(error) });
      throw new Error(`Data source loading failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Find repository root by looking for package.json
   */
  private findRepoRoot(): string {
    let currentDir = process.cwd();
    
    while (currentDir !== path.dirname(currentDir)) {
      if (fs.existsSync(path.join(currentDir, 'package.json'))) {
        return currentDir;
      }
      currentDir = path.dirname(currentDir);
    }
    
    throw new Error('Could not find repository root (no package.json found)');
  }

  /**
   * Main pricing calculation method with three-tier pricing and multi-drop logic
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
      // 1. Validate and enrich items
      const enrichedItems = this.enrichItems(input.items);

      // 2. Check multi-drop availability and capacity constraints
      const multiDropCheck = await this.checkMultiDropAvailability(input);

      // 3. Calculate route and distances
      const routeCalculation = this.calculateRoute(input.pickup, input.dropoffs);

      // 4. Determine optimal vehicle
      const vehicleRecommendation = this.recommendVehicle(enrichedItems, routeCalculation);

      // 5. Calculate base pricing components
      const baseFee = this.calculateBaseFee();
      const itemsFee = this.calculateItemsFee(enrichedItems);
      const distanceFee = this.calculateDistanceFee(routeCalculation.totalDistance);
      const serviceFee = this.calculateServiceFee(input.serviceLevel);
      const vehicleFee = this.calculateVehicleFee(vehicleRecommendation);
      const propertyAccessFee = this.calculatePropertyAccessFee(input.pickup, input.dropoffs);
      const addOnsFee = this.calculateAddOnsFee(input.addOns, enrichedItems);

      // 6. Calculate surcharges
      const surcharges = this.calculateSurcharges(input, enrichedItems, routeCalculation, multiDropCheck);
      const totalSurcharges = surcharges.reduce((sum, s) => sum + s.amount, 0);

      // 7. Calculate discounts
      const discounts = this.calculateDiscounts(input, enrichedItems, routeCalculation, multiDropCheck);
      const totalDiscounts = discounts.reduce((sum, d) => sum + Math.abs(d.amount), 0);

      // 8. Apply service level pricing (three-tier logic)
      const threeTierPricing = this.applyThreeTierPricing(
        baseFee + itemsFee + distanceFee + serviceFee + vehicleFee + propertyAccessFee + addOnsFee,
        input.serviceLevel,
        multiDropCheck,
        totalSurcharges,
        totalDiscounts
      );

      // 9. Calculate VAT
      const vatAmount = Math.round(threeTierPricing.finalAmount * this.pricingConfig!.config.vatRate);
      const amountGbpMinor = threeTierPricing.finalAmount + vatAmount;

      // 10. Multi-drop calculation with route details
      const multiDropDetails = this.calculateMultiDrop(input.dropoffs, routeCalculation, multiDropCheck);

      const result: PricingResult = {
        amountGbpMinor,
        subtotalBeforeVat: threeTierPricing.finalAmount,
        vatAmount,
        vatRate: this.pricingConfig!.config.vatRate,

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

        metadata: {
          requestId,
          calculatedAt,
          version: this.version,
          currency: 'GBP',
          dataSourceVersion: `${this.itemCatalog!.version}:${this.pricingConfig!.version}`,
          warnings: threeTierPricing.warnings,
          recommendations: this.generateRecommendations(input, enrichedItems, vehicleRecommendation, multiDropCheck)
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
   * Enrich items with catalog data
   */
  private enrichItems(items: PricingInput['items']) {
    return items.map(item => {
      // Find item in catalog
      const catalogItem = this.findCatalogItem(item.id, item.name);
      
      return {
        ...item,
        catalogData: catalogItem,
        basePrice: catalogItem?.basePrice || 0,
        weight: item.weight || catalogItem?.weight || 0,
        volume: item.volume || catalogItem?.volume || 0,
        estimatedTime: catalogItem?.estimatedTime || 0.25,
        fragile: item.fragile || catalogItem?.fragile || false,
        oversize: item.oversize || catalogItem?.oversize || false
      };
    });
  }

  /**
   * Find item in catalog by ID or name
   */
  private findCatalogItem(id?: string, name?: string) {
    if (!this.itemCatalog) return null;
    
    for (const categoryItems of Object.values(this.itemCatalog.catalog)) {
      for (const item of Object.values(categoryItems)) {
        if (item.id === id || item.name === name) {
          return item;
        }
      }
    }
    return null;
  }

  /**
   * Calculate route for multi-drop deliveries
   */
  private calculateRoute(pickup: PricingInput['pickup'], dropoffs: PricingInput['dropoffs']) {
    // Simple distance calculation - in production would use Mapbox/Google
    let totalDistance = 0;
    let totalDuration = 0;
    const legs = [];

    let currentLocation = pickup.coordinates;
    
    for (const dropoff of dropoffs) {
      const distance = this.calculateDistanceBetweenPoints(currentLocation, {
        lat: dropoff.coordinates.lat || 0,
        lng: dropoff.coordinates.lng || 0
      });
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
   * @deprecated Internal use only - DEPRECATED for external use
   */
  private calculateDistanceBetweenPoints(
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
  private recommendVehicle(items: any[], route: any) {
    const totalWeight = items.reduce((sum, item) => sum + (item.weight * item.quantity), 0);
    const totalVolume = items.reduce((sum, item) => sum + (item.volume * item.quantity), 0);
    
    const vehicleTypes = this.pricingConfig!.config.vehicleTypes;
    
    // Find smallest vehicle that can handle the load
    for (const [type, specs] of Object.entries(vehicleTypes)) {
      if (specs.maxWeight >= totalWeight && specs.maxVolume >= totalVolume) {
        return {
          type,
          name: specs.name,
          capacity: specs.capacity,
          totalWeight,
          totalVolume
        };
      }
    }
    
    // Default to largest vehicle if nothing fits
    return {
      type: '7.5-tonne',
      name: '7.5 Tonne Truck',
      capacity: 50,
      totalWeight,
      totalVolume
    };
  }

  /**
   * Calculate pricing components
   */
  private calculateBaseFee(): number {
    return this.pricingConfig!.config.baseRates.baseFeeGBP;
  }

  private calculateItemsFee(items: any[]): number {
    return items.reduce((sum, item) => {
      const itemPrice = item.basePrice * item.quantity;
      const categoryMultiplier = this.getCategoryMultiplier(item.category);
      return sum + Math.round(itemPrice * categoryMultiplier);
    }, 0);
  }

  // DEPRECATED for external use - internal pricing calculation only
  private calculateDistanceFee(distance: number): number {
    return Math.round(distance * this.pricingConfig!.config.baseRates.perKmGBP);
  }

  private calculateServiceFee(serviceLevel: string): number {
    const serviceConfig = this.pricingConfig!.config.serviceTypes[serviceLevel];
    return serviceConfig ? 500 : 0; // Base service fee
  }

  private calculateVehicleFee(vehicle: any): number {
    const vehicleConfig = this.pricingConfig!.config.vehicleTypes[vehicle.type];
    const baseVehicleFee = 1000;
    return vehicleConfig ? Math.round(baseVehicleFee * vehicleConfig.multiplier) : baseVehicleFee;
  }

  private calculatePropertyAccessFee(pickup: PricingInput['pickup'], dropoffs: PricingInput['dropoffs']): number {
    let totalFee = 0;
    
    // Pickup property access
    if (!pickup.propertyDetails.hasLift && pickup.propertyDetails.floors > 0) {
      totalFee += pickup.propertyDetails.floors * this.pricingConfig!.config.surcharges.stairs.perFloor;
    }
    
    // Dropoff properties access
    for (const dropoff of dropoffs) {
      if (!dropoff.propertyDetails.hasLift && dropoff.propertyDetails.floors > 0) {
        totalFee += dropoff.propertyDetails.floors * this.pricingConfig!.config.surcharges.stairs.perFloor;
      }
    }
    
    return totalFee;
  }

  private calculateAddOnsFee(addOns: PricingInput['addOns'], items: any[]): number {
    if (!addOns) return 0;
    
    let totalFee = 0;
    
    if (addOns.packing && addOns.packingVolume) {
      totalFee += addOns.packingVolume * this.pricingConfig!.config.surcharges.packing.perM3;
    }
    
    if (addOns.disassembly?.length) {
      totalFee += addOns.disassembly.length * this.pricingConfig!.config.surcharges.disassembly.perItem;
    }
    
    if (addOns.reassembly?.length) {
      totalFee += addOns.reassembly.length * this.pricingConfig!.config.surcharges.reassembly.perItem;
    }
    
    if (addOns.insurance) {
      const insuranceConfig = this.pricingConfig!.config.surcharges.insurance[addOns.insurance];
      const totalItemValue = items.reduce((sum, item) => sum + (item.basePrice * item.quantity), 0);
      totalFee += Math.round(totalItemValue * insuranceConfig.rate);
    }
    
    return totalFee;
  }



  /**
   * Get service multiplier
   */
  private getServiceMultiplier(serviceLevel: string): number {
    const serviceConfig = this.pricingConfig!.config.serviceTypes[serviceLevel];
    return serviceConfig?.multiplier || 1.0;
  }

  /**
   * Get category multiplier
   */
  private getCategoryMultiplier(category: string): number {
    const categoryConfig = this.itemCatalog!.categories[category];
    return categoryConfig?.multiplier || 1.0;
  }



  /**
   * Check multi-drop availability and capacity constraints
   */
  private async checkMultiDropAvailability(input: PricingInput): Promise<{
    canUseMultiDrop: boolean;
    availableRoutes: any[];
    capacityWarnings: string[];
    nextAvailableDate?: string;
  }> {
    const totalVolume = input.items.reduce((sum, item) => sum + (item.volume * item.quantity), 0);
    const totalWeight = input.items.reduce((sum, item) => sum + (item.weight * item.quantity), 0);

    // Check van-fit capacity for economy (multi-drop)
    const VAN_FIT_VOLUME = 15; // m³
    const VAN_FIT_WEIGHT = 1000; // kg

    const canUseMultiDrop = totalVolume <= VAN_FIT_VOLUME && totalWeight <= VAN_FIT_WEIGHT;
    const capacityWarnings: string[] = [];

    if (!canUseMultiDrop) {
      capacityWarnings.push('Booking exceeds van-fit capacity for economy multi-drop pricing');
    }

    // Check if economy is available for scheduled date
    let availableRoutes: any[] = [];
    let nextAvailableDate: string | undefined;

    if (input.scheduledDate && canUseMultiDrop) {
      const scheduledDateObj = new Date(input.scheduledDate);
      const maxDate = new Date();
      maxDate.setDate(maxDate.getDate() + 7);

      if (scheduledDateObj <= maxDate) {
        // For now, return empty routes - database routing can be added later
        availableRoutes = [];
      } else {
        // Find next available date within 7 days (simplified logic)
        const nextAvailableDateObj = new Date();
        nextAvailableDateObj.setDate(nextAvailableDateObj.getDate() + 1);

        // Skip weekends for simplicity
        while (nextAvailableDateObj.getDay() === 0 || nextAvailableDateObj.getDay() === 6) {
          nextAvailableDateObj.setDate(nextAvailableDateObj.getDate() + 1);
        }

        nextAvailableDate = nextAvailableDateObj.toISOString();
        if (!nextAvailableDate) {
          capacityWarnings.push('No economy slots available within 7 days');
        }
      }
    }

    return {
      canUseMultiDrop,
      availableRoutes,
      capacityWarnings,
      nextAvailableDate
    };
  }

  /**
   * Apply three-tier pricing logic
   */
  private applyThreeTierPricing(
    baseAmount: number,
    serviceLevel: string,
    multiDropCheck: any,
    surcharges: number,
    discounts: number
  ): {
    finalAmount: number;
    tier: 'economy' | 'standard' | 'priority';
    warnings: string[];
  } {
    const warnings: string[] = [];

    let finalAmount = baseAmount + surcharges - discounts;
    let tier: 'economy' | 'standard' | 'priority' = 'standard';

    switch (serviceLevel) {
      case 'standard':
        if (multiDropCheck.canUseMultiDrop && multiDropCheck.availableRoutes.length > 0) {
          // Apply economy discount (15%)
          finalAmount = Math.round(finalAmount * 0.85);
          tier = 'economy';
        } else {
          // Standard pricing
          tier = 'standard';
          if (multiDropCheck.capacityWarnings.length > 0) {
            warnings.push(...multiDropCheck.capacityWarnings);
          }
        }
        break;

      case 'premium':
        // Standard direct van pricing
        tier = 'standard';
        break;

      case 'white-glove':
      case 'signature':
        // Priority/premium pricing (50% premium)
        finalAmount = Math.round(finalAmount * 1.5);
        tier = 'priority';
        break;

      default:
        tier = 'standard';
    }

    return { finalAmount, tier, warnings };
  }

  /**
   * Calculate surcharges with multi-drop considerations
   */
  private calculateSurcharges(input: PricingInput, items: any[], route: any, multiDropCheck: any) {
    const surcharges = [];

    // Extra stops surcharge (multi-drop)
    if (input.dropoffs.length > 1) {
      const extraStops = input.dropoffs.length - 1;
      surcharges.push({
        category: 'extra_stops',
        amount: extraStops * this.pricingConfig!.config.surcharges.extraStop.perStop,
        reason: `${extraStops} additional stop(s)`
      });
    }

    // Fragile items
    const fragileItems = items.filter(item => item.fragile);
    if (fragileItems.length > 0) {
      surcharges.push({
        category: 'fragile',
        amount: fragileItems.length * this.pricingConfig!.config.surcharges.fragileItem.fee,
        reason: `${fragileItems.length} fragile item(s)`
      });
    }

    // Oversize items
    const oversizeItems = items.filter(item => item.oversize);
    if (oversizeItems.length > 0) {
      surcharges.push({
        category: 'oversize',
        amount: oversizeItems.length * this.pricingConfig!.config.surcharges.oversizeItem.fee,
        reason: `${oversizeItems.length} oversize item(s)`
      });
    }

    return surcharges;
  }

  /**
   * Calculate discounts with multi-drop logic
   */
  private calculateDiscounts(input: PricingInput, items: any[], route: any, multiDropCheck: any) {
    const discounts = [];

    // Volume discount
    const totalVolume = items.reduce((sum, item) => sum + (item.volume * item.quantity), 0);
    const volumeDiscounts = this.pricingConfig!.config.discounts.volumeDiscount;

    if (totalVolume >= 50) {
      discounts.push({
        type: 'volume',
        amount: -Math.round(items.reduce((sum, item) => sum + item.basePrice * item.quantity, 0) * volumeDiscounts.threshold50M3),
        description: 'Large volume discount (50+ m³)'
      });
    } else if (totalVolume >= 20) {
      discounts.push({
        type: 'volume',
        amount: -Math.round(items.reduce((sum, item) => sum + item.basePrice * item.quantity, 0) * volumeDiscounts.threshold20M3),
        description: 'Volume discount (20+ m³)'
      });
    } else if (totalVolume >= 10) {
      discounts.push({
        type: 'volume',
        amount: -Math.round(items.reduce((sum, item) => sum + item.basePrice * item.quantity, 0) * volumeDiscounts.threshold10M3),
        description: 'Volume discount (10+ m³)'
      });
    }

    // Customer loyalty
    if (input.userContext?.isReturningCustomer) {
      const loyaltyDiscount = this.pricingConfig!.config.discounts.loyaltyDiscount.returning;
      const totalItemsValue = items.reduce((sum, item) => sum + item.basePrice * item.quantity, 0);
      discounts.push({
        type: 'loyalty',
        amount: -Math.round(totalItemsValue * loyaltyDiscount),
        description: 'Returning customer discount'
      });
    }

    return discounts;
  }

  /**
   * Calculate multi-drop details with route information
   */
  private calculateMultiDrop(dropoffs: PricingInput['dropoffs'], route: any, multiDropCheck: any) {
    return {
      totalStops: dropoffs.length,
      extraStops: Math.max(0, dropoffs.length - 1),
      routeOptimized: multiDropCheck.availableRoutes.length > 0,
      capacityFit: multiDropCheck.canUseMultiDrop,
      nextAvailableDate: multiDropCheck.nextAvailableDate,
      stopSurcharges: dropoffs.map((dropoff, index) => ({
        stopIndex: index,
        address: dropoff.address,
        surcharge: index > 0 ? this.pricingConfig!.config.surcharges.extraStop.perStop : 0,
        reason: index > 0 ? 'Additional stop' : 'Primary destination'
      }))
    };
  }

  /**
   * Generate recommendations with multi-drop context
   */
  private generateRecommendations(input: PricingInput, items: any[], vehicle: any, multiDropCheck: any): string[] {
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

    if (!multiDropCheck.canUseMultiDrop) {
      recommendations.push('Booking exceeds economy capacity - consider standard or priority service');
    }

    if (multiDropCheck.nextAvailableDate && input.serviceLevel === 'standard') {
      recommendations.push(`Next economy slot available: ${new Date(multiDropCheck.nextAvailableDate).toLocaleDateString()}`);
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

  private logError(message: string, data?: any) {
    console.error(`[PRICING ENGINE ERROR] ${message}`, data || '');
  }
}

// Export singleton instance
export const unifiedPricingEngine = UnifiedPricingEngine.getInstance();