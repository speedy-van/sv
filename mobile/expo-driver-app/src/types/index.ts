// User Types
export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface Driver {
  id: string;
  userId: string;
  status: string;
  onboardingStatus: string;
  rating?: number;
  strikes: number;
}

// Job Types
export interface Job {
  id: string;
  reference: string;
  customer: string;
  customerPhone: string;
  date: string;
  time: string;
  from: string;
  to: string;
  distance: string;
  vehicleType: string;
  items: string;
  estimatedEarnings: string;
  status: JobStatus;
  priority: string;
  duration: string;
  crew: string;
}

export type JobStatus = 
  | 'available' 
  | 'assigned' 
  | 'accepted' 
  | 'en_route' 
  | 'arrived' 
  | 'loading' 
  | 'in_transit' 
  | 'unloading' 
  | 'completed' 
  | 'cancelled';

export type JobStep = 
  | 'en_route' 
  | 'arrived' 
  | 'loading' 
  | 'in_transit' 
  | 'unloading' 
  | 'completed';

// Availability Types
export interface AvailabilityStatus {
  isOnline: boolean;
  acceptingJobs: boolean;
  locationConsent: boolean;
  hasActiveOrders: boolean;
}

// Stats Types
export interface DriverStats {
  todayEarnings: number;
  todayJobs: number;
  weeklyEarnings: number;
  totalJobs: number;
  averageRating: number;
  acceptanceRate: number;
  completionRate: number;
}

// Performance Types
export interface DriverPerformance {
  acceptanceRate: number;
  completionRate: number;
  averageRating: number;
  totalJobs: number;
  completedJobs: number;
  cancelledJobs: number;
  onTimeRate: number;
  lastCalculated: string;
}

export interface AcceptanceRateUpdate {
  acceptanceRate: number;
  change: number;
  reason: 'job_declined' | 'route_declined';
  jobId?: string;
  routeId?: string;
  timestamp: string;
}

// Earnings Types
export interface Earning {
  id: string;
  routeId?: string;
  jobId?: string;
  date: string;
  completedDrops: number;
  totalDrops: number;
  baseEarningsPence: number;
  tipsPence: number;
  bonusesPence: number;
  deductionsPence: number;
  totalEarningsPence: number;
  payoutStatus: 'pending' | 'processing' | 'paid';
  payoutDate?: string;
  wasPartial: boolean;
  adjustmentReason?: string;
}

export interface EarningsData {
  originalAmountPence: number;
  adjustedAmountPence: number;
  completedDrops: number;
  totalDrops: number;
}

export interface EarningsSummary {
  today: {
    routes: number;
    earningsPence: number;
    tipsPence: number;
  };
  thisWeek: {
    routes: number;
    earningsPence: number;
    tipsPence: number;
    pendingPence: number;
  };
  thisMonth: {
    routes: number;
    earningsPence: number;
    tipsPence: number;
    paidPence: number;
    pendingPence: number;
  };
  allTime: {
    totalRoutes: number;
    totalEarningsPence: number;
    averagePerRoutePence: number;
  };
}

// Pusher Event Types
export interface JobRemovedEvent {
  jobId: string;
  reason: 'declined' | 'cancelled' | 'reassigned';
  message: string;
  timestamp: string;
}

export interface JobOfferEvent {
  jobId: string;
  message: string;
  expiresIn: number;
  timestamp: string;
}

export interface RouteOfferEvent {
  routeId: string;
  dropCount: number;
  estimatedEarnings: number;
  estimatedDuration: number;
  message: string;
  timestamp: string;
}

export interface RouteRemovedEvent {
  routeId: string;
  completedDrops: number;
  totalDrops: number;
  earnedAmountPence: number;
  earningsData?: EarningsData;
  message: string;
  reason: string;
  timestamp: string;
}

export interface ScheduleUpdatedEvent {
  type: 'job_removed' | 'route_removed' | 'acceptance_rate_changed';
  jobId?: string;
  routeId?: string;
  acceptanceRate?: number;
  timestamp: string;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface DeclineJobResponse {
  success: boolean;
  message: string;
  acceptanceRate: number;
  change: number;
}

export interface DeclineRouteResponse {
  success: boolean;
  message: string;
  warning?: string;
  data: {
    routeId: string;
    reassignedToOtherDrivers: boolean;
    acceptanceRate: number;
    change: number;
  };
}

