import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CustomerTrackingIntegration from './CustomerTrackingIntegration';
import { openMapsNavigation } from '../utils/navigation.utils';

interface Drop {
  id: string;
  customerName: string;
  deliveryAddress: string;
  pickupAddress?: string;
  timeWindowStart: string;
  timeWindowEnd: string;
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'failed';
  serviceTier: 'economy' | 'standard' | 'premium';
  specialInstructions?: string;
  quotedPrice?: number;
  weight?: number;
  volume?: number;
}

interface RouteProgressProps {
  route: {
    id: string;
    status: 'planned' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
    drops: Drop[];
    estimatedDuration: number;
    estimatedDistance: number;
    estimatedEarnings: number;
    startTime: string;
    totalWorkers?: number;
    hasCameras?: boolean;
  };
  onCompleteDrop: (dropId: string) => void;
  onFailDrop: (dropId: string, reason: string) => void;
  onCompleteRoute: () => void;
  onNavigateToDrop: (drop: Drop) => void;
  onBackToRoutes: () => void;
}

const { width } = Dimensions.get('window');

export default function RouteProgressView({
  route,
  onCompleteDrop,
  onFailDrop,
  onCompleteRoute,
  onNavigateToDrop,
  onBackToRoutes,
}: RouteProgressProps) {
  const [currentDropIndex, setCurrentDropIndex] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Calculate progress
  const completedDrops = route.drops.filter(drop => drop.status === 'completed').length;
  const totalDrops = route.drops.length;
  const progressPercentage = totalDrops > 0 ? (completedDrops / totalDrops) * 100 : 0;
  const currentDrop = route.drops[currentDropIndex];
  const nextDrop = route.drops[currentDropIndex + 1];

  // Timer for elapsed time
  useEffect(() => {
    if (route.status === 'in_progress' && !startTime) {
      setStartTime(new Date());
    }

    const interval = setInterval(() => {
      if (startTime) {
        setElapsedTime(Math.floor((new Date().getTime() - startTime.getTime()) / 1000));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [route.status, startTime]);

  // Find current drop index
  useEffect(() => {
    const inProgressIndex = route.drops.findIndex(drop => drop.status === 'in_progress');
    if (inProgressIndex !== -1) {
      setCurrentDropIndex(inProgressIndex);
    } else {
      const nextPendingIndex = route.drops.findIndex(drop => drop.status === 'pending' || drop.status === 'assigned');
      if (nextPendingIndex !== -1) {
        setCurrentDropIndex(nextPendingIndex);
      }
    }
  }, [route.drops]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m ${secs}s`;
  };

  const formatTimeWindow = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleStartDrop = (drop: Drop) => {
    Alert.alert(
      'Start Drop',
      `Ready to start delivery to ${drop.customerName}?\n\nAddress: ${drop.deliveryAddress}\nTime Window: ${formatTimeWindow(drop.timeWindowStart)} - ${formatTimeWindow(drop.timeWindowEnd)}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start Delivery',
          onPress: () => {
            // Update drop status to in_progress
            onNavigateToDrop(drop);
          },
        },
      ]
    );
  };

  const handleCompleteDrop = (drop: Drop) => {
    Alert.alert(
      'Complete Drop',
      `Mark delivery to ${drop.customerName} as completed?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          onPress: () => {
            onCompleteDrop(drop.id);
          },
        },
      ]
    );
  };

  const handleFailDrop = (drop: Drop) => {
    Alert.alert(
      'Delivery Issue',
      `Report an issue with delivery to ${drop.customerName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Report Issue',
          onPress: () => {
            Alert.prompt(
              'Issue Details',
              'Please describe the issue:',
              (reason) => {
                if (reason && reason.trim()) {
                  onFailDrop(drop.id, reason.trim());
                }
              }
            );
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#10B981';
      case 'in_progress': return '#3B82F6';
      case 'failed': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return 'checkmark-circle';
      case 'in_progress': return 'radio-button-on';
      case 'failed': return 'close-circle';
      default: return 'radio-button-off';
    }
  };

  return (
    <View style={styles.container}>
      {/* Header with Progress */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBackToRoutes}>
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        
        <View style={styles.routeInfo}>
          <Text style={styles.routeTitle}>Route #{route.id.slice(-6)}</Text>
          <Text style={styles.routeSubtitle}>
            {completedDrops}/{totalDrops} drops completed
          </Text>
        </View>
        
        {route.status === 'in_progress' && (
          <View style={styles.timerContainer}>
            <Ionicons name="time" size={16} color="#3B82F6" />
            <Text style={styles.timerText}>{formatTime(elapsedTime)}</Text>
          </View>
        )}
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${progressPercentage}%` }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>
          {Math.round(progressPercentage)}% Complete
        </Text>
      </View>

      {/* Current Drop Card */}
      {currentDrop && (
        <View style={styles.currentDropCard}>
          <View style={styles.currentDropHeader}>
            <View style={styles.currentDropInfo}>
              <Text style={styles.currentDropTitle}>Current Stop</Text>
              <Text style={styles.currentDropNumberLabel}>
                {currentDropIndex + 1} of {totalDrops}
              </Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(currentDrop.status) }]}>
              <Text style={styles.statusBadgeText}>
                {currentDrop.status.toUpperCase()}
              </Text>
            </View>
          </View>

          <View style={styles.customerInfo}>
            <Text style={styles.customerName}>{currentDrop.customerName}</Text>
            <Text style={styles.deliveryAddress}>{currentDrop.deliveryAddress}</Text>
            
            <View style={styles.timeWindow}>
              <Ionicons name="time" size={14} color="#6B7280" />
              <Text style={styles.timeWindowText}>
                {formatTimeWindow(currentDrop.timeWindowStart)} - {formatTimeWindow(currentDrop.timeWindowEnd)}
              </Text>
            </View>

            {currentDrop.specialInstructions && (
              <View style={styles.specialInstructions}>
                <Ionicons name="information-circle" size={14} color="#F59E0B" />
                <Text style={styles.specialInstructionsText}>
                  {currentDrop.specialInstructions}
                </Text>
              </View>
            )}

            <View style={styles.serviceInfo}>
              <View style={styles.serviceTier}>
                <Text style={styles.serviceTierText}>{currentDrop.serviceTier}</Text>
              </View>
              {currentDrop.quotedPrice && (
                <Text style={styles.priceText}>£{currentDrop.quotedPrice.toFixed(2)}</Text>
              )}
            </View>
          </View>

          {/* Customer Tracking Integration */}
          {currentDrop.status === 'in_progress' && (
            <CustomerTrackingIntegration
              drop={currentDrop}
              onLocationUpdate={(lat, lng) => {
                // Handle location updates - could send to backend
                console.log('Location update:', lat, lng);
              }}
              onArrivalNotification={(dropId) => {
                console.log('Arrival notification sent for drop:', dropId);
              }}
              onDeliveryComplete={(dropId) => {
                handleCompleteDrop(currentDrop);
              }}
            />
          )}

          {/* Navigation Button */}
          <TouchableOpacity
            style={styles.navigationButton}
            onPress={async () => {
              await openMapsNavigation(currentDrop.deliveryAddress, currentDrop.customerName);
            }}
          >
            <Ionicons name="navigate" size={20} color="#FFFFFF" />
            <Text style={styles.navigationButtonText}>Open in Maps</Text>
          </TouchableOpacity>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            {currentDrop.status === 'pending' || currentDrop.status === 'assigned' ? (
              <TouchableOpacity
                style={styles.startButton}
                onPress={() => handleStartDrop(currentDrop)}
              >
                <Ionicons name="play" size={20} color="#FFFFFF" />
                <Text style={styles.startButtonText}>Start Delivery</Text>
              </TouchableOpacity>
            ) : currentDrop.status === 'in_progress' ? (
              <View style={styles.inProgressActions}>
                <TouchableOpacity
                  style={styles.completeButton}
                  onPress={() => handleCompleteDrop(currentDrop)}
                >
                  <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                  <Text style={styles.completeButtonText}>Complete</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.failButton}
                  onPress={() => handleFailDrop(currentDrop)}
                >
                  <Ionicons name="close" size={20} color="#FFFFFF" />
                  <Text style={styles.failButtonText}>Issue</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        </View>
      )}

      {/* Route Summary */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Route Summary</Text>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Ionicons name="location" size={16} color="#6B7280" />
            <Text style={styles.summaryLabel}>Distance:</Text>
            <Text style={styles.summaryValue}>{route.estimatedDistance.toFixed(1)} miles</Text>
          </View>
          <View style={styles.summaryItem}>
            <Ionicons name="time" size={16} color="#6B7280" />
            <Text style={styles.summaryLabel}>Duration:</Text>
            <Text style={styles.summaryValue}>
              {Math.floor(route.estimatedDuration / 60)}h {route.estimatedDuration % 60}m
            </Text>
          </View>
        </View>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Ionicons name="cash" size={16} color="#10B981" />
            <Text style={styles.summaryLabel}>Earnings:</Text>
            <Text style={styles.summaryValue}>£{route.estimatedEarnings.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Ionicons name="people" size={16} color="#6B7280" />
            <Text style={styles.summaryLabel}>Workers:</Text>
            <Text style={styles.summaryValue}>{route.totalWorkers || 1}</Text>
          </View>
        </View>
      </View>

      {/* All Drops List */}
      <View style={styles.dropsList}>
        <Text style={styles.dropsListTitle}>All Stops</Text>
        <ScrollView style={styles.dropsScrollView}>
          {route.drops.map((drop, index) => (
            <View key={drop.id} style={[
              styles.dropItem,
              index === currentDropIndex && styles.currentDropItem,
              drop.status === 'completed' && styles.completedDropItem,
            ]}>
              <View style={styles.dropItemLeft}>
                <View style={[
                  styles.dropNumber,
                  drop.status === 'completed' && styles.completedDropNumber,
                  drop.status === 'in_progress' && styles.currentDropNumber,
                ]}>
                  <Text style={[
                    styles.dropNumberText,
                    drop.status === 'completed' && styles.completedDropNumberText,
                    drop.status === 'in_progress' && styles.currentDropNumberText,
                  ]}>
                    {index + 1}
                  </Text>
                </View>
                <View style={styles.dropItemInfo}>
                  <Text style={[
                    styles.dropCustomerName,
                    drop.status === 'completed' && styles.completedText,
                  ]}>
                    {drop.customerName}
                  </Text>
                  <Text style={[
                    styles.dropAddress,
                    drop.status === 'completed' && styles.completedText,
                  ]}>
                    {drop.deliveryAddress.split(',')[0]}
                  </Text>
                  <Text style={styles.dropTime}>
                    {formatTimeWindow(drop.timeWindowStart)} - {formatTimeWindow(drop.timeWindowEnd)}
                  </Text>
                </View>
              </View>
              <View style={styles.dropItemRight}>
                <Ionicons 
                  name={getStatusIcon(drop.status)} 
                  size={24} 
                  color={getStatusColor(drop.status)} 
                />
              </View>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Complete Route Button */}
      {completedDrops === totalDrops && (
        <TouchableOpacity
          style={styles.completeRouteButton}
          onPress={onCompleteRoute}
        >
          <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
          <Text style={styles.completeRouteButtonText}>Complete Route</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  routeInfo: {
    flex: 1,
  },
  routeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  routeSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF8FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  timerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
    marginLeft: 4,
  },
  progressContainer: {
    marginBottom: 20,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
  },
  currentDropCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  currentDropHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  currentDropInfo: {
    flex: 1,
  },
  currentDropTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  currentDropNumberLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  customerInfo: {
    marginBottom: 16,
  },
  customerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  deliveryAddress: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 8,
  },
  timeWindow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  timeWindowText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  specialInstructions: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF3C7',
    padding: 8,
    borderRadius: 6,
    marginBottom: 8,
  },
  specialInstructionsText: {
    fontSize: 12,
    color: '#92400E',
    marginLeft: 4,
    flex: 1,
  },
  serviceInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  serviceTier: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  serviceTierText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#1E40AF',
    textTransform: 'uppercase',
  },
  priceText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10B981',
  },
  navigationButton: {
    backgroundColor: '#3B82F6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  navigationButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  actionButtons: {
    marginTop: 8,
  },
  startButton: {
    backgroundColor: '#3B82F6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  inProgressActions: {
    flexDirection: 'row',
    gap: 8,
  },
  completeButton: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
    gap: 8,
  },
  completeButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  failButton: {
    backgroundColor: '#EF4444',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
    gap: 8,
  },
  failButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
    marginRight: 4,
  },
  summaryValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#111827',
  },
  dropsList: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dropsListTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  dropsScrollView: {
    flex: 1,
  },
  dropItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  currentDropItem: {
    backgroundColor: '#EBF8FF',
    marginHorizontal: -16,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  completedDropItem: {
    opacity: 0.7,
  },
  dropItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dropNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  currentDropNumber: {
    backgroundColor: '#3B82F6',
  },
  completedDropNumber: {
    backgroundColor: '#10B981',
  },
  dropNumberText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#6B7280',
  },
  currentDropNumberText: {
    color: '#FFFFFF',
  },
  completedDropNumberText: {
    color: '#FFFFFF',
  },
  dropItemInfo: {
    flex: 1,
  },
  dropCustomerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  dropAddress: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  dropTime: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  completedText: {
    textDecorationLine: 'line-through',
  },
  dropItemRight: {
    marginLeft: 12,
  },
  completeRouteButton: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  completeRouteButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});
