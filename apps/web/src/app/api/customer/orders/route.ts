import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== 'customer')
    return new Response('Unauthorized', { status: 401 });
  const url = new URL(req.url);
  const scope = url.searchParams.get('scope') ?? 'all';
  const where: any = { customerId: (session.user as any).id };
  if (scope === 'current')
    where.status = {
      in: [
        'confirmed',
        'assigned',
        'en_route_pickup',
        'arrived',
        'loaded',
        'en_route_dropoff',
      ],
    };
  if (scope === 'upcoming') where.status = { in: ['open', 'pending_dispatch'] };
  if (scope === 'drafts') where.quoteHash = { not: null };
  const orders = await prisma.booking.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });
  return Response.json({ orders });
}
