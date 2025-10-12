import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { buildReceiptPDF } from '@/lib/pdf';
import { prisma } from '@/lib/prisma';

export async function GET(
  _: Request,
  { params }: { params: { code: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== 'customer')
    return new Response('Unauthorized', { status: 401 });
  const booking = await prisma.booking.findUnique({
    where: { reference: params.code },
    include: { 
      customer: true,
      pickupAddress: true,
      dropoffAddress: true,
    },
  });
  if (!booking || booking.customerId !== (session.user as any).id)
    return new Response('Not found', { status: 404 });
  const pdf = await buildReceiptPDF({
    receiptNumber: booking.reference,
    date: new Date().toISOString(),
    customer: {
      name: booking.customer?.name || 'Unknown',
      email: booking.customer?.email || 'unknown@example.com',
    },
    booking: {
      reference: booking.reference,
      pickupAddress: booking.pickupAddress?.label || 'Not specified',
      dropoffAddress: booking.dropoffAddress?.label || 'Not specified',
      scheduledDate: booking.scheduledAt.toISOString(),
      totalGBP: booking.totalGBP,
      paidAt: booking.paidAt || undefined,
      customerEmail: booking.customer?.email ?? undefined,
    },
    amount: booking.totalGBP,
    paymentMethod: 'Card',
    currency: 'GBP',
  });
  return new Response(pdf as any, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename=receipt-${booking.reference}.pdf`,
    },
  });
}
