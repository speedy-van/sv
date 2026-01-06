/**
 * B2B Services Index
 * 
 * Central export point for all B2B-related services
 */

// Services
export { companyService } from './company.service';
export { apiKeyService, API_SCOPES } from './apikey.service';
export { companyAuditService, AUDIT_ACTIONS } from './audit.service';
export { companyQuoteService } from './quote.service';
export { companyPricingService } from './pricing.service';
export { companyInvoiceService } from './invoice.service';

// Types
export type { 
  CreateCompanyInput, 
  UpdateCompanyInput, 
  InviteUserInput, 
  CompanyListFilters 
} from './company.service';

export type { 
  CreateApiKeyInput, 
  ValidateApiKeyResult, 
  ApiKeyListFilters,
  ApiScope 
} from './apikey.service';

export type { 
  AuditLogInput, 
  AuditLogFilters,
  AuditAction 
} from './audit.service';

export type { 
  CreateQuoteInput, 
  QuoteListFilters 
} from './quote.service';

export type { 
  PricingInput, 
  PricingResult, 
  PricingBreakdown,
  CreatePricingRuleInput 
} from './pricing.service';

export type { 
  CreateInvoiceInput, 
  InvoiceItemInput, 
  InvoiceListFilters,
  RecordPaymentInput 
} from './invoice.service';

// Middleware
export { 
  validateApiKeyAuth, 
  requireApiScope, 
  checkRateLimit, 
  withApiAuth,
  apiResponse,
  apiError,
  extractApiKey,
  getClientIp 
} from './middleware';

// Schemas
export * from './schemas';

// Audit Logger
export { auditLogger } from './audit-logger';
export type { AuditLogEntry, AuditLogFilter } from './audit-logger';

// Security
export {
  generateApiKey,
  hashApiKey,
  verifyApiKey,
  isValidApiKeyFormat,
  generateWebhookSecret,
  signWebhookPayload,
  verifyWebhookSignature,
  isIpWhitelisted,
  generateToken,
  generateUrlSafeToken,
  generateInvitationToken,
  sanitizeString,
  maskSensitiveData,
} from './security';
