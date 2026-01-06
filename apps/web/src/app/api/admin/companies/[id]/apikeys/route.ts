/**
 * Admin Company API Keys API
 * 
 * GET /api/admin/companies/[id]/apikeys - List company API keys
 * POST /api/admin/companies/[id]/apikeys - Create API key for company
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { apiKeyService, companyService, API_SCOPES } from '@/lib/b2b';
import { z } from 'zod';

// Validation schema
const CreateApiKeySchema = z.object({
  name: z.string().min(1, 'API key name is required'),
  description: z.string().optional(),
  scopes: z.array(z.string()).min(1, 'At least one scope is required'),
  expiresAt: z.string().datetime().optional(),
  rateLimitPerMin: z.number().min(1).max(1000).default(60),
  rateLimitPerDay: z.number().min(1).max(100000).default(10000),
  allowedIps: z.array(z.string()).optional(),
  allowedDomains: z.array(z.string()).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const result = await apiKeyService.list({ companyId: params.id });

    return NextResponse.json({
      success: true,
      data: result.keys,
      pagination: result.pagination,
      availableScopes: API_SCOPES,
    });
  } catch (error: any) {
    console.error('[Admin Company API Keys] GET error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to list API keys' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    // Check if company exists
    const company = await companyService.getById(params.id);
    if (!company) {
      return NextResponse.json(
        { success: false, error: 'Company not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const data = CreateApiKeySchema.parse(body);

    // Validate scopes
    const validScopes = Object.keys(API_SCOPES);
    const invalidScopes = data.scopes.filter(s => !validScopes.includes(s));
    if (invalidScopes.length > 0) {
      return NextResponse.json(
        { success: false, error: `Invalid scopes: ${invalidScopes.join(', ')}` },
        { status: 400 }
      );
    }

    const result = await apiKeyService.create({
      companyId: params.id,
      name: data.name,
      description: data.description,
      scopes: data.scopes,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
      rateLimitPerMin: data.rateLimitPerMin,
      rateLimitPerDay: data.rateLimitPerDay,
      allowedIps: data.allowedIps,
      allowedDomains: data.allowedDomains,
      createdBy: authResult.id,
    });

    return NextResponse.json({
      success: true,
      data: {
        apiKey: result.apiKey,
        // IMPORTANT: This is the only time the raw key is shown
        rawKey: result.rawKey,
      },
      message: 'API key created successfully. Save this key now - it will not be shown again.',
    }, { status: 201 });
  } catch (error: any) {
    console.error('[Admin Company API Keys] POST error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create API key' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { searchParams } = new URL(request.url);
    const keyId = searchParams.get('keyId');
    const reason = searchParams.get('reason') || 'Admin revocation';

    if (!keyId) {
      return NextResponse.json(
        { success: false, error: 'API key ID is required' },
        { status: 400 }
      );
    }

    await apiKeyService.revoke(keyId, reason, authResult.id);

    return NextResponse.json({
      success: true,
      message: 'API key revoked successfully',
    });
  } catch (error: any) {
    console.error('[Admin Company API Keys] DELETE error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to revoke API key' },
      { status: 500 }
    );
  }
}
