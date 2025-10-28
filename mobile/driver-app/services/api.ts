import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { ApiResponse } from '../types';

// Determine API Base URL based on environment
const getApiBaseUrl = () => {
  // Priority 1: Check app.json extra config (production builds)
  const appConfigUrl = Constants.expoConfig?.extra?.EXPO_PUBLIC_API_BASE_URL;
  if (appConfigUrl) {
    console.log('📱 Using API URL from app.json:', appConfigUrl);
    return appConfigUrl;
  }

  // Priority 2: Check if EXPO_PUBLIC_API_BASE_URL is set in .env.local (development)
  if (process.env.EXPO_PUBLIC_API_BASE_URL) {
    console.log('🔧 Using API URL from .env.local:', process.env.EXPO_PUBLIC_API_BASE_URL);
    return process.env.EXPO_PUBLIC_API_BASE_URL;
  }

  // Priority 3: Default to production if nothing is set
  console.log('🌐 Using default production API URL');
  return 'https://api.speedy-van.co.uk';
};

const API_BASE_URL = getApiBaseUrl();

console.log('🌐 API Base URL:', API_BASE_URL);

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    console.log('🚀 ApiService initialized with base URL:', API_BASE_URL);

    // Add request interceptor to include auth token and prevent unnecessary logout calls
    this.api.interceptors.request.use(
      async (config) => {
        const token = await this.getToken();

        // If this is a logout call and there is no token, prevent the request entirely
        if (config.url && config.url.includes('/api/driver/auth/logout') && !token) {
          // Return a mock successful response to prevent network call
          return Promise.reject(new Error('LOGOUT_SKIPPED_NO_TOKEN'));
        }

        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Add response interceptor for error handling and suppress expected logout 401s
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        // Handle our custom logout skip error
        if (error.message === 'LOGOUT_SKIPPED_NO_TOKEN') {
          // Return a successful mock response for skipped logout
          return Promise.resolve({
            data: { success: true, message: 'Logout skipped - no token' },
            status: 200,
            statusText: 'OK',
            headers: {},
            config: error.config
          });
        }

        // Ignore cancellations from request interceptor
        if (axios.isCancel?.(error)) {
          return Promise.reject(error);
        }

        if (error.response?.status === 401) {
          // Token expired or invalid, clear it
          await this.clearToken();
          
          // Don't log 401 errors for logout endpoint as they're expected
          if (!error.config?.url?.includes('/logout')) {
            console.log('🔐 Token expired or invalid, cleared from storage');
          }
        }
        return Promise.reject(error);
      }
    );
  }

  async getToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync('authToken');
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  }

  async setToken(token: string): Promise<void> {
    try {
      await SecureStore.setItemAsync('authToken', token);
    } catch (error) {
      console.error('Error setting token:', error);
    }
  }

  async clearToken(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync('authToken');
    } catch (error) {
      console.error('Error clearing token:', error);
    }
  }

  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      // Add cache-busting for dashboard requests and disable caching
      const cacheBuster = url.includes('/dashboard') ? `?t=${Date.now()}&_cb=${Math.random()}` : '';
      const fullUrl = url + cacheBuster;
      
      // Add headers to prevent caching
      const requestConfig = {
        ...config,
        headers: {
          ...config?.headers,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      };
      
      const response = await this.api.get(fullUrl, requestConfig);
      return {
        success: true,
        data: response.data.data || response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Request failed',
      };
    }
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      // Don't log logout requests to reduce noise
      if (!url.includes('/logout')) {
        console.log('📤 POST Request:', { 
          url, 
          baseURL: API_BASE_URL, 
          fullUrl: `${API_BASE_URL}${url}`,
          data 
        });
      }
      
      const response = await this.api.post(url, data, config);
      
      // Don't log logout responses to reduce noise
      if (!url.includes('/logout')) {
        console.log('✅ POST Response:', { 
          status: response.status, 
          data: response.data,
          headers: response.headers 
        });
      }
      
      return {
        success: true,
        data: response.data,
        message: response.data.message,
      };
    } catch (error: any) {
      // Don't log logout errors or location 403s to reduce noise
      const isLocationError = url.includes('/location') && error.response?.status === 403;
      
      if (!url.includes('/logout') && !isLocationError) {
        console.error('❌ POST Error FULL:', error);
        console.error('❌ POST Error Details:', {
          url,
          fullUrl: `${API_BASE_URL}${url}`,
          message: error.message,
          code: error.code,
          response: error.response?.data,
          status: error.response?.status,
          config: error.config,
        });
      }
      
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Request failed',
      };
    }
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.api.put(url, data, config);
      return {
        success: true,
        data: response.data.data || response.data,
        message: response.data.message,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Request failed',
      };
    }
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.api.delete(url, config);
      return {
        success: true,
        data: response.data.data || response.data,
        message: response.data.message,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Request failed',
      };
    }
  }
}

export const apiService = new ApiService();

