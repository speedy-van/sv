import apiService from './api.service';
import { API_ENDPOINTS } from '../config/api';
import { saveToken, saveUser, saveDriver, clearAuth, saveProfile } from './storage.service';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  token?: string;
  user?: any;
  driver?: any;
  error?: string;
}

class AuthService {
  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      const response = await apiService.post<LoginResponse>(API_ENDPOINTS.LOGIN, {
        email,
        password,
      });

      if (response.success && response.token) {
        console.log('🔑 Saving token:', response.token);
        await saveToken(response.token);
        
        // ✅ CRITICAL: Ensure user object includes driver relation
        if (response.user) {
          console.log('💾 Saving user with driver relation:', {
            userId: response.user.id,
            driverId: response.user.driver?.id,
            hasDriverRelation: !!response.user.driver
          });
          
          await saveUser(response.user);
          
          // Save driver separately for backward compatibility
          if (response.user.driver) {
            await saveDriver(response.user.driver);
          } else if (response.driver) {
            // Fallback: if driver is separate in response
            await saveDriver(response.driver);
            // Update user object to include driver relation
            response.user.driver = response.driver;
            await saveUser(response.user);
          }
        }
        
        console.log('✅ Token and user data saved successfully');
      } else {
        console.log('❌ No token in response:', response);
      }

      return response;
    } catch (error: any) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    await clearAuth();
  }

  async checkSession(): Promise<any> {
    try {
      return await apiService.get(API_ENDPOINTS.SESSION);
    } catch (error) {
      console.error('Session check error:', error);
      throw error;
    }
  }
}

export default new AuthService();

