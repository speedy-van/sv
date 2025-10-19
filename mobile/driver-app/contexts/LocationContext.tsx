import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { locationService } from '../services/location';
import { Location } from '../types';

interface LocationContextType {
  currentLocation: Location | null;
  permissions: {
    granted: boolean;
    foreground: boolean;
    background: boolean;
  };
  isTracking: boolean;
  requestPermissions: () => Promise<boolean>;
  startTracking: (jobId?: string) => Promise<boolean>;
  stopTracking: () => Promise<void>;
  refreshLocation: () => Promise<void>;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [permissions, setPermissions] = useState({
    granted: false,
    foreground: false,
    background: false,
  });
  const [isTracking, setIsTracking] = useState(false);
  const [activeJobId, setActiveJobId] = useState<string | undefined>();

  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    const perms = await locationService.checkPermissions();
    setPermissions(perms);
  };

  const requestPermissions = async (): Promise<boolean> => {
    const perms = await locationService.requestPermissions();
    setPermissions(perms);
    return perms.granted;
  };

  const startTracking = async (jobId?: string): Promise<boolean> => {
    if (!permissions.granted) {
      const granted = await requestPermissions();
      if (!granted) return false;
    }

    setActiveJobId(jobId);

    // Start foreground tracking
    const started = await locationService.startForegroundTracking(
      async (location) => {
        setCurrentLocation(location);
        // Send location update to backend
        await locationService.sendLocationUpdate(location, jobId);
      },
      10000 // Update every 10 seconds
    );

    if (started) {
      setIsTracking(true);
      
      // Start background tracking if permission granted
      if (permissions.background) {
        await locationService.startBackgroundTracking();
      }
    }

    return started;
  };

  const stopTracking = async () => {
    await locationService.stopForegroundTracking();
    await locationService.stopBackgroundTracking();
    setIsTracking(false);
    setActiveJobId(undefined);
  };

  const refreshLocation = async () => {
    const location = await locationService.getCurrentLocation();
    if (location) {
      setCurrentLocation(location);
    }
  };

  return (
    <LocationContext.Provider
      value={{
        currentLocation,
        permissions,
        isTracking,
        requestPermissions,
        startTracking,
        stopTracking,
        refreshLocation,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};

