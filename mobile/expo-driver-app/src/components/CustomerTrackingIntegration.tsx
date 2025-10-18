import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { showToast } from '../utils/toast';

interface CustomerTrackingIntegrationProps {
  drop: {
    id: string;
    customerName: string;
    deliveryAddress: string;
    pickupAddress?: string;
    timeWindowStart: string;
    timeWindowEnd: string;
    status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'failed';
    serviceTier: 'economy' | 'standard' | 'premium';
    specialInstructions?: string;
  };
  onLocationUpdate: (latitude: number, longitude: number) => void;
  onArrivalNotification: (dropId: string) => void;
  onDeliveryComplete: (dropId: string) => void;
}

export default function CustomerTrackingIntegration({
  drop,
  onLocationUpdate,
  onArrivalNotification,
  onDeliveryComplete,
}: CustomerTrackingIntegrationProps) {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [hasArrived, setHasArrived] = useState(false);
  // Distance calculation removed - use UnifiedPricingFacade instead
  // const [distanceToDestination, setDistanceToDestination] = useState<number | null>(null);

  // Request location permissions
  useEffect(() => {
    requestLocationPermission();
  }, []);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Location Access Needed',
          'Speedy Van needs access to your location to track your progress and notify customers.',
          [{ text: 'Continue' }]
        );
        return;
      }
    } catch (error) {
      console.error('Error requesting location permission:', error);
    }
  };

  // Start location tracking
  const startLocationTracking = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Location Access Needed', 'Speedy Van needs access to your location for tracking.');
        return;
      }

      setIsTracking(true);
      
      // Start watching position
      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 10000, // Update every 10 seconds
          distanceInterval: 10, // Update every 10 meters
        },
        (newLocation) => {
          setLocation(newLocation);
          onLocationUpdate(newLocation.coords.latitude, newLocation.coords.longitude);
          
          // Distance calculation removed - use UnifiedPricingFacade instead
          // calculateDistanceToDestination(newLocation.coords.latitude, newLocation.coords.longitude);
        }
      );

      return subscription;
    } catch (error) {
      console.error('Error starting location tracking:', error);
      setIsTracking(false);
    }
  };

  // Stop location tracking
  const stopLocationTracking = () => {
    setIsTracking(false);
  };

  // DEPRECATED: Manual distance calculation removed per unified pricing system requirements
  // TODO: Integrate UnifiedPricingFacade for distance/pricing calculations
  // 
  // Previous implementation used Haversine formula which is now blocked.
  // Use UnifiedPricingFacade.getQuote() for all distance and pricing needs.
  //
  // Example integration:
  // import { UnifiedPricingFacade } from '@speedy-van/unified-pricing';
  // const pricingDetails = await UnifiedPricingFacade.getQuote({
  //   origin: { lat, lng },
  //   destination: { lat: destinationLat, lng: destinationLng }
  // });

  const handleStartNavigation = () => {
    Alert.alert(
      'Start Navigation',
      `Begin navigation to ${drop.customerName}?\n\nAddress: ${drop.deliveryAddress}\n\nThis will start location tracking and notify the customer.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start Navigation',
          onPress: () => {
            startLocationTracking();
            showToast.success('Navigation Started', 'Location tracking active. Customer will be notified of your progress.');
          },
        },
      ]
    );
  };

  const handleMarkArrived = () => {
    Alert.alert(
      'Mark as Arrived',
      `Mark arrival at ${drop.customerName}'s location?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark Arrived',
          onPress: () => {
            setHasArrived(true);
            onArrivalNotification(drop.id);
            showToast.success('Arrival Confirmed', 'Customer has been notified of your arrival.');
          },
        },
      ]
    );
  };

  const handleMarkDelivered = () => {
    Alert.alert(
      'Mark as Delivered',
      `Confirm delivery to ${drop.customerName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm Delivery',
          onPress: () => {
            stopLocationTracking();
            onDeliveryComplete(drop.id);
            showToast.success('Delivery Confirmed', 'Delivery completed successfully. Customer has been notified.');
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="location" size={24} color="#3B82F6" />
        <Text style={styles.title}>Customer Tracking</Text>
        <View style={[
          styles.statusIndicator,
          { backgroundColor: isTracking ? '#10B981' : '#6B7280' }
        ]} />
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.customerName}>{drop.customerName}</Text>
        <Text style={styles.address}>{drop.deliveryAddress}</Text>
        
        {/* Distance display removed - integrate UnifiedPricingFacade for distance info */}
        {/* TODO: Fetch distance from UnifiedPricingFacade and display here */}

        {hasArrived && (
          <View style={styles.arrivedIndicator}>
            <Ionicons name="checkmark-circle" size={16} color="#10B981" />
            <Text style={styles.arrivedText}>Arrived at destination</Text>
          </View>
        )}
      </View>

      <View style={styles.actionButtons}>
        {!isTracking && !hasArrived && (
          <TouchableOpacity
            style={styles.navigateButton}
            onPress={handleStartNavigation}
          >
            <Ionicons name="navigate" size={20} color="#FFFFFF" />
            <Text style={styles.navigateButtonText}>Start Navigation</Text>
          </TouchableOpacity>
        )}

        {isTracking && !hasArrived && (
          <TouchableOpacity
            style={styles.arrivedButton}
            onPress={handleMarkArrived}
          >
            <Ionicons name="location" size={20} color="#FFFFFF" />
            <Text style={styles.arrivedButtonText}>Mark as Arrived</Text>
          </TouchableOpacity>
        )}

        {hasArrived && (
          <TouchableOpacity
            style={styles.deliveredButton}
            onPress={handleMarkDelivered}
          >
            <Ionicons name="checkmark" size={20} color="#FFFFFF" />
            <Text style={styles.deliveredButtonText}>Mark as Delivered</Text>
          </TouchableOpacity>
        )}
      </View>

      {isTracking && (
        <View style={styles.trackingInfo}>
          <Text style={styles.trackingText}>
            📍 Live location tracking active
          </Text>
          <Text style={styles.trackingSubtext}>
            Customer can see your real-time progress
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginLeft: 8,
    flex: 1,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  infoCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  customerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  address: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  distanceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  distanceText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  arrivedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    padding: 8,
    borderRadius: 6,
    marginTop: 4,
  },
  arrivedText: {
    fontSize: 12,
    color: '#10B981',
    marginLeft: 4,
    fontWeight: '600',
  },
  actionButtons: {
    marginBottom: 8,
  },
  navigateButton: {
    backgroundColor: '#3B82F6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  navigateButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  arrivedButton: {
    backgroundColor: '#F59E0B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  arrivedButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  deliveredButton: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  deliveredButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  trackingInfo: {
    backgroundColor: '#EBF8FF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  trackingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
    marginBottom: 2,
  },
  trackingSubtext: {
    fontSize: 12,
    color: '#6B7280',
  },
});
