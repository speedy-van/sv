import { useEffect, useRef, useState } from 'react';
import { View, Image, StyleSheet, Animated, Dimensions, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';

const { width, height } = Dimensions.get('window');
const LETTERS = 'Speedy Van'.split('');

export default function Index() {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();
  const [showSplash, setShowSplash] = useState(true);

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const waterAnim1 = useRef(new Animated.Value(0)).current;
  const waterAnim2 = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(-200)).current;
  const letterAnims = useRef(LETTERS.map(() => new Animated.Value(-50))).current;
  const subtitleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Step 1: Logo elegant fade in and scale
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 40,
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start();

    // Step 2: Subtle water-like motion (two layers moving slowly)
    Animated.loop(
      Animated.timing(waterAnim1, {
        toValue: 1,
        duration: 8000,
        useNativeDriver: true,
      })
    ).start();

    Animated.loop(
      Animated.timing(waterAnim2, {
        toValue: 1,
        duration: 10000,
        useNativeDriver: true,
      })
    ).start();

    // Step 3: Letter-by-letter drop animation (starts at 0.5s)
    setTimeout(() => {
      const letterAnimations = letterAnims.map((anim, index) =>
        Animated.timing(anim, {
          toValue: 0,
          duration: 500,
          delay: index * 50,
          useNativeDriver: true,
        })
      );
      Animated.parallel(letterAnimations).start();
    }, 500);

    // Step 4: Shimmer sweep across text (starts at 1.2s)
    setTimeout(() => {
      Animated.timing(shimmerAnim, {
        toValue: 400,
        duration: 1500,
        useNativeDriver: true,
      }).start();
    }, 1200);

    // Step 5: Subtitle fade in (starts at 1.5s)
    setTimeout(() => {
      Animated.timing(subtitleAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
    }, 1500);

    // Hide splash and navigate after 3 seconds
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 3000);

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
    return null; // Will navigate
  }

  const water1TranslateX = waterAnim1.interpolate({
    inputRange: [0, 1],
    outputRange: [-100, 100],
  });

  const water1TranslateY = waterAnim1.interpolate({
    inputRange: [0, 1],
    outputRange: [-30, 30],
  });

  const water2TranslateX = waterAnim2.interpolate({
    inputRange: [0, 1],
    outputRange: [100, -100],
  });

  const water2TranslateY = waterAnim2.interpolate({
    inputRange: [0, 1],
    outputRange: [30, -30],
  });

  return (
    <View style={styles.container}>
      {/* Water-like Motion Effect - Layer 1 */}
      <Animated.View
        style={[
          styles.waterLayer,
          styles.waterLayer1,
          {
            transform: [
              { translateX: water1TranslateX },
              { translateY: water1TranslateY },
            ],
            opacity: 0.15,
          },
        ]}
      />

      {/* Water-like Motion Effect - Layer 2 */}
      <Animated.View
        style={[
          styles.waterLayer,
          styles.waterLayer2,
          {
            transform: [
              { translateX: water2TranslateX },
              { translateY: water2TranslateY },
            ],
            opacity: 0.1,
          },
        ]}
      />

      {/* Central Logo Container with Elegant Fade */}
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <View style={styles.logoCircle}>
          <Image
            source={require('../assets/splash-icon.png')}
            style={styles.logo}
            resizeMode="cover"
          />
        </View>
      </Animated.View>

      {/* Letter-by-Letter Drop Animation for "Speedy Van" with Shimmer */}
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
        
        {/* Shimmer sweep effect across text */}
        <Animated.View
          style={[
            styles.shimmer,
            {
              transform: [{ translateX: shimmerAnim }],
            },
          ]}
        />
      </View>

      {/* Subtitle with Elegant Fade */}
      <Animated.Text
        style={[
          styles.appSubtitle,
          {
            opacity: subtitleAnim,
          },
        ]}
      >
        D R I V E R
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  waterLayer: {
    position: 'absolute',
    width: width * 1.5,
    height: width * 1.5,
    borderRadius: width,
  },
  waterLayer1: {
    backgroundColor: '#1E40AF',
    top: '30%',
    left: '10%',
  },
  waterLayer2: {
    backgroundColor: '#1E3A8A',
    top: '40%',
    right: '10%',
  },
  logoContainer: {
    width: 220,
    height: 220,
    borderRadius: 110,
    alignItems: 'center',
    justifyContent: 'center',
    // iOS subtle blue glow
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 30,
    // Android subtle glow
    elevation: 16,
    borderWidth: 3,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    backgroundColor: 'transparent',
  },
  logoCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    overflow: 'hidden',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 200,
    height: 200,
  },
  textContainer: {
    flexDirection: 'row',
    marginTop: 60,
    height: 60,
    overflow: 'hidden',
    position: 'relative',
  },
  letter: {
    fontSize: 44,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -1,
    textShadowColor: 'rgba(59, 130, 246, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 12,
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 100,
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    transform: [{ skewX: '-20deg' }],
  },
  appSubtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#3B82F6',
    marginTop: 12,
    letterSpacing: 8,
    textTransform: 'uppercase',
  },
});

