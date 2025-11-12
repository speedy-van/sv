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
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import { colors, typography, spacing, borderRadius, shadows } from '../../utils/theme';

const VEHICLE_TYPES = ['Van', 'Luton Van', 'Box Truck', 'Small Van'];

export default function VehicleInfoScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    vehicleType: 'Van',
    make: '',
    model: '',
    year: '',
    registration: '',
    color: '',
    insurance: '',
    mot: '',
  });

  useEffect(() => {
    loadVehicleInfo();
  }, []);

  const loadVehicleInfo = async () => {
    try {
      setLoading(true);
      const response = await apiService.get('/api/driver/profile');
      if (response.success && response.data?.vehicle) {
        setFormData(response.data.vehicle);
      }
    } catch (error: any) {
      console.error('Error loading vehicle info:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await apiService.put('/api/driver/vehicle', formData);
      
      if (response.success) {
        Alert.alert('Success', 'Vehicle information updated successfully');
        router.back();
      } else {
        Alert.alert('Error', response.error || 'Failed to update vehicle info');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update vehicle info');
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
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Vehicle Information</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* Vehicle Type */}
        <View style={styles.field}>
          <Text style={styles.label}>Vehicle Type</Text>
          <View style={styles.chipGroup}>
            {VEHICLE_TYPES.map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.chip,
                  formData.vehicleType === type && styles.chipActive,
                ]}
                onPress={() => setFormData({ ...formData, vehicleType: type })}
              >
                <Text
                  style={[
                    styles.chipText,
                    formData.vehicleType === type && styles.chipTextActive,
                  ]}
                >
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Make */}
        <View style={styles.field}>
          <Text style={styles.label}>Make</Text>
          <TextInput
            style={styles.input}
            value={formData.make}
            onChangeText={(text) => setFormData({ ...formData, make: text })}
            placeholder="e.g., Ford, Mercedes"
            placeholderTextColor={colors.text.disabled}
          />
        </View>

        {/* Model */}
        <View style={styles.field}>
          <Text style={styles.label}>Model</Text>
          <TextInput
            style={styles.input}
            value={formData.model}
            onChangeText={(text) => setFormData({ ...formData, model: text })}
            placeholder="e.g., Transit, Sprinter"
            placeholderTextColor={colors.text.disabled}
          />
        </View>

        {/* Year */}
        <View style={styles.field}>
          <Text style={styles.label}>Year</Text>
          <TextInput
            style={styles.input}
            value={formData.year}
            onChangeText={(text) => setFormData({ ...formData, year: text })}
            placeholder="2020"
            keyboardType="number-pad"
            maxLength={4}
            placeholderTextColor={colors.text.disabled}
          />
        </View>

        {/* Registration */}
        <View style={styles.field}>
          <Text style={styles.label}>Registration Number</Text>
          <TextInput
            style={styles.input}
            value={formData.registration}
            onChangeText={(text) => setFormData({ ...formData, registration: text.toUpperCase() })}
            placeholder="AB12 CDE"
            autoCapitalize="characters"
            placeholderTextColor={colors.text.disabled}
          />
        </View>

        {/* Color */}
        <View style={styles.field}>
          <Text style={styles.label}>Color</Text>
          <TextInput
            style={styles.input}
            value={formData.color}
            onChangeText={(text) => setFormData({ ...formData, color: text })}
            placeholder="White"
            placeholderTextColor={colors.text.disabled}
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
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={22} color="#FFFFFF" />
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
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
    borderColor: colors.border,
  },
  chipGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    ...typography.caption,
    color: colors.text.primary,
  },
  chipTextActive: {
    color: colors.text.inverse,
    fontWeight: '600',
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
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
});

