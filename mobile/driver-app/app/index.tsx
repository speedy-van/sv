import { useEffect, useRef, useState } from 'react';
import { View, Image, StyleSheet, Animated, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import { useAuth } from '../contexts/AuthContext';
import { colors, spacing, shadows } from '../utils/theme';

const { width, height } = Dimensions.get('window');
const LETTERS = 'Speedy Van'.split('');

export default function Index() {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();
  const [showSplash, setShowSplash] = useState(true);

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const logoRotate = useRef(new Animated.Value(0)).current;
  const particleAnim1 = useRef(new Animated.Value(0)).current;
  const particleAnim2 = useRef(new Animated.Value(0)).current;
  const particleAnim3 = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(-200)).current;
  const letterAnims = useRef(LETTERS.map(() => new Animated.Value(-50))).current;
  const subtitleAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    // Logo entrance with spring effect
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 30,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    // Subtle logo rotation
    Animated.loop(
      Animated.sequence([
        Animated.timing(logoRotate, {
          toValue: 1,
          duration: 10000,
          useNativeDriver: true,
        }),
        Animated.timing(logoRotate, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Floating particles
    Animated.loop(
      Animated.sequence([
        Animated.timing(particleAnim1, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(particleAnim1, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(particleAnim2, {
          toValue: 1,
          duration: 4000,
          useNativeDriver: true,
        }),
        Animated.timing(particleAnim2, {
          toValue: 0,
          duration: 4000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(particleAnim3, {
          toValue: 1,
          duration: 5000,
          useNativeDriver: true,
        }),
        Animated.timing(particleAnim3, {
          toValue: 0,
          duration: 5000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Glow pulsing effect
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: false,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.5,
          duration: 2000,
          useNativeDriver: false,
        }),
      ])
    ).start();

    // Letter drop animation
    setTimeout(() => {
      const letterAnimations = letterAnims.map((anim, index) =>
        Animated.timing(anim, {
          toValue: 0,
          duration: 500,
          delay: index * 50,
          useNativeDriver: true,
        })
      );
      Animated.stagger(50, letterAnimations).start();
    }, 600);

    // Shimmer sweep
    setTimeout(() => {
      Animated.timing(shimmerAnim, {
        toValue: 400,
        duration: 1500,
        useNativeDriver: true,
      }).start();
    }, 1400);

    // Subtitle fade in
    setTimeout(() => {
      Animated.timing(subtitleAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }).start();
    }, 1800);

    // Navigate after animation
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 3200);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!loading && !showSplash) {
      if (isAuthenticated) {
        router.replace('/tabs/dashboard');
      } else {
        router.replace('/auth/login');
      }
    }
  }, [isAuthenticated, loading, showSplash]);

  if (!showSplash && !loading) {
    return null;
  }

  const particle1TranslateY = particleAnim1.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -100],
  });

  const particle2TranslateY = particleAnim2.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 100],
  });

  const particle3TranslateY = particleAnim3.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -80],
  });

  const logoRotateValue = logoRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      {/* Gradient background */}
      <View style={styles.gradientBackground} />

      {/* Floating particles */}
      <Animated.View
        style={[
          styles.particle,
          styles.particle1,
          {
            transform: [{ translateY: particle1TranslateY }],
            opacity: particleAnim1,
          },
        ]}
      />
      <Animated.View
        style={[
          styles.particle,
          styles.particle2,
          {
            transform: [{ translateY: particle2TranslateY }],
            opacity: particleAnim2,
          },
        ]}
      />
      <Animated.View
        style={[
          styles.particle,
          styles.particle3,
          {
            transform: [{ translateY: particle3TranslateY }],
            opacity: particleAnim3,
          },
        ]}
      />

      {/* Logo container with glass effect */}
      <Animated.View
        style={[
          styles.logoWrapper,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <BlurView intensity={40} tint="dark" style={styles.logoBlur}>
          <Animated.View style={[styles.logoGlow, { opacity: glowAnim }]} />
          <Animated.View
            style={[
              styles.logoCircle,
              {
                transform: [{ rotate: logoRotateValue }],
              },
            ]}
          >
            <Image
              source={require('../assets/splash-icon.png')}
              style={styles.logo}
              resizeMode="cover"
            />
          </Animated.View>
        </BlurView>
      </Animated.View>

      {/* App name with letter animation */}
      <View style={styles.textContainer}>
        {LETTERS.map((letter, index) => (
          <Animated.Text
            key={index}
            style={[
              styles.letter,
              {
                transform: [{ translateY: letterAnims[index] }],
                opacity: letterAnims[index].interpolate({
                  inputRange: [-50, 0],
                  outputRange: [0, 1],
                }),
              },
            ]}
          >
            {letter}
          </Animated.Text>
        ))}

        {/* Shimmer effect */}
        <Animated.View
          style={[
            styles.shimmer,
            {
              transform: [{ translateX: shimmerAnim }],
            },
          ]}
        />
      </View>

      {/* Subtitle */}
      <Animated.Text
        style={[
          styles.subtitle,
          {
            opacity: subtitleAnim,
          },
        ]}
      >
        D R I V E R
      </Animated.Text>

      {/* Bottom decoration */}
      <View style={styles.bottomDecoration} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  gradientBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.background.primary,
  },
  particle: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  particle1: {
    backgroundColor: colors.primary,
    opacity: 0.1,
    top: '20%',
    left: '10%',
  },
  particle2: {
    backgroundColor: colors.success,
    opacity: 0.1,
    top: '60%',
    right: '15%',
  },
  particle3: {
    backgroundColor: colors.accent,
    opacity: 0.1,
    bottom: '25%',
    left: '20%',
  },
  logoWrapper: {
    width: 200,
    height: 200,
    borderRadius: 100,
    overflow: 'hidden',
  },
  logoBlur: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 100,
    borderWidth: 2,
    borderColor: colors.border.medium,
  },
  logoGlow: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: colors.primary,
    ...shadows.glow.blue,
  },
  logoCircle: {
    width: 180,
    height: 180,
    borderRadius: 90,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 180,
    height: 180,
  },
  textContainer: {
    flexDirection: 'row',
    marginTop: 60,
    height: 60,
    overflow: 'hidden',
    position: 'relative',
  },
  letter: {
    fontSize: 42,
    fontWeight: '900',
    color: colors.text.primary,
    letterSpacing: -1,
    textShadowColor: colors.shadow.colored.blue,
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 12,
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 100,
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    transform: [{ skewX: '-20deg' }],
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
    marginTop: spacing.md,
    letterSpacing: 8,
  },
  bottomDecoration: {
    position: 'absolute',
    bottom: 60,
    width: 60,
    height: 4,
    backgroundColor: colors.primary,
    borderRadius: 2,
    opacity: 0.8,
  },
});