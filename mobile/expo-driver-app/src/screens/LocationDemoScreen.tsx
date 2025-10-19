import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';

/**
 * Location Demo Screen
 * Demonstrates location usage for Apple App Review
 * 
 * This screen shows how the app uses location services:
 * 1. Real-time tracking during active deliveries
 * 2. Customer visibility of driver location
 * 3. ETA calculations
 * 4. Navigation assistance
 */
export default function LocationDemoScreen({ navigation }: any) {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<string>('unknown');
  const [isTracking, setIsTracking] = useState(false);
  const [trackingLog, setTrackingLog] = useState<string[]>([]);

  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    const { status } = await Location.getForegroundPermissionsAsync();
    setPermissionStatus(status);
  };

  const requestPermissions = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    setPermissionStatus(status);
    
    if (status === 'granted') {
      addLog('✅ Location permission granted');
      getCurrentLocation();
    } else {
      addLog('❌ Location permission denied');
    }
  };

  const getCurrentLocation = async () => {
    try {
      addLog('📍 Getting current location...');
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setLocation(loc);
      addLog(`✅ Location obtained: ${loc.coords.latitude.toFixed(6)}, ${loc.coords.longitude.toFixed(6)}`);
    } catch (error: any) {
      addLog(`❌ Error getting location: ${error.message}`);
    }
  };

  const startTracking = async () => {
    try {
      addLog('🚀 Starting location tracking...');
      setIsTracking(true);
      
      // Simulate tracking for demo purposes
      const interval = setInterval(async () => {
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        setLocation(loc);
        addLog(`📍 Location update: ${loc.coords.latitude.toFixed(6)}, ${loc.coords.longitude.toFixed(6)}`);
      }, 5000);

      // Store interval ID for cleanup
      (global as any).locationTrackingInterval = interval;
    } catch (error: any) {
      addLog(`❌ Error starting tracking: ${error.message}`);
      setIsTracking(false);
    }
  };

  const stopTracking = () => {
    addLog('⏹️ Stopping location tracking...');
    setIsTracking(false);
    
    if ((global as any).locationTrackingInterval) {
      clearInterval((global as any).locationTrackingInterval);
      (global as any).locationTrackingInterval = null;
    }
  };

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setTrackingLog(prev => [`[${timestamp}] ${message}`, ...prev].slice(0, 20));
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1E40AF" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Location Demo</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Info Card */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={32} color="#3B82F6" />
          <Text style={styles.infoTitle}>Location Usage Demo</Text>
          <Text style={styles.infoText}>
            This demo shows how Speedy Van uses location services to provide real-time tracking during deliveries.
          </Text>
        </View>

        {/* Permission Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Permission Status</Text>
          <View style={styles.statusCard}>
            <Ionicons 
              name={permissionStatus === 'granted' ? 'checkmark-circle' : 'close-circle'} 
              size={24} 
              color={permissionStatus === 'granted' ? '#10B981' : '#EF4444'} 
            />
            <Text style={styles.statusText}>
              {permissionStatus === 'granted' ? 'Location Access Granted' : 'Location Access Required'}
            </Text>
          </View>
          
          {permissionStatus !== 'granted' && (
            <TouchableOpacity style={styles.primaryButton} onPress={requestPermissions}>
              <Ionicons name="location" size={20} color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>Request Permission</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Current Location */}
        {location && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Current Location</Text>
            <View style={styles.locationCard}>
              <View style={styles.locationRow}>
                <Text style={styles.locationLabel}>Latitude:</Text>
                <Text style={styles.locationValue}>{location.coords.latitude.toFixed(6)}</Text>
              </View>
              <View style={styles.locationRow}>
                <Text style={styles.locationLabel}>Longitude:</Text>
                <Text style={styles.locationValue}>{location.coords.longitude.toFixed(6)}</Text>
              </View>
              <View style={styles.locationRow}>
                <Text style={styles.locationLabel}>Accuracy:</Text>
                <Text style={styles.locationValue}>{location.coords.accuracy?.toFixed(2)}m</Text>
              </View>
            </View>
          </View>
        )}

        {/* Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Demo Actions</Text>
          
          <TouchableOpacity 
            style={[styles.actionButton, permissionStatus !== 'granted' && styles.disabledButton]} 
            onPress={getCurrentLocation}
            disabled={permissionStatus !== 'granted'}
          >
            <Ionicons name="locate" size={20} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Get Current Location</Text>
          </TouchableOpacity>

          {!isTracking ? (
            <TouchableOpacity 
              style={[styles.actionButton, styles.successButton, permissionStatus !== 'granted' && styles.disabledButton]} 
              onPress={startTracking}
              disabled={permissionStatus !== 'granted'}
            >
              <Ionicons name="play" size={20} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Start Tracking (Demo)</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={[styles.actionButton, styles.dangerButton]} 
              onPress={stopTracking}
            >
              <Ionicons name="stop" size={20} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Stop Tracking</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Usage Examples */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How We Use Location</Text>
          
          <View style={styles.usageCard}>
            <Ionicons name="navigate" size={24} color="#3B82F6" />
            <View style={styles.usageContent}>
              <Text style={styles.usageTitle}>Real-Time Tracking</Text>
              <Text style={styles.usageText}>
                During active deliveries, we track your location to show customers where you are and provide accurate ETAs.
              </Text>
            </View>
          </View>

          <View style={styles.usageCard}>
            <Ionicons name="time" size={24} color="#3B82F6" />
            <View style={styles.usageContent}>
              <Text style={styles.usageTitle}>ETA Calculations</Text>
              <Text style={styles.usageText}>
                We calculate estimated arrival times based on your current location and traffic conditions.
              </Text>
            </View>
          </View>

          <View style={styles.usageCard}>
            <Ionicons name="map" size={24} color="#3B82F6" />
            <View style={styles.usageContent}>
              <Text style={styles.usageTitle}>Navigation Assistance</Text>
              <Text style={styles.usageText}>
                Location helps us provide turn-by-turn navigation to pickup and delivery addresses.
              </Text>
            </View>
          </View>
        </View>

        {/* Tracking Log */}
        {trackingLog.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tracking Log</Text>
            <View style={styles.logContainer}>
              {trackingLog.map((log, index) => (
                <Text key={index} style={styles.logText}>{log}</Text>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 16,
    paddingBottom: 16,
    backgroundColor: '#1E40AF',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 12,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 12,
  },
  locationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  locationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  locationLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  locationValue: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '700',
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  successButton: {
    backgroundColor: '#10B981',
  },
  dangerButton: {
    backgroundColor: '#EF4444',
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
    opacity: 0.6,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  usageCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  usageContent: {
    flex: 1,
    marginLeft: 12,
  },
  usageTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  usageText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  logContainer: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
    maxHeight: 300,
  },
  logText: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#10B981',
    marginBottom: 4,
  },
});

