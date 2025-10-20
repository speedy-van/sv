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
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';

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

  useEffect(() => {
    loadJobDetails();
  }, [id]);

  const loadJobDetails = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      const response = await fetch(`https://speedy-van.co.uk/api/driver/jobs/${id}`, {
        headers: {
          'Authorization': `Bearer YOUR_TOKEN`, // Get from storage
        },
      });

      if (response.ok) {
        const data = await response.json();
        setJob(data.job);
      } else {
        Alert.alert('Error', 'Failed to load job details');
        router.back();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load job details');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    Alert.alert(
      'Accept Job',
      'Are you sure you want to accept this job?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          onPress: async () => {
            try {
              setActionLoading(true);
              const response = await fetch(
                `https://speedy-van.co.uk/api/driver/jobs/${id}/accept`,
                {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer YOUR_TOKEN`,
                  },
                }
              );

              if (response.ok) {
                Alert.alert('Success', 'Job accepted successfully', [
                  {
                    text: 'OK',
                    onPress: () => router.replace('/tabs/jobs'),
                  },
                ]);
              } else {
                Alert.alert('Error', 'Failed to accept job');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to accept job');
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
              const response = await fetch(
                `https://speedy-van.co.uk/api/driver/jobs/${id}/decline`,
                {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer YOUR_TOKEN`,
                  },
                  body: JSON.stringify({ reason: 'Not available' }),
                }
              );

              if (response.ok) {
                Alert.alert('Job Declined', 'You have declined this job', [
                  {
                    text: 'OK',
                    onPress: () => router.back(),
                  },
                ]);
              } else {
                Alert.alert('Error', 'Failed to decline job');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to decline job');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleStart = async () => {
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
              const response = await fetch(
                `https://speedy-van.co.uk/api/driver/jobs/${id}/start`,
                {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer YOUR_TOKEN`,
                  },
                }
              );

              if (response.ok) {
                Alert.alert('Success', 'Job started successfully');
                loadJobDetails();
              } else {
                Alert.alert('Error', 'Failed to start job');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to start job');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleComplete = async () => {
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
              const response = await fetch(
                `https://speedy-van.co.uk/api/driver/jobs/${id}/complete`,
                {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer YOUR_TOKEN`,
                  },
                  body: JSON.stringify({
                    completionNotes: 'Delivered successfully',
                  }),
                }
              );

              if (response.ok) {
                Alert.alert('Success', 'Job completed successfully', [
                  {
                    text: 'OK',
                    onPress: () => router.replace('/tabs/earnings'),
                  },
                ]);
              } else {
                Alert.alert('Error', 'Failed to complete job');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to complete job');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleCall = (phone: string) => {
    const phoneNumber = Platform.OS === 'ios' ? `telprompt:${phone}` : `tel:${phone}`;
    Linking.openURL(phoneNumber).catch(() => {
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
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Map */}
        <View style={styles.mapContainer}>
          <MapView
            provider={PROVIDER_GOOGLE}
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
        </View>

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
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
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
});

