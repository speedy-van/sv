import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { colors, typography, spacing, borderRadius, shadows } from '../utils/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface OnlineIndicatorProps {
  visible: boolean;
  isSearching?: boolean;
}

export const OnlineIndicator: React.FC<OnlineIndicatorProps> = ({ 
  visible, 
  isSearching = true 
}) => {
  console.log('🔍 OnlineIndicator render:', { visible, isSearching });
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0.3)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const dotAnim1 = useRef(new Animated.Value(0)).current;
  const dotAnim2 = useRef(new Animated.Value(0)).current;
  const dotAnim3 = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible && isSearching) {
      // Pulse animation for main circle
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.3,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Opacity animation for pulse rings
      Animated.loop(
        Animated.sequence([
          Animated.timing(opacityAnim, {
            toValue: 0.8,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0.2,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Progress bar animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(progressAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: false,
          }),
          Animated.timing(progressAnim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: false,
          }),
        ])
      ).start();

      // Animated dots (loading dots)
      Animated.loop(
        Animated.sequence([
          Animated.timing(dotAnim1, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(dotAnim2, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(dotAnim3, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.parallel([
            Animated.timing(dotAnim1, {
              toValue: 0,
              duration: 0,
              useNativeDriver: true,
            }),
            Animated.timing(dotAnim2, {
              toValue: 0,
              duration: 0,
              useNativeDriver: true,
            }),
            Animated.timing(dotAnim3, {
              toValue: 0,
              duration: 0,
              useNativeDriver: true,
            }),
          ]),
        ])
      ).start();

      // White wave shimmer animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(shimmerAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(shimmerAnim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
      opacityAnim.setValue(1);
      progressAnim.setValue(0);
      dotAnim1.setValue(0);
      dotAnim2.setValue(0);
      dotAnim3.setValue(0);
      shimmerAnim.setValue(0);
    }
  }, [visible, isSearching]);

  if (!visible) return null;

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const shimmerTranslateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-300, 300],
  });

  return (
    <View style={styles.container}>
      {/* White wave shimmer overlay for entire card */}
      {isSearching && (
        <Animated.View
          style={[
            styles.cardShimmerOverlay,
            {
              transform: [{ translateX: shimmerTranslateX }],
            },
          ]}
        />
      )}
      <View style={styles.content}>
        <View style={styles.indicatorContainer}>
          {isSearching && (
            <>
              {/* Outer pulse ring with enhanced glow */}
              <Animated.View
                style={[
                  styles.pulseOuter,
                  {
                    transform: [{ scale: pulseAnim }],
                    opacity: opacityAnim,
                  },
                ]}
              />
              {/* Inner pulse ring with enhanced glow */}
              <Animated.View
                style={[
                  styles.pulseInner,
                  {
                    transform: [{ scale: pulseAnim }],
                    opacity: opacityAnim.interpolate({
                      inputRange: [0.2, 0.8],
                      outputRange: [0.4, 1],
                    }),
                  },
                ]}
              />
            </>
          )}
          <View style={[
            styles.dot, 
            !isSearching && styles.dotStatic,
            isSearching && styles.dotGlowing
          ]} />
        </View>
        
        <View style={styles.textContainer}>
          <View style={styles.headerRow}>
            <Text style={styles.statusText}>
              {isSearching ? 'Searching for jobs' : 'Online'}
            </Text>
            {isSearching && (
              <View style={styles.dotsContainer}>
                <Animated.View style={[styles.loadingDot, { opacity: dotAnim1 }]} />
                <Animated.View style={[styles.loadingDot, { opacity: dotAnim2 }]} />
                <Animated.View style={[styles.loadingDot, { opacity: dotAnim3 }]} />
              </View>
            )}
          </View>
          <Text style={styles.subText}>
            {isSearching 
              ? 'Looking for available routes and orders nearby' 
              : 'Ready to receive job assignments'}
          </Text>
        </View>
      </View>
      
      {/* Animated Progress Bar */}
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
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(30, 64, 175, 0.1)',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#10B981',
    // Green neon glow effect - iOS
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 20,
    // Green neon glow effect - Android
    elevation: 14,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  indicatorContainer: {
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  pulseOuter: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.success,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 16,
    elevation: 10,
  },
  pulseInner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.success,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 12,
    elevation: 8,
  },
  dot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.success,
  },
  dotGlowing: {
    backgroundColor: colors.success,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 8,
  },
  dotStatic: {
    backgroundColor: colors.primary,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 4,
  },
  textContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: 4,
  },
  statusText: {
    ...typography.bodyBold,
    color: '#FFFFFF',
    fontSize: 17,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
  },
  loadingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.success,
  },
  subText: {
    ...typography.caption,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    marginTop: spacing.md,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.success,
    borderRadius: borderRadius.sm,
  },
  cardShimmerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: 120,
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    transform: [{ skewX: '-20deg' }],
    zIndex: 10,
  },
});

