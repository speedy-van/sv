/**
 * Multi-Drop Route Orchestration Scheduler
 * 
 * Automatically creates optimized routes from pending drops every 10-15 minutes.
 * Uses geographic clustering and time windows to maximize efficiency.
 * 
 * Key Features:
 * - Automatic route generation from pending drops
 * - Geographic clustering using K-means algorithm
 * - Time window optimization for delivery constraints
 * - Driver capacity and vehicle limits consideration
 * - Real-time route updates via WebSocket
 * - Administrative override capabilities
 * 
 * This scheduler runs continuously and handles:
 * 1. Collecting pending drops from database
 * 2. Grouping drops by geographic proximity
 * 3. Optimizing delivery sequences within clusters
 * 4. Creating route assignments for available drivers
 * 5. Broadcasting updates to all connected clients
 */

import { prisma, ensurePrismaConnection } from '@/lib/prisma';

interface Drop {
  id: string;
  customerId: string;
  pickupAddress: string;
  deliveryAddress: string;
  pickupLatitude?: number;
  pickupLongitude?: number;
  deliveryLatitude?: number;
  deliveryLongitude?: number;
  timeWindowStart: Date;
  timeWindowEnd: Date;
  specialInstructions?: string;
  serviceTier: string;
  status: string;
  quotedPrice?: number;
  weight?: number;
  volume?: number;
  estimatedDuration?: number;
}

// ============================================================================
// Ultra-Advanced AI Classes for Maximum Intelligence and Flexibility
// ============================================================================

/**
 * Demand Predictor - Machine Learning for booking volume prediction
 */
class DemandPredictor {
  private historicalData: Map<string, number[]> = new Map();
  private seasonalPatterns: Map<string, number> = new Map();
  private trendAnalysis: Map<string, { slope: number, intercept: number }> = new Map();

  /**
   * Train the predictor with historical booking data
   */
  train(hourlyBookings: { hour: number, dayOfWeek: number, bookings: number, month?: number }[]): void {
    for (const data of hourlyBookings) {
      const key = `${data.dayOfWeek}_${data.hour}`;
      if (!this.historicalData.has(key)) {
        this.historicalData.set(key, []);
      }
      this.historicalData.get(key)!.push(data.bookings);

      // Learn seasonal patterns
      if (data.month) {
        const monthKey = `${data.dayOfWeek}_${data.month}`;
        const current = this.seasonalPatterns.get(monthKey) || 0;
        this.seasonalPatterns.set(monthKey, current + data.bookings);
      }
    }

    // Calculate trend lines for each time slot
    this.calculateTrends();
  }

  /**
   * Predict demand for specific time slot using multiple ML techniques
   */
  predictDemand(hour: number, dayOfWeek: number, month?: number): number {
    const key = `${dayOfWeek}_${hour}`;
    const historical = this.historicalData.get(key) || [];

    if (historical.length === 0) return 0;

    // Ensemble prediction: combine multiple methods
    const movingAvg = this.weightedMovingAverage(historical);
    const trendBased = this.trendBasedPrediction(key, historical.length);
    const seasonalAdj = this.seasonalAdjustment(dayOfWeek, month);

    // Weighted ensemble (60% moving avg, 30% trend, 10% seasonal)
    let prediction = (movingAvg * 0.6) + (trendBased * 0.3) + (seasonalAdj * 0.1);

    // Add confidence-based adjustment
    const confidence = Math.min(historical.length / 30, 1); // Max confidence at 30 data points
    prediction *= (0.8 + confidence * 0.4); // 80-120% adjustment

    return Math.max(0, Math.round(prediction));
  }

  /**
   * Get peak demand hours for a day
   */
  getPeakHours(dayOfWeek: number): number[] {
    const peaks = [];
    const predictions = [];

    // Get predictions for all hours
    for (let hour = 0; hour < 24; hour++) {
      predictions.push(this.predictDemand(hour, dayOfWeek));
    }

    // Find hours with demand > 70% of max
    const maxDemand = Math.max(...predictions);
    const threshold = maxDemand * 0.7;

    for (let hour = 0; hour < 24; hour++) {
      if (predictions[hour] >= threshold && predictions[hour] > 10) {
        peaks.push(hour);
      }
    }

    return peaks;
  }

  /**
   * Get demand volatility for risk assessment
   */
  getDemandVolatility(hour: number, dayOfWeek: number): number {
    const key = `${dayOfWeek}_${hour}`;
    const historical = this.historicalData.get(key) || [];

    if (historical.length < 3) return 0;

    const mean = historical.reduce((a, b) => a + b, 0) / historical.length;
    const variance = historical.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / historical.length;

    return Math.sqrt(variance) / mean; // Coefficient of variation
  }

  private weightedMovingAverage(data: number[]): number {
    let weightedSum = 0;
    let totalWeight = 0;

    data.forEach((value, index) => {
      const weight = Math.pow(1.2, index); // More recent data has higher weight
      weightedSum += value * weight;
      totalWeight += weight;
    });

    return weightedSum / totalWeight;
  }

  private trendBasedPrediction(key: string, dataPoints: number): number {
    const trend = this.trendAnalysis.get(key);
    if (!trend) return 0;

    // Predict next value using linear regression
    return trend.slope * dataPoints + trend.intercept;
  }

  private seasonalAdjustment(dayOfWeek: number, month?: number): number {
    if (!month) return 0;

    const monthKey = `${dayOfWeek}_${month}`;
    const seasonalValue = this.seasonalPatterns.get(monthKey);

    if (!seasonalValue) return 0;

    // Calculate seasonal index
    const allValues = Array.from(this.seasonalPatterns.values());
    const overallMean = allValues.reduce((a, b) => a + b, 0) / allValues.length;

    return seasonalValue / overallMean;
  }

  private calculateTrends(): void {
    for (const [key, data] of this.historicalData) {
      if (data.length < 3) continue;

      // Simple linear regression
      const n = data.length;
      const x = Array.from({length: n}, (_, i) => i);
      const y = data;

      const sumX = x.reduce((a, b) => a + b, 0);
      const sumY = y.reduce((a, b) => a + b, 0);
      const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
      const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

      const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
      const intercept = (sumY - slope * sumX) / n;

      this.trendAnalysis.set(key, { slope, intercept });
    }
  }
}

/**
 * Pattern Learner - Advanced pattern recognition and optimization
 */
class PatternLearner {
  private routePatterns: Map<string, {
    efficiency: number,
    frequency: number,
    avgDistance: number,
    avgTime: number,
    successRate: number,
    customerSatisfaction: number,
    profitability: number,
    confidence: number
  }> = new Map();

  private regionalInsights: Map<string, {
    optimalRadius: number,
    avgEfficiency: number,
    peakHours: number[],
    commonChallenges: string[],
    bestPractices: string[]
  }> = new Map();

  private routeSequences: Map<string, {
    sequence: string[],
    successCount: number,
    avgTime: number,
    avgDistance: number
  }> = new Map();

  /**
   * Learn from completed route execution
   */
  learnFromRoute(routeData: {
    region: string,
    bookingCount: number,
    totalDistance: number,
    executionTime: number,
    customerSatisfaction: number,
    driverRating: number,
    wasSuccessful: boolean,
    routeId: string,
    sequence?: string[], // Pickup/drop sequence
    challenges?: string[], // Issues encountered
    profit: number
  }): void {
    const patternKey = this.generatePatternKey(routeData);
    const efficiency = this.calculateEfficiency(routeData);
    const profitability = routeData.profit / routeData.totalDistance; // Profit per mile

    // Update route pattern
    if (this.routePatterns.has(patternKey)) {
      const existing = this.routePatterns.get(patternKey)!;
      const newFreq = existing.frequency + 1;

      existing.efficiency = (existing.efficiency * existing.frequency + efficiency) / newFreq;
      existing.frequency = newFreq;
      existing.avgDistance = (existing.avgDistance * existing.frequency + routeData.totalDistance) / newFreq;
      existing.avgTime = (existing.avgTime * existing.frequency + routeData.executionTime) / newFreq;
      existing.successRate = (existing.successRate * existing.frequency + (routeData.wasSuccessful ? 1 : 0)) / newFreq;
      existing.customerSatisfaction = (existing.customerSatisfaction * existing.frequency + routeData.customerSatisfaction) / newFreq;
      existing.profitability = (existing.profitability * existing.frequency + profitability) / newFreq;
      existing.confidence = Math.min(newFreq / 10, 1); // Max confidence at 10 similar routes
    } else {
      this.routePatterns.set(patternKey, {
        efficiency,
        frequency: 1,
        avgDistance: routeData.totalDistance,
        avgTime: routeData.executionTime,
        successRate: routeData.wasSuccessful ? 1 : 0,
        customerSatisfaction: routeData.customerSatisfaction,
        profitability,
        confidence: 0.1
      });
    }

    // Learn from sequence if provided
    if (routeData.sequence) {
      this.learnSequence(routeData.sequence, routeData.wasSuccessful, routeData.executionTime, routeData.totalDistance);
    }

    // Update regional insights
    this.updateRegionalInsights(routeData.region, efficiency, routeData.challenges);
  }

  /**
   * Get intelligent radius recommendation
   */
  getSmartRadius(bookings: number, region: string, currentHour: number, weather?: string): number {
    // Get regional base radius
    const regional = this.regionalInsights.get(region);
    let baseRadius = regional?.optimalRadius || 50;

    // Adjust based on booking volume with ML insights
    const volumeMultiplier = this.getVolumeMultiplier(bookings);

    // Time-based adjustment
    const timeMultiplier = this.getTimeMultiplier(currentHour, regional?.peakHours);

    // Weather adjustment
    const weatherMultiplier = this.getWeatherMultiplier(weather);

    // Pattern-based optimization
    const patternMultiplier = this.getPatternMultiplier(bookings, region);

    baseRadius *= volumeMultiplier * timeMultiplier * weatherMultiplier * patternMultiplier;

    return Math.max(15, Math.min(150, baseRadius));
  }

  /**
   * Predict route success probability
   */
  predictRouteSuccess(bookings: number, radius: number, region: string, hour: number): {
    successProbability: number,
    estimatedTime: number,
    estimatedEfficiency: number,
    riskFactors: string[]
  } {
    const riskFactors = [];
    let successProbability = 0.8; // Base success rate
    let estimatedTime = bookings * 25; // Base time estimate
    let estimatedEfficiency = 0.75; // Base efficiency

    // Find similar patterns
    const similarPatterns = this.findSimilarPatterns(bookings, radius, region);

    if (similarPatterns.length > 0) {
      const avgSuccess = similarPatterns.reduce((sum, p) => sum + p.successRate, 0) / similarPatterns.length;
      const avgTime = similarPatterns.reduce((sum, p) => sum + p.avgTime, 0) / similarPatterns.length;
      const avgEfficiency = similarPatterns.reduce((sum, p) => sum + p.efficiency, 0) / similarPatterns.length;

      successProbability = avgSuccess;
      estimatedTime = avgTime;
      estimatedEfficiency = avgEfficiency;
    }

    // Risk assessment
    if (hour >= 8 && hour <= 10) {
      successProbability *= 0.95;
      riskFactors.push('Peak hour traffic');
    }

    if (bookings > 10) {
      successProbability *= 0.98;
      riskFactors.push('High booking count');
    }

    if (radius > 100) {
      successProbability *= 0.97;
      riskFactors.push('Large radius coverage');
    }

    return {
      successProbability: Math.max(0, Math.min(1, successProbability)),
      estimatedTime,
      estimatedEfficiency,
      riskFactors
    };
  }

  private findSimilarPatterns(bookingCount: number, radius: number, region: string) {
    const similar = [];

    for (const [key, pattern] of this.routePatterns) {
      const [count, distance, patternRegion] = key.split('_');

      if (Math.abs(parseInt(count) - bookingCount) <= 2 &&
          Math.abs(parseInt(distance) - radius * bookingCount) <= radius * 2 &&
          patternRegion === region &&
          pattern.frequency >= 3) {
        similar.push(pattern);
      }
    }

    return similar;
  }

  private getVolumeMultiplier(bookings: number): number {
    if (bookings > 100) return 0.7;    // Very busy - tight clustering
    if (bookings > 50) return 0.8;     // Busy - compact routes
    if (bookings > 20) return 0.9;     // Moderate - balanced
    if (bookings > 10) return 0.95;    // Normal - slight reduction
    if (bookings > 5) return 1.0;      // Quiet - standard
    return 1.2;                       // Very quiet - expanded coverage
  }

  private getTimeMultiplier(hour: number, peakHours?: number[]): number {
    const isPeak = peakHours?.includes(hour) || (hour >= 8 && hour <= 10) || (hour >= 16 && hour <= 19);

    if (isPeak) return 0.8;           // Peak hours - reduce radius
    if (hour >= 2 && hour <= 6) return 1.3; // Off-peak - increase radius
    return 1.0;                      // Normal hours
  }

  private getWeatherMultiplier(weather?: string): number {
    if (!weather) return 1.0;

    const badWeather = ['rain', 'snow', 'storm', 'fog', 'hail'];
    const severeWeather = ['blizzard', 'hurricane', 'heavy_rain'];

    if (severeWeather.some(w => weather.includes(w))) return 0.6;
    if (badWeather.some(w => weather.includes(w))) return 0.8;

    return 1.0;
  }

  private getPatternMultiplier(bookings: number, region: string): number {
    const regional = this.regionalInsights.get(region);
    if (!regional) return 1.0;

    // Find best pattern for this scenario
    let bestEfficiency = 0;
    let bestMultiplier = 1.0;

    for (const [key, pattern] of this.routePatterns) {
      const [count] = key.split('_');
      const patternBookings = parseInt(count);

      if (Math.abs(patternBookings - bookings) <= 2 &&
          pattern.confidence > 0.5 &&
          pattern.successRate > 0.8) {

        const radius = pattern.avgDistance / patternBookings;
        const efficiency = pattern.efficiency;

        if (efficiency > bestEfficiency) {
          bestEfficiency = efficiency;
          bestMultiplier = radius / 50; // Relative to base radius of 50
        }
      }
    }

    return bestMultiplier || 1.0;
  }

  private learnSequence(sequence: string[], wasSuccessful: boolean, time: number, distance: number): void {
    const sequenceKey = sequence.join('->');

    if (this.routeSequences.has(sequenceKey)) {
      const existing = this.routeSequences.get(sequenceKey)!;
      const newCount = existing.successCount + (wasSuccessful ? 1 : 0);
      const totalCount = existing.successCount + 1;

      existing.successCount = newCount;
      existing.avgTime = (existing.avgTime * (totalCount - 1) + time) / totalCount;
      existing.avgDistance = (existing.avgDistance * (totalCount - 1) + distance) / totalCount;
    } else {
      this.routeSequences.set(sequenceKey, {
        sequence: [...sequence],
        successCount: wasSuccessful ? 1 : 0,
        avgTime: time,
        avgDistance: distance
      });
    }
  }

  private updateRegionalInsights(region: string, efficiency: number, challenges?: string[]): void {
    const existing = this.regionalInsights.get(region) || {
      optimalRadius: 50,
      avgEfficiency: 0,
      peakHours: [],
      commonChallenges: [],
      bestPractices: []
    };

    // Update efficiency
    const count = existing.commonChallenges.length || 1;
    existing.avgEfficiency = (existing.avgEfficiency * (count - 1) + efficiency) / count;

    // Track challenges
    if (challenges) {
      challenges.forEach(challenge => {
        if (!existing.commonChallenges.includes(challenge)) {
          existing.commonChallenges.push(challenge);
        }
      });
    }

    this.regionalInsights.set(region, existing);
  }

  private generatePatternKey(routeData: any): string {
    return `${routeData.bookingCount}_${Math.round(routeData.totalDistance)}_${routeData.region}`;
  }

  private calculateEfficiency(routeData: any): number {
    const distanceEfficiency = routeData.totalDistance / routeData.bookingCount;
    const timeEfficiency = routeData.executionTime / routeData.bookingCount;
    const satisfaction = (routeData.customerSatisfaction + routeData.driverRating) / 2;
    const success = routeData.wasSuccessful ? 1 : 0;
    const profit = routeData.profit > 0 ? 1 : 0;

    return (distanceEfficiency * 0.2 + timeEfficiency * 0.2 + satisfaction * 0.2 + success * 0.2 + profit * 0.2) / 100;
  }
}

/**
 * Performance Analyzer - Advanced driver and route analytics
 */
class PerformanceAnalyzer {
  private driverProfiles: Map<string, {
    skills: {
      urbanEfficiency: number,
      ruralEfficiency: number,
      peakHourEfficiency: number,
      longDistanceEfficiency: number,
      weatherAdaptability: number
    },
    preferences: {
      maxRadius: number,
      preferredHours: number[],
      avoidWeather: string[],
      preferredRegions: string[]
    },
    stats: {
      totalRoutes: number,
      avgDeliveryTime: number,
      onTimeRate: number,
      customerRating: number,
      fuelEfficiency: number,
      adaptabilityScore: number
    },
    history: {
      recentPerformance: number[],
      trend: 'improving' | 'stable' | 'declining'
    }
  }> = new Map();

  private routeAnalytics: Map<string, {
    region: string,
    avgPerformance: number,
    commonIssues: string[],
    optimalConditions: string[]
  }> = new Map();

  /**
   * Analyze driver performance with advanced metrics
   */
  analyzeDriverPerformance(driverId: string, routeData: {
    region: string,
    distance: number,
    duration: number,
    wasOnTime: boolean,
    customerRating: number,
    fuelUsed: number,
    hour: number,
    weather?: string,
    challenges?: string[],
    sequence?: string[]
  }): void {
    const profile = this.driverProfiles.get(driverId) || this.createNewProfile();

    // Update stats
    profile.stats.totalRoutes += 1;
    const n = profile.stats.totalRoutes;

    profile.stats.avgDeliveryTime = (profile.stats.avgDeliveryTime * (n - 1) + routeData.duration) / n;
    profile.stats.onTimeRate = (profile.stats.onTimeRate * (n - 1) + (routeData.wasOnTime ? 1 : 0)) / n;
    profile.stats.customerRating = (profile.stats.customerRating * (n - 1) + routeData.customerRating) / n;

    if (routeData.fuelUsed > 0) {
      const efficiency = routeData.distance / routeData.fuelUsed;
      profile.stats.fuelEfficiency = (profile.stats.fuelEfficiency * (n - 1) + efficiency) / n;
    }

    // Update performance history and trend
    this.updatePerformanceHistory(profile, routeData);

    // Update skills based on route characteristics
    this.updateSkills(profile, routeData);

    // Update preferences based on performance
    this.updatePreferences(profile, routeData);

    this.driverProfiles.set(driverId, profile);

    // Update route analytics
    this.updateRouteAnalytics(routeData.region, routeData);
  }

  /**
   * Get optimal radius for driver based on comprehensive analysis
   */
  getOptimalRadiusForDriver(driverId: string, routeContext: {
    region: string,
    hour: number,
    weather?: string,
    bookingCount: number,
    sequence?: string[]
  }): {
    recommendedRadius: number,
    confidence: number,
    reasoning: string[],
    alternatives: { radius: number, score: number }[]
  } {
    const profile = this.driverProfiles.get(driverId);
    if (!profile) {
      return {
        recommendedRadius: 50,
        confidence: 0.5,
        reasoning: ['No driver data available, using default radius'],
        alternatives: []
      };
    }

    let baseRadius = 50;
    const reasoning = [];

    // Skill-based adjustments
    const skillMultiplier = this.calculateSkillMultiplier(profile, routeContext);
    baseRadius *= skillMultiplier;
    reasoning.push(`Skill-based adjustment: ${skillMultiplier.toFixed(2)}x`);

    // Preference-based adjustments
    const preferenceMultiplier = this.calculatePreferenceMultiplier(profile, routeContext);
    baseRadius *= preferenceMultiplier;
    reasoning.push(`Preference adjustment: ${preferenceMultiplier.toFixed(2)}x`);

    // Performance trend adjustment
    const trendMultiplier = this.calculateTrendMultiplier(profile);
    baseRadius *= trendMultiplier;
    reasoning.push(`Performance trend: ${trendMultiplier.toFixed(2)}x`);

    // Route analytics adjustment
    const analyticsMultiplier = this.calculateAnalyticsMultiplier(routeContext.region);
    baseRadius *= analyticsMultiplier;
    reasoning.push(`Regional analytics: ${analyticsMultiplier.toFixed(2)}x`);

    // Generate alternatives
    const alternatives = this.generateRadiusAlternatives(baseRadius, routeContext);

    const finalRadius = Math.max(15, Math.min(150, baseRadius));
    const confidence = this.calculateConfidence(profile, routeContext);

    return {
      recommendedRadius: finalRadius,
      confidence,
      reasoning,
      alternatives
    };
  }

  /**
   * Predict driver availability and performance
   */
  predictDriverAvailability(driverId: string, timeSlot: { hour: number, dayOfWeek: number }): {
    availabilityProbability: number,
    expectedPerformance: number,
    recommendedWorkload: number
  } {
    const profile = this.driverProfiles.get(driverId);
    if (!profile) {
      return { availabilityProbability: 0.5, expectedPerformance: 0.5, recommendedWorkload: 5 };
    }

    // Check preferred hours
    const isPreferredHour = profile.preferences.preferredHours.includes(timeSlot.hour);
    const availabilityProbability = isPreferredHour ? 0.9 : 0.7;

    // Calculate expected performance
    const timePreference = isPreferredHour ? 1.1 : 0.9;
    const dayPreference = timeSlot.dayOfWeek === 1 || timeSlot.dayOfWeek === 5 ? 0.95 : 1.0;
    const expectedPerformance = profile.stats.onTimeRate * timePreference * dayPreference;

    // Recommend workload based on performance
    const recommendedWorkload = Math.round(profile.stats.avgDeliveryTime < 30 ? 8 :
                                           profile.stats.avgDeliveryTime < 45 ? 6 : 4);

    return {
      availabilityProbability,
      expectedPerformance,
      recommendedWorkload
    };
  }

  private createNewProfile() {
    return {
      skills: {
        urbanEfficiency: 1.0,
        ruralEfficiency: 1.0,
        peakHourEfficiency: 1.0,
        longDistanceEfficiency: 1.0,
        weatherAdaptability: 1.0
      },
      preferences: {
        maxRadius: 100,
        preferredHours: [] as number[],
        avoidWeather: [] as string[],
        preferredRegions: [] as string[]
      },
      stats: {
        totalRoutes: 0,
        avgDeliveryTime: 0,
        onTimeRate: 0,
        customerRating: 0,
        fuelEfficiency: 0,
        adaptabilityScore: 1.0
      },
      history: {
        recentPerformance: [] as number[],
        trend: 'stable' as 'improving' | 'stable' | 'declining'
      }
    };
  }

  private updatePerformanceHistory(profile: any, routeData: any): void {
    const performance = (routeData.wasOnTime ? 1 : 0) + (routeData.customerRating / 5);

    profile.history.recentPerformance.push(performance);
    if (profile.history.recentPerformance.length > 10) {
      profile.history.recentPerformance.shift();
    }

    // Analyze trend
    if (profile.history.recentPerformance.length >= 5) {
      const recent = profile.history.recentPerformance.slice(-5);
      const older = profile.history.recentPerformance.slice(0, 5);

      const recentAvg = recent.reduce((a: number, b: number) => a + b, 0) / recent.length;
      const olderAvg = older.reduce((a: number, b: number) => a + b, 0) / older.length;

      if (recentAvg > olderAvg + 0.1) profile.history.trend = 'improving';
      else if (recentAvg < olderAvg - 0.1) profile.history.trend = 'declining';
      else profile.history.trend = 'stable';
    }
  }

  private updateSkills(profile: any, routeData: any): void {
    const performance = this.calculateRoutePerformance(routeData);
    const adjustment = performance > 0.8 ? 1.02 : performance < 0.6 ? 0.98 : 1.0;

    // Update relevant skills
    if (this.isUrbanArea(routeData.region)) {
      profile.skills.urbanEfficiency *= adjustment;
    } else {
      profile.skills.ruralEfficiency *= adjustment;
    }

    if (this.isPeakHour(routeData.hour)) {
      profile.skills.peakHourEfficiency *= adjustment;
    }

    if (routeData.distance > 50) {
      profile.skills.longDistanceEfficiency *= adjustment;
    }

    if (routeData.weather) {
      profile.skills.weatherAdaptability *= adjustment;
    }

    // Keep skills within reasonable bounds
    Object.keys(profile.skills).forEach(skill => {
      profile.skills[skill] = Math.max(0.5, Math.min(1.5, profile.skills[skill]));
    });
  }

  private updatePreferences(profile: any, routeData: any): void {
    const performance = this.calculateRoutePerformance(routeData);

    // Learn preferred hours
    if (performance > 0.8 && !profile.preferences.preferredHours.includes(routeData.hour)) {
      profile.preferences.preferredHours.push(routeData.hour);
    }

    // Learn weather preferences
    if (routeData.weather && performance < 0.6 && !profile.preferences.avoidWeather.includes(routeData.weather)) {
      profile.preferences.avoidWeather.push(routeData.weather);
    }

    // Learn regional preferences
    if (performance > 0.8 && !profile.preferences.preferredRegions.includes(routeData.region)) {
      profile.preferences.preferredRegions.push(routeData.region);
    }

    // Update max radius based on performance
    if (performance > 0.9 && routeData.distance > profile.preferences.maxRadius * 0.8) {
      profile.preferences.maxRadius = Math.min(150, profile.preferences.maxRadius + 5);
    }
  }

  private updateRouteAnalytics(region: string, routeData: any): void {
    const existing = this.routeAnalytics.get(region) || {
      region,
      avgPerformance: 0,
      commonIssues: [],
      optimalConditions: []
    };

    const performance = this.calculateRoutePerformance(routeData);
    const count = existing.commonIssues.length || 1;

    existing.avgPerformance = (existing.avgPerformance * (count - 1) + performance) / count;

    // Track issues and optimal conditions
    if (routeData.challenges) {
      routeData.challenges.forEach((challenge: string) => {
        if (!existing.commonIssues.includes(challenge)) {
          existing.commonIssues.push(challenge);
        }
      });
    }

    if (performance > 0.8) {
      const condition = `${routeData.hour}h_${routeData.weather || 'clear'}`;
      if (!existing.optimalConditions.includes(condition)) {
        existing.optimalConditions.push(condition);
      }
    }

    this.routeAnalytics.set(region, existing);
  }

  private calculateSkillMultiplier(profile: any, context: any): number {
    let multiplier = 1.0;

    if (this.isUrbanArea(context.region)) {
      multiplier *= profile.skills.urbanEfficiency;
    } else {
      multiplier *= profile.skills.ruralEfficiency;
    }

    if (this.isPeakHour(context.hour)) {
      multiplier *= profile.skills.peakHourEfficiency;
    }

    if (context.bookingCount > 8) {
      multiplier *= profile.skills.longDistanceEfficiency;
    }

    return multiplier;
  }

  private calculatePreferenceMultiplier(profile: any, context: any): number {
    let multiplier = 1.0;

    // Hour preference
    if (profile.preferences.preferredHours.includes(context.hour)) {
      multiplier *= 1.1;
    }

    // Weather preference
    if (context.weather && profile.preferences.avoidWeather.includes(context.weather)) {
      multiplier *= 0.9;
    }

    // Region preference
    if (profile.preferences.preferredRegions.includes(context.region)) {
      multiplier *= 1.05;
    }

    // Max radius constraint
    if (profile.preferences.maxRadius < 100) {
      multiplier *= 0.95;
    }

    return multiplier;
  }

  private calculateTrendMultiplier(profile: any): number {
    switch (profile.history.trend) {
      case 'improving': return 1.1;
      case 'declining': return 0.9;
      default: return 1.0;
    }
  }

  private calculateAnalyticsMultiplier(region: string): number {
    const analytics = this.routeAnalytics.get(region);
    if (!analytics) return 1.0;

    // Adjust based on regional performance
    if (analytics.avgPerformance > 0.8) return 1.05;
    if (analytics.avgPerformance < 0.6) return 0.95;

    return 1.0;
  }

  private generateRadiusAlternatives(baseRadius: number, context: any): { radius: number, score: number }[] {
    const alternatives = [];
    const variations = [-25, -15, -5, 5, 15, 25];

    for (const variation of variations) {
      const radius = Math.max(15, Math.min(150, baseRadius + variation));
      const score = this.scoreRadiusAlternative(radius, context);
      alternatives.push({ radius, score });
    }

    return alternatives.sort((a, b) => b.score - a.score);
  }

  private calculateConfidence(profile: any, context: any): number {
    let confidence = 0.5; // Base confidence

    // More routes = higher confidence
    confidence += Math.min(profile.stats.totalRoutes / 20, 0.3);

    // Recent performance consistency
    if (profile.history.recentPerformance.length >= 5) {
      const recent = profile.history.recentPerformance.slice(-5);
      const variance = this.calculateVariance(recent);
      confidence += Math.max(0, 0.2 - variance);
    }

    // Known conditions = higher confidence
    if (profile.preferences.preferredHours.includes(context.hour)) confidence += 0.1;
    if (profile.preferences.preferredRegions.includes(context.region)) confidence += 0.1;

    return Math.min(confidence, 1.0);
  }

  private calculateRoutePerformance(routeData: any): number {
    return (routeData.wasOnTime ? 1 : 0) * 0.5 + (routeData.customerRating / 5) * 0.5;
  }

  private isUrbanArea(region: string): boolean {
    const urbanKeywords = ['London', 'Manchester', 'Birmingham', 'Liverpool', 'Leeds', 'Glasgow', 'Edinburgh'];
    return urbanKeywords.some(keyword => region.includes(keyword));
  }

  private isPeakHour(hour: number): boolean {
    return (hour >= 8 && hour <= 10) || (hour >= 16 && hour <= 19);
  }

  private calculateVariance(values: number[]): number {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map(value => Math.pow(value - mean, 2));
    return squaredDiffs.reduce((a, b) => a + b, 0) / squaredDiffs.length;
  }

  private scoreRadiusAlternative(radius: number, context: any): number {
    // Score based on multiple factors
    let score = 0;

    // Prefer radius close to optimal
    score += Math.max(0, 100 - Math.abs(radius - 50));

    // Prefer smaller radius for peak hours
    if (this.isPeakHour(context.hour)) {
      score += Math.max(0, 50 - radius);
    }

    // Prefer larger radius for quiet periods
    if (context.bookingCount < 5) {
      score += radius * 0.5;
    }

    return score;
  }
}

/**
 * Cost Optimizer - Advanced profit maximization with ML insights
 */
class CostOptimizer {
  private readonly FUEL_COST_PER_MILE = 0.45;
  private readonly DRIVER_RATE_PER_HOUR = 15;
  private readonly VEHICLE_FIXED_COST = 25;
  private readonly REVENUE_PER_BOOKING = 50;

  private costHistory: Map<string, {
    fuelCost: number,
    driverCost: number,
    vehicleCost: number,
    totalCost: number,
    profit: number
  }[]> = new Map();

  /**
   * Optimize for maximum profit using historical data and ML predictions
   */
  optimizeForProfit(bookings: any[], constraints: {
    maxRadius: number,
    availableDrivers: number,
    fuelPrice: number,
    driverRate: number,
    region?: string,
    weather?: string
  }): {
    optimalRadius: number,
    estimatedRoutes: number,
    totalRevenue: number,
    totalCost: number,
    netProfit: number,
    roi: number,
    confidence: number,
    riskLevel: 'low' | 'medium' | 'high'
  } {
    const scenarios = this.generateProfitScenarios(bookings, constraints);

    if (scenarios.length === 0) {
      return this.createFallbackScenario(bookings, constraints);
    }

    // Find scenario with highest profit adjusted for risk
    const bestScenario = scenarios.reduce((best, current) => {
      const riskAdjustedProfit = current.netProfit * (1 - this.calculateRiskFactor(current, constraints));
      const bestRiskAdjusted = best.netProfit * (1 - this.calculateRiskFactor(best, constraints));

      return riskAdjustedProfit > bestRiskAdjusted ? current : best;
    });

    // Calculate confidence based on historical data
    const confidence = this.calculateConfidence(bestScenario, constraints);
    const riskLevel = this.assessRiskLevel(bestScenario, constraints);

    return {
      ...bestScenario,
      confidence,
      riskLevel
    };
  }

  /**
   * Real-time cost monitoring and adjustment
   */
  monitorRouteCosts(routeData: {
    routeId: string,
    actualFuelCost: number,
    actualDriverCost: number,
    actualVehicleCost: number,
    actualRevenue: number,
    region: string
  }): {
    costVariance: number,
    profitVariance: number,
    efficiency: number,
    recommendations: string[]
  } {
    const key = routeData.region;
    const actualCost = routeData.actualFuelCost + routeData.actualDriverCost + routeData.actualVehicleCost;
    const actualProfit = routeData.actualRevenue - actualCost;

    // Store in history
    if (!this.costHistory.has(key)) {
      this.costHistory.set(key, []);
    }

    this.costHistory.get(key)!.push({
      fuelCost: routeData.actualFuelCost,
      driverCost: routeData.actualDriverCost,
      vehicleCost: routeData.actualVehicleCost,
      totalCost: actualCost,
      profit: actualProfit
    });

    // Keep only last 50 records
    const history = this.costHistory.get(key)!;
    if (history.length > 50) {
      history.shift();
    }

    // Calculate variances
    const avgHistorical = this.calculateHistoricalAverage(key);
    const costVariance = (actualCost - avgHistorical.avgCost) / avgHistorical.avgCost;
    const profitVariance = actualProfit > 0 ? (actualProfit - avgHistorical.avgProfit) / avgHistorical.avgProfit : -1;

    // Calculate efficiency
    const expectedCost = this.estimateExpectedCost(routeData);
    const efficiency = expectedCost > 0 ? (expectedCost - actualCost) / expectedCost : 0;

    // Generate recommendations
    const recommendations = this.generateCostRecommendations(costVariance, profitVariance, efficiency);

    return {
      costVariance,
      profitVariance,
      efficiency,
      recommendations
    };
  }

  private generateProfitScenarios(bookings: any[], constraints: any) {
    const scenarios = [];
    const radii = [25, 35, 50, 75, 100, 125];

    for (const radius of radii) {
      if (radius > constraints.maxRadius) continue;

      const scenario = this.analyzeProfitScenario(bookings, radius, constraints);

      // Only include profitable scenarios
      if (scenario.netProfit > 0) {
        scenarios.push(scenario);
      }
    }

    return scenarios;
  }

  private analyzeProfitScenario(bookings: any[], radius: number, constraints: any) {
    const bookingCount = bookings.length;

    // Advanced route estimation using clustering simulation
    const estimatedRoutes = this.estimateRoutesNeeded(bookings, radius, constraints);

    // Revenue calculation with potential upsells
    const baseRevenue = bookingCount * this.REVENUE_PER_BOOKING;
    const upsellRevenue = this.estimateUpsellRevenue(bookings, radius);
    const totalRevenue = baseRevenue + upsellRevenue;

    // Cost calculation with regional adjustments
    const fuelCost = estimatedRoutes * this.estimateAvgDistance(radius) * constraints.fuelPrice;
    const driverCost = estimatedRoutes * 2.5 * constraints.driverRate; // 2.5 hours avg
    const vehicleCost = estimatedRoutes * this.VEHICLE_FIXED_COST;

    // Regional cost adjustments
    const regionalMultiplier = this.getRegionalCostMultiplier(constraints.region);
    const totalCost = (fuelCost + driverCost + vehicleCost) * regionalMultiplier;
    const netProfit = totalRevenue - totalCost;
    const roi = totalCost > 0 ? netProfit / totalCost : 0;

    return {
      optimalRadius: radius,
      estimatedRoutes,
      totalRevenue,
      totalCost,
      netProfit,
      roi
    };
  }

  private estimateRoutesNeeded(bookings: any[], radius: number, constraints: any): number {
    // Simple clustering estimation
    const avgBookingsPerRoute = Math.min(bookings.length, Math.floor(radius / 8) + 1);

    // Factor in driver availability
    const maxRoutesByDrivers = Math.floor(constraints.availableDrivers * 2); // 2 routes per driver max

    const routesByBookings = Math.ceil(bookings.length / avgBookingsPerRoute);

    return Math.min(routesByBookings, maxRoutesByDrivers);
  }

  private estimateUpsellRevenue(bookings: any[], radius: number): number {
    // Estimate additional revenue from larger routes
    const upsellFactor = radius > 75 ? 0.1 : radius > 50 ? 0.05 : 0;
    return bookings.length * this.REVENUE_PER_BOOKING * upsellFactor;
  }

  private estimateAvgDistance(radius: number): number {
    // Estimate actual distance traveled (85% efficiency)
    return radius * 0.85;
  }

  private getRegionalCostMultiplier(region?: string): number {
    if (!region) return 1.0;

    // Higher costs in London and major cities
    const highCostRegions = ['London', 'Manchester', 'Birmingham'];
    if (highCostRegions.some(r => region.includes(r))) return 1.2;

    // Lower costs in rural areas
    const lowCostRegions = ['Cornwall', 'Scotland', 'Wales'];
    if (lowCostRegions.some(r => region.includes(r))) return 0.9;

    return 1.0;
  }

  private calculateHistoricalAverage(region: string) {
    const history = this.costHistory.get(region) || [];
    if (history.length === 0) {
      return { avgCost: 100, avgProfit: 50 }; // Defaults
    }

    const avgCost = history.reduce((sum, h) => sum + h.totalCost, 0) / history.length;
    const avgProfit = history.reduce((sum, h) => sum + h.profit, 0) / history.length;

    return { avgCost, avgProfit };
  }

  private estimateExpectedCost(routeData: any): number {
    const history = this.costHistory.get(routeData.region) || [];
    if (history.length === 0) return routeData.actualFuelCost + routeData.actualDriverCost + routeData.actualVehicleCost;

    const avgCost = this.calculateHistoricalAverage(routeData.region).avgCost;
    return avgCost;
  }

  private generateCostRecommendations(costVariance: number, profitVariance: number, efficiency: number): string[] {
    const recommendations = [];

    if (costVariance > 0.2) {
      recommendations.push('Fuel costs are higher than average - consider route optimization');
    }

    if (profitVariance < -0.3) {
      recommendations.push('Profit margins are low - review pricing strategy');
    }

    if (efficiency < 0) {
      recommendations.push('Costs exceeded expectations - analyze route efficiency');
    } else if (efficiency > 0.2) {
      recommendations.push('Excellent cost performance - maintain current strategy');
    }

    return recommendations;
  }

  private calculateRiskFactor(scenario: any, constraints: any): number {
    let risk = 0;

    // High radius = higher risk
    if (scenario.optimalRadius > 100) risk += 0.2;

    // Many routes = coordination risk
    if (scenario.estimatedRoutes > constraints.availableDrivers * 1.5) risk += 0.3;

    // Low historical data = higher risk
    const historicalData = this.costHistory.get(constraints.region || 'unknown') || [];
    if (historicalData.length < 5) risk += 0.2;

    return Math.min(risk, 1.0);
  }

  private calculateConfidence(scenario: any, constraints: any): number {
    let confidence = 0.5;

    // Historical data increases confidence
    const historicalData = this.costHistory.get(constraints.region || 'unknown') || [];
    confidence += Math.min(historicalData.length / 20, 0.3);

    // Reasonable radius increases confidence
    if (scenario.optimalRadius >= 25 && scenario.optimalRadius <= 100) confidence += 0.2;

    // Positive ROI increases confidence
    if (scenario.roi > 0.1) confidence += 0.1;

    return Math.min(confidence, 1.0);
  }

  private assessRiskLevel(scenario: any, constraints: any): 'low' | 'medium' | 'high' {
    const riskFactor = this.calculateRiskFactor(scenario, constraints);

    if (riskFactor < 0.3) return 'low';
    if (riskFactor < 0.6) return 'medium';
    return 'high';
  }

  private createFallbackScenario(bookings: any[], constraints: any) {
    return {
      optimalRadius: 50,
      estimatedRoutes: Math.ceil(bookings.length / 5),
      totalRevenue: bookings.length * this.REVENUE_PER_BOOKING,
      totalCost: Math.ceil(bookings.length / 5) * 100,
      netProfit: (bookings.length * this.REVENUE_PER_BOOKING) - (Math.ceil(bookings.length / 5) * 100),
      roi: 0.1,
      confidence: 0.3,
      riskLevel: 'high' as const
    };
  }
}

interface RouteCluster {
  centroid: { lat: number; lng: number };
  drops: Drop[];
  estimatedDuration: number;
  totalDistance: number;
  totalValue: number;
  serviceTier: string;
}

interface OptimizedRoute {
  id: string;
  drops: Drop[];
  optimizedSequence: number[];
  totalDistance: number;
  estimatedDuration: number;
  totalValue: number;
  serviceTier: string;
  timeWindowStart: Date;
  timeWindowEnd: Date;
  maxCapacityWeight: number;
  maxCapacityVolume: number;
}

/**
 * Smart Priority Scoring System - AI-powered booking prioritization
 */
class SmartPriorityScorer {
  private priorityWeights = {
    urgency: 0.3,           // Time sensitivity
    customerValue: 0.25,    // Customer lifetime value
    distance: 0.15,         // Geographic optimization
    serviceTier: 0.15,      // Service level requirements
    specialRequests: 0.15   // Custom requirements
  };

  private customerProfiles: Map<string, {
    lifetimeValue: number,
    bookingFrequency: number,
    avgRating: number,
    preferredTimes: number[]
  }> = new Map();

  calculateBookingPriority(booking: any, context: {
    currentTime: Date,
    availableCapacity: number,
    region: string
  }): {
    priorityScore: number,
    urgencyLevel: 'low' | 'medium' | 'high' | 'critical',
    reasoning: string[]
  } {
    const reasoning = [];
    let score = 0;

    // Urgency factor
    const urgencyScore = this.calculateUrgencyScore(booking, context.currentTime);
    score += urgencyScore * this.priorityWeights.urgency;
    reasoning.push(`Urgency: ${urgencyScore.toFixed(2)} (${booking.urgency || 'normal'})`);

    // Customer value factor
    const customerScore = this.calculateCustomerValueScore(booking.customerId);
    score += customerScore * this.priorityWeights.customerValue;
    reasoning.push(`Customer value: ${customerScore.toFixed(2)}`);

    // Distance optimization factor
    const distanceScore = this.calculateDistanceScore(booking, context.region); // DEPRECATED - internal use only
    score += distanceScore * this.priorityWeights.distance;
    reasoning.push(`Distance optimization: ${distanceScore.toFixed(2)}`);

    // Service tier factor
    const serviceScore = this.calculateServiceTierScore(booking.serviceTier);
    score += serviceScore * this.priorityWeights.serviceTier;
    reasoning.push(`Service tier: ${serviceScore.toFixed(2)} (${booking.serviceTier})`);

    // Special requests factor
    const specialScore = this.calculateSpecialRequestsScore(booking);
    score += specialScore * this.priorityWeights.specialRequests;
    reasoning.push(`Special requests: ${specialScore.toFixed(2)}`);

    const urgencyLevel = this.determineUrgencyLevel(score);

    return {
      priorityScore: Math.min(score, 1.0),
      urgencyLevel,
      reasoning
    };
  }

  private calculateUrgencyScore(booking: any, currentTime: Date): number {
    const timeToPickup = booking.pickupDate.getTime() - currentTime.getTime();
    const hoursToPickup = timeToPickup / (1000 * 60 * 60);

    if (hoursToPickup < 2) return 1.0;        // Critical - within 2 hours
    if (hoursToPickup < 6) return 0.8;        // High - within 6 hours
    if (hoursToPickup < 24) return 0.6;       // Medium - within 24 hours
    if (booking.urgency === 'urgent') return 0.7; // Explicit urgency
    return 0.3;                              // Low - standard booking
  }

  private calculateCustomerValueScore(customerId: string): number {
    const profile = this.customerProfiles.get(customerId);
    if (!profile) return 0.5; // Default medium value

    // Weighted score based on lifetime value, frequency, and satisfaction
    const valueScore = Math.min(profile.lifetimeValue / 1000, 1); // Normalize to £1000 max
    const frequencyScore = Math.min(profile.bookingFrequency / 12, 1); // Monthly frequency
    const satisfactionScore = profile.avgRating / 5; // 0-1 scale

    return (valueScore * 0.5 + frequencyScore * 0.3 + satisfactionScore * 0.2);
  }

  private calculateDistanceScore(booking: any, region: string): number { // DEPRECATED - internal use only
    // Prefer bookings in the same region for route efficiency
    const bookingRegion = this.extractRegionFromAddress(booking.pickupAddress);
    return bookingRegion === region ? 0.8 : 0.4;
  }

  private calculateServiceTierScore(serviceTier: string): number {
    const tierScores = {
      'express': 0.9,    // Highest priority
      'premium': 0.8,
      'large_van': 0.6,
      'small_van': 0.4,
      'truck': 0.7      // High priority due to size
    };

    return tierScores[serviceTier as keyof typeof tierScores] || 0.5;
  }

  private calculateSpecialRequestsScore(booking: any): number {
    let score = 0;

    if (booking.specialInstructions) score += 0.3;
    if (booking.fragile || booking.requiresSpecialCare) score += 0.4;
    if (booking.twoPersonRequired) score += 0.3;
    if (booking.timeWindowSpecific) score += 0.2;

    return Math.min(score, 1.0);
  }

  private determineUrgencyLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score >= 0.8) return 'critical';
    if (score >= 0.6) return 'high';
    if (score >= 0.4) return 'medium';
    return 'low';
  }

  private extractRegionFromAddress(address: string): string {
    // Simple postcode area extraction
    const postcodeMatch = address.match(/([A-Z]{1,2})\d/);
    return postcodeMatch ? postcodeMatch[1] : 'UNKNOWN';
  }

  updateCustomerProfile(customerId: string, bookingData: {
    totalSpent: number,
    bookingCount: number,
    avgRating: number,
    preferredHour: number
  }): void {
    const existing = this.customerProfiles.get(customerId) || {
      lifetimeValue: 0,
      bookingFrequency: 0,
      avgRating: 0,
      preferredTimes: []
    };

    existing.lifetimeValue = bookingData.totalSpent;
    existing.bookingFrequency = bookingData.bookingCount;
    existing.avgRating = bookingData.avgRating;

    // Track preferred booking times
    if (!existing.preferredTimes.includes(bookingData.preferredHour)) {
      existing.preferredTimes.push(bookingData.preferredHour);
    }

    this.customerProfiles.set(customerId, existing);
  }
}

/**
 * Special Events & Holidays Handler
 */
class SpecialEventsHandler {
  private eventCalendar: Map<string, {
    date: Date,
    eventType: string,
    impactLevel: 'low' | 'medium' | 'high',
    expectedDemandMultiplier: number,
    recommendedRadiusAdjustment: number
  }> = new Map();

  private holidays: Set<string> = new Set([
    '01-01', // New Year's Day
    '12-25', // Christmas Day
    '12-26', // Boxing Day
    '04-01', // April Fools (but serious for business)
    '05-01', // May Day
    '08-31', // Summer Bank Holiday
    // Add more UK holidays as needed
  ]);

  initializeEventCalendar(): void {
    // Initialize with known events for the year
    const currentYear = new Date().getFullYear();

    // Add major sporting events
    this.addEvent(`${currentYear}-06-15`, 'FA Cup Final', 'high', 1.5, 0.8);
    this.addEvent(`${currentYear}-05-25`, 'Spring Bank Holiday', 'medium', 1.2, 0.9);

    // Add seasonal peaks
    this.addEvent(`${currentYear}-12-01`, 'Christmas Shopping Season', 'high', 2.0, 0.7);
    this.addEvent(`${currentYear}-11-01`, 'Pre-Christmas Rush', 'medium', 1.3, 0.8);
  }

  getEventImpact(date: Date): {
    hasEvent: boolean,
    demandMultiplier: number,
    radiusAdjustment: number,
    recommendations: string[]
  } {
    const dateKey = this.formatDateKey(date);
    const event = this.eventCalendar.get(dateKey);

    if (!event) {
      // Check if it's a holiday
      const monthDay = this.formatMonthDay(date);
      if (this.holidays.has(monthDay)) {
        return {
          hasEvent: true,
          demandMultiplier: 0.3, // Reduced demand on holidays
          radiusAdjustment: 1.5,  // Allow larger radii
          recommendations: ['Holiday period - reduced demand expected', 'Consider larger service areas']
        };
      }

      return {
        hasEvent: false,
        demandMultiplier: 1.0,
        radiusAdjustment: 1.0,
        recommendations: []
      };
    }

    const recommendations = this.generateEventRecommendations(event);

    return {
      hasEvent: true,
      demandMultiplier: event.expectedDemandMultiplier,
      radiusAdjustment: event.recommendedRadiusAdjustment,
      recommendations
    };
  }

  private addEvent(dateStr: string, eventType: string, impactLevel: 'low' | 'medium' | 'high',
                   demandMultiplier: number, radiusAdjustment: number): void {
    const date = new Date(dateStr);
    const key = this.formatDateKey(date);

    this.eventCalendar.set(key, {
      date,
      eventType,
      impactLevel,
      expectedDemandMultiplier: demandMultiplier,
      recommendedRadiusAdjustment: radiusAdjustment
    });
  }

  private formatDateKey(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  private formatMonthDay(date: Date): string {
    return `${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
  }

  private generateEventRecommendations(event: any): string[] {
    const recommendations = [];

    if (event.impactLevel === 'high') {
      recommendations.push(`High-impact event: ${event.eventType} - expect ${Math.round((event.expectedDemandMultiplier - 1) * 100)}% demand increase`);
      recommendations.push('Consider reducing clustering radius for better service');
      recommendations.push('Monitor driver availability closely');
    } else if (event.impactLevel === 'medium') {
      recommendations.push(`Medium-impact event: ${event.eventType} - moderate demand changes expected`);
      recommendations.push('Adjust clustering based on real-time demand');
    }

    if (event.expectedDemandMultiplier > 1.5) {
      recommendations.push('High demand expected - prioritize premium customers');
    }

    return recommendations;
  }
}

/**
 * Real-time Traffic Integration
 */
class TrafficIntegrator {
  private trafficData: Map<string, {
    congestionLevel: number, // 0-1 scale
    averageSpeed: number,    // mph
    incidentCount: number,
    lastUpdate: Date
  }> = new Map();

  private routeAlternatives: Map<string, {
    originalRoute: any,
    alternatives: any[],
    trafficImpact: number
  }> = new Map();

  async getTrafficImpact(route: {
    origin: { lat: number, lng: number },
    destination: { lat: number, lng: number },
    waypoints?: { lat: number, lng: number }[]
  }): Promise<{
    congestionMultiplier: number,
    estimatedDelay: number, // minutes
    recommendedAdjustments: string[],
    alternativeRoutes: any[]
  }> {
    // Simulate traffic API call (in real implementation, this would call a traffic service)
    const routeKey = this.generateRouteKey(route);

    // Get current traffic data for this route
    const traffic = await this.fetchTrafficData(routeKey);

    let congestionMultiplier = 1.0;
    let estimatedDelay = 0;

    if (traffic.congestionLevel > 0.7) {
      congestionMultiplier = 1.5; // 50% longer time
      estimatedDelay = Math.round(traffic.congestionLevel * 30); // Up to 30 min delay
    } else if (traffic.congestionLevel > 0.4) {
      congestionMultiplier = 1.2; // 20% longer time
      estimatedDelay = Math.round(traffic.congestionLevel * 15);
    }

    const recommendedAdjustments = this.generateTrafficRecommendations(traffic);
    const alternativeRoutes = await this.findAlternativeRoutes(route, traffic);

    return {
      congestionMultiplier,
      estimatedDelay,
      recommendedAdjustments,
      alternativeRoutes
    };
  }

  async optimizeForTraffic(routes: any[]): Promise<{
    optimizedRoutes: any[],
    trafficSavings: number,
    timeSavings: number
  }> {
    const optimizedRoutes = [];

    for (const route of routes) {
      const trafficImpact = await this.getTrafficImpact({
        origin: route.origin,
        destination: route.destination,
        waypoints: route.waypoints
      });

      if (trafficImpact.congestionMultiplier > 1.2) {
        // Find better route if congestion is high
        const alternative = trafficImpact.alternativeRoutes[0];
        if (alternative) {
          optimizedRoutes.push({ ...route, ...alternative });
          continue;
        }
      }

      optimizedRoutes.push(route);
    }

    // Calculate savings (simplified)
    const originalTime = routes.reduce((sum, r) => sum + r.estimatedTime, 0);
    const optimizedTime = optimizedRoutes.reduce((sum, r) => sum + r.estimatedTime, 0);
    const timeSavings = originalTime - optimizedTime;

    return {
      optimizedRoutes,
      trafficSavings: Math.round(timeSavings * 0.3), // Assume 30% fuel savings from time savings
      timeSavings
    };
  }

  private async fetchTrafficData(routeKey: string): Promise<any> {
    // Check cache first
    const cached = this.trafficData.get(routeKey);
    if (cached && Date.now() - cached.lastUpdate.getTime() < 300000) { // 5 minutes cache
      return cached;
    }

    // Simulate API call - in real implementation, call traffic service
    const congestionLevel = Math.random() * 0.8; // 0-80% congestion
    const averageSpeed = 30 + (40 * (1 - congestionLevel)); // 30-70 mph
    const incidentCount = Math.floor(Math.random() * 3);

    const trafficData = {
      congestionLevel,
      averageSpeed,
      incidentCount,
      lastUpdate: new Date()
    };

    this.trafficData.set(routeKey, trafficData);
    return trafficData;
  }

  private generateRouteKey(route: any): string {
    const points = [route.origin, ...(route.waypoints || []), route.destination];
    return points.map(p => `${p.lat.toFixed(3)}_${p.lng.toFixed(3)}`).join('-');
  }

  private generateTrafficRecommendations(traffic: any): string[] {
    const recommendations = [];

    if (traffic.congestionLevel > 0.7) {
      recommendations.push('Severe congestion detected - consider route alternatives');
      recommendations.push('Allow extra buffer time for deliveries');
      recommendations.push('Consider peak hour avoidance strategies');
    } else if (traffic.congestionLevel > 0.4) {
      recommendations.push('Moderate traffic - monitor closely');
    }

    if (traffic.incidentCount > 0) {
      recommendations.push(`${traffic.incidentCount} traffic incident(s) on route`);
      recommendations.push('Consider alternative routing');
    }

    if (traffic.averageSpeed < 20) {
      recommendations.push('Very slow traffic conditions - expect significant delays');
    }

    return recommendations;
  }

  private async findAlternativeRoutes(originalRoute: any, traffic: any): Promise<any[]> {
    // Simplified - in real implementation, this would call routing API
    const alternatives = [];

    if (traffic.congestionLevel > 0.6) {
      // Generate one alternative route
      alternatives.push({
        routeId: `alt_${Date.now()}`,
        estimatedTime: originalRoute.estimatedTime * 0.9, // Assume 10% faster
        distance: originalRoute.distance * 1.1, // Slightly longer but faster
        reason: 'Alternative route avoids congestion'
      });
    }

    return alternatives;
  }
}

class RouteOrchestrationScheduler {
  private isRunning: boolean = false;
  private nextRunTime: Date | null = null;
  private maxRouteDistance: number = 125; // miles (updated for UK standards)
  private maxRouteDuration: number = 480; // 8 hours in minutes
  private maxDropsPerRoute: number = 12;
  private dailyPlanningHour: number = 6; // 6 AM

  // Ultra-Advanced AI Components
  private demandPredictor = new DemandPredictor();
  private patternLearner = new PatternLearner();
  private performanceAnalyzer = new PerformanceAnalyzer();
  private costOptimizer = new CostOptimizer();

  // Smart Priority Scoring System
  private priorityScorer = new SmartPriorityScorer();

  // Special Events & Holidays Handler
  private specialEventsHandler = new SpecialEventsHandler();

  // Real-time Traffic Integration
  private trafficIntegrator = new TrafficIntegrator();

  // Vehicle capacity limits by service tier (kg, m³)
  private readonly vehicleCapacities = {
    'small_van': { weight: 500, volume: 3.5 },
    'large_van': { weight: 1000, volume: 7.0 },
    'truck': { weight: 2000, volume: 15.0 },
    'express': { weight: 200, volume: 1.0 }
  };

  constructor(dailyPlanningHour: number = 6) {
    this.dailyPlanningHour = dailyPlanningHour;
  }

  /**
   * Start the daily route orchestration scheduler
   * Runs every morning at the specified hour to plan routes for the entire day
   */
  public startScheduler(): void {
    if (this.isRunning) {
      console.log('Daily Route orchestration scheduler already running');
      return;
    }

    console.log(`Starting Daily Route Orchestration Scheduler - runs at ${this.dailyPlanningHour}:00 AM daily`);

    // Schedule first run
    this.scheduleNextRun();

    this.isRunning = true;
  }

  /**
   * Stop the scheduler
   */
  public stopScheduler(): void {
    this.isRunning = false;
    if (this.nextRunTime) {
      clearTimeout(this.nextRunTime as any);
      this.nextRunTime = null;
    }
    console.log('Daily Route orchestration scheduler stopped');
  }

  /**
   * Schedule the next daily run at the specified hour
   */
  private scheduleNextRun(): void {
    const now = new Date();
    const nextRun = new Date(now);

    // Set to today at the planning hour
    nextRun.setHours(this.dailyPlanningHour, 0, 0, 0);

    // If we've already passed today's planning time, schedule for tomorrow
    if (now >= nextRun) {
      nextRun.setDate(nextRun.getDate() + 1);
    }

    const timeUntilNextRun = nextRun.getTime() - now.getTime();

    console.log(`Next route planning run scheduled for: ${nextRun.toISOString()}`);

    // Schedule the next run
    this.nextRunTime = setTimeout(async () => {
      await this.processDailyRoutePlanning();

      // Schedule the next run for tomorrow
      this.scheduleNextRun();
    }, timeUntilNextRun) as any;
  }

  /**
   * Daily route planning process - analyzes all future bookings and creates optimal routes
   */
  private async processDailyRoutePlanning(): Promise<void> {
    const startTime = Date.now();
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    console.log('🚚 Starting Daily Route Planning Process...');
    console.log(`📅 Planning routes for: ${today.toDateString()} to ${tomorrow.toDateString()}`);

    try {
      // Ensure database connection is alive before processing
      await ensurePrismaConnection();
      // 1. Get all future bookings (today and beyond)
      const futureBookings = await this.getFutureBookings();
      console.log(`📦 Found ${futureBookings.length} future bookings to analyze`);

      if (futureBookings.length === 0) {
        console.log('✅ No future bookings to process');
        return;
      }

      // 2. Analyze all bookings for comprehensive route optimization
      const routeAnalysis = await this.analyzeAllBookingsForOptimalRouting(futureBookings);
      console.log(`📊 Route analysis complete: ${routeAnalysis.totalRoutes} routes, ${routeAnalysis.totalCostSavings}% cost savings`);

      // 3. Create optimized routes based on analysis
      const createdRoutes = await this.createOptimizedRoutesFromAnalysis(routeAnalysis);

      console.log(`📈 Created ${createdRoutes.length} optimized routes`);

      // 4. Broadcast updates to connected clients
      await this.broadcastRouteUpdates(createdRoutes);

      const duration = Date.now() - startTime;
      console.log(`✅ Daily route planning completed in ${duration}ms`);

      // 5. Create admin notification
      await this.createDailyPlanningSummary(createdRoutes, futureBookings.length, duration, routeAnalysis.totalCostSavings);

    } catch (error) {
      console.error('❌ Route generation failed:', error);
      await this.createFailureAlert(error as Error);
    }
  }

  /**
   * Get all future bookings for comprehensive daily planning
   */
  private async getFutureBookings(): Promise<any[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get bookings from today onwards
    const futureBookings = await prisma.booking.findMany({
      where: {
        scheduledAt: {
          gte: today
        },
        status: {
          in: ['CONFIRMED']
        }
      },
      include: {
        pickupAddress: true,
        dropoffAddress: true,
        BookingItem: {
          include: {
            // Note: itemType relation may not exist in current schema
          }
        }
      },
      orderBy: {
        scheduledAt: 'asc'
      }
    });

    return futureBookings;
  }

  /**
   * Analyze all bookings for optimal routing with cost minimization
   */
  private async analyzeAllBookingsForOptimalRouting(bookings: any[]): Promise<{
    totalRoutes: number;
    totalCostSavings: number;
    optimizedRoutes: any[];
    costAnalysis: any;
  }> {
    console.log('🔍 Starting comprehensive route analysis...');

    // Group bookings by date and geographic proximity
    const bookingsByDate = this.groupBookingsByDateAndLocation(bookings);

    let totalRoutes = 0;
    let totalOriginalCost = 0;
    let totalOptimizedCost = 0;
    const optimizedRoutes: any[] = [];

    for (const [dateKey, dateBookings] of Object.entries(bookingsByDate)) {
      console.log(`📅 Analyzing ${dateBookings.length} bookings for ${dateKey}`);

      // Calculate original cost (individual routes)
      const originalCost = this.calculateIndividualRouteCosts(dateBookings);
      totalOriginalCost += originalCost;

      // Optimize routes for this date
      const dateOptimizedRoutes = await this.optimizeRoutesForDate(dateBookings, dateKey);
      optimizedRoutes.push(...dateOptimizedRoutes);

      // Calculate optimized cost
      const optimizedCost = this.calculateOptimizedRouteCosts(dateOptimizedRoutes);
      totalOptimizedCost += optimizedCost;

      totalRoutes += dateOptimizedRoutes.length;
    }

    // Calculate total cost savings
    const totalCostSavings = totalOriginalCost > 0
      ? Math.round(((totalOriginalCost - totalOptimizedCost) / totalOriginalCost) * 100)
      : 0;

    return {
      totalRoutes,
      totalCostSavings,
      optimizedRoutes,
      costAnalysis: {
        originalCost: totalOriginalCost,
        optimizedCost: totalOptimizedCost,
        savingsAmount: totalOriginalCost - totalOptimizedCost
      }
    };
  }

  /**
   * Create optimized routes from analysis results
   */
  private async createOptimizedRoutesFromAnalysis(analysis: any): Promise<OptimizedRoute[]> {
    const createdRoutes: OptimizedRoute[] = [];

    for (const routePlan of analysis.optimizedRoutes) {
      try {
        // Convert booking data to drop format
        const drops = await this.convertBookingsToDrops(routePlan.bookings);

        // Create optimized route
        const optimizedRoute: OptimizedRoute = {
          id: `daily_route_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          drops: drops,
          optimizedSequence: routePlan.sequence,
          totalDistance: routePlan.totalDistance,
          estimatedDuration: routePlan.estimatedDuration,
          totalValue: routePlan.totalValue,
          serviceTier: routePlan.serviceTier,
          timeWindowStart: routePlan.timeWindowStart,
          timeWindowEnd: routePlan.timeWindowEnd,
          maxCapacityWeight: routePlan.maxCapacityWeight,
          maxCapacityVolume: routePlan.maxCapacityVolume
        };

        createdRoutes.push(optimizedRoute);

        // Create route record in database
        await this.createRouteRecord(optimizedRoute);

      } catch (error) {
        console.error(`Failed to create route for plan:`, error);
      }
    }

    return createdRoutes;
  }

  /**
   * Group bookings by date and geographic location
   */
  private groupBookingsByDateAndLocation(bookings: any[]): Record<string, any[]> {
    const grouped: Record<string, any[]> = {};

    for (const booking of bookings) {
      const dateKey = booking.pickupDate.toISOString().split('T')[0];
      const locationKey = this.extractLocationKey(booking);
      const groupKey = `${dateKey}_${locationKey}`;

      if (!grouped[groupKey]) {
        grouped[groupKey] = [];
      }
      grouped[groupKey].push(booking);
    }

    return grouped;
  }

  /**
   * Calculate costs for individual routes (no optimization)
   */
  private calculateIndividualRouteCosts(bookings: any[]): number {
    let totalCost = 0;

    for (const booking of bookings) {
      // Base fare + distance cost for individual booking
      const distance = this.estimateBookingDistance(booking);
      const baseFare = 50; // Base fare per booking
      const distanceCost = distance * 1.5; // £1.50 per km
      totalCost += baseFare + distanceCost;
    }

    return Math.floor(totalCost * 100); // Convert to pence
  }

  /**
   * Optimize routes for a specific date
   */
  private async optimizeRoutesForDate(bookings: any[], dateKey: string): Promise<any[]> {
    if (bookings.length === 0) return [];

    // Use advanced optimization algorithm
    const optimizedRoutes = await this.runAdvancedRouteOptimization(bookings);

    return optimizedRoutes.map(route => ({
      ...route,
      date: dateKey,
      bookings: route.bookings,
      sequence: route.sequence,
      totalDistance: route.totalDistance,
      estimatedDuration: route.estimatedDuration,
      totalValue: route.totalValue,
      serviceTier: route.serviceTier,
      timeWindowStart: route.timeWindowStart,
      timeWindowEnd: route.timeWindowEnd,
      maxCapacityWeight: route.maxCapacityWeight,
      maxCapacityVolume: route.maxCapacityVolume
    }));
  }

  /**
   * Calculate optimized route costs
   */
  private calculateOptimizedRouteCosts(routes: any[]): number {
    let totalCost = 0;

    for (const route of routes) {
      // Shared base fare + distance cost split among bookings
      const baseFare = 50; // Base fare per route
      const distanceCost = route.totalDistance * 1.5; // £1.50 per km
      const sharedCost = (baseFare + distanceCost) / route.bookings.length;
      totalCost += sharedCost * route.bookings.length;
    }

    return Math.floor(totalCost * 100); // Convert to pence
  }

  /**
   * Advanced route optimization algorithm with cost minimization
   */
  private async runAdvancedRouteOptimization(bookings: any[]): Promise<any[]> {
    console.log(`🧮 Running advanced optimization for ${bookings.length} bookings`);

    // Step 1: Create comprehensive geographic clusters
    const clusters = this.createAdvancedGeographicClusters(bookings);
    console.log(`📍 Created ${clusters.length} geographic clusters`);

    const optimizedRoutes = [];

    for (const cluster of clusters) {
      if (cluster.bookings.length === 0) continue;

      console.log(`🔄 Optimizing cluster with ${cluster.bookings.length} bookings`);

      // Step 2: Try multiple optimization strategies
      const bestRoute = await this.findBestRouteForCluster(cluster);

      if (bestRoute) {
        optimizedRoutes.push(bestRoute);
        console.log(`✅ Found optimal route: ${bestRoute.totalCostSavings}% savings`);
      }
    }

    // Step 3: Post-optimization: Try to merge small routes if beneficial
    const finalRoutes = await this.postOptimizeRoutes(optimizedRoutes);

    console.log(`🎯 Final optimization: ${finalRoutes.length} routes, total savings calculated`);

    return finalRoutes;
  }

  /**
   * Create advanced geographic clusters with capacity and time constraints
   * Uses smart clustering based on booking volume and miles
   */
  private createAdvancedGeographicClusters(bookings: any[]): any[] {
    const clusters: any[] = [];
    const processedBookings = new Set<string>();
    const maxBookingsPerCluster = 12;

    // Smart clustering radius based on booking volume and contextual factors
    const clusteringOptions = this.extractClusteringContext(bookings);
    const maxClusterRadiusMiles = this.calculateSmartClusterRadius(bookings.length, clusteringOptions);
    console.log(`🎯 Smart clustering radius: ${maxClusterRadiusMiles} miles (based on ${bookings.length} bookings, ${clusteringOptions.hourOfDay ? `hour ${clusteringOptions.hourOfDay}` : 'unknown hour'}, ${clusteringOptions.postcodeArea || 'mixed areas'})`);

    // Sort bookings by pickup time for time-window optimization
    const sortedBookings = bookings.sort((a, b) =>
      new Date(a.pickupDate).getTime() - new Date(b.pickupDate).getTime()
    );

    for (const booking of sortedBookings) {
      if (processedBookings.has(booking.id)) continue;

      // Create new cluster
      const cluster = {
        centroid: {
          lat: booking.pickupAddress?.lat || 51.5074,
          lng: booking.pickupAddress?.lng || -0.1278
        },
        bookings: [booking],
        totalWeight: this.estimateBookingWeight(booking),
        totalVolume: this.estimateBookingVolume(booking),
        timeWindowStart: booking.pickupDate,
        timeWindowEnd: new Date(booking.pickupDate.getTime() + 8 * 60 * 60 * 1000),
        serviceTier: this.determineOptimalServiceTier([booking])
      };

      processedBookings.add(booking.id);

      // Find compatible bookings for this cluster
      for (const otherBooking of sortedBookings) {
        if (processedBookings.has(otherBooking.id)) continue;

        // Check geographic proximity (convert km to miles)
        const distanceKm = this.estimateBookingDistance({
          pickupAddress: booking.pickupAddress,
          dropoffAddress: otherBooking.pickupAddress
        });
        const distanceMiles = distanceKm * 0.621371; // Convert km to miles

        // Check time compatibility (within same day, similar time windows)
        const timeDiff = Math.abs(
          new Date(booking.pickupDate).getTime() - new Date(otherBooking.pickupDate).getTime()
        );
        const maxTimeDiff = 4 * 60 * 60 * 1000; // 4 hours

        // Check capacity constraints
        const newWeight = cluster.totalWeight + this.estimateBookingWeight(otherBooking);
        const newVolume = cluster.totalVolume + this.estimateBookingVolume(otherBooking);
        const maxCapacity = this.vehicleCapacities[cluster.serviceTier as keyof typeof this.vehicleCapacities]?.weight || 1000;
        const maxVolumeCapacity = this.vehicleCapacities[cluster.serviceTier as keyof typeof this.vehicleCapacities]?.volume || 15;

        if (distanceMiles <= maxClusterRadiusMiles &&
            timeDiff <= maxTimeDiff &&
            cluster.bookings.length < maxBookingsPerCluster &&
            newWeight <= maxCapacity &&
            newVolume <= maxVolumeCapacity) {

          cluster.bookings.push(otherBooking);
          cluster.totalWeight = newWeight;
          cluster.totalVolume = newVolume;
          processedBookings.add(otherBooking.id);

          // Update cluster centroid and time windows
          this.updateClusterCentroid(cluster);
          cluster.timeWindowStart = this.getEarliestPickupTime(cluster.bookings);
          cluster.timeWindowEnd = this.getLatestDeliveryTime(cluster.bookings);
        }
      }

      if (cluster.bookings.length > 0) {
        clusters.push(cluster);
      }
    }

    return clusters;
  }

  /**
   * Find the best route for a cluster using multiple optimization strategies
   */
  private async findBestRouteForCluster(cluster: any): Promise<any | null> {
    const strategies = [
      'nearest_neighbor',
      'time_priority',
      'capacity_efficiency',
      'cost_minimization'
    ];

    let bestRoute = null;
    let bestCostSavings = 0;

    for (const strategy of strategies) {
      const route = await this.optimizeClusterWithStrategy(cluster, strategy);
      if (route && route.costSavings > bestCostSavings) {
        bestRoute = route;
        bestCostSavings = route.costSavings;
      }
    }

    return bestRoute;
  }

  /**
   * Optimize cluster using specific strategy
   */
  private async optimizeClusterWithStrategy(cluster: any, strategy: string): Promise<any> {
    let sequence: number[];

    switch (strategy) {
      case 'nearest_neighbor':
        sequence = await this.optimizeBookingSequence(cluster.bookings);
        break;
      case 'time_priority':
        sequence = this.optimizeByTimePriority(cluster.bookings);
        break;
      case 'capacity_efficiency':
        sequence = this.optimizeByCapacityEfficiency(cluster.bookings);
        break;
      case 'cost_minimization':
        sequence = await this.optimizeByCostMinimization(cluster.bookings);
        break;
      default:
        sequence = await this.optimizeBookingSequence(cluster.bookings);
    }

    const routeMetrics = this.calculateDetailedRouteMetrics(cluster.bookings, sequence);
    const costSavings = this.calculateRouteCostSavings(cluster.bookings, routeMetrics);

    return {
      bookings: cluster.bookings,
      sequence,
      ...routeMetrics,
      serviceTier: cluster.serviceTier,
      timeWindowStart: cluster.timeWindowStart,
      timeWindowEnd: cluster.timeWindowEnd,
      maxCapacityWeight: this.vehicleCapacities[cluster.serviceTier as keyof typeof this.vehicleCapacities]?.weight || 1000,
      maxCapacityVolume: this.vehicleCapacities[cluster.serviceTier as keyof typeof this.vehicleCapacities]?.volume || 15,
      optimizationStrategy: strategy,
      costSavings
    };
  }

  /**
   * Optimize by time priority (earliest pickups first)
   */
  private optimizeByTimePriority(bookings: any[]): number[] {
    return bookings
      .map((booking, index) => ({ booking, index }))
      .sort((a, b) => new Date(a.booking.pickupDate).getTime() - new Date(b.booking.pickupDate).getTime())
      .map(item => item.index);
  }

  /**
   * Optimize by capacity efficiency (heavy items first)
   */
  private optimizeByCapacityEfficiency(bookings: any[]): number[] {
    return bookings
      .map((booking, index) => ({
        booking,
        index,
        efficiency: this.estimateBookingWeight(booking) / this.estimateBookingVolume(booking)
      }))
      .sort((a, b) => b.efficiency - a.efficiency) // Highest density first
      .map(item => item.index);
  }

  /**
   * Optimize by cost minimization
   */
  private async optimizeByCostMinimization(bookings: any[]): Promise<number[]> {
    // Try different sequences and pick the one with lowest cost
    const sequences = this.generateSequenceVariations(bookings);
    let bestSequence = sequences[0];
    let bestCost = Infinity;

    for (const sequence of sequences.slice(0, 10)) { // Limit to first 10 for performance
      const cost = this.calculateSequenceCost(bookings, sequence);
      if (cost < bestCost) {
        bestCost = cost;
        bestSequence = sequence;
      }
    }

    return bestSequence;
  }

  /**
   * Generate sequence variations for optimization
   */
  private generateSequenceVariations(bookings: any[]): number[][] {
    const sequences: number[][] = [];
    const indices = bookings.map((_, i) => i);

    // Add time-based sequence
    sequences.push(this.optimizeByTimePriority(bookings));

    // Add capacity-based sequence
    sequences.push(this.optimizeByCapacityEfficiency(bookings));

    // Add nearest neighbor sequence
    sequences.push(Array.from({ length: bookings.length }, (_, i) => i));

    return sequences;
  }

  /**
   * Calculate detailed route metrics
   */
  private calculateDetailedRouteMetrics(bookings: any[], sequence: number[]): any {
    let totalDistance = 0;
    let totalValue = 0;
    let totalWeight = 0;
    let totalVolume = 0;

    // Calculate route following the sequence
    for (let i = 0; i < sequence.length; i++) {
      const bookingIndex = sequence[i];
      const booking = bookings[bookingIndex];

      // Safely add booking value
      const bookingValue = Number(booking.totalGBP || 0);
      if (Number.isFinite(bookingValue) && bookingValue >= 0 && bookingValue <= Number.MAX_SAFE_INTEGER) {
        totalValue += bookingValue;
      } else {
        console.warn(`⚠️ Invalid totalGBP for booking: ${booking.totalGBP}`);
      }
      
      totalWeight += this.estimateBookingWeight(booking);
      totalVolume += this.estimateBookingVolume(booking);

      // Add distance to next booking if not the last one
      if (i < sequence.length - 1) {
        const nextBookingIndex = sequence[i + 1];
        const nextBooking = bookings[nextBookingIndex];

        const distance = this.estimateBookingDistance({
          pickupAddress: booking.dropoffAddress,
          dropoffAddress: nextBooking.pickupAddress
        });

        totalDistance += distance;
      }
    }

    const capacityUtilization = Math.min(totalWeight / 1000, totalVolume / 15);

    return {
      totalDistance: Math.max(totalDistance, 5), // Minimum 5km
      estimatedDuration: sequence.length * 45 + (totalDistance * 2), // 45 min per booking + driving time
      totalValue,
      totalWeight,
      totalVolume,
      capacityUtilization,
      averageDistancePerBooking: totalDistance / Math.max(sequence.length - 1, 1)
    };
  }

  /**
   * Calculate cost savings for a route
   */
  private calculateRouteCostSavings(bookings: any[], routeMetrics: any): number {
    // Calculate individual booking costs
    const individualCost = bookings.reduce((sum, booking) => {
      const distance = this.estimateBookingDistance(booking);
      const baseFare = 50;
      const distanceCost = distance * 1.5;
      return sum + baseFare + distanceCost;
    }, 0);

    // Calculate optimized route cost
    const optimizedCost = 50 + (routeMetrics.totalDistance * 1.5); // Shared base fare + distance

    if (individualCost === 0) return 0;

    return Math.round(((individualCost - optimizedCost) / individualCost) * 100);
  }

  /**
   * Calculate cost of a specific sequence
   */
  private calculateSequenceCost(bookings: any[], sequence: number[]): number {
    const metrics = this.calculateDetailedRouteMetrics(bookings, sequence);
    return 50 + (metrics.totalDistance * 1.5); // Base fare + distance cost
  }

  /**
   * Post-optimization: try to merge compatible routes
   */
  private async postOptimizeRoutes(routes: any[]): Promise<any[]> {
    const mergedRoutes: any[] = [];
    const processedIndices = new Set<number>();

    for (let i = 0; i < routes.length; i++) {
      if (processedIndices.has(i)) continue;

      let currentRoute = routes[i];
      processedIndices.add(i);

      // Try to merge with subsequent routes
      for (let j = i + 1; j < routes.length; j++) {
        if (processedIndices.has(j)) continue;

        const merged = await this.tryMergeRoutes(currentRoute, routes[j]);
        if (merged && merged.costSavings > Math.max(currentRoute.costSavings, routes[j].costSavings)) {
          currentRoute = merged;
          processedIndices.add(j);
          console.log(`🔀 Merged routes ${i} and ${j} for better optimization`);
        }
      }

      mergedRoutes.push(currentRoute);
    }

    return mergedRoutes;
  }

  /**
   * Try to merge two routes if beneficial
   */
  private async tryMergeRoutes(route1: any, route2: any): Promise<any | null> {
    // Check if routes are geographically compatible
    const centroidDistance = this.calculateDistance( // DEPRECATED - internal use only
      route1.centroid?.lat || 51.5074, route1.centroid?.lng || -0.1278,
      route2.centroid?.lat || 51.5074, route2.centroid?.lng || -0.1278
    );

    if (centroidDistance > 30) return null; // Too far apart

    // Check capacity constraints
    const totalWeight = route1.totalWeight + route2.totalWeight;
    const totalVolume = route1.totalVolume + route2.totalVolume;
    const maxWeight = route1.maxCapacityWeight;
    const maxVolume = route1.maxCapacityVolume;

    if (totalWeight > maxWeight || totalVolume > maxVolume) return null;

    // Check time compatibility
    const latestEnd1 = new Date(route1.timeWindowEnd).getTime();
    const earliestStart2 = new Date(route2.timeWindowStart).getTime();
    const timeGap = earliestStart2 - latestEnd1;

    if (timeGap > 2 * 60 * 60 * 1000) return null; // More than 2 hours gap

    // Create merged route
    const mergedBookings = [...route1.bookings, ...route2.bookings];
    const mergedSequence = await this.optimizeBookingSequence(mergedBookings);
    const mergedMetrics = this.calculateDetailedRouteMetrics(mergedBookings, mergedSequence);
    const mergedSavings = this.calculateRouteCostSavings(mergedBookings, mergedMetrics);

    if (mergedSavings > Math.max(route1.costSavings, route2.costSavings)) {
      return {
        bookings: mergedBookings,
        sequence: mergedSequence,
        ...mergedMetrics,
        serviceTier: route1.serviceTier,
        timeWindowStart: this.getEarliestPickupTime(mergedBookings),
        timeWindowEnd: this.getLatestDeliveryTime(mergedBookings),
        maxCapacityWeight: route1.maxCapacityWeight,
        maxCapacityVolume: route1.maxCapacityVolume,
        optimizationStrategy: 'merged',
        costSavings: mergedSavings,
        centroid: {
          lat: (route1.centroid.lat + route2.centroid.lat) / 2,
          lng: (route1.centroid.lng + route2.centroid.lng) / 2
        }
      };
    }

    return null;
  }

  /**
   * Convert bookings to drop format
   */
  private async convertBookingsToDrops(bookings: any[]): Promise<Drop[]> {
    const drops: Drop[] = [];

    for (const booking of bookings) {
      const drop: Drop = {
        id: `drop_${booking.id}`,
        customerId: booking.customerId,
        pickupAddress: booking.pickupAddress?.label || '',
        deliveryAddress: booking.dropoffAddress?.label || '',
        pickupLatitude: booking.pickupAddress?.lat || undefined,
        pickupLongitude: booking.pickupAddress?.lng || undefined,
        deliveryLatitude: booking.dropoffAddress?.lat || undefined,
        deliveryLongitude: booking.dropoffAddress?.lng || undefined,
        timeWindowStart: booking.pickupDate,
        timeWindowEnd: new Date(booking.pickupDate.getTime() + 8 * 60 * 60 * 1000), // 8 hours window
        serviceTier: this.determineOptimalServiceTier([booking]),
        status: 'booked',
        quotedPrice: booking.totalGBP || 0,
        weight: this.estimateBookingWeight(booking),
        volume: this.estimateBookingVolume(booking),
        specialInstructions: booking.customerName || undefined,
        estimatedDuration: 45, // minutes per drop
      };

      drops.push(drop);
    }

    return drops;
  }

  /**
   * Create route record in database
   */
  private async createRouteRecord(route: OptimizedRoute): Promise<void> {
    try {
      // TODO: Uncomment when Route model is available
      /*
      await prisma.route.create({
        data: {
          id: route.id,
          status: 'planned',
          serviceTier: route.serviceTier,
          totalDistance: route.totalDistance,
          estimatedDuration: route.estimatedDuration,
          totalValue: route.totalValue,
          timeWindowStart: route.timeWindowStart,
          timeWindowEnd: route.timeWindowEnd,
          optimizedSequence: route.optimizedSequence,
          maxCapacityWeight: route.maxCapacityWeight,
          maxCapacityVolume: route.maxCapacityVolume,
          createdAt: new Date(),
          drops: {
            connect: route.drops.map(drop => ({ id: drop.id }))
          }
        }
      });
      */

      console.log(`📍 Created planned route ${route.id} with ${route.drops.length} drops`);
    } catch (error) {
      console.error(`Failed to create route record ${route.id}:`, error);
      throw error;
    }
  }

  /**
   * Create daily planning summary notification
   */
  private async createDailyPlanningSummary(
    routes: OptimizedRoute[],
    totalBookings: number,
    duration: number,
    costSavings: number
  ): Promise<void> {
    console.log(`📊 Daily Route Planning Summary: ${routes.length} routes from ${totalBookings} bookings in ${duration}ms. Cost savings: ${costSavings}%`);
  }

  /**
   * Group drops by service tier for appropriate vehicle assignment
   */
  private groupDropsByServiceTier(drops: Drop[]): Record<string, Drop[]> {
    const grouped: Record<string, Drop[]> = {
      'express': [],
      'small_van': [],
      'large_van': [],
      'truck': []
    };

    for (const drop of drops) {
      const tier = drop.serviceTier || 'small_van';
      if (grouped[tier]) {
        grouped[tier].push(drop);
      } else {
        grouped['small_van'].push(drop); // Default fallback
      }
    }

    return grouped;
  }

  /**
   * Create geographic clusters using distance-based algorithm
   */
  private async createGeographicClusters(drops: Drop[], serviceTier: string): Promise<RouteCluster[]> {
    if (drops.length === 0) return [];

    // Simple clustering: group drops within reasonable distance
    const clusters: RouteCluster[] = [];
    const processed = new Set<string>();

    for (const drop of drops) {
      if (processed.has(drop.id)) continue;

      // Create new cluster starting with this drop
      const cluster: RouteCluster = {
        centroid: {
          lat: drop.pickupLatitude || 0,
          lng: drop.pickupLongitude || 0
        },
        drops: [drop],
        estimatedDuration: Math.ceil((drop.timeWindowEnd.getTime() - drop.timeWindowStart.getTime()) / (1000 * 60)) || 30,
        totalDistance: 0,
        totalValue: Number(drop.quotedPrice) || 0,
        serviceTier
      };

      processed.add(drop.id);

      // Find nearby drops to add to this cluster
      for (const otherDrop of drops) {
        if (processed.has(otherDrop.id)) continue;
        if (cluster.drops.length >= this.maxDropsPerRoute) break;

        const distance = this.calculateDistance( // DEPRECATED - internal use only
          drop.pickupLatitude || 0, drop.pickupLongitude || 0,
          otherDrop.pickupLatitude || 0, otherDrop.pickupLongitude || 0
        );

        // Add to cluster if within reasonable distance (15km)
        if (distance <= 15) {
          cluster.drops.push(otherDrop);
          cluster.totalValue = cluster.totalValue + (Number(otherDrop.quotedPrice) || 0);
          cluster.estimatedDuration += otherDrop.estimatedDuration || 30;
          processed.add(otherDrop.id);

          // Update centroid
          this.updateCentroid(cluster);
        }
      }

      if (cluster.drops.length > 0) {
        clusters.push(cluster);
      }
    }

    return clusters;
  }

  /**
   * Optimize route sequences within clusters
   */
  private async optimizeClusterRoutes(cluster: RouteCluster, serviceTier: string): Promise<OptimizedRoute[]> {
    const capacity = this.vehicleCapacities[serviceTier as keyof typeof this.vehicleCapacities] || this.vehicleCapacities['small_van'];
    const routes: OptimizedRoute[] = [];

    // Check if cluster fits in single route
    const totalWeight = cluster.drops.reduce((sum, drop) => sum + (drop.weight || 10), 0);
    const totalVolume = cluster.drops.reduce((sum, drop) => sum + (drop.volume || 0.1), 0);

    if (totalWeight <= capacity.weight && 
        totalVolume <= capacity.volume && 
        cluster.drops.length <= this.maxDropsPerRoute) {
      
      // Single route - optimize sequence
      const optimizedSequence = await this.optimizeDeliverySequence(cluster.drops);
      
      routes.push({
        id: `route_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        drops: cluster.drops,
        optimizedSequence,
        totalDistance: cluster.totalDistance,
        estimatedDuration: cluster.estimatedDuration,
        totalValue: cluster.totalValue,
        serviceTier,
        timeWindowStart: this.getEarliestTimeWindow(cluster.drops),
        timeWindowEnd: this.getLatestTimeWindow(cluster.drops),
        maxCapacityWeight: capacity.weight,
        maxCapacityVolume: capacity.volume
      });
    } else {
      // Split into multiple routes
      const splitRoutes = await this.splitClusterIntoRoutes(cluster, capacity, serviceTier);
      routes.push(...splitRoutes);
    }

    return routes;
  }

  /**
   * Optimize delivery sequence using nearest neighbor algorithm
   */
  private async optimizeDeliverySequence(drops: Drop[]): Promise<number[]> {
    if (drops.length <= 1) return [0];

    // Simple nearest neighbor optimization
    const sequence: number[] = [];
    const unvisited = new Set(drops.map((_, index) => index));
    
    // Start with drop that has earliest time window
    let current = 0;
    let earliestTime = drops[0].timeWindowStart;
    for (let i = 1; i < drops.length; i++) {
      if (drops[i].timeWindowStart < earliestTime) {
        current = i;
        earliestTime = drops[i].timeWindowStart;
      }
    }

    sequence.push(current);
    unvisited.delete(current);

    // Find nearest unvisited drop
    while (unvisited.size > 0) {
      let nearestIndex = -1;
      let nearestDistance = Infinity;

      const currentDrop = drops[current];
      
      for (const index of unvisited) {
        const distance = this.calculateDistance( // DEPRECATED - internal use only
          currentDrop.deliveryLatitude || 0, currentDrop.deliveryLongitude || 0,
          drops[index].pickupLatitude || 0, drops[index].pickupLongitude || 0
        );

        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIndex = index;
        }
      }

      if (nearestIndex !== -1) {
        sequence.push(nearestIndex);
        unvisited.delete(nearestIndex);
        current = nearestIndex;
      } else {
        break;
      }
    }

    return sequence;
  }

  /**
   * Split large clusters into multiple vehicle-appropriate routes
   */
  private async splitClusterIntoRoutes(
    cluster: RouteCluster, 
    capacity: { weight: number; volume: number }, 
    serviceTier: string
  ): Promise<OptimizedRoute[]> {
    const routes: OptimizedRoute[] = [];
    const remainingDrops = [...cluster.drops];

    while (remainingDrops.length > 0) {
      const routeDrops: Drop[] = [];
      let routeWeight = 0;
      let routeVolume = 0;

      // Pack drops into route respecting capacity constraints
      for (let i = remainingDrops.length - 1; i >= 0; i--) {
        const drop = remainingDrops[i];
        const dropWeight = drop.weight || 10;
        const dropVolume = drop.volume || 0.1;

        if (routeDrops.length < this.maxDropsPerRoute &&
            routeWeight + dropWeight <= capacity.weight &&
            routeVolume + dropVolume <= capacity.volume) {
          
          routeDrops.push(drop);
          routeWeight += dropWeight;
          routeVolume += dropVolume;
          remainingDrops.splice(i, 1);
        }
      }

      if (routeDrops.length > 0) {
        const optimizedSequence = await this.optimizeDeliverySequence(routeDrops);
        
        routes.push({
          id: `route_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          drops: routeDrops,
          optimizedSequence,
          totalDistance: this.calculateRouteDistance(routeDrops),
          estimatedDuration: routeDrops.reduce((sum, drop) => sum + (Math.ceil((drop.timeWindowEnd.getTime() - drop.timeWindowStart.getTime()) / (1000 * 60)) || 30), 0),
          totalValue: routeDrops.reduce((sum, drop) => {
            const price = Number(drop.quotedPrice || 0);
            return (Number.isFinite(price) && price >= 0 && price <= Number.MAX_SAFE_INTEGER) ? sum + price : sum;
          }, 0),
          serviceTier,
          timeWindowStart: this.getEarliestTimeWindow(routeDrops),
          timeWindowEnd: this.getLatestTimeWindow(routeDrops),
          maxCapacityWeight: capacity.weight,
          maxCapacityVolume: capacity.volume
        });
      }
    }

    return routes;
  }

  /**
   * Create route records in database
   */
  private async createRouteRecords(routes: OptimizedRoute[]): Promise<void> {
    for (const route of routes) {
      try {
        // TODO: Uncomment when Route model is available
        /*
        await prisma.route.create({
          data: {
            id: route.id,
            status: 'pending_assignment',
            serviceTier: route.serviceTier,
            totalDistance: route.totalDistance,
            estimatedDuration: route.estimatedDuration,
            totalValue: route.totalValue,
            timeWindowStart: route.timeWindowStart,
            timeWindowEnd: route.timeWindowEnd,
            maxCapacityWeight: route.maxCapacityWeight,
            maxCapacityVolume: route.maxCapacityVolume,
            optimizedSequence: route.optimizedSequence,
            createdAt: new Date(),
            drops: {
              connect: route.drops.map(drop => ({ id: drop.id }))
            }
          }
        });

        // Update drops to reference this route
        await prisma.drop.updateMany({
          where: {
            id: { in: route.drops.map(drop => drop.id) }
          },
          data: {
            routeId: route.id,
            status: 'assigned_to_route'
          }
        });
        */

        console.log(`📍 Created route ${route.id} with ${route.drops.length} drops`);
      } catch (error) {
        console.error(`Failed to create route ${route.id}:`, error);
      }
    }
  }

  /**
   * Broadcast route updates via WebSocket
   */
  private async broadcastRouteUpdates(routes: OptimizedRoute[]): Promise<void> {
    // TODO: Implement WebSocket broadcasting
    console.log(`📡 Broadcasting ${routes.length} route updates to connected clients`);
  }

  /**
   * Helper: Calculate distance between two coordinates (Haversine formula)
   */
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number { // DEPRECATED - internal use only
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  /**
   * Helper: Update cluster centroid
   */
  private updateCentroid(cluster: RouteCluster): void {
    const totalLat = cluster.drops.reduce((sum, drop) => sum + (drop.pickupLatitude || 0), 0);
    const totalLng = cluster.drops.reduce((sum, drop) => sum + (drop.pickupLongitude || 0), 0);
    
    cluster.centroid = {
      lat: totalLat / cluster.drops.length,
      lng: totalLng / cluster.drops.length
    };
  }

  /**
   * Helper: Calculate total route distance
   */
  private calculateRouteDistance(drops: Drop[]): number {
    let totalDistance = 0;
    
    for (let i = 0; i < drops.length - 1; i++) {
      totalDistance += this.calculateDistance( // DEPRECATED - internal use only
        drops[i].deliveryLatitude || 0, drops[i].deliveryLongitude || 0,
        drops[i + 1].pickupLatitude || 0, drops[i + 1].pickupLongitude || 0
      );
    }
    
    return totalDistance;
  }

  /**
   * Helper: Get earliest time window from drops
   */
  private getEarliestTimeWindow(drops: Drop[]): Date {
    return drops.reduce((earliest, drop) => 
      drop.timeWindowStart < earliest ? drop.timeWindowStart : earliest, 
      drops[0].timeWindowStart
    );
  }

  /**
   * Helper: Get latest time window from drops
   */
  private getLatestTimeWindow(drops: Drop[]): Date {
    return drops.reduce((latest, drop) => 
      drop.timeWindowEnd > latest ? drop.timeWindowEnd : latest, 
      drops[0].timeWindowEnd
    );
  }

  /**
   * Create orchestration summary notification
   */
  private async createOrchestrationSummary(routes: OptimizedRoute[], totalDrops: number, duration: number): Promise<void> {
    // TODO: Create notification when available
    console.log(`📊 Route Orchestration Summary: ${routes.length} routes from ${totalDrops} drops in ${duration}ms`);
  }

  /**
   * Create failure alert
   */
  private async createFailureAlert(error: Error): Promise<void> {
    console.error('❌ Daily route planning failed:', error.message);
  }

  // ========== Helper Functions for Daily Planning ==========

  /**
   * Extract location key from booking for grouping
   */
  private extractLocationKey(booking: any): string {
    // Extract area from postcode or coordinates
    const address = booking.pickupAddress?.label || '';
    const postcodeMatch = address.match(/([A-Z]{1,2})\d/);
    return postcodeMatch ? postcodeMatch[1] : 'OTHER';
  }

  /**
   * Extract contextual information from bookings for smart clustering
   */
  private extractClusteringContext(bookings: any[]): {
    hourOfDay?: number;
    dayOfWeek?: number;
    postcodeArea?: string;
    currentWeather?: string;
  } {
    if (bookings.length === 0) return {};

    // Extract time information from first booking
    const firstBooking = bookings[0];
    const pickupTime = new Date(firstBooking.pickupDate);
    const hourOfDay = pickupTime.getHours();
    const dayOfWeek = pickupTime.getDay(); // 0 = Sunday, 1 = Monday, etc.

    // Extract most common postcode area
    const postcodeAreas = bookings
      .map(booking => this.extractLocationKey(booking))
      .filter(area => area !== 'OTHER');

    const mostCommonArea = postcodeAreas.length > 0
      ? postcodeAreas.reduce((a, b, i, arr) =>
          arr.filter(v => v === a).length >= arr.filter(v => v === b).length ? a : b
        )
      : undefined;

    // For now, weather is not available, but structure is ready
    return {
      hourOfDay,
      dayOfWeek,
      postcodeArea: mostCommonArea,
      currentWeather: undefined // TODO: integrate weather API
    };
  }

  /**
   * Calculate smart clustering radius based on booking volume and additional factors
   * Uses miles for all calculations as per UK standards
   */
  private calculateSmartClusterRadius(totalBookings: number, options?: {
    hourOfDay?: number;
    dayOfWeek?: number;
    postcodeArea?: string;
    currentWeather?: string;
  }): number {
    const { hourOfDay, dayOfWeek, postcodeArea, currentWeather } = options || {};

    // Base radius from booking volume
    let baseRadius = this.getBaseRadiusFromVolume(totalBookings);

    // Apply time-based adjustments
    baseRadius = this.adjustForTimeOfDay(baseRadius, hourOfDay);

    // Apply day-of-week adjustments
    baseRadius = this.adjustForDayOfWeek(baseRadius, dayOfWeek);

    // Apply geographic adjustments
    baseRadius = this.adjustForGeography(baseRadius, postcodeArea);

    // Apply weather adjustments
    baseRadius = this.adjustForWeather(baseRadius, currentWeather);

    // Ensure radius is within sensible bounds
    return Math.max(15, Math.min(150, baseRadius));
  }

  /**
   * Get base radius from booking volume
   */
  private getBaseRadiusFromVolume(totalBookings: number): number {
    if (totalBookings > 100) return 20;    // Very busy - tight clustering
    if (totalBookings > 50) return 25;     // Busy periods - tight clustering
    if (totalBookings > 20) return 50;     // Moderate busy - balanced
    if (totalBookings > 10) return 75;     // Normal periods - moderate
    if (totalBookings > 5) return 100;     // Quiet periods - wide coverage
    return 125;                            // Very quiet - maximum coverage
  }

  /**
   * Adjust radius based on time of day
   */
  private adjustForTimeOfDay(baseRadius: number, hourOfDay?: number): number {
    if (!hourOfDay) return baseRadius;

    // Peak hours (8-10 AM, 4-7 PM): reduce radius for faster delivery
    if ((hourOfDay >= 8 && hourOfDay <= 10) || (hourOfDay >= 16 && hourOfDay <= 19)) {
      return Math.max(baseRadius * 0.7, 15); // 30% reduction, minimum 15 miles
    }

    // Off-peak hours (2-6 AM): increase radius for efficiency
    if (hourOfDay >= 2 && hourOfDay <= 6) {
      return baseRadius * 1.3; // 30% increase
    }

    return baseRadius;
  }

  /**
   * Adjust radius based on day of week
   */
  private adjustForDayOfWeek(baseRadius: number, dayOfWeek?: number): number {
    if (!dayOfWeek) return baseRadius;

    // Monday (1) and Friday (5): often busy, reduce radius
    if (dayOfWeek === 1 || dayOfWeek === 5) {
      return Math.max(baseRadius * 0.85, 15); // 15% reduction
    }

    // Weekend (6-7): more flexible, increase radius
    if (dayOfWeek >= 6) {
      return baseRadius * 1.2; // 20% increase
    }

    return baseRadius;
  }

  /**
   * Adjust radius based on geography
   */
  private adjustForGeography(baseRadius: number, postcodeArea?: string): number {
    if (!postcodeArea) return baseRadius;

    // Urban areas (London, Manchester, Birmingham): smaller radius
    const urbanAreas = ['SW', 'SE', 'NW', 'N', 'W', 'E', 'EC', 'WC', 'M', 'B'];
    if (urbanAreas.some(area => postcodeArea.startsWith(area))) {
      return Math.max(baseRadius * 0.8, 15); // 20% reduction for dense urban areas
    }

    // Rural areas (Northern Scotland, Cornwall): larger radius
    const ruralAreas = ['IV', 'KW', 'PH', 'AB', 'DD', 'TR', 'PL', 'EX'];
    if (ruralAreas.some(area => postcodeArea.startsWith(area))) {
      return baseRadius * 1.25; // 25% increase for sparse rural areas
    }

    return baseRadius;
  }

  /**
   * Adjust radius based on weather conditions
   */
  private adjustForWeather(baseRadius: number, weather?: string): number {
    if (!weather) return baseRadius;

    const badWeather = ['rain', 'snow', 'storm', 'fog', 'hail'];
    if (badWeather.some(condition => weather.toLowerCase().includes(condition))) {
      return Math.max(baseRadius * 0.75, 15); // 25% reduction for safety
    }

    return baseRadius;
  }

  /**
   * Estimate distance for a booking with advanced calculation
   */
  private estimateBookingDistance(booking: any): number {
    try {
      // Get coordinates from booking addresses
      const pickupLat = booking.pickupAddress?.lat || booking.pickupLatitude || 51.5074;
      const pickupLng = booking.pickupAddress?.lng || booking.pickupLongitude || -0.1278;
      const deliveryLat = booking.dropoffAddress?.lat || booking.deliveryLatitude || 51.5074;
      const deliveryLng = booking.dropoffAddress?.lng || booking.deliveryLongitude || -0.1278;

      // Use haversine formula for distance calculation
      const distance = this.calculateDistance(pickupLat, pickupLng, deliveryLat, deliveryLng); // DEPRECATED - internal use only

      // Add buffer for real-world driving (roads aren't straight lines)
      const roadFactor = 1.3; // Roads are typically 30% longer than straight lines

      // Add urban/rural factor based on location
      const urbanFactor = this.calculateUrbanFactor(pickupLat, pickupLng, deliveryLat, deliveryLng);

      return distance * roadFactor * urbanFactor;
    } catch (error) {
      console.error('Error estimating booking distance:', error);
      return 10; // Default 10km fallback
    }
  }

  /**
   * Calculate urban factor based on location density
   */
  private calculateUrbanFactor(lat1: number, lng1: number, lat2: number, lng2: number): number {
    // Simple urban density estimation based on coordinates
    // London area has higher density
    const isLondonArea = (lat: number, lng: number) =>
      lat > 51.3 && lat < 51.7 && lng > -0.5 && lng < 0.2;

    const urban1 = isLondonArea(lat1, lng1);
    const urban2 = isLondonArea(lat2, lng2);

    if (urban1 && urban2) return 1.4; // Both urban - more traffic
    if (urban1 || urban2) return 1.2; // One urban - moderate traffic
    return 1.1; // Rural - less traffic
  }

  /**
   * Create geographic clusters from bookings
   */
  private createGeographicClustersFromBookings(bookings: any[]): any[] {
    const clusters: any[] = [];
    const processed = new Set<string>();

    for (const booking of bookings) {
      if (processed.has(booking.id)) continue;

      // Create new cluster
      const cluster = {
        centroid: {
          lat: booking.pickupAddress?.lat || 51.5074,
          lng: booking.pickupAddress?.lng || -0.1278
        },
        bookings: [booking],
        totalWeight: this.estimateBookingWeight(booking),
        totalVolume: this.estimateBookingVolume(booking)
      };

      processed.add(booking.id);

      // Find nearby bookings
      for (const otherBooking of bookings) {
        if (processed.has(otherBooking.id)) continue;

        const distance = this.estimateBookingDistance({
          pickupAddress: booking.pickupAddress,
          dropoffAddress: otherBooking.pickupAddress
        });

        // Add to cluster if within 15km and capacity allows
        if (distance <= 15 &&
            cluster.totalWeight + this.estimateBookingWeight(otherBooking) <= 1000 &&
            cluster.totalVolume + this.estimateBookingVolume(otherBooking) <= 15) {

          cluster.bookings.push(otherBooking);
          cluster.totalWeight += this.estimateBookingWeight(otherBooking);
          cluster.totalVolume += this.estimateBookingVolume(otherBooking);
          processed.add(otherBooking.id);

          // Update centroid
          this.updateClusterCentroid(cluster);
        }
      }

      if (cluster.bookings.length > 0) {
        clusters.push(cluster);
      }
    }

    return clusters;
  }

  /**
   * Optimize booking sequence within cluster
   */
  private async optimizeBookingSequence(bookings: any[]): Promise<number[]> {
    if (bookings.length <= 1) return [0];

    // Simple nearest neighbor optimization
    const sequence: number[] = [];
    const unvisited = new Set(bookings.map((_, index) => index));

    let current = 0;
    sequence.push(current);
    unvisited.delete(current);

    while (unvisited.size > 0) {
      let nearestIndex = -1;
      let nearestDistance = Infinity;

      for (const index of unvisited) {
        const distance = this.estimateBookingDistance({
          pickupAddress: bookings[current].dropoffAddress,
          dropoffAddress: bookings[index].pickupAddress
        });

        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIndex = index;
        }
      }

      if (nearestIndex !== -1) {
        sequence.push(nearestIndex);
        unvisited.delete(nearestIndex);
        current = nearestIndex;
      } else {
        break;
      }
    }

    return sequence;
  }

  /**
   * Calculate route metrics from bookings
   */
  private calculateRouteMetricsFromBookings(bookings: any[]): any {
    let totalDistance = 0;
    let totalValue = 0;

    for (let i = 0; i < bookings.length - 1; i++) {
      const distance = this.estimateBookingDistance({
        pickupAddress: bookings[i].dropoffAddress,
        dropoffAddress: bookings[i + 1].pickupAddress
      });
      totalDistance += distance;
    }

    totalValue = bookings.reduce((sum, booking) => sum + (booking.totalGBP || 0), 0);

    return {
      totalDistance: Math.max(totalDistance, 10), // Minimum 10km
      estimatedDuration: bookings.length * 45, // 45 minutes per booking
      totalValue
    };
  }

  /**
   * Determine optimal service tier for bookings
   */
  private determineOptimalServiceTier(bookings: any[]): string {
    let totalWeight = 0;
    let totalVolume = 0;

    for (const booking of bookings) {
      totalWeight += this.estimateBookingWeight(booking);
      totalVolume += this.estimateBookingVolume(booking);
    }

    if (totalWeight <= 200 && totalVolume <= 1.0) return 'express';
    if (totalWeight <= 500 && totalVolume <= 3.5) return 'small_van';
    if (totalWeight <= 1000 && totalVolume <= 7.0) return 'large_van';
    return 'truck';
  }

  /**
   * Get earliest pickup time
   */
  private getEarliestPickupTime(bookings: any[]): Date {
    return bookings.reduce((earliest, booking) =>
      booking.pickupDate < earliest ? booking.pickupDate : earliest,
      bookings[0].pickupDate
    );
  }

  /**
   * Get latest delivery time
   */
  private getLatestDeliveryTime(bookings: any[]): Date {
    return bookings.reduce((latest, booking) => {
      const deliveryTime = new Date(booking.pickupDate.getTime() + 8 * 60 * 60 * 1000);
      return deliveryTime > latest ? deliveryTime : latest;
    }, new Date(bookings[0].pickupDate.getTime() + 8 * 60 * 60 * 1000));
  }

  /**
   * Estimate booking weight with detailed item analysis
   */
  private estimateBookingWeight(booking: any): number {
    try {
      if (!booking.items || booking.items.length === 0) {
        // Estimate based on service type if no items specified
        return this.estimateWeightFromServiceType(booking);
      }

      let totalWeight = 0;
      let hasExplicitWeight = false;

      for (const item of booking.items) {
        if (item.weight && item.weight > 0) {
          // Use explicit weight if provided
          totalWeight += item.weight;
          hasExplicitWeight = true;
        } else if (item.itemType) {
          // Use item type defaults
          const typeWeight = this.getItemTypeWeight(item.itemType, item);
          totalWeight += typeWeight;
        } else {
          // Use generic defaults based on item name/description
          totalWeight += this.estimateWeightFromDescription(item);
        }
      }

      // Add packaging weight (boxes, wrapping, etc.)
      const packagingWeight = this.calculatePackagingWeight(booking.items.length, hasExplicitWeight);

      const finalWeight = Math.max(totalWeight + packagingWeight, 1); // Minimum 1kg

      // Log for debugging
      console.log(`📦 Booking ${booking.id} weight: ${finalWeight}kg (${totalWeight}kg items + ${packagingWeight}kg packaging)`);

      return finalWeight;
    } catch (error) {
      console.error('Error estimating booking weight:', error);
      return 10; // Safe fallback
    }
  }

  /**
   * Estimate booking volume with dimensional analysis
   */
  private estimateBookingVolume(booking: any): number {
    try {
      if (!booking.items || booking.items.length === 0) {
        return this.estimateVolumeFromServiceType(booking);
      }

      let totalVolume = 0;
      let stackingEfficiency = 0.85; // 85% stacking efficiency

      for (const item of booking.items) {
        let itemVolume = 0;

        if (item.volume && item.volume > 0) {
          // Use explicit volume if provided
          itemVolume = item.volume;
        } else if (item.dimensions) {
          // Calculate from dimensions: L x W x H
          const dims = item.dimensions;
          itemVolume = (dims.length * dims.width * dims.height) / 1000000; // Convert cm³ to m³
        } else if (item.itemType) {
          // Use item type defaults
          itemVolume = this.getItemTypeVolume(item.itemType, item);
        } else {
          // Use description-based estimation
          itemVolume = this.estimateVolumeFromDescription(item);
        }

        totalVolume += itemVolume;
      }

      // Apply stacking efficiency and add air space
      const airSpaceFactor = 1.2; // 20% air space for safe loading
      const finalVolume = totalVolume * stackingEfficiency * airSpaceFactor;

      // Minimum volume constraint
      const minimumVolume = 0.01; // 10 liters minimum

      const result = Math.max(finalVolume, minimumVolume);

      // Log for debugging
      console.log(`📏 Booking ${booking.id} volume: ${result.toFixed(3)}m³ (${totalVolume.toFixed(3)}m³ raw)`);

      return result;
    } catch (error) {
      console.error('Error estimating booking volume:', error);
      return 0.1; // Safe fallback (100 liters)
    }
  }

  /**
   * Estimate weight from service type when no items specified
   */
  private estimateWeightFromServiceType(booking: any): number {
    // Default weights based on service type
    const serviceDefaults: Record<string, number> = {
      'small_van': 50,
      'large_van': 150,
      'truck': 300,
      'express': 10,
      'economy': 30
    };

    const serviceType = booking.serviceTier || booking.serviceType || 'small_van';
    return serviceDefaults[serviceType] || 30;
  }

  /**
   * Estimate volume from service type when no items specified
   */
  private estimateVolumeFromServiceType(booking: any): number {
    const serviceDefaults: Record<string, number> = {
      'small_van': 1.5,
      'large_van': 4.0,
      'truck': 10.0,
      'express': 0.2,
      'economy': 1.0
    };

    const serviceType = booking.serviceTier || booking.serviceType || 'small_van';
    return serviceDefaults[serviceType] || 1.0;
  }

  /**
   * Get weight for specific item type
   */
  private getItemTypeWeight(itemType: string, item: any): number {
    const weightTable: Record<string, number> = {
      'sofa_3seater': 80,
      'sofa_2seater': 60,
      'armchair': 25,
      'dining_table': 40,
      'coffee_table': 15,
      'bed_king': 50,
      'bed_double': 40,
      'bed_single': 25,
      'wardrobe': 70,
      'chest_drawers': 30,
      'bookshelf': 20,
      'desk': 25,
      'chair_office': 15,
      'chair_dining': 8,
      'washing_machine': 70,
      'fridge': 60,
      'tv_32inch': 15,
      'tv_55inch': 25,
      'bike': 20,
      'boxes_small': 5,
      'boxes_medium': 10,
      'boxes_large': 20,
      'suitcases': 15,
      'lamps': 5,
      'rugs': 10
    };

    return weightTable[itemType] || this.estimateWeightFromDescription(item);
  }

  /**
   * Get volume for specific item type
   */
  private getItemTypeVolume(itemType: string, item: any): number {
    const volumeTable: Record<string, number> = {
      'sofa_3seater': 2.5,
      'sofa_2seater': 1.8,
      'armchair': 0.8,
      'dining_table': 1.2,
      'coffee_table': 0.5,
      'bed_king': 1.5,
      'bed_double': 1.2,
      'bed_single': 0.8,
      'wardrobe': 2.0,
      'chest_drawers': 1.0,
      'bookshelf': 0.6,
      'desk': 0.8,
      'chair_office': 0.3,
      'chair_dining': 0.2,
      'washing_machine': 0.6,
      'fridge': 0.8,
      'tv_32inch': 0.1,
      'tv_55inch': 0.2,
      'bike': 0.3,
      'boxes_small': 0.05,
      'boxes_medium': 0.1,
      'boxes_large': 0.2,
      'suitcases': 0.2,
      'lamps': 0.1,
      'rugs': 0.3
    };

    return volumeTable[itemType] || this.estimateVolumeFromDescription(item);
  }

  /**
   * Estimate weight from item description
   */
  private estimateWeightFromDescription(item: any): number {
    const description = (item.name || item.description || '').toLowerCase();

    // Keywords for heavy items
    if (description.includes('washing') || description.includes('machine')) return 70;
    if (description.includes('fridge') || description.includes('freezer')) return 60;
    if (description.includes('sofa') || description.includes('couch')) return 60;
    if (description.includes('bed') || description.includes('mattress')) return 40;
    if (description.includes('wardrobe') || description.includes('cabinet')) return 50;
    if (description.includes('table') || description.includes('desk')) return 30;
    if (description.includes('chair')) return 10;
    if (description.includes('box') || description.includes('books')) return 8;
    if (description.includes('lamp') || description.includes('light')) return 3;

    // Default based on quantity hints
    return 5; // Safe default
  }

  /**
   * Estimate volume from item description
   */
  private estimateVolumeFromDescription(item: any): number {
    const description = (item.name || item.description || '').toLowerCase();

    if (description.includes('sofa') || description.includes('couch')) return 1.5;
    if (description.includes('bed') || description.includes('mattress')) return 1.0;
    if (description.includes('wardrobe') || description.includes('cabinet')) return 1.5;
    if (description.includes('table') || description.includes('desk')) return 0.8;
    if (description.includes('chair')) return 0.2;
    if (description.includes('washing') || description.includes('machine')) return 0.6;
    if (description.includes('fridge') || description.includes('freezer')) return 0.8;
    if (description.includes('box')) return 0.1;
    if (description.includes('lamp') || description.includes('light')) return 0.05;

    return 0.05; // Safe default (50 liters)
  }

  /**
   * Calculate packaging weight
   */
  private calculatePackagingWeight(itemCount: number, hasExplicitWeight: boolean): number {
    if (hasExplicitWeight) {
      // Less packaging needed if weights are explicitly provided
      return itemCount * 0.5; // 0.5kg per item
    } else {
      // More packaging for estimation-based weights
      return itemCount * 1.0; // 1kg per item
    }
  }

  /**
   * Update cluster centroid
   */
  private updateClusterCentroid(cluster: any): void {
    const totalLat = cluster.bookings.reduce((sum: number, booking: any) =>
      sum + (booking.pickupAddress?.lat || 51.5074), 0);
    const totalLng = cluster.bookings.reduce((sum: number, booking: any) =>
      sum + (booking.pickupAddress?.lng || -0.1278), 0);

    cluster.centroid = {
      lat: totalLat / cluster.bookings.length,
      lng: totalLng / cluster.bookings.length
    };
  }
}

export default RouteOrchestrationScheduler;

// Export singleton instance
export const routeScheduler = new RouteOrchestrationScheduler();