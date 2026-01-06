/**
 * B2B API Key Service
 * 
 * Handles all API key operations including:
 * - Key generation and hashing
 * - Key validation and authentication
 * - Rate limiting
 * - Usage logging
 * - Key rotation
 */

import { prisma } from '@/lib/prisma';
import { ApiKeyStatus, Prisma } from '@prisma/client';
import { randomBytes, createHash } from 'crypto';
import { companyAuditService } from './audit.service';

// Types
export interface CreateApiKeyInput {
  companyId: string;
  name: string;
  description?: string;
  scopes: string[];
  expiresAt?: Date;
  rateLimitPerMin?: number;
  rateLimitPerDay?: number;
  allowedIps?: string[];
  allowedDomains?: string[];
  createdBy: string;
}

export interface ValidateApiKeyResult {
  valid: boolean;
  apiKey?: {
    id: string;
    companyId: string;
    name: string;
    scopes: string[];
    rateLimitPerMin: number;
    rateLimitPerDay: number;
  };
  company?: {
    id: string;
    name: string;
    status: string;
  };
  error?: string;
}

export interface ApiKeyListFilters {
  companyId?: string;
  status?: ApiKeyStatus;
  page?: number;
  limit?: number;
}

// Available API scopes
export const API_SCOPES = {
  // Bookings
  'bookings:read': 'View bookings',
  'bookings:write': 'Create and update bookings',
  'bookings:cancel': 'Cancel bookings',
  
  // Quotes
  'quotes:read': 'View quotes',
  'quotes:write': 'Create and update quotes',
  'quotes:accept': 'Accept quotes',
  
  // Invoices
  'invoices:read': 'View invoices',
  'invoices:download': 'Download invoice PDFs',
  
  // Company
  'company:read': 'View company details',
  'company:users': 'Manage company users',
  
  // Webhooks
  'webhooks:read': 'View webhook endpoints',
  'webhooks:write': 'Manage webhook endpoints',
  
  // Tracking
  'tracking:read': 'Track shipments',
} as const;

export type ApiScope = keyof typeof API_SCOPES;

// Service Implementation
export const apiKeyService = {
  /**
   * Generate a new API key
   * Returns the raw key only once - it should be shown to the user immediately
   */
  async create(input: CreateApiKeyInput): Promise<{ apiKey: any; rawKey: string }> {
    // Generate a secure random key
    const rawKey = `sv_${randomBytes(32).toString('hex')}`;
    const keyPrefix = rawKey.substring(0, 10);
    
    // Hash the key for storage
    const hashedKey = this.hashKey(rawKey);

    const apiKey = await prisma.apiKey.create({
      data: {
        companyId: input.companyId,
        name: input.name,
        description: input.description,
        hashedKey,
        keyPrefix,
        scopes: input.scopes,
        expiresAt: input.expiresAt,
        rateLimitPerMin: input.rateLimitPerMin || 60,
        rateLimitPerDay: input.rateLimitPerDay || 10000,
        allowedIps: input.allowedIps || [],
        allowedDomains: input.allowedDomains || [],
        createdBy: input.createdBy,
        status: ApiKeyStatus.ACTIVE,
      },
    });

    // Log audit (don't include the raw key)
    await companyAuditService.log({
      companyId: input.companyId,
      actorId: input.createdBy,
      actorType: 'user',
      action: 'API_KEY_CREATED',
      targetType: 'api_key',
      targetId: apiKey.id,
      metadata: {
        name: input.name,
        scopes: input.scopes,
        keyPrefix,
      },
    });

    return { apiKey, rawKey };
  },

  /**
   * Hash an API key for storage
   */
  hashKey(rawKey: string): string {
    return createHash('sha256').update(rawKey).digest('hex');
  },

  /**
   * Validate an API key and return associated data
   */
  async validate(rawKey: string, ip?: string): Promise<ValidateApiKeyResult> {
    if (!rawKey || !rawKey.startsWith('sv_')) {
      return { valid: false, error: 'Invalid API key format' };
    }

    const hashedKey = this.hashKey(rawKey);

    const apiKey = await prisma.apiKey.findUnique({
      where: { hashedKey },
      include: {
        Company: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
      },
    });

    if (!apiKey) {
      return { valid: false, error: 'API key not found' };
    }

    // Check status
    if (apiKey.status !== ApiKeyStatus.ACTIVE) {
      return { valid: false, error: `API key is ${apiKey.status.toLowerCase()}` };
    }

    // Check expiry
    if (apiKey.expiresAt && new Date() > apiKey.expiresAt) {
      // Auto-expire the key
      await prisma.apiKey.update({
        where: { id: apiKey.id },
        data: { status: ApiKeyStatus.EXPIRED },
      });
      return { valid: false, error: 'API key has expired' };
    }

    // Check company status
    if (apiKey.Company.status !== 'ACTIVE') {
      return { valid: false, error: 'Company account is not active' };
    }

    // Check IP restrictions
    if (apiKey.allowedIps.length > 0 && ip && !apiKey.allowedIps.includes(ip)) {
      return { valid: false, error: 'IP address not allowed' };
    }

    // Update last used
    await prisma.apiKey.update({
      where: { id: apiKey.id },
      data: {
        lastUsedAt: new Date(),
        lastUsedIp: ip,
        usageCount: { increment: 1 },
      },
    });

    return {
      valid: true,
      apiKey: {
        id: apiKey.id,
        companyId: apiKey.companyId,
        name: apiKey.name,
        scopes: apiKey.scopes,
        rateLimitPerMin: apiKey.rateLimitPerMin,
        rateLimitPerDay: apiKey.rateLimitPerDay,
      },
      company: apiKey.Company,
    };
  },

  /**
   * Check if API key has required scope
   */
  hasScope(apiKeyScopes: string[], requiredScope: string): boolean {
    // Check for exact match or wildcard
    return apiKeyScopes.includes(requiredScope) || 
           apiKeyScopes.includes('*') ||
           apiKeyScopes.some(scope => {
             const [resource, action] = scope.split(':');
             const [reqResource, reqAction] = requiredScope.split(':');
             return resource === reqResource && action === '*';
           });
  },

  /**
   * Get API key by ID (without sensitive data)
   */
  async getById(id: string) {
    return prisma.apiKey.findUnique({
      where: { id },
      select: {
        id: true,
        companyId: true,
        name: true,
        description: true,
        keyPrefix: true,
        scopes: true,
        status: true,
        expiresAt: true,
        lastUsedAt: true,
        lastUsedIp: true,
        usageCount: true,
        rateLimitPerMin: true,
        rateLimitPerDay: true,
        allowedIps: true,
        allowedDomains: true,
        createdBy: true,
        createdAt: true,
      },
    });
  },

  /**
   * List API keys for a company
   */
  async list(filters: ApiKeyListFilters = {}) {
    const { companyId, status, page = 1, limit = 20 } = filters;

    const where: Prisma.ApiKeyWhereInput = {};
    
    if (companyId) {
      where.companyId = companyId;
    }
    
    if (status) {
      where.status = status;
    }

    const [keys, total] = await Promise.all([
      prisma.apiKey.findMany({
        where,
        select: {
          id: true,
          companyId: true,
          name: true,
          description: true,
          keyPrefix: true,
          scopes: true,
          status: true,
          expiresAt: true,
          lastUsedAt: true,
          usageCount: true,
          createdAt: true,
          Company: {
            select: {
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.apiKey.count({ where }),
    ]);

    return {
      keys,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * Revoke an API key
   */
  async revoke(id: string, reason: string, revokedBy: string) {
    const apiKey = await prisma.apiKey.update({
      where: { id },
      data: {
        status: ApiKeyStatus.REVOKED,
        revokedAt: new Date(),
        revokedBy,
        revokedReason: reason,
      },
    });

    await companyAuditService.log({
      companyId: apiKey.companyId,
      actorId: revokedBy,
      actorType: 'user',
      action: 'API_KEY_REVOKED',
      targetType: 'api_key',
      targetId: id,
      metadata: { reason },
    });

    return apiKey;
  },

  /**
   * Suspend an API key (can be reactivated)
   */
  async suspend(id: string, actorId: string) {
    const apiKey = await prisma.apiKey.update({
      where: { id },
      data: { status: ApiKeyStatus.SUSPENDED },
    });

    await companyAuditService.log({
      companyId: apiKey.companyId,
      actorId,
      actorType: 'user',
      action: 'API_KEY_SUSPENDED',
      targetType: 'api_key',
      targetId: id,
    });

    return apiKey;
  },

  /**
   * Reactivate a suspended API key
   */
  async reactivate(id: string, actorId: string) {
    const apiKey = await prisma.apiKey.update({
      where: { id },
      data: { status: ApiKeyStatus.ACTIVE },
    });

    await companyAuditService.log({
      companyId: apiKey.companyId,
      actorId,
      actorType: 'user',
      action: 'API_KEY_REACTIVATED',
      targetType: 'api_key',
      targetId: id,
    });

    return apiKey;
  },

  /**
   * Rotate an API key (create new, keep old active for grace period)
   */
  async rotate(id: string, actorId: string, gracePeriodHours: number = 24): Promise<{ newKey: any; rawKey: string }> {
    const oldKey = await prisma.apiKey.findUnique({
      where: { id },
    });

    if (!oldKey) {
      throw new Error('API key not found');
    }

    // Create new key with same settings
    const result = await this.create({
      companyId: oldKey.companyId,
      name: `${oldKey.name} (rotated)`,
      description: oldKey.description || undefined,
      scopes: oldKey.scopes,
      rateLimitPerMin: oldKey.rateLimitPerMin,
      rateLimitPerDay: oldKey.rateLimitPerDay,
      allowedIps: oldKey.allowedIps,
      allowedDomains: oldKey.allowedDomains,
      createdBy: actorId,
    });

    // Schedule old key for revocation after grace period
    const revokeAt = new Date();
    revokeAt.setHours(revokeAt.getHours() + gracePeriodHours);

    await prisma.apiKey.update({
      where: { id },
      data: {
        description: `[ROTATING] Will be revoked at ${revokeAt.toISOString()}. New key: ${result.apiKey.keyPrefix}...`,
      },
    });

    await companyAuditService.log({
      companyId: oldKey.companyId,
      actorId,
      actorType: 'user',
      action: 'API_KEY_ROTATED',
      targetType: 'api_key',
      targetId: id,
      metadata: {
        newKeyId: result.apiKey.id,
        gracePeriodHours,
      },
    });

    return result;
  },

  /**
   * Log API usage
   */
  async logUsage(
    apiKeyId: string,
    endpoint: string,
    method: string,
    statusCode: number,
    responseMs: number,
    ip?: string,
    userAgent?: string,
    errorCode?: string
  ) {
    return prisma.apiKeyUsageLog.create({
      data: {
        apiKeyId,
        endpoint,
        method,
        statusCode,
        responseMs,
        ip,
        userAgent,
        errorCode,
      },
    });
  },

  /**
   * Get usage statistics for an API key
   */
  async getUsageStats(apiKeyId: string, days: number = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const [totalRequests, successRequests, errorRequests, avgResponseTime] = await Promise.all([
      prisma.apiKeyUsageLog.count({
        where: { apiKeyId, createdAt: { gte: since } },
      }),
      prisma.apiKeyUsageLog.count({
        where: { apiKeyId, createdAt: { gte: since }, statusCode: { lt: 400 } },
      }),
      prisma.apiKeyUsageLog.count({
        where: { apiKeyId, createdAt: { gte: since }, statusCode: { gte: 400 } },
      }),
      prisma.apiKeyUsageLog.aggregate({
        where: { apiKeyId, createdAt: { gte: since } },
        _avg: { responseMs: true },
      }),
    ]);

    // Get daily breakdown
    const dailyStats = await prisma.$queryRaw`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as requests,
        AVG(response_ms) as avg_response_ms
      FROM "ApiKeyUsageLog"
      WHERE api_key_id = ${apiKeyId}
        AND created_at >= ${since}
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `;

    return {
      totalRequests,
      successRequests,
      errorRequests,
      errorRate: totalRequests > 0 ? (errorRequests / totalRequests) * 100 : 0,
      avgResponseMs: avgResponseTime._avg.responseMs || 0,
      dailyStats,
    };
  },

  /**
   * Check rate limit for an API key
   */
  async checkRateLimit(apiKeyId: string, rateLimitPerMin: number): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
    const oneMinuteAgo = new Date();
    oneMinuteAgo.setMinutes(oneMinuteAgo.getMinutes() - 1);

    const recentRequests = await prisma.apiKeyUsageLog.count({
      where: {
        apiKeyId,
        createdAt: { gte: oneMinuteAgo },
      },
    });

    const resetAt = new Date();
    resetAt.setMinutes(resetAt.getMinutes() + 1);

    return {
      allowed: recentRequests < rateLimitPerMin,
      remaining: Math.max(0, rateLimitPerMin - recentRequests),
      resetAt,
    };
  },

  /**
   * Get all available scopes
   */
  getAvailableScopes() {
    return API_SCOPES;
  },
};

export default apiKeyService;
