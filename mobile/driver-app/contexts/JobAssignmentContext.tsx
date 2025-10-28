import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AppState, AppStateStatus, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { pusherService } from '../services/pusher';
import { PusherEvent } from '../types';
import { notificationService } from '../services/notification';
import { useAuth } from './AuthContext';

interface JobAssignment {
  id: string;
  type: 'route' | 'order';
  reference: string;
  routeNumber?: string;
  from: string;
  to: string;
  additionalStops?: number;
  estimatedEarnings: string;
  date: string;
  time?: string;
  distance?: string | number;
  vehicleType?: string;
  customerName?: string;
  assignedAt: string;
}

interface JobAssignmentContextType {
  pendingAssignment: JobAssignment | null;
  showModal: boolean;
  setShowModal: (show: boolean) => void;
  clearAssignment: () => void;
}

const JobAssignmentContext = createContext<JobAssignmentContextType | undefined>(undefined);

const PENDING_ASSIGNMENT_KEY = '@pending_job_assignment';
const ASSIGNMENT_SOUND_DURATION = 10000; // 10 seconds

export const JobAssignmentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [pendingAssignment, setPendingAssignment] = useState<JobAssignment | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Load pending assignment from storage on mount
  useEffect(() => {
    loadPendingAssignment();
  }, []);

  // Listen for app state changes (background -> foreground)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, []);

  // Set up Pusher listeners when user is authenticated
  useEffect(() => {
    if (!user?.driver?.id) return;

    console.log('🌍 [Global] Initializing Pusher for driver:', user.driver.id);
    pusherService.initialize(user.driver.id);

    // Listen for route-matched event (GLOBAL)
    pusherService.onRouteMatched(async (data: PusherEvent) => {
      console.log('🎯 [Global] ROUTE MATCHED:', data);
      
      const assignment: JobAssignment = {
        id: data.bookingId || data.routeId || data.orderId || data.id || 'unknown',
        type: data.matchType === 'route' ? 'route' : 'order',
        reference: data.bookingReference || data.orderNumber || data.routeNumber || 'N/A',
        routeNumber: data.routeNumber || data.reference,
        from: data.pickupAddress || 'Pickup location',
        to: data.dropoffAddress || 'Drop-off location',
        additionalStops: data.dropsCount ? data.dropsCount - 1 : data.additionalStops || 0,
        estimatedEarnings: data.estimatedEarnings || '£0.00',
        date: data.assignedAt ? new Date(data.assignedAt).toLocaleDateString() : new Date().toLocaleDateString(),
        time: data.scheduledAt ? new Date(data.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined,
        distance: data.distance,
        customerName: data.customerName,
        assignedAt: data.assignedAt || new Date().toISOString(),
      };

      await handleNewAssignment(assignment, data);
    });

    // Listen for job-assigned event (GLOBAL)
    pusherService.onJobAssigned(async (data: PusherEvent) => {
      console.log('📦 [Global] JOB ASSIGNED:', data);
      
      const assignment: JobAssignment = {
        id: data.bookingId || data.orderId || data.id || 'unknown',
        type: 'order',
        reference: data.bookingReference || data.orderNumber || 'N/A',
        from: data.pickupAddress || 'Pickup location',
        to: data.dropoffAddress || 'Drop-off location',
        additionalStops: 0,
        estimatedEarnings: data.estimatedEarnings || '£0.00',
        date: data.assignedAt ? new Date(data.assignedAt).toLocaleDateString() : new Date().toLocaleDateString(),
        time: data.scheduledAt ? new Date(data.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined,
        distance: data.distance,
        customerName: data.customerName,
        assignedAt: data.assignedAt || new Date().toISOString(),
      };

      await handleNewAssignment(assignment, data);
    });

    // Listen for personal job removal (when admin removes THIS driver from a job)
    pusherService.onPersonalJobRemoved(async (data: PusherEvent) => {
      console.log('❌ [Global] PERSONAL JOB REMOVED:', data);
      
      // Clear the modal immediately
      await clearAssignment();
      
      // Show alert to driver
      Alert.alert(
        'Job Removed',
        data.message || 'You have been removed from this job by admin',
        [{ text: 'OK' }]
      );
    });

    return () => {
      console.log('🔌 [Global] Cleaning up Pusher listeners');
      pusherService.unbindAll();
    };
  }, [user?.driver?.id]);

  const handleNewAssignment = async (assignment: JobAssignment, pusherData: PusherEvent) => {
    console.log('🚨 [Global] NEW ASSIGNMENT RECEIVED:', assignment);

    // Save to AsyncStorage immediately
    await savePendingAssignment(assignment);

    // Set state to show modal
    setPendingAssignment(assignment);
    setShowModal(true);

    // Show system notification with sound and vibration
    await notificationService.showJobAssignmentNotification(
      assignment.reference,
      assignment.type,
      assignment.estimatedEarnings
    );

    // Vibrate pattern for attention
    await notificationService.vibratePattern();

    // Play continuous alert sound
    console.log('🔊 [Global] Starting continuous alert sound');
    await notificationService.startRepeatSound();

    // Stop sound after duration
    setTimeout(() => {
      console.log('🔇 [Global] Auto-stopping sound after 10 seconds');
      notificationService.stopRepeatSound();
    }, ASSIGNMENT_SOUND_DURATION);
  };

  const handleAppStateChange = async (nextAppState: AppStateStatus) => {
    if (nextAppState === 'active') {
      console.log('📱 [Global] App became active - checking for pending assignments');
      await loadPendingAssignment();
    }
  };

  const loadPendingAssignment = async () => {
    try {
      const storedAssignment = await AsyncStorage.getItem(PENDING_ASSIGNMENT_KEY);
      if (storedAssignment) {
        const assignment = JSON.parse(storedAssignment);
        console.log('📂 [Global] Loaded pending assignment from storage:', assignment);
        
        // Check if assignment is not expired (within 30 minutes)
        const assignedAt = new Date(assignment.assignedAt);
        const now = new Date();
        const minutesElapsed = (now.getTime() - assignedAt.getTime()) / 1000 / 60;
        
        if (minutesElapsed < 30) {
          setPendingAssignment(assignment);
          setShowModal(true);
          console.log('✅ [Global] Showing pending assignment modal');
        } else {
          console.log('⏰ [Global] Assignment expired - clearing');
          await clearAssignment();
        }
      }
    } catch (error) {
      console.error('❌ [Global] Error loading pending assignment:', error);
    }
  };

  const savePendingAssignment = async (assignment: JobAssignment) => {
    try {
      await AsyncStorage.setItem(PENDING_ASSIGNMENT_KEY, JSON.stringify(assignment));
      console.log('💾 [Global] Saved pending assignment to storage');
    } catch (error) {
      console.error('❌ [Global] Error saving pending assignment:', error);
    }
  };

  const clearAssignment = async () => {
    try {
      await AsyncStorage.removeItem(PENDING_ASSIGNMENT_KEY);
      setPendingAssignment(null);
      setShowModal(false);
      notificationService.stopRepeatSound();
      console.log('🗑️ [Global] Cleared pending assignment');
    } catch (error) {
      console.error('❌ [Global] Error clearing pending assignment:', error);
    }
  };

  return (
    <JobAssignmentContext.Provider
      value={{
        pendingAssignment,
        showModal,
        setShowModal,
        clearAssignment,
      }}
    >
      {children}
    </JobAssignmentContext.Provider>
  );
};

export const useJobAssignment = () => {
  const context = useContext(JobAssignmentContext);
  if (context === undefined) {
    throw new Error('useJobAssignment must be used within a JobAssignmentProvider');
  }
  return context;
};

