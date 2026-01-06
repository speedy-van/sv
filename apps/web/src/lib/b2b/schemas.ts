/**
 * B2B Validation Schemas
 * 
 * Zod schemas for validating B2B API requests
 */

import { z } from 'zod';

// ============================================
// Common Schemas
// ============================================

export const PaginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export const DateRangeSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

// ============================================
// Company Schemas
// ============================================

export const CompanyStatusEnum = z.enum(['PENDING', 'ACTIVE', 'SUSPENDED', 'CLOSED']);

export const CreateCompanySchema = z.object({
  name: z.string().min(2).max(100),
  legalName: z.string().max(200).optional(),
  vatNumber: z.string().regex(/^(GB)?[0-9]{9}([0-9]{3})?$/).optional().or(z.literal('')),
  companyNumber: z.string().regex(/^[0-9]{8}$/).optional().or(z.literal('')),
  industry: z.string().max(50).optional(),
  website: z.string().url().optional().or(z.literal('')),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().max(20).optional(),
  billingAddressLine1: z.string().max(200).optional(),
  billingAddressLine2: z.string().max(200).optional(),
  billingCity: z.string().max(100).optional(),
  billingPostcode: z.string().max(10).optional(),
  creditLimitGBP: z.number().min(0).default(0),
  paymentTermsDays: z.number().min(0).max(365).default(30),
});

export const UpdateCompanySchema = CreateCompanySchema.partial().extend({
  status: CompanyStatusEnum.optional(),
});

export const ListCompaniesSchema = PaginationSchema.extend({
  search: z.string().optional(),
  status: CompanyStatusEnum.optional(),
  industry: z.string().optional(),
});

// ============================================
// Company User Schemas
// ============================================

export const CompanyUserRoleEnum = z.enum(['OWNER', 'ADMIN', 'MEMBER', 'VIEWER']);

export const InviteCompanyUserSchema = z.object({
  email: z.string().email(),
  role: CompanyUserRoleEnum.default('MEMBER'),
  name: z.string().max(100).optional(),
});

export const UpdateCompanyUserRoleSchema = z.object({
  userId: z.string().uuid(),
  role: CompanyUserRoleEnum,
});

// ============================================
// API Key Schemas
// ============================================

export const ApiKeyScopeEnum = z.enum([
  'bookings:read',
  'bookings:write',
  'bookings:cancel',
  'quotes:read',
  'quotes:write',
  'quotes:accept',
  'invoices:read',
  'invoices:download',
  'company:read',
  'company:users',
  'webhooks:read',
  'webhooks:write',
  'tracking:read',
]);

export const ApiKeyStatusEnum = z.enum(['ACTIVE', 'SUSPENDED', 'REVOKED', 'EXPIRED']);

export const CreateApiKeySchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  scopes: z.array(ApiKeyScopeEnum).min(1),
  expiresAt: z.string().datetime().optional(),
  ipWhitelist: z.array(z.string().ip()).optional(),
  rateLimitPerMin: z.number().min(10).max(10000).default(60),
});

export const UpdateApiKeySchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().max(500).optional(),
  scopes: z.array(ApiKeyScopeEnum).min(1).optional(),
  ipWhitelist: z.array(z.string().ip()).optional(),
  rateLimitPerMin: z.number().min(10).max(10000).optional(),
  status: z.enum(['ACTIVE', 'SUSPENDED']).optional(),
});

export const RevokeApiKeySchema = z.object({
  reason: z.string().max(500).optional(),
});

// ============================================
// Quote Schemas
// ============================================

export const QuoteStatusEnum = z.enum([
  'DRAFT',
  'PENDING',
  'ACCEPTED',
  'REJECTED',
  'EXPIRED',
  'CONVERTED',
]);

export const CreateQuoteSchema = z.object({
  pickupAddress: z.string().min(5).max(500),
  pickupPostcode: z.string().regex(/^[A-Z]{1,2}[0-9][0-9A-Z]?\s?[0-9][A-Z]{2}$/i),
  pickupLatitude: z.number().min(-90).max(90).optional(),
  pickupLongitude: z.number().min(-180).max(180).optional(),
  deliveryAddress: z.string().min(5).max(500),
  deliveryPostcode: z.string().regex(/^[A-Z]{1,2}[0-9][0-9A-Z]?\s?[0-9][A-Z]{2}$/i),
  deliveryLatitude: z.number().min(-90).max(90).optional(),
  deliveryLongitude: z.number().min(-180).max(180).optional(),
  vehicleType: z.enum(['SMALL_VAN', 'MEDIUM_VAN', 'LARGE_VAN', 'LUTON', 'XLWB']),
  requestedDate: z.string().datetime(),
  requestedTimeSlot: z.enum(['MORNING', 'AFTERNOON', 'EVENING', 'ANYTIME']).optional(),
  helpers: z.number().min(0).max(3).default(0),
  floorAccess: z.enum(['GROUND', 'LIFT', 'STAIRS']).default('GROUND'),
  floorNumber: z.number().min(0).max(50).optional(),
  itemDescription: z.string().max(1000).optional(),
  specialRequirements: z.string().max(1000).optional(),
  poNumber: z.string().max(50).optional(),
  reference: z.string().max(100).optional(),
});

export const AcceptQuoteSchema = z.object({
  quoteId: z.string().uuid(),
  poNumber: z.string().max(50).optional(),
  contactName: z.string().max(100).optional(),
  contactPhone: z.string().max(20).optional(),
  specialInstructions: z.string().max(1000).optional(),
});

export const ListQuotesSchema = PaginationSchema.extend({
  status: QuoteStatusEnum.optional(),
  ...DateRangeSchema.shape,
});

// ============================================
// Booking Schemas
// ============================================

export const BookingStatusEnum = z.enum([
  'PENDING',
  'CONFIRMED',
  'ASSIGNED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
]);

export const CreateBookingSchema = z.object({
  quoteId: z.string().uuid().optional(),
  pickupAddress: z.string().min(5).max(500),
  pickupPostcode: z.string().regex(/^[A-Z]{1,2}[0-9][0-9A-Z]?\s?[0-9][A-Z]{2}$/i),
  pickupLatitude: z.number().min(-90).max(90).optional(),
  pickupLongitude: z.number().min(-180).max(180).optional(),
  pickupContactName: z.string().max(100),
  pickupContactPhone: z.string().max(20),
  deliveryAddress: z.string().min(5).max(500),
  deliveryPostcode: z.string().regex(/^[A-Z]{1,2}[0-9][0-9A-Z]?\s?[0-9][A-Z]{2}$/i),
  deliveryLatitude: z.number().min(-90).max(90).optional(),
  deliveryLongitude: z.number().min(-180).max(180).optional(),
  deliveryContactName: z.string().max(100),
  deliveryContactPhone: z.string().max(20),
  vehicleType: z.enum(['SMALL_VAN', 'MEDIUM_VAN', 'LARGE_VAN', 'LUTON', 'XLWB']),
  scheduledDate: z.string().datetime(),
  scheduledTimeSlot: z.enum(['MORNING', 'AFTERNOON', 'EVENING', 'ANYTIME']).optional(),
  helpers: z.number().min(0).max(3).default(0),
  itemDescription: z.string().max(1000).optional(),
  specialRequirements: z.string().max(1000).optional(),
  poNumber: z.string().max(50).optional(),
  reference: z.string().max(100).optional(),
});

export const CancelBookingSchema = z.object({
  reason: z.string().max(500),
});

export const ListBookingsSchema = PaginationSchema.extend({
  status: BookingStatusEnum.optional(),
  ...DateRangeSchema.shape,
});

// ============================================
// Invoice Schemas
// ============================================

export const InvoiceStatusEnum = z.enum([
  'DRAFT',
  'SENT',
  'VIEWED',
  'PARTIALLY_PAID',
  'PAID',
  'OVERDUE',
  'CANCELLED',
]);

export const ListInvoicesSchema = PaginationSchema.extend({
  status: InvoiceStatusEnum.optional(),
  overdueOnly: z.coerce.boolean().optional(),
  ...DateRangeSchema.shape,
});

export const RecordPaymentSchema = z.object({
  invoiceId: z.string().uuid(),
  amountGBP: z.number().positive(),
  paymentMethod: z.enum(['BANK_TRANSFER', 'CARD', 'DIRECT_DEBIT', 'CHEQUE', 'OTHER']),
  paymentReference: z.string().max(100).optional(),
  paymentDate: z.string().datetime().optional(),
  notes: z.string().max(500).optional(),
});

// ============================================
// Pricing Rule Schemas
// ============================================

export const PricingRuleTypeEnum = z.enum([
  'DISTANCE',
  'VOLUME',
  'TIME',
  'DISCOUNT',
  'SURCHARGE',
]);

export const CreatePricingRuleSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  ruleType: PricingRuleTypeEnum,
  priority: z.number().min(0).max(1000).default(100),
  isActive: z.boolean().default(true),
  baseRateGBP: z.number().min(0).optional(),
  perMileRateGBP: z.number().min(0).optional(),
  minChargeGBP: z.number().min(0).optional(),
  maxChargeGBP: z.number().min(0).optional(),
  discountPercent: z.number().min(0).max(100).optional(),
  discountFixedGBP: z.number().min(0).optional(),
  peakMultiplier: z.number().min(1).max(5).optional(),
  weekendMultiplier: z.number().min(1).max(5).optional(),
  validFrom: z.string().datetime().optional(),
  validTo: z.string().datetime().optional(),
  conditions: z.record(z.any()).optional(),
});

export const UpdatePricingRuleSchema = CreatePricingRuleSchema.partial();

// ============================================
// Webhook Schemas
// ============================================

export const WebhookEventEnum = z.enum([
  'booking.created',
  'booking.confirmed',
  'booking.assigned',
  'booking.started',
  'booking.completed',
  'booking.cancelled',
  'quote.created',
  'quote.accepted',
  'quote.expired',
  'invoice.created',
  'invoice.sent',
  'invoice.paid',
  'invoice.overdue',
]);

export const CreateWebhookSchema = z.object({
  url: z.string().url(),
  events: z.array(WebhookEventEnum).min(1),
  secret: z.string().min(16).max(64).optional(),
  isActive: z.boolean().default(true),
  description: z.string().max(500).optional(),
});

export const UpdateWebhookSchema = CreateWebhookSchema.partial();

// ============================================
// Audit Log Schemas
// ============================================

export const AuditActionEnum = z.enum([
  'COMPANY_CREATED',
  'COMPANY_UPDATED',
  'COMPANY_SUSPENDED',
  'COMPANY_ACTIVATED',
  'USER_ADDED',
  'USER_REMOVED',
  'USER_ROLE_UPDATED',
  'API_KEY_CREATED',
  'API_KEY_REVOKED',
  'API_KEY_SUSPENDED',
  'CREDIT_LIMIT_UPDATED',
  'PRICING_RULE_CREATED',
  'PRICING_RULE_UPDATED',
  'PRICING_RULE_DELETED',
  'QUOTE_CREATED',
  'QUOTE_ACCEPTED',
  'QUOTE_REJECTED',
  'BOOKING_CREATED',
  'BOOKING_CANCELLED',
  'INVOICE_CREATED',
  'INVOICE_SENT',
  'PAYMENT_RECORDED',
  'WEBHOOK_CREATED',
  'WEBHOOK_DELETED',
]);

export const ListAuditLogsSchema = PaginationSchema.extend({
  action: AuditActionEnum.optional(),
  actorType: z.enum(['user', 'admin', 'system', 'api_key']).optional(),
  ...DateRangeSchema.shape,
});

// ============================================
// Type Exports
// ============================================

export type CreateCompanyInput = z.infer<typeof CreateCompanySchema>;
export type UpdateCompanyInput = z.infer<typeof UpdateCompanySchema>;
export type ListCompaniesInput = z.infer<typeof ListCompaniesSchema>;
export type InviteCompanyUserInput = z.infer<typeof InviteCompanyUserSchema>;
export type UpdateCompanyUserRoleInput = z.infer<typeof UpdateCompanyUserRoleSchema>;
export type CreateApiKeyInput = z.infer<typeof CreateApiKeySchema>;
export type UpdateApiKeyInput = z.infer<typeof UpdateApiKeySchema>;
export type CreateQuoteInput = z.infer<typeof CreateQuoteSchema>;
export type AcceptQuoteInput = z.infer<typeof AcceptQuoteSchema>;
export type ListQuotesInput = z.infer<typeof ListQuotesSchema>;
export type CreateBookingInput = z.infer<typeof CreateBookingSchema>;
export type CancelBookingInput = z.infer<typeof CancelBookingSchema>;
export type ListBookingsInput = z.infer<typeof ListBookingsSchema>;
export type ListInvoicesInput = z.infer<typeof ListInvoicesSchema>;
export type RecordPaymentInput = z.infer<typeof RecordPaymentSchema>;
export type CreatePricingRuleInput = z.infer<typeof CreatePricingRuleSchema>;
export type UpdatePricingRuleInput = z.infer<typeof UpdatePricingRuleSchema>;
export type CreateWebhookInput = z.infer<typeof CreateWebhookSchema>;
export type UpdateWebhookInput = z.infer<typeof UpdateWebhookSchema>;
export type ListAuditLogsInput = z.infer<typeof ListAuditLogsSchema>;
