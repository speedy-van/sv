/**
 * Cost Optimization System for Dual Provider Services
 * Implements intelligent provider selection based on API costs and usage patterns
 */

import type { Provider } from '@/types/dual-provider-address';

interface ProviderCosts {
  textSearch: number;
  autocomplete: number;
  distanceMatrix: number;
  directions: number;
  placeDetails: number;
}

interface CostMetrics {
  totalCost: number;
  requestsCount: number;
  averageCostPerRequest: number;
  costByType: Record<string, number>;
  lastReset: number;
}

interface CostOptimizationConfig {
  dailyBudget: number;
  costAlertThreshold: number;
  enableCostOptimization: boolean;
  preferredCostRatio: number; // Preferred cost difference threshold (e.g., 0.1 = 10%)
}

export class CostOptimizer {
  private static instance: CostOptimizer;
  
  // API Costs (in USD per request/element)
  private readonly googleCosts: ProviderCosts = {
    textSearch: 0.032,       // per request
    autocomplete: 0.00283,   // per request
    distanceMatrix: 0.005,   // per element
    directions: 0.005,       // per request
    placeDetails: 0.017,     // per request
  };
  
  private readonly mapboxCosts: ProviderCosts = {
    textSearch: 0.0075,      // per request (geocoding)
    autocomplete: 0.0075,    // per request (geocoding)
    distanceMatrix: 0.005,   // per request (directions)
    directions: 0.005,       // per request
    placeDetails: 0.0075,    // per request (geocoding)
  };

  private googleMetrics: CostMetrics;
  private mapboxMetrics: CostMetrics;
  private config: CostOptimizationConfig;

  constructor(config?: Partial<CostOptimizationConfig>) {
    this.config = {
      dailyBudget: 100,         // $100 daily budget
      costAlertThreshold: 0.8,  // Alert at 80% of budget
      enableCostOptimization: true,
      preferredCostRatio: 0.1,  // Switch if cost difference > 10%
      ...config
    };

    this.googleMetrics = this.initializeMetrics();
    this.mapboxMetrics = this.initializeMetrics();
    
    this.scheduleDailyReset();
  }

  static getInstance(config?: Partial<CostOptimizationConfig>): CostOptimizer {
    if (!CostOptimizer.instance) {
      CostOptimizer.instance = new CostOptimizer(config);
    }
    return CostOptimizer.instance;
  }

  /**
   * Calculate the cost of a specific request type for a provider
   */
  calculateRequestCost(provider: Provider, requestType: keyof ProviderCosts): number {
    if (provider === 'google') {
      return this.googleCosts[requestType] || 0;
    } else {
      return this.mapboxCosts[requestType] || 0;
    }
  }

  /**
   * Record API usage and cost
   */
  recordRequest(provider: Provider, requestType: keyof ProviderCosts, count: number = 1): void {
    const cost = this.calculateRequestCost(provider, requestType) * count;
    const metrics = provider === 'google' ? this.googleMetrics : this.mapboxMetrics;
    
    metrics.totalCost += cost;
    metrics.requestsCount += count;
    metrics.averageCostPerRequest = metrics.totalCost / metrics.requestsCount;
    
    if (!metrics.costByType[requestType]) {
      metrics.costByType[requestType] = 0;
    }
    metrics.costByType[requestType] += cost;

    // Check if we're approaching budget limits
    this.checkBudgetAlerts();
  }

  /**
   * Select the most cost-effective provider for a request type
   * Considers both cost and performance health scores
   */
  selectCostOptimalProvider(
    requestType: keyof ProviderCosts, 
    healthScores: { google: number; mapbox: number }
  ): Provider {
    if (!this.config.enableCostOptimization) {
      // Fall back to health-based selection if cost optimization is disabled
      return healthScores.google >= healthScores.mapbox ? 'google' : 'mapbox';
    }

    const googleCost = this.calculateRequestCost('google', requestType);
    const mapboxCost = this.calculateRequestCost('mapbox', requestType);

    // Calculate cost-efficiency scores (higher is better)
    // Formula: health_score / (cost * 1000) to normalize costs
    const googleEfficiency = healthScores.google / (googleCost * 1000);
    const mapboxEfficiency = healthScores.mapbox / (mapboxCost * 1000);

    // Add cost preference factor
    const costDifference = Math.abs(googleCost - mapboxCost);
    const maxCost = Math.max(googleCost, mapboxCost);
    const costDifferenceRatio = costDifference / maxCost;

    // If cost difference is significant, factor it in more heavily
    if (costDifferenceRatio > this.config.preferredCostRatio) {
      // Strongly prefer the cheaper option if quality is comparable
      const minHealthThreshold = 60; // Minimum acceptable health score
      
      if (googleCost < mapboxCost && healthScores.google >= minHealthThreshold) {
        return 'google';
      } else if (mapboxCost < googleCost && healthScores.mapbox >= minHealthThreshold) {
        return 'mapbox';
      }
    }

    // Use efficiency-based selection for smaller cost differences
    return googleEfficiency >= mapboxEfficiency ? 'google' : 'mapbox';
  }

  /**
   * Check if a provider is within budget limits
   */
  isWithinBudget(provider: Provider): boolean {
    const metrics = provider === 'google' ? this.googleMetrics : this.mapboxMetrics;
    const totalDailyCost = this.googleMetrics.totalCost + this.mapboxMetrics.totalCost;
    
    return totalDailyCost < this.config.dailyBudget;
  }

  /**
   * Get cost analytics and metrics
   */
  getCostAnalytics() {
    const totalDailyCost = this.googleMetrics.totalCost + this.mapboxMetrics.totalCost;
    const budgetUtilization = (totalDailyCost / this.config.dailyBudget) * 100;
    
    return {
      daily: {
        totalCost: totalDailyCost,
        budgetUtilization: Math.min(100, budgetUtilization),
        remainingBudget: Math.max(0, this.config.dailyBudget - totalDailyCost),
        isOverBudget: totalDailyCost > this.config.dailyBudget,
        alertThresholdReached: budgetUtilization > (this.config.costAlertThreshold * 100),
      },
      providers: {
        google: {
          ...this.googleMetrics,
          costShare: this.googleMetrics.totalCost > 0 
            ? (this.googleMetrics.totalCost / totalDailyCost) * 100 
            : 0,
        },
        mapbox: {
          ...this.mapboxMetrics,
          costShare: this.mapboxMetrics.totalCost > 0 
            ? (this.mapboxMetrics.totalCost / totalDailyCost) * 100 
            : 0,
        },
      },
      optimization: {
        enabled: this.config.enableCostOptimization,
        dailyBudget: this.config.dailyBudget,
        costAlertThreshold: this.config.costAlertThreshold,
        preferredCostRatio: this.config.preferredCostRatio,
      },
      recommendations: this.generateCostRecommendations(),
    };
  }

  /**
   * Generate cost optimization recommendations
   */
  private generateCostRecommendations(): string[] {
    const recommendations: string[] = [];
    const totalCost = this.googleMetrics.totalCost + this.mapboxMetrics.totalCost;
    const budgetUtilization = totalCost / this.config.dailyBudget;

    if (budgetUtilization > 0.9) {
      recommendations.push('Daily budget nearly exceeded. Consider increasing budget or optimizing request patterns.');
    }

    if (this.googleMetrics.totalCost > this.mapboxMetrics.totalCost * 2) {
      recommendations.push('Google Places API usage significantly higher than Mapbox. Consider balancing provider usage.');
    } else if (this.mapboxMetrics.totalCost > this.googleMetrics.totalCost * 2) {
      recommendations.push('Mapbox API usage significantly higher than Google Places. Consider balancing provider usage.');
    }

    if (!this.config.enableCostOptimization) {
      recommendations.push('Cost optimization is disabled. Enable it to reduce API expenses automatically.');
    }

    const googleAvgCost = this.googleMetrics.averageCostPerRequest;
    const mapboxAvgCost = this.mapboxMetrics.averageCostPerRequest;
    
    if (googleAvgCost > mapboxAvgCost * 1.5) {
      recommendations.push('Google Places API requests are significantly more expensive on average. Consider optimizing request types.');
    }

    return recommendations;
  }

  /**
   * Check budget alerts and log warnings
   */
  private checkBudgetAlerts(): void {
    const totalCost = this.googleMetrics.totalCost + this.mapboxMetrics.totalCost;
    const budgetUtilization = totalCost / this.config.dailyBudget;

    if (budgetUtilization > this.config.costAlertThreshold) {
      console.warn(`[CostOptimizer] Budget alert: ${(budgetUtilization * 100).toFixed(1)}% of daily budget used ($${totalCost.toFixed(3)} / $${this.config.dailyBudget})`);
    }

    if (budgetUtilization > 1) {
      console.error(`[CostOptimizer] Budget exceeded: $${totalCost.toFixed(3)} / $${this.config.dailyBudget} daily budget`);
    }
  }

  /**
   * Initialize metrics for a provider
   */
  private initializeMetrics(): CostMetrics {
    return {
      totalCost: 0,
      requestsCount: 0,
      averageCostPerRequest: 0,
      costByType: {},
      lastReset: Date.now(),
    };
  }

  /**
   * Reset daily metrics
   */
  private resetDailyMetrics(): void {
    this.googleMetrics = this.initializeMetrics();
    this.mapboxMetrics = this.initializeMetrics();
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[CostOptimizer] Daily metrics reset');
    }
  }

  /**
   * Schedule daily metrics reset
   */
  private scheduleDailyReset(): void {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const timeUntilReset = tomorrow.getTime() - now.getTime();
    
    setTimeout(() => {
      this.resetDailyMetrics();
      this.scheduleDailyReset();
    }, timeUntilReset);
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<CostOptimizationConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Reset all metrics (useful for testing)
   */
  reset(): void {
    this.googleMetrics = this.initializeMetrics();
    this.mapboxMetrics = this.initializeMetrics();
  }
}

export const costOptimizer = CostOptimizer.getInstance();
export default costOptimizer;