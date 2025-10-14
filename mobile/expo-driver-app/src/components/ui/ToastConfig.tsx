import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BaseToast, ErrorToast, InfoToast, ToastConfig } from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';

export const toastConfig: ToastConfig = {
  success: (props) => (
    <View style={[styles.toastContainer, styles.successToast]}>
      <View style={styles.iconContainer}>
        <Ionicons name="checkmark-circle" size={24} color={colors.success[500]} />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.toastTitle}>{props.text1}</Text>
        {props.text2 && <Text style={styles.toastMessage}>{props.text2}</Text>}
      </View>
    </View>
  ),
  error: (props) => (
    <View style={[styles.toastContainer, styles.errorToast]}>
      <View style={styles.iconContainer}>
        <Ionicons name="close-circle" size={24} color={colors.error[500]} />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.toastTitle}>{props.text1}</Text>
        {props.text2 && <Text style={styles.toastMessage}>{props.text2}</Text>}
      </View>
    </View>
  ),
  info: (props) => (
    <View style={[styles.toastContainer, styles.infoToast]}>
      <View style={styles.iconContainer}>
        <Ionicons name="information-circle" size={24} color={colors.info[500]} />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.toastTitle}>{props.text1}</Text>
        {props.text2 && <Text style={styles.toastMessage}>{props.text2}</Text>}
      </View>
    </View>
  ),
  warning: (props) => (
    <View style={[styles.toastContainer, styles.warningToast]}>
      <View style={styles.iconContainer}>
        <Ionicons name="warning" size={24} color={colors.warning[500]} />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.toastTitle}>{props.text1}</Text>
        {props.text2 && <Text style={styles.toastMessage}>{props.text2}</Text>}
      </View>
    </View>
  ),
  neon: (props) => (
    <View style={[styles.toastContainer, styles.neonToast]}>
      <View style={styles.iconContainer}>
        <Ionicons name="flash" size={24} color={colors.neon[500]} />
      </View>
      <View style={styles.textContainer}>
        <Text style={[styles.toastTitle, styles.neonText]}>{props.text1}</Text>
        {props.text2 && <Text style={[styles.toastMessage, styles.neonText]}>{props.text2}</Text>}
      </View>
    </View>
  ),
};

const styles = StyleSheet.create({
  toastContainer: {
    width: '90%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  successToast: {
    backgroundColor: colors.success[50],
    borderLeftWidth: 4,
    borderLeftColor: colors.success[500],
  },
  errorToast: {
    backgroundColor: colors.error[50],
    borderLeftWidth: 4,
    borderLeftColor: colors.error[500],
  },
  infoToast: {
    backgroundColor: colors.info[50],
    borderLeftWidth: 4,
    borderLeftColor: colors.info[500],
  },
  warningToast: {
    backgroundColor: colors.warning[50],
    borderLeftWidth: 4,
    borderLeftColor: colors.warning[500],
  },
  neonToast: {
    backgroundColor: colors.background.secondary,
    borderLeftWidth: 4,
    borderLeftColor: colors.neon[500],
    borderWidth: 1,
    borderColor: colors.neon[500],
    shadowColor: colors.neon[500],
    shadowOpacity: 0.5,
  },
  iconContainer: {
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  toastTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  toastMessage: {
    fontSize: 14,
    color: '#6B7280',
  },
  neonText: {
    color: colors.text.primary,
  },
});

