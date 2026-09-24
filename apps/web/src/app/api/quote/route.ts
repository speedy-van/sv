import { NextRequest, NextResponse } from 'next/server';
import { apiRateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';
import { QuoteRequestSchema } from '@/lib/pricing/quote-schema';
import { createQuote } from '@/lib/pricing/quote-service';
import type { QuoteError } from '@/lib/pricing/quote-schema';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  // Rate limiting
  try {
    apiRateLimit(request);
  } catch {
    return NextResponse.json<QuoteError>(
      { code: 'NETWORK', message: 'Too many requests. Please wait a moment and try again.' },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json<QuoteError>(
      { code: 'VALIDATION', message: 'Request body must be valid JSON.' },
      { status: 400 }
    );
  }

  const parsed = QuoteRequestSchema.safeParse(body);
  if (!parsed.success) {
    const fields: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join('.');
      (fields[key] ??= []).push(issue.message);
    }
    return NextResponse.json<QuoteError>(
      { code: 'VALIDATION', message: 'Invalid quote request.', fields },
      { status: 400 }
    );
  }

  try {
    const response = await createQuote(parsed.data);
    return NextResponse.json(response, { status: 200 });
  } catch (err: unknown) {
    const code = (err as any)?.quoteCode;
    if (code === 'VALIDATION') {
      return NextResponse.json<QuoteError>(
        { code: 'VALIDATION', message: (err as Error).message },
        { status: 400 }
      );
    }
    logger.error('[api/quote] pricing engine failure', err);
    return NextResponse.json<QuoteError>(
      { code: 'PRICING_UNAVAILABLE', message: 'Pricing is temporarily unavailable. Please try again.' },
      { status: 502 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
