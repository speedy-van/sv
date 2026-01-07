/**
 * API Key Service
 * 
 * Handles secure API key generation, hashing, and validation.
 * Uses HMAC-SHA256 with server-side pepper for maximum security.
 * 
 * SECURITY:
 * - Raw keys are shown ONCE only during generation
 * - Only hashed keys are stored in database
 * - Uses timing-safe comparison to prevent timing attacks
 * - Server-side pepper stored in environment variable
 */

import { prisma } from '@/lib/prisma';
import { createHmac, randomBytes, timingSafeEqual } from 'crypto';

export interface ApiKeyGenerationResult {
  id: string;
  rawKey: string;  // Show this ONCE only
  keyPrefix: string;
  hashedKey: string;
  scopes: string[];
  createdAt: Date;
}

export class ApiKeyService {
  private static readonly KEY_PREFIX = 'sk_live_';
  private static readonly KEY_LENGTH = 32; // bytes, will be hex encoded to 64 chars
  private static readonly PEPPER = process.env.API_KEY_PEPPER || 'default-pepper-change-in-production';

  /**
   * Generate a secure random API key
   * Format: sk_live_[64 hex characters]
   */
  private static generateRawKey(): string {
    const randomPart = randomBytes(this.KEY_LENGTH).toString('hex');
    return `${this.KEY_PREFIX}${randomPart}`;
  }

  /**
   * Hash an API key using HMAC-SHA256 with server-side pepper
   * This prevents rainbow table attacks and provides additional security layer
   */
  private static hashKey(rawKey: string): string {
    return createHmac('sha256', this.PEPPER)
      .update(rawKey)
      .digest('hex');
  }

  /**
   * Extract key prefix for quick lookup (first 12 chars)
   * e.g., "sk_live_abc1" from "sk_live_abc123def456..."
   */
  private static extractPrefix(rawKey: string): string {
    return rawKey.substring(0, 12);
  }

  /**
   * Timing-safe comparison of API keys
   * Prevents timing attacks that could leak information about the key
   */
  private static timingSafeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }
    
    const bufferA = Buffer.from(a, 'hex');
    const bufferB = Buffer.from(b, 'hex');
    
    return timingSafeEqual(bufferA, bufferB);
  }

  /**
   * Generate a new API key for a company
   * 
   * @param companyId - Company ID
   * @param name - Friendly name for the key
   * @param scopes - Array of permission scopes
   * @param createdBy - User ID of creator
   * @param options - Additional options (expiry, rate limits, IP whitelist)
   * @returns API key generation result with raw key (show once only)
   */
  static async generate(
    companyId: string,
    name: string,
    scopes: string[],
    createdBy: string,
    options: {
      description?: string;
      expiresAt?: Date;
      rateLimitPerMin?: number;
      rateLimitPerDay?: number;
      allowedIps?: string[];
      allowedDomains?: string[];
    } = {}
  ): Promise<ApiKeyGenerationResult> {
    // Generate raw key
    const rawKey = this.generateRawKey();
    const hashedKey = this.hashKey(rawKey);
    const keyPrefix = this.extractPrefix(rawKey);

    // Create in database
    const apiKey = await prisma.apiKey.create({
      data: {
        companyId,
        name,
        description: options.description,
        hashedKey,
        keyPrefix,
        scopes,
        status: 'ACTIVE',
        expiresAt: options.expiresAt,
        rateLimitPerMin: options.rateLimitPerMin || 60,
        rateLimitPerDay: options.rateLimitPerDay || 10000,
        allowedIps: options.allowedIps || [],
        allowedDomains: options.allowedDomains || [],
        createdBy,
      },
    });

    // Log creation
    await prisma.companyAuditLog.create({
      data: {
        companyId,
        action: 'API_KEY_CREATED',
        actorId: createdBy,
        actorType: 'USER',
        targetType: 'api_key',
        targetId: apiKey.id,
        metadata: {
          name,
          scopes,
          keyPrefix,
        },
      },
    });

    return {
      id: apiKey.id,
      rawKey, // SHOW THIS ONCE ONLY
      keyPrefix,
      hashedKey,
      scopes,
      createdAt: apiKey.createdAt,
    };
  }

  /**
   * Validate an API key and return associated data
   * 
   * Uses timing-safe comparison and logs usage.
   * Updates lastUsedAt and usageCount.
   * 
   * @param rawKey - The raw API key from request header
   * @param requestIp - IP address of the request (optional, for validation)
   * @returns API key data if valid, null if invalid
   */
  static async validate(
    rawKey: string,
    requestIp?: string
  ): Promise<{
    valid: boolean;
    apiKey?: {
      id: string;
      companyId: string;
      scopes: string[];
      rateLimitPerMin: number;
      rateLimitPerDay: number;
    };
    error?: string;
  }> {
    try {
      // Basic format check
      if (!rawKey || !rawKey.startsWith(this.KEY_PREFIX)) {
        return { valid: false, error: 'Invalid API key format' };
      }

      // Extract prefix for quick lookup
      const keyPrefix = this.extractPrefix(rawKey);
      const hashedKey = this.hashKey(rawKey);

      // Find by prefix first (indexed, fast)
      const apiKey = await prisma.apiKey.findFirst({
        where: {
          keyPrefix,
          status: 'ACTIVE',
        },
        include: {
          Company: {
            select: {
              id: true,
              status: true,
              name: true,
            },
          },
        },
      });

      if (!apiKey) {
        return { valid: false, error: 'Invalid API key' };
      }

      // Timing-safe comparison of full hashed key
      if (!this.timingSafeCompare(hashedKey, apiKey.hashedKey)) {
        return { valid: false, error: 'Invalid API key' };
      }

      // Check company status
      if (apiKey.Company.status !== 'ACTIVE') {
        return { valid: false, error: 'Company account is not active' };
      }

      // Check expiry
      if (apiKey.expiresAt && new Date() > apiKey.expiresAt) {
        return { valid: false, error: 'API key has expired' };
      }

      // Check IP whitelist
      if (requestIp && apiKey.allowedIps.length > 0) {
        if (!apiKey.allowedIps.includes(requestIp)) {
          return { valid: false, error: 'IP address not whitelisted' };
        }
      }

      // Update usage stats (fire and forget, don't block response)
      this.recordUsage(apiKey.id, requestIp).catch((err) => {
        console.error('Failed to record API key usage:', err);
      });

      return {
        valid: true,
        apiKey: {
          id: apiKey.id,
          companyId: apiKey.companyId,
          scopes: apiKey.scopes,
          rateLimitPerMin: apiKey.rateLimitPerMin,
          rateLimitPerDay: apiKey.rateLimitPerDay,
        },
      };
    } catch (error) {
      console.error('API key validation error:', error);
      return { valid: false, error: 'API key validation failed' };
    }
  }

  /**
   * Record API key usage (async, non-blocking)
   */
  private static async recordUsage(apiKeyId: string, requestIp?: string): Promise<void> {
    await prisma.$transaction([
      // Update API key stats
      prisma.apiKey.update({
        where: { id: apiKeyId },
        data: {
          lastUsedAt: new Date(),
          lastUsedIp: requestIp,
          usageCount: { increment: 1 },
        },
      }),
      // Log detailed usage
      prisma.apiKeyUsageLog.create({
        data: {
          apiKeyId,
          timestamp: new Date(),
          ipAddress: requestIp,
          endpoint: '', // Will be filled by middleware
          method: '', // Will be filled by middleware
          statusCode: 200,
          responseTime: 0,
        },
      }),
    ]);
  }

  /**
   * Revoke an API key
   */
  static async revoke(
    apiKeyId: string,
    revokedBy: string,
    reason?: string
  ): Promise<void> {
    const apiKey = await prisma.apiKey.findUnique({
      where: { id: apiKeyId },
      select: { companyId: true, name: true },
    });

    if (!apiKey) {
      throw new Error('API key not found');
    }

    await prisma.apiKey.update({
      where: { id: apiKeyId },
      data: {
        status: 'REVOKED',
        revokedAt: new Date(),
        revokedBy,
        revokedReason: reason,
      },
    });

    // Log revocation
    await prisma.companyAuditLog.create({
      data: {
        companyId: apiKey.companyId,
        action: 'API_KEY_REVOKED',
        actorId: revokedBy,
        actorType: 'USER',
        targetType: 'api_key',
        targetId: apiKeyId,
        metadata: {
          name: apiKey.name,
          reason,
        },
      },
    });
  }

  /**
   * List all API keys for a company (without revealing raw keys)
   */
  static async listForCompany(companyId: string): Promise<
    Array<{
      id: string;
      name: string;
      keyPrefix: string;
      scopes: string[];
      status: string;
      lastUsedAt: Date | null;
      usageCount: number;
      createdAt: Date;
      expiresAt: Date | null;
    }>
  > {
    const keys = await prisma.apiKey.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        scopes: true,
        status: true,
        lastUsedAt: true,
        usageCount: true,
        createdAt: true,
        expiresAt: true,
      },
    });

    return keys;
  }

  /**
   * Get API key usage statistics
   */
  static async getUsageStats(apiKeyId: string, days: number = 30): Promise<{
    totalRequests: number;
    dailyBreakdown: Array<{ date: string; count: number }>;
    topEndpoints: Array<{ endpoint: string; count: number }>;
  }> {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const logs = await prisma.apiKeyUsageLog.findMany({
      where: {
        apiKeyId,
        timestamp: { gte: since },
      },
      select: {
        timestamp: true,
        endpoint: true,
      },
    });

    // Calculate daily breakdown
    const dailyMap = new Map<string, number>();
    const endpointMap = new Map<string, number>();

    logs.forEach((log) => {
      const date = log.timestamp.toISOString().split('T')[0];
      dailyMap.set(date, (dailyMap.get(date) || 0) + 1);
      endpointMap.set(log.endpoint, (endpointMap.get(log.endpoint) || 0) + 1);
    });

    return {
      totalRequests: logs.length,
      dailyBreakdown: Array.from(dailyMap.entries())
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date)),
      topEndpoints: Array.from(endpointMap.entries())
        .map(([endpoint, count]) => ({ endpoint, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
    };
  }
}

export const apiKeyService = ApiKeyService;
