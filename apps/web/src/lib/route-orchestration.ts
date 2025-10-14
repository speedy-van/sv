/**
 * Route Orchestration Rules Service
 * 
 * Step 3: Define geographic clustering, capacity limits, and time window validation
 * Implements business rules with guardrails for safe Multi-Drop Route creation
 */

import { z } from 'zod';

// Types for route orchestration
interface Drop {
  id: string;
  bookingId?: string;
  pickupLocation: {
    latitude: number;
    longitude: number;
    address: string;
  };
  deliveryLocation: {
    latitude: number;
    longitude: number;
    address: string;
  };
  timeWindow: {
    earliest: Date;
    latest: Date;
  };
  weight: number; // kg
  volume: number; // cubic meters
  serviceTier: 'economy' | 'standard' | 'premium';
  priority: number; // 1-10, higher = more priority
  estimatedDuration: number; // minutes
  value: number; // monetary value
  status: 'pending' | 'assigned_to_route' | 'picked_up' | 'in_transit' | 'delivered';
}

interface RouteOrchestrationConfig {
  // Geographic clustering rules
  maxClusterRadius: number; // miles (converted to meters internally)
  minDropsPerCluster: number;
  maxDropsPerCluster: number;
  
  // Capacity constraints
  maxRouteWeight: number; // kg
  maxRouteVolume: number; // cubic meters
  maxRouteDuration: number; // minutes
  maxDropsPerRoute: number;
  
  // Time window validation
  maxTimeWindowSpread: number; // minutes
  bufferTimePerDrop: number; // minutes
  maxRouteStartDelay: number; // minutes
  
  // Service tier constraints
  allowMixedTiers: boolean;
  priorityWeighting: number; // 0-1
  
  // Driver constraints
  maxDrivingDistance: number; // km
  maxWorkingHours: number; // hours
  breakRequirements: {
    minBreakAfterHours: number;
    breakDurationMinutes: number;
  };
  
  // Business rules
  minRouteValue: number; // minimum monetary value per route
  maxDeviationFromOptimal: number; // percentage
  emergencyOverrideAllowed: boolean;
}

// Default orchestration configuration - using miles for UK standards
const DEFAULT_CONFIG: RouteOrchestrationConfig = {
  maxClusterRadius: 125, // 125 miles (maximum coverage) - will be converted to meters
  minDropsPerCluster: 2,
  maxDropsPerCluster: 8,
  
  maxRouteWeight: 500, // kg
  maxRouteVolume: 10, // cubic meters
  maxRouteDuration: 480, // 8 hours
  maxDropsPerRoute: 12,
  
  maxTimeWindowSpread: 240, // 4 hours
  bufferTimePerDrop: 15, // 15 minutes
  maxRouteStartDelay: 30, // 30 minutes
  
  allowMixedTiers: false,
  priorityWeighting: 0.3,
  
  maxDrivingDistance: 200, // km
  maxWorkingHours: 10,
  breakRequirements: {
    minBreakAfterHours: 6,
    breakDurationMinutes: 30
  },
  
  minRouteValue: 100, // $100 minimum
  maxDeviationFromOptimal: 15, // 15%
  emergencyOverrideAllowed: true
};

class RouteOrchestrationEngine {
  private config: RouteOrchestrationConfig;
  private radiusCache: Map<string, number> = new Map();
  private performanceMetrics: {
    totalRoutesCalculated: number;
    averageCalculationTime: number;
    cacheHitRate: number;
  } = {
    totalRoutesCalculated: 0,
    averageCalculationTime: 0,
    cacheHitRate: 0
  };

  constructor(config: Partial<RouteOrchestrationConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Get smart configuration based on drop volume (all in miles) with caching
   */
  private getSmartConfig(dropCount: number): RouteOrchestrationConfig {
    const cacheKey = `config_${dropCount}`;
    const cached = this.radiusCache.get(cacheKey);

    if (cached) {
      this.performanceMetrics.cacheHitRate += 1;
      return { ...this.config, maxClusterRadius: cached };
    }

    const baseConfig = { ...this.config };

    // Smart clustering radius based on volume (in miles)
    if (dropCount > 50) {
      baseConfig.maxClusterRadius = 25; // 25 miles - busy periods
    } else if (dropCount > 20) {
      baseConfig.maxClusterRadius = 50; // 50 miles - moderate busy
    } else if (dropCount > 10) {
      baseConfig.maxClusterRadius = 75; // 75 miles - normal periods
    } else if (dropCount > 5) {
      baseConfig.maxClusterRadius = 100; // 100 miles - quiet periods
    } else {
      baseConfig.maxClusterRadius = 125; // 125 miles - very quiet periods
    }

    // Cache the result
    this.radiusCache.set(cacheKey, baseConfig.maxClusterRadius);

    console.log(`🎯 Smart config: ${dropCount} drops → ${baseConfig.maxClusterRadius} miles radius`);
    return baseConfig;
  }

  /**
   * Main orchestration method: Create optimized routes from drops
   */
  async orchestrateRoutes(
    drops: Drop[],
    options: {
      emergencyMode?: boolean;
      preferredStartTime?: Date;
      availableDrivers?: number;
      geofenceConstraints?: { lat: number; lng: number; radius: number }[];
    } = {}
  ): Promise<{
    routes: RouteProposal[];
    unassigned: Drop[];
    warnings: string[];
    metrics: RouteMetrics;
  }> {
    const startTime = Date.now();
    console.log(`🎯 Orchestrating routes for ${drops.length} drops...`);

    // Use smart configuration based on drop volume
    const smartConfig = this.getSmartConfig(drops.length);

    try {
      // Step 1: Validate drops
      const validDrops = this.validateDrops(drops);
      
      // Step 2: Geographic clustering with smart radius
      const clusters = await this.createGeographicClusters(validDrops, options.geofenceConstraints, smartConfig);
      
      // Step 3: Time window optimization
      const timeOptimizedClusters = this.optimizeTimeWindows(clusters);
      
      // Step 4: Capacity validation
      const feasibleClusters = this.validateCapacityConstraints(timeOptimizedClusters);
      
      // Step 5: Route proposal generation
      const routes = this.generateRouteProposals(feasibleClusters, options);
      
      // Step 6: Quality validation
      const validatedRoutes = await this.validateRouteQuality(routes, options.emergencyMode);
      
      // Step 7: Calculate metrics
      const metrics = this.calculateRouteMetrics(validatedRoutes, drops);
      
      // Step 8: Identify unassigned drops
      const assignedDropIds = validatedRoutes.flatMap(r => r.drops.map(d => d.id));
      const unassigned = drops.filter(d => !assignedDropIds.includes(d.id));
      
      const endTime = Date.now();
      const calculationTime = endTime - startTime;

      // Update performance metrics
      this.performanceMetrics.totalRoutesCalculated += 1;
      this.performanceMetrics.averageCalculationTime =
        (this.performanceMetrics.averageCalculationTime * (this.performanceMetrics.totalRoutesCalculated - 1) + calculationTime) /
        this.performanceMetrics.totalRoutesCalculated;

      console.log(`✅ Orchestration complete: ${validatedRoutes.length} routes, ${unassigned.length} unassigned`);
      console.log(`⚡ Performance: ${calculationTime}ms (${this.performanceMetrics.cacheHitRate} cache hits)`);

      return {
        routes: validatedRoutes,
        unassigned,
        warnings: this.gatherWarnings(validatedRoutes, unassigned, metrics),
        metrics
      };
      
    } catch (error) {
      console.error('❌ Route orchestration failed:', error);
      throw new Error(`Route orchestration failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Validate drops meet minimum requirements
   */
  private validateDrops(drops: Drop[]): Drop[] {
    return drops.filter(drop => {
      // Basic validation
      if (!drop.pickupLocation || !drop.deliveryLocation) return false;
      if (!drop.timeWindow || !drop.timeWindow.earliest || !drop.timeWindow.latest) return false;
      if (drop.weight <= 0 || drop.volume <= 0) return false;
      if (drop.estimatedDuration <= 0) return false;
      
      // Time window validation
      const windowDuration = drop.timeWindow.latest.getTime() - drop.timeWindow.earliest.getTime();
      if (windowDuration > this.config.maxTimeWindowSpread * 60 * 1000) return false;
      
      return true;
    });
  }

  /**
   * Create geographic clusters based on proximity with smart configuration
   */
  private async createGeographicClusters(
    drops: Drop[],
    geofenceConstraints?: { lat: number; lng: number; radius: number }[],
    config?: RouteOrchestrationConfig
  ): Promise<Drop[][]> {
    const clusters: Drop[][] = [];
    const unassigned = [...drops];
    const activeConfig = config || this.config;

    while (unassigned.length > 0) {
      const seed = unassigned.shift()!;
      const cluster = [seed];

      // Find nearby drops within cluster radius (using miles)
      for (let i = unassigned.length - 1; i >= 0; i--) {
        const drop = unassigned[i];
        const distanceMeters = this.calculateDistance(
          seed.pickupLocation,
          drop.pickupLocation
        );

        // Convert distance to miles for comparison
        const distanceMiles = distanceMeters / 1609.34;

        if (distanceMiles <= activeConfig.maxClusterRadius &&
            cluster.length < activeConfig.maxDropsPerCluster) {
          // Check geofence constraints
          if (geofenceConstraints && !this.isWithinGeofence(drop, geofenceConstraints)) {
            continue;
          }
          
          cluster.push(drop);
          unassigned.splice(i, 1);
        }
      }
      
      // Only add cluster if it meets minimum size (unless emergency mode)
      if (cluster.length >= activeConfig.minDropsPerCluster) {
        clusters.push(cluster);
      } else {
        // Return single drops to unassigned
        unassigned.push(...cluster.slice(1));
      }
    }
    
    return clusters;
  }

  /**
   * Optimize clusters based on time windows
   */
  private optimizeTimeWindows(clusters: Drop[][]): Drop[][] {
    const optimizedClusters: Drop[][] = [];
    
    for (const cluster of clusters) {
      // Sort by earliest time window
      cluster.sort((a, b) => 
        a.timeWindow.earliest.getTime() - b.timeWindow.earliest.getTime()
      );
      
      // Validate time window compatibility
      const timeSpan = cluster[cluster.length - 1].timeWindow.latest.getTime() - 
                      cluster[0].timeWindow.earliest.getTime();
      
      if (timeSpan > this.config.maxTimeWindowSpread * 60 * 1000) {
        // Split cluster if time span too large
        const splitClusters = this.splitByTimeWindows(cluster);
        optimizedClusters.push(...splitClusters);
      } else {
        optimizedClusters.push(cluster);
      }
    }
    
    return optimizedClusters;
  }

  /**
   * Validate capacity constraints for each cluster
   */
  private validateCapacityConstraints(clusters: Drop[][]): Drop[][] {
    return clusters.filter(cluster => {
      const totalWeight = cluster.reduce((sum, drop) => sum + drop.weight, 0);
      const totalVolume = cluster.reduce((sum, drop) => sum + drop.volume, 0);
      const totalDuration = cluster.reduce((sum, drop) => sum + drop.estimatedDuration, 0);
      
      // Add buffer time
      const totalDurationWithBuffer = totalDuration + (cluster.length * this.config.bufferTimePerDrop);
      
      return totalWeight <= this.config.maxRouteWeight &&
             totalVolume <= this.config.maxRouteVolume &&
             totalDurationWithBuffer <= this.config.maxRouteDuration;
    });
  }

  /**
   * Generate route proposals from validated clusters
   */
  private generateRouteProposals(
    clusters: Drop[][], 
    options: any
  ): RouteProposal[] {
    return clusters.map((cluster, index) => {
      const totalValue = cluster.reduce((sum, drop) => sum + drop.value, 0);
      const serviceTier = this.determineRoutServiceTier(cluster);
      const estimatedDuration = this.calculateRouteDuration(cluster);
      const totalDistance = this.calculateRouteDistance(cluster);

      return {
        id: `route_${Date.now()}_${index}`,
        drops: cluster,
        serviceTier,
        estimatedDuration,
        totalDistance,
        totalValue,
        priority: this.calculateRoutePriority(cluster),
        status: 'proposed' as const,
        createdAt: new Date(),
        proposedStartTime: options.preferredStartTime || new Date(),
        constraints: {
          maxWeight: this.config.maxRouteWeight,
          maxVolume: this.config.maxRouteVolume,
          maxDuration: this.config.maxRouteDuration
        }
      };
    });
  }

  /**
   * Validate route quality and feasibility
   */
  private async validateRouteQuality(
    routes: RouteProposal[], 
    emergencyMode?: boolean
  ): Promise<RouteProposal[]> {
    const validRoutes: RouteProposal[] = [];
    
    for (const route of routes) {
      // Value validation
      if (route.totalValue < this.config.minRouteValue && !emergencyMode) {
        console.warn(`⚠️ Route ${route.id} below minimum value threshold`);
        continue;
      }
      
      // Service tier consistency
      if (!this.config.allowMixedTiers && !this.hasConsistentServiceTier(route.drops)) {
        console.warn(`⚠️ Route ${route.id} has mixed service tiers`);
        continue;
      }
      
      // Geographic feasibility
      const routeDistance = await this.calculateRouteDistance(route.drops);
      if (routeDistance > this.config.maxDrivingDistance) {
        console.warn(`⚠️ Route ${route.id} exceeds maximum driving distance`);
        continue;
      }
      
      validRoutes.push(route);
    }
    
    return validRoutes;
  }

  /**
   * Calculate comprehensive route metrics
   */
  private calculateRouteMetrics(routes: RouteProposal[], originalDrops: Drop[]): RouteMetrics {
    const totalDrops = originalDrops.length;
    const assignedDrops = routes.flatMap(r => r.drops).length;
    const totalValue = routes.reduce((sum, r) => sum + r.totalValue, 0);
    const totalDuration = routes.reduce((sum, r) => sum + r.estimatedDuration, 0);
    
    return {
      totalRoutes: routes.length,
      totalDrops,
      assignedDrops,
      unassignedDrops: totalDrops - assignedDrops,
      assignmentRate: assignedDrops / totalDrops,
      averageDropsPerRoute: assignedDrops / routes.length || 0,
      totalValue,
      averageValuePerRoute: totalValue / routes.length || 0,
      totalEstimatedDuration: totalDuration,
      averageDurationPerRoute: totalDuration / routes.length || 0,
      efficiencyScore: this.calculateEfficiencyScore(routes, originalDrops)
    };
  }

  // Helper methods
  private calculateDistance(loc1: { latitude: number; longitude: number }, loc2: { latitude: number; longitude: number }): number {
    // Haversine formula implementation
    const R = 6371000; // Earth's radius in meters
    const dLat = this.toRadians(loc2.latitude - loc1.latitude);
    const dLon = this.toRadians(loc2.longitude - loc1.longitude);
    
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(this.toRadians(loc1.latitude)) * Math.cos(this.toRadians(loc2.latitude)) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  private isWithinGeofence(drop: Drop, constraints: { lat: number; lng: number; radius: number }[]): boolean {
    return constraints.some(fence => {
      const distance = this.calculateDistance(
        { latitude: fence.lat, longitude: fence.lng },
        drop.pickupLocation
      );
      return distance <= fence.radius;
    });
  }

  private splitByTimeWindows(cluster: Drop[]): Drop[][] {
    // Implementation to split large time-span clusters
    const maxTimeSpan = this.config.maxTimeWindowSpread * 60 * 1000;
    const splitClusters: Drop[][] = [];
    let currentCluster: Drop[] = [];
    let clusterStartTime: number | null = null;
    
    for (const drop of cluster) {
      const dropTime = drop.timeWindow.earliest.getTime();
      
      if (clusterStartTime === null) {
        clusterStartTime = dropTime;
        currentCluster = [drop];
      } else if (dropTime - clusterStartTime <= maxTimeSpan) {
        currentCluster.push(drop);
      } else {
        // Start new cluster
        if (currentCluster.length >= this.config.minDropsPerCluster) {
          splitClusters.push(currentCluster);
        }
        currentCluster = [drop];
        clusterStartTime = dropTime;
      }
    }
    
    // Add final cluster if it meets minimum size
    if (currentCluster.length >= this.config.minDropsPerCluster) {
      splitClusters.push(currentCluster);
    }
    
    return splitClusters;
  }

  private determineRoutServiceTier(drops: Drop[]): string {
    const tiers = drops.map(d => d.serviceTier);
    const premiumCount = tiers.filter(t => t === 'premium').length;
    const standardCount = tiers.filter(t => t === 'standard').length;
    
    if (premiumCount > drops.length / 2) return 'premium';
    if (standardCount > drops.length / 2) return 'standard';
    return 'economy';
  }

  private calculateRouteDuration(drops: Drop[]): number {
    const baseDuration = drops.reduce((sum, drop) => sum + drop.estimatedDuration, 0);
    const bufferTime = drops.length * this.config.bufferTimePerDrop;
    return baseDuration + bufferTime;
  }

  private calculateRoutePriority(drops: Drop[]): number {
    const averagePriority = drops.reduce((sum, drop) => sum + drop.priority, 0) / drops.length;
    const valueWeight = Math.min(drops.reduce((sum, drop) => sum + drop.value, 0) / 1000, 1);
    
    return averagePriority * (1 - this.config.priorityWeighting) + 
           valueWeight * 10 * this.config.priorityWeighting;
  }

  private hasConsistentServiceTier(drops: Drop[]): boolean {
    const firstTier = drops[0]?.serviceTier;
    return drops.every(drop => drop.serviceTier === firstTier);
  }

  private calculateRouteDistance(drops: Drop[]): number {
    // Simplified distance calculation
    let totalDistance = 0;
    for (let i = 0; i < drops.length - 1; i++) {
      totalDistance += this.calculateDistance(
        drops[i].deliveryLocation,
        drops[i + 1].pickupLocation
      );
    }
    return totalDistance / 1000; // Convert to km
  }

  private calculateEfficiencyScore(routes: RouteProposal[], originalDrops: Drop[]): number {
    // Efficiency score based on assignment rate, value density, and time optimization
    const assignmentRate = routes.flatMap(r => r.drops).length / originalDrops.length;
    const averageValue = routes.reduce((sum, r) => sum + r.totalValue / r.drops.length, 0) / routes.length;
    const averageEfficiency = routes.reduce((sum, r) => sum + (r.totalValue / r.estimatedDuration), 0) / routes.length;
    
    return (assignmentRate * 0.4 + Math.min(averageValue / 100, 1) * 0.3 + Math.min(averageEfficiency / 10, 1) * 0.3) * 100;
  }

  private gatherWarnings(routes: RouteProposal[], unassigned: Drop[], metrics: RouteMetrics): string[] {
    const warnings: string[] = [];
    
    if (metrics.assignmentRate < 0.9) {
      warnings.push(`Low assignment rate: ${(metrics.assignmentRate * 100).toFixed(1)}%`);
    }
    
    if (metrics.averageDropsPerRoute < this.config.minDropsPerCluster) {
      warnings.push(`Low drops per route: ${metrics.averageDropsPerRoute.toFixed(1)} average`);
    }
    
    if (metrics.efficiencyScore < 70) {
      warnings.push(`Low efficiency score: ${metrics.efficiencyScore.toFixed(1)}`);
    }
    
    return warnings;
  }
}

// Type definitions
interface RouteProposal {
  id: string;
  drops: Drop[];
  serviceTier: string;
  estimatedDuration: number;
  totalDistance: number; // km
  totalValue: number;
  priority: number;
  status: 'proposed' | 'approved' | 'rejected' | 'active' | 'completed';
  createdAt: Date;
  proposedStartTime: Date;
  constraints: {
    maxWeight: number;
    maxVolume: number;
    maxDuration: number;
  };
}

interface RouteMetrics {
  totalRoutes: number;
  totalDrops: number;
  assignedDrops: number;
  unassignedDrops: number;
  assignmentRate: number;
  averageDropsPerRoute: number;
  totalValue: number;
  averageValuePerRoute: number;
  totalEstimatedDuration: number;
  averageDurationPerRoute: number;
  efficiencyScore: number;
}

export { RouteOrchestrationEngine, DEFAULT_CONFIG, type Drop, type RouteProposal, type RouteMetrics, type RouteOrchestrationConfig };