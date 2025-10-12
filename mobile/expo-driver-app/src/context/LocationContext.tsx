import React, { createContext, useContext, useState, ReactNode } from 'react';
import * as Location from 'expo-location';
import locationService from '../services/location.service';

interface LocationContextType {
  currentLocation: Location.LocationObject | null;
  isTracking: boolean;
  hasPermission: boolean;
  requestPermission: () => Promise<boolean>;
  startTracking: (jobId: string) => Promise<void>;
  stopTracking: () => Promise<void>;
  getCurrentLocation: () => Promise<void>;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider = ({ children }: { children: ReactNode }) => {
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);

  const requestPermission = async (): Promise<boolean> => {
    const granted = await locationService.requestPermissions();
    setHasPermission(granted);
    return granted;
  };

  const startTracking = async (jobId: string) => {
    const granted = hasPermission || await requestPermission();
    if (!granted) {
      throw new Error('Location permission not granted');
    }

    await locationService.startTracking(jobId);
    setIsTracking(true);
  };

  const stopTracking = async () => {
    await locationService.stopTracking();
    setIsTracking(false);
  };

  const getCurrentLocation = async () => {
    const location = await locationService.getCurrentLocation();
    if (location) {
      setCurrentLocation(location);
    }
  };

  return (
    <LocationContext.Provider
      value={{
        currentLocation,
        isTracking,
        hasPermission,
        requestPermission,
        startTracking,
        stopTracking,
        getCurrentLocation,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within LocationProvider');
  }
  return context;
};

