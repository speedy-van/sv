import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { authService } from '../../services/auth';
import { apiService } from '../../services/api';
import { colors, typography, spacing, borderRadius, shadows } from '../../utils/theme';
import { emoteManager } from '../../services/emoteService';

interface DriverProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  vehicleType: string;
  basePostcode: string;
  locationConsent: boolean;
}

export default function SettingsScreen() {
  const [profile, setProfile] = useState<DriverProfile>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    vehicleType: '',
    basePostcode: '',
    locationConsent: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [emotesEnabled, setEmotesEnabled] = useState(true);

  useEffect(() => {
    loadProfile();
    loadEmoteSettings();
  }, []);

  const loadEmoteSettings = async () => {
    try {
      const enabled = await emoteManager.areEmotesEnabled();
      setEmotesEnabled(enabled);
    } catch (error) {
      console.warn('Failed to load emote settings:', error);
    }
  };

  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await apiService.get('/api/driver/profile');
      
      if (response.success && response.data) {
        const nameParts = response.data.name?.split(' ') || ['', ''];
        setProfile({
          firstName: nameParts[0] || '',
          lastName: nameParts.slice(1).join(' ') || '',
          email: response.data.email || '',
          phone: response.data.phone || '',
          vehicleType: response.data.vehicleType || '',
          basePostcode: response.data.basePostcode || '',
          locationConsent: response.data.locationConsent || false,
        });
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await apiService.put('/api/driver/profile', {
        name: `${profile.firstName} ${profile.lastName}`.trim(),
        phone: profile.phone,
        vehicleType: profile.vehicleType,
        basePostcode: profile.basePostcode,
      });

      if (response.success) {
        Alert.alert('Success', 'Profile updated successfully');
        setEditing(false);
        loadProfile();
      } else {
        Alert.alert('Error', response.error || 'Failed to update profile');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleLocationConsentToggle = async (value: boolean) => {
    const oldValue = profile.locationConsent;
    setProfile({ ...profile, locationConsent: value });
    
    try {
      const response = await apiService.post('/api/driver/availability', {
        locationConsent: value,
      });

      if (!response.success) {
        // Revert on failure
        setProfile({ ...profile, locationConsent: oldValue });
        Alert.alert('Error', response.error || 'Failed to update location consent');
      }
    } catch (error: any) {
      // Revert on error
      setProfile({ ...profile, locationConsent: oldValue });
      Alert.alert('Error', error.message || 'Failed to update location consent');
    }
  };

  const handleEmoteToggle = async (value: boolean) => {
    try {
      await emoteManager.setEmotesEnabled(value);
      setEmotesEnabled(value);
    } catch (error) {
      console.warn('Failed to save emote settings:', error);
      Alert.alert('Error', 'Failed to save emote settings');
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await authService.logout();
            router.replace('/login');
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
        {editing ? (
          <TouchableOpacity
            style={styles.editButton}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#007AFF" />
            ) : (
              <Text style={styles.editButtonText}>Save</Text>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => setEditing(true)}
          >
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Personal Information Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>First Name</Text>
            <TextInput
              style={[styles.input, !editing && styles.inputDisabled]}
              value={profile.firstName}
              onChangeText={(text) => setProfile({ ...profile, firstName: text })}
              editable={editing}
              placeholder="First Name"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Last Name</Text>
            <TextInput
              style={[styles.input, !editing && styles.inputDisabled]}
              value={profile.lastName}
              onChangeText={(text) => setProfile({ ...profile, lastName: text })}
              editable={editing}
              placeholder="Last Name"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={[styles.input, !editing && styles.inputDisabled]}
              value={profile.email}
              onChangeText={(text) => setProfile({ ...profile, email: text })}
              editable={editing}
              placeholder="Email"
              placeholderTextColor="#999"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Phone</Text>
            <TextInput
              style={[styles.input, !editing && styles.inputDisabled]}
              value={profile.phone}
              onChangeText={(text) => setProfile({ ...profile, phone: text })}
              editable={editing}
              placeholder="Phone Number"
              placeholderTextColor="#999"
              keyboardType="phone-pad"
            />
          </View>
        </View>

        {/* Vehicle Information Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vehicle Information</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Vehicle Type</Text>
            <TextInput
              style={[styles.input, !editing && styles.inputDisabled]}
              value={profile.vehicleType}
              onChangeText={(text) => setProfile({ ...profile, vehicleType: text })}
              editable={editing}
              placeholder="e.g., Van, Large Van"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Base Postcode</Text>
            <TextInput
              style={[styles.input, !editing && styles.inputDisabled]}
              value={profile.basePostcode}
              onChangeText={(text) => setProfile({ ...profile, basePostcode: text.toUpperCase() })}
              editable={editing}
              placeholder="e.g., G21 2QB"
              placeholderTextColor="#999"
              autoCapitalize="characters"
            />
          </View>
        </View>

        {/* Privacy Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy & Location</Text>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Ionicons name="location" size={24} color="#007AFF" />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Share Location</Text>
                <Text style={styles.settingDescription}>
                  Allow real-time location sharing during active jobs
                </Text>
              </View>
            </View>
            <Switch
              value={profile.locationConsent}
              onValueChange={handleLocationConsentToggle}
              trackColor={{ false: '#ccc', true: '#007AFF' }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.emoteIcon}>🤖</Text>
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Show Emotes</Text>
                <Text style={styles.settingDescription}>
                  Display animated reactions when accepting/declining jobs
                </Text>
              </View>
            </View>
            <Switch
              value={emotesEnabled}
              onValueChange={handleEmoteToggle}
              trackColor={{ false: '#ccc', true: '#007AFF' }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* Account Actions Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Actions</Text>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/auth/forgot-password')}
          >
            <Ionicons name="key-outline" size={24} color="#007AFF" />
            <Text style={styles.actionButtonText}>Change Password</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.logoutButton]}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={24} color="#F44336" />
            <Text style={[styles.actionButtonText, styles.logoutText]}>Logout</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        </View>

        {/* App Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Information</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Version</Text>
            <Text style={styles.infoValue}>1.0.0</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Build</Text>
            <Text style={styles.infoValue}>1.0.0 (1)</Text>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  editButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#000',
  },
  inputDisabled: {
    backgroundColor: '#f0f0f0',
    color: '#666',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 16,
  },
  settingText: {
    marginLeft: 16,
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 12,
    color: '#666',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  actionButtonText: {
    flex: 1,
    fontSize: 16,
    color: '#000',
    marginLeft: 16,
  },
  logoutButton: {
    borderBottomWidth: 0,
  },
  logoutText: {
    color: '#F44336',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    color: '#000',
    fontWeight: '500',
  },
  emoteIcon: {
    fontSize: 24,
    width: 24,
    textAlign: 'center',
  },
});

