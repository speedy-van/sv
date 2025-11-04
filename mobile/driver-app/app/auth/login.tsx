import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
  Animated,
  Easing,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { colors, typography, spacing, borderRadius, shadows, glassEffect } from '../../utils/theme';
import { validateEmail } from '../../utils/helpers';
import { soundService } from '../../services/soundService';
import { AnimatedScreen } from '../../components/AnimatedScreen';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [showPassword, setShowPassword] = useState(false);

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-20)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Per-character shimmer animations
  const welcomeText = "Welcome Back!";
  const shimmerAnims = useRef(welcomeText.split('').map(() => new Animated.Value(0))).current;

  useEffect(() => {
    // Main animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    // Rotate animation for logo
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 20000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Pulse animation for logo
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Premium per-character shimmer: each letter animates in sequence
    const staggerDelay = 100; // 100ms between each character
    const fadeDuration = 600; // Smooth 600ms fade in/out

    shimmerAnims.forEach((anim, index) => {
      const delay = index * staggerDelay;

      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1,
            duration: fadeDuration,
            easing: Easing.inOut(Easing.ease), // Smooth easing
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: fadeDuration,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          // Wait for all other characters to finish before restarting
          Animated.delay((shimmerAnims.length - 1 - index) * staggerDelay),
        ])
      ).start();
    });
  }, [shimmerAnims]);

  const validate = (): boolean => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    // Play button click sound
    soundService.playButtonClick();
    
    if (!validate()) {
      soundService.playError();
      return;
    }

    setLoading(true);
    try {
      const result = await login(email.trim(), password);
      if (result.success) {
        soundService.playSuccess();
        router.replace('/tabs/dashboard');
      } else {
        soundService.playError();
        Alert.alert('Login Failed', result.error || 'Invalid email or password');
      }
    } catch (error: any) {
      soundService.playError();
      Alert.alert('Error', error.message || 'An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  const rotateValue = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <AnimatedScreen>
      <View style={styles.container}>
        {/* Enhanced Top Decoration */}
        <Animated.View
          style={[
            styles.topDecoration,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          <View style={styles.topDecorationGradient}>
            <View style={styles.gradientTop} />
            <View style={styles.gradientBottom} />
          </View>
        </Animated.View>
      
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Enhanced Logo/Header */}
          <Animated.View
            style={[
              styles.header,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <BlurView intensity={40} tint="dark" style={styles.headerBlur}>
              <View style={styles.headerContent}>
                {/* Enhanced Logo */}
                <Animated.View
                  style={[
                    styles.logoContainer,
                    {
                      transform: [
                        { scale: scaleAnim },
                        { rotate: rotateValue },
                      ],
                    },
                  ]}
                >
                  <Animated.View
                    style={[
                      styles.logoRing,
                      {
                        transform: [{ scale: pulseAnim }],
                      },
                    ]}
                  />
                  <View style={styles.logoCircle}>
                    <Image
                      source={require('../../assets/icon.png')}
                      style={styles.logoImage}
                      resizeMode="cover"
                    />
                  </View>
                  <View style={styles.logoBadge}>
                    <Ionicons name="shield-checkmark" size={16} color="#10B981" />
                  </View>
                </Animated.View>

                {/* Title */}
                <View style={styles.titleContainer}>
                  <View style={styles.titleTextContainer}>
                    {welcomeText.split('').map((char, index) => (
                      <Animated.Text
                        key={index}
                        style={[
                          styles.titleChar,
                          {
                            opacity: shimmerAnims[index].interpolate({
                              inputRange: [0, 0.5, 1],
                              outputRange: [0.8, 1, 0.8],
                            }),
                          },
                        ]}
                      >
                        {char}
                      </Animated.Text>
                    ))}
                  </View>
                </View>
                <Text style={styles.subtitle}>Sign in to continue your journey</Text>
              </View>
              <View style={styles.headerGradient} />
            </BlurView>
          </Animated.View>

          {/* Enhanced Form Card */}
          <Animated.View
            style={[
              styles.formCardContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <BlurView intensity={30} tint="dark" style={styles.formCardBlur}>
              <View style={styles.formCard}>
                {/* Email Input - Enhanced */}
                <View style={styles.inputGroup}>
                  <View style={styles.labelContainer}>
                    <Ionicons name="mail" size={16} color="#06B6D4" />
                    <Text style={styles.label}>Email Address</Text>
                  </View>
                  <View style={[styles.inputContainer, errors.email && styles.inputErrorContainer]}>
                    <View style={styles.inputIconContainer}>
                      <Ionicons name="mail-outline" size={20} color={errors.email ? '#EF4444' : '#06B6D4'} />
                    </View>
                    <TextInput
                      style={[styles.input, errors.email && styles.inputError]}
                      placeholder="driver@example.com"
                      placeholderTextColor="#9CA3AF"
                      value={email}
                      onChangeText={(text) => {
                        setEmail(text);
                        if (errors.email) setErrors({ ...errors, email: undefined });
                      }}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      textContentType="emailAddress"
                      autoComplete="email"
                      editable={!loading}
                    />
                    {email.length > 0 && !errors.email && (
                      <View style={styles.inputSuccessIcon}>
                        <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                      </View>
                    )}
                  </View>
                  {errors.email && (
                    <Animated.View
                      style={[
                        styles.errorContainer,
                        {
                          opacity: fadeAnim,
                        },
                      ]}
                    >
                      <Ionicons name="alert-circle" size={14} color="#EF4444" />
                      <Text style={styles.errorText}>{errors.email}</Text>
                    </Animated.View>
                  )}
                </View>

                {/* Password Input - Enhanced */}
                <View style={styles.inputGroup}>
                  <View style={styles.labelContainer}>
                    <Ionicons name="lock-closed" size={16} color="#06B6D4" />
                    <Text style={styles.label}>Password</Text>
                  </View>
                  <View style={[styles.inputContainer, errors.password && styles.inputErrorContainer]}>
                    <View style={styles.inputIconContainer}>
                      <Ionicons name="lock-closed-outline" size={20} color={errors.password ? '#EF4444' : '#06B6D4'} />
                    </View>
                    <TextInput
                      style={[styles.input, errors.password && styles.inputError]}
                      placeholder="Enter your password"
                      placeholderTextColor="#9CA3AF"
                      value={password}
                      onChangeText={(text) => {
                        setPassword(text);
                        if (errors.password) setErrors({ ...errors, password: undefined });
                      }}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
                      keyboardType="ascii-capable"
                      textContentType="password"
                      autoComplete="password"
                      editable={!loading}
                    />
                    <TouchableOpacity
                      style={styles.passwordToggle}
                      onPress={() => {
                        soundService.playButtonClick();
                        setShowPassword(!showPassword);
                      }}
                    >
                      <Ionicons
                        name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={20}
                        color="#9CA3AF"
                      />
                    </TouchableOpacity>
                  </View>
                  {errors.password && (
                    <Animated.View
                      style={[
                        styles.errorContainer,
                        {
                          opacity: fadeAnim,
                        },
                      ]}
                    >
                      <Ionicons name="alert-circle" size={14} color="#EF4444" />
                      <Text style={styles.errorText}>{errors.password}</Text>
                    </Animated.View>
                  )}
                </View>

                {/* Forgot Password Link - Enhanced */}
                <TouchableOpacity
                  style={styles.forgotPassword}
                  onPress={() => {
                    soundService.playButtonClick();
                    router.push('/auth/forgot-password');
                  }}
                  disabled={loading}
                  activeOpacity={0.7}
                >
                  <Ionicons name="key-outline" size={16} color="#06B6D4" />
                  <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                </TouchableOpacity>

                {/* Enhanced Login Button */}
                <Animated.View
                  style={{
                    transform: [{ scale: scaleAnim }],
                  }}
                >
                  <TouchableOpacity
                    style={[styles.button, loading && styles.buttonDisabled]}
                    onPress={handleLogin}
                    disabled={loading}
                    activeOpacity={0.8}
                  >
                    <BlurView intensity={20} tint="dark" style={styles.buttonBlur}>
                      <View style={styles.buttonContent}>
                        {loading ? (
                          <ActivityIndicator color="#FFFFFF" size="small" />
                        ) : (
                          <>
                            <Ionicons name="log-in" size={20} color="#FFFFFF" />
                            <Text style={styles.buttonText}>Sign In</Text>
                            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                          </>
                        )}
                      </View>
                      <View style={styles.buttonGradient} />
                    </BlurView>
                  </TouchableOpacity>
                </Animated.View>
              </View>
            </BlurView>
          </Animated.View>

          {/* Enhanced Footer */}
          <Animated.View
            style={[
              styles.footer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <BlurView intensity={20} tint="dark" style={styles.footerBlur}>
              <View style={styles.footerContent}>
                <View style={styles.divider} />
                <View style={styles.supportContainer}>
                  <View style={styles.supportIconContainer}>
                    <Ionicons name="help-circle" size={20} color="#06B6D4" />
                  </View>
                  <Text style={styles.footerText}>Need help?</Text>
                </View>
                <TouchableOpacity
                  style={styles.contactButton}
                  onPress={() => {
                    soundService.playButtonClick();
                    Alert.alert('Contact Support', 'Call: 01202129764\nEmail: support@speedy-van.co.uk');
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.contactText}>Contact Support</Text>
                  <Ionicons name="chevron-forward" size={18} color="#06B6D4" />
                </TouchableOpacity>
              </View>
            </BlurView>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
      </View>
    </AnimatedScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  topDecoration: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 350,
    borderBottomLeftRadius: borderRadius.xl * 2,
    borderBottomRightRadius: borderRadius.xl * 2,
    overflow: 'hidden',
  },
  topDecorationGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.6,
  },
  gradientTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: '#1E3A8A',
  },
  gradientBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: '#1E40AF',
  },
  scrollContent: {
    flexGrow: 1,
    padding: spacing.lg,
    paddingTop: 60,
    justifyContent: 'center',
  },
  header: {
    marginBottom: spacing.xl,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.lg,
  },
  headerBlur: {
    padding: spacing.xl,
    borderRadius: borderRadius.xl,
    borderWidth: 2,
    borderColor: '#06B6D4',
    shadowColor: '#06B6D4',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    position: 'relative',
  },
  headerContent: {
    alignItems: 'center',
    gap: spacing.md,
    zIndex: 2,
  },
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '100%',
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
    zIndex: 1,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    position: 'relative',
  },
  logoRing: {
    position: 'absolute',
    top: -8,
    left: -8,
    right: -8,
    bottom: -8,
    borderRadius: 64,
    borderWidth: 3,
    borderColor: 'rgba(6, 182, 212, 0.3)',
    borderStyle: 'dashed',
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#06B6D4',
    shadowColor: '#06B6D4',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 24,
    elevation: 16,
  },
  logoImage: {
    width: 92,
    height: 92,
  },
  logoBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#0F172A',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 8,
  },
  titleContainer: {
    position: 'relative',
    overflow: 'hidden',
    paddingHorizontal: spacing.lg,
  },
  titleTextContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    marginBottom: spacing.xs,
  },
  titleChar: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    textShadowColor: 'rgba(255, 255, 255, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    lineHeight: 38,
  },
  subtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '500',
    opacity: 0.9,
  },
  formCardContainer: {
    marginBottom: spacing.xl,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.lg,
  },
  formCardBlur: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  formCard: {
    backgroundColor: 'rgba(30, 64, 175, 0.1)',
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    borderWidth: 2,
    borderColor: 'rgba(6, 182, 212, 0.3)',
    shadowColor: '#06B6D4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 12,
    gap: spacing.lg,
  },
  inputGroup: {
    gap: spacing.sm,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 64, 175, 0.15)',
    borderWidth: 2,
    borderColor: 'rgba(6, 182, 212, 0.3)',
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    minHeight: 56,
  },
  inputErrorContainer: {
    borderColor: '#EF4444',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  inputIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
    paddingVertical: spacing.md,
  },
  inputError: {
    color: '#EF4444',
  },
  inputSuccessIcon: {
    marginLeft: spacing.sm,
  },
  passwordToggle: {
    padding: spacing.xs,
    marginLeft: spacing.sm,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs / 2,
    paddingHorizontal: spacing.xs,
  },
  errorText: {
    fontSize: 13,
    color: '#EF4444',
    fontWeight: '600',
  },
  forgotPassword: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-end',
    marginTop: -spacing.sm,
    padding: spacing.xs,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#06B6D4',
    fontWeight: '600',
  },
  button: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginTop: spacing.md,
    ...shadows.lg,
  },
  buttonBlur: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: '#06B6D4',
    borderWidth: 2,
    borderColor: '#06B6D4',
    shadowColor: '#06B6D4',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 20,
    elevation: 16,
    position: 'relative',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    zIndex: 2,
  },
  buttonGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(6, 182, 212, 0.3)',
    zIndex: 1,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  footer: {
    marginTop: spacing.xl,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.md,
  },
  footerBlur: {
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    borderWidth: 1.5,
    borderColor: 'rgba(6, 182, 212, 0.3)',
    backgroundColor: 'rgba(30, 64, 175, 0.1)',
  },
  footerContent: {
    alignItems: 'center',
    gap: spacing.md,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: 'rgba(6, 182, 212, 0.3)',
    marginBottom: spacing.sm,
  },
  supportContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  supportIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
    opacity: 0.9,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.sm,
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.3)',
  },
  contactText: {
    fontSize: 15,
    color: '#06B6D4',
    fontWeight: '700',
  },
});

