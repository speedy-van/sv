/**
 * API client for Speedy Van
 */

import { 
  ApiResponse, 
  PaginatedResponse, 
  BookingRequest, 
  BookingResponse,
  PricingRequest,
  PricingResponse,
  UserProfile,
  NotificationData
} from '@/types/api-contracts';

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
    };

    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    return response.json();
  }

  // Booking-luxury endpoints
  async createLuxuryBooking(booking: BookingRequest): Promise<ApiResponse<BookingResponse>> {
    return this.request<BookingResponse>('/booking-luxury', {
      method: 'POST',
      body: JSON.stringify(booking),
    });
  }

  async getLuxuryBooking(id: string): Promise<ApiResponse<BookingResponse>> {
    return this.request<BookingResponse>(`/booking-luxury/${id}`);
  }

  async getLuxuryBookings(page: number = 1, limit: number = 10): Promise<ApiResponse<BookingResponse[]>> {
    return this.request<BookingResponse[]>(`/booking-luxury?page=${page}&limit=${limit}`);
  }

  // Pricing endpoints
  async getPricing(request: PricingRequest): Promise<ApiResponse<PricingResponse>> {
    return this.request<PricingResponse>('/pricing/quote', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // User endpoints
  async getProfile(): Promise<ApiResponse<UserProfile>> {
    return this.request<UserProfile>('/me');
  }

  async updateProfile(profile: Partial<UserProfile>): Promise<ApiResponse<UserProfile>> {
    return this.request<UserProfile>('/me', {
      method: 'PUT',
      body: JSON.stringify(profile),
    });
  }

  // Notification endpoints
  async getNotifications(): Promise<ApiResponse<NotificationData[]>> {
    return this.request<NotificationData[]>('/notifications');
  }

  async markNotificationAsRead(id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/notifications/${id}/read`, {
      method: 'PUT',
    });
  }

  // Tracking endpoints
  async trackBooking(code: string): Promise<ApiResponse<any>> {
    return this.request<any>(`/track/${code}`);
  }
}

export const apiClient = new ApiClient();
export default apiClient;