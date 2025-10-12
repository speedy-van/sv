import { geocode } from '@/lib/mapbox';

export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const q = sp.get('q')?.trim();
  const st = sp.get('st')?.trim() || undefined;
  if (!q) return new Response('q required', { status: 400 });
  const items = await geocode(q, { country: st });
  return Response.json(items);
}
