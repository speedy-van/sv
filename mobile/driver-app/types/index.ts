export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  driver?: Driver;
}

export interface Driver {
  id: string;
  userId: string;
  status: 'active' | 'inactive' | 'suspended';
  onboardingStatus: 'pending' | 'approved' | 'rejected';
  rating?: number;
}

export interface Job {
  id: string;
  assignmentId?: string;
  customer: string;
  customerPhone: string;
  customerEmail: string;
  from: string;
  to: string;
  date: string;
  time: string;
  distance: string;
  estimatedEarnings: string;
  vehicleType: string;
  items: string;
  status: 'invited' | 'accepted' | 'available' | 'completed';
  assignmentStatus?: string;
  bookingStatus?: string;
  reference: string;
  createdAt: string;
  expiresAt?: string;
  scheduledAt?: string;
}

export interface Statistics {
  assignedJobs: number;
  availableJobs: number;
  completedToday: number;
  totalCompleted: number;
  earningsToday: number;
  totalEarnings: number;
  averageRating: number;
}

export interface DashboardData {
  driver: Driver;
  jobs: {
    assigned: Job[];
    available: Job[];
  };
  statistics: Statistics;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: User;
  error?: string;
  message?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface Location {
  latitude: number;
  longitude: number;
  timestamp: number;
  accuracy?: number;
}

export interface PusherEvent {
  type: string;
  bookingReference?: string;
  routeId?: string;
  routeNumber?: string;
  bookingsCount?: number;
  message?: string;
  reason?: string;
  remainingDrops?: number;
  title?: string;
}

