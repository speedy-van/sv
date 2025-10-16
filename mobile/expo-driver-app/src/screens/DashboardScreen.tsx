import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Switch,
  TouchableOpacity,
  Alert,
  StatusBar,
} from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import RouteSearchingIndicator from '../components/RouteSearchingIndicator';
import RouteMatchModal from '../components/RouteMatchModal';
import AcceptanceRateIndicator from '../components/AcceptanceRateIndicator';
import audioService from '../services/audio.service';
import apiService from '../services/api.service';
import pusherService from '../services/pusher.service';
import permissionMonitor from '../services/permission-monitor.service';
import { API_ENDPOINTS } from '../config/api';
import { getUser, saveUser, savePendingOffer, getPendingOffers, removePendingOffer, PendingOffer } from '../services/storage.service';
import PermissionWarningModal from '../components/PermissionWarningModal';
import { Linking } from 'react-native';
import { colors } from '../theme/colors';
import { showToast } from '../utils/toast';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface DriverStats {
  totalJobs: number;
  completedJobs: number;
  earnings: number;
  rating: number;
}

interface AvailableRouteItem {
  id: string;
  type: 'route' | 'job';
  title: string;
  location: string;
  earnings: number;
  distance: string;
  duration: string;
  stops: number;
  workers: number;
  hasCameras: boolean;
}

export default function DashboardScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [isOnline, setIsOnline] = useState(true);
  const locationAlertShownRef = useRef(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasNewRoute, setHasNewRoute] = useState(false);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [newRouteCount, setNewRouteCount] = useState(0);
  const previousRoutesCount = useRef(-1); // Start with -1 to detect first load
  const isFirstLoad = useRef(true);
  const [stats, setStats] = useState<DriverStats>({
    totalJobs: 12,
    completedJobs: 8,
    earnings: 1245.50,
    rating: 4.8,
  });
  const [acceptanceRate, setAcceptanceRate] = useState<number>(100);
  const [currentPendingOffer, setCurrentPendingOffer] = useState<PendingOffer | null>(null);
  
  // Permission monitoring state
  const [showPermissionWarning, setShowPermissionWarning] = useState(false);
  const [permissionWarningJob, setPermissionWarningJob] = useState<any>(null);
  const [permissionRemainingMinutes, setPermissionRemainingMinutes] = useState(5);
  const [missingPermissions, setMissingPermissions] = useState({
    location: false,
    notifications: false,
  });

  const [recentRoutes, setRecentRoutes] = useState([
    {
      id: 'route_001',
      title: 'Route #001 - 5 Stops',
      location: 'Glasgow',
      earnings: 125.50,
      distance: '25.5 miles',
      duration: '3h 0m',
      status: 'completed',
      completedAt: '2024-01-15',
    },
    {
      id: 'route_002',
      title: 'Route #002 - 3 Stops',
      location: 'Edinburgh',
      earnings: 85.75,
      distance: '18.2 miles',
      duration: '2h 30m',
      status: 'completed',
      completedAt: '2024-01-14',
    },
    {
      id: 'route_003',
      title: 'Route #003 - 4 Stops',
      location: 'Glasgow',
      earnings: 95.25,
      distance: '22.1 miles',
      duration: '2h 45m',
      status: 'pending',
      completedAt: null,
    },
  ]);

  const [availableRoutes, setAvailableRoutes] = useState([
    {
      id: 'route_004',
      title: 'Route #004 - 6 Stops',
      location: 'Glasgow',
      earnings: 110.00,
      distance: '28.7 miles',
      duration: '3h 30m',
      stops: 6,
      workers: 1,
      hasCameras: false,
    },
    {
      id: 'route_005',
      title: 'Route #005 - 2 Stops',
      location: 'Edinburgh',
      earnings: 75.00,
      distance: '15.3 miles',
      duration: '2h 0m',
      stops: 2,
      workers: 1,
      hasCameras: true,
    },
  ]);

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      // Mock data for now to avoid 401 errors
      setStats({
        totalJobs: 12,
        completedJobs: 8,
        earnings: 245.50,
        rating: 4.8,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      // Set default stats on error
      setStats({
        totalJobs: 0,
        completedJobs: 0,
        earnings: 0,
        rating: 0,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch acceptance rate from API
  const fetchAcceptanceRate = async () => {
    try {
      const response = await apiService.get<any>('/api/driver/performance');
      if (response?.success && response?.data?.acceptanceRate !== undefined) {
        setAcceptanceRate(response.data.acceptanceRate);
        console.log('✅ Acceptance rate loaded:', response.data.acceptanceRate);
      }
    } catch (error) {
      console.error('❌ Error fetching acceptance rate:', error);
      // Keep default 100%
    }
  };

  // Restore pending offers on app start
  const restorePendingOffers = async () => {
    try {
      console.log('🔍 Checking for pending offers in storage...');
      const offers = await getPendingOffers();
      
      if (offers.length > 0) {
        const latestOffer = offers[0];
        console.log('📌 Restored pending offer:', latestOffer.id);
        console.log('⏰ Offer expires at:', latestOffer.expiresAt);
        
        setCurrentPendingOffer(latestOffer);
        setShowMatchModal(true);
        setNewRouteCount(latestOffer.jobCount);
        
        // Play notification sound
        audioService.playRouteMatchSound();
      } else {
        console.log('ℹ️  No pending offers found in storage');
      }
    } catch (error) {
      console.error('❌ Error restoring pending offers:', error);
    }
  };

  // Check internet connection
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const connected = state.isConnected && state.isInternetReachable !== false;
      setIsOnline(connected);
      
      if (!connected) {
        showToast.error(
          'No internet connection. Please check your network settings and try again.',
          'Connection Lost'
        );
        console.log('❌ Internet connection lost');
      } else {
        console.log('✅ Internet connection restored');
        // Refresh data when connection is restored
        fetchStats();
        fetchAvailableRoutes();
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    fetchStats();
    fetchAcceptanceRate();
    restorePendingOffers();
    
    // Initialize audio service
    audioService.initialize();

    // Initialize Permission Monitor
    const initializePermissionMonitor = async () => {
      try {
        console.log('🔐 Initializing Permission Monitor...');
        
        // Set up callbacks
        permissionMonitor.onPermissionChange((status) => {
          console.log('📱 Permission status changed:', status);
          
          // Update missing permissions
          setMissingPermissions({
            location: !status.location,
            notifications: !status.notifications,
          });
          
          // Update online status based on permissions
          if (!status.location || !status.notifications) {
            console.log('⚠️ Permissions disabled - forcing offline');
            setIsOnline(false);
          }
          // Show alert only once per lost location permission
          if (!status.location && !locationAlertShownRef.current) {
            locationAlertShownRef.current = true;
            Alert.alert(
              'Location Access Needed',
              'Speedy Van needs access to your location to show nearby drivers and deliver jobs.',
              [{ text: 'Continue', onPress: () => { locationAlertShownRef.current = false; } }]
            );
          }
        });

        permissionMonitor.onWarning((job, remainingMinutes) => {
          console.log(`⚠️ Permission warning for job ${job.reference}: ${remainingMinutes} minutes remaining`);
          
          // Update warning modal state
          setPermissionWarningJob(job);
          setPermissionRemainingMinutes(remainingMinutes);
          setShowPermissionWarning(true);
        });

        // Start monitoring
        await permissionMonitor.startMonitoring();
        console.log('✅ Permission Monitor initialized');
      } catch (error) {
        console.error('❌ Failed to initialize Permission Monitor:', error);
      }
    };

    initializePermissionMonitor();

    // Initialize Pusher for real-time updates
    const initializePusher = async () => {
      try {
        // Get driver ID from storage
        let user = await getUser();
        
        // ✅ CRITICAL FIX: If driver relation is missing, refetch profile from API
        if (!user?.driver?.id) {
          console.warn('⚠️  Driver ID not found in cached user. Fetching fresh profile from API...');
          
          try {
            const profileResponse = await apiService.get<any>('/api/driver/profile');
            
            if (profileResponse?.driver?.id) {
              console.log('✅ Profile fetched successfully with driver ID:', profileResponse.driver.id);
              
              // Update user object with driver relation
              const updatedUser = {
                ...user,
                ...profileResponse,
              };
              
              // Save updated user to storage
              await saveUser(updatedUser);
              user = updatedUser;
              
              console.log('💾 Updated user cached with driver relation');
            } else {
              console.error('❌ API response does not include driver relation');
              Alert.alert(
                'Profile Error',
                'Your driver profile could not be loaded. Please contact support.',
                [{ text: 'Continue' }]
              );
              return;
            }
          } catch (error) {
            console.error('❌ Failed to fetch profile:', error);
            Alert.alert(
              'Connection Error',
              'Unable to load your driver profile. Please check your connection and try again.',
              [{ text: 'Continue' }]
            );
            return;
          }
        }
        
        const driverId = user.driver?.id;
        
        if (!driverId) {
          console.error('❌ Driver ID still not found after refetch. This should not happen.');
          Alert.alert(
            'Account Error',
            'Your driver account is not properly configured. Please contact support.',
            [{ text: 'Continue' }]
          );
          return;
        }
        
        console.log('🔌 Initializing Pusher for driver:', driverId);
        await pusherService.initialize(driverId);

        // Listen for route-matched events
        pusherService.addEventListener('route-matched', (data: any) => {
          console.log('🎯 ROUTE MATCHED EVENT RECEIVED IN DASHBOARD:', data);

          // Determine route count based on event data
          let routeCount = 1; // default
          if (data.type === 'single-order') {
            routeCount = 1;
          } else if (data.jobCount) {
            routeCount = data.jobCount;
          } else if (data.routeCount) {
            routeCount = data.routeCount;
          }

          // Create pending offer object
          const pendingOffer: PendingOffer = {
            id: data.assignmentId || data.bookingId || `offer_${Date.now()}`,
            bookingId: data.bookingId || data.orderId,
            orderId: data.orderId || data.bookingId,
            bookingReference: data.bookingReference || data.orderNumber || data.routeNumber || 'N/A',
            orderNumber: data.orderNumber || data.routeNumber || data.bookingReference || 'N/A',
            routeNumber: data.routeNumber || data.orderNumber || 'N/A', // ✅ Add routeNumber
            matchType: data.matchType || (data.type === 'single-order' ? 'order' : 'route'),
            jobCount: routeCount,
            assignmentId: data.assignmentId || data.bookingId,
            assignedAt: data.assignedAt || new Date().toISOString(),
            expiresAt: data.expiresAt || new Date(Date.now() + 30 * 60 * 1000).toISOString(),
            pickupAddress: data.pickupAddress,
            dropoffAddress: data.dropoffAddress,
            estimatedEarnings: data.estimatedEarnings,
            distance: data.distance,
            customerName: data.customerName,
            receivedAt: new Date().toISOString(),
          };

          // Save pending offer to storage for persistence
          savePendingOffer(pendingOffer).catch(err => {
            console.error('❌ Failed to save pending offer:', err);
          });

          // Set current pending offer in state
          setCurrentPendingOffer(pendingOffer);

          // Trigger route match notification IMMEDIATELY
          setHasNewRoute(true);
          setNewRouteCount(routeCount);
          setShowMatchModal(true);

          // Refresh available routes with delay to avoid immediate API conflicts
          setTimeout(() => {
            fetchAvailableRoutes().catch(err => {
              console.error('❌ Failed to refresh routes after Pusher event:', err);
              // Don't show error to user, just log it
            });
          }, 2000); // Wait 2 seconds before refreshing
        });
        
        // Listen for job-assigned events (backward compatibility)
        pusherService.addEventListener('job-assigned', (data: any) => {
          console.log('📦 JOB ASSIGNED via Pusher:', data);
          
          // Refresh available routes
          fetchAvailableRoutes();
        });

        // Listen for route-removed events
        pusherService.addEventListener('route-removed', (data: any) => {
          console.log('❌ ROUTE REMOVED via Pusher:', data);
          
          // Refresh available routes
          fetchAvailableRoutes();
          
          // Show alert
          Alert.alert(
            'Route Removed',
            data.reason || 'A route has been removed from your assignments',
            [{ text: 'Continue' }]
          );
        });

        // Listen for acceptance-rate-updated events
        pusherService.addEventListener('acceptance-rate-updated', (data: any) => {
          console.log('📉 ACCEPTANCE RATE UPDATED via Pusher:', data);
          
          if (data.acceptanceRate !== undefined) {
            setAcceptanceRate(data.acceptanceRate);
            console.log(`✅ Updated acceptance rate: ${data.acceptanceRate}% (${data.change}%)`);
            
            // Show alert for significant changes
            if (data.change && data.change < 0) {
              Alert.alert(
                'Performance Update',
                `Your acceptance rate has decreased to ${data.acceptanceRate}%\nReason: ${data.reason === 'job_declined' ? 'Job declined' : 'Assignment expired'}`,
                [{ text: 'Continue' }]
              );
            }
          }
        });

        // Listen for route-cancelled events (admin cancelled route)
        pusherService.addEventListener('route-cancelled', (data: any) => {
          console.log('🚫 ROUTE CANCELLED by Admin:', data);
          
          // Refresh available routes
          fetchAvailableRoutes();
          
          // Show notification
          showToast.error(
            data.message || `Route ${data.routeNumber || data.routeId} has been cancelled by admin`,
            'Route Cancelled'
          );
        });

        // Listen for drop-removed events (admin removed drop from route)
        pusherService.addEventListener('drop-removed', (data: any) => {
          console.log('📦 DROP REMOVED by Admin:', data);
          
          // Refresh available routes to update route details
          fetchAvailableRoutes();
          
          // Show notification
          showToast.info(
            `A drop has been removed from route ${data.routeNumber || data.routeId}. ${data.remainingDrops || 0} drops remaining.`,
            'Route Updated'
          );
        });

        // Listen for job-removed events (for expired/declined jobs)
        pusherService.addEventListener('job-removed', (data: any) => {
          console.log('🗑️ JOB REMOVED via Pusher:', data);
          
          // Remove from pending offers
          if (data.assignmentId || data.jobId) {
            removePendingOffer(data.assignmentId || data.jobId).catch(err => {
              console.error('❌ Failed to remove pending offer:', err);
            });
          }
          
          // Close modal if showing
          setShowMatchModal(false);
          setCurrentPendingOffer(null);
          
          // Refresh available routes
          fetchAvailableRoutes();
        });
      } catch (error) {
        console.error('❌ Failed to initialize Pusher:', error);
      }
    };

    initializePusher();

    // Fetch routes immediately when online
    if (isOnline) {
      fetchAvailableRoutes();
    }

    // Poll for new routes every 30 seconds when online (reduced frequency since we have Pusher)
    const pollInterval = setInterval(() => {
      if (isOnline) {
        console.log('⏰ Polling interval triggered - checking for new routes...');
        fetchAvailableRoutes();
      } else {
        console.log('⏸️  Polling skipped - driver is offline');
      }
    }, 30000); // Increased to 30 seconds since we have real-time updates

    return () => {
      // Cleanup
      audioService.cleanup();
      pusherService.disconnect();
      permissionMonitor.stopMonitoring();
      clearInterval(pollInterval);
      console.log('🧹 Dashboard unmounted - services stopped');
    };
  }, [isOnline]);

  const fetchAvailableRoutes = async (retryCount = 0) => {
    const fetchStart = Date.now();
    const maxRetries = 3;

    try {
      console.log(`🔄 Fetching available routes AND jobs... (attempt ${retryCount + 1}/${maxRetries + 1})`);

      // Fetch both routes and individual jobs in parallel
      const [routesResponse, jobsResponse] = await Promise.all([
        apiService.get<{ success: boolean; routes: any[]; totalRoutes: number }>('/api/driver/routes').catch(err => {
          console.error('Routes API error:', err?.message);
          return { success: false, routes: [], totalRoutes: 0 };
        }),
        apiService.get<{ success: boolean; jobs?: any[]; data?: { jobs?: any[] } }>('/api/driver/jobs').catch(err => {
          console.error('Jobs API error:', err?.message);
          return { success: false, jobs: [], data: { jobs: [] } };
        })
      ]);

      const fetchDuration = Date.now() - fetchStart;
      console.log(`✅ Data fetched in ${fetchDuration}ms`);

      // Check if both requests failed (likely due to timeout)
      const routesFailed = !routesResponse?.success;
      const jobsFailed = !jobsResponse?.success && !jobsResponse?.jobs && !jobsResponse?.data?.jobs;

      if (routesFailed && jobsFailed && retryCount < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, retryCount), 5000); // Exponential backoff, max 5 seconds
        console.log(`⏳ Both API calls failed, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return fetchAvailableRoutes(retryCount + 1);
      }

      // Process routes
      let allAvailableItems: AvailableRouteItem[] = [];
      
      if (routesResponse && routesResponse.routes) {
        const plannedRoutes = routesResponse.routes.filter((r: any) => r.status === 'planned');
        console.log(`📊 Found ${plannedRoutes.length} planned routes`);
        
        allAvailableItems = plannedRoutes.map((route: any): AvailableRouteItem => ({
          id: route.id,
          type: 'route' as const,
          title: `Route #${route.id.slice(-3)} - ${route.drops?.length || 0} Stops`,
          location: route.drops?.[0]?.deliveryAddress?.split(',')[1]?.trim() || 'Unknown',
          earnings: route.estimatedEarnings || 0,
          distance: `${route.estimatedDuration || 0} miles`,
          duration: `${Math.floor((route.estimatedDuration || 0) / 60)}h ${(route.estimatedDuration || 0) % 60}m`,
          stops: route.drops?.length || 0,
          workers: route.totalWorkers || 1,
          hasCameras: route.hasCameras || false,
        }));
      }
      
      // Process individual jobs
      if (jobsResponse && (jobsResponse.jobs || jobsResponse.data?.jobs)) {
        const jobs = jobsResponse.jobs || jobsResponse.data?.jobs || [];
        const availableJobs = jobs.filter((j: any) => j.status === 'available' || j.status === 'invited');
        console.log(`📦 Found ${availableJobs.length} available jobs`);
        
        const jobItems: AvailableRouteItem[] = availableJobs.map((job: any) => ({
          id: job.id,
          type: 'job' as const,
          title: `Job #${job.reference || job.id.slice(-8)}`,
          location: job.to || job.from || 'Unknown',
          earnings: job.estimatedEarnings || 0,
          distance: job.distance || '0 miles',
          duration: job.duration || '0h 0m',
          stops: 1,
          workers: 1,
          hasCameras: false,
        }));
        
        allAvailableItems = [...allAvailableItems, ...jobItems];
      }
      
      console.log(`📊 Total available items: ${allAvailableItems.length} (routes + jobs)`);
      setAvailableRoutes(allAvailableItems);
      
    } catch (error: any) {
      const fetchDuration = Date.now() - fetchStart;
      console.error(`❌ Error fetching data after ${fetchDuration}ms:`, error?.message || error);
      setAvailableRoutes([]);
    }
  };

  // Monitor available routes for new matches (only when online)
  useEffect(() => {
    console.log('🔍 Route monitor triggered:', {
      isOnline,
      currentCount: availableRoutes.length,
      previousCount: previousRoutesCount.current,
    });

    if (!isOnline) {
      console.log('⏸️  Monitoring paused - driver offline');
      setHasNewRoute(false);
      return;
    }

    const currentRoutesCount = availableRoutes.length;

    // Skip notification on first load
    if (isFirstLoad.current) {
      console.log('ℹ️  First load - initializing route count');
      previousRoutesCount.current = currentRoutesCount;
      isFirstLoad.current = false;
      return;
    }

    // Check if new routes were added
    if (currentRoutesCount > previousRoutesCount.current) {
      const newRoutesAdded = currentRoutesCount - previousRoutesCount.current;
      console.log(`🎯🎯🎯 ${newRoutesAdded} NEW ROUTE(S) MATCHED! 🎯🎯🎯`);
      console.log('📋 New route details:', availableRoutes.slice(-newRoutesAdded));
      
      console.log('🚀 TRIGGERING ROUTE MATCH NOTIFICATION...');
      
      setHasNewRoute(true);
      setNewRouteCount(newRoutesAdded);
      
      // Play notification sound first (synchronized with modal)
      console.log('🎵🎵🎵 PLAYING NOTIFICATION SOUND...');
      audioService.playRouteMatchSound();
      
      // Show enhanced modal
      console.log('💫💫💫 SHOWING MATCH MODAL...');
      setShowMatchModal(true);

      // Reset flag after 5 seconds
      setTimeout(() => {
        console.log('⏰ Resetting hasNewRoute flag');
        setHasNewRoute(false);
      }, 5000);
      
    } else if (currentRoutesCount < previousRoutesCount.current) {
      console.log('📉 Routes decreased (accepted/declined)');
    } else {
      console.log('➡️  No change in routes count');
    }

    previousRoutesCount.current = currentRoutesCount;
  }, [availableRoutes, isOnline]);

  const handleOnlineToggle = async (value: boolean) => {
    if (value) {
      // Check permissions before going online
      const canBeOnline = permissionMonitor.canBeOnline();
      
      if (!canBeOnline) {
        const status = permissionMonitor.getStatus();
        const missingPerms = [];
        
        if (!status.location) missingPerms.push('Location Services');
        if (!status.notifications) missingPerms.push('Push Notifications');
        
        Alert.alert(
          'Permissions Required',
          `You need to enable the following permissions to go online:\n\n${missingPerms.join('\n')}\n\nPlease enable them in Settings.`,
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Open Settings', 
              onPress: () => Linking.openSettings() 
            }
          ]
        );
        return;
      }
      
      setIsOnline(true);
      showToast.success('Status Updated', 'You are now online and available for new routes.');
      
      // Update driver status via API
      try {
        await apiService.post('/api/driver/status', {
          isOnline: true,
          reason: 'manual_online',
        });
      } catch (error) {
        console.error('Failed to update online status:', error);
      }
    } else {
      setIsOnline(false);
      showToast.info('Status Updated', 'You are now offline. You will not receive new routes until you go back online.');
      
      // Update driver status via API
      try {
        await apiService.post('/api/driver/status', {
          isOnline: false,
          reason: 'manual_offline',
        });
      } catch (error) {
        console.error('Failed to update offline status:', error);
      }
    }
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'View Routes':
        Alert.alert('Available Routes', 'You have 2 new routes available:\n\nRoute #001 - 5 Stops\n• £125.50 earnings\n• 25.5 miles\n• 3h 0m duration\n\nRoute #002 - 3 Stops\n• £85.75 earnings\n• 18.2 miles\n• 2h 30m duration\n\nTap Routes tab to view and accept.');
        break;
      case 'Earnings':
        navigation.navigate('Earnings');
        break;
      case 'Profile':
        Alert.alert('Profile Status', 'Your profile is complete and approved:\n\n✅ Driver License: Valid\n✅ Insurance: Current\n✅ Background Check: Approved\n✅ Vehicle: Registered\n\nAll documents are up to date.');
        break;
      case 'Settings':
        Alert.alert('Settings', 'Quick Settings:\n\n• Notifications: ON\n• Location: ON\n• Offline Mode: OFF\n• Auto-accept: OFF\n\nTap to access full settings.');
        break;
      default:
        Alert.alert('Quick Action', 'Action completed successfully!');
    }
  };

  const handleViewNow = () => {
    console.log('📱 User tapped View Now');
    
    // Stop the music immediately
    audioService.stopSound();

    // CRITICAL FIX: Close the modal immediately when View Now is tapped
    setShowMatchModal(false);
    setCurrentPendingOffer(null);
    setHasNewRoute(false);

    if (!currentPendingOffer?.bookingId) {
      console.error('❌ No booking ID available');
      Alert.alert('Error', 'Cannot view job - booking ID not found');
      return;
    }

    // Navigate to JobDetail screen with the booking ID
    console.log('📱 Navigating to JobDetail screen for booking:', currentPendingOffer.bookingId);
    (navigation.navigate as any)('JobDetail', { jobId: currentPendingOffer.bookingId });
  };  const handleDecline = async () => {
    console.log('❌ Driver declined job from popup');
    
    // Stop the music when declining
    audioService.stopSound();

    if (!currentPendingOffer?.bookingId) {
      console.error('❌ No bookingId available for decline');
      Alert.alert('Error', 'Cannot decline - job ID not found');
      return;
    }

    const jobId = currentPendingOffer.bookingId;

    try {
      // Show loading state
      Alert.alert('Declining...', 'Please wait', []);

      // Call decline API
      console.log('📞 Calling decline API for job:', jobId);
      const response = await apiService.post<any>(
        `/api/driver/jobs/${jobId}/decline`,
        { reason: 'Declined from popup' }
      );

      console.log('✅ Decline response:', response);

      // Remove from storage
      if (currentPendingOffer?.id) {
        await removePendingOffer(currentPendingOffer.id);
      }

      // Update acceptance rate if returned
      if (response?.acceptanceRate !== undefined) {
        setAcceptanceRate(response.acceptanceRate);
        console.log(`✅ Updated acceptance rate: ${response.acceptanceRate}%`);
      }

      // Close modal
      setShowMatchModal(false);
      setCurrentPendingOffer(null);
      setHasNewRoute(false);
      setNewRouteCount(0);

      // Refresh routes
      fetchAvailableRoutes();

      // Show success toast
      showToast.info('Job Declined', `Your acceptance rate is now ${response?.acceptanceRate || acceptanceRate}%. The job has been offered to another driver.`);

    } catch (error: any) {
      console.error('❌ Error declining job:', error);
      
      // Close modal anyway
      setShowMatchModal(false);
      
      showToast.error('Decline Failed', error?.message || 'Failed to decline job. Please try again.');
    }
  };

  // Permission Warning Modal handlers
  const handlePermissionWarningDismiss = () => {
    console.log('ℹ️ User dismissed permission warning');
    setShowPermissionWarning(false);
  };

  const handleOpenPermissionSettings = async () => {
    console.log('⚙️ Opening settings for permissions');
    try {
      await Linking.openSettings();
      setShowPermissionWarning(false);
    } catch (error) {
      console.error('❌ Failed to open settings:', error);
      Alert.alert('Error', 'Could not open settings. Please open Settings app manually.');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background.primary} />
      
      {/* No Internet Overlay */}
      {!isOnline && (
        <View style={styles.offlineOverlay}>
          <View style={styles.offlineCard}>
            <Ionicons name="cloud-offline" size={80} color={colors.error} />
            <Text style={styles.offlineTitle}>No Internet Connection</Text>
            <Text style={styles.offlineMessage}>
              Please check your network settings and try again.
              The app requires an active internet connection to function.
            </Text>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={async () => {
                const state = await NetInfo.fetch();
                const connected = state.isConnected && state.isInternetReachable !== false;
                if (connected) {
                  setIsOnline(true);
                  showToast.success('Connection restored', 'You are back online');
                  fetchStats();
                  fetchAvailableRoutes();
                } else {
                  showToast.error('Still offline', 'Please check your internet connection');
                }
              }}
            >
              <Text style={styles.retryButtonText}>Retry Connection</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={fetchStats} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Dashboard</Text>
          <Text style={styles.subtitle}>Welcome back, Driver!</Text>
        </View>

        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <View style={styles.statusIndicator}>
              <View style={[styles.statusDot, isOnline && styles.statusDotOnline]} />
              <View style={styles.statusTextContainer}>
                <Text style={styles.statusText}>
                  {isOnline ? 'Online' : 'Offline'}
                </Text>
                <Text style={styles.statusSubtext}>
                  {isOnline ? 'Ready for new jobs' : 'Not accepting jobs'}
                </Text>
              </View>
            </View>
            <Switch
              value={isOnline}
              onValueChange={handleOnlineToggle}
              trackColor={{ false: '#E5E7EB', true: '#3B82F6' }}
              thumbColor={isOnline ? '#FFFFFF' : '#9CA3AF'}
            />
          </View>
        </View>

        {/* Route Searching Indicator */}
        <RouteSearchingIndicator 
          isOnline={isOnline}
          showOfflineMessage={!isOnline}
          message={
            !isOnline 
              ? undefined 
              : hasNewRoute
                ? "🎉 New route matched! Check your routes."
                : availableRoutes.length > 0 
                  ? `${availableRoutes.length} route${availableRoutes.length > 1 ? 's' : ''} available - Ready to start!` 
                  : undefined
          }
        />

        {/* Acceptance Rate Indicator - Shows immediately after decline/expiry */}
        <AcceptanceRateIndicator 
          rate={acceptanceRate} 
          showHint={true}
          size="medium"
        />

        {/* Stats Grid */}
        <Text style={styles.statsTitle}>Your Stats</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={styles.statContent}>
              <Ionicons name="briefcase" size={24} color="#3B82F6" />
              <Text style={styles.statNumber}>{stats.totalJobs}</Text>
              <Text style={styles.statLabel}>Total Jobs</Text>
            </View>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statContent}>
              <Ionicons name="checkmark-circle" size={24} color="#10B981" />
              <Text style={styles.statNumber}>{stats.completedJobs}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statContent}>
              <Ionicons name="cash" size={24} color="#F59E0B" />
              <Text style={styles.statNumber}>£{stats.earnings}</Text>
              <Text style={styles.statLabel}>Earnings</Text>
            </View>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statContent}>
              <Ionicons name="star" size={24} color="#EF4444" />
              <Text style={styles.statNumber}>{stats.rating}</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
          </View>
        </View>

        {/* Available Routes */}
        <Text style={styles.sectionTitle}>Available Routes</Text>
        {availableRoutes.map((route) => (
          <TouchableOpacity
            key={route.id}
            style={styles.routeCard}
            onPress={() => handleQuickAction('View Routes')}
          >
            <View style={styles.routeCardHeader}>
              <View style={styles.routeCardLeft}>
                <Ionicons name="git-network" size={24} color="#3B82F6" />
                <View style={styles.routeCardInfo}>
                  <Text style={styles.routeCardTitle}>{route.title}</Text>
                  <Text style={styles.routeCardLocation}>{route.location}</Text>
                </View>
              </View>
              <View style={styles.routeCardRight}>
                <Text style={styles.routeCardEarnings}>£{route.earnings.toFixed(2)}</Text>
                <View style={styles.routeCardBadge}>
                  <Text style={styles.routeCardBadgeText}>NEW</Text>
                </View>
              </View>
            </View>
            <View style={styles.routeCardStats}>
              <View style={styles.routeCardStat}>
                <Ionicons name="location" size={16} color="#9CA3AF" />
                <Text style={styles.routeCardStatText}>{route.distance}</Text>
              </View>
              <View style={styles.routeCardStat}>
                <Ionicons name="time" size={16} color="#9CA3AF" />
                <Text style={styles.routeCardStatText}>{route.duration}</Text>
              </View>
              <View style={styles.routeCardStat}>
                <Ionicons name="git-network" size={16} color="#9CA3AF" />
                <Text style={styles.routeCardStatText}>{route.stops} stops</Text>
              </View>
              {route.hasCameras && (
                <View style={styles.camerasBadge}>
                  <Text style={styles.camerasText}>📹 Cameras</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        ))}

        {/* Recent Routes */}
        <Text style={styles.sectionTitle}>Recent Routes</Text>
        {recentRoutes.map((route) => (
          <View key={route.id} style={styles.recentRouteCard}>
            <View style={styles.recentRouteHeader}>
              <View style={styles.recentRouteLeft}>
                <Ionicons name="git-network" size={20} color="#9CA3AF" />
                <View style={styles.recentRouteInfo}>
                  <Text style={styles.recentRouteTitle}>{route.title}</Text>
                  <Text style={styles.recentRouteLocation}>{route.location}</Text>
                </View>
              </View>
              <View style={styles.recentRouteRight}>
                <Text style={styles.recentRouteEarnings}>£{route.earnings.toFixed(2)}</Text>
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: route.status === 'completed' ? '#10B981' : '#F59E0B' }
                ]}>
                  <Text style={[
                    styles.statusText,
                    { color: route.status === 'completed' ? '#FFFFFF' : '#FFFFFF' }
                  ]}>
                    {route.status.toUpperCase()}
                  </Text>
                </View>
              </View>
            </View>
            <View style={styles.recentRouteStats}>
              <View style={styles.recentRouteStat}>
                <Ionicons name="location" size={14} color="#6B7280" />
                <Text style={styles.recentRouteStatText}>{route.distance}</Text>
              </View>
              <View style={styles.recentRouteStat}>
                <Ionicons name="time" size={14} color="#6B7280" />
                <Text style={styles.recentRouteStatText}>{route.duration}</Text>
              </View>
              {route.completedAt && (
                <View style={styles.recentRouteStat}>
                  <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                  <Text style={styles.recentRouteStatText}>
                    {new Date(route.completedAt).toLocaleDateString('en-GB')}
                  </Text>
                </View>
              )}
            </View>
          </View>
        ))}

        {/* Quick Actions - Real Data Cards */}
        <Text style={styles.actionsTitle}>Quick Actions</Text>
        
        {/* Today's Schedule Card */}
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => handleQuickAction('View Routes')}
        >
          <View style={styles.actionCardHeader}>
            <View style={styles.actionCardLeft}>
              <View style={[styles.actionCardIcon, { backgroundColor: '#EBF5FF' }]}>
                <Ionicons name="git-network" size={28} color="#3B82F6" />
              </View>
              <View style={styles.actionCardInfo}>
                <Text style={styles.actionCardTitle}>Today's Routes</Text>
                <Text style={styles.actionCardSubtitle}>2 routes available now</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </View>
          <View style={styles.actionCardStats}>
            <View style={styles.actionCardStat}>
              <Text style={styles.actionCardStatValue}>£211.25</Text>
              <Text style={styles.actionCardStatLabel}>Potential Earnings</Text>
            </View>
            <View style={styles.actionCardDivider} />
            <View style={styles.actionCardStat}>
              <Text style={styles.actionCardStatValue}>43.7 miles</Text>
              <Text style={styles.actionCardStatLabel}>Total Distance</Text>
            </View>
            <View style={styles.actionCardDivider} />
            <View style={styles.actionCardStat}>
              <Text style={styles.actionCardStatValue}>5h 30m</Text>
              <Text style={styles.actionCardStatLabel}>Estimated Time</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Earnings Summary Card */}
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => handleQuickAction('Earnings')}
        >
          <View style={styles.actionCardHeader}>
            <View style={styles.actionCardLeft}>
              <View style={[styles.actionCardIcon, { backgroundColor: '#ECFDF5' }]}>
                <Ionicons name="cash" size={28} color="#10B981" />
              </View>
              <View style={styles.actionCardInfo}>
                <Text style={styles.actionCardTitle}>This Week's Earnings</Text>
                <Text style={styles.actionCardSubtitle}>8 routes completed</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </View>
          <View style={styles.actionCardStats}>
            <View style={styles.actionCardStat}>
              <Text style={styles.actionCardStatValue}>£245.50</Text>
              <Text style={styles.actionCardStatLabel}>Route Earnings</Text>
            </View>
            <View style={styles.actionCardDivider} />
            <View style={styles.actionCardStat}>
              <Text style={styles.actionCardStatValue}>£45.00</Text>
              <Text style={styles.actionCardStatLabel}>Tips Received</Text>
            </View>
            <View style={styles.actionCardDivider} />
            <View style={styles.actionCardStat}>
              <Text style={styles.actionCardStatValue}>£30.00</Text>
              <Text style={styles.actionCardStatLabel}>Pending</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Performance Card */}
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => handleQuickAction('Profile')}
        >
          <View style={styles.actionCardHeader}>
            <View style={styles.actionCardLeft}>
              <View style={[styles.actionCardIcon, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="trending-up" size={28} color="#F59E0B" />
              </View>
              <View style={styles.actionCardInfo}>
                <Text style={styles.actionCardTitle}>Performance Overview</Text>
                <Text style={styles.actionCardSubtitle}>Excellent rating this month</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </View>
          <View style={styles.actionCardStats}>
            <View style={styles.actionCardStat}>
              <View style={styles.ratingContainer}>
                <Text style={styles.actionCardStatValue}>4.8</Text>
                <Ionicons name="star" size={16} color="#F59E0B" />
              </View>
              <Text style={styles.actionCardStatLabel}>Customer Rating</Text>
            </View>
            <View style={styles.actionCardDivider} />
            <View style={styles.actionCardStat}>
              <Text style={styles.actionCardStatValue}>95%</Text>
              <Text style={styles.actionCardStatLabel}>On-Time Delivery</Text>
            </View>
            <View style={styles.actionCardDivider} />
            <View style={styles.actionCardStat}>
              <Text style={styles.actionCardStatValue}>32</Text>
              <Text style={styles.actionCardStatLabel}>Routes This Month</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Documents & Settings Card */}
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => handleQuickAction('Settings')}
        >
          <View style={styles.actionCardHeader}>
            <View style={styles.actionCardLeft}>
              <View style={[styles.actionCardIcon, { backgroundColor: '#374151' }]}>
                <Ionicons name="shield-checkmark" size={28} color="#9CA3AF" />
              </View>
              <View style={styles.actionCardInfo}>
                <Text style={styles.actionCardTitle}>Account & Documents</Text>
                <Text style={styles.actionCardSubtitle}>All documents verified</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </View>
          <View style={styles.documentsList}>
            <View style={styles.documentItem}>
              <Ionicons name="checkmark-circle" size={18} color="#10B981" />
              <Text style={styles.documentText}>Driver License: Valid until 2026</Text>
            </View>
            <View style={styles.documentItem}>
              <Ionicons name="checkmark-circle" size={18} color="#10B981" />
              <Text style={styles.documentText}>Insurance: Valid until 2025</Text>
            </View>
            <View style={styles.documentItem}>
              <Ionicons name="checkmark-circle" size={18} color="#10B981" />
              <Text style={styles.documentText}>Background Check: Approved</Text>
            </View>
          </View>
        </TouchableOpacity>
      </ScrollView>

      {/* Enhanced Route Match Modal */}
      <RouteMatchModal
        visible={showMatchModal}
        routeCount={currentPendingOffer?.jobCount || newRouteCount}
        matchType={currentPendingOffer?.matchType}
        orderNumber={currentPendingOffer?.orderNumber}
        routeNumber={currentPendingOffer?.routeNumber}
        bookingReference={currentPendingOffer?.bookingReference}
        expiresAt={currentPendingOffer?.expiresAt}
        expiresInSeconds={currentPendingOffer?.expiresAt ? undefined : 1800}
        jobId={currentPendingOffer?.bookingId}
        onViewNow={handleViewNow}
        onDecline={handleDecline}
      />

      {/* Permission Warning Modal */}
      <PermissionWarningModal
        visible={showPermissionWarning}
        jobReference={permissionWarningJob?.reference || 'N/A'}
        remainingMinutes={permissionRemainingMinutes}
        missingPermissions={missingPermissions}
        onDismiss={handlePermissionWarningDismiss}
        onOpenSettings={handleOpenPermissionSettings}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',  // Dark background
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 24,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',  // White text
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#E5E7EB',  // Light gray text
  },
  statusCard: {
    backgroundColor: '#1F2937',  // Dark card
    marginHorizontal: 24,
    marginBottom: 24,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#374151',  // Dark border
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#D1D5DB',
    marginRight: 12,
  },
  statusDotOnline: {
    backgroundColor: '#10B981',
  },
  statusTextContainer: {
    flex: 1,
  },
  statusText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',  // White text
    marginBottom: 4,
  },
  statusSubtext: {
    fontSize: 14,
    color: '#9CA3AF',  // Muted text
  },
  statsTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',  // White text
    marginBottom: 16,
    marginHorizontal: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#1F2937',  // Dark card
    margin: '1%',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#374151',  // Dark border
  },
  statContent: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',  // White text
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#9CA3AF',  // Muted text
  },
  actionsTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',  // White text
    marginBottom: 16,
    marginHorizontal: 24,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  actionButton: {
    width: '48%',
    backgroundColor: '#1F2937',  // Dark card
    margin: '1%',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#374151',  // Dark border
  },
  actionText: {
    color: '#FFFFFF',  // White text
    fontSize: 14,
    fontWeight: '500',
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',  // White text
    marginBottom: 12,
    marginTop: 20,
  },
  routeCard: {
    backgroundColor: '#1F2937',  // Dark card
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  routeCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  routeCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  routeCardInfo: {
    marginLeft: 12,
    flex: 1,
  },
  routeCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',  // White text
  },
  routeCardLocation: {
    fontSize: 14,
    color: '#9CA3AF',  // Muted text
  },
  routeCardRight: {
    alignItems: 'flex-end',
  },
  routeCardEarnings: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10B981',
  },
  routeCardBadge: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginTop: 4,
  },
  routeCardBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  routeCardStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  routeCardStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  routeCardStatText: {
    fontSize: 12,
    color: '#9CA3AF',  // Muted text
  },
  camerasBadge: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  camerasText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  recentRouteCard: {
    backgroundColor: '#1F2937',  // Dark card
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#374151',  // Dark border
  },
  recentRouteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  recentRouteLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  recentRouteInfo: {
    marginLeft: 12,
    flex: 1,
  },
  recentRouteTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',  // White text
  },
  recentRouteLocation: {
    fontSize: 14,
    color: '#9CA3AF',  // Muted text
  },
  recentRouteRight: {
    alignItems: 'flex-end',
  },
  recentRouteEarnings: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10B981',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
  },
  statusTextBadge: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  recentRouteStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recentRouteStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  recentRouteStatText: {
    fontSize: 12,
    color: '#9CA3AF',  // Muted text
  },
  actionCard: {
    backgroundColor: '#1F2937',  // Dark card
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  actionCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  actionCardIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  actionCardInfo: {
    flex: 1,
  },
  actionCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',  // White text
    marginBottom: 4,
  },
  actionCardSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',  // Muted text
  },
  actionCardStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#374151',  // Darker background
    borderRadius: 8,
    padding: 12,
  },
  actionCardStat: {
    flex: 1,
    alignItems: 'center',
  },
  actionCardStatValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',  // White text
    marginBottom: 4,
  },
  actionCardStatLabel: {
    fontSize: 11,
    color: '#9CA3AF',  // Muted text
    textAlign: 'center',
  },
  actionCardDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#4B5563',  // Dark divider
    marginHorizontal: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  documentsList: {
    gap: 8,
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  documentText: {
    fontSize: 13,
    color: '#FFFFFF',  // White text
  },
  offlineOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(17, 24, 39, 0.98)',  // Almost opaque dark overlay
    zIndex: 9999,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  offlineCard: {
    backgroundColor: '#1F2937',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    maxWidth: 350,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  offlineTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 20,
    marginBottom: 12,
    textAlign: 'center',
  },
  offlineMessage: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});