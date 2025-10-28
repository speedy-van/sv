import * as Location from 'expo-location';
import { apiService } from './api';
import { Location as LocationType } from '../types';

class LocationService {
  private locationSubscription: Location.LocationSubscription | null = null;
  private backgroundSubscription: Location.LocationSubscription | null = null;

  async requestPermissions(): Promise<{
    granted: boolean;
    foreground: boolean;
    background: boolean;
  }> {
    try {
      // Request foreground permission first
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
      
      if (foregroundStatus !== 'granted') {
        console.log('⚠️ Foreground location permission denied');
        return {
          granted: false,
          foreground: false,
          background: false,
        };
      }

      console.log('✅ Foreground location permission granted');

      // Try to request background permission (may fail on Expo Go, but that's OK)
      let backgroundGranted = false;
      try {
        const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
        backgroundGranted = backgroundStatus === 'granted';
        
        if (backgroundGranted) {
          console.log('✅ Background location permission granted');
        } else {
          console.log('ℹ️ Background location not granted (foreground tracking will still work)');
        }
      } catch (bgError: any) {
        console.log('ℹ️ Background location not available on Expo Go (foreground tracking will still work)');
      }

      // Return success if foreground is granted (background is optional for basic functionality)
      return {
        granted: true, // ✅ Granted if foreground works
        foreground: true,
        background: backgroundGranted,
      };
    } catch (error: any) {
      console.error('❌ Error requesting location permissions:', error);
      return {
        granted: false,
        foreground: false,
        background: false,
      };
    }
  }

  async checkPermissions(): Promise<{
    granted: boolean;
    foreground: boolean;
    background: boolean;
  }> {
    try {
      const foreground = await Location.getForegroundPermissionsAsync();
      const background = await Location.getBackgroundPermissionsAsync();

      return {
        granted: foreground.granted,
        foreground: foreground.granted,
        background: background.granted,
      };
    } catch (error) {
      console.error('Error checking location permissions:', error);
      return {
        granted: false,
        foreground: false,
        background: false,
      };
    }
  }

  async getCurrentLocation(): Promise<LocationType | null> {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') {
        return null;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        mayShowUserSettingsDialog: false, // Don't show settings dialog
        timeInterval: 5000, // Allow cached location within 5 seconds
      });

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        timestamp: location.timestamp,
        accuracy: location.coords.accuracy || undefined,
      };
    } catch (error: any) {
      // ℹ️ This is normal on iOS Simulator when returning from background
      // The cached location from foreground/background tracking is still valid
      console.log('ℹ️ Could not get fresh location (using last known position)');
      return null;
    }
  }

  async startForegroundTracking(
    callback: (location: LocationType) => void,
    interval: number = 10000
  ): Promise<boolean> {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') {
        return false;
      }

      this.locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: interval,
          distanceInterval: 10, // Update every 10 meters
        },
        (location) => {
          callback({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            timestamp: location.timestamp,
            accuracy: location.coords.accuracy || undefined,
          });
        }
      );

      return true;
    } catch (error) {
      console.error('Error starting foreground tracking:', error);
      return false;
    }
  }

  async stopForegroundTracking(): Promise<void> {
    if (this.locationSubscription) {
      this.locationSubscription.remove();
      this.locationSubscription = null;
    }
  }

  async startBackgroundTracking(): Promise<boolean> {
    try {
      const { status } = await Location.getBackgroundPermissionsAsync();
      if (status !== 'granted') {
        return false;
      }

      await Location.startLocationUpdatesAsync('background-location-task', {
        accuracy: Location.Accuracy.High,
        timeInterval: 30000, // Update every 30 seconds
        distanceInterval: 50, // Update every 50 meters
        foregroundService: {
          notificationTitle: 'Speedy Van Driver',
          notificationBody: 'Tracking your location for delivery updates',
          notificationColor: '#3B82F6',
        },
      });

      return true;
    } catch (error) {
      console.error('Error starting background tracking:', error);
      return false;
    }
  }

  async stopBackgroundTracking(): Promise<void> {
    try {
      const hasStarted = await Location.hasStartedLocationUpdatesAsync('background-location-task');
      if (hasStarted) {
        await Location.stopLocationUpdatesAsync('background-location-task');
      }
    } catch (error) {
      console.error('Error stopping background tracking:', error);
    }
  }

  async sendLocationUpdate(location: LocationType, jobId?: string): Promise<boolean> {
    try {
      const endpoint = jobId 
        ? `/api/driver/jobs/${jobId}/location`
        : '/api/driver/location';

      const response = await apiService.post(endpoint, {
        latitude: location.latitude,
        longitude: location.longitude,
        timestamp: location.timestamp,
        accuracy: location.accuracy,
      });

      if (!response.success) {
        // Log actual errors (not just offline status)
        console.warn('⚠️ Location update failed:', response.error || 'Unknown error');
        return false;
      }

      console.log('✅ Location updated successfully');
      return true;
    } catch (error) {
      // Silent error - don't spam logs
      return false;
    }
  }

  async getDistance(
    from: { latitude: number; longitude: number },
    to: { latitude: number; longitude: number }
  ): Promise<number> {
    // Haversine formula to calculate distance in miles
    const R = 3959; // Radius of Earth in miles
    const dLat = this.deg2rad(to.latitude - from.latitude);
    const dLon = this.deg2rad(to.longitude - from.longitude);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(from.latitude)) *
        Math.cos(this.deg2rad(to.latitude)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return Math.round(distance * 10) / 10; // Round to 1 decimal place
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}

export const locationService = new LocationService();

