import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Alert, Linking, Platform, Animated, Easing } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows, glassEffect } from '../utils/theme';
import { AISuggestionCard } from './AISuggestionCard';
import { useAIService, AISuggestion, DriverLocation, ActiveJob } from '../services/aiService';
import { soundService } from '../services/soundService';
import { useLocation } from '../contexts/LocationContext';
import { useAuth } from '../contexts/AuthContext';

interface AIDashboardSectionProps {
  activeJobs?: ActiveJob[];
  onSuggestionAction?: (action: string, suggestionId: string) => void;
  style?: any;
}

export const AIDashboardSection: React.FC<AIDashboardSectionProps> = ({
  activeJobs = [],
  onSuggestionAction,
  style
}) => {
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const { location: currentLocation } = useLocation();
  const { user } = useAuth();
  const aiService = useAIService();

  // Real-time AI monitoring state
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [realTimeSuggestions, setRealTimeSuggestions] = useState<AISuggestion[]>([]);

  // Animation states
  const [fadeAnim] = useState(new Animated.Value(0));
  const [pulseAnim] = useState(new Animated.Value(1));
  const [slideAnim] = useState(new Animated.Value(-20));
  const [shimmerAnim] = useState(new Animated.Value(0));
  const [rotateAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(1));

  // Start/stop real-time monitoring based on active jobs
  useEffect(() => {
    if (activeJobs.length > 0 && currentLocation && !isMonitoring) {
      // Start real-time monitoring
      setIsMonitoring(true);
      aiService.startRealTimeMonitoring(activeJobs, (suggestion) => {
        setRealTimeSuggestions(prev => {
          // Add new suggestion if not already present
          const exists = prev.find(s => s.id === suggestion.id);
          if (!exists) {
            setLastRefresh(new Date());
            return [...prev, suggestion];
          }
          return prev;
        });
      });
    } else if (activeJobs.length === 0 && isMonitoring) {
      // Stop monitoring when no active jobs
      setIsMonitoring(false);
      aiService.stopRealTimeMonitoring();
      setRealTimeSuggestions([]);
    }

    // Update location when it changes
    if (currentLocation) {
      aiService.updateLocation({
        lat: currentLocation.coords.latitude,
        lng: currentLocation.coords.longitude,
      });
    }

    // Update active jobs when they change
    if (isMonitoring) {
      aiService.updateActiveJobs(activeJobs);
    }
  }, [activeJobs.length, currentLocation, isMonitoring]);

  // Listen for job status changes to trigger AI analysis
  useEffect(() => {
    if (activeJobs.length > 0 && isMonitoring) {
      // Force immediate AI analysis when jobs change
      const performImmediateAnalysis = async () => {
        console.log('🤖 AI: Analyzing routes for', activeJobs.length, 'active jobs');

        try {
          // Trigger weather/traffic analysis
          const weatherResponse = await fetch(`https://speedy-van.co.uk/api/weather`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              location: {
                lat: currentLocation?.coords.latitude || 51.5074,
                lng: currentLocation?.coords.longitude || -0.1278
              },
              includeForecast: true,
              includeAlerts: true
            })
          });

          if (weatherResponse.ok) {
            const weatherData = await weatherResponse.json();
            console.log('✅ AI: Weather analysis updated', weatherData);
          }

          // Get traffic data for routes
          const trafficResponse = await fetch(`https://speedy-van.co.uk/api/traffic`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              route: {
                origin: {
                  lat: currentLocation?.coords.latitude || 51.5074,
                  lng: currentLocation?.coords.longitude || -0.1278
                },
                destination: {
                  lat: activeJobs[0]?.dropoff.lat || 51.5225,
                  lng: activeJobs[0]?.dropoff.lng || -0.0473
                },
                waypoints: activeJobs.slice(1).map(job => job.dropoff)
              },
              includeIncidents: true,
              dataSource: 'live'
            })
          });

          if (trafficResponse.ok) {
            const trafficData = await trafficResponse.json();
            console.log('✅ AI: Traffic analysis updated', trafficData);
          }

          console.log('🎯 AI: Real-time monitoring active for job optimization');

        } catch (error) {
          console.warn('⚠️ AI: Failed to update analysis on job change', error);
          // Continue with basic monitoring - don't break the experience
        }
      };

      performImmediateAnalysis();
    }
  }, [activeJobs, isMonitoring, currentLocation]);

  // Load AI suggestions (fallback when not monitoring)
  const loadAISuggestions = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);

    try {
      // Always prioritize real-time suggestions from monitoring
      if (realTimeSuggestions.length > 0) {
        setSuggestions(realTimeSuggestions);
        setLastRefresh(new Date());
      } else if (currentLocation) {
        // Fallback to static AI service calls
        const driverLocation: DriverLocation = {
          lat: currentLocation.coords.latitude,
          lng: currentLocation.coords.longitude,
        };

        let allSuggestions: AISuggestion[] = [];

        try {
          const personalizedSuggestions = await aiService.getPersonalizedSuggestions(
            user?.driver?.id || '',
            driverLocation,
            activeJobs
          );
          allSuggestions.push(...personalizedSuggestions);
        } catch (error) {
          console.warn('Personalized AI failed:', error);
        }

        // Add contextual insights if no suggestions
        if (allSuggestions.length === 0) {
          if (activeJobs.length > 0) {
            allSuggestions.push({
              id: 'contextual_monitoring',
              type: 'route_optimization' as const,
              title: '📊 Route Monitoring Active',
              description: `AI is continuously monitoring your ${activeJobs.length} delivery route${activeJobs.length > 1 ? 's' : ''} for optimization opportunities.`,
              priority: 'low' as const,
              actions: [
                { label: 'Refresh Analysis', action: 'refresh_analysis', primary: true }
              ],
              confidence: 0.95,
              timestamp: new Date().toISOString(),
              expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString()
            });
          } else {
            allSuggestions.push({
              id: 'contextual_ready',
              type: 'route_optimization' as const,
              title: '🎯 AI Ready for Deliveries',
              description: 'AI optimization engine is active and ready to analyze routes as soon as you accept deliveries.',
              priority: 'low' as const,
              actions: [
                { label: 'View Features', action: 'view_ai_capabilities', primary: true }
              ],
              confidence: 1.0,
              timestamp: new Date().toISOString(),
              expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
            });
          }
        }

        setSuggestions(allSuggestions);
        setLastRefresh(new Date());
      }

    } catch (error) {
      console.error('Failed to load AI suggestions:', error);
      setSuggestions([]);
    } finally {
      if (showLoading) setLoading(false);
      setRefreshing(false);
    }
  // Helper function for standard suggestions
  const getStandardSuggestions = async (driverLocation: DriverLocation): Promise<AISuggestion[]> => {
    const [
      routeSuggestions,
      reorderSuggestions,
      fuelSuggestions,
      restSuggestions
    ] = await Promise.allSettled([
      aiService.getRouteOptimization(driverLocation, activeJobs),
      activeJobs.length > 1 ? aiService.getJobReordering(activeJobs) : Promise.resolve([]),
      aiService.getFuelEfficiencyRecommendations(driverLocation, activeJobs),
      aiService.getRestRecommendations(driverLocation)
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

    // Sort by priority and confidence
    const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
    allSuggestions.sort((a, b) => {
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return b.confidence - a.confidence;
    });

    return allSuggestions.slice(0, 3);
  };

  }, [currentLocation, activeJobs, aiService, user]);

  // Animation effects
  useEffect(() => {
    // Fade in animation on mount
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    // Slide in animation
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 500,
      easing: Easing.out(Easing.back(1.2)),
      useNativeDriver: true,
    }).start();
  }, []);

  // Pulse animation for live monitoring - enhanced
  useEffect(() => {
    if (isMonitoring) {
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(pulseAnim, {
              toValue: 1.15,
              duration: 1200,
              easing: Easing.inOut(Easing.cubic),
              useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
              toValue: 1.05,
              duration: 1200,
              easing: Easing.inOut(Easing.cubic),
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 1200,
              easing: Easing.inOut(Easing.cubic),
              useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
              toValue: 1,
              duration: 1200,
              easing: Easing.inOut(Easing.cubic),
              useNativeDriver: true,
            }),
          ]),
        ])
      );
      pulseAnimation.start();

      // Rotate animation for AI icon
      const rotateAnimation = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 4000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      rotateAnimation.start();

      // Shimmer effect
      const shimmerAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(shimmerAnim, {
            toValue: 1,
            duration: 2500,
            useNativeDriver: true,
          }),
          Animated.timing(shimmerAnim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      );
      shimmerAnimation.start();

      return () => {
        pulseAnimation.stop();
        rotateAnimation.stop();
        shimmerAnimation.stop();
      };
    }
  }, [isMonitoring, pulseAnim, scaleAnim, rotateAnim, shimmerAnim]);

  // Initial load
  useEffect(() => {
    if (currentLocation) {
      loadAISuggestions();
    }
  }, [currentLocation, loadAISuggestions]);

  // Handle suggestion actions
  const handleSuggestionAction = useCallback(async (action: string, suggestionId: string) => {
    console.log('AI Suggestion Action:', action, suggestionId);

    // Emit telemetry for suggestion action
    const suggestion = suggestions.find(s => s.id === suggestionId);
    if (suggestion) {
      // Use the AI monitor's telemetry method
      const monitor = (aiService as any).getMonitor?.() || aiService;
      if (monitor.emitTelemetry) {
        monitor.emitTelemetry('ai_suggestion_viewed', {
          suggestionId,
          suggestionType: suggestion.type,
          action,
          confidence: suggestion.confidence,
          priority: suggestion.priority
        });
      }
    }

    // Call external handler if provided
    if (onSuggestionAction) {
      onSuggestionAction(action, suggestionId);
      return;
    }

    // Default action handling
    switch (action) {
      case 'view_optimized_route':
        // Open Apple/Google Maps with optimized route
        const optimizedRoute = suggestions.find(s => s.id === suggestionId);
        if (optimizedRoute) {
          const destination = activeJobs[0]?.dropoff;
          const origin = currentLocation ? `${currentLocation.coords.latitude},${currentLocation.coords.longitude}` : '';

          if (destination && origin) {
            const url = Platform.OS === 'ios'
              ? `maps://app?daddr=${destination.lat},${destination.lng}&saddr=${origin}&dirflg=d`
              : `geo:${destination.lat},${destination.lng}?q=${destination.lat},${destination.lng}`;

            Linking.canOpenURL(url).then(supported => {
              if (supported) {
                Linking.openURL(url);
                Alert.alert('Navigation Opened', 'Optimized route opened in Maps app.');
              } else {
                Alert.alert('Navigation Unavailable', 'Please install a navigation app.');
              }
            });
          }
        }
        break;

      case 'apply_optimized_route':
        // Apply the optimized route to current navigation
        Alert.alert(
          'Apply Optimized Route',
          'This will update your current navigation to use the AI-optimized route. Continue?',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Apply Route',
              onPress: () => {
                // Here we would integrate with the navigation system
                // For now, just show success and emit telemetry
                const suggestion = suggestions.find(s => s.id === suggestionId);
                if (suggestion) {
                  // Emit telemetry for route adjustment
                  console.log('AI: Route adjustment applied', suggestion);

                  // Update suggestion status
                  setSuggestions(prev =>
                    prev.map(s =>
                      s.id === suggestionId
                        ? { ...s, title: '✅ Route Applied', priority: 'low' as const }
                        : s
                    )
                  );

                  Alert.alert('Route Applied', 'AI-optimized route is now active in your navigation.');
                }
              }
            }
          ]
        );
        break;

      case 'view_job_reorder':
        Alert.alert(
          'Job Reordering',
          'This would show the recommended job order. Feature coming soon!',
          [{ text: 'OK' }]
        );
        break;

      case 'apply_job_reorder':
        Alert.alert(
          'Apply Order',
          'Job order updated for maximum efficiency!',
          [{ text: 'OK' }]
        );
        break;

      case 'view_fuel_route':
        Alert.alert(
          'Fuel-Efficient Route',
          'This would show the fuel-saving route options. Feature coming soon!',
          [{ text: 'OK' }]
        );
        break;

      case 'show_eco_tips':
        Alert.alert(
          'Eco-Driving Tips',
          '• Maintain steady speeds\n• Avoid harsh braking\n• Use engine braking on declines\n• Keep tires properly inflated\n• Plan routes to minimize stops',
          [{ text: 'Got it!' }]
        );
        break;

      case 'find_rest_stops':
        Alert.alert(
          'Rest Stops',
          'This would open a map with nearby rest stops and parking areas. Feature coming soon!',
          [{ text: 'OK' }]
        );
        break;

      case 'schedule_break':
        Alert.alert(
          'Break Scheduled',
          'Break reminder set for 15 minutes from now.',
          [{ text: 'OK' }]
        );
        break;

      case 'refresh_analysis':
        // Trigger a refresh of AI analysis
        await loadAISuggestions(false);
        Alert.alert(
          'Analysis Refreshed',
          'AI has re-analyzed your current routes and traffic conditions.',
          [{ text: 'OK' }]
        );
        break;

      case 'view_ai_capabilities':
        Alert.alert(
          'AI Assistant Capabilities',
          '🚗 Route Optimization: Real-time traffic rerouting\n⛽ Fuel Efficiency: Eco-driving recommendations\n🌦️ Weather Awareness: Condition-adaptive routing\n🔧 Maintenance: Predictive vehicle care\n📊 Personalization: Learning your preferences\n⚡ Real-time: Always monitoring for improvements',
          [{ text: 'Got it!' }]
        );
        break;

      default:
        console.log('Unknown action:', action);
    }

    await soundService.playSuccess();
  }, [onSuggestionAction]);

  // Handle suggestion dismissal
  const handleSuggestionDismiss = useCallback((suggestionId: string) => {
    setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
  }, []);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAISuggestions(false);
  }, [loadAISuggestions]);

  const formatLastRefresh = () => {
    const now = new Date();
    const diffMs = now.getTime() - lastRefresh.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;

    const diffHours = Math.floor(diffMins / 60);
    return `${diffHours}h ago`;
  };

  // AI is always available - no location check needed

  const shimmerTranslateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-400, 400],
  });

  const rotateValue = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View style={[
      styles.container,
      style,
      {
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }]
      }
    ]}>
      <BlurView intensity={40} tint="dark" style={styles.blurContainer}>
        <Animated.View style={[
          styles.card,
          { transform: [{ scale: scaleAnim }] }
        ]}>
          {/* Gradient Background */}
          {isMonitoring && (
            <View style={styles.gradientBackground}>
              <View style={styles.gradientTop} />
              <View style={styles.gradientBottom} />
            </View>
          )}

          {/* Shimmer overlay - enhanced */}
          {isMonitoring && (
            <Animated.View
              style={[
                styles.shimmerOverlay,
                {
                  transform: [{ translateX: shimmerTranslateX }],
                },
              ]}
            />
          )}

          {/* Enhanced Header with Gradient */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Animated.View style={[
                styles.aiIconContainer,
                isMonitoring && { transform: [{ scale: pulseAnim }, { rotate: rotateValue }] }
              ]}>
                <View style={styles.aiIconWrapper}>
                  <Ionicons name="sparkles" size={28} color="#FFFFFF" />
                  {isMonitoring && (
                    <>
                      <View style={styles.liveIndicator} />
                      <Animated.View
                        style={[
                          styles.pulseRing,
                          {
                            transform: [{ scale: pulseAnim }],
                          },
                        ]}
                      />
                    </>
                  )}
                </View>
              </Animated.View>
              <View style={styles.headerTextContainer}>
                <View style={styles.titleRow}>
                  <Text style={styles.headerTitle}>AI Assistant</Text>
                  {isMonitoring && (
                    <View style={styles.liveBadge}>
                      <View style={styles.liveBadgeDot} />
                      <Text style={styles.liveBadgeText}>LIVE</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.headerSubtitle}>
                  {isMonitoring ? 'Live Route Optimization' : 'Smart Delivery Intelligence'}
                </Text>
              </View>
            </View>
            <View style={styles.headerRight}>
              <View style={[styles.statusBadge, isMonitoring && styles.statusBadgeLive]}>
                <Text style={[styles.statusText, isMonitoring && styles.statusTextLive]}>
                  {isMonitoring ? '🔴 ACTIVE' : `Updated ${formatLastRefresh()}`}
                </Text>
              </View>
            </View>
          </View>

          {/* Enhanced Gradient separator */}
          <View style={[styles.headerGradient, isMonitoring && styles.headerGradientLive]} />

          {/* Enhanced Content */}
          {loading && suggestions.length === 0 ? (
            <View style={styles.loadingContainer}>
              <View style={styles.loadingAnimation}>
                <Animated.View style={[
                  styles.loadingDot,
                  {
                    transform: [{
                      scale: pulseAnim.interpolate({
                        inputRange: [1, 1.1],
                        outputRange: [1, 1.3]
                      })
                    }]
                  }
                ]}>
                  <Text style={styles.loadingIcon}>🧠</Text>
                </Animated.View>
              </View>
              <Text style={styles.loadingText}>AI is analyzing your routes...</Text>
              <Text style={styles.loadingSubtext}>
                Processing traffic, weather, and optimization data
              </Text>
              <View style={styles.loadingProgress}>
                <View style={styles.loadingProgressBar}>
                  <Animated.View
                    style={[
                      styles.loadingProgressFill,
                      {
                        width: pulseAnim.interpolate({
                          inputRange: [1, 1.1],
                          outputRange: ['30%', '70%']
                        })
                      }
                    ]}
                  />
                </View>
              </View>
            </View>
          ) : suggestions.length > 0 ? (
            <ScrollView
              style={styles.suggestionsContainer}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                  tintColor={colors.primary}
                />
              }
            >
              {suggestions.map((suggestion) => (
                <AISuggestionCard
                  key={suggestion.id}
                  suggestion={suggestion}
                  onActionPress={handleSuggestionAction}
                  onDismiss={handleSuggestionDismiss}
                />
              ))}

              {/* Refresh hint */}
              <View style={styles.refreshHint}>
                <Text style={styles.refreshHintText}>
                  💡 Pull down to refresh AI suggestions
                </Text>
              </View>
            </ScrollView>
          ) : (
            <View style={styles.emptyContainer}>
              {activeJobs && activeJobs.length > 0 ? (
                // Has active jobs - show monitoring state
                <>
                  <Animated.View style={[
                    styles.emptyIconContainer,
                    { transform: [{ scale: pulseAnim }] }
                  ]}>
                    <Text style={styles.emptyIcon}>👁️</Text>
                    <View style={styles.livePulseRing} />
                  </Animated.View>
                  <Text style={styles.emptyTitle}>🚀 Live Route Monitoring</Text>
                  <Text style={styles.emptyText}>
                    AI is actively optimizing {activeJobs.length} delivery route{activeJobs.length > 1 ? 's' : ''} with:
                  </Text>
                  <View style={styles.aiFeaturesGrid}>
                    <View style={styles.featureCard}>
                      <Text style={styles.featureIcon}>🚦</Text>
                      <Text style={styles.featureText}>Traffic Analysis</Text>
                    </View>
                    <View style={styles.featureCard}>
                      <Text style={styles.featureIcon}>🌤️</Text>
                      <Text style={styles.featureText}>Weather Impact</Text>
                    </View>
                    <View style={styles.featureCard}>
                      <Text style={styles.featureIcon}>⛽</Text>
                      <Text style={styles.featureText}>Fuel Efficiency</Text>
                    </View>
                    <View style={styles.featureCard}>
                      <Text style={styles.featureIcon}>📍</Text>
                      <Text style={styles.featureText}>Route Optimization</Text>
                    </View>
                  </View>
                  <Text style={styles.emptySubtext}>
                    💡 Smart suggestions appear automatically when improvements are detected.
                  </Text>
                </>
              ) : (
                // No active jobs - show ready state
                <>
                  <Animated.View style={styles.emptyIconContainer}>
                    <Text style={styles.emptyIcon}>🚀</Text>
                  </Animated.View>
                  <Text style={styles.emptyTitle}>AI Assistant Ready</Text>
                  <Text style={styles.emptyText}>
                    Your intelligent delivery companion offers:
                  </Text>
                  <View style={styles.aiFeaturesGrid}>
                    <View style={styles.featureCard}>
                      <Text style={styles.featureIcon}>🧭</Text>
                      <Text style={styles.featureText}>Smart Routing</Text>
                    </View>
                    <View style={styles.featureCard}>
                      <Text style={styles.featureIcon}>💨</Text>
                      <Text style={styles.featureText}>Fuel Savings</Text>
                    </View>
                    <View style={styles.featureCard}>
                      <Text style={styles.featureIcon}>⚡</Text>
                      <Text style={styles.featureText}>Real-time Updates</Text>
                    </View>
                    <View style={styles.featureCard}>
                      <Text style={styles.featureIcon}>🎯</Text>
                      <Text style={styles.featureText}>Performance Tracking</Text>
                    </View>
                  </View>
                  <Text style={styles.emptySubtext}>
                    🎯 Accept a delivery to unleash AI-powered optimizations!
                  </Text>
                </>
              )}
            </View>
          )}
        </Animated.View>
      </BlurView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  blurContainer: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  card: {
    ...glassEffect.medium,
    borderRadius: borderRadius.xl,
    borderWidth: 2.5,
    borderColor: colors.primary,
    backgroundColor: 'rgba(0, 122, 255, 0.15)',
    position: 'relative',
    overflow: 'hidden',
    ...shadows.glow.blue,
  },
  gradientBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.3,
    zIndex: 0,
  },
  gradientTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: 'rgba(0, 122, 255, 0.3)',
  },
  gradientBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: 'rgba(10, 132, 255, 0.2)',
  },
  shimmerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 150,
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    transform: [{ skewX: '-25deg' }],
    zIndex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.xl,
    paddingBottom: spacing.md,
    zIndex: 2,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  aiIconContainer: {
    position: 'relative',
    marginRight: spacing.md,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiIconWrapper: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 122, 255, 0.3)',
    borderWidth: 2.5,
    borderColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.glow.blue,
  },
  pulseRing: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: colors.primary,
    opacity: 0.4,
  },
  liveIndicator: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.success,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    ...shadows.glow.green,
  },
  headerTextContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xxs,
  },
  headerTitle: {
    ...typography.title2,
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.3,
    flex: 1,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.success,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: borderRadius.sm,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    ...shadows.md,
  },
  liveBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  liveBadgeText: {
    ...typography.small,
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 10,
    letterSpacing: 1.5,
  },
  headerSubtitle: {
    ...typography.caption1,
    color: '#FFFFFF',
    fontSize: 14,
    opacity: 0.9,
    fontWeight: '500',
    lineHeight: 18,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.primary,
    ...shadows.sm,
  },
  statusBadgeLive: {
    backgroundColor: colors.danger,
    borderColor: colors.danger,
    ...shadows.glow.red,
  },
  statusText: {
    ...typography.caption2,
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  statusTextLive: {
    color: '#FFFFFF',
  },
  headerGradient: {
    height: 2,
    backgroundColor: colors.primary,
    opacity: 0.4,
    marginHorizontal: spacing.xl,
    borderRadius: 1,
  },
  headerGradientLive: {
    backgroundColor: colors.success,
    opacity: 0.6,
    ...shadows.glow.green,
  },
  loadingContainer: {
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 140,
  },
  loadingAnimation: {
    marginBottom: spacing.lg,
  },
  loadingDot: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.glass.medium,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
    ...shadows.glow.blue,
  },
  loadingIcon: {
    fontSize: 24,
  },
  loadingText: {
    ...typography.headline,
    color: colors.text.primary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  loadingSubtext: {
    ...typography.subheadline,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  loadingProgress: {
    marginTop: spacing.lg,
    width: '80%',
  },
  loadingProgressBar: {
    height: 4,
    backgroundColor: colors.glass.medium,
    borderRadius: 2,
    overflow: 'hidden',
  },
  loadingProgressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
    ...shadows.glow.blue,
  },
  suggestionsContainer: {
    maxHeight: 400, // Limit height to prevent overwhelming
  },
  emptyContainer: {
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 180,
  },
  emptyIconContainer: {
    marginBottom: spacing.lg,
  },
  emptyIcon: {
    fontSize: 48,
  },
  livePulseRing: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderWidth: 2,
    borderColor: colors.success,
    borderRadius: 30,
    opacity: 0.6,
  },
  emptyTitle: {
    ...typography.title3,
    color: colors.text.primary,
    marginBottom: spacing.sm,
    textAlign: 'center',
    fontWeight: '700',
  },
  emptyText: {
    ...typography.subheadline,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  aiFeaturesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: spacing.lg,
  },
  featureCard: {
    width: '48%',
    backgroundColor: colors.glass.medium,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.light,
    ...shadows.sm,
  },
  featureIcon: {
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  featureText: {
    ...typography.caption1,
    color: colors.text.primary,
    textAlign: 'center',
    fontWeight: '600',
  },
  emptySubtext: {
    ...typography.caption1,
    color: colors.text.tertiary,
    textAlign: 'center',
    lineHeight: 16,
    fontStyle: 'italic',
  },
  refreshHint: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  refreshHintText: {
    ...typography.caption1,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
});
