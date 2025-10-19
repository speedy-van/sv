import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import jobService from '../services/job.service';
import { Job } from '../types';
import { RootStackParamList } from '../navigation/RootNavigator';

type JobDetailRouteProp = RouteProp<RootStackParamList, 'JobDetail'>;

export default function JobDetailScreen() {
  const route = useRoute<JobDetailRouteProp>();
  const navigation = useNavigation();
  const [job, setJob] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false); // 🔒 Prevent double-tap

  useEffect(() => {
    fetchJobDetail();
  }, []);

  const fetchJobDetail = async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching real job details for:', route.params.jobId);
      const response: any = await jobService.getJobDetail(route.params.jobId);
      console.log('✅ Real job data received:', response);
      setJob(response.data?.job || response.job || response);
    } catch (error) {
      console.error('❌ Failed to fetch job:', error);
      Alert.alert('Error', 'Failed to load job details');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    // 🔒 Prevent double-tap - Lock BEFORE showing Alert
    if (isProcessing) {
      console.log('⚠️ Already processing - ignoring duplicate tap');
      return;
    }
    
    // Set processing state immediately to prevent double-tap on Alert
    setIsProcessing(true);
    
    Alert.alert(
      'Accept Job',
      'Do you want to accept this job?',
      [
        { 
          text: 'Cancel', 
          style: 'cancel',
          onPress: () => {
            // Reset if user cancels
            setIsProcessing(false);
          }
        },
        {
          text: 'Accept',
          onPress: async () => {
            try {
              // isProcessing already set to true above
              await jobService.acceptJob(route.params.jobId);
              Alert.alert('Success', 'Job accepted successfully');
              navigation.goBack();
            } catch (error) {
              Alert.alert('Error', 'Failed to accept job');
            } finally {
              setIsProcessing(false);
            }
          },
        },
      ]
    );
  };

  const handleDecline = () => {
    // 🔒 Prevent double-tap - Lock BEFORE showing Alert
    if (isProcessing) {
      console.log('⚠️ Already processing - ignoring duplicate tap');
      return;
    }
    
    // Set processing state immediately to prevent double-tap on Alert
    setIsProcessing(true);
    
    Alert.alert(
      'Decline Job',
      'Why are you declining this job?',
      [
        { 
          text: 'Cancel', 
          style: 'cancel',
          onPress: () => {
            // Reset if user cancels
            setIsProcessing(false);
          }
        },
        {
          text: 'Too far',
          onPress: () => declineJob('Too far from current location'),
        },
        {
          text: 'Not available',
          onPress: () => declineJob('Not available at that time'),
        },
        {
          text: 'Other',
          onPress: () => declineJob('Other reason'),
        },
      ]
    );
  };

  const declineJob = async (reason: string) => {
    try {
      // isProcessing already set to true in handleDecline
      await jobService.declineJob(route.params.jobId, reason);
      Alert.alert('Success', 'Job declined');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to decline job');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStartJob = () => {
    // 🔒 Prevent double-tap
    if (isProcessing) {
      console.log('⚠️ Already processing - ignoring duplicate tap');
      return;
    }
    
    setIsProcessing(true);
    (navigation.navigate as any)('JobProgress', { jobId: route.params.jobId });
    // Reset after navigation
    setTimeout(() => setIsProcessing(false), 1000);
  };

  const openNavigation = (lat: number, lng: number, label: string) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    Linking.openURL(url);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading job details...</Text>
      </View>
    );
  }

  if (!job) {
    return (
      <View style={styles.centered}>
        <Ionicons name="alert-circle" size={64} color="#EF4444" />
        <Text style={styles.errorText}>Job not found</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchJobDetail}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Extract data from the correct structure
  const pickup = job.pickup || job.addresses?.pickup || job.properties?.pickup;
  const dropoff = job.dropoff || job.addresses?.dropoff || job.properties?.dropoff;
  const items = job.items || [];
  const schedule = job.schedule;
  const pricing = job.pricing || {};
  const logistics = job.logistics || {};
  const roadWarnings = job.roadWarnings || { hasWarnings: false, warnings: [] };
  const notes = job.notes || '';
  
  // ✅ Extract REAL driver earnings from pricing engine response
  // Priority: driverPayoutPence (direct) > pricing.driverPayoutPence > pricing.driverPayout (GBP)
  const driverEarningsPence = job.driverPayout || pricing.driverPayoutPence || (pricing.driverPayout ? pricing.driverPayout * 100 : null);
  const driverEarningsGBP = driverEarningsPence !== null ? (driverEarningsPence / 100).toFixed(2) : null;
  
  // ❌ FAIL VISIBLY if earnings are missing
  if (driverEarningsGBP === null || driverEarningsGBP === '0.00') {
    console.error('❌ CRITICAL: Driver earnings are missing or zero!', {
      jobId: job.id,
      reference: job.reference,
      driverPayout: job.driverPayout,
      pricingDriverPayoutPence: pricing.driverPayoutPence,
      pricingDriverPayout: pricing.driverPayout,
      fullPricing: pricing,
    });
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.reference}>#{job.reference || (job.id ? job.id.slice(-8) : 'Unknown')}</Text>
        <Text style={styles.customer}>{job.customer?.name || 'Customer'}</Text>
        {job.status && (
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(job.status) }]}>
            <Text style={styles.statusText}>{job.status.toUpperCase()}</Text>
          </View>
        )}
      </View>

      {/* Road Warnings - Priority Display */}
      {roadWarnings?.hasWarnings && roadWarnings.warnings.length > 0 && (
        <View style={styles.warningsCard}>
          <View style={styles.warningHeader}>
            <Ionicons name="warning" size={24} color="#F59E0B" />
            <Text style={styles.warningTitle}>Road Warnings</Text>
          </View>
          {roadWarnings.warnings.map((warning: string, index: number) => (
            <Text key={index} style={styles.warningText}>{warning}</Text>
          ))}
        </View>
      )}

      {/* Earnings Card - Most Important for Driver */}
      <View style={[
        styles.earningsCard,
        // ⚠️ Red background if earnings are missing or zero
        (driverEarningsGBP === null || driverEarningsGBP === '0.00') && { backgroundColor: '#FEE2E2', borderLeftColor: '#EF4444' }
      ]}>
        <Ionicons 
          name={(driverEarningsGBP === null || driverEarningsGBP === '0.00') ? "alert-circle" : "cash"} 
          size={32} 
          color={(driverEarningsGBP === null || driverEarningsGBP === '0.00') ? "#EF4444" : "#10B981"} 
        />
        <View style={styles.earningsInfo}>
          <Text style={styles.earningsLabel}>Your Earnings</Text>
          {driverEarningsGBP !== null && driverEarningsGBP !== '0.00' ? (
            <>
              <Text style={styles.earningsValue}>£{driverEarningsGBP}</Text>
              {pricing?.calculationNote && (
                <Text style={styles.estimateNote}>
                  {pricing.calculationNote}
                </Text>
              )}
            </>
          ) : (
            <Text style={[styles.earningsValue, { color: '#EF4444' }]}>
              ERROR: No earnings data
            </Text>
          )}
          {pricing?.warnings && pricing.warnings.length > 0 && (
            <Text style={styles.earningsWarning}>
              ⚠️ {pricing.warnings.length} note{pricing.warnings.length > 1 ? 's' : ''}
            </Text>
          )}
        </View>
        {logistics?.recommendedWorkers && (
          <View style={styles.workersInfo}>
            <Ionicons name="people" size={20} color="#6B7280" />
            <Text style={styles.workersText}>
              {logistics.requiredWorkers} {logistics.requiredWorkers > 1 ? 'workers' : 'worker'}
            </Text>
          </View>
        )}
      </View>
      
      {/* Earnings Breakdown (if available) */}
      {pricing?.earningsBreakdown && driverEarningsGBP && driverEarningsGBP !== '0.00' && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Earnings Breakdown</Text>
          
          {/* Distance Pay */}
          {pricing.earningsBreakdown.distanceEarningsGBP > 0 && (
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Distance Pay ({pricing.earningsBreakdown.distanceMiles?.toFixed(1)} miles)</Text>
              <Text style={styles.breakdownValue}>£{pricing.earningsBreakdown.distanceEarningsGBP?.toFixed(2)}</Text>
            </View>
          )}
          
          {/* Multi-drop Bonus */}
          {pricing.earningsBreakdown.multiDropBonusGBP > 0 && (
            <View style={styles.breakdownRow}>
              <Text style={[styles.breakdownLabel, { color: '#10B981' }]}>Multi-Drop Bonus</Text>
              <Text style={[styles.breakdownValue, { color: '#10B981' }]}>+£{pricing.earningsBreakdown.multiDropBonusGBP?.toFixed(2)}</Text>
            </View>
          )}
          
          {/* Handling & Waiting */}
          {pricing.earningsBreakdown.handlingEarningsGBP > 0 && (
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Loading/Unloading</Text>
              <Text style={styles.breakdownValue}>£{pricing.earningsBreakdown.handlingEarningsGBP?.toFixed(2)}</Text>
            </View>
          )}
          
          {pricing.earningsBreakdown.waitingTimeEarningsGBP > 0 && (
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Waiting Time</Text>
              <Text style={styles.breakdownValue}>£{pricing.earningsBreakdown.waitingTimeEarningsGBP?.toFixed(2)}</Text>
            </View>
          )}
          
          {/* Fuel Allowance */}
          {pricing.earningsBreakdown.fuelAllowanceGBP > 0 && (
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Fuel Allowance</Text>
              <Text style={styles.breakdownValue}>£{pricing.earningsBreakdown.fuelAllowanceGBP?.toFixed(2)}</Text>
            </View>
          )}
          
          {/* Reimbursements */}
          {(pricing.earningsBreakdown.tollReimbursementGBP > 0 || pricing.earningsBreakdown.parkingReimbursementGBP > 0) && (
            <>
              {pricing.earningsBreakdown.tollReimbursementGBP > 0 && (
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>Toll Reimbursement</Text>
                  <Text style={styles.breakdownValue}>£{pricing.earningsBreakdown.tollReimbursementGBP?.toFixed(2)}</Text>
                </View>
              )}
              {pricing.earningsBreakdown.parkingReimbursementGBP > 0 && (
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>Parking Reimbursement</Text>
                  <Text style={styles.breakdownValue}>£{pricing.earningsBreakdown.parkingReimbursementGBP?.toFixed(2)}</Text>
                </View>
              )}
            </>
          )}
          
          {/* Admin Bonus */}
          {pricing.earningsBreakdown.adminApprovedBonusGBP > 0 && (
            <View style={styles.breakdownRow}>
              <Text style={[styles.breakdownLabel, { color: '#10B981' }]}>Admin Bonus</Text>
              <Text style={[styles.breakdownValue, { color: '#10B981' }]}>+£{pricing.earningsBreakdown.adminApprovedBonusGBP?.toFixed(2)}</Text>
            </View>
          )}
          
          {/* Platform Fee */}
          {pricing.earningsBreakdown.platformFeeGBP > 0 && (
            <View style={styles.breakdownRow}>
              <Text style={[styles.breakdownLabel, { color: '#EF4444' }]}>Platform Fee (15%)</Text>
              <Text style={[styles.breakdownValue, { color: '#EF4444' }]}>-£{pricing.earningsBreakdown.platformFeeGBP?.toFixed(2)}</Text>
            </View>
          )}
          
          {/* Late Penalty */}
          {pricing.earningsBreakdown.latePenaltyGBP > 0 && (
            <View style={styles.breakdownRow}>
              <Text style={[styles.breakdownLabel, { color: '#EF4444' }]}>Late Penalty</Text>
              <Text style={[styles.breakdownValue, { color: '#EF4444' }]}>-£{pricing.earningsBreakdown.latePenaltyGBP?.toFixed(2)}</Text>
            </View>
          )}
          
          {/* Total */}
          <View style={[styles.breakdownRow, { borderTopWidth: 1, borderTopColor: '#E5E7EB', marginTop: 8, paddingTop: 8 }]}>
            <Text style={[styles.breakdownLabel, { fontWeight: '600' }]}>Net Earnings</Text>
            <Text style={[styles.breakdownValue, { fontWeight: 'bold', fontSize: 18, color: '#10B981' }]}>
              £{driverEarningsGBP}
            </Text>
          </View>
        </View>
      )}

      {/* Pickup Location */}
      <View style={styles.card}>
        <View style={styles.locationHeader}>
          <View style={styles.locationTitleRow}>
            <Ionicons name="ellipse" size={12} color="#10B981" />
            <Text style={styles.sectionTitle}>Pickup Location</Text>
          </View>
          <TouchableOpacity
            onPress={() => openNavigation(pickup?.coordinates?.lat, pickup?.coordinates?.lng, 'Pickup')}
            style={styles.navigateButton}
          >
            <Ionicons name="navigate" size={20} color="#3B82F6" />
          </TouchableOpacity>
        </View>
        
        <Text style={styles.addressText}>{pickup?.address}</Text>
        <Text style={styles.postcodeText}>{pickup?.postcode}</Text>

        {pickup?.property && (
          <View style={styles.propertyDetails}>
            <View style={styles.propertyRow}>
              <Ionicons name="business" size={16} color="#6B7280" />
              <Text style={styles.propertyText}>
                {pickup.property.buildingTypeDisplay || 'Property'}
              </Text>
            </View>
            
            {pickup.property.floors > 0 && (
              <View style={styles.propertyRow}>
                <Ionicons name="layers" size={16} color="#6B7280" />
                <Text style={styles.propertyText}>Floor {pickup.property.floors}</Text>
              </View>
            )}

            {pickup.property.flatNumber && (
              <View style={styles.propertyRow}>
                <Ionicons name="home" size={16} color="#6B7280" />
                <Text style={styles.propertyText}>Flat {pickup.property.flatNumber}</Text>
              </View>
            )}
            
            <View style={styles.propertyRow}>
              <Ionicons 
                name={pickup.property.hasElevator ? "checkmark-circle" : "close-circle"} 
                size={16} 
                color={pickup.property.hasElevator ? "#10B981" : "#EF4444"} 
              />
              <Text style={styles.propertyText}>
                {pickup.property.hasElevator ? 'Elevator available' : 'No elevator - stairs only'}
              </Text>
            </View>

            {pickup.property.accessNotes && (
              <View style={styles.accessNotesContainer}>
                <Ionicons name="information-circle" size={16} color="#3B82F6" />
                <Text style={styles.accessNotesText}>{pickup.property.accessNotes}</Text>
              </View>
            )}
          </View>
        )}

        {pickup?.zones && (pickup.zones.isULEZ || pickup.zones.isLEZ || pickup.zones.hasCongestionCharge) && (
          <View style={styles.zonesContainer}>
            {pickup.zones.isULEZ && (
              <View style={styles.zoneBadge}>
                <Text style={styles.zoneBadgeText}>ULEZ</Text>
              </View>
            )}
            {pickup.zones.isLEZ && (
              <View style={styles.zoneBadge}>
                <Text style={styles.zoneBadgeText}>LEZ</Text>
              </View>
            )}
            {pickup.zones.hasCongestionCharge && (
              <View style={styles.zoneBadge}>
                <Text style={styles.zoneBadgeText}>C-Charge</Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Dropoff Location */}
      <View style={styles.card}>
        <View style={styles.locationHeader}>
          <View style={styles.locationTitleRow}>
            <Ionicons name="ellipse" size={12} color="#EF4444" />
            <Text style={styles.sectionTitle}>Dropoff Location</Text>
          </View>
          <TouchableOpacity
            onPress={() => openNavigation(dropoff?.coordinates?.lat, dropoff?.coordinates?.lng, 'Dropoff')}
            style={styles.navigateButton}
          >
            <Ionicons name="navigate" size={20} color="#3B82F6" />
          </TouchableOpacity>
        </View>
        
        <Text style={styles.addressText}>{dropoff?.address}</Text>
        <Text style={styles.postcodeText}>{dropoff?.postcode}</Text>

        {dropoff?.property && (
          <View style={styles.propertyDetails}>
            <View style={styles.propertyRow}>
              <Ionicons name="business" size={16} color="#6B7280" />
              <Text style={styles.propertyText}>
                {dropoff.property.buildingTypeDisplay || 'Property'}
              </Text>
            </View>
            
            {dropoff.property.floors > 0 && (
              <View style={styles.propertyRow}>
                <Ionicons name="layers" size={16} color="#6B7280" />
                <Text style={styles.propertyText}>Floor {dropoff.property.floors}</Text>
              </View>
            )}

            {dropoff.property.flatNumber && (
              <View style={styles.propertyRow}>
                <Ionicons name="home" size={16} color="#6B7280" />
                <Text style={styles.propertyText}>Flat {dropoff.property.flatNumber}</Text>
              </View>
            )}
            
            <View style={styles.propertyRow}>
              <Ionicons 
                name={dropoff.property.hasElevator ? "checkmark-circle" : "close-circle"} 
                size={16} 
                color={dropoff.property.hasElevator ? "#10B981" : "#EF4444"} 
              />
              <Text style={styles.propertyText}>
                {dropoff.property.hasElevator ? 'Elevator available' : 'No elevator - stairs only'}
              </Text>
            </View>

            {dropoff.property.accessNotes && (
              <View style={styles.accessNotesContainer}>
                <Ionicons name="information-circle" size={16} color="#3B82F6" />
                <Text style={styles.accessNotesText}>{dropoff.property.accessNotes}</Text>
              </View>
            )}
          </View>
        )}

        {dropoff?.zones && (dropoff.zones.isULEZ || dropoff.zones.isLEZ || dropoff.zones.hasCongestionCharge) && (
          <View style={styles.zonesContainer}>
            {dropoff.zones.isULEZ && (
              <View style={styles.zoneBadge}>
                <Text style={styles.zoneBadgeText}>ULEZ</Text>
              </View>
            )}
            {dropoff.zones.isLEZ && (
              <View style={styles.zoneBadge}>
                <Text style={styles.zoneBadgeText}>LEZ</Text>
              </View>
            )}
            {dropoff.zones.hasCongestionCharge && (
              <View style={styles.zoneBadge}>
                <Text style={styles.zoneBadgeText}>C-Charge</Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Trip Details */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Trip Details</Text>
        <View style={styles.detailRow}>
          <Ionicons name="calendar" size={20} color="#6B7280" />
          <Text style={styles.detailLabel}>Date</Text>
          <Text style={styles.detailValue}>
            {schedule?.date 
              ? new Date(schedule.date).toLocaleDateString('en-GB') 
              : 'Not set'}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="time" size={20} color="#6B7280" />
          <Text style={styles.detailLabel}>Time</Text>
          <Text style={styles.detailValue}>
            {schedule?.timeSlot || 'Not set'}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="car" size={20} color="#6B7280" />
          <Text style={styles.detailLabel}>Distance</Text>
          <Text style={styles.detailValue}>
            {logistics?.distanceDisplay || `${logistics?.distance?.toFixed(1)} miles` || 'Calculating...'}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="hourglass" size={20} color="#6B7280" />
          <Text style={styles.detailLabel}>Duration</Text>
          <Text style={styles.detailValue}>
            {logistics?.estimatedDurationDisplay || `${logistics?.estimatedDuration}h` || 'Calculating...'}
          </Text>
        </View>
      </View>

      {/* Items to Move */}
      {items && items.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Items to Move ({items.length})</Text>
          {items.map((item: any, index: number) => (
            <View key={item.id || index} style={styles.itemCard}>
              <View style={styles.itemHeader}>
                <Ionicons name="cube" size={20} color="#3B82F6" />
                <Text style={styles.itemName}>{item.name}</Text>
              </View>
              <View style={styles.itemDetails}>
                <Text style={styles.itemDetail}>Qty: {item.quantity}</Text>
                <Text style={styles.itemDetail}>
                  Volume: {item.volumeDisplay || `${item.volume?.toFixed(2)} m³`}
                </Text>
              </View>
              {item.pictures && item.pictures.length > 0 && (
                <View style={styles.itemPictures}>
                  {item.pictures.slice(0, 3).map((pic: string, picIndex: number) => (
                    <Image 
                      key={picIndex} 
                      source={{ uri: pic }} 
                      style={styles.itemPicture}
                    />
                  ))}
                  {item.pictures.length > 3 && (
                    <View style={styles.morePictures}>
                      <Text style={styles.morePicturesText}>+{item.pictures.length - 3}</Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          ))}
          {logistics?.recommendedWorkers && (
            <View style={styles.recommendationBox}>
              <Ionicons name="people" size={20} color="#10B981" />
              <Text style={styles.recommendationText}>{logistics.recommendedWorkers}</Text>
            </View>
          )}
        </View>
      )}

      {/* Notes and Special Instructions */}
      {(notes?.customerNotes || notes?.cameraNote || notes?.specialInstructions) && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Notes & Instructions</Text>
          {notes.customerNotes && (
            <View style={styles.noteItem}>
              <Ionicons name="chatbox" size={18} color="#3B82F6" />
              <Text style={styles.noteText}>{notes.customerNotes}</Text>
            </View>
          )}
          {notes.cameraNote && (
            <View style={styles.noteItem}>
              <Ionicons name="videocam" size={18} color="#F59E0B" />
              <Text style={styles.noteText}>{notes.cameraNote}</Text>
            </View>
          )}
          {notes.specialInstructions && (
            <View style={styles.noteItem}>
              <Ionicons name="alert-circle" size={18} color="#EF4444" />
              <Text style={styles.noteText}>{notes.specialInstructions}</Text>
            </View>
          )}
        </View>
      )}

      {/* Contact Customer */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Customer Contact</Text>
        <View style={styles.contactButtons}>
          <TouchableOpacity
            style={[styles.contactButton, { backgroundColor: '#10B981' }]}
            onPress={() => Linking.openURL(`tel:${job.customer?.phone}`)}
          >
            <Ionicons name="call" size={20} color="#FFFFFF" />
            <Text style={styles.contactButtonText}>Call</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.contactButton, { backgroundColor: '#3B82F6' }]}
            onPress={() => Linking.openURL(`sms:${job.customer?.phone}`)}
          >
            <Ionicons name="chatbubble" size={20} color="#FFFFFF" />
            <Text style={styles.contactButtonText}>Message</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Action Buttons */}
      {job.assignment?.status === 'invited' && (
        <View style={styles.actions}>
          <TouchableOpacity 
            style={[styles.acceptButton, isProcessing && styles.disabledButton]} 
            onPress={handleAccept}
            disabled={isProcessing}
            activeOpacity={0.8}
          >
            <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
            <Text style={styles.acceptButtonText}>
              {isProcessing ? '⏳ Processing...' : 'Accept Job'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.declineButton, isProcessing && styles.disabledButton]} 
            onPress={handleDecline}
            disabled={isProcessing}
            activeOpacity={0.7}
          >
            <Ionicons name="close-circle" size={24} color="#FFFFFF" />
            <Text style={styles.declineButtonText}>
              {isProcessing ? '⏳ Processing...' : 'Decline'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {job.assignment?.status === 'accepted' && (
        <TouchableOpacity 
          style={[styles.startButton, isProcessing && styles.disabledButton]} 
          onPress={handleStartJob}
          disabled={isProcessing}
          activeOpacity={0.8}
        >
          <Ionicons name="play-circle" size={24} color="#FFFFFF" />
          <Text style={styles.startButtonText}>
            {isProcessing ? '⏳ Starting...' : 'Start Job'}
          </Text>
        </TouchableOpacity>
      )}

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'available':
    case 'invited':
      return '#10B981';
    case 'accepted':
    case 'assigned':
    case 'confirmed':
      return '#3B82F6';
    case 'in_progress':
    case 'active':
      return '#F59E0B';
    case 'completed':
      return '#6B7280';
    default:
      return '#9CA3AF';
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  errorText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#3B82F6',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  reference: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  customer: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 5,
  },
  statusBadge: {
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  warningsCard: {
    backgroundColor: '#FEF3C7',
    margin: 15,
    padding: 15,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400E',
    marginLeft: 8,
  },
  warningText: {
    fontSize: 14,
    color: '#78350F',
    marginBottom: 6,
    lineHeight: 20,
  },
  earningsCard: {
    backgroundColor: '#ECFDF5',
    margin: 15,
    padding: 20,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  earningsInfo: {
    flex: 1,
    marginLeft: 15,
  },
  earningsLabel: {
    fontSize: 14,
    color: '#065F46',
  },
  earningsValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#047857',
  },
  earningsWarning: {
    fontSize: 12,
    color: '#F59E0B',
    marginTop: 4,
  },
  estimateNote: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
    fontStyle: 'italic',
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  breakdownLabel: {
    fontSize: 14,
    color: '#4B5563',
    flex: 1,
  },
  breakdownValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  workersInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  workersText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 6,
  },
  card: {
    backgroundColor: '#FFFFFF',
    margin: 15,
    marginTop: 0,
    padding: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  locationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 8,
  },
  navigateButton: {
    padding: 8,
    backgroundColor: '#EBF5FF',
    borderRadius: 8,
  },
  addressText: {
    fontSize: 15,
    color: '#1F2937',
    marginBottom: 4,
  },
  postcodeText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  propertyDetails: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  propertyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  propertyText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#4B5563',
  },
  accessNotesContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EBF5FF',
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  accessNotesText: {
    marginLeft: 8,
    fontSize: 13,
    color: '#1E40AF',
    flex: 1,
  },
  zonesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 8,
  },
  zoneBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  zoneBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#92400E',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailLabel: {
    marginLeft: 10,
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  itemCard: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 8,
  },
  itemDetails: {
    flexDirection: 'row',
    gap: 16,
  },
  itemDetail: {
    fontSize: 13,
    color: '#6B7280',
  },
  itemPictures: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 8,
  },
  itemPicture: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
  },
  morePictures: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  morePicturesText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  recommendationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    padding: 12,
    borderRadius: 8,
    marginTop: 4,
  },
  recommendationText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#065F46',
    flex: 1,
  },
  noteItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  noteText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#4B5563',
    flex: 1,
    lineHeight: 20,
  },
  contactButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  contactButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 10,
  },
  contactButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  actions: {
    padding: 15,
    gap: 10,
  },
  acceptButton: {
    backgroundColor: '#10B981',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  acceptButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  declineButton: {
    backgroundColor: '#EF4444',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  declineButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  startButton: {
    margin: 15,
    marginTop: 0,
    backgroundColor: '#3B82F6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  disabledButton: {
    opacity: 0.5,
    backgroundColor: '#9CA3AF',
  },
});
