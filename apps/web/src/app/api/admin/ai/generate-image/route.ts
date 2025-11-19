import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { prisma } from '@/lib/prisma';
import { createAuditLogEntry } from '@/lib/audit';

/**
 * POST /api/admin/ai/generate-image
 * Enterprise-grade image generation with DALL-E 3
 * 
 * Features:
 * - Input validation & safety filtering
 * - Automatic retry logic
 * - Secure server-side generation
 * - Storage integration
 * - Audit trail logging
 * - Rate limiting
 * - Error monitoring
 */

interface ImageGenerationRequest {
  prompt: string;
  model?: 'dall-e-3' | 'dall-e-2';
  size?: '1024x1024' | '1024x1792' | '1792x1024' | '256x256' | '512x512';
  quality?: 'standard' | 'hd';
  style?: 'vivid' | 'natural';
  safetyMode?: 'strict' | 'moderate' | 'permissive';
}

interface ImageGenerationResponse {
  success: boolean;
  imageUrl: string;
  publicUrl: string;
  prompt: string;
  revisedPrompt?: string;
  model: string;
  size: string;
  quality: string;
  generatedAt: string;
  processingTimeMs: number;
  auditLogId: string;
}

// Rate limiting storage (in-memory, use Redis in production)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

// Content safety filters
const BLOCKED_KEYWORDS = [
  'nude', 'naked', 'nsfw', 'porn', 'explicit',
  'violence', 'gore', 'blood', 'weapon',
  'hate', 'racist', 'offensive'
];

function checkContentSafety(prompt: string, safetyMode: string): { safe: boolean; reason?: string } {
  const lowerPrompt = prompt.toLowerCase();
  
  if (safetyMode === 'strict') {
    for (const keyword of BLOCKED_KEYWORDS) {
      if (lowerPrompt.includes(keyword)) {
        return { safe: false, reason: `Blocked keyword: ${keyword}` };
      }
    }
  }
  
  // Check prompt length
  if (prompt.length < 10) {
    return { safe: false, reason: 'Prompt too short (minimum 10 characters)' };
  }
  
  if (prompt.length > 4000) {
    return { safe: false, reason: 'Prompt too long (maximum 4000 characters)' };
  }
  
  return { safe: true };
}

function checkRateLimit(userId: string): { allowed: boolean; resetIn?: number } {
  const now = Date.now();
  const userLimit = rateLimitMap.get(userId);
  
  // 10 images per hour per user
  const RATE_LIMIT = 10;
  const WINDOW_MS = 60 * 60 * 1000; // 1 hour
  
  if (!userLimit || now > userLimit.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true };
  }
  
  if (userLimit.count >= RATE_LIMIT) {
    return { allowed: false, resetIn: Math.ceil((userLimit.resetAt - now) / 1000) };
  }
  
  userLimit.count++;
  return { allowed: true };
}

async function generateImageWithRetry(
  prompt: string,
  options: {
    model: string;
    size: string;
    quality: string;
    style?: string;
  },
  maxRetries = 3
): Promise<{ url: string; revisedPrompt?: string }> {
  const openaiApiKey = process.env.OPENAI_API_KEY;
  
  if (!openaiApiKey) {
    throw new Error('OPENAI_API_KEY not configured');
  }
  
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Image generation attempt ${attempt}/${maxRetries}`);
      
      const response = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: options.model,
          prompt: prompt,
          n: 1,
          size: options.size,
          quality: options.quality,
          style: options.style,
          response_format: 'url',
        }),
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: { message: response.statusText } }));
        throw new Error(error.error?.message || `API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.data?.[0]?.url) {
        throw new Error('No image URL in response');
      }
      
      return {
        url: data.data[0].url,
        revisedPrompt: data.data[0].revised_prompt,
      };
      
    } catch (error) {
      lastError = error as Error;
      console.error(`Image generation attempt ${attempt} failed:`, error);
      
      if (attempt < maxRetries) {
        // Exponential backoff
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError || new Error('Image generation failed after all retries');
}

async function downloadAndStoreImage(imageUrl: string, userId: string): Promise<string> {
  try {
    // Download image from OpenAI
    const response = await fetch(imageUrl);
    
    if (!response.ok) {
      throw new Error('Failed to download image');
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Create uploads directory
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'ai-images');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }
    
    // Generate unique filename
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(7);
    const filename = `dalle_${userId}_${timestamp}_${randomStr}.png`;
    const filepath = join(uploadsDir, filename);
    
    // Save file
    await writeFile(filepath, new Uint8Array(buffer));
    
    // Return public URL
    return `/uploads/ai-images/${filename}`;
    
  } catch (error) {
    console.error('Failed to store image:', error);
    throw new Error('Failed to store generated image');
  }
}

const getClientIp = (req: NextRequest) =>
  req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? req.ip ?? null;

async function recordImageAuditLog(input: {
  actorId: string;
  actorRole: string;
  action: string;
  targetId?: string;
  ipAddress?: string | null;
  details: Record<string, any>;
}): Promise<string> {
  try {
    const log = await createAuditLogEntry({
      actorId: input.actorId,
      actorRole: input.actorRole,
      action: input.action,
      targetType: 'ai_image_generation',
      targetId: input.targetId ?? null,
      ipAddress: input.ipAddress ?? null,
      details: input.details,
    });
    return log.id;
  } catch (error) {
    console.error('Failed to create audit log:', error);
    return 'audit-log-failed';
  }
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  let clientIp: string | null = null;
  
  try {
    // Authentication
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const userRecord = await prisma.user.findUnique({
      where: { id: session.user.id! },
      select: { role: true, adminRole: true },
    });

    const isAdmin = userRecord?.role === 'admin';
    const isSuperAdmin = userRecord?.adminRole === 'superadmin';
    const actorRole = isSuperAdmin ? 'superadmin' : userRecord?.role ?? 'admin';
    clientIp = getClientIp(req);

    if (!userRecord || (!isAdmin && !isSuperAdmin)) {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }
    
    // Parse request
    const body: ImageGenerationRequest = await req.json();
    const {
      prompt,
      model = 'dall-e-3',
      size = '1024x1024',
      quality = 'standard',
      style = 'vivid',
      safetyMode = 'strict',
    } = body;
    
    // Validation
    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Invalid prompt' },
        { status: 400 }
      );
    }
    
    // Content safety check
    const safetyCheck = checkContentSafety(prompt, safetyMode);
    if (!safetyCheck.safe) {
      await recordImageAuditLog({
        actorId: session.user.id!,
        actorRole,
        action: 'AI_IMAGE_GENERATION_BLOCKED',
        ipAddress: clientIp,
        details: {
          prompt: prompt.substring(0, 200),
          reason: safetyCheck.reason,
          safetyMode,
          blocked: true,
        },
      });
      
      return NextResponse.json(
        { error: `Content safety check failed: ${safetyCheck.reason}` },
        { status: 400 }
      );
    }
    
    // Rate limiting
    const rateLimit = checkRateLimit(session.user.id!);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded',
          resetIn: rateLimit.resetIn,
          message: `You can generate ${rateLimit.resetIn} more images in ${Math.ceil(rateLimit.resetIn! / 60)} minutes`
        },
        { status: 429 }
      );
    }
    
    // Generate image with retry logic
    console.log('Generating image with DALL-E:', { prompt: prompt.substring(0, 50), model, size, quality });
    
    const generated = await generateImageWithRetry(prompt, {
      model,
      size,
      quality,
      style: model === 'dall-e-3' ? style : undefined,
    });
    
    // Download and store image
    const publicUrl = await downloadAndStoreImage(generated.url, session.user.id!);
    
    const processingTimeMs = Date.now() - startTime;
    
    // Create audit log
    const auditLogId = await recordImageAuditLog({
      actorId: session.user.id!,
      actorRole,
      action: 'AI_IMAGE_GENERATED',
      targetId: publicUrl,
      ipAddress: clientIp,
      details: {
        prompt,
        revisedPrompt: generated.revisedPrompt,
        model,
        size,
        quality,
        style,
        publicUrl,
        processingTimeMs,
        safetyMode,
        rateLimitRemaining: 10 - (rateLimitMap.get(session.user.id!)?.count || 0),
      },
    });
    
    // Success response
    const response: ImageGenerationResponse = {
      success: true,
      imageUrl: generated.url,
      publicUrl,
      prompt,
      revisedPrompt: generated.revisedPrompt,
      model,
      size,
      quality,
      generatedAt: new Date().toISOString(),
      processingTimeMs,
      auditLogId,
    };
    
    console.log('Image generated successfully:', { publicUrl, processingTimeMs });
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Image generation error:', error);
    
    const processingTimeMs = Date.now() - startTime;
    
    // Log error to audit trail
    try {
      const session = await getServerSession(authOptions);
      if (session?.user) {
        await recordImageAuditLog({
          actorId: session.user.id!,
          actorRole: (session.user as any)?.adminRole === 'superadmin' ? 'superadmin' : 'admin',
          action: 'AI_IMAGE_GENERATION_FAILED',
          ipAddress: clientIp,
          details: {
            error: error instanceof Error ? error.message : 'Unknown error',
            processingTimeMs,
            failed: true,
          },
        });
      }
    } catch (auditError) {
      console.error('Failed to log error to audit:', auditError);
    }
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Image generation failed',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined
      },
      { status: 500 }
    );
  }
}

// GET endpoint for checking status and limits
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userLimit = rateLimitMap.get(session.user.id!);
    const now = Date.now();
    
    return NextResponse.json({
      configured: !!process.env.OPENAI_API_KEY,
      rateLimit: {
        max: 10,
        remaining: userLimit && now < userLimit.resetAt ? 10 - userLimit.count : 10,
        resetAt: userLimit?.resetAt ? new Date(userLimit.resetAt).toISOString() : null,
      },
      supportedModels: ['dall-e-3', 'dall-e-2'],
      supportedSizes: {
        'dall-e-3': ['1024x1024', '1024x1792', '1792x1024'],
        'dall-e-2': ['256x256', '512x512', '1024x1024'],
      },
    });
    
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get status' },
      { status: 500 }
    );
  }
}
