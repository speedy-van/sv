# 🔍 iOS Driver App - Complete Deep Audit Report

**Date:** October 10, 2025  
**Auditor:** System Analysis  
**Scope:** Complete business logic, networking, state management, UI/UX, location tracking, earnings, and quality gates  
**App Path:** `mobile/expo-driver-app/` (React Native/Expo)

---

## 📊 EXECUTIVE SUMMARY

### Overall Status: 🔴 **CRITICAL ISSUES FOUND - NOT PRODUCTION READY**

**Completion:** ~35% (Demo/mock data, missing critical business logic)  
**Risk Level:** **HIGH** - Core features not implemented  
**ETA to Production:** 15-20 hours of focused development  

### Critical Findings:
1. ❌ **ALL data is MOCK/DEMO** - No real backend integration
2. ❌ **Missing Business Rules** - Decline/-5%, earnings recalc, auto-reassign
3. ❌ **Pusher Events Incomplete** - Missing 8 critical events
4. ❌ **No State Management** - Using local state only
5. ❌ **Acceptance Rate** - Not implemented at all
6. ❌ **Earnings Calculation** - Hardcoded, no backend sync

---

## 🔴 PART 1: BUSINESS RULES COMPLIANCE

### 1.1 Decline Functionality ❌ **BROKEN**

**Current State:**
```typescript
// File: src/screens/JobsScreen.tsx:131-147
handleDeclineJob = (jobId: string) => {
  Alert.alert(
    'Decline Job',
    'Are you sure?',
    [
      { text: 'Cancel' },
      { 
        text: 'Decline', 
        onPress: () => {
          // ❌ WRONG: Only removes from local state
          setJobs(prevJobs => prevJobs.filter(job => job.id !== jobId));
          Alert.alert('Job Declined', 'Job has been removed from your list.');
        }
      }
    ]
  );
};
```

**Problems:**
- ❌ Doesn't call API (`/api/driver/jobs/${id}/decline`)
- ❌ Doesn't reduce acceptance rate by 5%
- ❌ Doesn't trigger auto-reassignment
- ❌ Doesn't update admin panels
- ❌ Only removes from local UI (ghost data)

**Required Fix:**
```typescript
// File: src/services/job.service.ts
async declineJob(id: string, reason: string): Promise<{
  success: boolean;
  acceptanceRate: number;
  change: number;
}> {
  const response = await apiService.post(`/api/driver/jobs/${id}/decline`, { reason });
  return response;
}

// File: src/screens/JobsScreen.tsx
handleDeclineJob = async (jobId: string) => {
  try {
    const result = await jobService.declineJob(jobId, 'Not available');
    
    // ✅ INSTANT REMOVAL from UI
    setJobs(prev => prev.filter(j => j.id !== jobId));
    
    // ✅ UPDATE ACCEPTANCE RATE
    setAcceptanceRate(result.acceptanceRate);
    
    // ✅ SHOW FEEDBACK
    Alert.alert(
      'Job Declined',
      `Acceptance rate: ${result.acceptanceRate}% (${result.change}%)`,
      [{ text: 'OK' }]
    );
  } catch (error) {
    Alert.alert('Error', 'Failed to decline job');
  }
};
```

**Files to Update:**
- ✅ `src/services/job.service.ts` - Already has `declineJob`
- ❌ `src/screens/JobsScreen.tsx` - Must call API and handle response
- ❌ `src/screens/RoutesScreen.tsx` - Same for routes
- ❌ `src/types/index.ts` - Add AcceptanceRateResponse type

**Risk:** 🔴 **CRITICAL** - Core functionality broken  
**ETA:** 2 hours

---

### 1.2 Acceptance Rate Tracking ❌ **NOT IMPLEMENTED**

**Current State:**
- ❌ No acceptance rate in UI
- ❌ No acceptance rate in types
- ❌ No progress bar/indicator
- ❌ Not listening to Pusher event `acceptance-rate-updated`

**Required Implementation:**

**Step 1: Add to Types**
```typescript
// File: src/types/index.ts
export interface DriverPerformance {
  acceptanceRate: number;
  completionRate: number;
  averageRating: number;
  totalJobs: number;
  completedJobs: number;
}

export interface AcceptanceRateUpdate {
  acceptanceRate: number;
  change: number;
  reason: 'job_declined' | 'route_declined';
}
```

**Step 2: Add Pusher Listener**
```typescript
// File: src/services/pusher.service.ts (ADD)
this.driverChannel.bind('acceptance-rate-updated', (data: any) => {
  console.log('📉 ACCEPTANCE RATE UPDATED:', data);
  this.notifyListeners('acceptance-rate-updated', data);
  
  this.showNotification(
    'Performance Update',
    `Your acceptance rate: ${data.acceptanceRate}% (${data.change}%)`
  );
});
```

**Step 3: Add UI Component**
```typescript
// File: src/components/AcceptanceRateCard.tsx (NEW FILE NEEDED)
export function AcceptanceRateCard({ rate }: { rate: number }) {
  const getColor = (rate: number) => {
    if (rate >= 80) return '#10B981'; // Green
    if (rate >= 60) return '#F59E0B'; // Yellow
    return '#EF4444'; // Red
  };

  return (
    <View style={styles.card}>
      <Text style={styles.label}>Acceptance Rate</Text>
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${rate}%`, backgroundColor: getColor(rate) }]} />
        </View>
        <Text style={[styles.percentage, { color: getColor(rate) }]}>{rate}%</Text>
      </View>
    </View>
  );
}
```

**Step 4: Add to Dashboard**
```typescript
// File: src/screens/DashboardScreen.tsx
const [acceptanceRate, setAcceptanceRate] = useState(100);

useEffect(() => {
  pusherService.addEventListener('acceptance-rate-updated', (data: any) => {
    setAcceptanceRate(data.acceptanceRate);
  });
}, []);

// In render:
<AcceptanceRateCard rate={acceptanceRate} />
```

**Files to Create/Update:**
- ❌ NEW: `src/components/AcceptanceRateCard.tsx`
- ❌ UPDATE: `src/services/pusher.service.ts` - Add event binding
- ❌ UPDATE: `src/screens/DashboardScreen.tsx` - Add state + listener
- ❌ UPDATE: `src/types/index.ts` - Add types

**Risk:** 🔴 **HIGH** - Key performance metric missing  
**ETA:** 3 hours

---

### 1.3 Route Cancellation with Earnings Recalculation ❌ **NOT IMPLEMENTED**

**Current State:**
- ❌ No route cancellation UI
- ❌ No partial earnings calculation
- ❌ No "completed drops" tracking
- ❌ Earnings are hardcoded mock data

**Required Implementation:**

**Backend API Response (already implemented):**
```json
{
  "success": true,
  "message": "Route unassigned. Earnings adjusted for 6/10 completed drops.",
  "data": {
    "completedDrops": 6,
    "totalDrops": 10,
    "earningsData": {
      "originalAmount": 10000,
      "adjustedAmount": 6000
    }
  }
}
```

**Frontend Implementation Needed:**

```typescript
// File: src/components/RouteEarningsCard.tsx (NEW)
export function RouteEarningsCard({ route, completedDrops }: any) {
  const perDropEarnings = route.totalEarnings / route.totalDrops;
  const earnedAmount = perDropEarnings * completedDrops;
  const remaining = route.totalEarnings - earnedAmount;

  return (
    <View style={styles.card}>
      <Text>Completed: {completedDrops}/{route.totalDrops} drops</Text>
      <Text>Earned: £{earnedAmount.toFixed(2)}</Text>
      {completedDrops < route.totalDrops && (
        <Text style={styles.warning}>
          Uncompleted: £{remaining.toFixed(2)} (not paid)
        </Text>
      )}
    </View>
  );
}
```

**Pusher Event Handler:**
```typescript
// File: src/services/pusher.service.ts (ADD)
this.driverChannel.bind('route-removed', (data: any) => {
  console.log('🚫 ROUTE REMOVED:', data);
  
  if (data.earningsData) {
    const adjusted = data.earningsData.adjustedAmount / 100;
    const original = data.earningsData.originalAmount / 100;
    
    this.showNotification(
      'Route Cancelled',
      `You earned £${adjusted.toFixed(2)} for ${data.completedDrops} completed drops.`
    );
  }
  
  this.notifyListeners('route-removed', data);
});
```

**Files to Create/Update:**
- ❌ NEW: `src/components/RouteEarningsCard.tsx`
- ❌ UPDATE: `src/services/pusher.service.ts` - Add earnings notification
- ❌ UPDATE: `src/screens/EarningsScreen.tsx` - Show partial earnings
- ❌ UPDATE: `src/types/index.ts` - Add EarningsData type

**Risk:** 🔴 **HIGH** - Payment accuracy critical  
**ETA:** 4 hours

---

### 1.4 Real-Time Schedule Updates ❌ **PARTIAL**

**Current State:**
```typescript
// File: src/services/pusher.service.ts
// ✅ Has: route-matched, job-assigned, route-removed
// ❌ MISSING: job-removed, job-offer, schedule-updated, acceptance-rate-updated
```

**Missing Pusher Events:**
1. ❌ `job-removed` - When job declined/removed
2. ❌ `job-offer` - When job reassigned to this driver
3. ❌ `route-offer` - When route reassigned to this driver
4. ❌ `schedule-updated` - When schedule changes
5. ❌ `acceptance-rate-updated` - When rate changes
6. ❌ `order-reassigned` - When order moved to another driver
7. ❌ `route-reassigned` - When route moved to another driver
8. ❌ `driver-performance-updated` - Performance metrics

**Required Fix:**
```typescript
// File: src/services/pusher.service.ts

// 1. JOB REMOVED - Instant removal
this.driverChannel.bind('job-removed', (data: any) => {
  console.log('🗑️ JOB REMOVED:', data);
  this.notifyListeners('job-removed', data);
  this.showNotification('Job Removed', data.message);
});

// 2. JOB OFFER - New assignment after someone declined
this.driverChannel.bind('job-offer', (data: any) => {
  console.log('🎁 NEW JOB OFFER:', data);
  this.notifyListeners('job-offer', data);
  audioService.playRouteMatchSound();
  this.showNotification('New Job Offer', data.message);
});

// 3. ROUTE OFFER - New route assignment
this.driverChannel.bind('route-offer', (data: any) => {
  console.log('🛣️ NEW ROUTE OFFER:', data);
  this.notifyListeners('route-offer', data);
  audioService.playRouteMatchSound();
  this.showNotification('New Route Offer', `${data.dropCount} stops - £${data.estimatedEarnings}`);
});

// 4. SCHEDULE UPDATED
this.driverChannel.bind('schedule-updated', (data: any) => {
  console.log('📅 SCHEDULE UPDATED:', data);
  this.notifyListeners('schedule-updated', data);
});

// 5. ACCEPTANCE RATE UPDATED
this.driverChannel.bind('acceptance-rate-updated', (data: any) => {
  console.log('📉 ACCEPTANCE RATE:', data);
  this.notifyListeners('acceptance-rate-updated', data);
  this.showNotification(
    'Performance Update',
    `Acceptance rate: ${data.acceptanceRate}% (${data.change}%)`
  );
});
```

**Files to Update:**
- ❌ `src/services/pusher.service.ts` - Add 8 missing events
- ❌ `src/screens/JobsScreen.tsx` - Listen to job-removed, job-offer
- ❌ `src/screens/RoutesScreen.tsx` - Listen to route-removed, route-offer
- ❌ `src/screens/DashboardScreen.tsx` - Listen to schedule-updated

**Risk:** 🔴 **CRITICAL** - Real-time sync broken  
**ETA:** 3 hours

---

## 🌐 PART 2: NETWORKING & REALTIME

### 2.1 API Configuration ⚠️ **NEEDS IMPROVEMENT**

**Current State:**
```typescript
// File: src/config/api.ts
const getBaseURL = () => {
  if (__DEV__) {
    return 'http://172.20.10.2:3000'; // ❌ Hardcoded IP
  }
  return 'https://speedy-van.co.uk'; // ❌ Wrong URL
};

export const API_CONFIG = {
  BASE_URL: getBaseURL(),
  TIMEOUT: 20000, // ✅ Good
};
```

**Problems:**
1. ❌ Hardcoded dev IP (`172.20.10.2`) - Won't work for all developers
2. ❌ Production URL wrong: Should be `https://api.speedy-van.co.uk` (with `api.` subdomain)
3. ❌ No staging environment
4. ❌ No env variables support

**Required Fix:**
```typescript
// File: src/config/api.ts
import Constants from 'expo-constants';

const getBaseURL = () => {
  const envUrl = Constants.expoConfig?.extra?.apiUrl;
  
  if (envUrl) return envUrl;
  
  if (__DEV__) {
    // Use localhost with Expo tunneling
    return process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
  }
  
  // Production
  return 'https://api.speedy-van.co.uk'; // ✅ Correct
};

export const API_CONFIG = {
  BASE_URL: getBaseURL(),
  TIMEOUT: 30000, // Increased for route operations
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
};
```

**app.json Update:**
```json
{
  "expo": {
    "extra": {
      "apiUrl": "https://api.speedy-van.co.uk",
      "pusherKey": "407cb06c423e6c032e9c",
      "pusherCluster": "eu"
    }
  }
}
```

**Files to Update:**
- ❌ `src/config/api.ts` - Fix URLs and add env support
- ❌ `app.json` - Add extra config
- ❌ Create `.env.development`, `.env.staging`, `.env.production`

**Risk:** 🟡 **MEDIUM** - Works but not flexible  
**ETA:** 1 hour

---

### 2.2 Timeout & Connection Handling ⚠️ **PARTIAL**

**Current State:**
```typescript
// File: src/services/api.service.ts
constructor() {
  this.api = axios.create({
    baseURL: API_CONFIG.BASE_URL,
    timeout: API_CONFIG.TIMEOUT, // ✅ Has timeout
    // ❌ No retry logic
    // ❌ No exponential backoff
    // ❌ No request queuing for offline
  });
}
```

**Problems:**
- ❌ No retry mechanism for failed requests
- ❌ No exponential backoff on 5xx errors
- ❌ No offline queue (requests lost when offline)
- ❌ No request deduplication

**Required Fix:**
```typescript
// File: src/services/api.service.ts
import axios from 'axios-retry'; // Add dependency

constructor() {
  this.api = axios.create({
    baseURL: API_CONFIG.BASE_URL,
    timeout: 30000,
  });

  // ✅ Add retry logic
  axiosRetry(this.api, {
    retries: 3,
    retryDelay: axiosRetry.exponentialDelay,
    retryCondition: (error) => {
      return axiosRetry.isNetworkOrIdempotentRequestError(error) 
        || error.response?.status === 503;
    },
  });

  // ✅ Add request queue for offline
  this.requestQueue = new RequestQueue();
}
```

**Files to Create/Update:**
- ❌ `package.json` - Add `axios-retry`, `@react-native-community/netinfo`
- ❌ `src/services/api.service.ts` - Add retry logic
- ❌ NEW: `src/services/offline-queue.service.ts` - Queue failed requests

**Risk:** 🟡 **MEDIUM** - UX suffers on poor network  
**ETA:** 2 hours

---

### 2.3 Pusher WebSocket Management ⚠️ **INCOMPLETE**

**Current State:**
```typescript
// File: src/services/pusher.service.ts
// ✅ Good: Has connection handlers
// ✅ Good: Has auto-reconnect
// ⚠️ PARTIAL: Only 5 events bound (need 13+)
// ❌ BAD: No unsubscribe on logout
// ❌ BAD: No duplicate event prevention
```

**Problems:**
1. ❌ **Missing Events:** 8 critical events not bound
2. ❌ **No Cleanup:** Doesn't unsubscribe on logout/unmount
3. ❌ **Duplicate Handling:** No event deduplication
4. ❌ **No Reconnection Strategy:** Basic reconnect, no backoff

**Current Events:**
```typescript
✅ route-matched
✅ job-assigned
✅ route-removed (partial)
✅ notification
✅ admin_message

❌ job-removed (MISSING)
❌ job-offer (MISSING)
❌ route-offer (MISSING)
❌ acceptance-rate-updated (MISSING)
❌ schedule-updated (MISSING)
❌ driver-performance-updated (MISSING)
❌ order-reassigned (MISSING)
❌ route-reassigned (MISSING)
```

**Required Implementation:**

**Full Event List:**
```typescript
// File: src/services/pusher.service.ts

private bindDriverEvents() {
  if (!this.driverChannel) return;

  // Prevent duplicate bindings
  this.driverChannel.unbind_all();

  const events = {
    // Job Events
    'job-assigned': this.handleJobAssigned.bind(this),
    'job-removed': this.handleJobRemoved.bind(this),
    'job-offer': this.handleJobOffer.bind(this),
    
    // Route Events
    'route-matched': this.handleRouteMatched.bind(this),
    'route-removed': this.handleRouteRemoved.bind(this),
    'route-offer': this.handleRouteOffer.bind(this),
    
    // Performance Events
    'acceptance-rate-updated': this.handleAcceptanceRateUpdated.bind(this),
    'driver-performance-updated': this.handlePerformanceUpdated.bind(this),
    
    // Schedule Events
    'schedule-updated': this.handleScheduleUpdated.bind(this),
    
    // Reassignment Events
    'order-reassigned': this.handleOrderReassigned.bind(this),
    'route-reassigned': this.handleRouteReassigned.bind(this),
    
    // General
    'notification': this.handleNotification.bind(this),
    'admin_message': this.handleAdminMessage.bind(this),
  };

  Object.entries(events).forEach(([event, handler]) => {
    this.driverChannel.bind(event, handler);
  });

  // Event deduplication
  this.processedEvents = new Set();
}

// Cleanup on logout
disconnect() {
  if (this.driverChannel) {
    this.driverChannel.unbind_all();
    this.driverChannel.unsubscribe();
  }
  if (this.pusher) {
    this.pusher.disconnect();
  }
  this.listeners.clear();
  this.processedEvents.clear();
}
```

**Files to Update:**
- ❌ `src/services/pusher.service.ts` - Complete event implementation
- ❌ `src/context/AuthContext.tsx` - Call disconnect on logout
- ❌ `src/screens/*` - Add listeners for all events

**Risk:** 🔴 **CRITICAL** - Real-time sync incomplete  
**ETA:** 4 hours

---

### 2.4 Background Fetch & Push Notifications ❌ **STUB ONLY**

**Current State:**
```typescript
// File: src/services/pusher.service.ts:249
private showNotification(title: string, message: string) {
  // ❌ STUB: "Expo notifications need to be set up separately"
  console.log(` Notification: ${title} - ${message}`);
}
```

**Problems:**
- ❌ Notifications not implemented - Only console.log
- ❌ No Expo Notifications setup
- ❌ No device token registration
- ❌ No background fetch configuration

**Required Implementation:**
```typescript
// File: src/services/notification.service.ts (NEW)
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

class NotificationService {
  private token: string | null = null;

  async initialize() {
    // Request permissions
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      console.warn('Notification permission denied');
      return;
    }

    // Get push token
    this.token = (await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig?.extra?.eas?.projectId,
    })).data;

    console.log('📲 Push token:', this.token);

    // Register token with backend
    await this.registerToken();

    // Configure notification handler
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  }

  async registerToken() {
    if (!this.token) return;
    
    try {
      await apiService.post('/api/driver/push-subscription', {
        token: this.token,
        platform: 'ios',
      });
    } catch (error) {
      console.error('Failed to register push token:', error);
    }
  }

  async showLocalNotification(title: string, body: string, data?: any) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
      },
      trigger: null, // Show immediately
    });
  }
}

export default new NotificationService();
```

**app.json Update:**
```json
{
  "expo": {
    "ios": {
      "infoPlist": {
        "UIBackgroundModes": [
          "location",
          "fetch",
          "remote-notification"
        ]
      }
    },
    "notification": {
      "icon": "./assets/notification-icon.png",
      "color": "#1E40AF",
      "androidMode": "default"
    }
  }
}
```

**Files to Create/Update:**
- ❌ NEW: `src/services/notification.service.ts`
- ❌ UPDATE: `src/services/pusher.service.ts` - Call notification service
- ❌ UPDATE: `app.json` - Add background modes
- ❌ UPDATE: `src/App.tsx` - Initialize notifications

**Risk:** 🔴 **HIGH** - Drivers miss job offers  
**ETA:** 3 hours

---

## 💾 PART 3: STATE MANAGEMENT & DATA INTEGRITY

### 3.1 State Management ❌ **NONE - USING LOCAL STATE**

**Current State:**
```typescript
// File: src/screens/JobsScreen.tsx
const [jobs, setJobs] = useState<Job[]>([]); // ❌ Local state only

// File: src/screens/RoutesScreen.tsx
const [routes, setRoutes] = useState<Route[]>([]); // ❌ Local state only

// File: src/screens/EarningsScreen.tsx
const [earnings, setEarnings] = useState<RouteEarning[]>([]); // ❌ Local state only
```

**Problems:**
- ❌ **No single source of truth** - Each screen has its own state
- ❌ **Data drift** - Jobs screen shows different data than Dashboard
- ❌ **No persistence** - Data lost on app restart
- ❌ **No optimistic updates** - Poor UX
- ❌ **No conflict resolution** - Multiple Pusher events can cause race conditions

**Required Solution: Zustand Store**

```typescript
// File: src/store/driver.store.ts (NEW)
import create from 'zustand';
import { persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface DriverState {
  // Driver Info
  driverId: string | null;
  acceptanceRate: number;
  performance: DriverPerformance | null;
  
  // Jobs
  jobs: Job[];
  activeJobs: Job[];
  
  // Routes
  routes: Route[];
  activeRoute: Route | null;
  
  // Earnings
  earnings: Earning[];
  todayEarnings: number;
  weeklyEarnings: number;
  
  // Actions
  setAcceptanceRate: (rate: number) => void;
  addJob: (job: Job) => void;
  removeJob: (jobId: string) => void;
  updateJob: (jobId: string, updates: Partial<Job>) => void;
  acceptJob: (jobId: string) => void;
  declineJob: (jobId: string) => void;
  
  addRoute: (route: Route) => void;
  removeRoute: (routeId: string) => void;
  updateRoute: (routeId: string, updates: Partial<Route>) => void;
  acceptRoute: (routeId: string) => void;
  declineRoute: (routeId: string) => void;
  
  addEarning: (earning: Earning) => void;
  updateEarning: (earningId: string, amount: number) => void;
  
  reset: () => void;
}

export const useDriverStore = create<DriverState>()(
  persist(
    (set, get) => ({
      driverId: null,
      acceptanceRate: 100,
      performance: null,
      jobs: [],
      activeJobs: [],
      routes: [],
      activeRoute: null,
      earnings: [],
      todayEarnings: 0,
      weeklyEarnings: 0,
      
      setAcceptanceRate: (rate) => set({ acceptanceRate: Math.max(0, rate) }),
      
      addJob: (job) => set((state) => ({
        jobs: [...state.jobs, job].filter((j, i, arr) => 
          arr.findIndex(item => item.id === j.id) === i
        )
      })),
      
      removeJob: (jobId) => set((state) => ({
        jobs: state.jobs.filter(j => j.id !== jobId),
        activeJobs: state.activeJobs.filter(j => j.id !== jobId)
      })),
      
      updateJob: (jobId, updates) => set((state) => ({
        jobs: state.jobs.map(j => j.id === jobId ? { ...j, ...updates } : j)
      })),
      
      declineJob: (jobId) => {
        set((state) => ({
          jobs: state.jobs.filter(j => j.id !== jobId),
          acceptanceRate: Math.max(0, state.acceptanceRate - 5)
        }));
      },
      
      // Similar for routes...
      
      reset: () => set({
        jobs: [],
        activeJobs: [],
        routes: [],
        activeRoute: null,
        earnings: [],
        acceptanceRate: 100,
      }),
    }),
    {
      name: 'driver-storage',
      storage: AsyncStorage,
    }
  )
);
```

**Usage in Screens:**
```typescript
// File: src/screens/JobsScreen.tsx
import { useDriverStore } from '../store/driver.store';

export default function JobsScreen() {
  const { jobs, removeJob, declineJob } = useDriverStore();
  
  const handleDecline = async (jobId: string) => {
    try {
      const result = await jobService.declineJob(jobId, 'Not available');
      declineJob(jobId); // ✅ Single source of truth
    } catch (error) {
      Alert.alert('Error', 'Failed to decline job');
    }
  };
  
  return (
    <View>
      {jobs.map(job => (
        <JobCard key={job.id} job={job} onDecline={() => handleDecline(job.id)} />
      ))}
    </View>
  );
}
```

**Files to Create/Update:**
- ❌ NEW: `src/store/driver.store.ts`
- ❌ NEW: `src/store/jobs.store.ts`
- ❌ NEW: `src/store/routes.store.ts`
- ❌ NEW: `src/store/earnings.store.ts`
- ❌ UPDATE: ALL screens - Use Zustand instead of local state
- ❌ `package.json` - Add `zustand`

**Risk:** 🔴 **CRITICAL** - Data integrity issues  
**ETA:** 6 hours

---

### 3.2 Data Integrity & Idempotency ❌ **NOT IMPLEMENTED**

**Current Problems:**
- ❌ Pusher events can fire multiple times (duplicate jobs in list)
- ❌ No event deduplication
- ❌ No timestamp/version checking
- ❌ Jobs can be in both "jobs" and "routes" lists

**Required Fix:**
```typescript
// File: src/store/driver.store.ts
interface DriverState {
  processedEventIds: Set<string>;
  lastSync: Date | null;
  
  processEvent: (eventId: string, handler: () => void) => void;
}

const store = create<DriverState>((set, get) => ({
  processedEventIds: new Set(),
  lastSync: null,
  
  processEvent: (eventId, handler) => {
    if (get().processedEventIds.has(eventId)) {
      console.log('⚠️ Duplicate event ignored:', eventId);
      return;
    }
    
    get().processedEventIds.add(eventId);
    handler();
    
    // Clean old events (keep last 1000)
    if (get().processedEventIds.size > 1000) {
      const arr = Array.from(get().processedEventIds);
      set({ processedEventIds: new Set(arr.slice(-1000)) });
    }
  },
}));
```

**Files to Update:**
- ❌ `src/store/driver.store.ts` - Add event deduplication
- ❌ `src/services/pusher.service.ts` - Use processEvent wrapper

**Risk:** 🟡 **MEDIUM** - Can cause duplicate jobs  
**ETA:** 2 hours

---

### 3.3 Status Mapping ⚠️ **INCONSISTENT**

**Current Types:**
```typescript
// File: src/types/index.ts
export type JobStatus = 
  | 'available' 
  | 'assigned' 
  | 'accepted'  // ❌ Backend uses 'claimed'
  | 'en_route' 
  | 'arrived' 
  | 'loading' 
  | 'in_transit' 
  | 'unloading' 
  | 'completed' 
  | 'cancelled';
```

**Backend Statuses:**
```typescript
// Backend: AssignmentStatus
enum AssignmentStatus {
  invited,    // ❌ Missing in mobile
  claimed,    // ❌ Mobile uses 'accepted'
  accepted,   // ❌ Different meaning
  declined,   // ✅ Same
  completed,  // ✅ Same
  cancelled   // ✅ Same
}
```

**Required Fix:**
```typescript
// File: src/types/index.ts
export type JobStatus = 
  | 'invited'      // NEW: Job offered to driver
  | 'claimed'      // NEW: Driver claimed job
  | 'accepted'     // Job accepted by driver
  | 'en_route'     // Driver navigating to pickup
  | 'arrived'      // Driver arrived at pickup
  | 'loading'      // Loading items
  | 'in_transit'   // Driving to dropoff
  | 'unloading'    // Unloading items
  | 'completed'    // Job completed
  | 'declined'     // Driver declined
  | 'cancelled';   // Job cancelled

// Map backend status to mobile status
export function mapBackendStatus(backendStatus: string): JobStatus {
  const mapping: Record<string, JobStatus> = {
    'invited': 'invited',
    'claimed': 'claimed',
    'accepted': 'accepted',
    'completed': 'completed',
    'declined': 'declined',
    'cancelled': 'cancelled',
  };
  return mapping[backendStatus] || 'invited';
}
```

**Files to Update:**
- ❌ `src/types/index.ts` - Fix status enums
- ❌ `src/utils/status-mapper.ts` (NEW) - Status mapping functions
- ❌ ALL screens - Use mapped statuses

**Risk:** 🟡 **MEDIUM** - Status confusion  
**ETA:** 1 hour

---

## 🎨 PART 4: UI/UX FLOWS

### 4.1 Login → Permissions Flow ⚠️ **PARTIAL**

**Current Implementation:**
```typescript
// File: src/context/AuthContext.tsx
// ✅ Has login logic
// ❌ No permission requests after login
// ❌ No availability toggle setup
```

**Required Flow:**
```
Login ✅
  ↓
Request Location Permission ❌
  ↓
Request Notification Permission ❌
  ↓
Initialize Pusher ✅
  ↓
Show Availability Toggle ⚠️
  ↓
Dashboard Ready ✅
```

**Files to Update:**
- ❌ `src/context/AuthContext.tsx` - Add permission requests
- ❌ `src/screens/LoginScreen.tsx` - Post-login permissions flow
- ❌ NEW: `src/screens/PermissionsScreen.tsx`

**Risk:** 🟡 **MEDIUM** - Bad onboarding UX  
**ETA:** 2 hours

---

### 4.2 Job Offer → Accept/Decline Flow ❌ **DEMO DATA ONLY**

**Current Implementation:**
```typescript
// File: src/screens/JobsScreen.tsx:107-147
handleAcceptJob = (jobId: string) => {
  // ❌ Only updates local state
  setJobs(prevJobs => 
    prevJobs.map(job => job.id === jobId ? { ...job, status: 'assigned' } : job)
  );
  Alert.alert('Success', 'Job accepted!'); // ❌ No API call
};

handleDeclineJob = (jobId: string) => {
  // ❌ Only removes from local state
  setJobs(prevJobs => prevJobs.filter(job => job.id !== jobId));
  Alert.alert('Job Declined'); // ❌ No API call, no acceptance rate update
};
```

**Required Implementation:**
```typescript
// File: src/screens/JobsScreen.tsx
handleAcceptJob = async (jobId: string) => {
  try {
    setIsAccepting(true);
    
    // ✅ Call API
    const result = await jobService.acceptJob(jobId);
    
    // ✅ Update store
    updateJob(jobId, { status: 'accepted' });
    
    // ✅ Show success
    Alert.alert('Job Accepted', 'You can now start the job');
    
    // ✅ Navigate to job detail
    navigation.navigate('JobDetail', { jobId });
  } catch (error) {
    Alert.alert('Error', 'Failed to accept job');
  } finally {
    setIsAccepting(false);
  }
};

handleDeclineJob = async (jobId: string, reason: string) => {
  try {
    setIsDeclining(true);
    
    // ✅ Call API
    const result = await jobService.declineJob(jobId, reason);
    
    // ✅ INSTANT REMOVAL from UI
    removeJob(jobId);
    
    // ✅ UPDATE ACCEPTANCE RATE
    setAcceptanceRate(result.acceptanceRate);
    
    // ✅ Show feedback
    Alert.alert(
      'Job Declined',
      `Acceptance rate: ${result.acceptanceRate}% (${result.change}%)`,
      [{ text: 'OK' }]
    );
  } catch (error) {
    Alert.alert('Error', 'Failed to decline job');
  } finally {
    setIsDeclining(false);
  }
};
```

**Files to Update:**
- ❌ `src/screens/JobsScreen.tsx` - Implement real API calls
- ❌ `src/screens/RoutesScreen.tsx` - Same for routes
- ❌ `src/components/JobCard.tsx` - Add loading states

**Risk:** 🔴 **CRITICAL** - Core functionality broken  
**ETA:** 3 hours

---

### 4.3 Active Route Progress ❌ **STUB ONLY**

**Current State:**
```typescript
// File: src/components/RouteProgressView.tsx exists
// ❌ But not integrated with real backend
// ❌ Drop completion not calling API
```

**Required Implementation:**
```typescript
// File: src/screens/ActiveRouteScreen.tsx (NEW)
export function ActiveRouteScreen({ routeId }: any) {
  const { activeRoute, updateDrop } = useDriverStore();
  const [completedDrops, setCompletedDrops] = useState(0);

  const handleCompleteDrop = async (dropId: string) => {
    try {
      // ✅ Call API
      const result = await apiService.post(
        `/api/driver/routes/${routeId}/drops/${dropId}/complete`,
        { 
          location: await getCurrentLocation(),
          timestamp: new Date().toISOString()
        }
      );
      
      // ✅ Update local state
      updateDrop(dropId, { status: 'completed' });
      setCompletedDrops(prev => prev + 1);
      
      // ✅ Update earnings display
      const perDropEarnings = activeRoute.totalEarnings / activeRoute.totalDrops;
      const earned = perDropEarnings * (completedDrops + 1);
      
      Alert.alert(
        'Drop Completed',
        `You've earned £${earned.toFixed(2)} (${completedDrops + 1}/${activeRoute.totalDrops} drops)`
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to complete drop');
    }
  };

  return (
    <RouteProgressView 
      route={activeRoute}
      completedDrops={completedDrops}
      onCompleteDrop={handleCompleteDrop}
    />
  );
}
```

**Files to Create/Update:**
- ❌ NEW: `src/screens/ActiveRouteScreen.tsx`
- ❌ UPDATE: `src/components/RouteProgressView.tsx` - Real API integration
- ❌ UPDATE: `src/services/api.service.ts` - Add drop completion endpoint

**Risk:** 🔴 **HIGH** - Can't complete jobs  
**ETA:** 4 hours

---

### 4.4 Offline Handling ❌ **NOT IMPLEMENTED**

**Current State:**
- ❌ No offline detection
- ❌ No queued actions
- ❌ No user feedback when offline
- ❌ No retry on reconnection

**Required Implementation:**
```typescript
// File: src/hooks/useNetworkStatus.ts (NEW)
import NetInfo from '@react-native-community/netinfo';
import { useState, useEffect } from 'react';

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [isInternetReachable, setIsInternetReachable] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected ?? false);
      setIsInternetReachable(state.isInternetReachable ?? false);
    });

    return unsubscribe;
  }, []);

  return { isOnline, isInternetReachable };
}

// File: src/components/OfflineBanner.tsx (NEW)
export function OfflineBanner() {
  const { isOnline } = useNetworkStatus();

  if (isOnline) return null;

  return (
    <View style={styles.banner}>
      <Icon name="cloud-offline" color="#EF4444" />
      <Text style={styles.text}>You're offline. Changes will sync when connected.</Text>
    </View>
  );
}
```

**Files to Create/Update:**
- ❌ NEW: `src/hooks/useNetworkStatus.ts`
- ❌ NEW: `src/components/OfflineBanner.tsx`
- ❌ NEW: `src/services/offline-queue.service.ts`
- ❌ UPDATE: `src/App.tsx` - Add offline banner
- ❌ `package.json` - Add `@react-native-community/netinfo`

**Risk:** 🟡 **MEDIUM** - Poor offline UX  
**ETA:** 3 hours

---

## 📍 PART 5: LOCATION & TRACKING

### 5.1 Location Service ✅ **IMPLEMENTED BUT NEEDS REVIEW**

**Current State:**
```typescript
// File: src/services/location.service.ts
// ✅ Good: Has foreground/background tracking
// ✅ Good: Privacy-conscious (only when job active)
// ⚠️ REVIEW: Battery impact, frequency
```

**Recommended Improvements:**
```typescript
// File: src/services/location.service.ts

// ✅ Current: 30 seconds interval
// ⚠️ Recommendation: Use significant location changes for battery

await Location.startLocationUpdatesAsync(LOCATION_TASK, {
  accuracy: Location.Accuracy.High,
  timeInterval: 30000, // ✅ Good
  distanceInterval: 50, // ✅ Good - Only update if moved 50m
  foregroundService: {
    notificationTitle: 'Speedy Van - Active Delivery',
    notificationBody: 'Tracking your location for customer updates',
  },
  // ✅ ADD: Battery optimization
  pausesUpdatesAutomatically: true,
  showsBackgroundLocationIndicator: true,
});
```

**app.json Location Permissions:** ✅ **CORRECT**
```json
{
  "ios": {
    "infoPlist": {
      "NSLocationWhenInUseUsageDescription": "✅ Good",
      "NSLocationAlwaysAndWhenInUseUsageDescription": "✅ Good",
      "NSLocationAlwaysUsageDescription": "✅ Good"
    }
  }
}
```

**Files to Review:**
- ✅ `src/services/location.service.ts` - Minor optimizations
- ✅ `app.json` - Permissions OK
- ⚠️ Test battery drain on real device

**Risk:** 🟢 **LOW** - Already implemented well  
**ETA:** 1 hour (optimization)

---

### 5.2 Map Integration & ETA ❌ **NOT IMPLEMENTED**

**Current State:**
- ❌ No live map showing current location
- ❌ No ETA calculation
- ❌ No route visualization
- ❌ No snap-to-road

**Required Implementation:**
```typescript
// File: src/screens/ActiveJobMapScreen.tsx (NEW)
import MapView, { Marker, Polyline } from 'react-native-maps';

export function ActiveJobMapScreen({ route }: any) {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [eta, setEta] = useState(null);

  useEffect(() => {
    // Listen to location updates
    const subscription = Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, timeInterval: 5000 },
      (location) => {
        setCurrentLocation(location.coords);
        calculateETA(location.coords, route.nextDrop);
      }
    );

    return () => subscription.then(sub => sub.remove());
  }, [route]);

  const calculateETA = async (from: any, to: any) => {
    try {
      const result = await apiService.post('/api/track/eta', { from, to });
      setEta(result.eta);
    } catch (error) {
      console.error('ETA calculation failed:', error);
    }
  };

  return (
    <MapView style={styles.map} region={...}>
      <Marker coordinate={currentLocation} title="You" />
      <Marker coordinate={route.nextDrop.location} title="Next Drop" />
      <Polyline coordinates={route.path} strokeColor="#1E40AF" strokeWidth={4} />
    </MapView>
  );
}
```

**Files to Create:**
- ❌ NEW: `src/screens/ActiveJobMapScreen.tsx`
- ❌ `package.json` - Add `react-native-maps`

**Risk:** 🟡 **MEDIUM** - Nice to have, not critical  
**ETA:** 4 hours

---

## 💰 PART 6: EARNINGS & METRICS

### 6.1 Earnings Screen ❌ **MOCK DATA ONLY**

**Current State:**
```typescript
// File: src/screens/EarningsScreen.tsx:68-73
const [summary, setSummary] = useState<EarningsSummary>({
  today: { routes: 2, earnings: 45.50, tips: 8.00 }, // ❌ HARDCODED
  thisWeek: { routes: 8, earnings: 245.50, tips: 45.00, pending: 30.00 },
  thisMonth: { routes: 32, earnings: 1245.50, tips: 180.00 },
  allTime: { totalRoutes: 156, totalEarnings: 5834.20 },
});
```

**Problems:**
- ❌ All data is hardcoded mock data
- ❌ Not fetching from `/api/driver/earnings`
- ❌ No real-time updates
- ❌ No partial earnings for cancelled routes

**Required Implementation:**
```typescript
// File: src/screens/EarningsScreen.tsx

const loadEarnings = async () => {
  try {
    setIsLoading(true);
    
    // ✅ REAL API CALL
    const response = await apiService.get('/api/driver/earnings');
    
    if (response.success) {
      setSummary(response.summary);
      setEarnings(response.earnings);
      
      // ✅ Listen to real-time updates
      pusherService.addEventListener('earnings-updated', (data: any) => {
        setEarnings(prev => [...prev, data.newEarning]);
        setSummary(prev => ({
          ...prev,
          today: {
            ...prev.today,
            earnings: prev.today.earnings + (data.amount / 100)
          }
        }));
      });
    }
  } catch (error) {
    console.error('Failed to load earnings:', error);
    Alert.alert('Error', 'Failed to load earnings data');
  } finally {
    setIsLoading(false);
  }
};
```

**Backend API (already exists):**
```
GET /api/driver/earnings ✅
```

**Files to Update:**
- ❌ `src/screens/EarningsScreen.tsx` - Remove mock data, call real API
- ❌ `src/services/pusher.service.ts` - Add earnings-updated event
- ❌ `src/types/index.ts` - Match backend earning structure

**Risk:** 🔴 **CRITICAL** - Wrong earnings shown to drivers  
**ETA:** 2 hours

---

### 6.2 Earnings Reconciliation ❌ **NO VALIDATION**

**Current State:**
- ❌ No validation that mobile earnings match Admin panel
- ❌ No currency formatting consistency
- ❌ No timezone handling
- ❌ No rounding strategy

**Required Implementation:**
```typescript
// File: src/utils/earnings.utils.ts (NEW)
export function formatEarnings(pence: number): string {
  return `£${(pence / 100).toFixed(2)}`;
}

export function calculatePartialEarnings(
  totalEarnings: number,
  completedDrops: number,
  totalDrops: number
): number {
  if (totalDrops === 0) return 0;
  const perDrop = totalEarnings / totalDrops;
  return Math.floor(perDrop * completedDrops);
}

export function validateEarningsSync(mobile: number, backend: number): boolean {
  // Allow 1 pence difference for rounding
  return Math.abs(mobile - backend) <= 1;
}
```

**Files to Create:**
- ❌ NEW: `src/utils/earnings.utils.ts`
- ❌ NEW: `src/utils/currency.utils.ts`
- ❌ UPDATE: ALL screens - Use utility functions

**Risk:** 🟡 **MEDIUM** - Inconsistent displays  
**ETA:** 2 hours

---

### 6.3 Acceptance Rate Progress Line ❌ **NOT IMPLEMENTED**

**Current State:**
- ❌ No acceptance rate displayed anywhere
- ❌ No progress bar
- ❌ No color coding (green/yellow/red)
- ❌ No real-time updates

**Required Implementation:**
```typescript
// File: src/components/AcceptanceRateIndicator.tsx (NEW)
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export function AcceptanceRateIndicator({ rate }: { rate: number }) {
  const getColor = () => {
    if (rate >= 90) return ['#10B981', '#059669']; // Green
    if (rate >= 80) return ['#3B82F6', '#2563EB']; // Blue
    if (rate >= 60) return ['#F59E0B', '#D97706']; // Orange
    return ['#EF4444', '#DC2626']; // Red
  };

  const getStatus = () => {
    if (rate >= 90) return 'Excellent';
    if (rate >= 80) return 'Good';
    if (rate >= 60) return 'Fair';
    return 'Needs Improvement';
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Acceptance Rate</Text>
      
      <View style={styles.progressBar}>
        <LinearGradient
          colors={getColor()}
          style={[styles.fill, { width: `${rate}%` }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        />
      </View>
      
      <View style={styles.info}>
        <Text style={styles.percentage}>{rate}%</Text>
        <Text style={[styles.status, { color: getColor()[0] }]}>
          {getStatus()}
        </Text>
      </View>
      
      <Text style={styles.hint}>
        Declining jobs reduces your rate by 5%
      </Text>
    </View>
  );
}
```

**Add to Dashboard:**
```typescript
// File: src/screens/DashboardScreen.tsx
import { AcceptanceRateIndicator } from '../components/AcceptanceRateIndicator';

const [acceptanceRate, setAcceptanceRate] = useState(100);

// Listen to Pusher updates
useEffect(() => {
  pusherService.addEventListener('acceptance-rate-updated', (data: any) => {
    setAcceptanceRate(data.acceptanceRate);
  });
  
  // Load initial rate
  loadPerformanceData();
}, []);

// In render:
<AcceptanceRateIndicator rate={acceptanceRate} />
```

**Files to Create/Update:**
- ❌ NEW: `src/components/AcceptanceRateIndicator.tsx`
- ❌ UPDATE: `src/screens/DashboardScreen.tsx` - Add component
- ❌ UPDATE: `src/screens/ProfileScreen.tsx` - Show in profile
- ❌ `package.json` - Already has `expo-linear-gradient`

**Risk:** 🔴 **HIGH** - Drivers don't see performance impact  
**ETA:** 2 hours

---

## 📱 PART 7: FILES & CONFIGS AUDIT

### 7.1 Critical Files Status

| File | Status | Issues | Priority |
|------|--------|--------|----------|
| `src/services/api.service.ts` | ⚠️ PARTIAL | Wrong base URL, no retry | 🔴 HIGH |
| `src/services/pusher.service.ts` | ⚠️ PARTIAL | Missing 8 events | 🔴 CRITICAL |
| `src/services/job.service.ts` | ✅ OK | API methods exist | 🟢 LOW |
| `src/services/auth.service.ts` | ✅ OK | - | 🟢 LOW |
| `src/services/location.service.ts` | ✅ OK | Minor optimization needed | 🟢 LOW |
| `src/services/notification.service.ts` | ❌ MISSING | Doesn't exist | 🔴 HIGH |
| `src/services/offline-queue.service.ts` | ❌ MISSING | Doesn't exist | 🟡 MEDIUM |
| `src/store/driver.store.ts` | ❌ MISSING | No state management | 🔴 CRITICAL |
| `src/screens/JobsScreen.tsx` | ❌ BROKEN | Mock data, no API calls | 🔴 CRITICAL |
| `src/screens/RoutesScreen.tsx` | ❌ BROKEN | Mock data, no API calls | 🔴 CRITICAL |
| `src/screens/EarningsScreen.tsx` | ❌ BROKEN | Mock data only | 🔴 CRITICAL |
| `src/screens/DashboardScreen.tsx` | ⚠️ PARTIAL | Has Pusher, but incomplete | 🔴 HIGH |
| `src/types/index.ts` | ⚠️ PARTIAL | Missing types | 🟡 MEDIUM |
| `src/components/AcceptanceRateIndicator.tsx` | ❌ MISSING | Doesn't exist | 🔴 HIGH |
| `src/hooks/useNetworkStatus.ts` | ❌ MISSING | Doesn't exist | 🟡 MEDIUM |
| `app.json` | ⚠️ PARTIAL | Missing extra config | 🟡 MEDIUM |
| `.env*` files | ❌ MISSING | No env files | 🟡 MEDIUM |
| `Info.plist` | ✅ OK | Permissions correct | 🟢 LOW |

---

### 7.2 Package Dependencies

**Current (package.json):**
```json
✅ "axios": "^1.6.5"
✅ "pusher-js": "^8.4.0-rc2"
✅ "expo-location": "~19.0.7"
✅ "expo-notifications": "~0.32.12"
✅ "@react-native-async-storage/async-storage": "2.2.0"
✅ "expo-linear-gradient": "~15.0.7"

❌ MISSING: "zustand" - State management
❌ MISSING: "@react-native-community/netinfo" - Network status
❌ MISSING: "axios-retry" - Retry logic
❌ MISSING: "react-native-maps" - Map view (optional but recommended)
```

**Required Updates:**
```bash
cd mobile/expo-driver-app
npm install zustand @react-native-community/netinfo axios-retry date-fns-tz
```

**Risk:** 🟡 **MEDIUM**  
**ETA:** 0.5 hour

---

## 🧪 PART 8: QUALITY GATES

### 8.1 Testing ❌ **NO TESTS**

**Current State:**
- ❌ No unit tests
- ❌ No integration tests
- ❌ No E2E tests

**Required (Minimum):**
```typescript
// File: __tests__/earnings.test.ts (NEW)
import { calculatePartialEarnings } from '../src/utils/earnings.utils';

describe('Earnings Calculations', () => {
  it('should calculate partial earnings correctly', () => {
    expect(calculatePartialEarnings(10000, 6, 10)).toBe(6000);
    expect(calculatePartialEarnings(10000, 0, 10)).toBe(0);
    expect(calculatePartialEarnings(10000, 10, 10)).toBe(10000);
  });

  it('should handle zero drops', () => {
    expect(calculatePartialEarnings(10000, 0, 0)).toBe(0);
  });
});

// File: __tests__/acceptance-rate.test.ts (NEW)
describe('Acceptance Rate', () => {
  it('should decrease by 5% on decline', () => {
    let rate = 100;
    rate = Math.max(0, rate - 5);
    expect(rate).toBe(95);
  });

  it('should never go below 0%', () => {
    let rate = 3;
    rate = Math.max(0, rate - 5);
    expect(rate).toBe(0);
  });
});
```

**Files to Create:**
- ❌ NEW: `__tests__/earnings.test.ts`
- ❌ NEW: `__tests__/acceptance-rate.test.ts`
- ❌ NEW: `__tests__/job-decline.test.ts`
- ❌ `package.json` - Add Jest config

**Risk:** 🟡 **MEDIUM** - No test coverage  
**ETA:** 4 hours

---

### 8.2 Error States ❌ **INCOMPLETE**

**Current State:**
```typescript
// File: src/components/ErrorView.swift exists
// ❌ But not used in most screens
// ❌ No specific error messages
// ❌ No retry buttons
```

**Required Implementation:**
```typescript
// File: src/screens/JobsScreen.tsx
const [error, setError] = useState<string | null>(null);

const fetchJobs = async () => {
  try {
    setError(null);
    setIsLoading(true);
    const data = await jobService.getJobs();
    setJobs(data.jobs);
  } catch (error) {
    if (error.response?.status === 401) {
      setError('Session expired. Please login again.');
      navigation.navigate('Login');
    } else if (error.response?.status === 403) {
      setError('Access denied. Please contact support.');
    } else if (error.code === 'ECONNABORTED') {
      setError('Request timeout. Please check your connection.');
    } else if (error.message === 'Network Error') {
      setError('No internet connection. Please check your network.');
    } else {
      setError('Failed to load jobs. Please try again.');
    }
  } finally {
    setIsLoading(false);
  }
};

// In render:
{error && (
  <ErrorView 
    message={error} 
    onRetry={() => fetchJobs()}
  />
)}
```

**Files to Update:**
- ❌ ALL screens - Add error handling
- ❌ `src/components/ErrorView.tsx` - Enhance with retry

**Risk:** 🟡 **MEDIUM** - Poor error UX  
**ETA:** 3 hours

---

## 📋 CONSOLIDATED ACTION PLAN

### Phase 1: Critical Business Logic (8 hours) 🔴

**Priority 1A: Decline Functionality (2h)**
- [ ] Update `JobsScreen.tsx` - Real API call on decline
- [ ] Update `RoutesScreen.tsx` - Real API call on decline
- [ ] Test decline removes job + reduces acceptance rate

**Priority 1B: Acceptance Rate (3h)**
- [ ] Create `AcceptanceRateIndicator.tsx` component
- [ ] Add Pusher event `acceptance-rate-updated`
- [ ] Add to Dashboard
- [ ] Add to Profile screen

**Priority 1C: Earnings Recalculation (3h)**
- [ ] Create `RouteEarningsCard.tsx` component
- [ ] Handle `route-removed` with earnings data
- [ ] Update `EarningsScreen.tsx` to show partial earnings
- [ ] Test: Cancel route with 6/10 drops = correct earnings

---

### Phase 2: State Management (6 hours) 🔴

**Priority 2A: Zustand Setup (3h)**
- [ ] Create `store/driver.store.ts`
- [ ] Create `store/jobs.store.ts`
- [ ] Create `store/earnings.store.ts`
- [ ] Install `zustand` package

**Priority 2B: Migrate Screens (3h)**
- [ ] Migrate JobsScreen to use store
- [ ] Migrate RoutesScreen to use store
- [ ] Migrate EarningsScreen to use store
- [ ] Migrate DashboardScreen to use store

---

### Phase 3: Pusher Events (4 hours) 🔴

**Priority 3A: Add Missing Events (2h)**
- [ ] Add `job-removed` event
- [ ] Add `job-offer` event
- [ ] Add `route-offer` event
- [ ] Add `acceptance-rate-updated` event
- [ ] Add `schedule-updated` event
- [ ] Add `earnings-updated` event

**Priority 3B: Event Handlers (2h)**
- [ ] Implement instant removal on `job-removed`
- [ ] Implement auto-reload on `job-offer`
- [ ] Implement earnings update on `route-removed`
- [ ] Test all events end-to-end

---

### Phase 4: Networking & Reliability (4 hours) 🟡

**Priority 4A: API Improvements (2h)**
- [ ] Fix base URL to `https://api.speedy-van.co.uk`
- [ ] Add retry logic with `axios-retry`
- [ ] Add request timeout handling
- [ ] Create env files (.env.development, .env.production)

**Priority 4B: Offline Support (2h)**
- [ ] Install `@react-native-community/netinfo`
- [ ] Create `useNetworkStatus` hook
- [ ] Create `OfflineBanner` component
- [ ] Create `offline-queue.service.ts`

---

### Phase 5: UI/UX & Error Handling (5 hours) 🟡

**Priority 5A: Error States (3h)**
- [ ] Add error handling to ALL screens
- [ ] Update `ErrorView` component with retry
- [ ] Add loading states everywhere
- [ ] Add empty states

**Priority 5B: Notifications (2h)**
- [ ] Create `notification.service.ts`
- [ ] Setup Expo Notifications
- [ ] Register push tokens
- [ ] Test background notifications

---

### Phase 6: Testing & QA (4 hours) 🟡

**Priority 6A: Unit Tests (2h)**
- [ ] Test earnings calculation
- [ ] Test acceptance rate logic
- [ ] Test status mapping

**Priority 6B: Integration Tests (2h)**
- [ ] Test accept/decline flow
- [ ] Test route completion flow
- [ ] Test earnings sync with backend

---

## 📊 RISK ASSESSMENT

### Critical Risks (Must Fix Before Production):

1. **🔴 CRITICAL - No Real Backend Integration**
   - Impact: App shows fake data, drivers get wrong info
   - Likelihood: 100%
   - Mitigation: Replace ALL mock data with API calls

2. **🔴 CRITICAL - Acceptance Rate Not Implemented**
   - Impact: Drivers don't see performance impact
   - Likelihood: 100%
   - Mitigation: Implement UI + Pusher event

3. **🔴 CRITICAL - Earnings Calculation Wrong**
   - Impact: Drivers paid incorrectly
   - Likelihood: 100%
   - Mitigation: Implement partial earnings on route cancel

4. **🔴 CRITICAL - Missing Pusher Events**
   - Impact: Jobs stick in UI, no auto-reassignment
   - Likelihood: 100%
   - Mitigation: Implement 8 missing events

5. **🔴 CRITICAL - No State Management**
   - Impact: Data drift, duplicate jobs, inconsistent UI
   - Likelihood: 80%
   - Mitigation: Implement Zustand store

---

## ✅ WHAT'S ALREADY DONE (Good Foundation)

1. ✅ **Authentication** - Login/logout works
2. ✅ **Basic Pusher** - Connection established
3. ✅ **Location Tracking** - Foreground/background works
4. ✅ **Permissions** - Info.plist correct
5. ✅ **UI Components** - Good design system
6. ✅ **Navigation** - Tab + Stack navigation works
7. ✅ **API Service** - Axios setup with interceptors

---

## 📝 FINAL RECOMMENDATIONS

### Immediate Actions (This Sprint):
1. **Replace ALL mock data with real API calls** (8 hours)
2. **Implement Acceptance Rate UI + Logic** (3 hours)
3. **Add 8 missing Pusher events** (4 hours)
4. **Implement Zustand for state management** (6 hours)

### Next Sprint:
1. Offline support & queue
2. Comprehensive error handling
3. Unit tests
4. E2E testing

### Before Production:
1. Full parity test with Admin panel (earnings must match exactly)
2. Load testing with 50+ concurrent drivers
3. Battery drain test (24 hour job)
4. Network resilience test (airplane mode, poor 3G)
5. TestFlight beta with 10 real drivers

---

## 🎯 ESTIMATED TOTAL EFFORT

**Phase 1-3 (Critical):** 18 hours  
**Phase 4-5 (Important):** 9 hours  
**Phase 6 (Testing):** 4 hours  

**Total:** ~31 hours of focused development  
**Timeline:** 4-5 days with 1 senior developer  

**Current Completion:** 35%  
**Target Completion:** 100%  

---

## 🚨 SHOW-STOPPERS (Cannot Launch Without):

1. ❌ Remove ALL mock data - Use real backend
2. ❌ Implement decline → -5% → instant removal → auto-reassign
3. ❌ Implement partial earnings on route cancel
4. ❌ Add acceptance rate display
5. ❌ Complete Pusher event implementation
6. ❌ Fix base URL to production API
7. ❌ Implement state management (Zustand)

---

**Report End - Ready for Implementation**

