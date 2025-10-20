import { apiService } from './api';
import { AuthResponse, User } from '../types';

class AuthService {
  private static logoutInProgress = false;

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
          
          console.log('✅ Token saved, login successful. User:', completeUser);
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
      // Always clear the local token regardless of API call result
      await apiService.clearToken();
      console.log('✅ Local token cleared');
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
      const token = await apiService.getToken();
      if (!token) return null;

      const response = await apiService.get<{ user: User }>('/api/driver/profile');
      if (response.success && response.data?.user) {
        return response.data.user;
      }
      return null;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  async isAuthenticated(): Promise<boolean> {
    const token = await apiService.getToken();
    return !!token;
  }
}

export const authService = new AuthService();

