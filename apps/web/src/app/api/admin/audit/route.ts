import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  const s = await getServerSession(authOptions);
  if (!s?.user || (s.user as any).role !== 'admin')
    return new Response('Unauthorized', { status: 401 });
  const { searchParams } = new URL(req.url);
  const take = Math.min(
    Math.max(Number(searchParams.get('take') || 50), 1),
    200
  );
  const cursor = searchParams.get('cursor') || undefined;
  const items = await prisma.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
  });
  const nextCursor = items.length === take ? items[items.length - 1].id : null;
  return Response.json({ items, nextCursor });
}
