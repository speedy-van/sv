// Enhanced Driver Notifications Configuration
export const ENHANCED_NOTIFICATIONS_CONFIG = {
  // Weather API Configuration
  weather: {
    apiKey: process.env.NEXT_PUBLIC_WEATHER_API_KEY,
    baseUrl: 'https://api.openweathermap.org/data/2.5',
    units: 'metric',
    fallbackEnabled: true,
    cacheDuration: 15 * 60 * 1000, // 15 minutes
  },

  // Traffic API Configuration
  traffic: {
    apiKey: process.env.NEXT_PUBLIC_MAPBOX_TOKEN,
    baseUrl: 'https://api.mapbox.com/directions/v5/mapbox',
    fallbackEnabled: true,
    cacheDuration: 5 * 60 * 1000, // 5 minutes
  },

  // Route Optimization Configuration
  routes: {
    apiKey: process.env.NEXT_PUBLIC_MAPBOX_TOKEN,
    baseUrl: 'https://api.mapbox.com/directions/v5/mapbox',
    profiles: ['fastest', 'shortest', 'eco'],
    fallbackEnabled: true,
    cacheDuration: 10 * 60 * 1000, // 10 minutes
  },

  // Zone Detection Configuration
  zones: {
    ulez: {
      enabled: true,
      charge: 12.5,
      postcodes: [
        'E',
        'EC',
        'N',
        'NW',
        'SE',
        'SW',
        'W',
        'WC', // Central London
        'BR',
        'CR',
        'DA',
        'EN',
        'HA',
        'IG',
        'KT',
        'RM',
        'SM',
        'TN',
        'TW',
        'UB',
        'WD', // Greater London
      ],
      requirements: 'Euro 6 diesel or Euro 4 petrol vehicle required',
      exemptions: ['Electric vehicles', 'Hybrid vehicles meeting standards'],
    },
    lez: {
      enabled: true,
      charge: 8.0,
      cities: {
        B: 'Birmingham',
        M: 'Manchester',
        L: 'Leeds, Liverpool',
        S: 'Sheffield, Southampton',
        N: 'Newcastle',
        G: 'Glasgow',
        E: 'Edinburgh',
        C: 'Cardiff',
      },
      requirements: 'Euro 6 diesel or Euro 4 petrol vehicle required',
      exemptions: ['Electric vehicles', 'Hybrid vehicles meeting standards'],
    },
    congestionCharge: {
      enabled: true,
      charge: 15.0,
      postcodes: [
        'E1',
        'E1W',
        'EC1',
        'EC2',
        'EC3',
        'EC4',
        'SE1',
        'SW1',
        'W1',
        'WC1',
        'WC2',
      ],
      requirements: 'Payment required for driving in zone',
      exemptions: ['Electric vehicles', 'Residents', 'Blue badge holders'],
    },
  },

  // Weather Impact Thresholds
  weatherThresholds: {
    precipitation: {
      low: 2,
      medium: 5,
      high: 10,
    },
    visibility: {
      low: 8,
      medium: 5,
      high: 2,
    },
    windSpeed: {
      low: 15,
      medium: 20,
      high: 30,
    },
    temperature: {
      cold: 5,
      hot: 30,
    },
  },

  // Traffic Impact Thresholds
  trafficThresholds: {
    congestionLevels: {
      low: { maxDelay: 10, color: 'green' },
      medium: { maxDelay: 25, color: 'yellow' },
      high: { maxDelay: 40, color: 'orange' },
      severe: { maxDelay: 999, color: 'red' },
    },
    delayMultipliers: {
      low: 1.0,
      medium: 1.2,
      high: 1.5,
      severe: 2.0,
    },
  },

  // Route Optimization Configuration
  routeOptimization: {
    fuelEfficiency: {
      baseMpg: 25,
      fuelPricePerLiter: 1.5,
      litersPerGallon: 4.546,
      profileMultipliers: {
        fastest: 1.0,
        shortest: 0.9,
        eco: 1.2,
      },
    },
    scoring: {
      weights: {
        distance: 0.3,
        time: 0.3,
        fuelCost: 0.4,
      },
      profileBonuses: {
        fastest: 5,
        shortest: 10,
        eco: 20,
      },
    },
    ulezAvoidance: {
      enabled: true,
      penalty: 50, // Points deducted for ULEZ routes
      alternativeBonus: 20, // Points added for ULEZ-free routes
    },
  },

  // Notification Configuration
  notifications: {
    priority: {
      high: {
        conditions: [
          'severe_traffic',
          'high_weather_impact',
          'restricted_zone',
        ],
        delivery: 'immediate',
        sound: true,
        vibration: true,
      },
      medium: {
        conditions: ['high_traffic', 'medium_weather_impact', 'moderate_delay'],
        delivery: 'within_5_minutes',
        sound: true,
        vibration: false,
      },
      low: {
        conditions: ['normal_conditions', 'low_impact'],
        delivery: 'within_15_minutes',
        sound: false,
        vibration: false,
      },
    },
    channels: {
      inApp: true,
      push: true,
      email: false,
      sms: false,
    },
    retention: {
      unread: 30, // days
      read: 90, // days
    },
  },

  // Fallback Configuration
  fallback: {
    enabled: true,
    mockData: {
      weather: {
        condition: 'Clear',
        temperature: 18,
        precipitation: 0,
        windSpeed: 5,
        visibility: 10,
        impact: 'low',
        recommendations: ['Normal driving conditions expected'],
      },
      traffic: {
        congestionLevel: 'medium',
        estimatedDelay: 15,
        roadClosures: [],
        alternativeRoutes: [],
        recommendations: [
          'Check route before departure',
          'Allow extra travel time',
        ],
      },
      routes: {
        distance: 15,
        time: 45,
        fuelCost: 2.25,
        ulezCost: 0,
        totalCost: 2.25,
        savings: 0,
        recommendations: ['Route is optimized'],
      },
    },
  },

  // Cache Configuration
  cache: {
    enabled: true,
    defaultTTL: 5 * 60 * 1000, // 5 minutes
    maxSize: 1000, // Maximum cache entries
    cleanupInterval: 10 * 60 * 1000, // 10 minutes
  },

  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    enabled: true,
    includeSensitiveData: false,
    maxLogSize: 10 * 1024 * 1024, // 10MB
  },

  // Performance Configuration
  performance: {
    maxConcurrentRequests: 5,
    requestTimeout: 10000, // 10 seconds
    retryAttempts: 3,
    retryDelay: 1000, // 1 second
  },
};

// Helper functions for configuration
export const getZoneConfig = (
  zoneType: 'ulez' | 'lez' | 'congestionCharge'
) => {
  return ENHANCED_NOTIFICATIONS_CONFIG.zones[zoneType];
};

export const getWeatherThreshold = (
  metric: keyof typeof ENHANCED_NOTIFICATIONS_CONFIG.weatherThresholds,
  level: 'low' | 'medium' | 'high'
) => {
  return (ENHANCED_NOTIFICATIONS_CONFIG.weatherThresholds[metric] as any)[level];
};

export const getTrafficThreshold = (
  level: keyof typeof ENHANCED_NOTIFICATIONS_CONFIG.trafficThresholds.congestionLevels
) => {
  return ENHANCED_NOTIFICATIONS_CONFIG.trafficThresholds.congestionLevels[
    level
  ];
};

export const getRouteProfileMultiplier = (
  profile: keyof typeof ENHANCED_NOTIFICATIONS_CONFIG.routeOptimization.fuelEfficiency.profileMultipliers
) => {
  return ENHANCED_NOTIFICATIONS_CONFIG.routeOptimization.fuelEfficiency
    .profileMultipliers[profile];
};

export const isFeatureEnabled = (
  feature: keyof typeof ENHANCED_NOTIFICATIONS_CONFIG
) => {
  const config = ENHANCED_NOTIFICATIONS_CONFIG[feature];
  return config && typeof config === 'object' && 'enabled' in config
    ? config.enabled
    : true;
};

// Validation functions
export const validateConfiguration = () => {
  const errors: string[] = [];

  // Check required API keys
  if (!ENHANCED_NOTIFICATIONS_CONFIG.weather.apiKey) {
    errors.push('Weather API key is required');
  }

  if (!ENHANCED_NOTIFICATIONS_CONFIG.traffic.apiKey) {
    errors.push('Mapbox API key is required');
  }

  if (!ENHANCED_NOTIFICATIONS_CONFIG.routes.apiKey) {
    errors.push('Route optimization API key is required');
  }

  // Validate thresholds
  const weatherThresholds = ENHANCED_NOTIFICATIONS_CONFIG.weatherThresholds;
  if (
    weatherThresholds.precipitation.low >=
      weatherThresholds.precipitation.medium ||
    weatherThresholds.precipitation.medium >=
      weatherThresholds.precipitation.high
  ) {
    errors.push('Weather precipitation thresholds must be in ascending order');
  }

  if (
    weatherThresholds.visibility.low <= weatherThresholds.visibility.medium ||
    weatherThresholds.visibility.medium <= weatherThresholds.visibility.high
  ) {
    errors.push('Weather visibility thresholds must be in descending order');
  }

  // Validate scoring weights
  const scoringWeights =
    ENHANCED_NOTIFICATIONS_CONFIG.routeOptimization.scoring.weights;
  const totalWeight = Object.values(scoringWeights).reduce(
    (sum, weight) => sum + weight,
    0
  );
  if (Math.abs(totalWeight - 1.0) > 0.01) {
    errors.push('Route optimization scoring weights must sum to 1.0');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Default export
export default ENHANCED_NOTIFICATIONS_CONFIG;
