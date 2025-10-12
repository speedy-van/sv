import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@chakra-ui/react';

interface AutoStatusConfig {
  jobId: string;
  currentStep: string;
  driverId: string;
  enableGeoTracking?: boolean;
  enableTimeTracking?: boolean;
  enableProximityDetection?: boolean;
  proximityRadius?: number; // in meters
  autoAdvanceSteps?: boolean;
  notificationEnabled?: boolean;
}

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: number;
}

interface StepTrigger {
  step: string;
  condition: 'location' | 'time' | 'manual' | 'proximity';
  data?: any;
}

const STEP_SEQUENCE = [
  'navigate_to_pickup',
  'arrived_at_pickup',
  'loading_started',
  'loading_completed',
  'en_route_to_dropoff',
  'arrived_at_dropoff',
  'unloading_started',
  'unloading_completed',
  'customer_signature',
  'job_completed'
];

export const useAutoStatusUpdates = (config: AutoStatusConfig) => {
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [autoUpdatesEnabled, setAutoUpdatesEnabled] = useState(true);
  const [locationHistory, setLocationHistory] = useState<LocationData[]>([]);
  const [proximityAlerts, setProximityAlerts] = useState<string[]>([]);
  
  const toast = useToast();
  const watchIdRef = useRef<number | null>(null);
  const lastUpdateRef = useRef<number>(0);

  // Early return if config is not ready (but hooks are still called)
  const isConfigReady = config.jobId && config.driverId !== 'pending' && config.enableGeoTracking;

  // Get current step index in sequence
  const getCurrentStepIndex = useCallback(() => {
    return STEP_SEQUENCE.indexOf(config.currentStep);
  }, [config.currentStep]);

  // Check if next step should be auto-triggered
  const shouldAutoAdvanceToStep = useCallback((nextStep: string): boolean => {
    if (!config.autoAdvanceSteps) return false;
    
    const currentIndex = getCurrentStepIndex();
    const nextIndex = STEP_SEQUENCE.indexOf(nextStep);
    
    return nextIndex === currentIndex + 1;
  }, [config.autoAdvanceSteps, getCurrentStepIndex]);

  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = useCallback((
    lat1: number, lon1: number, 
    lat2: number, lon2: number
  ): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  }, []);

  // Update job step via API
  const updateJobStep = useCallback(async (
    newStep: string, 
    trigger: StepTrigger,
    locationData?: LocationData
  ) => {
    try {
      const response = await fetch(`/api/driver/jobs/${config.jobId}/update-step`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: newStep,
          driverId: config.driverId,
          trigger,
          location: locationData,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update job step');
      }

      const result = await response.json();
      
      if (config.notificationEnabled) {
        toast({
          title: 'Status Updated',
          description: `Job step updated to: ${newStep}`,
          status: 'success',
          duration: 3000,
        });
      }

      return result;
    } catch (error) {
      console.error('Auto status update failed:', error);
      
      toast({
        title: 'Update Failed',
        description: 'Failed to update job status automatically',
        status: 'error',
        duration: 5000,
      });
      
      throw error;
    }
  }, [config.jobId, config.driverId, config.notificationEnabled, toast]);

  // Check proximity to pickup/dropoff locations
  const checkProximityTriggers = useCallback(async (location: LocationData) => {
    if (!isConfigReady || !config.enableProximityDetection) return;

    try {
      const response = await fetch(`/api/driver/jobs/${config.jobId}/details`);
      const jobDetails = await response.json();

      const pickupLocation = jobDetails.pickup_location;
      const dropoffLocation = jobDetails.dropoff_location;
      const proximityRadius = config.proximityRadius || 100; // 100m default

      // Check proximity to pickup
      if (pickupLocation && config.currentStep === 'navigate_to_pickup') {
        const distanceToPickup = calculateDistance(
          location.latitude,
          location.longitude,
          pickupLocation.latitude,
          pickupLocation.longitude
        );

        if (distanceToPickup <= proximityRadius) {
          if (shouldAutoAdvanceToStep('arrived_at_pickup')) {
            await updateJobStep('arrived_at_pickup', {
              step: 'arrived_at_pickup',
              condition: 'proximity',
              data: { distance: distanceToPickup, radius: proximityRadius }
            }, location);
          } else {
            setProximityAlerts(prev => [...prev, 'Near pickup location']);
          }
        }
      }

      // Check proximity to dropoff
      if (dropoffLocation && config.currentStep === 'en_route_to_dropoff') {
        const distanceToDropoff = calculateDistance(
          location.latitude,
          location.longitude,
          dropoffLocation.latitude,
          dropoffLocation.longitude
        );

        if (distanceToDropoff <= proximityRadius) {
          if (shouldAutoAdvanceToStep('arrived_at_dropoff')) {
            await updateJobStep('arrived_at_dropoff', {
              step: 'arrived_at_dropoff',
              condition: 'proximity',
              data: { distance: distanceToDropoff, radius: proximityRadius }
            }, location);
          } else {
            setProximityAlerts(prev => [...prev, 'Near dropoff location']);
          }
        }
      }
    } catch (error) {
      console.error('Proximity check failed:', error);
    }
  }, [
    isConfigReady,
    config.enableProximityDetection,
    config.proximityRadius,
    config.jobId,
    config.currentStep,
    calculateDistance,
    shouldAutoAdvanceToStep,
    updateJobStep
  ]);

  // Handle location updates
  const handleLocationUpdate = useCallback((position: GeolocationPosition) => {
    const locationData: LocationData = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      timestamp: Date.now(),
    };

    setCurrentLocation(locationData);
    setLocationHistory(prev => [...prev.slice(-49), locationData]); // Keep last 50 locations

    // Throttle API calls (max once per 30 seconds)
    const now = Date.now();
    if (now - lastUpdateRef.current >= 30000) {
      lastUpdateRef.current = now;
      
      // Send location to tracking endpoint only if config is ready
      if (isConfigReady) {
        fetch(`/api/driver/tracking`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bookingId: config.jobId,
            latitude: locationData.latitude,
            longitude: locationData.longitude,
            accuracy: locationData.accuracy,
          }),
        }).catch(error => {
          console.error('Location tracking failed:', error);
          // Optionally show a toast notification for tracking issues
        });
      }

      // Check proximity triggers
      checkProximityTriggers(locationData);
    }
  }, [isConfigReady, config.driverId, config.jobId, checkProximityTriggers]);

  // Handle geolocation errors
  const handleLocationError = useCallback((error: GeolocationPositionError) => {
    console.error('Geolocation error:', error);
    
    let message = 'Location access failed';
    switch (error.code) {
      case error.PERMISSION_DENIED:
        message = 'Location access denied. Please enable GPS permissions.';
        break;
      case error.POSITION_UNAVAILABLE:
        message = 'Location information unavailable';
        break;
      case error.TIMEOUT:
        message = 'Location request timed out';
        break;
    }

    toast({
      title: 'Location Error',
      description: message,
      status: 'warning',
      duration: 5000,
    });

    setIsTracking(false);
  }, [toast]);

  // Start location tracking
  const startTracking = useCallback(() => {
    if (!isConfigReady || !config.enableGeoTracking) return;

    if ('geolocation' in navigator) {
      const options: PositionOptions = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000, // 30 seconds
      };

      watchIdRef.current = navigator.geolocation.watchPosition(
        handleLocationUpdate,
        handleLocationError,
        options
      );

      setIsTracking(true);
    } else {
      toast({
        title: 'Geolocation Not Supported',
        description: 'Your device does not support location tracking',
        status: 'error',
        duration: 5000,
      });
    }
  }, [isConfigReady, config.enableGeoTracking, handleLocationUpdate, handleLocationError, toast]);

  // Stop location tracking
  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);
  }, []);

  // Manual step update with validation
  const manualUpdateStep = useCallback(async (newStep: string) => {
    const trigger: StepTrigger = {
      step: newStep,
      condition: 'manual',
      data: { previousStep: config.currentStep }
    };

    return updateJobStep(newStep, trigger, currentLocation || undefined);
  }, [config.currentStep, updateJobStep, currentLocation]);

  // Time-based triggers (for future implementation)
  const checkTimeBasedTriggers = useCallback(() => {
    if (!config.enableTimeTracking) return;

    // Implement time-based logic here
    // e.g., auto-advance after certain duration in a step
  }, [config.enableTimeTracking]);

  // Initialize tracking on mount only if config is ready
  useEffect(() => {
    if (isConfigReady && autoUpdatesEnabled && config.enableGeoTracking) {
      startTracking();
    }

    return () => {
      stopTracking();
    };
  }, [isConfigReady, autoUpdatesEnabled, config.enableGeoTracking, startTracking, stopTracking]);

  // Clear proximity alerts after some time
  useEffect(() => {
    if (proximityAlerts.length > 0) {
      const timer = setTimeout(() => {
        setProximityAlerts([]);
      }, 10000); // Clear after 10 seconds

      return () => clearTimeout(timer);
    }
  }, [proximityAlerts]);

  return {
    // State
    currentLocation,
    isTracking: isConfigReady && isTracking,
    autoUpdatesEnabled,
    locationHistory,
    proximityAlerts,

    // Actions
    startTracking,
    stopTracking,
    manualUpdateStep,
    setAutoUpdatesEnabled,

    // Utilities
    getCurrentStepIndex,
    shouldAutoAdvanceToStep,
    calculateDistance,

    // Config state
    isConfigReady,
  };
};

export default useAutoStatusUpdates;