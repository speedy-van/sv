import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import apiService from './api.service';
import { API_ENDPOINTS, APP_CONFIG } from '../config/api';

const LOCATION_TASK_NAME = 'background-location-task';

class LocationService {
  private watchId: Location.LocationSubscription | null = null;
  private currentJobId: string | null = null;

  async requestPermissions(): Promise<boolean> {
    const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
    
    if (foregroundStatus !== 'granted') {
      console.log('❌ Foreground location permission denied');
      return false;
    }

    const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
    
    if (backgroundStatus !== 'granted') {
      console.log('⚠️ Background location permission denied');
      // Still return true as foreground is granted
    }

    console.log('✅ Location permissions granted');
    return true;
  }

  async getCurrentLocation(): Promise<Location.LocationObject | null> {
    try {
      return await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
    } catch (error) {
      console.error('Error getting location:', error);
      return null;
    }
  }

  async startTracking(jobId: string): Promise<void> {
    this.currentJobId = jobId;
    console.log('📍 Starting location tracking for job:', jobId);

    // Start foreground location updates
    this.watchId = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        distanceInterval: APP_CONFIG.LOCATION_DISTANCE_FILTER,
        timeInterval: APP_CONFIG.LOCATION_UPDATE_INTERVAL,
      },
      async (location) => {
        await this.sendLocationUpdate(location);
      }
    );

    // Start background location updates
    await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
      accuracy: Location.Accuracy.High,
      distanceInterval: APP_CONFIG.LOCATION_DISTANCE_FILTER,
      timeInterval: APP_CONFIG.LOCATION_UPDATE_INTERVAL,
      foregroundService: {
        notificationTitle: 'Speedy Van Driver',
        notificationBody: 'Tracking your location for active delivery',
      },
    });
  }

  async stopTracking(): Promise<void> {
    console.log('📍 Stopping location tracking');
    this.currentJobId = null;

    // Stop foreground updates
    if (this.watchId) {
      this.watchId.remove();
      this.watchId = null;
    }

    // Stop background updates
    const isRegistered = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME);
    if (isRegistered) {
      await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
    }
  }

  async sendLocationUpdate(location: Location.LocationObject): Promise<void> {
    if (!this.currentJobId) return;

    try {
      await apiService.post(API_ENDPOINTS.SEND_LOCATION, {
        bookingId: this.currentJobId,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
      });
      console.log('✅ Location update sent');
    } catch (error) {
      console.error('❌ Failed to send location update:', error);
    }
  }
}

// Define background location task
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }: any) => {
  if (error) {
    console.error('Background location error:', error);
    return;
  }

  if (data) {
    const { locations } = data;
    if (locations && locations.length > 0) {
      const location = locations[0];
      console.log('📍 Background location update:', location.coords);
      // Location updates are handled by the foreground watcher
    }
  }
});

export default new LocationService();

