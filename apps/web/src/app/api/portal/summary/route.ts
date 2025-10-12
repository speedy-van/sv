import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const s = await getServerSession(authOptions);
  if (!s?.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Get active bookings (confirmed and in progress)
    const activeBookings = await prisma.booking.count({
      where: {
        status: { in: ['CONFIRMED', 'COMPLETED'] },
        scheduledAt: { gte: today },
      },
    });

    // Get today's bookings
    const todaysBookings = await prisma.booking.findMany({
      where: {
        scheduledAt: { gte: today },
      },
      select: {
        id: true,
        reference: true,
        status: true,
        scheduledAt: true,
        totalGBP: true,
        customerName: true,
        customerEmail: true,
      },
      orderBy: { scheduledAt: 'asc' },
    });

    // Get completed bookings
    const completedBookings = await prisma.booking.count({
      where: {
        status: 'COMPLETED',
        scheduledAt: { gte: today },
      },
    });

    // Get pending bookings
    const pendingBookings = await prisma.booking.count({
      where: {
        status: 'DRAFT',
        scheduledAt: { gte: today },
      },
    });

    // Get total revenue for today
    const todayRevenue = await prisma.booking.aggregate({
      _sum: { totalGBP: true },
      where: {
        status: 'COMPLETED',
        scheduledAt: { gte: today },
      },
    });

    // Get upcoming bookings (next 7 days)
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    const upcomingBookings = await prisma.booking.findMany({
      where: {
        status: { in: ['DRAFT', 'CONFIRMED'] },
        scheduledAt: { gte: today, lte: nextWeek },
      },
      select: {
        id: true,
        reference: true,
        status: true,
        scheduledAt: true,
        totalGBP: true,
        customerName: true,
        customerEmail: true,
      },
      orderBy: { scheduledAt: 'asc' },
    });

    return Response.json({
      activeBookings,
      todaysBookings,
      completedBookings,
      pendingBookings,
      todayRevenue: todayRevenue._sum.totalGBP || 0,
      upcomingBookings,
    });
  } catch (error) {
    console.error('Portal summary API error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
