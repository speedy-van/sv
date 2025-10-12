import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen() {
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    try {
      await login(email, password);
    } catch (error) {
      Alert.alert('Login Failed', 'Please check your credentials and try again');
    }
  };

  const handleBecomeDriver = async () => {
    const url = 'https://speedy-van.co.uk/driver-application';
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Cannot open the driver application page');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open the link');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Ionicons name="car-sport" size={60} color="#3B82F6" />
          <Text style={styles.title}>Speedy Van</Text>
          <Text style={styles.subtitle}>Driver Portal</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Email */}
          <View style={styles.inputContainer}>
            <Ionicons name="mail" size={20} color="#6B7280" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#9CA3AF"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Password */}
          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed" size={20} color="#6B7280" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#9CA3AF"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
              <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Login Button */}
          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Sign In</Text>
            )}
          </TouchableOpacity>

          {/* Test Credentials */}
          {__DEV__ && (
            <TouchableOpacity
              style={styles.testCredentials}
              onPress={() => {
                setEmail('deloalo99');
                setPassword('Aa234311Aa');
              }}
            >
              <Text style={styles.testCredentialsText}>Use Test Account</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Become a Driver */}
        <View style={styles.becomeDriver}>
          <Text style={styles.becomeDriverText}>Not a driver yet?</Text>
          <TouchableOpacity onPress={handleBecomeDriver}>
            <Text style={styles.becomeDriverLink}>Become a Driver →</Text>
          </TouchableOpacity>
        </View>

        {/* Support */}
        <View style={styles.support}>
          <Text style={styles.supportText}>Need help?</Text>
          <Text style={styles.supportEmail}>support@speedy-van.co.uk</Text>
          <Text style={styles.supportPhone}>07901846297</Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 4,
  },
  form: {
    marginBottom: 32,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginBottom: 16,
    paddingHorizontal: 16,
    height: 48,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  eyeIcon: {
    padding: 4,
  },
  button: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  testCredentials: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    alignItems: 'center',
  },
  testCredentialsText: {
    color: '#6B7280',
    fontSize: 14,
  },
  becomeDriver: {
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 24,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  becomeDriverText: {
    color: '#6B7280',
    fontSize: 14,
    marginBottom: 8,
  },
  becomeDriverLink: {
    color: '#3B82F6',
    fontSize: 16,
    fontWeight: '600',
  },
  support: {
    alignItems: 'center',
  },
  supportText: {
    color: '#6B7280',
    fontSize: 14,
    marginBottom: 8,
  },
  supportEmail: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '600',
  },
  supportPhone: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
});