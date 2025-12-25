import { Suspense } from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getCustomSession } from '@/lib/custom-auth';
import { prisma } from '@/lib/prisma';
import { AdminNotificationsClient } from './AdminNotificationsClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminNotificationsPage() {
  const session = await getCustomSession();

  if (!session) {
    redirect('/auth/login');
  }

  const role = session.user.role;

  if (role !== 'admin' && role !== 'superadmin') {
    redirect('/');
  }

  // Fetch initial notifications
  const notifications = await prisma.adminNotification.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  const unreadCount = await prisma.adminNotification.count({
    where: { isRead: false },
  });

  const serializedNotifications = notifications.map(n => ({
    ...n,
    priority: n.priority as 'low' | 'medium' | 'high' | 'urgent',
    createdAt: n.createdAt.toISOString(),
    updatedAt: n.updatedAt.toISOString(),
    readAt: n.readAt?.toISOString() || null,
  }));

  return (
    <Suspense fallback={<div>Loading notifications...</div>}>
      <AdminNotificationsClient
        initialNotifications={serializedNotifications}
        initialUnreadCount={unreadCount}
      />
    </Suspense>
  );
}
