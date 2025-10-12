import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  StatusBar,
  TextInput,
  Image,
  Modal,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { COMPANY_INFO } from '../config/api';
import * as ImagePicker from 'expo-image-picker';
import apiService from '../services/api.service';
import { saveProfile, getProfile } from '../services/storage.service';

interface ProfileData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  basePostcode: string;
  vehicleType: string;
  licensePlate: string;
  insuranceProvider: string;
  insuranceExpiry: string;
  profilePhoto?: string;
}

interface NotificationSettings {
  newJobs: boolean;
  routeUpdates: boolean;
  earningsUpdates: boolean;
  maintenanceReminders: boolean;
}

export default function ProfileScreen() {
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'vehicle' | 'notifications' | 'settings'>('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Profile data state
  const [profileData, setProfileData] = useState<ProfileData>({
    firstName: 'John',
    lastName: 'Driver',
    email: 'driver@speedy-van.co.uk',
    phone: '+44 7901846297',
    basePostcode: 'G1 1AA',
    vehicleType: 'Van',
    licensePlate: 'ABC123',
    insuranceProvider: 'Direct Line',
    insuranceExpiry: '2025-12-31',
  });

  // Notification settings state
  const [notifications, setNotifications] = useState<NotificationSettings>({
    newJobs: true,
    routeUpdates: true,
    earningsUpdates: true,
    maintenanceReminders: false,
  });

  // Form validation state
  const [errors, setErrors] = useState<Partial<ProfileData>>({});

  useEffect(() => {
    loadProfileData();
    loadNotificationSettings();
  }, []);

  const loadProfileData = async () => {
    try {
      setIsLoading(true);
      
      // 1. Try loading from cache first (for instant UI)
      const cachedProfile = await getProfile();
      if (cachedProfile) {
        console.log('📦 Loaded profile from cache');
        setProfileData(cachedProfile);
      }

      // 2. Always fetch from server for latest data
      const response = await apiService.get('/api/driver/profile') as any;
      if (response?.driver) {
        const serverProfile = {
          firstName: response.user?.name?.split(' ')[0] || '',
          lastName: response.user?.name?.split(' ').slice(1).join(' ') || '',
          email: response.user?.email || '',
          phone: response.driver?.phone || '',
          basePostcode: response.driver?.basePostcode || '',
          vehicleType: response.driver?.vehicleType || '',
          licensePlate: response.vehicles?.[0]?.reg || '',
          insuranceProvider: response.vehicles?.[0]?.insuranceProvider || '',
          insuranceExpiry: response.vehicles?.[0]?.motExpiry || '',
          profilePhoto: response.driver?.profilePhoto,
        };
        
        // 3. Update UI with server data
        setProfileData(serverProfile);
        
        // 4. Save to cache for offline access
        await saveProfile(serverProfile);
        console.log('✅ Profile loaded from server and cached');
      }
    } catch (error) {
      console.error('❌ Error loading profile from server:', error);
      // If server fails, keep cached data (already loaded above)
      console.log('⚠️ Using cached profile data due to server error');
    } finally {
      setIsLoading(false);
    }
  };

  const loadNotificationSettings = async () => {
    try {
      const response = await apiService.get('/api/driver/settings') as any;
      if (response?.success && response?.notifications) {
        // Map backend notification fields to frontend interface
        setNotifications({
          newJobs: response.notifications.pushJobOffers || false,
          routeUpdates: response.notifications.pushJobUpdates || false,
          earningsUpdates: response.notifications.pushPayoutEvents || false,
          maintenanceReminders: response.notifications.pushSystemAlerts || false,
        });
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<ProfileData> = {};

    if (!profileData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    if (!profileData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    if (!profileData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(profileData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    if (!profileData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }
    if (!profileData.basePostcode.trim()) {
      newErrors.basePostcode = 'Postcode is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveProfile = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fix the highlighted fields before saving.');
      return;
    }

    try {
      setIsLoading(true);
      const response = await apiService.put('/api/driver/settings', {
        profile: {
          name: `${profileData.firstName} ${profileData.lastName}`,
          email: profileData.email,
          basePostcode: profileData.basePostcode,
          vehicleType: profileData.vehicleType,
        },
        vehicle: {
          make: '', // Not in current form
          model: '', // Not in current form
          reg: profileData.licensePlate,
          weightClass: '', // Not in current form
          motExpiry: profileData.insuranceExpiry,
        },
      }) as any;

      if (response?.success) {
        setIsEditing(false);
        
        // ✅ CRITICAL: Save updated profile to AsyncStorage
        await saveProfile(profileData);
        console.log('✅ Profile saved to both server and cache');
        
        Alert.alert('Success', 'Profile updated successfully!');
      } else {
        throw new Error(response?.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveNotifications = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.put('/api/driver/settings', {
        notifications: {
          pushJobOffers: notifications.newJobs,
          pushJobUpdates: notifications.routeUpdates,
          pushPayoutEvents: notifications.earningsUpdates,
          pushSystemAlerts: notifications.maintenanceReminders,
          pushMessages: true, // Default
          pushScheduleChanges: true, // Default
          emailJobOffers: false, // Default
          emailJobUpdates: false, // Default
          emailMessages: false, // Default
          emailScheduleChanges: false, // Default
          emailPayoutEvents: true, // Default
          emailSystemAlerts: true, // Default
          smsJobOffers: false, // Default
          smsJobUpdates: false, // Default
          smsMessages: false, // Default
          smsScheduleChanges: false, // Default
          smsPayoutEvents: false, // Default
          smsSystemAlerts: false, // Default
        },
      }) as any;

      if (response?.success) {
        Alert.alert('Success', 'Notification settings updated successfully!');
      } else {
        throw new Error(response?.error || 'Failed to update notifications');
      }
    } catch (error) {
      console.error('Error saving notifications:', error);
      Alert.alert('Error', 'Failed to update notification settings. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhotoUpload = () => {
    Alert.alert(
      'Update Profile Photo',
      'Choose how you want to update your photo:',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Take Photo', onPress: () => takePhoto() },
        { text: 'Choose from Library', onPress: () => pickImage() },
      ]
    );
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Camera permission is required to take photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        // Here you would upload the image to your backend
        setProfileData(prev => ({ ...prev, profilePhoto: result.assets[0].uri }));
        Alert.alert('Success', 'Profile photo updated successfully!');
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Photo library permission is required to select photos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        // Here you would upload the image to your backend
        setProfileData(prev => ({ ...prev, profilePhoto: result.assets[0].uri }));
        Alert.alert('Success', 'Profile photo updated successfully!');
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select photo. Please try again.');
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: logout },
      ]
    );
  };

  const renderTabButton = (tab: string, label: string, icon: string) => (
    <TouchableOpacity
      style={[styles.tabButton, activeTab === tab && styles.activeTab]}
      onPress={() => setActiveTab(tab as any)}
    >
      <Ionicons 
        name={icon as any} 
        size={20} 
        color={activeTab === tab ? '#FFFFFF' : '#6B7280'} 
      />
      <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderProfileTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Personal Information</Text>
        
        {/* Profile Photo */}
        <View style={styles.photoSection}>
          <TouchableOpacity style={styles.photoContainer} onPress={handlePhotoUpload}>
            {profileData.profilePhoto ? (
              <Image source={{ uri: profileData.profilePhoto }} style={styles.profilePhoto} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Ionicons name="person" size={40} color="#9CA3AF" />
              </View>
            )}
            <View style={styles.photoOverlay}>
              <Ionicons name="camera" size={20} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
          <Text style={styles.photoText}>Tap to update photo</Text>
        </View>

        {/* Form Fields */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>First Name *</Text>
          <TextInput
            style={[styles.input, errors.firstName && styles.inputError]}
            value={profileData.firstName}
            onChangeText={(text) => setProfileData(prev => ({ ...prev, firstName: text }))}
            placeholder="Enter first name"
            editable={isEditing}
          />
          {errors.firstName && <Text style={styles.errorText}>{errors.firstName}</Text>}
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Last Name *</Text>
          <TextInput
            style={[styles.input, errors.lastName && styles.inputError]}
            value={profileData.lastName}
            onChangeText={(text) => setProfileData(prev => ({ ...prev, lastName: text }))}
            placeholder="Enter last name"
            editable={isEditing}
          />
          {errors.lastName && <Text style={styles.errorText}>{errors.lastName}</Text>}
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Email *</Text>
          <TextInput
            style={[styles.input, errors.email && styles.inputError]}
            value={profileData.email}
            onChangeText={(text) => setProfileData(prev => ({ ...prev, email: text }))}
            placeholder="Enter email address"
            keyboardType="email-address"
            autoCapitalize="none"
            editable={isEditing}
          />
          {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Phone Number *</Text>
          <TextInput
            style={[styles.input, errors.phone && styles.inputError]}
            value={profileData.phone}
            onChangeText={(text) => setProfileData(prev => ({ ...prev, phone: text }))}
            placeholder="Enter phone number"
            keyboardType="phone-pad"
            editable={isEditing}
          />
          {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Base Postcode *</Text>
          <TextInput
            style={[styles.input, errors.basePostcode && styles.inputError]}
            value={profileData.basePostcode}
            onChangeText={(text) => setProfileData(prev => ({ ...prev, basePostcode: text }))}
            placeholder="Enter your base postcode"
            autoCapitalize="characters"
            editable={isEditing}
          />
          {errors.basePostcode && <Text style={styles.errorText}>{errors.basePostcode}</Text>}
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        {!isEditing ? (
          <TouchableOpacity style={styles.editButton} onPress={() => setIsEditing(true)}>
            <Ionicons name="create" size={20} color="#FFFFFF" />
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.editActions}>
            <TouchableOpacity 
              style={styles.cancelButton} 
              onPress={() => {
                setIsEditing(false);
                setErrors({});
                loadProfileData(); // Reset to original data
              }}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.saveButton} 
              onPress={handleSaveProfile}
              disabled={isLoading}
            >
              <Ionicons name="checkmark" size={20} color="#FFFFFF" />
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );

  const renderVehicleTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Vehicle Information</Text>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Vehicle Type</Text>
          <TextInput
            style={styles.input}
            value={profileData.vehicleType}
            onChangeText={(text) => setProfileData(prev => ({ ...prev, vehicleType: text }))}
            placeholder="e.g., Van, Car, Lorry"
            editable={isEditing}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>License Plate</Text>
          <TextInput
            style={styles.input}
            value={profileData.licensePlate}
            onChangeText={(text) => setProfileData(prev => ({ ...prev, licensePlate: text.toUpperCase() }))}
            placeholder="Enter license plate"
            autoCapitalize="characters"
            editable={isEditing}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Insurance Provider</Text>
          <TextInput
            style={styles.input}
            value={profileData.insuranceProvider}
            onChangeText={(text) => setProfileData(prev => ({ ...prev, insuranceProvider: text }))}
            placeholder="Enter insurance provider"
            editable={isEditing}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Insurance Expiry Date</Text>
          <TextInput
            style={styles.input}
            value={profileData.insuranceExpiry}
            onChangeText={(text) => setProfileData(prev => ({ ...prev, insuranceExpiry: text }))}
            placeholder="YYYY-MM-DD"
            editable={isEditing}
          />
        </View>
      </View>

      <View style={styles.documentStatus}>
        <Text style={styles.sectionTitle}>Document Status</Text>
        <View style={styles.statusItem}>
          <Ionicons name="checkmark-circle" size={20} color="#10B981" />
          <Text style={styles.statusText}>Driver License: Valid until 2026</Text>
        </View>
        <View style={styles.statusItem}>
          <Ionicons name="checkmark-circle" size={20} color="#10B981" />
          <Text style={styles.statusText}>Vehicle Insurance: Valid until 2025</Text>
        </View>
        <View style={styles.statusItem}>
          <Ionicons name="checkmark-circle" size={20} color="#10B981" />
          <Text style={styles.statusText}>Background Check: Approved</Text>
        </View>
        <View style={styles.statusItem}>
          <Ionicons name="checkmark-circle" size={20} color="#10B981" />
          <Text style={styles.statusText}>Vehicle Registration: Valid</Text>
        </View>
      </View>
    </ScrollView>
  );

  const renderNotificationsTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notification Preferences</Text>
        
        <View style={styles.notificationItem}>
          <View style={styles.notificationInfo}>
            <Text style={styles.notificationTitle}>New Job Alerts</Text>
            <Text style={styles.notificationDesc}>Get notified when new routes are available</Text>
          </View>
          <Switch
            value={notifications.newJobs}
            onValueChange={(value) => setNotifications(prev => ({ ...prev, newJobs: value }))}
            trackColor={{ false: '#E5E7EB', true: '#3B82F6' }}
            thumbColor={notifications.newJobs ? '#FFFFFF' : '#FFFFFF'}
          />
        </View>

        <View style={styles.notificationItem}>
          <View style={styles.notificationInfo}>
            <Text style={styles.notificationTitle}>Route Updates</Text>
            <Text style={styles.notificationDesc}>Updates about route changes and delays</Text>
          </View>
          <Switch
            value={notifications.routeUpdates}
            onValueChange={(value) => setNotifications(prev => ({ ...prev, routeUpdates: value }))}
            trackColor={{ false: '#E5E7EB', true: '#3B82F6' }}
            thumbColor={notifications.routeUpdates ? '#FFFFFF' : '#FFFFFF'}
          />
        </View>

        <View style={styles.notificationItem}>
          <View style={styles.notificationInfo}>
            <Text style={styles.notificationTitle}>Earnings Updates</Text>
            <Text style={styles.notificationDesc}>Weekly and monthly earnings summaries</Text>
          </View>
          <Switch
            value={notifications.earningsUpdates}
            onValueChange={(value) => setNotifications(prev => ({ ...prev, earningsUpdates: value }))}
            trackColor={{ false: '#E5E7EB', true: '#3B82F6' }}
            thumbColor={notifications.earningsUpdates ? '#FFFFFF' : '#FFFFFF'}
          />
        </View>

        <View style={styles.notificationItem}>
          <View style={styles.notificationInfo}>
            <Text style={styles.notificationTitle}>Maintenance Reminders</Text>
            <Text style={styles.notificationDesc}>Vehicle maintenance and document renewal reminders</Text>
          </View>
          <Switch
            value={notifications.maintenanceReminders}
            onValueChange={(value) => setNotifications(prev => ({ ...prev, maintenanceReminders: value }))}
            trackColor={{ false: '#E5E7EB', true: '#3B82F6' }}
            thumbColor={notifications.maintenanceReminders ? '#FFFFFF' : '#FFFFFF'}
          />
        </View>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={styles.saveButton} 
          onPress={handleSaveNotifications}
          disabled={isLoading}
        >
          <Ionicons name="checkmark" size={20} color="#FFFFFF" />
          <Text style={styles.saveButtonText}>Save Settings</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderSettingsTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Settings</Text>
        
        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Ionicons name="lock-closed" size={20} color="#6B7280" />
            <Text style={styles.settingTitle}>Change Password</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Ionicons name="shield-checkmark" size={20} color="#6B7280" />
            <Text style={styles.settingTitle}>Privacy Settings</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Ionicons name="help-circle" size={20} color="#6B7280" />
            <Text style={styles.settingTitle}>Help & Support</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Company Information</Text>
        
        <View style={styles.infoItem}>
          <Ionicons name="mail" size={16} color="#6B7280" />
          <Text style={styles.infoText}>{COMPANY_INFO.SUPPORT_EMAIL}</Text>
        </View>
        
        <View style={styles.infoItem}>
          <Ionicons name="call" size={16} color="#6B7280" />
          <Text style={styles.infoText}>{COMPANY_INFO.SUPPORT_PHONE}</Text>
        </View>
        
        <View style={styles.infoItem}>
          <Ionicons name="location" size={16} color="#6B7280" />
          <Text style={styles.infoText}>{COMPANY_INFO.ADDRESS}</Text>
        </View>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out" size={20} color="#EF4444" />
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {renderTabButton('profile', 'Profile', 'person')}
        {renderTabButton('vehicle', 'Vehicle', 'car')}
        {renderTabButton('notifications', 'Notifications', 'notifications')}
        {renderTabButton('settings', 'Settings', 'settings')}
      </View>

      {/* Tab Content */}
      {activeTab === 'profile' && renderProfileTab()}
      {activeTab === 'vehicle' && renderVehicleTab()}
      {activeTab === 'notifications' && renderNotificationsTab()}
      {activeTab === 'settings' && renderSettingsTab()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  activeTab: {
    backgroundColor: '#3B82F6',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginLeft: 4,
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  tabContent: {
    flex: 1,
    padding: 20,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  photoSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  photoContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  profilePhoto: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  photoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoText: {
    fontSize: 12,
    color: '#6B7280',
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#FFFFFF',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
  },
  actionButtons: {
    marginTop: 20,
  },
  editButton: {
    backgroundColor: '#3B82F6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  editActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  documentStatus: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 8,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  notificationInfo: {
    flex: 1,
    marginRight: 12,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  notificationDesc: {
    fontSize: 12,
    color: '#6B7280',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    color: '#111827',
    marginLeft: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
  logoutButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EF4444',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#EF4444',
  },
});