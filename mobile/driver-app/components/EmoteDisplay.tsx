import React, { useEffect, useRef } from 'react';
import { View, Image, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { EmoteDisplayData } from '../services/emoteService';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface EmoteDisplayProps {
  emoteData: EmoteDisplayData;
  onComplete: () => void;
  position?: { x: number; y: number }; // Optional custom position
}

export const EmoteDisplay: React.FC<EmoteDisplayProps> = ({
  emoteData,
  onComplete,
  position
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const translateYAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Reset animations
    fadeAnim.setValue(0);
    scaleAnim.setValue(0.5);
    translateYAnim.setValue(0);
    rotateAnim.setValue(0);

    // Create animation sequence based on type
    let animationSequence: Animated.CompositeAnimation;

    switch (emoteData.animationType) {
      case 'bounce':
        animationSequence = Animated.sequence([
          // Quick scale up with bounce
          Animated.parallel([
            Animated.spring(scaleAnim, {
              toValue: 1.2,
              tension: 100,
              friction: 8,
              useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            }),
          ]),
          // Bounce down and settle
          Animated.spring(scaleAnim, {
            toValue: 1.0,
            tension: 80,
            friction: 10,
            useNativeDriver: true,
          }),
          // Hold for visibility
          Animated.delay(emoteData.duration - 600),
          // Fade out
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]);
        break;

      case 'slide_up':
        animationSequence = Animated.sequence([
          // Start from bottom
          Animated.timing(translateYAnim, {
            toValue: 50,
            duration: 0,
            useNativeDriver: true,
          }),
          // Slide up with fade in
          Animated.parallel([
            Animated.spring(translateYAnim, {
              toValue: 0,
              tension: 60,
              friction: 8,
              useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
              toValue: 1,
              duration: 400,
              useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
              toValue: 1.0,
              tension: 80,
              friction: 10,
              useNativeDriver: true,
            }),
          ]),
          // Hold
          Animated.delay(emoteData.duration - 800),
          // Slide down and fade out
          Animated.parallel([
            Animated.timing(translateYAnim, {
              toValue: -30,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            }),
          ]),
        ]);
        break;

      case 'shake':
        animationSequence = Animated.sequence([
          // Quick shake animation
          Animated.parallel([
            Animated.timing(fadeAnim, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
              toValue: 1.0,
              tension: 80,
              friction: 10,
              useNativeDriver: true,
            }),
          ]),
          // Shake sequence
          ...Array(3).fill(0).map((_, i) =>
            Animated.sequence([
              Animated.timing(rotateAnim, {
                toValue: i % 2 === 0 ? 0.1 : -0.1,
                duration: 100,
                useNativeDriver: true,
              }),
              Animated.timing(rotateAnim, {
                toValue: 0,
                duration: 100,
                useNativeDriver: true,
              }),
            ])
          ).flat(),
          // Hold
          Animated.delay(emoteData.duration - 1000),
          // Fade out
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]);
        break;

      case 'slide_down':
        animationSequence = Animated.sequence([
          // Start from top
          Animated.timing(translateYAnim, {
            toValue: -50,
            duration: 0,
            useNativeDriver: true,
          }),
          // Slide down with fade in
          Animated.parallel([
            Animated.spring(translateYAnim, {
              toValue: 0,
              tension: 60,
              friction: 8,
              useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
              toValue: 1,
              duration: 400,
              useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
              toValue: 1.0,
              tension: 80,
              friction: 10,
              useNativeDriver: true,
            }),
          ]),
          // Hold
          Animated.delay(emoteData.duration - 800),
          // Slide up and fade out
          Animated.parallel([
            Animated.timing(translateYAnim, {
              toValue: 30,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            }),
          ]),
        ]);
        break;

      case 'fade_in':
      default:
        animationSequence = Animated.sequence([
          // Simple fade in with scale
          Animated.parallel([
            Animated.spring(scaleAnim, {
              toValue: 1.0,
              tension: 80,
              friction: 10,
              useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
              toValue: 1,
              duration: 400,
              useNativeDriver: true,
            }),
          ]),
          // Hold
          Animated.delay(emoteData.duration - 800),
          // Fade out
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ]);
        break;
    }

    // Start animation and call onComplete when done
    animationSequence.start(() => {
      onComplete();
    });

    // Cleanup on unmount
    return () => {
      animationSequence.stop();
    };
  }, [emoteData]);

  const defaultPosition = {
    x: SCREEN_WIDTH / 2 - 40, // Center horizontally
    y: SCREEN_HEIGHT / 2 - 80, // Slightly above center
  };

  const displayPosition = position || defaultPosition;

  const rotateValue = rotateAnim.interpolate({
    inputRange: [-0.1, 0, 0.1],
    outputRange: ['-10deg', '0deg', '10deg'],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          left: displayPosition.x,
          top: displayPosition.y,
          opacity: fadeAnim,
          transform: [
            { scale: scaleAnim },
            { translateY: translateYAnim },
            { rotate: rotateValue },
          ],
        },
      ]}
      pointerEvents="none"
    >
      <View style={styles.emoteWrapper}>
        {emoteData.asset.isEmoji ? (
          <Text style={styles.emoteEmoji}>{emoteData.asset.emoji}</Text>
        ) : (
          <Image
            source={emoteData.asset}
            style={styles.emoteImage}
            resizeMode="contain"
          />
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 9999, // High z-index to appear above everything
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoteWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  emoteImage: {
    width: 60,
    height: 60,
  },
  emoteEmoji: {
    fontSize: 48,
    textAlign: 'center',
    lineHeight: 60,
  },
});
