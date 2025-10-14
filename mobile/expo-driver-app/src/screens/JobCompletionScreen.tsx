/**
 * JobCompletionScreen.tsx
 * Speedy Van Driver - Android/Expo
 * 
 * Complete job with proof of delivery (photos + signature)
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  ImageStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { captureRef } from 'react-native-view-shot';
import SignatureCanvas from 'react-native-signature-canvas';
import { useNavigation } from '@react-navigation/native';
import { DarkColors as colors, Spacing as spacing, Typography as typography } from '../theme';
import apiService from '../services/api.service';

const { width } = Dimensions.get('window');

interface JobCompletionScreenProps {
  route: {
    params: {
      job: any;
    };
  };
}

export const JobCompletionScreen: React.FC<JobCompletionScreenProps> = ({ route }) => {
  const { job } = route.params;
  const navigation = useNavigation();
  const signatureRef = useRef<any>(null);
  
  const [photos, setPhotos] = useState<string[]>([]);
  const [signature, setSignature] = useState<string | null>(null);
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSignaturePad, setShowSignaturePad] = useState(false);

  const canSubmit = photos.length > 0 && signature !== null && !isSubmitting;

  // Take Photo
  const takePhoto = async () => {
    if (photos.length >= 5) {
      Alert.alert('Maximum Photos', 'You can only upload up to 5 photos');
      return;
    }

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Camera permission is required to take photos');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
    });

    if (!result.canceled && result.assets[0]) {
      setPhotos([...photos, result.assets[0].uri]);
    }
  };

  // Pick from Gallery
  const pickImage = async () => {
    if (photos.length >= 5) {
      Alert.alert('Maximum Photos', 'You can only upload up to 5 photos');
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Gallery permission is required');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
    });

    if (!result.canceled && result.assets[0]) {
      setPhotos([...photos, result.assets[0].uri]);
    }
  };

  // Remove Photo
  const removePhoto = (index: number) => {
    const newPhotos = [...photos];
    newPhotos.splice(index, 1);
    setPhotos(newPhotos);
  };

  // Handle Signature
  const handleSignature = (sig: string) => {
    setSignature(sig);
    setShowSignaturePad(false);
  };

  const clearSignature = () => {
    setSignature(null);
    signatureRef.current?.clearSignature();
  };

  // Submit Completion
  const submitCompletion = async () => {
    if (!canSubmit) return;

    Alert.alert(
      'Complete Job?',
      `You'll earn £${job.estimatedEarnings}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          onPress: async () => {
            setIsSubmitting(true);
            try {
              // Upload photos
              const photoUrls = await uploadPhotos();
              
              // Upload signature
              const signatureUrl = await uploadSignature();
              
              // Submit completion
              const response = await apiService.completeJob({
                jobId: job.id,
                photos: photoUrls,
                signature: signatureUrl,
                notes: deliveryNotes,
              });

              Alert.alert(
                'Job Completed!',
                `You earned £${response.earnings.toFixed(2)}`,
                [
                  {
                    text: 'OK',
                    onPress: () => navigation.goBack(),
                  },
                ]
              );
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to complete job');
            } finally {
              setIsSubmitting(false);
            }
          },
        },
      ]
    );
  };

  const uploadPhotos = async (): Promise<string[]> => {
    const urls: string[] = [];
    
    for (let i = 0; i < photos.length; i++) {
      const formData = new FormData();
      formData.append('file', {
        uri: photos[i],
        type: 'image/jpeg',
        name: `proof_${job.id}_${i}.jpg`,
      } as any);
      formData.append('type', 'proof_of_delivery');

      const url = await apiService.uploadImage(formData);
      urls.push(url);
    }

    return urls;
  };

  const uploadSignature = async (): Promise<string> => {
    if (!signature) throw new Error('Signature is required');

    const formData = new FormData();
    formData.append('file', {
      uri: signature,
      type: 'image/png',
      name: `signature_${job.id}.png`,
    } as any);
    formData.append('type', 'signature');

    return await apiService.uploadImage(formData);
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView}>
        {/* Job Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.jobReference}>Job #{job.reference}</Text>
          
          <View style={styles.summaryRow}>
            <View>
              <Text style={styles.label}>Customer</Text>
              <Text style={styles.value}>{job.customer}</Text>
            </View>
            
            <View style={styles.earningsContainer}>
              <Text style={styles.label}>Earnings</Text>
              <Text style={styles.earnings}>£{job.estimatedEarnings}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.locationRow}>
            <Ionicons name="location" size={16} color={colors.success} />
            <Text style={styles.locationText} numberOfLines={1}>{job.from}</Text>
          </View>

          <View style={styles.locationRow}>
            <Ionicons name="flag" size={16} color={colors.error} />
            <Text style={styles.locationText} numberOfLines={1}>{job.to}</Text>
          </View>
        </View>

        {/* Photos Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Proof of Delivery Photos</Text>
            <Text style={styles.photoCount}>{photos.length}/5</Text>
          </View>
          
          <Text style={styles.sectionSubtitle}>Take photos of the delivered items</Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photosScroll}>
            {photos.map((photo, index) => (
              <View key={index} style={styles.photoContainer}>
                <Image source={{ uri: photo }} style={styles.photo} />
                <TouchableOpacity
                  style={styles.removePhotoButton}
                  onPress={() => removePhoto(index)}
                >
                  <Ionicons name="close-circle" size={24} color={colors.error} />
                </TouchableOpacity>
              </View>
            ))}

            {photos.length < 5 && (
              <View style={styles.addPhotoButtons}>
                <TouchableOpacity style={styles.addPhotoButton} onPress={takePhoto}>
                  <Ionicons name="camera" size={32} color={colors.primary[500]} />
                  <Text style={styles.addPhotoText}>Camera</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.addPhotoButton} onPress={pickImage}>
                  <Ionicons name="images" size={32} color={colors.primary[500]} />
                  <Text style={styles.addPhotoText}>Gallery</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>

          {photos.length === 0 && (
            <Text style={styles.warningText}>⚠️ At least one photo is required</Text>
          )}
        </View>

        {/* Signature Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer Signature</Text>
          <Text style={styles.sectionSubtitle}>Ask customer to sign below</Text>

          <TouchableOpacity
            style={styles.signatureContainer}
            onPress={() => setShowSignaturePad(true)}
          >
            {signature ? (
              <Image source={{ uri: signature }} style={styles.signatureImage} />
            ) : (
              <View style={styles.signaturePlaceholder}>
                <Ionicons name="create-outline" size={32} color={colors.textSecondary} />
                <Text style={styles.signaturePlaceholderText}>Tap to sign</Text>
              </View>
            )}
          </TouchableOpacity>

          {signature && (
            <TouchableOpacity style={styles.clearButton} onPress={clearSignature}>
              <Ionicons name="refresh" size={16} color={colors.error} />
              <Text style={styles.clearButtonText}>Clear Signature</Text>
            </TouchableOpacity>
          )}

          {!signature && (
            <Text style={styles.warningText}>⚠️ Signature is required</Text>
          )}
        </View>

        {/* Notes Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Notes (Optional)</Text>
          
          <TextInput
            style={styles.notesInput}
            placeholder="Any special notes about the delivery..."
            placeholderTextColor={colors.textSecondary}
            value={deliveryNotes}
            onChangeText={setDeliveryNotes}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Complete Button */}
        <TouchableOpacity
          style={[styles.completeButton, !canSubmit && styles.completeButtonDisabled]}
          onPress={submitCompletion}
          disabled={!canSubmit}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={24} color="#fff" />
              <Text style={styles.completeButtonText}>Complete Job</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Signature Pad Modal */}
      {showSignaturePad && (
        <View style={styles.signaturePadModal}>
          <View style={styles.signaturePadHeader}>
            <TouchableOpacity onPress={() => setShowSignaturePad(false)}>
              <Text style={styles.signaturePadCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.signaturePadTitle}>Customer Signature</Text>
            <TouchableOpacity onPress={() => signatureRef.current?.readSignature()}>
              <Text style={styles.signaturePadDone}>Done</Text>
            </TouchableOpacity>
          </View>

          <SignatureCanvas
            ref={signatureRef}
            onOK={handleSignature}
            onEmpty={() => Alert.alert('Empty', 'Please provide a signature')}
            descriptionText=""
            clearText="Clear"
            confirmText="Save"
            webStyle={`.m-signature-pad {box-shadow: none; border: none;} .m-signature-pad--body {border: none;}`}
          />
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  summaryCard: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  jobReference: {
    ...typography.h3,
    marginBottom: spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  label: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  value: {
    ...typography.body,
    fontWeight: '600',
  },
  earningsContainer: {
    alignItems: 'flex-end',
  },
  earnings: {
    ...typography.h2,
    color: colors.success,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border.light,
    marginVertical: spacing.md,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  locationText: {
    ...typography.caption,
    marginLeft: spacing.sm,
    flex: 1,
  },
  section: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  sectionTitle: {
    ...typography.h4,
  },
  sectionSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  photoCount: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  photosScroll: {
    marginHorizontal: -spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  photoContainer: {
    marginRight: spacing.md,
    position: 'relative',
  },
  photo: {
    width: 120,
    height: 120,
    borderRadius: 12,
  } as ImageStyle,
  removePhotoButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: colors.surface,
    borderRadius: 12,
  },
  addPhotoButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  addPhotoButton: {
    width: 120,
    height: 120,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addPhotoText: {
    ...typography.caption,
    marginTop: spacing.xs,
  },
  warningText: {
    ...typography.caption,
    color: colors.warning,
    marginTop: spacing.sm,
  },
  signatureContainer: {
    height: 200,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 12,
    overflow: 'hidden',
  },
  signatureImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  } as ImageStyle,
  signaturePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  signaturePlaceholderText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  clearButtonText: {
    ...typography.caption,
    color: colors.error,
    marginLeft: spacing.xs,
  },
  notesInput: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 8,
    padding: spacing.md,
    ...typography.body,
    minHeight: 100,
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.success,
    padding: spacing.lg,
    borderRadius: 12,
    margin: spacing.lg,
    gap: spacing.sm,
  },
  completeButtonDisabled: {
    backgroundColor: colors.disabled,
  },
  completeButtonText: {
    ...typography.button,
    color: '#fff',
  },
  signaturePadModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.surface,
  },
  signaturePadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  signaturePadTitle: {
    ...typography.h4,
  },
  signaturePadCancel: {
    ...typography.body,
    color: colors.error,
  },
  signaturePadDone: {
    ...typography.body,
    color: colors.primary[500],
    fontWeight: '600',
  },
});

