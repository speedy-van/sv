import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useDriverStore } from '../store/driver.store';
import apiService from '../services/api.service';
import pusherService from '../services/pusher.service';
import { Job, DeclineJobResponse } from '../types';

export default function JobsScreen() {
  const navigation = useNavigation();
  const [activeFilter, setActiveFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // ✅ Use Zustand store
  const { 
    jobs, 
    setJobs, 
    removeJob, 
    declineJob,
    acceptJob,
    updateJob,
    setAcceptanceRate 
  } = useDriverStore();

  const filters = [
    { key: 'all', label: 'All' },
    { key: 'available', label: 'Available' },
    { key: 'assigned', label: 'Assigned' },
    { key: 'active', label: 'Active' },
  ];

  // ✅ Fetch jobs from real API
  const fetchJobs = async () => {
    try {
      setIsLoading(true);
      console.log('📥 Fetching jobs from API...');
      
      const response = await apiService.get('/api/driver/jobs') as any;
      
      if (response?.data?.success) {
        const fetchedJobs = response.data.jobs || [];
        console.log(`✅ Fetched ${fetchedJobs.length} jobs`);
        setJobs(fetchedJobs);
      } else {
        console.warn('⚠️ No jobs data in response');
        setJobs([]);
      }
    } catch (error: any) {
      console.error('❌ Error fetching jobs:', error);
      Alert.alert(
        'Connection Error',
        'Could not load jobs. Please check your internet connection.',
        [{ text: 'Retry', onPress: fetchJobs }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Load jobs on mount
  useEffect(() => {
    fetchJobs();
  }, []);

  // ✅ Listen to Pusher events for real-time updates
  useEffect(() => {
    console.log('👂 Setting up Pusher listeners for jobs...');
    
    // Event 1: Job removed (instant removal)
    pusherService.addEventListener('job-removed', (data: any) => {
      console.log('🗑️ Job removed event:', data);
      removeJob(data.jobId);
    });
    
    // Event 2: Job offer (new job assigned)
    pusherService.addEventListener('job-offer', (data: any) => {
      console.log('🎁 Job offer event:', data);
      // Refresh jobs list
      fetchJobs();
    });
    
    // Event 3: Acceptance rate updated
    pusherService.addEventListener('acceptance-rate-updated', (data: any) => {
      console.log('📉 Acceptance rate updated:', data);
      setAcceptanceRate(data.acceptanceRate);
    });
    
    // Event 4: Schedule updated
    pusherService.addEventListener('schedule-updated', (data: any) => {
      console.log('📅 Schedule updated:', data);
      if (data.type === 'job_removed') {
        removeJob(data.jobId);
      }
    });
    
    // Cleanup on unmount
    return () => {
      console.log('🧹 Cleaning up Pusher listeners for jobs');
      pusherService.removeEventListener('job-removed');
      pusherService.removeEventListener('job-offer');
      pusherService.removeEventListener('acceptance-rate-updated');
      pusherService.removeEventListener('schedule-updated');
    };
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return '#10B981';
      case 'assigned': return '#F59E0B';
      case 'active': return '#3B82F6';
      default: return '#6B7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available': return 'time';
      case 'assigned': return 'checkmark-circle';
      case 'active': return 'play-circle';
      default: return 'help-circle';
    }
  };

  // ✅ Real accept job handler
  const handleAcceptJob = (jobId: string) => {
    Alert.alert(
      'Accept Job',
      'Are you sure you want to accept this job?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Accept', 
          onPress: async () => {
            try {
              setIsSubmitting(true);
              console.log(`✅ Accepting job ${jobId}...`);
              
              const response = await apiService.post(`/api/driver/jobs/${jobId}/accept`, {}) as any;
              
              if (response?.data?.success) {
                // ✅ Update in Zustand store
                acceptJob(jobId);
                Alert.alert('Success', 'Job accepted successfully!');
              } else {
                throw new Error(response?.data?.message || 'Failed to accept job');
              }
            } catch (error: any) {
              console.error('❌ Error accepting job:', error);
              Alert.alert('Error', error.message || 'Could not accept job. Please try again.');
            } finally {
              setIsSubmitting(false);
            }
          }
        },
      ]
    );
  };

  // ✅ Real decline job handler - WITH ACCEPTANCE RATE UPDATE
  const handleDeclineJob = (jobId: string) => {
    Alert.alert(
      'Decline Job',
      'Declining will reduce your acceptance rate by 5%. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Decline',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsSubmitting(true);
              console.log(`🚫 Declining job ${jobId}...`);
              
              const response = await apiService.post(
                `/api/driver/jobs/${jobId}/decline`, 
                { reason: 'Driver declined' }
              ) as any;
              
              if (response?.data?.success) {
                // ✅ INSTANT REMOVAL from UI
                declineJob(jobId);
                
                // ✅ Update acceptance rate
                const newRate = response.data.acceptanceRate || response.data.data?.acceptanceRate;
                const change = response.data.change || response.data.data?.change;
                
                if (newRate !== undefined) {
                  setAcceptanceRate(newRate);
                  console.log(`✅ Job declined. Acceptance rate: ${newRate}%`);
                  
                  Alert.alert(
                    'Job Declined',
                    `The job has been removed and will be offered to another driver.\n\nAcceptance Rate: ${newRate}% (${change || -5}%)`
                  );
                } else {
                  Alert.alert('Job Declined', 'The job has been removed from your list.');
                }
              } else {
                throw new Error(response?.data?.message || 'Failed to decline job');
              }
            } catch (error: any) {
              console.error('❌ Error declining job:', error);
              Alert.alert('Error', error.message || 'Could not decline job. Please try again.');
            } finally {
              setIsSubmitting(false);
            }
          }
        },
      ]
    );
  };

  // ✅ Real start job handler
  const handleStartJob = (jobId: string) => {
    Alert.alert(
      'Start Job',
      'Are you ready to start this job?',
      [
        { text: 'Not Yet', style: 'cancel' },
        { 
          text: 'Start', 
          onPress: async () => {
            try {
              setIsSubmitting(true);
              console.log(`🚀 Starting job ${jobId}...`);
              
              const response = await apiService.post(`/api/driver/jobs/${jobId}/start`, {}) as any;
              
              if (response?.data?.success) {
                // ✅ Update status in Zustand
                updateJob(jobId, { status: 'in_progress' as any });
                Alert.alert('Job Started', 'You are now on the job! Good luck!');
              } else {
                throw new Error(response?.data?.message || 'Failed to start job');
              }
            } catch (error: any) {
              console.error('❌ Error starting job:', error);
              Alert.alert('Error', error.message || 'Could not start job. Please try again.');
            } finally {
              setIsSubmitting(false);
            }
          }
        },
      ]
    );
  };

  const filteredJobs = activeFilter === 'all' 
    ? jobs 
    : jobs.filter(job => job.status === activeFilter);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Jobs</Text>
        <Text style={styles.subtitle}>Find your next delivery</Text>
      </View>

      {/* Filters */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filtersContainer}
        contentContainerStyle={styles.filtersContent}
      >
        {filters.map((filter) => (
          <TouchableOpacity
            key={filter.key}
            style={[
              styles.filterButton,
              activeFilter === filter.key && styles.filterButtonActive
            ]}
            onPress={() => setActiveFilter(filter.key)}
          >
            <Text style={[
              styles.filterText,
              activeFilter === filter.key && styles.filterTextActive
            ]}>
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Jobs List */}
      <ScrollView
        style={styles.jobsList}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={fetchJobs} />
        }
      >
        {filteredJobs.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="briefcase-outline" size={64} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>No jobs found</Text>
            <Text style={styles.emptySubtitle}>
              {activeFilter === 'all' 
                ? 'No jobs available at the moment'
                : `No ${activeFilter} jobs found`
              }
            </Text>
          </View>
        ) : (
          filteredJobs.map((job) => (
            <TouchableOpacity
              key={job.id}
              style={styles.jobCard}
              onPress={() => {
                // Navigate to job detail if route exists
                try {
                  (navigation.navigate as any)('JobDetail', { jobId: job.id });
                } catch (e) {
                  console.log('Navigation not available');
                }
              }}
            >
              <View style={styles.jobHeader}>
                <View style={styles.jobTitleContainer}>
                  <Text style={styles.jobTitle}>{(job as any).title || (job as any).pickupAddress || 'Job'}</Text>
                  <View style={styles.statusContainer}>
                    <Ionicons 
                      name={getStatusIcon(job.status)} 
                      size={16} 
                      color={getStatusColor(job.status)} 
                    />
                    <Text style={[
                      styles.statusText, 
                      { color: getStatusColor(job.status) }
                    ]}>
                      {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                    </Text>
                  </View>
                </View>
                <Text style={styles.jobPrice}>£{(job as any).price || (job as any).totalPrice || 0}</Text>
              </View>
              
              <Text style={styles.jobDescription}>{(job as any).description || (job as any).deliveryAddress || 'No description'}</Text>
              
              <View style={styles.jobDetails}>
                <View style={styles.detailItem}>
                  <Ionicons name="location" size={16} color="#6B7280" />
                  <Text style={styles.detailText}>{job.distance}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Ionicons name="time" size={16} color="#6B7280" />
                  <Text style={styles.detailText}>{job.time}</Text>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionButtons}>
                {job.status === 'available' && (
                  <>
                    <TouchableOpacity 
                      style={[styles.actionButton, styles.acceptButton]}
                      onPress={() => handleAcceptJob(job.id)}
                    >
                      <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                      <Text style={styles.acceptButtonText}>Accept</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.actionButton, styles.declineButton]}
                      onPress={() => handleDeclineJob(job.id)}
                    >
                      <Ionicons name="close" size={16} color="#FFFFFF" />
                      <Text style={styles.declineButtonText}>Decline</Text>
                    </TouchableOpacity>
                  </>
                )}
                {job.status === 'assigned' && (
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.startButton]}
                    onPress={() => handleStartJob(job.id)}
                  >
                    <Ionicons name="play" size={16} color="#FFFFFF" />
                    <Text style={styles.startButtonText}>Start Job</Text>
                  </TouchableOpacity>
                )}
                {((job.status as any) === 'active' || (job.status as any) === 'in_progress') && (
                  <View style={styles.activeJobContainer}>
                    <Ionicons name="radio" size={16} color="#10B981" />
                    <Text style={styles.activeJobText}>Job in Progress</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    padding: 24,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  filtersContainer: {
    marginBottom: 16,
  },
  filtersContent: {
    paddingHorizontal: 24,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  filterButtonActive: {
    backgroundColor: '#3B82F6',
  },
  filterText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  jobsList: {
    flex: 1,
    paddingHorizontal: 24,
  },
  jobCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  jobTitleContainer: {
    flex: 1,
  },
  jobTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  jobPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#10B981',
  },
  jobDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
    lineHeight: 20,
  },
  jobDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  acceptButton: {
    backgroundColor: '#10B981',
  },
  declineButton: {
    backgroundColor: '#EF4444',
  },
  startButton: {
    backgroundColor: '#3B82F6',
  },
  acceptButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  declineButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  activeJobContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  activeJobText: {
    color: '#10B981',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
});