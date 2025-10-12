/**
 * API contracts and type definitions for Speedy Van
 */

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  code?: string;
  timestamp: string;
  requestId?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface BookingRequest {
  pickupAddress: string;
  dropoffAddress: string;
  scheduledDate: string;
  items: BookingItem[];
  customerInfo: CustomerInfo;
  specialInstructions?: string;
}

export interface BookingItem {
  name: string;
  quantity: number;
  description?: string;
  fragile?: boolean;
  weight?: number;
}

export interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
}

export interface BookingResponse {
  id: string;
  reference: string;
  status: 'pending' | 'confirmed' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  pickupAddress: string;
  dropoffAddress: string;
  scheduledDate: string;
  estimatedDuration: string;
  totalAmount: number;
  createdAt: string;
}

export interface DriverInfo {
  id: string;
  name: string;
  phone: string;
  vehicle: VehicleInfo;
  rating: number;
  location?: LocationInfo;
}

export interface VehicleInfo {
  type: string;
  capacity: number;
  registration: string;
}

export interface LocationInfo {
  lat: number;
  lng: number;
  address: string;
}

export interface TrackingUpdate {
  bookingId: string;
  status: string;
  location?: LocationInfo;
  message?: string;
  timestamp: string;
}

export interface PricingRequest {
  pickupAddress: string;
  dropoffAddress: string;
  items: BookingItem[];
  scheduledDate?: string;
}

export interface PricingResponse {
  basePrice: number;
  distance: number;
  duration: number;
  totalPrice: number;
  breakdown: PriceBreakdown;
}

export interface PriceBreakdown {
  baseRate: number;
  distanceRate: number;
  timeRate: number;
  itemRate: number;
  fuelSurcharge: number;
  serviceFee: number;
  taxes: number;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'customer' | 'driver' | 'admin';
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationData {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  data?: any;
}