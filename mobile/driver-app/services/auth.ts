import { apiService } from './api';
import { AuthResponse, User } from '../types';

class AuthService {
  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      const response = await apiService.post<AuthResponse>('/api/driver/auth/login', {
        email,
        password,
      });

      if (response.success && response.data?.token) {
        await apiService.setToken(response.data.token);
        return {
          success: true,
          token: response.data.token,
          user: response.data.user,
        };
      }

      return {
        success: false,
        error: response.error || 'Login failed',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Login failed',
      };
    }
  }

  async logout(): Promise<void> {
    try {
      await apiService.post('/api/driver/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      await apiService.clearToken();
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

