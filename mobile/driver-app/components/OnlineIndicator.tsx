import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows, glassEffect } from '../utils/theme';

interface OnlineIndicatorProps {
  visible: boolean;
  isSearching?: boolean;
}

export const OnlineIndicator: React.FC<OnlineIndicatorProps> = ({
  visible,
  isSearching = true
}) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0.3)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Fade in animation
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();

      if (isSearching) {
        // Pulse animation - enhanced
        Animated.loop(
          Animated.sequence([
            Animated.parallel([
              Animated.timing(pulseAnim, {
                toValue: 1.3,
                duration: 1200,
                useNativeDriver: true,
              }),
              Animated.timing(scaleAnim, {
                toValue: 1.05,
                duration: 1200,
                useNativeDriver: true,
              }),
            ]),
            Animated.parallel([
              Animated.timing(pulseAnim, {
                toValue: 1,
                duration: 1200,
                useNativeDriver: true,
              }),
              Animated.timing(scaleAnim, {
                toValue: 1,
                duration: 1200,
                useNativeDriver: true,
              }),
            ]),
          ])
        ).start();

        // Opacity animation - enhanced
        Animated.loop(
          Animated.sequence([
            Animated.timing(opacityAnim, {
              toValue: 0.9,
              duration: 1200,
              useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
              toValue: 0.2,
              duration: 1200,
              useNativeDriver: true,
            }),
          ])
        ).start();

        // Rotate animation for search icon
        Animated.loop(
          Animated.timing(rotateAnim, {
            toValue: 1,
            duration: 3000,
            useNativeDriver: true,
          })
        ).start();

        // Progress bar - smoother
        Animated.loop(
          Animated.sequence([
            Animated.timing(progressAnim, {
              toValue: 1,
              duration: 2500,
              useNativeDriver: false,
            }),
            Animated.timing(progressAnim, {
              toValue: 0,
              duration: 0,
              useNativeDriver: false,
            }),
          ])
        ).start();

      }
    }
  }, [visible, isSearching]);

  if (!visible) return null;

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const rotateValue = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <BlurView intensity={40} tint="dark" style={styles.blurContainer}>
        <Animated.View style={[styles.content, shadows.glow.green, { transform: [{ scale: scaleAnim }] }]}>
          {/* Gradient Background */}
          {isSearching && (
            <View style={styles.gradientBackground}>
              <View style={styles.gradientTop} />
              <View style={styles.gradientBottom} />
            </View>
          )}


          {/* Main Content */}
          <View style={styles.mainContent}>
            {/* Indicator Icon Container - Enhanced */}
            <View style={styles.indicatorContainer}>
              {isSearching && (
                <>
                  {/* Outer pulse rings */}
                  <Animated.View
                    style={[
                      styles.pulseOuter,
                      {
                        transform: [{ scale: pulseAnim }],
                        opacity: opacityAnim,
                      },
                    ]}
                  />
                  <Animated.View
                    style={[
                      styles.pulseInner,
                      {
                        transform: [{ scale: pulseAnim }],
                        opacity: opacityAnim.interpolate({
                          inputRange: [0.2, 0.9],
                          outputRange: [0.5, 1],
                        }),
                      },
                    ]}
                  />
                  {/* Search icon with rotation */}
                  <Animated.View
                    style={[
                      styles.searchIconContainer,
                      {
                        transform: [{ rotate: rotateValue }],
                      },
                    ]}
                  >
                    <Ionicons name="search" size={24} color="#FFFFFF" />
                  </Animated.View>
                </>
              )}
              {!isSearching && (
                <View style={styles.dotContainer}>
                  <View style={[styles.dot, styles.dotStatic]} />
                </View>
              )}
            </View>

            {/* Text Content - Enhanced */}
            <View style={styles.textContainer}>
              <View style={styles.titleRow}>
                <View style={styles.titleContent}>
                  <Text style={styles.statusText} numberOfLines={1} ellipsizeMode="tail">
                    {isSearching ? 'Searching for jobs' : '✓ Online'}
                  </Text>
                  {isSearching && (
                    <View style={styles.searchBadge}>
                      <View style={styles.searchBadgeDot} />
                      <Text style={styles.searchBadgeText}>ACTIVE</Text>
                    </View>
                  )}
                </View>
              </View>
              <Text style={styles.subText}>
                {isSearching
                  ? 'Looking for available routes nearby'
                  : 'Ready to receive assignments'}
              </Text>
              {isSearching && (
                <View style={styles.searchStats}>
                  <View style={styles.statItem}>
                    <Ionicons name="location" size={14} color="#FFFFFF" />
                    <Text style={styles.statText}>Nearby</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Ionicons name="time" size={14} color="#FFFFFF" />
                    <Text style={styles.statText}>Real-time</Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        </Animated.View>

        {/* Progress bar - Enhanced */}
        {isSearching && (
          <View style={styles.progressBarContainer}>
            <Animated.View
              style={[
                styles.progressBar,
                {
                  width: progressWidth,
                },
              ]}
            />
            <View style={styles.progressBarGlow} />
          </View>
        )}
      </BlurView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.lg,
  },
  blurContainer: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  content: {
    ...glassEffect.medium,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    padding: spacing.xl + spacing.md,
    borderWidth: 2.5,
    borderColor: colors.success,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    position: 'relative',
    overflow: 'hidden',
    ...shadows.glow.green,
    minHeight: 120,
  },
  gradientBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.3,
  },
  gradientTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: 'rgba(16, 185, 129, 0.3)',
  },
  gradientBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: 'rgba(5, 150, 105, 0.2)',
  },
  mainContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    flex: 1,
    zIndex: 1,
  },
  indicatorContainer: {
    width: 70,
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    backgroundColor: 'rgba(16, 185, 129, 0.25)',
    borderRadius: 35,
    borderWidth: 3,
    borderColor: colors.success,
    ...shadows.glow.green,
  },
  pulseOuter: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: colors.success,
    opacity: 0.4,
  },
  pulseInner: {
    position: 'absolute',
    width: 55,
    height: 55,
    borderRadius: 27.5,
    backgroundColor: colors.success,
    opacity: 0.6,
  },
  searchIconContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  dotContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  dotGlowing: {
    backgroundColor: colors.success,
    ...shadows.glow.green,
  },
  dotStatic: {
    backgroundColor: colors.primary,
  },
  textContainer: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
  },
  titleRow: {
    marginBottom: spacing.xs,
  },
  titleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'nowrap',
    flexShrink: 1,
  },
  statusText: {
    ...typography.headline,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.2,
    flexShrink: 1,
    flex: 1,
    minWidth: 0,
  },
  searchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.success,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    flexShrink: 0,
    ...shadows.md,
  },
  searchBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  searchBadgeText: {
    ...typography.small,
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 11,
    letterSpacing: 1.5,
  },
  subText: {
    ...typography.subheadline,
    color: '#FFFFFF',
    fontSize: 15,
    opacity: 0.95,
    lineHeight: 22,
    marginBottom: spacing.sm,
    fontWeight: '500',
  },
  searchStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  statText: {
    ...typography.caption,
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  progressBarContainer: {
    height: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
    borderRadius: 2.5,
    position: 'relative',
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.success,
    borderRadius: 2.5,
    ...shadows.glow.green,
  },
  progressBarGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.success,
    opacity: 0.3,
    borderRadius: 2.5,
  },
});