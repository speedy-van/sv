import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../utils/theme';

export type JobStep = 
  | 'navigate_to_pickup'
  | 'arrived_at_pickup'
  | 'loading_started'
  | 'loading_completed'
  | 'en_route_to_dropoff'
  | 'arrived_at_dropoff'
  | 'unloading_started'
  | 'unloading_completed'
  | 'job_completed';

interface JobProgressTrackerProps {
  currentStep: JobStep;
  completedSteps: JobStep[];
  onStepComplete: (step: JobStep) => void;
  isUpdating?: boolean;
}

const STEPS: Array<{ key: JobStep; label: string; action: string }> = [
  { key: 'navigate_to_pickup', label: 'Navigate to Pickup', action: 'Start Navigation' },
  { key: 'arrived_at_pickup', label: 'Arrived at Pickup', action: 'Mark Arrived' },
  { key: 'loading_started', label: 'Loading Started', action: 'Start Loading' },
  { key: 'loading_completed', label: 'Loading Completed', action: 'Complete Loading' },
  { key: 'en_route_to_dropoff', label: 'En Route to Dropoff', action: 'Start Delivery' },
  { key: 'arrived_at_dropoff', label: 'Arrived at Dropoff', action: 'Mark Arrived' },
  { key: 'unloading_started', label: 'Unloading Started', action: 'Start Unloading' },
  { key: 'unloading_completed', label: 'Unloading Completed', action: 'Complete Unloading' },
  { key: 'job_completed', label: 'Job Completed', action: 'Complete Job' },
];

export const JobProgressTracker: React.FC<JobProgressTrackerProps> = ({
  currentStep,
  completedSteps,
  onStepComplete,
  isUpdating = false,
}) => {
  const currentStepIndex = STEPS.findIndex(s => s.key === currentStep);
  
  const getStepStatus = (step: JobStep, index: number): 'completed' | 'current' | 'upcoming' => {
    if (completedSteps.includes(step)) return 'completed';
    if (step === currentStep) return 'current';
    return 'upcoming';
  };

  const getNextStep = (): JobStep | null => {
    const currentIndex = STEPS.findIndex(s => s.key === currentStep);
    if (currentIndex === -1 || currentIndex >= STEPS.length - 1) return null;
    return STEPS[currentIndex + 1].key;
  };

  const nextStep = getNextStep();
  const nextStepData = STEPS.find(s => s.key === nextStep);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Delivery Progress</Text>
      
      {/* Progress Steps */}
      <View style={styles.stepsContainer}>
        {STEPS.map((step, index) => {
          const status = getStepStatus(step.key, index);
          const isLast = index === STEPS.length - 1;
          
          return (
            <View key={step.key} style={styles.stepWrapper}>
              <View style={styles.stepRow}>
                {/* Step Indicator */}
                <View style={styles.indicatorColumn}>
                  <View style={[
                    styles.stepIndicator,
                    status === 'completed' && styles.stepCompleted,
                    status === 'current' && styles.stepCurrent,
                  ]}>
                    {status === 'completed' ? (
                      <Text style={styles.checkmark}>✓</Text>
                    ) : (
                      <Text style={[
                        styles.stepNumber,
                        status === 'current' && styles.stepNumberCurrent,
                      ]}>
                        {index + 1}
                      </Text>
                    )}
                  </View>
                  {!isLast && (
                    <View style={[
                      styles.connector,
                      status === 'completed' && styles.connectorCompleted,
                    ]} />
                  )}
                </View>

                {/* Step Label */}
                <View style={styles.stepContent}>
                  <Text style={[
                    styles.stepLabel,
                    status === 'completed' && styles.stepLabelCompleted,
                    status === 'current' && styles.stepLabelCurrent,
                  ]}>
                    {step.label}
                  </Text>
                  {status === 'completed' && (
                    <Text style={styles.stepTime}>Completed</Text>
                  )}
                  {status === 'current' && (
                    <Text style={styles.stepTimeCurrent}>In Progress</Text>
                  )}
                </View>
              </View>
            </View>
          );
        })}
      </View>

      {/* Next Step Action Button */}
      {nextStep && nextStepData && (
        <TouchableOpacity
          style={[styles.actionButton, isUpdating && styles.actionButtonDisabled]}
          onPress={() => !isUpdating && onStepComplete(nextStep)}
          disabled={isUpdating}
          activeOpacity={0.7}
        >
          <Text style={styles.actionButtonText}>
            {isUpdating ? 'Updating...' : nextStepData.action}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginVertical: spacing.md,
  },
  title: {
    ...typography.h3,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  stepsContainer: {
    marginBottom: spacing.md,
  },
  stepWrapper: {
    marginBottom: spacing.xs,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  indicatorColumn: {
    alignItems: 'center',
    marginRight: spacing.md,
  },
  stepIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
  },
  stepCompleted: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  stepCurrent: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkmark: {
    color: colors.text.inverse,
    fontSize: 18,
    fontWeight: 'bold',
  },
  stepNumber: {
    ...typography.caption,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  stepNumberCurrent: {
    color: colors.text.inverse,
  },
  connector: {
    width: 2,
    height: 40,
    backgroundColor: colors.border,
    marginTop: 4,
  },
  connectorCompleted: {
    backgroundColor: colors.success,
  },
  stepContent: {
    flex: 1,
    paddingTop: 4,
  },
  stepLabel: {
    ...typography.body,
    color: colors.text.secondary,
    marginBottom: 2,
  },
  stepLabelCompleted: {
    color: colors.text.primary,
    fontWeight: '500',
  },
  stepLabelCurrent: {
    color: colors.primary,
    fontWeight: '600',
  },
  stepTime: {
    ...typography.small,
    color: colors.success,
  },
  stepTimeCurrent: {
    ...typography.small,
    color: colors.primary,
    fontWeight: '600',
  },
  actionButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  actionButtonDisabled: {
    backgroundColor: colors.border,
  },
  actionButtonText: {
    ...typography.bodyBold,
    color: colors.text.inverse,
    fontSize: 16,
  },
});


