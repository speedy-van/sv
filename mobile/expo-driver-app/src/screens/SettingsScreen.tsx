import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function SettingsScreen() {
  const [notifications, setNotifications] = useState({
    push: true,
    sound: true,
    vibration: true,
  });
  const [locationEnabled, setLocationEnabled] = useState(true);
  const [offlineMode, setOfflineMode] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: () => {} },
      ]
    );
  };

  const handleEditProfile = () => {
    Alert.alert(
      'Edit Profile',
      'What would you like to update?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Personal Info', 
          onPress: () => {
            Alert.alert('Personal Information', 'Current Details:\n\nName: John Driver\nEmail: driver@speedy-van.co.uk\nPhone: +44 7901846297\n\nTo update, contact support at support@speedy-van.co.uk');
          }
        },
        { 
          text: 'Profile Photo', 
          onPress: () => {
            Alert.alert('Profile Photo', 'Your current photo is approved. To change it, email a new photo to support@speedy-van.co.uk with your driver ID.');
          }
        },
        { 
          text: 'Vehicle Info', 
          onPress: () => {
            Alert.alert('Vehicle Information', 'Current Vehicle:\n\nType: Van\nLicense Plate: ABC123\nInsurance: Valid until 2025\nRegistration: Valid\n\nAll vehicle documents are current.');
          }
        },
      ]
    );
  };

  const handleViewEarnings = () => {
    Alert.alert(
      'Earnings Summary', 
      'This Week:\n• Jobs: 8\n• Earnings: £245.50\n• Tips: £45.00\n• Pending: £30.00\n\nThis Month:\n• Jobs: 32\n• Earnings: £1,245.50\n• Tips: £180.00\n\nView detailed breakdown in the Earnings tab.',
      [{ text: 'OK' }]
    );
  };

  const handleViewDocuments = () => {
    Alert.alert(
      'Document Status',
      'All documents are current and approved:\n\n✅ Driver License: Valid until 2026\n✅ Vehicle Insurance: Valid until 2025\n✅ Background Check: Approved\n✅ Vehicle Registration: Valid\n\nTo upload new documents, email them to documents@speedy-van.co.uk',
      [
        { text: 'OK' },
        { 
          text: 'Upload Documents', 
          onPress: () => {
            Alert.alert('Upload Instructions', 'Email your documents to documents@speedy-van.co.uk with:\n• Your driver ID\n• Document type\n• Clear photos or scans\n\nProcessing takes 1-2 business days.');
          }
        },
      ]
    );
  };

  const SettingItem = ({ 
    icon, 
    title, 
    subtitle, 
    onPress, 
    rightComponent 
  }: {
    icon: string;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    rightComponent?: React.ReactNode;
  }) => (
    <TouchableOpacity style={styles.settingItem} onPress={onPress}>
      <View style={styles.settingLeft}>
        <View style={styles.iconContainer}>
          <Ionicons name={icon as any} size={20} color="#3B82F6" />
        </View>
        <View style={styles.settingText}>
          <Text style={styles.settingTitle}>{title}</Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      {rightComponent || <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
          <Text style={styles.subtitle}>Manage your preferences</Text>
        </View>

        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          
          <SettingItem
            icon="notifications"
            title="Push Notifications"
            subtitle="Receive notifications about new jobs"
            rightComponent={
              <Switch
                value={notifications.push}
                onValueChange={(value) => setNotifications(prev => ({ ...prev, push: value }))}
                trackColor={{ false: '#E5E7EB', true: '#3B82F6' }}
                thumbColor={notifications.push ? '#FFFFFF' : '#9CA3AF'}
              />
            }
          />

          <SettingItem
            icon="volume-high"
            title="Sound"
            subtitle="Play sound for notifications"
            rightComponent={
              <Switch
                value={notifications.sound}
                onValueChange={(value) => setNotifications(prev => ({ ...prev, sound: value }))}
                trackColor={{ false: '#E5E7EB', true: '#3B82F6' }}
                thumbColor={notifications.sound ? '#FFFFFF' : '#9CA3AF'}
              />
            }
          />

          <SettingItem
            icon="phone-portrait"
            title="Vibration"
            subtitle="Vibrate for notifications"
            rightComponent={
              <Switch
                value={notifications.vibration}
                onValueChange={(value) => setNotifications(prev => ({ ...prev, vibration: value }))}
                trackColor={{ false: '#E5E7EB', true: '#3B82F6' }}
                thumbColor={notifications.vibration ? '#FFFFFF' : '#9CA3AF'}
              />
            }
          />
        </View>

        {/* Location Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location</Text>
          
          <SettingItem
            icon="location"
            title="Location Services"
            subtitle="Allow location tracking for better job matching"
            rightComponent={
              <Switch
                value={locationEnabled}
                onValueChange={setLocationEnabled}
                trackColor={{ false: '#E5E7EB', true: '#3B82F6' }}
                thumbColor={locationEnabled ? '#FFFFFF' : '#9CA3AF'}
              />
            }
          />
        </View>

        {/* App Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App</Text>
          
          <SettingItem
            icon="cloud-offline"
            title="Offline Mode"
            subtitle="Work without internet connection"
            rightComponent={
              <Switch
                value={offlineMode}
                onValueChange={setOfflineMode}
                trackColor={{ false: '#E5E7EB', true: '#3B82F6' }}
                thumbColor={offlineMode ? '#FFFFFF' : '#9CA3AF'}
              />
            }
          />
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          
          <SettingItem
            icon="person"
            title="Edit Profile"
            subtitle="Update your personal information"
            onPress={handleEditProfile}
          />

          <SettingItem
            icon="card"
            title="Payment Methods"
            subtitle="Manage your payment options"
            onPress={handleViewEarnings}
          />

          <SettingItem
            icon="document-text"
            title="Documents"
            subtitle="Upload and manage your documents"
            onPress={handleViewDocuments}
          />
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          
          <SettingItem
            icon="help-circle"
            title="Help Center"
            subtitle="Get help and support"
            onPress={() => {
              Alert.alert(
                'Help Center',
                'Frequently Asked Questions:\n\nQ: How do I accept a job?\nA: Tap "Accept" on any available job.\n\nQ: When do I get paid?\nA: Payments are processed weekly on Fridays.\n\nQ: How do I update my documents?\nA: Email documents to support@speedy-van.co.uk\n\nNeed more help? Contact support at support@speedy-van.co.uk',
                [{ text: 'OK' }]
              );
            }}
          />

          <SettingItem
            icon="mail"
            title="Contact Support"
            subtitle="support@speedy-van.co.uk"
            onPress={async () => {
              const url = 'mailto:support@speedy-van.co.uk?subject=Driver Support Request';
              try {
                await Linking.openURL(url);
              } catch (error) {
                Alert.alert('Contact Support', 'Email: support@speedy-van.co.uk\nPhone: 07901846297\n\nWe respond within 2 hours during business hours.');
              }
            }}
          />

          <SettingItem
            icon="star"
            title="Rate App"
            subtitle="Rate us on the App Store"
            onPress={() => {
              Alert.alert(
                'Rate Speedy Van Driver',
                'Thank you for using Speedy Van Driver!\n\nYour feedback helps us improve the app.\n\nRate us on the App Store or Google Play Store.',
                [
                  { text: 'Later', style: 'cancel' },
                  { text: 'Rate Now', onPress: () => Alert.alert('Thank You!', 'Your rating has been submitted. Thank you for your feedback!') }
                ]
              );
            }}
          />
        </View>

        {/* Legal Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Legal</Text>
          
          <SettingItem
            icon="document"
            title="Terms of Service"
            onPress={() => {
              Alert.alert(
                'Terms of Service',
                'Key Terms:\n\n• You must be 21+ to drive\n• Valid license and insurance required\n• Background check mandatory\n• 4.5+ star rating maintained\n• Available for scheduled shifts\n\nFull terms available at speedy-van.co.uk/terms\n\nBy using this app, you agree to our terms.',
                [{ text: 'OK' }]
              );
            }}
          />

          <SettingItem
            icon="shield-checkmark"
            title="Privacy Policy"
            onPress={() => {
              Alert.alert(
                'Privacy Policy',
                'We protect your data:\n\n• Location data used only for job matching\n• Personal info kept secure\n• No data sold to third parties\n• GDPR compliant\n• Right to data deletion\n\nFull policy at speedy-van.co.uk/privacy\n\nYour privacy is our priority.',
                [{ text: 'OK' }]
              );
            }}
          />
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out" size={20} color="#EF4444" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 24,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
    marginHorizontal: 24,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginHorizontal: 24,
    marginBottom: 32,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
    marginLeft: 8,
  },
});