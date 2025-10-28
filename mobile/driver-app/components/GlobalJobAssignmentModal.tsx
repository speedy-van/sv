import React from 'react';
import { useRouter } from 'expo-router';
import { JobAssignmentModal } from './JobAssignmentModal';
import { useJobAssignment } from '../contexts/JobAssignmentContext';
import { apiService } from '../services/api';
import { Alert } from 'react-native';
import { soundService } from '../services/soundService';

export const GlobalJobAssignmentModal: React.FC = () => {
  const router = useRouter();
  const { pendingAssignment, showModal, setShowModal, clearAssignment } = useJobAssignment();

  const handleView = async () => {
    if (!pendingAssignment) return;

    // Play button click sound
    soundService.playButtonClick();
    
    console.log('👁️ [Global Modal] View details pressed for:', pendingAssignment.id);
    
    // Clear the pending assignment
    await clearAssignment();
    
    // Navigate to job details
    router.push(`/job/${pendingAssignment.id}`);
  };

  const handleDecline = async () => {
    if (!pendingAssignment) return;

    // Play button click sound
    soundService.playButtonClick();
    
    console.log('❌ [Global Modal] Decline pressed for:', pendingAssignment.id);

    Alert.alert(
      'Decline Job?',
      'Are you sure you want to decline this job? It will be offered to other drivers.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => {
            soundService.playButtonClick();
          },
        },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: async () => {
            soundService.playError();
            try {
              console.log('📤 [Global Modal] Sending decline request...');
              
              const endpoint = pendingAssignment.type === 'route' 
                ? `/api/driver/routes/${pendingAssignment.id}/decline`
                : `/api/driver/jobs/${pendingAssignment.id}/decline`;

              const response = await apiService.post(endpoint, {
                reason: 'Driver declined via mobile app',
              });

              if (response.success) {
                console.log('✅ [Global Modal] Job declined successfully');
                await clearAssignment();
                Alert.alert('Job Declined', 'The job has been declined and offered to other drivers.');
              } else {
                console.error('❌ [Global Modal] Decline failed:', response.error);
                Alert.alert('Error', response.error || 'Failed to decline job');
              }
            } catch (error) {
              console.error('❌ [Global Modal] Decline error:', error);
              Alert.alert('Error', 'Failed to decline job. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleExpire = async () => {
    console.log('⏰ [Global Modal] Job assignment expired');
    await clearAssignment();
    Alert.alert(
      'Assignment Expired',
      'The job assignment has expired and will be offered to other drivers.'
    );
  };

  // Don't render if no assignment or modal is hidden
  if (!pendingAssignment || !showModal) {
    return null;
  }

  return (
    <JobAssignmentModal
      visible={showModal}
      assignment={pendingAssignment}
      onView={handleView}
      onDecline={handleDecline}
      onExpire={handleExpire}
    />
  );
};

