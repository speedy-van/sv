/**
 * Form error handling utilities
 */

export interface FormError {
  field: string;
  message: string;
  type: 'validation' | 'server' | 'network';
}

export interface FormErrors {
  [field: string]: FormError;
}

export function createFormError(
  field: string,
  message: string,
  type: FormError['type'] = 'validation'
): FormError {
  return {
    field,
    message,
    type,
  };
}

export function addFormError(
  errors: FormErrors,
  field: string,
  message: string,
  type: FormError['type'] = 'validation'
): FormErrors {
  return {
    ...errors,
    [field]: createFormError(field, message, type),
  };
}

export function removeFormError(errors: FormErrors, field: string): FormErrors {
  const newErrors = { ...errors };
  delete newErrors[field];
  return newErrors;
}

export function clearFormErrors(): FormErrors {
  return {};
}

export function hasFormErrors(errors: FormErrors): boolean {
  return Object.keys(errors).length > 0;
}

export function getFormErrorMessage(errors: FormErrors, field: string): string | null {
  return errors[field]?.message || null;
}

export function getFormErrorType(errors: FormErrors, field: string): FormError['type'] | null {
  return errors[field]?.type || null;
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePhone(phone: string): boolean {
  const phoneRegex = /^[+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/[\s\-()]/g, ''));
}

export function validatePostcode(postcode: string): boolean {
  const ukPostcodeRegex = /^[A-Z]{1,2}[0-9R][0-9A-Z]? [0-9][ABD-HJLNP-UW-Z]{2}$/i;
  return ukPostcodeRegex.test(postcode);
}

// Additional exports for FormErrorDisplay component
export type ValidationError = FormError;

export function groupErrorsBySection(errors: FormErrors): Record<string, FormError[]> {
  const grouped: Record<string, FormError[]> = {};
  
  Object.values(errors).forEach(error => {
    const section = error.field.split('.')[0] || 'general';
    if (!grouped[section]) {
      grouped[section] = [];
    }
    grouped[section].push(error);
  });
  
  return grouped;
}

export function humanizeErrorMessage(message: string): string {
  // Convert technical error messages to user-friendly ones
  return message
    .replace(/field is required/i, 'This field is required')
    .replace(/must be a valid/i, 'Please enter a valid')
    .replace(/minimum length/i, 'must be at least')
    .replace(/maximum length/i, 'must be no more than')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
}