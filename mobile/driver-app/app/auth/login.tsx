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
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { colors, typography, spacing, borderRadius, shadows } from '../../utils/theme';
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
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
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
  }, []);

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

  return (
    <AnimatedScreen>
      <View style={styles.container}>
        {/* Top Decoration */}
        <View style={styles.topDecoration} />
      
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo/Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <View style={styles.logoCircle}>
                <Image
                  source={require('../../assets/icon.png')}
                  style={styles.logoImage}
                  resizeMode="cover"
                />
              </View>
            </View>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>Welcome Back!</Text>
              {/* White wave shimmer overlay */}
              <Animated.View
                style={[
                  styles.titleShimmer,
                  {
                    transform: [{
                      translateX: shimmerAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-300, 300],
                      }),
                    }],
                  },
                ]}
              />
            </View>
            <Text style={styles.subtitle}>Sign in to continue your journey</Text>
          </View>

          {/* Form Card */}
          <View style={styles.formCard}>
            {/* Email Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
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
              </View>
              {errors.email && (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={14} color="#EF4444" />
                  <Text style={styles.errorText}>{errors.email}</Text>
                </View>
              )}
            </View>

            {/* Password Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, errors.password && styles.inputError]}
                  placeholder="Enter your password"
                  placeholderTextColor="#9CA3AF"
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (errors.password) setErrors({ ...errors, password: undefined });
                  }}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="ascii-capable"
                  textContentType="password"
                  autoComplete="password"
                  editable={!loading}
                />
              </View>
              {errors.password && (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={14} color="#EF4444" />
                  <Text style={styles.errorText}>{errors.password}</Text>
                </View>
              )}
            </View>

            {/* Forgot Password Link */}
            <TouchableOpacity
              style={styles.forgotPassword}
              onPress={() => {
                soundService.playButtonClick();
                router.push('/auth/forgot-password');
              }}
              disabled={loading}
            >
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

            {/* Login Button */}
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Text style={styles.buttonText}>Sign In</Text>
                  <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <View style={styles.divider} />
            <View style={styles.supportContainer}>
              <Ionicons name="help-circle-outline" size={18} color="#6B7280" />
              <Text style={styles.footerText}>Need help?</Text>
            </View>
            <TouchableOpacity onPress={() => {
              soundService.playButtonClick();
              Alert.alert('Contact Support', 'Call: 01202129746\nEmail: support@speedy-van.co.uk');
            }}>
              <Text style={styles.contactText}>Contact Support →</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      </View>
    </AnimatedScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A', // Matches splash screen
  },
  topDecoration: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 300,
    backgroundColor: '#1E3A8A', // Darker blue matching splash screen theme
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    opacity: 0.6,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 60,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    // iOS blue neon glow
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 30,
    // Android blue neon glow
    elevation: 20,
    borderWidth: 5,
    borderColor: '#3B82F6',
    backgroundColor: 'transparent',
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: 100,
    height: 100,
  },
  titleContainer: {
    position: 'relative',
    overflow: 'hidden',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#000000', // Black text for maximum contrast
    marginBottom: 8,
    letterSpacing: -0.5,
    textAlign: 'center',
    textShadowColor: 'rgba(255, 255, 255, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  titleShimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: 100,
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    transform: [{ skewX: '-20deg' }],
  },
  subtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '500',
    opacity: 0.9,
  },
  formCard: {
    backgroundColor: 'rgba(30, 64, 175, 0.1)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 64, 175, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
    paddingVertical: 16,
  },
  inputError: {
    borderColor: '#EF4444',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  errorText: {
    fontSize: 13,
    color: '#EF4444',
    fontWeight: '500',
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: -8,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#3B82F6', // Consistent blue
    fontWeight: '600',
  },
  button: {
    flexDirection: 'row',
    backgroundColor: '#3B82F6', // Consistent blue
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    gap: 8,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 12,
  },
  buttonDisabled: {
    opacity: 0.6,
    backgroundColor: '#9CA3AF',
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  footer: {
    marginTop: 40,
    alignItems: 'center',
    gap: 16,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: 'rgba(59, 130, 246, 0.3)',
    marginBottom: 8,
  },
  supportContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  footerText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
    opacity: 0.8,
  },
  contactText: {
    fontSize: 15,
    color: '#3B82F6', // Consistent blue
    fontWeight: '600',
  },
});

