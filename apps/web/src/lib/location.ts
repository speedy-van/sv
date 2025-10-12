interface LocationData {
  lat: number;
  lng: number;
  accuracy?: number;
  timestamp: number;
}

interface LocationConfig {
  bookingId?: string;
  onLocationUpdate?: (location: LocationData) => void;
  onError?: (error: string) => void;
}

class LocationTracker {
  private watchId: number | null = null;
  private lastLocation: LocationData | null = null;
  private lastPingTime: number = 0;
  private isTracking: boolean = false;
  private config: LocationConfig = {};
  private pingInterval: NodeJS.Timeout | null = null;

  constructor(config: LocationConfig = {}) {
    this.config = config;
  }

  async startTracking(bookingId?: string) {
    if (this.isTracking) return;

    if (!navigator.geolocation) {
      this.config.onError?.('Geolocation is not supported by this browser');
      return;
    }

    try {
      // Get initial location
      const position = await this.getCurrentPosition();
      this.lastLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: Date.now(),
      };

      // Start watching for location changes
      this.watchId = navigator.geolocation.watchPosition(
        this.handleLocationUpdate.bind(this),
        this.handleLocationError.bind(this),
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 30000,
        }
      );

      this.isTracking = true;

      // Start pinging location to server
      if (bookingId) {
        this.startPinging(bookingId);
      }

      // Initial ping
      if (this.lastLocation) {
        this.pingLocation(bookingId);
      }
    } catch (error) {
      this.config.onError?.('Failed to start location tracking');
    }
  }

  stopTracking() {
    if (this.watchId) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }

    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }

    this.isTracking = false;
  }

  private getCurrentPosition(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
      });
    });
  }

  private handleLocationUpdate(position: GeolocationPosition) {
    const newLocation: LocationData = {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      accuracy: position.coords.accuracy,
      timestamp: Date.now(),
    };

    // Only update if location has changed significantly (>25m)
    if (this.hasLocationChanged(newLocation)) {
      this.lastLocation = newLocation;
      this.config.onLocationUpdate?.(newLocation);
    }
  }

  private handleLocationError(error: GeolocationPositionError) {
    let errorMessage = 'Location tracking error';

    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorMessage = 'Location permission denied';
        break;
      case error.POSITION_UNAVAILABLE:
        errorMessage = 'Location information unavailable';
        break;
      case error.TIMEOUT:
        errorMessage = 'Location request timed out';
        break;
    }

    this.config.onError?.(errorMessage);
  }

  private hasLocationChanged(newLocation: LocationData): boolean {
    if (!this.lastLocation) return true;

    // Calculate distance between points (Haversine formula)
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (this.lastLocation.lat * Math.PI) / 180;
    const φ2 = (newLocation.lat * Math.PI) / 180;
    const Δφ = ((newLocation.lat - this.lastLocation.lat) * Math.PI) / 180;
    const Δλ = ((newLocation.lng - this.lastLocation.lng) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const distance = R * c;

    // Update if moved more than 25 meters or if it's been more than 10 seconds
    const timeDiff = newLocation.timestamp - this.lastLocation.timestamp;
    return distance > 25 || timeDiff > 10000;
  }

  private startPinging(bookingId: string) {
    // Ping every 10 seconds or when location changes significantly
    this.pingInterval = setInterval(() => {
      if (this.lastLocation) {
        this.pingLocation(bookingId);
      }
    }, 10000);
  }

  private async pingLocation(bookingId?: string) {
    if (!this.lastLocation || !bookingId) return;

    // Throttle pings to prevent spam
    const now = Date.now();
    if (now - this.lastPingTime < 5000) return; // Minimum 5 seconds between pings

    try {
      const response = await fetch('/api/driver/location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId,
          lat: this.lastLocation.lat,
          lng: this.lastLocation.lng,
          ts: this.lastLocation.timestamp,
        }),
      });

      if (response.ok) {
        this.lastPingTime = now;
      }
    } catch (error) {
      console.error('Failed to ping location:', error);
    }
  }

  getCurrentLocation(): LocationData | null {
    return this.lastLocation;
  }

  isActive(): boolean {
    return this.isTracking;
  }
}

export { LocationTracker };
export type { LocationData, LocationConfig };
