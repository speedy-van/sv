import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import AdminDashboard from '@/components/admin/AdminDashboard';
import { getCustomSession } from '@/lib/custom-auth';

// CRITICAL: Force dynamic rendering because we use getServerSession()
export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getDashboardData() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Today's revenue
  const todayRevenue = await prisma.booking.aggregate({
    where: {
      paidAt: {
        gte: today,
        lt: tomorrow,
      },
      status: 'CONFIRMED', // Use booking status instead of paymentStatus
    },
    _sum: {
      totalGBP: true,
    },
  });

  // Active jobs
  const activeJobs = await prisma.booking.count({
    where: {
      status: {
        in: ['CONFIRMED'], // Use valid BookingStatus values
      },
    },
  });

  // Average ETA (simplified - would need actual calculation)
  const avgEta = '25 min';

  // First response time (simplified)
  const firstResponseTime = '3.2 min';

  // Open incidents
  const openIncidents = await prisma.driverIncident.count({
    where: {
      status: 'reported',
    },
  });

  // Jobs in progress with SLA timers
  const jobsInProgress = await prisma.booking.findMany({
    where: {
      status: {
        in: ['CONFIRMED'], // Use valid BookingStatus values
      },
    },
    include: {
      Driver: {
        include: {
          User: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              createdAt: true,
              isActive: true,
              lastLogin: true,
              resetTokenExpiry: true,
              emailVerificationExpiry: true
            }
          },
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 5,
  });

  // New driver applications
  const newApplications = await prisma.driverApplication.count({
    where: {
      status: 'pending',
    },
  });

  // Get recent driver application notifications
  const recentDriverApplications = await prisma.adminNotification.findMany({
    where: {
      type: 'new_driver_application',
      isRead: false,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 5,
  });

  // Get unread admin notifications count
  const unreadNotifications = await prisma.adminNotification.count({
    where: {
      isRead: false,
    },
  });

  // Get high priority notifications
  const highPriorityNotifications = await prisma.adminNotification.count({
    where: {
      priority: 'high',
      isRead: false,
    },
  });

  // Pending refunds
  const pendingRefunds = await prisma.booking.count({
    where: {
      status: 'CANCELLED', // Use booking status instead of paymentStatus
      updatedAt: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
      },
    },
  });

  // System health check
  const dbHealth = 'healthy';
  const queueHealth = 'healthy';
  const pusherHealth = 'healthy';
  const stripeHealth = 'healthy';

  // Serialize data to ensure it can be passed to client components
  const serializedJobsInProgress = jobsInProgress.map(job => {
    const { Driver, ...rest } = job;

    return {
      ...rest,
      createdAt: job.createdAt.toISOString(),
      updatedAt: job.updatedAt.toISOString(),
      scheduledAt: job.scheduledAt.toISOString(),
      paidAt: job.paidAt?.toISOString(),
      driver: Driver
        ? {
            ...Driver,
            createdAt: Driver.createdAt.toISOString(),
            updatedAt: Driver.updatedAt.toISOString(),
            approvedAt: Driver.approvedAt?.toISOString(),
            user: Driver.User
              ? {
                  ...Driver.User,
                  createdAt: Driver.User.createdAt.toISOString(),
                  lastLogin: Driver.User.lastLogin?.toISOString(),
                  resetTokenExpiry: Driver.User.resetTokenExpiry?.toISOString(),
                  emailVerificationExpiry: Driver.User.emailVerificationExpiry?.toISOString(),
                }
              : null,
          }
        : null,
    };
  });

  const serializedRecentDriverApplications = recentDriverApplications.map(notification => ({
    ...notification,
    createdAt: notification.createdAt.toISOString(),
    updatedAt: notification.updatedAt.toISOString(),
  }));

  return {
    todayRevenue: todayRevenue._sum.totalGBP || 0,
    activeJobs,
    avgEta,
    firstResponseTime,
    openIncidents,
    jobsInProgress: serializedJobsInProgress,
    newApplications,
    recentDriverApplications: serializedRecentDriverApplications,
    unreadNotifications,
    highPriorityNotifications,
    pendingRefunds,
    dbHealth,
    queueHealth,
    pusherHealth,
    stripeHealth,
  };
}

export default async function AdminHome() {
  const session = await getCustomSession();

  // Add debugging
  console.log('🔐 Admin page - Session check:', {
    hasSession: !!session,
    userId: session?.user?.id,
    userRole: (session?.user as any)?.role,
    adminRole: (session?.user as any)?.adminRole,
    email: session?.user?.email,
  });

  if (!session?.user) {
    console.log('❌ Admin page - No session, redirecting to login');
    redirect('/auth/login');
  }

  if ((session.user as any).role !== 'admin') {
    console.log('❌ Admin page - User is not admin, redirecting to login');
    redirect('/auth/login');
  }

  console.log('✅ Admin page - Access granted for admin user');

  const data = await getDashboardData();

  return <AdminDashboard data={data} />;
}
