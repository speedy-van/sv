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
  
  // ✅ FIX #5: New fields for order routing system
  orderType?: 'single' | 'multi-drop' | 'return-journey';
  eligibleForMultiDrop?: boolean;
  estimatedLoadPercentage?: number;
  priorityLevel?: number; // 1-10
  potentialSavings?: number; // in pence
  multiDropDiscount?: number; // in pence
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



// Route Types
export interface Route {
  id: string;
  status: RouteStatus;
  serviceTier: string;
  driverId?: string;
  totalDrops: number;
  completedDrops: number;
  estimatedDuration: number; // minutes
  totalDistance: number; // kilometers
  totalValue: number; // GBP (in pence)
  timeWindowStart: string;
  timeWindowEnd: string;
  optimizedSequence: number[];
  createdAt: string;
  drops: Drop[];
  
  // ✅ FIX #6: New fields for enhanced route details
  optimizationScore?: number;
  totalEarnings?: number; // Driver earnings in pence
  earningsPerHour?: number;
  earningsPerStop?: number;
  multiDropBonus?: number; // in pence
}

export type RouteStatus = 
  | 'pending_assignment'
  | 'assigned'
  | 'active'
  | 'completed'
  | 'failed';

export interface Drop {
  id: string;
  routeId?: string;
  bookingId?: string;
  customerId: string;
  customerName?: string;
  customerPhone?: string;
  pickupAddress: string;
  deliveryAddress: string;
  pickupLatitude?: number;
  pickupLongitude?: number;
  deliveryLatitude?: number;
  deliveryLongitude?: number;
  timeWindowStart: string;
  timeWindowEnd: string;
  serviceTier: string;
  status: DropStatus;
  quotedPrice: number; // in pence
  weight?: number;
  volume?: number;
  specialInstructions?: string;
  proofOfDelivery?: string;
  failureReason?: string;
  completedAt?: string;
  createdAt: string;
  sequenceNumber?: number;
}

export type DropStatus = 
  | 'pending'
  | 'assigned_to_route'
  | 'picked_up'
  | 'in_transit'
  | 'delivered'
  | 'failed';

export interface RouteEarningsPreview {
  routeId: string;
  estimatedEarnings: number;
  formattedEarnings: string;
  numberOfStops: number;
  totalDistance: number;
  totalDuration: number;
  earningsPerStop: number;
  earningsPerMile: number;
  earningsPerHour: number;
  breakdown: any[];
}

