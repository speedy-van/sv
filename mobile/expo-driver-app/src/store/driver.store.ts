import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  Job, 
  DriverPerformance, 
  Earning, 
  EarningsSummary,
  DriverStats 
} from '../types';

interface Route {
  id: string;
  status: string;
  drops: any[];
  estimatedDuration: number;
  estimatedDistance: number;
  estimatedEarnings: number;
  completedDrops?: number;
  totalDrops?: number;
}

interface DriverState {
  // Driver Info
  driverId: string | null;
  acceptanceRate: number;
  performance: DriverPerformance | null;
  stats: DriverStats | null;
  
  // Jobs
  jobs: Job[];
  activeJobs: Job[];
  
  // Routes
  routes: Route[];
  activeRoute: Route | null;
  
  // Earnings
  earnings: Earning[];
  earningsSummary: EarningsSummary | null;
  
  // Processed Events (for deduplication)
  processedEventIds: Set<string>;
  
  // Actions - Driver
  setDriverId: (id: string) => void;
  setAcceptanceRate: (rate: number) => void;
  decreaseAcceptanceRate: () => void;
  setPerformance: (performance: DriverPerformance) => void;
  setStats: (stats: DriverStats) => void;
  
  // Actions - Jobs
  setJobs: (jobs: Job[]) => void;
  addJob: (job: Job) => void;
  removeJob: (jobId: string) => void;
  updateJob: (jobId: string, updates: Partial<Job>) => void;
  acceptJob: (jobId: string) => void;
  declineJob: (jobId: string) => void;
  
  // Actions - Routes
  setRoutes: (routes: Route[]) => void;
  addRoute: (route: Route) => void;
  removeRoute: (routeId: string) => void;
  updateRoute: (routeId: string, updates: Partial<Route>) => void;
  setActiveRoute: (route: Route | null) => void;
  acceptRoute: (routeId: string) => void;
  declineRoute: (routeId: string) => void;
  
  // Actions - Earnings
  setEarnings: (earnings: Earning[]) => void;
  addEarning: (earning: Earning) => void;
  updateEarning: (earningId: string, amountPence: number, partial?: boolean) => void;
  setEarningsSummary: (summary: EarningsSummary) => void;
  
  // Event Processing
  processEvent: (eventId: string, handler: () => void) => boolean;
  
  // Reset
  reset: () => void;
}

export const useDriverStore = create<DriverState>()(
  persist(
    (set, get) => ({
      // Initial State
      driverId: null,
      acceptanceRate: 100,
      performance: null,
      stats: null,
      jobs: [],
      activeJobs: [],
      routes: [],
      activeRoute: null,
      earnings: [],
      earningsSummary: null,
      processedEventIds: new Set(),
      
      // Driver Actions
      setDriverId: (id) => set({ driverId: id }),
      
      setAcceptanceRate: (rate) => set({ 
        acceptanceRate: Math.max(0, Math.min(100, rate)) 
      }),
      
      decreaseAcceptanceRate: () => set((state) => ({ 
        acceptanceRate: Math.max(0, state.acceptanceRate - 5) 
      })),
      
      setPerformance: (performance) => set({ performance }),
      setStats: (stats) => set({ stats }),
      
      // Job Actions
      setJobs: (jobs) => set({ jobs }),
      
      addJob: (job) => set((state) => {
        // Prevent duplicates
        const exists = state.jobs.some(j => j.id === job.id);
        if (exists) {
          console.log('⚠️ Job already exists, skipping:', job.id);
          return state;
        }
        return { jobs: [...state.jobs, job] };
      }),
      
      removeJob: (jobId) => set((state) => ({
        jobs: state.jobs.filter(j => j.id !== jobId),
        activeJobs: state.activeJobs.filter(j => j.id !== jobId)
      })),
      
      updateJob: (jobId, updates) => set((state) => ({
        jobs: state.jobs.map(j => j.id === jobId ? { ...j, ...updates } : j),
        activeJobs: state.activeJobs.map(j => j.id === jobId ? { ...j, ...updates } : j)
      })),
      
      acceptJob: (jobId) => set((state) => ({
        jobs: state.jobs.map(j => 
          j.id === jobId ? { ...j, status: 'accepted' as any } : j
        ),
        activeJobs: [...state.activeJobs, state.jobs.find(j => j.id === jobId)!].filter(Boolean)
      })),
      
      declineJob: (jobId) => set((state) => ({
        jobs: state.jobs.filter(j => j.id !== jobId),
        activeJobs: state.activeJobs.filter(j => j.id !== jobId),
        acceptanceRate: Math.max(0, state.acceptanceRate - 5)
      })),
      
      // Route Actions
      setRoutes: (routes) => set({ routes }),
      
      addRoute: (route) => set((state) => {
        // Prevent duplicates
        const exists = state.routes.some(r => r.id === route.id);
        if (exists) {
          console.log('⚠️ Route already exists, skipping:', route.id);
          return state;
        }
        return { routes: [...state.routes, route] };
      }),
      
      removeRoute: (routeId) => set((state) => ({
        routes: state.routes.filter(r => r.id !== routeId),
        activeRoute: state.activeRoute?.id === routeId ? null : state.activeRoute
      })),
      
      updateRoute: (routeId, updates) => set((state) => ({
        routes: state.routes.map(r => r.id === routeId ? { ...r, ...updates } : r),
        activeRoute: state.activeRoute?.id === routeId 
          ? { ...state.activeRoute, ...updates } 
          : state.activeRoute
      })),
      
      setActiveRoute: (route) => set({ activeRoute: route }),
      
      acceptRoute: (routeId) => set((state) => ({
        routes: state.routes.map(r => 
          r.id === routeId ? { ...r, status: 'accepted' } : r
        ),
        activeRoute: state.routes.find(r => r.id === routeId) || null
      })),
      
      declineRoute: (routeId) => set((state) => ({
        routes: state.routes.filter(r => r.id !== routeId),
        activeRoute: state.activeRoute?.id === routeId ? null : state.activeRoute,
        acceptanceRate: Math.max(0, state.acceptanceRate - 5)
      })),
      
      // Earnings Actions
      setEarnings: (earnings) => set({ earnings }),
      
      addEarning: (earning) => set((state) => {
        const exists = state.earnings.some(e => e.id === earning.id);
        if (exists) return state;
        return { earnings: [...state.earnings, earning] };
      }),
      
      updateEarning: (earningId, amountPence, partial = false) => set((state) => ({
        earnings: state.earnings.map(e => 
          e.id === earningId 
            ? { ...e, totalEarningsPence: amountPence, wasPartial: partial }
            : e
        )
      })),
      
      setEarningsSummary: (summary) => set({ earningsSummary: summary }),
      
      // Event Processing (Deduplication)
      processEvent: (eventId, handler) => {
        if (get().processedEventIds.has(eventId)) {
          console.log('⚠️ Duplicate event ignored:', eventId);
          return false;
        }
        
        // Add to processed events
        const newProcessedEvents = new Set(get().processedEventIds);
        newProcessedEvents.add(eventId);
        
        // Keep only last 1000 events to prevent memory leak
        if (newProcessedEvents.size > 1000) {
          const arr = Array.from(newProcessedEvents);
          set({ processedEventIds: new Set(arr.slice(-1000)) });
        } else {
          set({ processedEventIds: newProcessedEvents });
        }
        
        // Execute handler
        handler();
        return true;
      },
      
      // Reset (on logout)
      reset: () => set({
        driverId: null,
        acceptanceRate: 100,
        performance: null,
        stats: null,
        jobs: [],
        activeJobs: [],
        routes: [],
        activeRoute: null,
        earnings: [],
        earningsSummary: null,
        processedEventIds: new Set(),
      }),
    }),
    {
      name: 'driver-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Don't persist processed events
      partialize: (state) => ({
        driverId: state.driverId,
        acceptanceRate: state.acceptanceRate,
        performance: state.performance,
        stats: state.stats,
      }),
    }
  )
);

