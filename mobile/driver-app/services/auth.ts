import { apiService } from './api';
import { AuthResponse, User } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';

class AuthService {
  private static logoutInProgress = false;
  private static readonly USER_STORAGE_KEY = 'auth_user_data';
  private static readonly SESSION_EXPIRY_KEY = 'auth_session_expiry';

  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      console.log('🔐 AuthService.login called with:', { email });
      const response = await apiService.post<any>('/api/driver/auth/login', {
        email,
        password,
      });

      console.log('🔐 AuthService.login response:', response);

      if (response.success) {
        const responseData = response.data;
        console.log('🔐 Response data:', responseData);

        if (responseData.token) {
          await apiService.setToken(responseData.token);

          // Merge user and driver data
          const completeUser: User = {
            ...responseData.user,
            driver: responseData.driver || responseData.user?.driver,
          };

          // Store user data and session expiry locally
          await this.storeUserSession(completeUser);

          console.log('✅ Token and user data saved, login successful. User:', completeUser);
          return {
            success: true,
            token: responseData.token,
            user: completeUser,
          };
        }
      }

      console.error('❌ Login failed:', response.error);
      return {
        success: false,
        error: response.error || 'Login failed',
      };
    } catch (error: any) {
      console.error('❌ AuthService.login exception:', error);
      return {
        success: false,
        error: error.message || 'Login failed',
      };
    }
  }

  // Store user session data locally
  private async storeUserSession(user: User): Promise<void> {
    try {
      // Store user data
      await AsyncStorage.setItem(AuthService.USER_STORAGE_KEY, JSON.stringify(user));

      // Store session expiry (24 hours from now)
      const expiryTime = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
      await AsyncStorage.setItem(AuthService.SESSION_EXPIRY_KEY, expiryTime.toString());

      console.log('💾 User session stored locally');
    } catch (error) {
      console.warn('Failed to store user session:', error);
    }
  }

  // Clear stored user session data
  private async clearUserSession(): Promise<void> {
    try {
      await AsyncStorage.removeItem(AuthService.USER_STORAGE_KEY);
      await AsyncStorage.removeItem(AuthService.SESSION_EXPIRY_KEY);
      console.log('🗑️ User session cleared from local storage');
    } catch (error) {
      console.warn('Failed to clear user session:', error);
    }
  }

  // Check if stored session is still valid
  private async isSessionValid(): Promise<boolean> {
    try {
      const expiryStr = await AsyncStorage.getItem(AuthService.SESSION_EXPIRY_KEY);
      if (!expiryStr) return false;

      const expiryTime = parseInt(expiryStr, 10);
      return Date.now() < expiryTime;
    } catch (error) {
      console.warn('Failed to check session validity:', error);
      return false;
    }
  }

  // Get cached user data
  private async getCachedUser(): Promise<User | null> {
    try {
      const userStr = await AsyncStorage.getItem(AuthService.USER_STORAGE_KEY);
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      console.warn('Failed to get cached user:', error);
      return null;
    }
  }

  async logout(): Promise<void> {
    try {
      if (AuthService.logoutInProgress) {
        console.log('ℹ️ Logout already in progress - skipping duplicate call');
        return;
      }
      AuthService.logoutInProgress = true;

      // Check for token first - if no token, just clear local state
      const existingToken = await apiService.getToken();
      if (!existingToken) {
        console.log('ℹ️ No token found, clearing local state only');
        await apiService.clearToken();
        await this.clearUserSession();
        AuthService.logoutInProgress = false;
        return;
      }

      // Only call server logout if we have a valid token
      try {
        const response = await apiService.post('/api/driver/auth/logout');
        console.log('✅ Logout API response:', response);
      } catch (apiError: any) {
        // If API call fails, don't log as error - just continue with local cleanup
        console.log('ℹ️ Logout API call completed (status may vary)');
      }
    } catch (error: any) {
      console.log('⚠️ Logout process error:', error.message);
    } finally {
      // Always clear the local token and session data regardless of API call result
      await apiService.clearToken();
      await this.clearUserSession();
      console.log('✅ Local token and session cleared');
      AuthService.logoutInProgress = false;
    }
  }

  async forgotPassword(email: string): Promise<AuthResponse> {
    try {
      const response = await apiService.post('/api/driver/auth/forgot', { email });
      return {
        success: response.success,
        message: response.message || 'Password reset email sent',
        error: response.error,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to send reset email',
      };
    }
  }

  async resetPassword(token: string, password: string): Promise<AuthResponse> {
    try {
      const response = await apiService.post('/api/driver/auth/reset', {
        token,
        password,
      });
      return {
        success: response.success,
        message: response.message || 'Password reset successful',
        error: response.error,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to reset password',
      };
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      // First check if we have a valid cached session
      if (await this.isSessionValid()) {
        const cachedUser = await this.getCachedUser();
        if (cachedUser) {
          console.log('✅ Using cached user data:', cachedUser.name);

          // Try to refresh user data in background without blocking
          this.refreshUserDataInBackground(cachedUser);
          return cachedUser;
        }
      }

      // If no valid cache, check token and fetch from server
      const token = await apiService.getToken();
      if (!token) {
        console.log('❌ No token found');
        return null;
      }

      console.log('🔄 Fetching user data from server...');
      const response = await apiService.get<{ user: User }>('/api/driver/profile');

      if (response.success && response.data?.user) {
        // Cache the user data for future use
        await this.storeUserSession(response.data.user);
        console.log('✅ User data fetched and cached:', response.data.user.name);
        return response.data.user;
      }

      // If API call fails, clear invalid token and session
      console.log('❌ Failed to fetch user data, clearing session');
      await apiService.clearToken();
      await this.clearUserSession();
      return null;

    } catch (error) {
      console.error('❌ Get current user error:', error);

      // On network errors, try to use cached data as fallback
      if (await this.isSessionValid()) {
        const cachedUser = await this.getCachedUser();
        if (cachedUser) {
          console.log('⚠️ Network error, using cached user data as fallback');
          return cachedUser;
        }
      }

      return null;
    }
  }

  // Refresh user data in background without affecting current session
  private async refreshUserDataInBackground(cachedUser: User): Promise<void> {
    try {
      const response = await apiService.get<{ user: User }>('/api/driver/profile');
      if (response.success && response.data?.user) {
        // Update cached data with fresh server data
        await this.storeUserSession(response.data.user);
        console.log('🔄 User data refreshed in background');
      }
    } catch (error) {
      // Silently fail background refresh
      console.log('ℹ️ Background user data refresh failed (non-critical)');
    }
  }

  async isAuthenticated(): Promise<boolean> {
    try {
      // Check if we have a token
      const token = await apiService.getToken();
      if (!token) {
        console.log('❌ No token found - not authenticated');
        return false;
      }

      // Check if session is still valid
      if (!(await this.isSessionValid())) {
        console.log('❌ Session expired - not authenticated');
        // Clear expired session
        await this.clearUserSession();
        return false;
      }

      // Try a lightweight API call to validate token
      const response = await apiService.get('/api/driver/profile');
      if (response.success) {
        console.log('✅ Token validated - authenticated');
        return true;
      }

      // If API validation fails, token might be expired
      console.log('❌ Token validation failed - clearing session');
      await apiService.clearToken();
      await this.clearUserSession();
      return false;

    } catch (error) {
      console.warn('⚠️ Authentication check error:', error);

      // On network errors, allow cached session to continue working
      if (await this.isSessionValid()) {
        console.log('⚠️ Network error but session valid - allowing cached authentication');
        return true;
      }

      return false;
    }
  }
}

export const authService = new AuthService();

