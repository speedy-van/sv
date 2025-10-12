import { z } from 'zod';

export const idParam = z.object({ id: z.string().min(1) }); // adjust to cuid/uuid if used

export const userCreate = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  role: z.enum(['admin', 'driver', 'customer']).default('customer'),
});

export const userUpdate = userCreate.partial();

export const customerCreate = z.object({
  name: z.string().min(1),
  phone: z.string().min(6),
  email: z.string().email().optional(),
});

export const driverProfileUpdate = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().min(6).optional(),
  vehicleType: z.string().min(1).optional(),
  licenseNumber: z.string().min(1).optional(),
});

export const bookingIdParam = idParam;

export const paginationQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const searchQuery = z.object({
  search: z.string().optional(),
  status: z.string().optional(),
  role: z.string().optional(),
});

export const adminUserCreate = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  adminRole: z.enum(['superadmin', 'ops', 'support', 'read_only']),
  isActive: z.boolean().default(true),
});

export const adminUserUpdate = adminUserCreate
  .partial()
  .omit({ password: true });

export const driverApplicationCreate = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  phone: z.string().min(6),
  dateOfBirth: z.string(),
  nationalInsuranceNumber: z.string().min(1),
  addressLine1: z.string().min(1),
  addressLine2: z.string().optional(),
  city: z.string().min(1),
  postcode: z.string().min(1),
  county: z.string().optional(),
  drivingLicenseNumber: z.string().min(1),
  drivingLicenseExpiry: z.string(),
  insuranceProvider: z.string().min(1),
  insurancePolicyNumber: z.string().min(1),
  insuranceExpiry: z.string(),
  bankName: z.string().min(1),
  accountHolderName: z.string().min(1),
  sortCode: z.string().min(1),
  accountNumber: z.string().min(1),
  rightToWorkShareCode: z.string().min(1),
  emergencyContactName: z.string().min(1),
  emergencyContactPhone: z.string().min(1),
  emergencyContactRelationship: z.string().min(1),
  agreeToTerms: z.boolean(),
  agreeToDataProcessing: z.boolean(),
  agreeToBackgroundCheck: z.boolean(),
});

export const driverAvailabilityUpdate = z.object({
  availability: z.enum(['available', 'busy', 'offline']),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export const driverProfileUpdateExtended = z.object({
  name: z.string().min(1).optional(),
  basePostcode: z.string().min(1).optional(),
  vehicleType: z.string().min(1).optional(),
  vehicle: z
    .object({
      make: z.string().min(1),
      model: z.string().min(1),
      reg: z.string().min(1),
      weightClass: z.string().min(1),
      motExpiry: z.string().optional(),
    })
    .optional(),
  checks: z
    .object({
      rtwMethod: z.enum(['manual', 'online']).optional(),
      rtwResultRef: z.string().optional(),
      rtwExpiresAt: z.string().optional(),
      dvlaCheckRef: z.string().optional(),
      licenceCategories: z.array(z.string()).optional(),
      points: z.number().optional(),
      licenceExpiry: z.string().optional(),
      dbsType: z.enum(['basic']).optional(),
      dbsCheckRef: z.string().optional(),
      dbsCheckedAt: z.string().optional(),
      dbsRetentionUntil: z.string().optional(),
      insurancePolicyNo: z.string().optional(),
      insurer: z.string().optional(),
      coverType: z.string().optional(),
      goodsInTransit: z.boolean().optional(),
      publicLiability: z.boolean().optional(),
      policyStart: z.string().optional(),
      policyEnd: z.string().optional(),
    })
    .optional(),
});
