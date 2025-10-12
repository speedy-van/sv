import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import jobService from '../services/job.service';
import { useLocation } from '../context/LocationContext';
import { RootStackParamList } from '../navigation/RootNavigator';
import { JobStep } from '../types';

type JobProgressRouteProp = RouteProp<RootStackParamList, 'JobProgress'>;

const STEPS: { key: JobStep; label: string; icon: string }[] = [
  { key: 'en_route', label: 'En Route to Pickup', icon: 'car' },
  { key: 'arrived', label: 'Arrived at Pickup', icon: 'location' },
  { key: 'loading', label: 'Loading Items', icon: 'cube' },
  { key: 'in_transit', label: 'In Transit to Dropoff', icon: 'shuffle' },
  { key: 'unloading', label: 'Unloading Items', icon: 'download' },
  { key: 'completed', label: 'Job Completed', icon: 'checkmark-circle' },
];

export default function JobProgressScreen() {
  const route = useRoute<JobProgressRouteProp>();
  const navigation = useNavigation();
  const { startTracking, stopTracking, isTracking, currentLocation } = useLocation();
  const [currentStep, setCurrentStep] = useState<JobStep>('en_route');
  const [notes, setNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    // Start tracking when component mounts
    startTracking(route.params.jobId);

    return () => {
      // Stop tracking when component unmounts
      stopTracking();
    };
  }, []);

  const handleUpdateProgress = async (step: JobStep) => {
    setUpdating(true);
    try {
      const location = currentLocation ? {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      } : undefined;

      await jobService.updateProgress(
        route.params.jobId,
        step,
        notes || undefined,
        location
      );

      setCurrentStep(step);
      setNotes('');

      if (step === 'completed') {
        Alert.alert('Success', 'Job completed successfully');
        navigation.goBack();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update progress');
    } finally {
      setUpdating(false);
    }
  };

  const getStepIndex = (step: JobStep) => STEPS.findIndex(s => s.key === step);
  const currentStepIndex = getStepIndex(currentStep);

  return (
    <ScrollView style={styles.container}>
      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${((currentStepIndex + 1) / STEPS.length) * 100}%` }]} />
        </View>
        <Text style={styles.progressText}>
          {Math.round(((currentStepIndex + 1) / STEPS.length) * 100)}% Complete
        </Text>
      </View>

      {/* Current Location */}
      {isTracking && currentLocation && (
        <View style={styles.locationCard}>
          <Ionicons name="location" size={20} color="#1E40AF" />
          <View style={styles.locationInfo}>
            <Text style={styles.locationTitle}>Your Location</Text>
            <Text style={styles.locationText}>
              Lat: {currentLocation.coords.latitude.toFixed(6)}, 
              Lng: {currentLocation.coords.longitude.toFixed(6)}
            </Text>
          </View>
        </View>
      )}

      {/* Steps */}
      <View style={styles.stepsContainer}>
        {STEPS.map((step, index) => {
          const isCompleted = index < currentStepIndex;
          const isCurrent = index === currentStepIndex;
          const isNext = index === currentStepIndex + 1;

          return (
            <View key={step.key} style={styles.stepContainer}>
              <View style={styles.stepRow}>
                <View
                  style={[
                    styles.stepIcon,
                    isCompleted && styles.stepIconCompleted,
                    isCurrent && styles.stepIconCurrent,
                  ]}
                >
                  <Ionicons
                    name={step.icon as any}
                    size={24}
                    color={isCompleted || isCurrent ? '#fff' : '#ccc'}
                  />
                </View>
                <View style={styles.stepContent}>
                  <Text style={[styles.stepLabel, isCurrent && styles.stepLabelCurrent]}>
                    {step.label}
                  </Text>
                  {isCurrent && <Text style={styles.stepStatus}>Current Step</Text>}
                  {isCompleted && <Text style={styles.stepCompleted}>Completed</Text>}
                </View>
              </View>

              {isNext && (
                <TouchableOpacity
                  style={styles.nextButton}
                  onPress={() => handleUpdateProgress(step.key)}
                  disabled={updating}
                >
                  <Text style={styles.nextButtonText}>
                    {step.key === 'completed' ? 'Complete Job' : 'Update to This Step'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}
      </View>

      {/* Notes */}
      <View style={styles.notesCard}>
        <Text style={styles.notesLabel}>Add Notes (Optional)</Text>
        <TextInput
          style={styles.notesInput}
          placeholder="Enter any notes about this step..."
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={4}
        />
      </View>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  progressContainer: {
    backgroundColor: '#fff',
    padding: 20,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#1A1A1A',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#1A1A1A',
  },
  progressText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 15,
    padding: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  locationInfo: {
    marginLeft: 10,
    flex: 1,
  },
  locationTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 3,
  },
  locationText: {
    fontSize: 12,
    color: '#666',
  },
  stepsContainer: {
    backgroundColor: '#fff',
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
  stepContainer: {
    marginBottom: 20,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepIconCompleted: {
    backgroundColor: '#1A1A1A',
  },
  stepIconCurrent: {
    backgroundColor: '#1A1A1A',
  },
  stepContent: {
    marginLeft: 15,
    flex: 1,
  },
  stepLabel: {
    fontSize: 16,
    color: '#666',
  },
  stepLabelCurrent: {
    fontWeight: 'bold',
    color: '#000',
  },
  stepStatus: {
    fontSize: 12,
    color: '#FFFFFF',
    marginTop: 2,
  },
  stepCompleted: {
    fontSize: 12,
    color: '#FFFFFF',
    marginTop: 2,
  },
  nextButton: {
    marginTop: 10,
    marginLeft: 65,
    backgroundColor: '#1A1A1A',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  notesCard: {
    backgroundColor: '#fff',
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
  notesLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#1A1A1A',
    borderRadius: 8,
    padding: 10,
    minHeight: 80,
    textAlignVertical: 'top',
  },
});

