import { ZodSchema } from 'zod';
import { NextResponse } from 'next/server';

export async function parseJson<T>(req: Request, schema: ZodSchema<T>) {
  const json = await req.json().catch(() => null);
  if (!json)
    return {
      ok: false as const,
      error: NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }),
    };
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: NextResponse.json(
        { error: 'Validation error', details: parsed.error.flatten() },
        { status: 400 }
      ),
    };
  }
  return { ok: true as const, data: parsed.data as T };
}

export function parseQueryParams<T>(url: string, schema: ZodSchema<T>) {
  const urlObj = new URL(url);
  const params = Object.fromEntries(urlObj.searchParams.entries());
  const parsed = schema.safeParse(params);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: NextResponse.json(
        { error: 'Invalid query parameters', details: parsed.error.flatten() },
        { status: 400 }
      ),
    };
  }
  return { ok: true as const, data: parsed.data as T };
}

export function parseParams<T>(
  params: Record<string, string>,
  schema: ZodSchema<T>
) {
  const parsed = schema.safeParse(params);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: NextResponse.json(
        { error: 'Invalid parameters', details: parsed.error.flatten() },
        { status: 400 }
      ),
    };
  }
  return { ok: true as const, data: parsed.data as T };
}
