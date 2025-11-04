import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Animated,
  Modal,
  Image,
} from 'react-native';
import { Video } from 'expo-av';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useLocation } from '../../contexts/LocationContext';
import { apiService } from '../../services/api';
import { pusherService } from '../../services/pusher';
import { JobCard } from '../../components/JobCard';
import { StatsCard } from '../../components/StatsCard';
import { OnlineIndicator } from '../../components/OnlineIndicator';
import { AIDashboardSection } from '../../components/AIDashboardSection';
// JobAssignmentModal is now handled globally - no import needed
import { DashboardData, JobAssignment, PusherEvent } from '../../types';
import { colors, typography, spacing, borderRadius, shadows, glassEffect } from '../../utils/theme';
import { formatCurrency } from '../../utils/helpers';
import { notificationService } from '../../services/notification';
import { soundService } from '../../services/soundService';
import { AnimatedScreen } from '../../components/AnimatedScreen';

// Animated Section Title Component
const AnimatedSectionTitle: React.FC = () => {
  const [colorIndex, setColorIndex] = React.useState(0);
  
  const COLOR_PALETTE = [
    '#007AFF', // Blue
    '#10B981', // Green
    '#8B5CF6', // Purple
    '#F59E0B', // Orange
    '#EF4444', // Red
    '#EC4899', // Pink
    '#06B6D4', // Cyan
    '#10B981', // Green
  ];

  React.useEffect(() => {
    const interval = setInterval(() => {
      setColorIndex((prev) => (prev + 1) % COLOR_PALETTE.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Text style={[styles.sectionTitle, { color: COLOR_PALETTE[colorIndex] }]}>
      Today's Overview
    </Text>
  );
};

// Enhanced Available Jobs Card Component
interface AvailableJobsCardProps {
  jobs: any[];
  totalCount: number;
  onJobPress: (jobId: string) => void;
}

const AvailableJobsCard: React.FC<AvailableJobsCardProps> = ({ jobs, totalCount, onJobPress }) => {
  const rotateAnim = React.useRef(new Animated.Value(0)).current;
  const pulseAnim = React.useRef(new Animated.Value(1)).current;
  const shimmerAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    // Rotate animation every 5 seconds - continuous loop
    const rotateAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 5000,
          useNativeDriver: true,
        }),
      ])
    );
    rotateAnimation.start();

    // Pulse animation
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1.05,
            duration: 1500,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
        ]),
      ])
    );
    pulseAnimation.start();

    // Shimmer effect
    const shimmerAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );
    shimmerAnimation.start();

    return () => {
      rotateAnimation.stop();
      pulseAnimation.stop();
      shimmerAnimation.stop();
    };
  }, []);

  const rotateValue = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const shimmerTranslateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-400, 400],
  });

  return (
    <Animated.View style={[styles.availableJobsCard, { opacity: fadeAnim }]}>
      <BlurView intensity={40} tint="dark" style={styles.availableJobsBlur}>
        <Animated.View style={[
          styles.availableJobsContent,
          { transform: [{ scale: scaleAnim }] }
        ]}>
          {/* Gradient Background */}
          <View style={styles.availableJobsGradient}>
            <View style={styles.availableJobsGradientTop} />
            <View style={styles.availableJobsGradientBottom} />
          </View>

          {/* Shimmer overlay */}
          <Animated.View
            style={[
              styles.availableJobsShimmer,
              {
                transform: [{ translateX: shimmerTranslateX }],
              },
            ]}
          />

          {/* Header */}
          <View style={styles.availableJobsHeader}>
            <View style={styles.availableJobsHeaderLeft}>
              <Animated.View
                style={[
                  styles.availableJobsIconContainer,
                  {
                    transform: [
                      { rotate: rotateValue },
                    ],
                  },
                ]}
              >
                <Animated.View
                  style={[
                    styles.availableJobsIconWrapper,
                    {
                      transform: [{ scale: pulseAnim }],
                    },
                  ]}
                >
                  <Ionicons name="cube" size={32} color="#FFFFFF" />
                  <View style={styles.availableJobsIconGlow} />
                </Animated.View>
              </Animated.View>
              <View style={styles.availableJobsHeaderText}>
                <View style={styles.availableJobsTitleRow}>
                  <Text style={styles.availableJobsTitle}>Available Jobs</Text>
                  <View style={styles.availableJobsBadge}>
                    <Text style={styles.availableJobsBadgeText}>{totalCount}</Text>
                  </View>
                </View>
                <Text style={styles.availableJobsSubtitle}>
                  {totalCount === 1 ? '1 job waiting' : `${totalCount} jobs waiting for you`}
                </Text>
              </View>
            </View>
          </View>

          {/* Gradient separator */}
          <View style={styles.availableJobsSeparator} />

          {/* Jobs List */}
          <View style={styles.availableJobsList}>
            {jobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                onPress={() => onJobPress(job.id)}
              />
            ))}
          </View>
        </Animated.View>
      </BlurView>
    </Animated.View>
  );
};

// Admin Story Component
const AdminStory: React.FC = () => {
  const [currentStory, setCurrentStory] = useState<any>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    loadCurrentStory();

    // Listen for real-time story updates
    const storyChannel = pusherService.subscribeToChannel('admin-stories');

    storyChannel.bind('story-created', (data: any) => {
      console.log('📡 Story created:', data);
      if (data.story.isActive) {
        setCurrentStory(data.story);
      }
    });

    storyChannel.bind('story-updated', (data: any) => {
      console.log('📡 Story updated:', data);
      if (data.story.isActive) {
        setCurrentStory(data.story);
      } else if (currentStory?.id === data.story.id) {
        // If the current story was deactivated, clear it
        setCurrentStory(null);
      }
    });

    storyChannel.bind('story-deleted', (data: any) => {
      console.log('📡 Story deleted:', data);
      if (currentStory?.id === data.storyId) {
        setCurrentStory(null);
      }
    });

    return () => {
      pusherService.unsubscribeFromChannel('admin-stories');
    };
  }, [currentStory]);

  const loadCurrentStory = async () => {
    try {
      const response = await apiService.get('/api/admin/stories/current');
          if (response.success && response.data?.story) {
            console.log('🎥 STORY DATA RECEIVED:', {
              id: response.data.story.id,
              type: response.data.story.type,
              mediaUrl: response.data.story.mediaUrl,
              hasMediaUrl: !!response.data.story.mediaUrl,
              title: response.data.story.title,
              content: response.data.story.content?.substring(0, 100) + '...'
            });
            setCurrentStory(response.data.story);
            setImageLoadError(false); // Reset error state for new story
          }
    } catch (error) {
      console.warn('Failed to load admin story:', error);
    }
  };

  const handleStoryPress = () => {
    if (currentStory) {
      setIsModalVisible(true);
      // Check if user has liked this story
      checkLikeStatus();
    } else {
      // Show message when no stories are available
      Alert.alert(
        'No Stories Available',
        'The admin hasn\'t posted any stories yet. Check back later!',
        [{ text: 'OK' }]
      );
    }
  };

  const checkLikeStatus = async () => {
    if (!currentStory || !user?.id) return;

    try {
      const response = await apiService.get(`/api/admin/stories/${currentStory.id}/like?userId=${user.id}&userType=driver`);
      if (response.success) {
        setIsLiked(response.data.isLiked);
      }
    } catch (error) {
      console.warn('Failed to check like status:', error);
    }
  };

  const handleLike = async () => {
    if (!currentStory || !user?.id || isLiking) return;

    setIsLiking(true);
    try {
      const action = isLiked ? 'unlike' : 'like';
      const response = await apiService.post(`/api/admin/stories/${currentStory.id}/like`, {
        action,
        userId: user.id,
        userType: 'driver',
      });

      if (response.success) {
        setIsLiked(!isLiked);
        // Update local stats
        setCurrentStory(prev => ({
          ...prev,
          stats: {
            ...prev.stats,
            likeCount: prev.stats.likeCount + (action === 'like' ? 1 : -1),
          },
        }));
      }
    } catch (error) {
      console.warn('Failed to toggle like:', error);
      Alert.alert('Error', 'Failed to update like status');
    } finally {
      setIsLiking(false);
    }
  };

  const handleShare = async () => {
    if (!currentStory || !user?.id || isSharing) return;

    setIsSharing(true);
    try {
      const response = await apiService.post(`/api/admin/stories/${currentStory.id}/share`, {
        userId: user.id,
        userType: 'driver',
        shareType: 'native',
      });

      if (response.success) {
        // Update local stats
        setCurrentStory(prev => ({
          ...prev,
          stats: {
            ...prev.stats,
            shareCount: prev.stats.shareCount + 1,
          },
        }));

        Alert.alert('Success', 'Story shared successfully!');
      }
    } catch (error) {
      console.warn('Failed to share story:', error);
      Alert.alert('Error', 'Failed to share story');
    } finally {
      setIsSharing(false);
    }
  };

  // Always show the story circle, even if no active story

  return (
    <>
      <TouchableOpacity
        style={styles.storyContainer}
        onPress={handleStoryPress}
        activeOpacity={0.8}
      >
        <View style={[
          styles.storyRing,
          !currentStory && styles.storyRingInactive
        ]}>
          <View style={[
            styles.storyAvatar,
            !currentStory && styles.storyAvatarInactive
          ]}>
            <Text style={[
              styles.storyAvatarText,
              !currentStory && styles.storyAvatarTextInactive
            ]}>A</Text>
          </View>
        </View>
        <Text style={[
          styles.storyLabel,
          !currentStory && styles.storyLabelInactive
        ]}>
          {currentStory ? 'Admin Story' : 'No Stories'}
        </Text>
      </TouchableOpacity>

      {/* Story Modal */}
      <Modal
        visible={isModalVisible && !!currentStory}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setIsModalVisible(false)}
      >
        {currentStory && (
          <View style={styles.storyModalOverlay}>
            <View style={styles.storyModalContent}>
              <TouchableOpacity
                style={styles.storyCloseButton}
                onPress={() => setIsModalVisible(false)}
              >
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>

              <View style={styles.storyHeader}>
                <View style={styles.storyHeaderAvatar}>
                  <Text style={styles.storyHeaderAvatarText}>A</Text>
                </View>
                <View style={styles.storyHeaderInfo}>
                  <Text style={styles.storyHeaderName}>Admin</Text>
                  <Text style={styles.storyHeaderTime}>
                    {new Date(currentStory.createdAt).toLocaleDateString()}
                  </Text>
                </View>
                <View style={styles.storyStats}>
                  <View style={styles.statItem}>
                    <Ionicons name="eye-outline" size={14} color="#666" />
                    <Text style={styles.statText}>{currentStory.stats?.viewCount || 0}</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Ionicons name="heart" size={14} color="#FF6B6B" />
                    <Text style={styles.statText}>{currentStory.stats?.likeCount || 0}</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Ionicons name="share-outline" size={14} color="#666" />
                    <Text style={styles.statText}>{currentStory.stats?.shareCount || 0}</Text>
                  </View>
                </View>
              </View>

              {/* Interaction Buttons */}
              <View style={styles.storyActions}>
                <TouchableOpacity
                  style={[styles.actionButton, isLiked && styles.actionButtonLiked]}
                  onPress={handleLike}
                  disabled={isLiking}
                >
                  <Ionicons
                    name={isLiked ? "heart" : "heart-outline"}
                    size={24}
                    color={isLiked ? "#FF6B6B" : "#666"}
                  />
                  <Text style={[styles.actionButtonText, isLiked && styles.actionButtonTextLiked]}>
                    {isLiked ? 'Liked' : 'Like'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={handleShare}
                  disabled={isSharing}
                >
                  <Ionicons name="share-outline" size={24} color="#666" />
                  <Text style={styles.actionButtonText}>Share</Text>
                </TouchableOpacity>
              </View>

            <ScrollView style={styles.storyContent}>
              {(() => {
                console.log('🎬 RENDERING STORY:', {
                  type: currentStory.type,
                  hasMediaUrl: !!currentStory.mediaUrl,
                  mediaUrl: currentStory.mediaUrl,
                  contentLength: currentStory.content?.length || 0
                });

                if (currentStory.type === 'text') {
                  console.log('📝 Rendering as TEXT');
                  return <Text style={styles.storyText}>{currentStory.content}</Text>;
                }

                if (currentStory.type === 'image' && currentStory.mediaUrl && !imageLoadError) {
                  console.log('🖼️ Rendering as IMAGE');
                  return (
                    <Image
                      source={{ uri: currentStory.mediaUrl }}
                      style={styles.storyImage}
                      resizeMode="cover"
                      onLoad={() => {
                        console.log('✅ Image loaded successfully');
                        setImageLoadError(false);
                      }}
                      onError={(error) => {
                        console.log('❌ Image failed to load:', error);
                        setImageLoadError(true);
                        // Don't alert - just fall back to text content
                      }}
                    />
                  );
                }

                if (currentStory.type === 'video' && currentStory.mediaUrl) {
                  console.log('🎥 Rendering as VIDEO');
                  return (
                    <Video
                      source={{ uri: currentStory.mediaUrl }}
                      style={styles.storyVideo}
                      resizeMode="cover"
                      shouldPlay={true}
                      isLooping={false}
                      useNativeControls={true}
                    />
                  );
                }

                // Fallback: render as text if type is unknown, no mediaUrl, or image failed to load
                console.log('📄 Fallback: Rendering as TEXT', {
                  type: currentStory.type,
                  hasMediaUrl: !!currentStory.mediaUrl,
                  imageLoadError
                });
                return <Text style={styles.storyText}>{currentStory.content}</Text>;
              })()}

              {currentStory.title && (
                <Text style={styles.storyTitle}>{currentStory.title}</Text>
              )}
            </ScrollView>
          </View>
        </View>
        )}
      </Modal>
    </>
  );
};

export default function DashboardScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const {
    currentLocation,
    permissions,
    isTracking,
    requestPermissions,
    startTracking,
    stopTracking,
    refreshLocation,
  } = useLocation();

  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [isSearchingJobs, setIsSearchingJobs] = useState(false);
  // Job assignment state is now handled globally in JobAssignmentContext

  useEffect(() => {
    // Clear all cached data on mount to ensure fresh data
    console.log('🧹 Clearing all cached data on dashboard mount');
    setDashboardData(null);
    setIsOnline(false);
    setIsSearchingJobs(false);
    
    // Add a small delay to ensure state is cleared before loading
    setTimeout(() => {
      loadDashboard(true); // Force refresh on mount
    }, 100);
    
    // ✅ DO NOT auto-request location on mount
    // Location tracking will start when driver goes online
    // requestLocationPermissionsAutomatically(); ← REMOVED
    
    // Initialize notification service
    notificationService.initialize();

    return () => {
      notificationService.cleanup();
    };
  }, []);

  // Force refresh dashboard when app becomes active (to clear cached data)
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active') {
        console.log('🔄 App became active - refreshing dashboard data');
        loadDashboard();
      }
      
      // ✅ CRITICAL: Do NOT change online status when app goes to background
      // Driver should stay online even if they switch to Maps, Phone, etc.
      // Only explicit user toggle should change online status
      console.log(`📱 App state changed to: ${nextAppState} (keeping online status: ${isOnline})`);
    };

    // Add app state change listener
    const { AppState } = require('react-native');
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription?.remove();
    };
  }, [isOnline]);

  // ✅ Location permissions are now requested ONLY when driver goes online
  // This prevents 403 errors when driver is offline

  useEffect(() => {
    console.log('🔍 Dashboard user state:', {
      hasUser: !!user,
      userName: user?.name,
      hasDriver: !!user?.driver,
      driverStatus: user?.driver?.status,
      isOnline,
    });

    // Update searching status based on online state
    if (isOnline && user?.driver?.status === 'active') {
      // Always show searching when online (will hide when job assigned via modal)
      console.log('✅ Setting isSearchingJobs to TRUE');
      setIsSearchingJobs(true);
    } else {
      console.log('❌ Setting isSearchingJobs to FALSE - isOnline:', isOnline, 'driverStatus:', user?.driver?.status);
      setIsSearchingJobs(false);
    }
  }, [isOnline, user]);

  // Initialize isOnline when user data is loaded and force refresh dashboard
  useEffect(() => {
    if (user?.driver?.id) {
      // Force refresh dashboard data when user changes (e.g., after login)
      console.log('🔄 User driver data loaded - refreshing dashboard');
      loadDashboard(true);
      
      // Note: Do NOT auto-set isOnline based on driver.status
      // isOnline should ONLY be controlled by:
      // 1. User manual toggle
      // 2. API response from /api/driver/availability
      // driver.status (active/inactive) is different from availability (online/offline)
    }
  }, [user?.driver?.id]);

  useEffect(() => {
    // Pusher job assignment listeners are now in JobAssignmentContext (global)
    // Dashboard only needs to refresh data when events occur
    if (user?.driver?.id && isOnline) {
      console.log('🔌 [Dashboard] Setting up data refresh listeners');
      pusherService.initialize(user.driver.id);

      // Listen for data refresh events only
      pusherService.onJobRemoved(async (data) => {
        console.log('📢 [Dashboard] JOB REMOVED (broadcast) - refreshing data');
        loadDashboard(true);
      });

      pusherService.onRouteRemoved(async (data) => {
        console.log('🗑️ [Dashboard] ROUTE REMOVED - refreshing data');
        loadDashboard(true);
      });

      pusherService.onRouteCancelled(async (data) => {
        console.log('🚫 [Dashboard] ROUTE CANCELLED - refreshing data');
        loadDashboard(true);
      });

      return () => {
        // Don't disconnect - global context needs Pusher connection
        // Just clean up local listeners
      };
    }
  }, [user, isOnline]);

  const loadDashboard = async (forceRefresh = false) => {
    try {
      console.log('🔄 Loading dashboard data...', forceRefresh ? '(force refresh)' : '');
      
      const response = await apiService.get<DashboardData>('/api/driver/dashboard');
      if (response.success && response.data) {
        console.log('✅ Dashboard data loaded successfully:', {
          driverStatus: response.data.driver?.status,
          assignedJobs: response.data.jobs?.assigned?.length || 0,
          availableJobs: response.data.jobs?.available?.length || 0
        });
        
        // Modal management is now handled globally in JobAssignmentContext
        // Dashboard just displays the data
        setDashboardData(response.data);
        
        // ✅ CRITICAL: NEVER auto-set isOnline from dashboard refresh
        // isOnline is ONLY controlled by user toggle in handleToggleOnlineStatus()
        // Do NOT touch isOnline here - it causes the toggle to revert!
        
      } else {
        console.error('❌ Dashboard API error:', response.error);
        Alert.alert('Error', response.error || 'Failed to load dashboard');
      }
    } catch (error: any) {
      console.error('❌ Dashboard load exception:', error);
      Alert.alert('Error', error.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
        loadDashboard(true); // Force refresh to clear cache
        // AI will automatically update via AIDashboardSection when jobs change
    refreshLocation();
  };

  const handleToggleOnlineStatus = async (newStatus: boolean) => {
    // Play button click sound
    soundService.playButtonClick();
    
    try {
      console.log(`🔄 Toggling status to: ${newStatus ? 'ONLINE' : 'OFFLINE'}`);
      
      // Update local state immediately for better UX
      setIsOnline(newStatus);

      // Call backend to update driver availability
      const response = await apiService.post('/api/driver/status', {
        status: newStatus ? 'online' : 'offline',
      });

      if (!response.success) {
        // Revert if API call fails
        setIsOnline(!newStatus);
        soundService.playError();
        Alert.alert('Error', response.error || 'Failed to update status');
        return;
      }

      console.log(`✅ Status updated successfully to ${newStatus ? 'ONLINE' : 'OFFLINE'}`);
      soundService.playSuccess();

      // ✅ CRITICAL: Auto-refresh dashboard to get updated job list
      if (newStatus) {
        console.log('🔍 Driver went ONLINE - refreshing job list...');
        
        // Small delay to allow backend to process BEFORE starting tracking
        setTimeout(async () => {
          loadDashboard(true); // Force refresh
          
          // Start location tracking AFTER backend is ready (1 second delay)
          if (permissions.granted) {
            setTimeout(async () => {
              await startTracking();
              console.log('✅ Location tracking started after backend ready');
            }, 1000);
          }
        }, 500);
      } else {
        console.log('⚪ Driver went OFFLINE - clearing job list');
        // Stop location tracking when going offline
        await stopTracking();
        // Refresh to remove jobs that require online status
        loadDashboard(true);
      }

    } catch (error: any) {
      console.error('❌ Error toggling status:', error);
      // Revert if error occurs
      setIsOnline(!newStatus);
      Alert.alert('Error', error.message || 'Failed to update status');
    }
  };


  // Job assignment handlers are now in GlobalJobAssignmentModal

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <AnimatedScreen>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
        <View style={styles.headerContent}>
          <AdminStory />
          <Text style={styles.subtitle}>Ready for your deliveries?</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Online/Offline Status Toggle - Enhanced */}
        <BlurView intensity={40} tint="dark" style={styles.statusCardBlur}>
          <View style={[
            styles.statusCard,
            isOnline ? styles.statusCardOnline : styles.statusCardOffline
          ]}>
            {/* Gradient Background */}
            {isOnline && (
              <View style={styles.statusGradient}>
                <View style={styles.statusGradientTop} />
                <View style={styles.statusGradientBottom} />
              </View>
            )}

            <View style={styles.statusHeader}>
              <View style={styles.statusInfo}>
                <View style={styles.statusTitleRow}>
                  <View style={[styles.statusIndicator, isOnline && styles.statusIndicatorOnline]}>
                    {isOnline ? (
                      <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
                    ) : (
                      <Ionicons name="close-circle" size={24} color="#FFFFFF" />
                    )}
                  </View>
                  <View style={styles.statusTextContainer}>
                    <Text style={styles.statusTitle}>
                      {isOnline ? 'Online' : 'Offline'}
                    </Text>
                    <Text style={styles.statusSubtitle}>
                      {isOnline ? 'Available for new jobs' : 'Not receiving jobs'}
                    </Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity
                style={[styles.statusToggle, isOnline && styles.statusToggleActive]}
                onPress={() => handleToggleOnlineStatus(!isOnline)}
                activeOpacity={0.7}
              >
                <View style={[styles.statusToggleKnob, isOnline && styles.statusToggleKnobActive]} />
              </TouchableOpacity>
            </View>
            <View style={styles.statusHintContainer}>
              <View style={styles.statusHintRow}>
                {isOnline ? (
                  <>
                    <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                    <Text style={[styles.statusHint, styles.statusHintActive]}>
                      System is searching for routes and orders for you
                    </Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="warning" size={16} color="#F59E0B" />
                    <Text style={styles.statusHint}>
                      Tap the toggle to go online and start receiving jobs
                    </Text>
                  </>
                )}
              </View>
            </View>
          </View>
        </BlurView>

        {/* Animated Search Indicator - Shows when online and searching */}
        {isOnline && (
          <OnlineIndicator 
            visible={true} 
            isSearching={true} 
          />
        )}

        {/* Statistics */}
        <View style={styles.section}>
          <AnimatedSectionTitle />
          <View style={styles.statsGrid}>
            <View style={styles.statsRow}>
              <StatsCard
                title="Assigned"
                value={(dashboardData?.statistics as any)?.totalAssigned || dashboardData?.statistics.assignedJobs || 0}
                color={colors.primary}
                subtitle={
                  (dashboardData?.statistics as any)?.assignedRoutes > 0 
                    ? `${dashboardData.statistics.assignedJobs || 0} orders, ${(dashboardData.statistics as any).assignedRoutes || 0} routes`
                    : undefined
                }
              />
              <StatsCard
                title="Available Jobs"
                value={dashboardData?.statistics.availableJobs || 0}
                color={colors.success}
              />
            </View>
            <View style={styles.statsRow}>
              <StatsCard
                title="Completed Today"
                value={dashboardData?.statistics.completedToday || 0}
                color={colors.accent}
              />
              <StatsCard
                title="Total Earnings"
                value={formatCurrency(dashboardData?.statistics.totalEarnings || 0)}
                color={colors.success}
              />
            </View>
          </View>
        </View>

        {/* AI Assistant Section */}
        <AIDashboardSection
          activeJobs={dashboardData?.jobs.assigned?.map(job => ({
            id: job.id,
            reference: job.reference,
            pickup: {
              address: (job as any).addresses?.pickup?.line1 || (job as any).from || 'Pickup location',
              lat: (job as any).addresses?.pickup?.coordinates?.lat || 0,
              lng: (job as any).addresses?.pickup?.coordinates?.lng || 0,
              time: (job as any).schedule?.date || new Date().toISOString(),
            },
            dropoff: {
              address: (job as any).addresses?.dropoff?.line1 || (job as any).to || 'Drop-off location',
              lat: (job as any).addresses?.dropoff?.coordinates?.lat || 0,
              lng: (job as any).addresses?.dropoff?.coordinates?.lng || 0,
              time: (job as any).schedule?.date || new Date().toISOString(),
            },
            earnings: (job as any).pricing?.estimatedEarnings || (job as any).earnings || '£0.00',
            priority: (job as any).priority || 'medium',
            vehicleType: (job as any).crewRecommendation?.vehicleType || (job as any).vehicleType || 'Van',
          })) || []}
          onSuggestionAction={(action, suggestionId) => {
            // Handle AI suggestion actions
            console.log('Dashboard AI Action:', action, suggestionId);
            // You can add specific handling here for dashboard-specific actions
          }}
        />

        {/* Assigned Jobs */}
        {dashboardData?.jobs.assigned && dashboardData.jobs.assigned.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Assigned Jobs</Text>
            {dashboardData.jobs.assigned.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                onPress={() => router.push(`/job/${job.id}`)}
              />
            ))}
          </View>
        )}

        {/* Available Jobs - Enhanced */}
        {dashboardData?.jobs.available && dashboardData.jobs.available.length > 0 && (
          <AvailableJobsCard
            jobs={dashboardData.jobs.available.slice(0, 3)}
            totalCount={dashboardData.statistics.availableJobs || 0}
            onJobPress={(jobId) => router.push(`/job/${jobId}`)}
          />
        )}

        {/* Empty State */}
        {(!dashboardData?.jobs.assigned || dashboardData.jobs.assigned.length === 0) &&
          (!dashboardData?.jobs.available || dashboardData.jobs.available.length === 0) && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateIcon}>📦</Text>
              <Text style={styles.emptyStateTitle}>No Jobs Available</Text>
              <Text style={styles.emptyStateText}>
                Check back later for new delivery opportunities
              </Text>
            </View>
          )}
      </ScrollView>

      {/* Job Assignment Modal */}
      {/* Job Assignment Modal is now handled globally - see GlobalJobAssignmentModal in _layout.tsx */}
      </View>
    </AnimatedScreen>
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
  loadingText: {
    fontSize: 15,
    color: '#6B7280',
    marginTop: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: 'transparent',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  headerContent: {
    alignItems: 'center',
  },
  // Story styles
  storyContainer: {
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  storyRing: {
    width: 70,
    height: 70,
    borderRadius: 35,
    padding: 3,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#FF9500', // Gradient-like effect
    shadowColor: '#FF9500',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 5,
  },
  storyAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: 32,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyAvatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  storyLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  storyModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  storyModalContent: {
    width: '90%',
    height: '80%',
    backgroundColor: '#000000',
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  storyCloseButton: {
    position: 'absolute',
    top: spacing.lg,
    right: spacing.lg,
    zIndex: 10,
    padding: spacing.sm,
  },
  storyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    paddingTop: spacing.xxl,
  },
  storyHeaderAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  storyHeaderAvatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  storyHeaderName: {
    ...typography.headline,
    color: '#FFFFFF',
    flex: 1,
  },
  storyHeaderTime: {
    ...typography.caption1,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  storyContent: {
    flex: 1,
    padding: spacing.lg,
  },
  storyTitle: {
    ...typography.title1,
    color: '#FFFFFF',
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  storyText: {
    ...typography.body,
    color: '#FFFFFF',
    lineHeight: 24,
    textAlign: 'center',
  },
  storyImage: {
    width: '100%',
    height: 300,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
  },
  storyVideo: {
    width: '100%',
    height: 300,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
  },
  // Story interaction styles
  storyHeaderInfo: {
    flex: 1,
  },
  storyStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
  },
  storyActions: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.lg,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    gap: spacing.xs,
  },
  actionButtonLiked: {
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
  },
  actionButtonText: {
    fontSize: 14,
    color: '#999',
    fontWeight: '500',
  },
  actionButtonTextLiked: {
    color: '#FF6B6B',
  },
  // Inactive story styles
  storyRingInactive: {
    borderColor: '#666',
    shadowColor: '#666',
    shadowOpacity: 0.2,
  },
  storyAvatarInactive: {
    backgroundColor: '#666',
  },
  storyAvatarTextInactive: {
    color: '#999',
  },
  storyLabelInactive: {
    color: '#999',
  },
  subtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
    marginTop: 2,
    opacity: 0.8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    gap: 20,
    paddingBottom: 40,
  },
  statusCardBlur: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    marginBottom: spacing.lg,
    ...shadows.lg,
  },
  statusCard: {
    ...glassEffect.medium,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    borderWidth: 2.5,
    borderColor: colors.danger,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    position: 'relative',
    overflow: 'hidden',
    ...shadows.glow.red,
  },
  statusCardOnline: {
    borderColor: colors.success,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    ...shadows.glow.green,
  },
  statusGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.3,
    zIndex: 0,
  },
  statusGradientTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: 'rgba(16, 185, 129, 0.3)',
  },
  statusGradientBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: 'rgba(5, 150, 105, 0.2)',
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    zIndex: 2,
  },
  statusInfo: {
    flex: 1,
  },
  statusTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  statusIndicator: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(239, 68, 68, 0.3)',
    borderWidth: 2.5,
    borderColor: colors.danger,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.glow.red,
  },
  statusIndicatorOnline: {
    backgroundColor: 'rgba(16, 185, 129, 0.3)',
    borderColor: colors.success,
    ...shadows.glow.green,
  },
  statusTextContainer: {
    flex: 1,
  },
  statusTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.3,
    marginBottom: spacing.xs / 2,
  },
  statusSubtitle: {
    color: '#FFFFFF',
    fontSize: 15,
    opacity: 0.9,
    fontWeight: '500',
    lineHeight: 20,
  },
  statusToggle: {
    width: 60,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#E5E7EB',
    padding: 3,
    justifyContent: 'center',
  },
  statusToggleActive: {
    backgroundColor: '#10B981',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  statusToggleKnob: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  statusToggleKnobActive: {
    alignSelf: 'flex-end',
  },
  statusHintContainer: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    zIndex: 2,
  },
  statusHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  statusHint: {
    color: '#FFFFFF',
    fontSize: 14,
    opacity: 0.8,
    fontWeight: '500',
    flex: 1,
    lineHeight: 20,
  },
  statusHintActive: {
    color: '#10B981',
    fontWeight: '600',
  },
  section: {
    gap: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  trackingStatus: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    opacity: 0.8,
  },
  trackingActive: {
    color: '#10B981',
  },
  statsGrid: {
    gap: 12,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  emptyState: {
    alignItems: 'center',
    padding: 60,
    gap: 16,
    backgroundColor: 'rgba(30, 64, 175, 0.1)',
    borderRadius: 24,
    marginTop: 20,
    borderWidth: 3,
    borderColor: '#F59E0B',
    // Amber neon glow effect - iOS
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 20,
    // Amber neon glow effect - Android
    elevation: 14,
  },
  emptyStateIcon: {
    fontSize: 72,
    opacity: 0.5,
  },
  emptyStateTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#F59E0B',
    textShadowColor: 'rgba(245, 158, 11, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  emptyStateText: {
    fontSize: 15,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 22,
    opacity: 0.8,
  },
  // Available Jobs Card Styles
  availableJobsCard: {
    marginBottom: spacing.lg,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.lg,
  },
  availableJobsBlur: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  availableJobsContent: {
    ...glassEffect.medium,
    borderRadius: borderRadius.xl,
    borderWidth: 2.5,
    borderColor: colors.success,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    position: 'relative',
    overflow: 'hidden',
    ...shadows.glow.green,
  },
  availableJobsGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.3,
    zIndex: 0,
  },
  availableJobsGradientTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: 'rgba(16, 185, 129, 0.3)',
  },
  availableJobsGradientBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: 'rgba(5, 150, 105, 0.2)',
  },
  availableJobsShimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 150,
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    transform: [{ skewX: '-25deg' }],
    zIndex: 1,
  },
  availableJobsHeader: {
    padding: spacing.xl,
    paddingBottom: spacing.md,
    zIndex: 2,
  },
  availableJobsHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  availableJobsIconContainer: {
    width: 70,
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
  },
  availableJobsIconWrapper: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(16, 185, 129, 0.3)',
    borderWidth: 3,
    borderColor: colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    ...shadows.glow.green,
  },
  availableJobsIconGlow: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.success,
    opacity: 0.3,
    ...shadows.glow.green,
  },
  availableJobsHeaderText: {
    flex: 1,
  },
  availableJobsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  availableJobsTitle: {
    ...typography.title2,
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.3,
    flex: 1,
  },
  availableJobsBadge: {
    backgroundColor: colors.success,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    ...shadows.md,
  },
  availableJobsBadgeText: {
    ...typography.subheadline,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  availableJobsSubtitle: {
    ...typography.caption1,
    color: '#FFFFFF',
    fontSize: 14,
    opacity: 0.9,
    fontWeight: '500',
    lineHeight: 18,
  },
  availableJobsSeparator: {
    height: 2,
    backgroundColor: colors.success,
    opacity: 0.6,
    marginHorizontal: spacing.xl,
    borderRadius: 1,
    ...shadows.glow.green,
  },
  availableJobsList: {
    padding: spacing.xl,
    paddingTop: spacing.md,
    gap: spacing.md,
    zIndex: 2,
  },
});

