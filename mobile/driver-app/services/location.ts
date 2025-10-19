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
        return {
          granted: false,
          foreground: false,
          background: false,
        };
      }

      // Request background permission
      const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();

      return {
        granted: true,
        foreground: foregroundStatus === 'granted',
        background: backgroundStatus === 'granted',
      };
    } catch (error) {
      console.error('Error requesting location permissions:', error);
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
      });

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        timestamp: location.timestamp,
        accuracy: location.coords.accuracy || undefined,
      };
    } catch (error) {
      console.error('Error getting current location:', error);
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

      return response.success;
    } catch (error) {
      console.error('Error sending location update:', error);
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

