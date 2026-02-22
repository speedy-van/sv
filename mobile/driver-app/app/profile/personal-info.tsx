import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  Modal,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import { colors, typography, spacing, borderRadius, shadows } from '../../utils/theme';

export default function PersonalInfoScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    address: '',
    postcode: '',
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      console.log('📥 Loading profile data...');
      
      const response = await apiService.get('/api/driver/profile');
      
      console.log('📦 Profile response:', {
        success: response.success,
        hasData: !!response.data,
        name: response.data?.name,
        phone: response.data?.phone,
        address: response.data?.address,
        postcode: response.data?.postcode
      });
      
      if (response.success && response.data) {
        const profileData = {
          name: response.data.name || user?.name || '',
          email: response.data.email || user?.email || '',
          phone: response.data.phone || '',
          address: response.data.address || '',
          postcode: response.data.postcode || '',
        };
        
        console.log('✅ Profile loaded:', profileData);
        setFormData(profileData);
      } else {
        console.warn('⚠️ Profile load failed:', response.error);
      }
    } catch (error: any) {
      console.error('❌ Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const [emailModalVisible, setEmailModalVisible] = useState(false);
  const [newEmailInput, setNewEmailInput] = useState('');

  const handleChangeEmail = () => {
    setNewEmailInput(formData.email);
    setEmailModalVisible(true);
  };

  const submitEmailChange = async () => {
    if (!newEmailInput || !newEmailInput.trim()) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    try {
      setEmailModalVisible(false);
      const response = await apiService.post('/api/driver/email/change-request', {
        newEmail: newEmailInput.trim(),
      });

      if (response.success) {
        Alert.alert(
          '✅ Verification Email Sent',
          `A verification link has been sent to ${newEmailInput}. Please check your inbox and click the link to confirm the change.\n\nThe link expires in 24 hours.`,
          [{ text: 'OK' }]
        );
      } else {
        const errorData = response.data as any;
        const errorTitle = errorData?.alreadyInUse ? '❌ Email Already in Use' : '❌ Error';
        const errorMessage = response.error || 'Failed to send verification email';
        
        Alert.alert(errorTitle, errorMessage, [{ text: 'OK' }]);
        
        console.error('Email change request failed:', {
          error: response.error,
          alreadyInUse: errorData?.alreadyInUse,
          userType: errorData?.userType,
        });
      }
    } catch (error: any) {
      console.error('Email change request error:', error);
      Alert.alert('❌ Network Error', 'Failed to connect to server. Please check your internet connection and try again.');
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      console.log('💾 Saving profile data:', formData);
      
      const response = await apiService.put('/api/driver/profile', formData);
      
      console.log('📥 Save response:', response);
      
      if (response.success) {
        console.log('✅ Profile saved successfully');
        
        // Reload profile to confirm changes persisted
        await loadProfile();
        
        Alert.alert(
          'Success', 
          'Profile updated successfully',
          [
            {
              text: 'OK',
              onPress: () => router.back()
            }
          ]
        );
      } else {
        console.error('❌ Save failed:', response.error);
        Alert.alert('Error', response.error || 'Failed to update profile');
      }
    } catch (error: any) {
      console.error('❌ Save error:', error);
      Alert.alert('Error', error.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Personal Information</Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView 
            style={styles.content} 
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
        {/* Name */}
        <View style={styles.field}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={[styles.input, styles.inputDisabled]}
            value={formData.name}
            editable={false}
            placeholderTextColor={colors.text.disabled}
          />
          <Text style={styles.hint}>Name cannot be changed</Text>
        </View>

        {/* Email */}
        <View style={styles.field}>
          <Text style={styles.label}>Email Address</Text>
          <View style={styles.emailContainer}>
            <TextInput
              style={[styles.input, styles.inputDisabled, { flex: 1 }]}
              value={formData.email}
              editable={false}
              placeholderTextColor={colors.text.disabled}
            />
            <TouchableOpacity 
              style={styles.changeEmailButton}
              onPress={handleChangeEmail}
            >
              <Ionicons name="create-outline" size={18} color={colors.primary} />
              <Text style={styles.changeEmailText}>Change</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.hint}>Tap 'Change' to update your email (requires verification)</Text>
        </View>

        {/* Phone */}
        <View style={styles.field}>
          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={styles.input}
            value={formData.phone}
            onChangeText={(text) => setFormData({ ...formData, phone: text })}
            placeholder="+44 7XXX XXXXXX"
            keyboardType="phone-pad"
            textContentType="telephoneNumber"
            autoComplete="tel"
            placeholderTextColor={colors.text.disabled}
            returnKeyType="done"
            onSubmitEditing={() => Keyboard.dismiss()}
          />
        </View>

        {/* Address */}
        <View style={styles.field}>
          <Text style={styles.label}>Address</Text>
          <TextInput
            style={[styles.input, styles.inputMultiline]}
            value={formData.address}
            onChangeText={(text) => setFormData({ ...formData, address: text })}
            placeholder="Enter your address"
            multiline
            numberOfLines={3}
            placeholderTextColor={colors.text.disabled}
            returnKeyType="done"
            blurOnSubmit={true}
          />
        </View>

        {/* Postcode */}
        <View style={styles.field}>
          <Text style={styles.label}>Postcode</Text>
          <TextInput
            style={styles.input}
            value={formData.postcode}
            onChangeText={(text) => setFormData({ ...formData, postcode: text })}
            placeholder="G1 1AA"
            autoCapitalize="characters"
            placeholderTextColor={colors.text.disabled}
            returnKeyType="done"
            onSubmitEditing={() => Keyboard.dismiss()}
          />
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.8}
        >
          {saving ? (
            <ActivityIndicator color="#F5F8FF" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={22} color="#F5F8FF" />
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
        </View>
      </TouchableWithoutFeedback>

      {/* Email Change Modal */}
      <Modal
        visible={emailModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setEmailModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setEmailModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Change Email Address</Text>
                <Text style={styles.modalSubtitle}>
                  Enter your new email address. A verification link will be sent to confirm the change.
                </Text>
                
                <TextInput
                  style={styles.modalInput}
                  value={newEmailInput}
                  onChangeText={setNewEmailInput}
                  placeholder="new.email@example.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  placeholderTextColor={colors.text.disabled}
                />

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalButtonCancel]}
                    onPress={() => setEmailModalVisible(false)}
                  >
                    <Text style={styles.modalButtonTextCancel}>Cancel</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalButtonConfirm]}
                    onPress={submitEmailChange}
                  >
                    <Text style={styles.modalButtonText}>Send Verification</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xxl + spacing.md,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
    ...shadows.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...typography.h3,
    color: colors.text.primary,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    gap: spacing.lg,
    paddingBottom: spacing.xxl * 2, // Extra padding for keyboard
  },
  field: {
    gap: spacing.sm,
  },
  label: {
    ...typography.bodyBold,
    color: colors.text.primary,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...typography.body,
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: colors.border.medium,
  },
  inputDisabled: {
    backgroundColor: colors.surfaceAlt,
    color: colors.text.disabled,
  },
  inputMultiline: {
    height: 80,
    textAlignVertical: 'top',
  },
  hint: {
    ...typography.small,
    color: colors.text.secondary,
  },
  emailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  changeEmailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.surfaceAlt,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  changeEmailText: {
    ...typography.captionBold,
    color: colors.primary,
  },
  saveButton: {
    flexDirection: 'row',
    marginTop: spacing.lg,
    padding: spacing.md + 4,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 14,
    backgroundColor: '#10B981',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  saveButtonDisabled: {
    opacity: 0.6,
    backgroundColor: '#9CA3AF',
  },
  saveButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#F5F8FF',
    letterSpacing: 0.3,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 400,
    ...shadows.lg,
  },
  modalTitle: {
    ...typography.h3,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  modalSubtitle: {
    ...typography.body,
    color: colors.text.secondary,
    marginBottom: spacing.lg,
  },
  modalInput: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...typography.body,
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: colors.border.medium,
    marginBottom: spacing.lg,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  modalButton: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonCancel: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border.medium,
  },
  modalButtonConfirm: {
    backgroundColor: colors.primary,
  },
  modalButtonText: {
    ...typography.bodyBold,
    color: '#F5F8FF',
  },
  modalButtonTextCancel: {
    ...typography.bodyBold,
    color: colors.text.primary,
  },
});

