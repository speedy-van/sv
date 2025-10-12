import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import authService from '../services/auth.service';
import apiService from '../services/api.service';
import { API_ENDPOINTS } from '../config/api';
import { getToken, getUser, getDriver, saveUser, saveDriver, clearAuth } from '../services/storage.service';
import { User, Driver } from '../types';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  driver: Driver | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [driver, setDriver] = useState<Driver | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await getToken();
      if (token) {
        console.log('🔑 Token found in storage, checking user data...');
        const storedUser = await getUser();
        const storedDriver = await getDriver();
        
        // ✅ CRITICAL FIX: Extract driver from user.driver if not separately stored
        if (storedUser) {
          let driverData = storedDriver;
          
          // If driver not stored separately, extract from user object
          if (!driverData && (storedUser as any).driver) {
            console.log('📦 Extracting driver from user.driver relation');
            driverData = (storedUser as any).driver;
            await saveDriver(driverData);
          }
          
          // If still no driver data, fetch from API
          if (!driverData) {
            console.log('⚠️ No driver data in cache, fetching from API...');
            try {
              const profileResponse: any = await apiService.get(API_ENDPOINTS.PROFILE);
              if (profileResponse.success && profileResponse.data) {
                const profile = profileResponse.data;
                if (profile.driver) {
                  driverData = profile.driver;
                  await saveDriver(driverData);
                  
                  // Update user object with driver relation
                  const updatedUser = { ...storedUser, driver: driverData };
                  await saveUser(updatedUser);
                  setUser(updatedUser as User);
                }
              }
            } catch (fetchError) {
              console.error('❌ Failed to fetch driver data:', fetchError);
              // Clear invalid cache
              await clearAuth();
              setIsLoading(false);
              return;
            }
          }
          
          if (driverData) {
            setUser(storedUser);
            setDriver(driverData);
            setIsAuthenticated(true);
            console.log('✅ Auth restored from cache with driver:', driverData.id);
          } else {
            console.error('❌ Driver data not found, clearing cache');
            await clearAuth();
          }
        }
      }
    } catch (err) {
      console.error('Auth check error:', err);
      await clearAuth();
    } finally {
      setIsLoading(false);
    }
  };

  const refreshProfile = async () => {
    try {
      console.log('🔄 Refreshing driver profile...');
      const profileResponse: any = await apiService.get(API_ENDPOINTS.PROFILE);
      if (profileResponse.success && profileResponse.data) {
        const profile = profileResponse.data;
        if (profile.driver) {
          await saveDriver(profile.driver);
          setDriver(profile.driver);
          
          // Update user object
          const updatedUser = user ? { ...user, driver: profile.driver } : null;
          if (updatedUser) {
            await saveUser(updatedUser);
            setUser(updatedUser as User);
          }
          console.log('✅ Profile refreshed successfully');
        }
      }
    } catch (err) {
      console.error('❌ Failed to refresh profile:', err);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setError(null);
      setIsLoading(true);
      
      const response = await authService.login(email, password);
      
      if (response.success && response.user && response.driver) {
        setUser(response.user);
        setDriver(response.driver);
        setIsAuthenticated(true);
      } else {
        setError(response.error || 'Login failed');
        throw new Error(response.error || 'Login failed');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Login failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    await authService.logout();
    setUser(null);
    setDriver(null);
    setIsAuthenticated(false);
    setIsLoading(false);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        user,
        driver,
        login,
        logout,
        refreshProfile,
        error,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

