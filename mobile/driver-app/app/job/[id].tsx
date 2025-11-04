import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking,
  Platform,
  AppState,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from 'react-native-maps';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from '../../services/api';
import { colors, typography, spacing, borderRadius, shadows } from '../../utils/theme';
import { JobProgressTracker, JobStep } from '../../components/JobProgressTracker';
import { emoteManager } from '../../services/emoteService';
import { showGlobalEmote } from '../../components/EmoteOverlay';
import { soundService } from '../../services/soundService';

// Types
interface JobDetails {
  id: string;
  reference: string;
  customer: {
    name: string;
    phone: string;
    email: string;
  };
  pickup: {
    address: string;
    postcode: string;
    lat: number;
    lng: number;
    time: string;
  };
  dropoff: {
    address: string;
    postcode: string;
    lat: number;
    lng: number;
    time: string;
  };
  items: Array<{
    name: string;
    quantity: number;
    description?: string;
  }>;
  distance: string;
  duration: string;
  earnings: string;
  status: 'available' | 'accepted' | 'started' | 'completed';
  vehicleType: string;
  notes?: string;
}

export default function JobDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [job, setJob] = useState<JobDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<JobStep>('navigate_to_pickup');
  const [completedSteps, setCompletedSteps] = useState<JobStep[]>([]);
  const [isUpdatingProgress, setIsUpdatingProgress] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'offline' | 'error'>('offline');
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  // Load job details and progress on mount
  useEffect(() => {
    loadJobDetails();
    loadProgressState();
  }, [id]);
  
  // Setup AppState listener for saving progress and syncing
  useEffect(() => {
    // Listen for app state changes
    const handleAppStateChange = async (nextAppState: string) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        // Save progress when app goes to background
        await saveProgressState();
        console.log('📱 App going to background - progress saved');
      } else if (nextAppState === 'active') {
        // App came back to foreground - check for updates and sync
        console.log('📱 App became active - checking for updates');
        await checkForUpdatesAndSync();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription?.remove();
      // Save progress when component unmounts
      saveProgressState();
    };
  }, [currentStep, completedSteps]); // Include progress state in dependencies

  // Check for updates and sync when app becomes active
  const checkForUpdatesAndSync = async () => {
    try {
      // Check if there are unsynced changes
      const savedProgress = await AsyncStorage.getItem(`job_progress_${id}`);
      if (savedProgress) {
        const progressData = JSON.parse(savedProgress);
        await syncWithServerState(progressData);
      }

      // Check server for any updates to job status
      const response = await apiService.get(`/api/driver/jobs/${id}`);
      if (response.success && response.data) {
        const apiData = response.data.job || response.data;

        // Check if job status changed (e.g., cancelled by admin)
        if (apiData.status !== job?.status) {
          console.log('⚠️ Job status changed on server:', apiData.status);
          Alert.alert(
            'Job Status Updated',
            `Job status has been updated to: ${apiData.status}`,
            [{ text: 'OK' }]
          );
          // Reload job details
          setJob(prev => prev ? { ...prev, status: apiData.status } : null);
        }
      }
    } catch (error) {
      console.warn('⚠️ Failed to check for updates:', error);
      // Continue normally - don't disrupt user experience
    }
  };

  // Update sync status
  const updateSyncStatus = (status: 'synced' | 'syncing' | 'offline' | 'error') => {
    setSyncStatus(status);
    if (status === 'synced') {
      setLastSyncTime(new Date());
    }
  };

  // Save progress state to AsyncStorage
  const saveProgressState = async () => {
    try {
      const progressData = {
        currentStep,
        completedSteps,
        timestamp: new Date().toISOString(),
        lastSyncTime: lastSyncTime?.toISOString(),
      };
      await AsyncStorage.setItem(`job_progress_${id}`, JSON.stringify(progressData));
      console.log('💾 Progress saved locally:', progressData);
    } catch (error) {
      console.error('❌ Failed to save progress locally:', error);
    }
  };

  // Load progress state from AsyncStorage and sync with server
  const loadProgressState = async () => {
    try {
      const savedProgress = await AsyncStorage.getItem(`job_progress_${id}`);
      if (savedProgress) {
        const progressData = JSON.parse(savedProgress);
        setCurrentStep(progressData.currentStep || 'navigate_to_pickup');
        setCompletedSteps(progressData.completedSteps || []);
        console.log('📂 Progress restored locally:', progressData);

        // Try to sync with server state in background
        syncWithServerState(progressData);
      } else {
        // No local progress, check server for any existing state
        await checkServerState();
      }
    } catch (error) {
      console.error('❌ Failed to load progress:', error);
      // If local loading fails, try server
      await checkServerState();
    }
  };

  // Check server for existing job state
  const checkServerState = async () => {
    try {
      console.log('🔍 Checking server for job state...');
      const response = await apiService.get(`/api/driver/jobs/${id}`);

      if (response.success && response.data) {
        const apiData = response.data.job || response.data;

        // If server has progress information, use it
        if (apiData.progress && apiData.progress.currentStep) {
          console.log('📡 Server state found:', apiData.progress);
          setCurrentStep(apiData.progress.currentStep);
          setCompletedSteps(apiData.progress.completedSteps || []);

          // Save server state locally
          await saveProgressState();
        }
      }
    } catch (error) {
      console.warn('⚠️ Could not check server state:', error);
      // Continue with default state - user can still work
    }
  };

  // Sync local progress with server state
  const syncWithServerState = async (localProgress: any) => {
    try {
      console.log('🔄 Syncing local progress with server...');
      const response = await apiService.get(`/api/driver/jobs/${id}`);

      if (response.success && response.data) {
        const apiData = response.data.job || response.data;
        const serverProgress = apiData.progress;

        if (serverProgress) {
          // Compare timestamps to resolve conflicts
          const localTimestamp = new Date(localProgress.timestamp || 0);
          const serverTimestamp = new Date(serverProgress.timestamp || 0);

          if (serverTimestamp > localTimestamp) {
            console.log('📡 Server state is newer, updating local state');
            setCurrentStep(serverProgress.currentStep);
            setCompletedSteps(serverProgress.completedSteps || []);
            await saveProgressState();
          } else if (localTimestamp > serverTimestamp) {
            console.log('📱 Local state is newer, syncing to server');
            // Try to sync local progress to server
            await syncProgressToServer(localProgress);
          } else {
            console.log('✅ Local and server states are in sync');
          }
        } else {
          // No server progress, sync local to server
          console.log('📤 No server progress, syncing local progress to server');
          await syncProgressToServer(localProgress);
        }
      }
    } catch (error) {
      console.warn('⚠️ Could not sync with server:', error);
      // Continue with local state - offline functionality
    }
  };

  // Sync local progress to server
  const syncProgressToServer = async (progressData: any) => {
    try {
      const response = await apiService.post(
        `/api/driver/jobs/${id}/update-progress`,
        {
          step: progressData.currentStep,
          completedSteps: progressData.completedSteps,
          payload: {
            timestamp: progressData.timestamp,
            sync: true // Mark as sync operation
          }
        }
      );

      if (response.success) {
        console.log('✅ Progress synced to server');
      } else {
        console.warn('⚠️ Failed to sync progress to server:', response.error);
      }
    } catch (error) {
      console.warn('⚠️ Error syncing progress to server:', error);
    }
  };

  const loadJobDetails = async () => {
    try {
      setLoading(true);
      const response = await apiService.get(`/api/driver/jobs/${id}`);

      if (response.success && response.data) {
        // Transform API response to match component structure
        // API returns { success, job } so we need response.data.job
        const apiData = response.data.job || response.data;
        const transformedJob = {
          id: apiData.id,
          reference: apiData.reference,
          customer: {
            name: apiData.customer?.name || 'Customer',
            phone: apiData.customer?.phone || '',
            email: apiData.customer?.email || '',
          },
          pickup: {
            address: apiData.addresses?.pickup?.line1 || 'Pickup location',
            postcode: apiData.addresses?.pickup?.postcode || '',
            lat: apiData.addresses?.pickup?.coordinates?.lat || 0,
            lng: apiData.addresses?.pickup?.coordinates?.lng || 0,
            time: apiData.schedule?.date || new Date().toISOString(),
          },
          dropoff: {
            address: apiData.addresses?.dropoff?.line1 || 'Dropoff location',
            postcode: apiData.addresses?.dropoff?.postcode || '',
            lat: apiData.addresses?.dropoff?.coordinates?.lat || 0,
            lng: apiData.addresses?.dropoff?.coordinates?.lng || 0,
            time: apiData.schedule?.date || new Date().toISOString(),
          },
          items: apiData.items || [],
          distance: apiData.schedule?.estimatedDuration ? `${(apiData.schedule.estimatedDuration / 10).toFixed(1)} miles` : '-',
          duration: apiData.schedule?.estimatedDuration ? `${apiData.schedule.estimatedDuration} min` : '-',
          earnings: apiData.pricing?.estimatedEarnings || '0',
          status: apiData.status || 'available',
          vehicleType: typeof apiData.crewRecommendation === 'string' 
            ? apiData.crewRecommendation 
            : (apiData.crewRecommendation?.vehicleType || 'Van'),
          notes: apiData.specialRequirements || '',
        };
        setJob(transformedJob);
      } else {
        Alert.alert('Error', response.error || 'Failed to load job details');
        router.back();
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load job details');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    soundService.playButtonClick();
    Alert.alert(
      'Accept Job',
      'Are you sure you want to accept this job?',
      [
        { 
          text: 'Cancel', 
          style: 'cancel',
          onPress: () => soundService.playButtonClick(),
        },
        {
          text: 'Accept',
          onPress: async () => {
            soundService.playSuccess();
            try {
              setActionLoading(true);
              const response = await apiService.post(
                `/api/driver/jobs/${id}/accept`,
                {}
              );

              if (response.success) {
                // Trigger emote for route acceptance
                const triggerEmote = async () => {
                  const enabled = await emoteManager.areEmotesEnabled();
                  if (enabled) {
                    const emoteData = await emoteManager.getEmoteDisplayData('routeAccepted');
                    if (emoteData) {
                      showGlobalEmote(emoteData);
                    }
                  }
                };
                triggerEmote();

                Alert.alert('Success', 'Job accepted successfully', [
                  {
                    text: 'OK',
                    onPress: () => {
                      soundService.playButtonClick();
                      router.replace('/tabs/dashboard');
                    },
                  },
                ]);
              } else {
                soundService.playError();
                Alert.alert('Error', response.error || 'Failed to accept job');
              }
            } catch (error: any) {
              soundService.playError();
              Alert.alert('Error', error.message || 'Failed to accept job');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleDecline = async () => {
    Alert.alert(
      'Decline Job',
      'Are you sure you want to decline this job?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: async () => {
            try {
              setActionLoading(true);
              const response = await apiService.post(
                `/api/driver/jobs/${id}/decline`,
                { reason: 'Not available', permanent: true }
              );

              if (response.success) {
                // Trigger emote for route decline
                const triggerEmote = async () => {
                  const enabled = await emoteManager.areEmotesEnabled();
                  if (enabled) {
                    const emoteData = await emoteManager.getEmoteDisplayData('routeDeclined');
                    if (emoteData) {
                      showGlobalEmote(emoteData);
                    }
                  }
                };
                triggerEmote();

                Alert.alert('Job Declined', 'You have declined this job', [
                  {
                    text: 'OK',
                    onPress: () => router.back(),
                  },
                ]);
              } else {
                Alert.alert('Error', response.error || 'Failed to decline job');
              }
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to decline job');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleStart = async () => {
    soundService.playButtonClick();
    Alert.alert(
      'Start Job',
      'Are you ready to start this job?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start',
          onPress: async () => {
            try {
              setActionLoading(true);
              const response = await apiService.post(
                `/api/driver/jobs/${id}/start`,
                {}
              );

              if (response.success) {
                Alert.alert('Success', 'Job started successfully');
                loadJobDetails();
              } else {
                Alert.alert('Error', response.error || 'Failed to start job');
              }
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to start job');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleComplete = async () => {
    soundService.playButtonClick();
    Alert.alert(
      'Complete Job',
      'Have you completed this delivery?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          onPress: async () => {
            try {
              setActionLoading(true);
              const response = await apiService.post(
                `/api/driver/jobs/${id}/complete`,
                {
                  completionNotes: 'Delivered successfully',
                }
              );

              if (response.success) {
                // Trigger emote for job completion
                const triggerEmote = async () => {
                  const enabled = await emoteManager.areEmotesEnabled();
                  if (enabled) {
                    const emoteData = await emoteManager.getEmoteDisplayData('jobCompleted');
                    if (emoteData) {
                      showGlobalEmote(emoteData);
                    }
                  }
                };
                triggerEmote();

                Alert.alert('Success', 'Job completed successfully', [
                  {
                    text: 'OK',
                    onPress: () => router.replace('/tabs/earnings'),
                  },
                ]);
              } else {
                Alert.alert('Error', response.error || 'Failed to complete job');
              }
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to complete job');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleCall = (phone: string) => {
    soundService.playButtonClick();
    const phoneNumber = Platform.OS === 'ios' ? `telprompt:${phone}` : `tel:${phone}`;
    Linking.openURL(phoneNumber).catch(() => {
      soundService.playError();
      Alert.alert('Error', 'Unable to make call');
    });
  };

  const handleNavigate = (lat: number, lng: number, address: string) => {
    const scheme = Platform.select({
      ios: 'maps:0,0?q=',
      android: 'geo:0,0?q=',
    });
    const latLng = `${lat},${lng}`;
    const label = encodeURIComponent(address);
    const url = Platform.select({
      ios: `${scheme}${label}@${latLng}`,
      android: `${scheme}${latLng}(${label})`,
    });

    Linking.openURL(url!).catch(() => {
      Alert.alert('Error', 'Unable to open maps');
    });
  };

  const handleStepComplete = async (step: JobStep) => {
    try {
      setIsUpdatingProgress(true);

      // Immediately update local state and save to storage (regardless of server sync)
      const newCompletedSteps = [...completedSteps, currentStep];
      setCompletedSteps(newCompletedSteps);
      setCurrentStep(step);

      // Save progress immediately to local storage
      await saveProgressState();

      console.log('✅ Progress updated locally:', { currentStep: step, completedSteps: newCompletedSteps });

      // Set sync status to syncing
      updateSyncStatus('syncing');

      // Try to sync with server in background
      try {
        const response = await apiService.post(
          `/api/driver/jobs/${id}/update-progress`,
          { step, payload: { timestamp: new Date().toISOString() } }
        );

        if (response.success) {
          console.log('✅ Progress synced with server:', response.data?.message);
          updateSyncStatus('synced');

          // If job completed, navigate to earnings
          if (step === 'job_completed') {
            // Clear saved progress for this job
            await AsyncStorage.removeItem(`job_progress_${id}`);

            Alert.alert(
              'Job Completed! 🎉',
              'Great work! Your earnings have been recorded.',
              [
                {
                  text: 'View Earnings',
                  onPress: () => router.replace('/tabs/earnings'),
                },
                {
                  text: 'Back to Dashboard',
                  onPress: () => router.replace('/tabs/dashboard'),
                },
              ]
            );
          }
        } else {
          console.warn('⚠️ Server sync failed, but progress saved locally:', response.error);
          updateSyncStatus('error');
          // Don't show error alert - progress is saved locally
          // User can continue working offline
        }
      } catch (syncError) {
        console.warn('⚠️ Server sync error, but progress saved locally:', syncError);
        updateSyncStatus('error');
        // Don't show error alert - progress is saved locally
        // User can continue working offline
      }

    } catch (error: any) {
      console.error('❌ Critical error in step completion:', error);
      Alert.alert('Error', error.message || 'Failed to update progress');
    } finally {
      setIsUpdatingProgress(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!job) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Job not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Job Details</Text>
          <Text style={styles.headerSubtitle}>{job.reference}</Text>
        </View>
        {/* Sync Status Indicator */}
        <View style={styles.syncIndicator}>
          {syncStatus === 'synced' && (
            <View style={styles.syncStatus}>
              <Ionicons name="cloud-done" size={16} color="#34C759" />
              <Text style={styles.syncText}>Synced</Text>
            </View>
          )}
          {syncStatus === 'syncing' && (
            <View style={styles.syncStatus}>
              <ActivityIndicator size="small" color="#007AFF" />
              <Text style={styles.syncText}>Syncing</Text>
            </View>
          )}
          {syncStatus === 'offline' && (
            <View style={styles.syncStatus}>
              <Ionicons name="cloud-offline" size={16} color="#FF9500" />
              <Text style={styles.syncText}>Offline</Text>
            </View>
          )}
          {syncStatus === 'error' && (
            <View style={styles.syncStatus}>
              <Ionicons name="cloud-offline" size={16} color="#FF3B30" />
              <Text style={styles.syncText}>Sync Error</Text>
            </View>
          )}
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Map */}
        <View style={styles.mapContainer}>
          {job.pickup?.lat && job.dropoff?.lat ? (
            <MapView
              provider={PROVIDER_DEFAULT}
              style={styles.map}
              initialRegion={{
                latitude: (job.pickup.lat + job.dropoff.lat) / 2,
                longitude: (job.pickup.lng + job.dropoff.lng) / 2,
                latitudeDelta: 0.1,
                longitudeDelta: 0.1,
              }}
            >
              <Marker
                coordinate={{ latitude: job.pickup.lat, longitude: job.pickup.lng }}
                title="Pickup"
                pinColor="#4CAF50"
              />
              <Marker
                coordinate={{ latitude: job.dropoff.lat, longitude: job.dropoff.lng }}
                title="Dropoff"
                pinColor="#F44336"
              />
              <Polyline
                coordinates={[
                  { latitude: job.pickup.lat, longitude: job.pickup.lng },
                  { latitude: job.dropoff.lat, longitude: job.dropoff.lng },
                ]}
                strokeColor="#007AFF"
                strokeWidth={3}
              />
            </MapView>
          ) : (
            <View style={[styles.map, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f0f0' }]}>
              <Text style={{ color: colors.text.secondary }}>Map not available</Text>
            </View>
          )}
        </View>

        {/* Progress Tracker */}
        {job.status !== 'available' && (
          <JobProgressTracker
            currentStep={currentStep}
            completedSteps={completedSteps}
            onStepComplete={handleStepComplete}
            isUpdating={isUpdatingProgress}
          />
        )}

        {/* Job Info Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Trip Information</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{job.status}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="car-outline" size={20} color="#666" />
            <Text style={styles.infoText}>{job.vehicleType}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="navigate-outline" size={20} color="#666" />
            <Text style={styles.infoText}>{job.distance}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={20} color="#666" />
            <Text style={styles.infoText}>{job.duration}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="cash-outline" size={20} color="#4CAF50" />
            <Text style={[styles.infoText, styles.earningsText]}>
              {job.earnings}
            </Text>
          </View>
        </View>

        {/* Customer Info Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Customer Information</Text>

          <View style={styles.customerInfo}>
            <View style={styles.customerRow}>
              <Ionicons name="person-outline" size={20} color="#666" />
              <Text style={styles.customerText}>{job.customer.name}</Text>
            </View>

            <View style={styles.customerActions}>
              <TouchableOpacity
                style={styles.actionIcon}
                onPress={() => handleCall(job.customer.phone)}
              >
                <Ionicons name="call" size={20} color="#007AFF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Pickup Location Card */}
        <View style={styles.card}>
          <View style={styles.locationHeader}>
            <View style={[styles.locationDot, { backgroundColor: '#4CAF50' }]} />
            <Text style={styles.cardTitle}>Pickup Location</Text>
          </View>

          <Text style={styles.addressText}>{job.pickup.address}</Text>
          <Text style={styles.postcodeText}>{job.pickup.postcode}</Text>
          <Text style={styles.timeText}>Pickup at: {job.pickup.time}</Text>

          <TouchableOpacity
            style={styles.navigateButton}
            onPress={() => handleNavigate(job.pickup.lat, job.pickup.lng, job.pickup.address)}
          >
            <Ionicons name="navigate" size={16} color="#007AFF" />
            <Text style={styles.navigateText}>Navigate</Text>
          </TouchableOpacity>
        </View>

        {/* Dropoff Location Card */}
        <View style={styles.card}>
          <View style={styles.locationHeader}>
            <View style={[styles.locationDot, { backgroundColor: '#F44336' }]} />
            <Text style={styles.cardTitle}>Dropoff Location</Text>
          </View>

          <Text style={styles.addressText}>{job.dropoff.address}</Text>
          <Text style={styles.postcodeText}>{job.dropoff.postcode}</Text>
          <Text style={styles.timeText}>Deliver by: {job.dropoff.time}</Text>

          <TouchableOpacity
            style={styles.navigateButton}
            onPress={() => handleNavigate(job.dropoff.lat, job.dropoff.lng, job.dropoff.address)}
          >
            <Ionicons name="navigate" size={16} color="#007AFF" />
            <Text style={styles.navigateText}>Navigate</Text>
          </TouchableOpacity>
        </View>

        {/* Items Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Items to Deliver</Text>

          {job.items.map((item, index) => (
            <View key={index} style={styles.itemRow}>
              <Ionicons name="cube-outline" size={20} color="#666" />
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>
                  {item.quantity}x {item.name}
                </Text>
                {item.description && (
                  <Text style={styles.itemDescription}>{item.description}</Text>
                )}
              </View>
            </View>
          ))}
        </View>

        {/* Notes Card */}
        {job.notes && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Special Instructions</Text>
            <Text style={styles.notesText}>{job.notes}</Text>
          </View>
        )}

        {/* Spacer for buttons */}
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        {job.status === 'available' && (
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.actionButton, styles.declineButton]}
              onPress={handleDecline}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="close-circle" size={20} color="#fff" />
                  <Text style={styles.actionButtonText}>Decline</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.acceptButton]}
              onPress={handleAccept}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color="#fff" />
                  <Text style={styles.actionButtonText}>Accept Job</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {job.status === 'accepted' && (
          <TouchableOpacity
            style={[styles.actionButton, styles.startButton]}
            onPress={handleStart}
            disabled={actionLoading}
          >
            {actionLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="play-circle" size={20} color="#fff" />
                <Text style={styles.actionButtonText}>Start Job</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {job.status === 'started' && (
          <TouchableOpacity
            style={[styles.actionButton, styles.completeButton]}
            onPress={handleComplete}
            disabled={actionLoading}
          >
            {actionLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-done-circle" size={20} color="#fff" />
                <Text style={styles.actionButtonText}>Complete Job</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A', // Matches splash screen
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F172A',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F172A',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  mapContainer: {
    height: 250,
    backgroundColor: '#fff',
  },
  map: {
    flex: 1,
  },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    marginTop: 12,
    marginHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  badge: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 12,
  },
  earningsText: {
    color: '#4CAF50',
    fontWeight: '600',
    fontSize: 16,
  },
  customerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  customerText: {
    fontSize: 14,
    color: '#000',
    marginLeft: 12,
    fontWeight: '500',
  },
  customerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f9ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  addressText: {
    fontSize: 14,
    color: '#000',
    marginBottom: 4,
  },
  postcodeText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  timeText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
    marginBottom: 12,
  },
  navigateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f9ff',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  navigateText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  itemInfo: {
    flex: 1,
    marginLeft: 12,
  },
  itemName: {
    fontSize: 14,
    color: '#000',
    fontWeight: '500',
  },
  itemDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  notesText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  actionsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  declineButton: {
    backgroundColor: '#F44336',
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
  },
  startButton: {
    backgroundColor: '#007AFF',
  },
  completeButton: {
    backgroundColor: '#4CAF50',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Sync indicator styles
  syncIndicator: {
    alignItems: 'flex-end',
    minWidth: 80,
  },
  syncStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  syncText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
  },
});

