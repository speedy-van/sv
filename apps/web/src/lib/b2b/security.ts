/**
 * B2B Security Utilities
 * 
 * Security functions for API key management, encryption, and protection
 */

import crypto from 'crypto';

// ============================================
// API Key Generation & Hashing
// ============================================

const API_KEY_PREFIX = 'sv_b2b_';
const API_KEY_LENGTH = 32; // 32 bytes = 64 hex characters

/**
 * Generate a new API key
 * Returns both the raw key (to show once) and the hashed key (to store)
 */
export function generateApiKey(): { rawKey: string; hashedKey: string; prefix: string } {
  // Generate random bytes
  const randomBytes = crypto.randomBytes(API_KEY_LENGTH);
  const keyBody = randomBytes.toString('hex');
  
  // Create the full key with prefix
  const rawKey = `${API_KEY_PREFIX}${keyBody}`;
  
  // Hash the key for storage
  const hashedKey = hashApiKey(rawKey);
  
  // Get prefix for display (first 8 chars after prefix)
  const prefix = `${API_KEY_PREFIX}${keyBody.substring(0, 8)}`;
  
  return { rawKey, hashedKey, prefix };
}

/**
 * Hash an API key for secure storage
 */
export function hashApiKey(rawKey: string): string {
  return crypto
    .createHash('sha256')
    .update(rawKey)
    .digest('hex');
}

/**
 * Verify an API key against a stored hash
 */
export function verifyApiKey(rawKey: string, hashedKey: string): boolean {
  const computedHash = hashApiKey(rawKey);
  return crypto.timingSafeEqual(
    Buffer.from(computedHash),
    Buffer.from(hashedKey)
  );
}

/**
 * Validate API key format
 */
export function isValidApiKeyFormat(key: string): boolean {
  // Must start with prefix and have correct length
  if (!key.startsWith(API_KEY_PREFIX)) return false;
  
  const keyBody = key.substring(API_KEY_PREFIX.length);
  // Key body should be 64 hex characters
  return /^[a-f0-9]{64}$/i.test(keyBody);
}

// ============================================
// Webhook Signature
// ============================================

/**
 * Generate a webhook secret
 */
export function generateWebhookSecret(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Sign a webhook payload
 */
export function signWebhookPayload(payload: string, secret: string): string {
  return crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
}

/**
 * Verify a webhook signature
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = signWebhookPayload(payload, secret);
  
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch {
    return false;
  }
}

// ============================================
// IP Validation
// ============================================

/**
 * Check if an IP is in a whitelist
 */
export function isIpWhitelisted(ip: string, whitelist: string[]): boolean {
  if (!whitelist || whitelist.length === 0) return true;
  
  return whitelist.some(allowed => {
    // Check for exact match
    if (allowed === ip) return true;
    
    // Check for CIDR notation
    if (allowed.includes('/')) {
      return isIpInCidr(ip, allowed);
    }
    
    // Check for wildcard
    if (allowed.includes('*')) {
      const pattern = allowed.replace(/\*/g, '.*');
      return new RegExp(`^${pattern}$`).test(ip);
    }
    
    return false;
  });
}

/**
 * Check if an IP is within a CIDR range
 */
function isIpInCidr(ip: string, cidr: string): boolean {
  const [range, bits] = cidr.split('/');
  const mask = parseInt(bits, 10);
  
  const ipParts = ip.split('.').map(Number);
  const rangeParts = range.split('.').map(Number);
  
  const ipNum = (ipParts[0] << 24) + (ipParts[1] << 16) + (ipParts[2] << 8) + ipParts[3];
  const rangeNum = (rangeParts[0] << 24) + (rangeParts[1] << 16) + (rangeParts[2] << 8) + rangeParts[3];
  const maskNum = ~((1 << (32 - mask)) - 1);
  
  return (ipNum & maskNum) === (rangeNum & maskNum);
}

// ============================================
// Rate Limiting
// ============================================

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

// In-memory store (use Redis in production)
const rateLimitStore = new Map<string, RateLimitRecord>();

/**
 * Check and update rate limit
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number = 60000
): { allowed: boolean; remaining: number; resetAt: Date } {
  const now = Date.now();
  let record = rateLimitStore.get(key);
  
  // Reset if window expired
  if (!record || now > record.resetAt) {
    record = {
      count: 0,
      resetAt: now + windowMs,
    };
  }
  
  record.count++;
  rateLimitStore.set(key, record);
  
  const remaining = Math.max(0, limit - record.count);
  const resetAt = new Date(record.resetAt);
  
  return {
    allowed: record.count <= limit,
    remaining,
    resetAt,
  };
}

/**
 * Clear rate limit for a key
 */
export function clearRateLimit(key: string): void {
  rateLimitStore.delete(key);
}

// ============================================
// Encryption
// ============================================

const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

/**
 * Encrypt sensitive data
 */
export function encrypt(text: string, key: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const keyBuffer = crypto.scryptSync(key, 'salt', 32);
  
  const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, keyBuffer, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  // Combine IV + AuthTag + Encrypted data
  return iv.toString('hex') + authTag.toString('hex') + encrypted;
}

/**
 * Decrypt sensitive data
 */
export function decrypt(encryptedText: string, key: string): string {
  const iv = Buffer.from(encryptedText.slice(0, IV_LENGTH * 2), 'hex');
  const authTag = Buffer.from(encryptedText.slice(IV_LENGTH * 2, (IV_LENGTH + AUTH_TAG_LENGTH) * 2), 'hex');
  const encrypted = encryptedText.slice((IV_LENGTH + AUTH_TAG_LENGTH) * 2);
  
  const keyBuffer = crypto.scryptSync(key, 'salt', 32);
  
  const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, keyBuffer, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

// ============================================
// Token Generation
// ============================================

/**
 * Generate a secure random token
 */
export function generateToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Generate a URL-safe token
 */
export function generateUrlSafeToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('base64url');
}

/**
 * Generate an invitation token with expiry
 */
export function generateInvitationToken(): { token: string; expiresAt: Date } {
  const token = generateUrlSafeToken(32);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry
  
  return { token, expiresAt };
}

// ============================================
// Input Sanitization
// ============================================

/**
 * Sanitize string input
 */
export function sanitizeString(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .substring(0, 10000); // Limit length
}

/**
 * Mask sensitive data for logging
 */
export function maskSensitiveData(data: string, visibleChars: number = 4): string {
  if (data.length <= visibleChars * 2) {
    return '*'.repeat(data.length);
  }
  
  const start = data.substring(0, visibleChars);
  const end = data.substring(data.length - visibleChars);
  const masked = '*'.repeat(data.length - visibleChars * 2);
  
  return `${start}${masked}${end}`;
}

// ============================================
// Exports
// ============================================

export default {
  generateApiKey,
  hashApiKey,
  verifyApiKey,
  isValidApiKeyFormat,
  generateWebhookSecret,
  signWebhookPayload,
  verifyWebhookSignature,
  isIpWhitelisted,
  checkRateLimit,
  clearRateLimit,
  encrypt,
  decrypt,
  generateToken,
  generateUrlSafeToken,
  generateInvitationToken,
  sanitizeString,
  maskSensitiveData,
};
