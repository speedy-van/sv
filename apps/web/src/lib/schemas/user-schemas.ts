/**
 * Shared User Management Validation Schemas
 * Used by both frontend and backend for consistent validation
 */

import { z } from 'zod';

// Base user schema
export const baseUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name too long'),
  email: z.string().email('Valid email address is required'),
  phone: z.string().regex(/^[\d\s\+\-\(\)]+$/, 'Valid phone number is required').min(10),
  role: z.enum(['admin', 'driver', 'customer'], {
    message: 'Invalid user role',
  }),
  isActive: z.boolean().default(true),
});

// Customer-specific schema
export const customerSchema = baseUserSchema.extend({
  role: z.literal('customer'),
  preferences: z.object({
    communicationMethod: z.enum(['email', 'sms', 'phone']).default('email'),
    marketingConsent: z.boolean().default(false),
    language: z.string().length(2).default('en'),
    timezone: z.string().default('Europe/London'),
  }).optional(),
  
  // Customer profile
  dateOfBirth: z.string().datetime().optional(),
  address: z.object({
    street: z.string(),
    city: z.string(),
    postcode: z.string(),
    country: z.string().default('UK'),
  }).optional(),
  
  // Emergency contact
  emergencyContact: z.object({
    name: z.string(),
    phone: z.string(),
    relationship: z.string(),
  }).optional(),
});

// Driver-specific schema
export const driverSchema = baseUserSchema.extend({
  role: z.literal('driver'),
  
  // Driver license information
  licenseNumber: z.string().min(5, 'Valid license number is required'),
  licenseExpiry: z.string().datetime('Valid license expiry date is required'),
  licenseClass: z.string().min(1, 'License class is required'),
  
  // Vehicle information
  vehicle: z.object({
    make: z.string().min(1, 'Vehicle make is required'),
    model: z.string().min(1, 'Vehicle model is required'),
    year: z.number().int().min(1990).max(new Date().getFullYear() + 1),
    registration: z.string().min(3, 'Vehicle registration is required'),
    color: z.string().min(1, 'Vehicle color is required'),
    type: z.enum(['van', 'truck', 'car']),
    capacity: z.object({
      volume: z.number().min(0), // cubic meters
      weight: z.number().min(0), // kg
    }),
  }),
  
  // Insurance and documents
  insurance: z.object({
    provider: z.string().min(1, 'Insurance provider is required'),
    policyNumber: z.string().min(1, 'Policy number is required'),
    expiryDate: z.string().datetime('Valid insurance expiry date is required'),
  }),
  
  // Background check
  backgroundCheck: z.object({
    status: z.enum(['pending', 'approved', 'rejected']),
    checkedAt: z.string().datetime().optional(),
    validUntil: z.string().datetime().optional(),
  }).optional(),
  
  // Driver status and availability
  status: z.enum(['available', 'busy', 'offline']).default('offline'),
  location: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    accuracy: z.number().min(0).optional(),
    timestamp: z.string().datetime(),
  }).optional(),
  
  // Performance metrics
  metrics: z.object({
    rating: z.number().min(0).max(5).default(5),
    completedJobs: z.number().int().min(0).default(0),
    cancelledJobs: z.number().int().min(0).default(0),
    totalEarnings: z.number().min(0).default(0),
    averageResponseTime: z.number().min(0).optional(), // minutes
  }).optional(),
});

// Admin-specific schema
export const adminSchema = baseUserSchema.extend({
  role: z.literal('admin'),
  
  permissions: z.array(z.enum([
    'manage_users',
    'manage_bookings', 
    'manage_drivers',
    'view_analytics',
    'manage_content',
    'manage_payments',
    'system_admin'
  ])).default(['manage_bookings']),
  
  department: z.string().optional(),
  lastLogin: z.string().datetime().optional(),
});

// User registration schemas
export const customerRegistrationSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Valid email address is required'),
  phone: z.string().regex(/^[\d\s\+\-\(\)]+$/, 'Valid phone number is required'),
  password: z.string().min(8, 'Password must be at least 8 characters')
    .regex(/(?=.*[a-z])/, 'Password must contain lowercase letter')
    .regex(/(?=.*[A-Z])/, 'Password must contain uppercase letter')
    .regex(/(?=.*\d)/, 'Password must contain number'),
  confirmPassword: z.string(),
  
  // Terms and privacy
  acceptTerms: z.boolean().refine(val => val === true, {
    message: 'You must accept the terms and conditions',
  }),
  marketingConsent: z.boolean().default(false),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const driverApplicationSchema = z.object({
  personalInfo: z.object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100, 'Name too long').transform(s => s.trim()),
    email: z.string().email('Invalid email format').max(100, 'Email too long').transform(s => s.toLowerCase().trim()),
    phone: z.string().min(10, 'Phone number too short').max(20, 'Phone number too long').regex(/^[\+]?[0-9\s\-\(\)]+$/, 'Invalid phone format')
  }),
  
  licenseInfo: z.object({
    licenseNumber: z.string().min(5, 'Valid license number is required'),
    licenseExpiry: z.string().datetime('Valid license expiry date is required'),
    licenseClass: z.string().min(1, 'License class is required'),
    yearsExperience: z.number().int().min(0).max(50),
  }),
  
  vehicleInfo: driverSchema.shape.vehicle,
  insuranceInfo: driverSchema.shape.insurance,
  
  // Additional application fields
  workAvailability: z.object({
    fullTime: z.boolean().default(false),
    partTime: z.boolean().default(false),
    weekends: z.boolean().default(false),
    evenings: z.boolean().default(false),
  }),
  
  references: z.array(z.object({
    name: z.string().min(1, 'Reference name is required'),
    phone: z.string().min(10, 'Valid phone number is required'),
    relationship: z.string().min(1, 'Relationship is required'),
  })).min(2, 'At least 2 references are required').max(5, 'Too many references'),
  
  // Documents
  documents: z.object({
    licensePhoto: z.string().url('Valid license photo URL is required'),
    insuranceCertificate: z.string().url('Valid insurance certificate URL is required'),
    vehicleRegistration: z.string().url('Valid vehicle registration URL is required'),
    profilePhoto: z.string().url().optional(),
  }),
  
  // Agreement
  acceptTerms: z.boolean().refine(val => val === true, {
    message: 'You must accept the terms and conditions',
  }),
});

// User update schemas
export const updateUserProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  phone: z.string().regex(/^[\d\s\+\-\(\)]+$/, 'Valid phone number is required').optional(),
  preferences: z.object({
    communicationMethod: z.enum(['email', 'sms', 'phone']).optional(),
    marketingConsent: z.boolean().optional(),
    language: z.string().length(2).optional(),
    timezone: z.string().optional(),
  }).optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters')
    .regex(/(?=.*[a-z])/, 'Password must contain lowercase letter')
    .regex(/(?=.*[A-Z])/, 'Password must contain uppercase letter')
    .regex(/(?=.*\d)/, 'Password must contain number'),
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

// Login schema
export const loginSchema = z.object({
  email: z.string().email('Valid email address is required'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().default(false),
});

// Password reset schemas
export const resetPasswordRequestSchema = z.object({
  email: z.string().email('Valid email address is required'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters')
    .regex(/(?=.*[a-z])/, 'Password must contain lowercase letter')
    .regex(/(?=.*[A-Z])/, 'Password must contain uppercase letter')
    .regex(/(?=.*\d)/, 'Password must contain number'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

// Export types
export type BaseUser = z.infer<typeof baseUserSchema>;
export type Customer = z.infer<typeof customerSchema>;
export type Driver = z.infer<typeof driverSchema>;
export type Admin = z.infer<typeof adminSchema>;
export type CustomerRegistration = z.infer<typeof customerRegistrationSchema>;
export type DriverApplication = z.infer<typeof driverApplicationSchema>;
export type UpdateUserProfile = z.infer<typeof updateUserProfileSchema>;
export type ChangePassword = z.infer<typeof changePasswordSchema>;
export type Login = z.infer<typeof loginSchema>;
export type ResetPasswordRequest = z.infer<typeof resetPasswordRequestSchema>;
export type ResetPassword = z.infer<typeof resetPasswordSchema>;

// Validation helpers
export function validateCustomerRegistration(data: unknown): CustomerRegistration {
  return customerRegistrationSchema.parse(data);
}

export function validateDriverApplication(data: unknown): DriverApplication {
  return driverApplicationSchema.parse(data);
}

export function validateLogin(data: unknown): Login {
  return loginSchema.parse(data);
}

export function validateUpdateProfile(data: unknown): UpdateUserProfile {
  return updateUserProfileSchema.parse(data);
}

export function validateChangePassword(data: unknown): ChangePassword {
  return changePasswordSchema.parse(data);
}
