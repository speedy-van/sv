import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import apiService from '../services/api.service';
import { useAuth } from '../context/AuthContext';

interface ProfileData {
  name: string;
  email: string;
  phone: string;
  address: string;
  basePostcode: string;
  vehicleType: string;
  emergencyContact: string;
}

export default function EditProfileScreen({ navigation }: any) {
  const { user, driver, refreshProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData>({
    name: '',
    email: '',
    phone: '',
    address: '',
    basePostcode: '',
    vehicleType: '',
    emergencyContact: '',
  });

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.get<any>('/api/driver/settings');
      
      if (response.success && response.profile) {
        setProfileData({
          name: response.profile.name || '',
          email: response.profile.email || '',
          phone: response.profile.phone || '',
          address: response.profile.address || '',
          basePostcode: response.profile.basePostcode || '',
          vehicleType: response.profile.vehicleType || '',
          emergencyContact: response.profile.emergencyContact || '',
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert('Error', 'Failed to load profile data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    // Validation
    if (!profileData.name.trim()) {
      Alert.alert('Validation Error', 'Name is required');
      return;
    }
    if (!profileData.email.trim()) {
      Alert.alert('Validation Error', 'Email is required');
      return;
    }
    if (!profileData.phone.trim()) {
      Alert.alert('Validation Error', 'Phone number is required');
      return;
    }

    try {
      setIsSaving(true);
      console.log('📤 Saving profile data:', profileData);

      const response = await apiService.put<any>('/api/driver/settings', {
        profile: {
          name: profileData.name,
          email: profileData.email,
          phone: profileData.phone,
          address: profileData.address,
          basePostcode: profileData.basePostcode,
          vehicleType: profileData.vehicleType,
          emergencyContact: profileData.emergencyContact,
        },
      });

      console.log('📥 Save response:', response);

      if (response.success) {
        // Refresh the profile in AuthContext
        await refreshProfile();
        
        Alert.alert(
          'Success',
          'Your profile has been updated successfully!',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        throw new Error(response.error || 'Failed to update profile');
      }
    } catch (error: any) {
      console.error('❌ Error saving profile:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to update profile. Please try again.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const InputField = ({
    label,
    value,
    onChangeText,
    placeholder,
    keyboardType = 'default',
    multiline = false,
    editable = true,
  }: {
    label: string;
    value: string;
    onChangeText: (text: string) => void;
    placeholder: string;
    keyboardType?: 'default' | 'email-address' | 'phone-pad';
    multiline?: boolean;
    editable?: boolean;
  }) => (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={[
          styles.input,
          multiline && styles.inputMultiline,
          !editable && styles.inputDisabled,
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
        editable={editable}
        autoCapitalize={keyboardType === 'email-address' ? 'none' : 'sentences'}
      />
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Personal Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Personal Information</Text>

            <InputField
              label="Full Name"
              value={profileData.name}
              onChangeText={(text) =>
                setProfileData({ ...profileData, name: text })
              }
              placeholder="Enter your full name"
            />

            <InputField
              label="Email Address"
              value={profileData.email}
              onChangeText={(text) =>
                setProfileData({ ...profileData, email: text })
              }
              placeholder="your.email@example.com"
              keyboardType="email-address"
            />

            <InputField
              label="Phone Number"
              value={profileData.phone}
              onChangeText={(text) =>
                setProfileData({ ...profileData, phone: text })
              }
              placeholder="+44 7XXX XXXXXX"
              keyboardType="phone-pad"
            />

            <InputField
              label="Address"
              value={profileData.address}
              onChangeText={(text) =>
                setProfileData({ ...profileData, address: text })
              }
              placeholder="Enter your full address"
              multiline
            />

            <InputField
              label="Base Postcode"
              value={profileData.basePostcode}
              onChangeText={(text) =>
                setProfileData({ ...profileData, basePostcode: text })
              }
              placeholder="Enter your postcode"
            />
          </View>

          {/* Emergency Contact */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Emergency Contact</Text>

            <InputField
              label="Emergency Contact"
              value={profileData.emergencyContact}
              onChangeText={(text) =>
                setProfileData({ ...profileData, emergencyContact: text })
              }
              placeholder="Name and phone number"
              multiline
            />
          </View>

          {/* Vehicle Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Vehicle Information</Text>

            <InputField
              label="Vehicle Type"
              value={profileData.vehicleType}
              onChangeText={(text) =>
                setProfileData({ ...profileData, vehicleType: text })
              }
              placeholder="e.g., Van, Large Van, etc."
            />
          </View>

          {/* Info Box */}
          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={20} color="#3B82F6" />
            <Text style={styles.infoText}>
              Your profile information is used for job assignments and communication. Keep it up to date for the best experience.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Save Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  inputMultiline: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  inputDisabled: {
    backgroundColor: '#F3F4F6',
    color: '#9CA3AF',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#1E40AF',
    marginLeft: 8,
    lineHeight: 20,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
});

