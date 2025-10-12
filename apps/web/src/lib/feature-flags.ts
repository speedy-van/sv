import React from 'react';

export interface FeatureFlag {
  name: string;
  enabled: boolean;
  rolloutPercentage: number;
  targetUsers?: string[];
  targetRoles?: string[];
  targetEnvironments?: string[];
  startDate?: Date;
  endDate?: Date;
  metadata?: Record<string, any>;
}

export interface FeatureFlagContext {
  userId?: string;
  userRole?: string;
  environment?: string;
  sessionId?: string;
}

class FeatureFlagService {
  private flags: Map<string, FeatureFlag> = new Map();
  private context: FeatureFlagContext = {};

  constructor() {
    this.loadFlags();
  }

  private async loadFlags() {
    try {
      // In a real implementation, this would load from a database or external service
      // For now, we'll use environment variables and hardcoded flags
      const defaultFlags: FeatureFlag[] = [
        {
          name: 'driver_portal_v2',
          enabled: process.env.NEXT_PUBLIC_FEATURE_DRIVER_PORTAL_V2 === 'true',
          rolloutPercentage: parseInt(
            process.env.NEXT_PUBLIC_FEATURE_DRIVER_PORTAL_V2_ROLLOUT || '100'
          ),
          targetEnvironments: ['production', 'staging'],
          metadata: {
            description: 'New driver portal interface',
            version: '2.0.0',
          },
        },
        {
          name: 'advanced_navigation',
          enabled:
            process.env.NEXT_PUBLIC_FEATURE_ADVANCED_NAVIGATION === 'true',
          rolloutPercentage: parseInt(
            process.env.NEXT_PUBLIC_FEATURE_ADVANCED_NAVIGATION_ROLLOUT || '50'
          ),
          targetEnvironments: ['production', 'staging'],
          metadata: {
            description: 'Advanced navigation features',
            version: '1.5.0',
          },
        },
        {
          name: 'real_time_tracking',
          enabled:
            process.env.NEXT_PUBLIC_FEATURE_REAL_TIME_TRACKING === 'true',
          rolloutPercentage: parseInt(
            process.env.NEXT_PUBLIC_FEATURE_REAL_TIME_TRACKING_ROLLOUT || '25'
          ),
          targetEnvironments: ['production'],
          metadata: {
            description: 'Real-time location tracking',
            version: '1.0.0',
          },
        },
        {
          name: 'offline_mode',
          enabled: process.env.NEXT_PUBLIC_FEATURE_OFFLINE_MODE === 'true',
          rolloutPercentage: parseInt(
            process.env.NEXT_PUBLIC_FEATURE_OFFLINE_MODE_ROLLOUT || '100'
          ),
          targetEnvironments: ['production', 'staging', 'development'],
          metadata: {
            description: 'Offline functionality',
            version: '1.0.0',
          },
        },
        {
          name: 'enhanced_analytics',
          enabled:
            process.env.NEXT_PUBLIC_FEATURE_ENHANCED_ANALYTICS === 'true',
          rolloutPercentage: parseInt(
            process.env.NEXT_PUBLIC_FEATURE_ENHANCED_ANALYTICS_ROLLOUT || '10'
          ),
          targetRoles: ['admin'],
          targetEnvironments: ['production', 'staging'],
          metadata: {
            description: 'Enhanced analytics dashboard',
            version: '1.2.0',
          },
        },
        {
          name: 'pricing.normalization.enabled',
          enabled:
            process.env.NEXT_PUBLIC_FEATURE_PRICING_NORMALIZATION === 'true',
          rolloutPercentage: parseInt(
            process.env.NEXT_PUBLIC_FEATURE_PRICING_NORMALIZATION_ROLLOUT || '0'
          ),
          targetEnvironments: ['production', 'staging', 'development'],
          metadata: {
            description: 'Item normalization and volume factor pricing',
            version: '2.0.0',
          },
        },
        {
          name: 'pricing.autocomplete.enabled',
          enabled:
            process.env.NEXT_PUBLIC_FEATURE_PRICING_AUTOCOMPLETE === 'true',
          rolloutPercentage: parseInt(
            process.env.NEXT_PUBLIC_FEATURE_PRICING_AUTOCOMPLETE_ROLLOUT || '0'
          ),
          targetEnvironments: ['production', 'staging', 'development'],
          metadata: {
            description: 'Smart item autocomplete suggestions',
            version: '2.0.0',
          },
        },
        {
          name: 'pricing.volume_factor.enabled',
          enabled:
            process.env.NEXT_PUBLIC_FEATURE_PRICING_VOLUME_FACTOR === 'true',
          rolloutPercentage: parseInt(
            process.env.NEXT_PUBLIC_FEATURE_PRICING_VOLUME_FACTOR_ROLLOUT || '0'
          ),
          targetEnvironments: ['production', 'staging', 'development'],
          metadata: {
            description: 'Volume factor based pricing calculation',
            version: '2.0.0',
          },
        },
      ];

      defaultFlags.forEach(flag => {
        this.flags.set(flag.name, flag);
      });

      // Load from API if available
      await this.loadFlagsFromAPI();
    } catch (error) {
      console.error('Failed to load feature flags:', error);
    }
  }

  private async loadFlagsFromAPI() {
    try {
      const response = await fetch('/api/feature-flags', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const apiFlags = await response.json();
        apiFlags.forEach((flag: FeatureFlag) => {
          this.flags.set(flag.name, flag);
        });
      }
    } catch (error) {
      console.error('Failed to load flags from API:', error);
    }
  }

  setContext(context: FeatureFlagContext) {
    this.context = { ...this.context, ...context };
  }

  isEnabled(flagName: string): boolean {
    const flag = this.flags.get(flagName);
    if (!flag) {
      return false;
    }

    // Check if flag is globally enabled
    if (!flag.enabled) {
      return false;
    }

    // Check environment
    if (flag.targetEnvironments && flag.targetEnvironments.length > 0) {
      const currentEnv =
        this.context.environment || process.env.NODE_ENV || 'development';
      if (!flag.targetEnvironments.includes(currentEnv)) {
        return false;
      }
    }

    // Check role
    if (flag.targetRoles && flag.targetRoles.length > 0) {
      if (
        !this.context.userRole ||
        !flag.targetRoles.includes(this.context.userRole)
      ) {
        return false;
      }
    }

    // Check specific users
    if (flag.targetUsers && flag.targetUsers.length > 0) {
      if (
        !this.context.userId ||
        !flag.targetUsers.includes(this.context.userId)
      ) {
        return false;
      }
    }

    // Check date range
    const now = new Date();
    if (flag.startDate && now < flag.startDate) {
      return false;
    }
    if (flag.endDate && now > flag.endDate) {
      return false;
    }

    // Check rollout percentage
    if (flag.rolloutPercentage < 100) {
      const hash = this.hashString(
        this.context.userId || this.context.sessionId || 'anonymous'
      );
      const percentage = hash % 100;
      if (percentage >= flag.rolloutPercentage) {
        return false;
      }
    }

    return true;
  }

  getFlag(flagName: string): FeatureFlag | undefined {
    return this.flags.get(flagName);
  }

  getAllFlags(): FeatureFlag[] {
    return Array.from(this.flags.values());
  }

  getEnabledFlags(): FeatureFlag[] {
    return this.getAllFlags().filter(flag => this.isEnabled(flag.name));
  }

  // Hash function for consistent user assignment
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  // Track feature flag usage
  trackFlagUsage(flagName: string, action: string = 'view') {
    if (typeof window !== 'undefined') {
      // Send to telemetry
      fetch('/api/telemetry/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event: 'feature_flag_usage',
          properties: {
            flagName,
            action,
            enabled: this.isEnabled(flagName),
            context: this.context,
          },
          sessionId: this.context.sessionId,
          timestamp: Date.now(),
        }),
      }).catch(error => {
        console.error('Failed to track feature flag usage:', error);
      });
    }
  }
}

// Create singleton instance
export const featureFlags = new FeatureFlagService();

// React hook for feature flags
export function useFeatureFlag(flagName: string): boolean {
  const isEnabled = featureFlags.isEnabled(flagName);

  // Track usage
  if (typeof window !== 'undefined') {
    featureFlags.trackFlagUsage(flagName);
  }

  return isEnabled;
}

// Higher-order component for feature flags
export function withFeatureFlag<T extends object>(
  WrappedComponent: React.ComponentType<T>,
  flagName: string,
  fallback?: React.ComponentType<T>
) {
  return function FeatureFlagWrapper(props: T) {
    const isEnabled = useFeatureFlag(flagName);

    if (isEnabled) {
      return React.createElement(WrappedComponent, props);
    }

    if (fallback) {
      return React.createElement(fallback, props);
    }

    return null;
  };
}

// Utility function to check multiple flags
export function useFeatureFlags(flagNames: string[]): Record<string, boolean> {
  const result: Record<string, boolean> = {};

  flagNames.forEach(flagName => {
    result[flagName] = useFeatureFlag(flagName);
  });

  return result;
}

// Initialize feature flags with user context
export function initializeFeatureFlags(context: FeatureFlagContext) {
  featureFlags.setContext(context);
}
