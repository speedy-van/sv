import axios, { AxiosInstance, AxiosError } from 'axios';
import axiosRetry from 'axios-retry';
import NetInfo from '@react-native-community/netinfo';
import { API_CONFIG } from '../config/api';
import { getToken, clearAuth } from './storage.service';

class ApiService {
  private api: AxiosInstance;
  private isOnline: boolean = true;

  constructor() {
    console.log('🔧 API Service - Base URL:', API_CONFIG.BASE_URL);
    console.log('🔧 API Service - Timeout:', API_CONFIG.TIMEOUT);
    console.log('🔧 API Service - Development Mode:', __DEV__);
    
    this.api = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Configure axios-retry for automatic retries
    axiosRetry(this.api, {
      retries: 3, // 3 retry attempts
      retryDelay: axiosRetry.exponentialDelay, // Exponential backoff (1s, 2s, 4s)
      retryCondition: (error) => {
        // Retry on network errors or 5xx server errors
        return axiosRetry.isNetworkOrIdempotentRequestError(error) 
          || (error.response?.status ? error.response.status >= 500 : false);
      },
      onRetry: (retryCount, error, requestConfig) => {
        console.log(`🔄 Retry attempt ${retryCount} for ${requestConfig.method?.toUpperCase()} ${requestConfig.url}`);
      },
    });

    // Listen to network changes
    NetInfo.addEventListener(state => {
      this.isOnline = state.isConnected ?? true;
      console.log(`📡 Network status changed: ${this.isOnline ? 'Online' : 'Offline'}`);
    });

    // Request interceptor - add auth token
    this.api.interceptors.request.use(
      async (config) => {
        const token = await getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
          console.log('🔑 Token added to request:', token.substring(0, 20) + '...');
        } else {
          console.log('❌ No token found for request');
        }
        console.log('📤 API Request:', config.method?.toUpperCase(), config.url);
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor - handle errors
    this.api.interceptors.response.use(
      (response) => {
        console.log('📥 API Response:', response.status, response.config.url);
        return response;
      },
      async (error: AxiosError) => {
        console.error('❌ API Error:', error.message, error.config?.url);
        console.error('❌ API Error Details:', {
          code: error.code,
          status: error.response?.status,
          baseURL: error.config?.baseURL,
          url: error.config?.url,
        });
        
        // Network connectivity issues
        if (error.code === 'NETWORK_ERROR' || error.message === 'Network Error') {
          console.error('🌐 Network Error - Check if backend server is running and accessible');
          console.error('🌐 Backend should be running on:', API_CONFIG.BASE_URL);
          console.error('🌐 Make sure your phone and computer are on the same WiFi network');
        }
        
        // Handle 401 - unauthorized
        if (error.response?.status === 401) {
          console.log('🔐 Unauthorized - clearing auth');
          await clearAuth();
        }
        
        return Promise.reject(error);
      }
    );
  }

  /**
   * Check if device is online before making request
   */
  private async checkConnectivity(): Promise<void> {
    const netState = await NetInfo.fetch();
    this.isOnline = netState.isConnected ?? true;
    
    if (!this.isOnline) {
      throw new Error('No internet connection. Please check your network and try again.');
    }
  }

  async get<T>(url: string): Promise<T> {
    await this.checkConnectivity();
    const response = await this.api.get<T>(url);
    return response.data;
  }

  async post<T>(url: string, data?: any): Promise<T> {
    await this.checkConnectivity();
    const response = await this.api.post<T>(url, data);
    return response.data;
  }

  async put<T>(url: string, data?: any): Promise<T> {
    await this.checkConnectivity();
    const response = await this.api.put<T>(url, data);
    return response.data;
  }

  async delete<T>(url: string): Promise<T> {
    await this.checkConnectivity();
    const response = await this.api.delete<T>(url);
    return response.data;
  }

  /**
   * Get current online status
   */
  getOnlineStatus(): boolean {
    return this.isOnline;
  }
}

export default new ApiService();

