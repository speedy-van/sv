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
    } else {
      pulseAnim.setValue(1);
      opacityAnim.setValue(1);
      progressAnim.setValue(0);
      dotAnim1.setValue(0);
      dotAnim2.setValue(0);
      dotAnim3.setValue(0);
    }
  }, [visible, isSearching]);

  if (!visible) return null;

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.indicatorContainer}>
          {isSearching && (
            <>
              {/* Outer pulse ring */}
              <Animated.View
                style={[
                  styles.pulseOuter,
                  {
                    transform: [{ scale: pulseAnim }],
                    opacity: opacityAnim,
                  },
                ]}
              />
              {/* Inner pulse ring */}
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
          <View style={[styles.dot, !isSearching && styles.dotStatic]} />
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
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.md,
    overflow: 'hidden',
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
  },
  pulseInner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.success,
  },
  dot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.success,
    ...shadows.sm,
  },
  dotStatic: {
    backgroundColor: colors.primary,
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
    color: colors.text.primary,
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
    color: colors.text.secondary,
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: colors.border,
    marginTop: spacing.md,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.success,
    borderRadius: borderRadius.sm,
  },
});

