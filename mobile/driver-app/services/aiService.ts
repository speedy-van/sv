import AsyncStorage from '@react-native-async-storage/async-storage';

// AI Service for driver assistance features
// Integrates with the backend AI endpoint for smart recommendations

export interface DriverLocation {
  lat: number;
  lng: number;
  address?: string;
}

export interface ActiveJob {
  id: string;
  reference: string;
  pickup: {
    address: string;
    lat: number;
    lng: number;
    time: string;
  };
  dropoff: {
    address: string;
    lat: number;
    lng: number;
    time: string;
  };
  earnings: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  vehicleType?: string;
}

export interface DriverConstraints {
  maxDrivingHours?: number; // hours remaining today
  fuelEfficiency?: boolean; // prioritize fuel efficiency
  trafficAware?: boolean; // consider live traffic
  avoidTolls?: boolean;
  preferredRoutes?: string[]; // preferred road types
  weatherAware?: boolean; // consider weather conditions
}

export interface DriverPreferences {
  preferredSpeed?: number;
  riskTolerance?: 'low' | 'medium' | 'high';
  fuelPriority?: number; // 0-1
  timePriority?: number; // 0-1
}

export interface WeatherConditions {
  temperature?: number;
  conditions?: string; // rain, snow, clear, etc.
  visibility?: string; // good, poor, etc.
}

export interface AISuggestion {
  id: string;
  type: 'route_optimization' | 'job_reordering' | 'fuel_efficiency' | 'rest_recommendation';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  estimatedSavings?: {
    time?: string; // "15 minutes saved"
    distance?: string; // "3.2 miles shorter"
    fuel?: string; // "0.8L saved"
    earnings?: string; // "£12.50 additional"
  };
  actions: Array<{
    label: string;
    action: string; // action identifier
    primary?: boolean;
  }>;
  confidence: number; // 0-1
  timestamp: string;
  expiresAt?: string; // when suggestion expires
}

// Real-time AI monitoring and analysis
class AIRealTimeMonitor {
  private static instance: AIRealTimeMonitor;
  private locationSubscription?: any;
  private lastLocation?: DriverLocation;
  private activeJobs: ActiveJob[] = [];
  private suggestions: AISuggestion[] = [];
  private lastAnalysisTime = 0;
  private readonly analysisInterval = 30000; // Analyze every 30 seconds
  private weatherData?: WeatherConditions;
  private trafficData?: any;

  static getInstance(): AIRealTimeMonitor {
    if (!AIRealTimeMonitor.instance) {
      AIRealTimeMonitor.instance = new AIRealTimeMonitor();
    }
    return AIRealTimeMonitor.instance;
  }

  startMonitoring(activeJobs: ActiveJob[], onSuggestion?: (suggestion: AISuggestion) => void) {
    this.activeJobs = activeJobs;

    // Clear any existing monitoring
    this.stopMonitoring();

    // Start location monitoring
    this.locationSubscription = setInterval(async () => {
      await this.performRealTimeAnalysis(onSuggestion);
    }, this.analysisInterval);
  }

  stopMonitoring() {
    if (this.locationSubscription) {
      clearInterval(this.locationSubscription);
      this.locationSubscription = undefined;
    }
  }

  updateJobs(activeJobs: ActiveJob[]) {
    this.activeJobs = activeJobs;
  }

  updateLocation(location: DriverLocation) {
    this.lastLocation = location;
  }

  private async performRealTimeAnalysis(onSuggestion?: (suggestion: AISuggestion) => void) {
    if (!this.lastLocation || this.activeJobs.length === 0) return;

    try {
      const now = Date.now();
      if (now - this.lastAnalysisTime < this.analysisInterval) return;
      this.lastAnalysisTime = now;

      // Fetch real-time data
      await this.updateWeatherAndTraffic();

      // Analyze current route efficiency
      const routeAnalysis = await this.analyzeRouteEfficiency();

      // Generate suggestions based on real conditions
      const newSuggestions = await this.generateRealTimeSuggestions(routeAnalysis);

      // Filter out expired suggestions and add new ones
      this.suggestions = this.suggestions.filter(s => {
        return !s.expiresAt || new Date(s.expiresAt) > new Date();
      });

      // Add new suggestions
      for (const suggestion of newSuggestions) {
        // Avoid duplicate suggestions
        const existing = this.suggestions.find(s => s.id === suggestion.id);
        if (!existing) {
          this.suggestions.push(suggestion);
          onSuggestion?.(suggestion);

          // Emit telemetry
          this.emitTelemetry('ai_suggestion_triggered', {
            suggestionType: suggestion.type,
            confidence: suggestion.confidence,
            priority: suggestion.priority
          });
        }
      }

    } catch (error) {
      console.warn('Real-time AI analysis failed:', error);
    }
  }

  private async updateWeatherAndTraffic() {
    if (!this.lastLocation) return;

    try {
      // Get weather data
      const weatherResponse = await fetch(`https://speedy-van.co.uk/api/weather`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: this.lastLocation,
          includeForecast: true,
          includeAlerts: true
        })
      });

      if (weatherResponse.ok) {
        this.weatherData = await weatherResponse.json();
      }

      // Get traffic data for active routes
      if (this.activeJobs.length > 0) {
        const route = {
          origin: this.lastLocation,
          destination: this.activeJobs[0].dropoff,
          waypoints: this.activeJobs.slice(1).map(job => job.dropoff)
        };

        const trafficResponse = await fetch(`https://speedy-van.co.uk/api/traffic`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            route,
            includeIncidents: true,
            dataSource: 'live'
          })
        });

        if (trafficResponse.ok) {
          this.trafficData = await trafficResponse.json();
        }
      }

    } catch (error) {
      console.warn('Failed to update weather/traffic data:', error);
    }
  }

  private async analyzeRouteEfficiency(): Promise<any> {
    if (!this.lastLocation || this.activeJobs.length === 0) return null;

    const currentJob = this.activeJobs[0];
    const distanceToPickup = this.calculateDistance(
      this.lastLocation,
      { lat: currentJob.pickup.lat, lng: currentJob.pickup.lng }
    );

    const analysis = {
      distanceToPickup,
      trafficDelay: this.trafficData?.delay || 0,
      weatherImpact: this.weatherData?.conditions === 'rain' || this.weatherData?.conditions === 'snow' ? 5 : 0,
      isIdle: false,
      lastMovement: Date.now()
    };

    return analysis;
  }

  private calculateDistance(point1: { lat: number; lng: number }, point2: { lat: number; lng: number }): number {
    const R = 3959; // Earth's radius in miles
    const dLat = this.toRadians(point2.lat - point1.lat);
    const dLon = this.toRadians(point2.lng - point1.lng);
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(this.toRadians(point1.lat)) * Math.cos(this.toRadians(point2.lat)) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  private async generateRealTimeSuggestions(routeAnalysis: any): Promise<AISuggestion[]> {
    const suggestions: AISuggestion[] = [];

    if (!routeAnalysis) return suggestions;

    // Traffic-based suggestions
    if (routeAnalysis.trafficDelay > 10) {
      suggestions.push({
        id: `traffic_${Date.now()}`,
        type: 'route_optimization',
        title: 'Heavy Traffic Ahead',
        description: `Traffic delay of ${routeAnalysis.trafficDelay} minutes detected. Consider alternative route via A3212.`,
        priority: 'high',
        estimatedSavings: { time: `${Math.round(routeAnalysis.trafficDelay * 0.3)} minutes` },
        actions: [
          { label: 'Show Alternative Route', action: 'show_alternative_route', primary: true },
          { label: 'Dismiss', action: 'dismiss_traffic_alert' }
        ],
        confidence: 0.85,
        timestamp: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 minutes
      });
    }

    // Weather-based suggestions
    if (routeAnalysis.weatherImpact > 0) {
      suggestions.push({
        id: `weather_${Date.now()}`,
        type: 'route_optimization',
        title: `${this.weatherData?.conditions?.toUpperCase()} Detected`,
        description: `${this.weatherData?.conditions} conditions may affect ETA. Plan for +${routeAnalysis.weatherImpact} minute delay.`,
        priority: 'medium',
        estimatedSavings: { time: 'Adjust expectations' },
        actions: [
          { label: 'Update Customer', action: 'update_customer_eta', primary: true },
          { label: 'Check Conditions', action: 'check_weather_details' }
        ],
        confidence: 0.75,
        timestamp: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString() // 15 minutes
      });
    }

    // Idle detection
    if (routeAnalysis.distanceToPickup < 0.1) { // Within 0.1 miles of pickup
      const idleTime = (Date.now() - routeAnalysis.lastMovement) / 1000 / 60; // minutes
      if (idleTime > 5) {
        suggestions.push({
          id: `idle_${Date.now()}`,
          type: 'job_reordering',
          title: 'Extended Idle Time',
          description: `You've been near pickup location for ${Math.round(idleTime)} minutes. Please confirm job status.`,
          priority: 'urgent',
          actions: [
            { label: 'Confirm Arrival', action: 'confirm_arrival', primary: true },
            { label: 'Contact Customer', action: 'contact_customer' }
          ],
          confidence: 0.95,
          timestamp: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5 minutes
        });
      }
    }

    return suggestions;
  }

  private emitTelemetry(event: string, data: any) {
    // Store telemetry locally for batch sending
    AsyncStorage.getItem('ai_telemetry').then(existing => {
      const telemetry = existing ? JSON.parse(existing) : [];
      telemetry.push({
        event,
        timestamp: new Date().toISOString(),
        data
      });

      // Keep only last 100 events
      if (telemetry.length > 100) {
        telemetry.splice(0, telemetry.length - 100);
      }

      AsyncStorage.setItem('ai_telemetry', JSON.stringify(telemetry));
    }).catch(console.warn);
  }

  getActiveSuggestions(): AISuggestion[] {
    return this.suggestions.filter(s =>
      !s.expiresAt || new Date(s.expiresAt) > new Date()
    );
  }
}

// Rate limiting for AI requests
class AIRateLimiter {
  private static instance: AIRateLimiter;
  private requests: Map<string, number[]> = new Map();
  private readonly maxRequestsPerMinute = 5; // Conservative limit for AI calls
  private readonly windowMs = 60 * 1000; // 1 minute

  static getInstance(): AIRateLimiter {
    if (!AIRateLimiter.instance) {
      AIRateLimiter.instance = new AIRateLimiter();
    }
    return AIRateLimiter.instance;
  }

  canMakeRequest(type: string): boolean {
    const now = Date.now();
    const userRequests = this.requests.get(type) || [];

    // Remove old requests outside the window
    const validRequests = userRequests.filter(
      timestamp => now - timestamp < this.windowMs
    );

    // Check if under limit
    if (validRequests.length >= this.maxRequestsPerMinute) {
      return false;
    }

    // Add current request
    validRequests.push(now);
    this.requests.set(type, validRequests);

    return true;
  }

  getRemainingRequests(type: string): number {
    const userRequests = this.requests.get(type) || [];
    const now = Date.now();
    const validRequests = userRequests.filter(
      timestamp => now - timestamp < this.windowMs
    );

    return Math.max(0, this.maxRequestsPerMinute - validRequests.length);
  }

  getResetTime(type: string): number {
    const userRequests = this.requests.get(type) || [];
    if (userRequests.length === 0) return 0;

    const oldestRequest = Math.min(...userRequests);
    return oldestRequest + this.windowMs;
  }
}

class AIService {
  private rateLimiter = AIRateLimiter.getInstance();
  private baseUrl = 'https://speedy-van.co.uk/api'; // Update this based on your environment

  // Cache for AI responses (simple in-memory cache)
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private readonly cacheTTL = 5 * 60 * 1000; // 5 minutes

  // Get cached data if available and not expired
  private getCached(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > cached.ttl) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  // Set cache data
  private setCached(key: string, data: any, ttl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.cacheTTL
    });
  }

  // Generate cache key for requests
  private generateCacheKey(
    type: string,
    location: DriverLocation,
    jobs: ActiveJob[],
    constraints: DriverConstraints
  ): string {
    const locationKey = `${location.lat.toFixed(4)},${location.lng.toFixed(4)}`;
    const jobsKey = jobs.map(j => j.id).sort().join(',');
    const constraintsKey = JSON.stringify(constraints);
    return `${type}_${locationKey}_${jobsKey}_${constraintsKey}`;
  }

  // Core AI request method
  private async makeAIRequest(
    requestType: 'route_optimization' | 'job_reordering' | 'fuel_efficiency' | 'rest_recommendations',
    data: any
  ): Promise<any> {
    // Check rate limiting
    if (!this.rateLimiter.canMakeRequest(requestType)) {
      const resetTime = this.rateLimiter.getResetTime(requestType);
      const waitTime = Math.ceil((resetTime - Date.now()) / 1000);

      throw new Error(`Rate limit exceeded. Try again in ${waitTime} seconds.`);
    }

    try {
      const response = await fetch(`${this.baseUrl}/ai/driver-assist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requestType,
          ...data
        })
      });

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('AI service temporarily unavailable. Please try again later.');
        }
        if (response.status === 503) {
          throw new Error('AI service is currently unavailable.');
        }
        throw new Error(`AI service error: ${response.status}`);
      }

      const result = await response.json();
      return result;

    } catch (error) {
      console.error('AI Service Error:', error);
      throw error;
    }
  }

  // Public methods for different AI features

  /**
   * Get route optimization suggestions
   */
  async getRouteOptimization(
    currentLocation: DriverLocation,
    activeJobs: ActiveJob[],
    constraints: DriverConstraints = {},
    weatherConditions: WeatherConditions = {}
  ): Promise<AISuggestion[]> {
    const cacheKey = this.generateCacheKey('route', currentLocation, activeJobs, constraints);
    const cached = this.getCached(cacheKey);

    if (cached) {
      return cached;
    }

    const response = await this.makeAIRequest('route_optimization', {
      currentLocation,
      activeJobs,
      constraints,
      weatherConditions
    });

    // Convert AI response to AISuggestion format
    const suggestions = this.parseRouteOptimizationResponse(response);
    this.setCached(cacheKey, suggestions, 10 * 60 * 1000); // Cache for 10 minutes

    return suggestions;
  }

  /**
   * Get job reordering suggestions
   */
  async getJobReordering(
    activeJobs: ActiveJob[],
    constraints: DriverConstraints = {}
  ): Promise<AISuggestion[]> {
    const cacheKey = `reorder_${activeJobs.map(j => j.id).sort().join(',')}_${JSON.stringify(constraints)}`;
    const cached = this.getCached(cacheKey);

    if (cached) {
      return cached;
    }

    const response = await this.makeAIRequest('job_reordering', {
      activeJobs,
      constraints
    });

    const suggestions = this.parseJobReorderingResponse(response);
    this.setCached(cacheKey, suggestions, 15 * 60 * 1000); // Cache for 15 minutes

    return suggestions;
  }

  /**
   * Get fuel efficiency recommendations
   */
  async getFuelEfficiencyRecommendations(
    currentLocation: DriverLocation,
    activeJobs: ActiveJob[],
    constraints: DriverConstraints = {}
  ): Promise<AISuggestion[]> {
    const cacheKey = this.generateCacheKey('fuel', currentLocation, activeJobs, constraints);
    const cached = this.getCached(cacheKey);

    if (cached) {
      return cached;
    }

    const response = await this.makeAIRequest('fuel_efficiency', {
      currentLocation,
      activeJobs,
      constraints
    });

    const suggestions = this.parseFuelEfficiencyResponse(response);
    this.setCached(cacheKey, suggestions, 30 * 60 * 1000); // Cache for 30 minutes (less time-sensitive)

    return suggestions;
  }

  /**
   * Get rest and break recommendations
   */
  async getRestRecommendations(
    currentLocation: DriverLocation,
    constraints: DriverConstraints = {}
  ): Promise<AISuggestion[]> {
    const cacheKey = `rest_${currentLocation.lat.toFixed(4)},${currentLocation.lng.toFixed(4)}_${JSON.stringify(constraints)}`;
    const cached = this.getCached(cacheKey);

    if (cached) {
      return cached;
    }

    const response = await this.makeAIRequest('rest_recommendations', {
      currentLocation,
      constraints
    });

    const suggestions = this.parseRestRecommendationsResponse(response);
    this.setCached(cacheKey, suggestions, 60 * 60 * 1000); // Cache for 1 hour

    return suggestions;
  }

  /**
   * Get personalized AI suggestions based on driver profile
   */
  async getPersonalizedSuggestions(
    driverId: string,
    currentLocation: DriverLocation,
    activeJobs: ActiveJob[],
    constraints: DriverConstraints = {}
  ): Promise<AISuggestion[]> {
    try {
      // Fetch driver profile for personalization
      const profile = await this.fetchDriverProfile(driverId);
      const preferences: DriverPreferences = {
        preferredSpeed: profile?.preferences?.preferredSpeed,
        riskTolerance: profile?.preferences?.riskTolerance,
        fuelPriority: profile?.preferences?.fuelPriority,
        timePriority: profile?.preferences?.timePriority
      };

      // Get all types of suggestions with personalization
      const [
        routeSuggestions,
        reorderSuggestions,
        fuelSuggestions,
        restSuggestions
      ] = await Promise.allSettled([
        this.getRouteOptimization(currentLocation, activeJobs, constraints, undefined, undefined, preferences),
        activeJobs.length > 1 ? this.getJobReordering(activeJobs, constraints, undefined, preferences) : Promise.resolve([]),
        this.getFuelEfficiencyRecommendations(currentLocation, activeJobs, constraints, undefined, preferences),
        this.getRestRecommendations(currentLocation, constraints)
      ]);

      const allSuggestions: AISuggestion[] = [];

      // Process successful results
      if (routeSuggestions.status === 'fulfilled') {
        allSuggestions.push(...routeSuggestions.value);
      }
      if (reorderSuggestions.status === 'fulfilled') {
        allSuggestions.push(...reorderSuggestions.value);
      }
      if (fuelSuggestions.status === 'fulfilled') {
        allSuggestions.push(...fuelSuggestions.value);
      }
      if (restSuggestions.status === 'fulfilled') {
        allSuggestions.push(...restSuggestions.value);
      }

      // Personalize suggestions based on driver profile
      if (profile) {
        allSuggestions.forEach(suggestion => {
          // Adjust priority based on driver preferences
          if (profile.preferences.fuelPriority > 0.7 && suggestion.type === 'fuel_efficiency') {
            suggestion.priority = 'high';
          }
          if (profile.preferences.timePriority > 0.7 && suggestion.estimatedSavings?.time) {
            suggestion.priority = 'high';
          }
          if (profile.preferences.riskTolerance === 'low') {
            suggestion.priority = suggestion.priority === 'urgent' ? 'urgent' : 'medium';
          }

          // Add personalization note
          suggestion.description += `\n\n💡 Personalized for your driving style and preferences.`;
        });
      }

      // Sort by personalized priority and confidence
      const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
      allSuggestions.sort((a, b) => {
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return b.confidence - a.confidence;
      });

      return allSuggestions.slice(0, 3); // Top 3 personalized suggestions

    } catch (error) {
      console.warn('Failed to get personalized suggestions:', error);
      // Fallback to regular suggestions
      return this.getRouteOptimization(currentLocation, activeJobs, constraints);
    }
  }

  /**
   * Update driver profile with performance data
   */
  async updateDriverProfile(
    driverId: string,
    performanceData: {
      jobId: string;
      earnings: number;
      distance: number;
      duration: number; // minutes
      onTime: boolean;
      customerRating: number;
      fuelUsed?: number;
    }
  ): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/driver-profiles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          driverId,
          performanceData
        })
      });

      if (!response.ok) {
        console.warn('Failed to update driver profile:', response.status);
      }
    } catch (error) {
      console.warn('Error updating driver profile:', error);
    }
  }

  /**
   * Get predictive maintenance recommendations
   */
  async getMaintenancePredictions(
    driverId: string,
    currentMileage: number,
    symptoms: string[] = []
  ): Promise<AISuggestion[]> {
    try {
      const response = await fetch(`${this.baseUrl}/driver-profiles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'maintenance',
          driverId,
          currentMileage,
          symptoms
        })
      });

      if (!response.ok) {
        throw new Error(`Maintenance API error: ${response.status}`);
      }

      const maintenanceData = await response.json();

      return maintenanceData.predictions.map((prediction: any) => ({
        id: `maintenance_${prediction.type}_${Date.now()}`,
        type: 'rest_recommendation' as const, // Categorize as general recommendation
        title: `🔧 ${prediction.type.replace('_', ' ').toUpperCase()} Needed`,
        description: prediction.description,
        priority: prediction.urgency === 'high' ? 'urgent' : prediction.urgency === 'medium' ? 'high' : 'medium',
        actions: [
          {
            label: 'Schedule Service',
            action: 'schedule_maintenance',
            primary: true
          },
          {
            label: 'Find Garage',
            action: 'find_service_center'
          }
        ],
        confidence: prediction.confidence,
        timestamp: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 1 week
      }));

    } catch (error) {
      console.warn('Failed to get maintenance predictions:', error);
      return [];
    }
  }

  /**
   * Fetch driver profile from backend
   */
  private async fetchDriverProfile(driverId: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/driver-profiles?driverId=${driverId}`);
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.warn('Failed to fetch driver profile:', error);
    }
    return null;
  }


  // Response parsers - convert AI responses to standardized format

  private parseRouteOptimizationResponse(response: any): AISuggestion[] {
    const suggestions: AISuggestion[] = [];

    if (response.routeOptimization) {
      suggestions.push({
        id: `route_opt_${Date.now()}`,
        type: 'route_optimization',
        title: '🚗 Optimized Route Available',
        description: response.routeOptimization.description || 'A more efficient route is available for your deliveries.',
        priority: response.routeOptimization.priority || 'medium',
        estimatedSavings: response.routeOptimization.savings,
        actions: [
          {
            label: 'View Route',
            action: 'view_optimized_route',
            primary: true
          },
          {
            label: 'Apply Route',
            action: 'apply_optimized_route'
          }
        ],
        confidence: response.metadata?.confidence || 0.8,
        timestamp: response.metadata?.timestamp || new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 minutes
      });
    }

    return suggestions;
  }

  private parseJobReorderingResponse(response: any): AISuggestion[] {
    const suggestions: AISuggestion[] = [];

    if (response.jobReordering) {
      suggestions.push({
        id: `job_reorder_${Date.now()}`,
        type: 'job_reordering',
        title: '📋 Optimized Job Order',
        description: response.jobReordering.description || 'Reordering your jobs can save time and increase efficiency.',
        priority: response.jobReordering.priority || 'high',
        estimatedSavings: response.jobReordering.savings,
        actions: [
          {
            label: 'View New Order',
            action: 'view_job_reorder',
            primary: true
          },
          {
            label: 'Apply Order',
            action: 'apply_job_reorder'
          }
        ],
        confidence: response.metadata?.confidence || 0.85,
        timestamp: response.metadata?.timestamp || new Date().toISOString(),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1 hour
      });
    }

    return suggestions;
  }

  private parseFuelEfficiencyResponse(response: any): AISuggestion[] {
    const suggestions: AISuggestion[] = [];

    if (response.fuelEfficiency) {
      suggestions.push({
        id: `fuel_eff_${Date.now()}`,
        type: 'fuel_efficiency',
        title: '⛽ Fuel Saving Route',
        description: response.fuelEfficiency.description || 'A fuel-efficient route is available.',
        priority: response.fuelEfficiency.priority || 'medium',
        estimatedSavings: response.fuelEfficiency.savings,
        actions: [
          {
            label: 'View Fuel Route',
            action: 'view_fuel_route',
            primary: true
          },
          {
            label: 'Eco Tips',
            action: 'show_eco_tips'
          }
        ],
        confidence: response.metadata?.confidence || 0.75,
        timestamp: response.metadata?.timestamp || new Date().toISOString(),
        expiresAt: new Date(Date.now() + 45 * 60 * 1000).toISOString() // 45 minutes
      });
    }

    return suggestions;
  }

  private parseRestRecommendationsResponse(response: any): AISuggestion[] {
    const suggestions: AISuggestion[] = [];

    if (response.restRecommendations) {
      suggestions.push({
        id: `rest_rec_${Date.now()}`,
        type: 'rest_recommendation',
        title: '🛋️ Rest Stop Recommended',
        description: response.restRecommendations.description || 'Consider taking a break for safety and compliance.',
        priority: response.restRecommendations.priority || 'high',
        actions: [
          {
            label: 'Find Rest Stops',
            action: 'find_rest_stops',
            primary: true
          },
          {
            label: 'Schedule Break',
            action: 'schedule_break'
          }
        ],
        confidence: response.metadata?.confidence || 0.9,
        timestamp: response.metadata?.timestamp || new Date().toISOString(),
        expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString() // 2 hours
      });
    }

    return suggestions;
  }

  // Utility methods

  /**
   * Clear all cached AI responses
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get rate limiting status
   */
  getRateLimitStatus(type: string): { remaining: number; resetTime: number } {
    return {
      remaining: this.rateLimiter.getRemainingRequests(type),
      resetTime: this.rateLimiter.getResetTime(type)
    };
  }

  /**
   * Check if AI service is available
   */
  async checkAvailability(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/ai/driver-assist`, {
        method: 'GET'
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const aiService = new AIService();

// React hook for using AI service
export const useAIService = () => {
  return {
    getRouteOptimization: aiService.getRouteOptimization.bind(aiService),
    getJobReordering: aiService.getJobReordering.bind(aiService),
    getFuelEfficiencyRecommendations: aiService.getFuelEfficiencyRecommendations.bind(aiService),
    getRestRecommendations: aiService.getRestRecommendations.bind(aiService),
    getPersonalizedSuggestions: aiService.getPersonalizedSuggestions.bind(aiService),
    updateDriverProfile: aiService.updateDriverProfile.bind(aiService),
    getMaintenancePredictions: aiService.getMaintenancePredictions.bind(aiService),
    clearCache: aiService.clearCache.bind(aiService),
    getRateLimitStatus: aiService.getRateLimitStatus.bind(aiService),
    checkAvailability: aiService.checkAvailability.bind(aiService),
  };
};
