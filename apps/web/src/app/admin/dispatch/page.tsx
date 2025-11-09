import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import DispatchClient from './DispatchClient';

// CRITICAL: Force dynamic rendering because we use getServerSession()
export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getDispatchData() {
  // Get jobs by status for board view
  const jobsByStatus = await prisma.booking.groupBy({
    by: ['status'],
    where: {
      status: {
        in: ['DRAFT', 'CONFIRMED', 'COMPLETED', 'CANCELLED'],
      },
    },
    _count: {
      id: true,
    },
  });

  // Get active jobs with driver info
  const activeJobs = await prisma.booking.findMany({
    where: {
      status: {
        in: ['CONFIRMED'],
      },
    },
    include: {
      driver: {
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
          DriverAvailability: true,
        },
      },
      customer: {
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
    orderBy: {
      createdAt: 'desc',
    },
  });

  // Get available drivers
  const availableDrivers = await prisma.driver.findMany({
    where: {
      status: 'active',
      onboardingStatus: 'approved',
      DriverAvailability: {
        status: 'online',
      },
    },
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
      DriverAvailability: true,
      DriverVehicle: true,
    },
  });

  // Get open incidents
  const openIncidents = await prisma.driverIncident.findMany({
    where: {
      status: 'reported',
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
      Assignment: {
        include: {
          Booking: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 10,
  });

  // Get auto-assign rules (from config or default)
  const autoAssignRules = {
    radius: 5000, // 5km
    vehicleType: 'any',
    capacity: 'any',
    loadLimit: 'any',
    rating: 4.0,
    maxJobs: 3,
  };

  // Serialize data to ensure it can be passed to client components
  const serializedActiveJobs = activeJobs.map(job => ({
    ...job,
    createdAt: job.createdAt.toISOString(),
    updatedAt: job.updatedAt.toISOString(),
    scheduledAt: job.scheduledAt.toISOString(),
    paidAt: job.paidAt?.toISOString(),
    driver: job.driver ? {
      ...job.driver,
      createdAt: job.driver.createdAt.toISOString(),
      updatedAt: job.driver.updatedAt.toISOString(),
      approvedAt: job.driver.approvedAt?.toISOString(),
      user: {
        ...job.driver.User,
        createdAt: job.driver.User.createdAt.toISOString(),
        lastLogin: job.driver.User.lastLogin?.toISOString(),
        resetTokenExpiry: job.driver.User.resetTokenExpiry?.toISOString(),
        emailVerificationExpiry: job.driver.User.emailVerificationExpiry?.toISOString(),
      },
      availability: job.driver.DriverAvailability ? {
        ...job.driver.DriverAvailability,
        createdAt: job.driver.DriverAvailability.createdAt.toISOString(),
        updatedAt: job.driver.DriverAvailability.updatedAt.toISOString(),
      } : null,
    } : null,
    customer: job.customer ? {
      ...job.customer,
      createdAt: job.customer.createdAt.toISOString(),
      lastLogin: job.customer.lastLogin?.toISOString(),
      resetTokenExpiry: job.customer.resetTokenExpiry?.toISOString(),
      emailVerificationExpiry: job.customer.emailVerificationExpiry?.toISOString(),
    } : null,
  }));

  const serializedAvailableDrivers = availableDrivers.map(driver => ({
    ...driver,
    createdAt: driver.createdAt.toISOString(),
    updatedAt: driver.updatedAt.toISOString(),
    approvedAt: driver.approvedAt?.toISOString(),
    user: {
      ...driver.User,
      createdAt: driver.User.createdAt.toISOString(),
      lastLogin: driver.User.lastLogin?.toISOString(),
      resetTokenExpiry: driver.User.resetTokenExpiry?.toISOString(),
      emailVerificationExpiry: driver.User.emailVerificationExpiry?.toISOString(),
    },
    availability: driver.DriverAvailability ? {
      ...driver.DriverAvailability,
      createdAt: driver.DriverAvailability.createdAt.toISOString(),
      updatedAt: driver.DriverAvailability.updatedAt.toISOString(),
    } : null,
    vehicles: driver.DriverVehicle.map(vehicle => ({
      ...vehicle,
      createdAt: vehicle.createdAt.toISOString(),
      motExpiry: vehicle.motExpiry?.toISOString(),
    })),
  }));

  const serializedOpenIncidents = openIncidents.map(incident => ({
    ...incident,
    createdAt: incident.createdAt.toISOString(),
    updatedAt: incident.updatedAt?.toISOString(),
    driver: {
      ...incident.Driver,
      createdAt: incident.Driver.createdAt.toISOString(),
      updatedAt: incident.Driver.updatedAt.toISOString(),
      approvedAt: incident.Driver.approvedAt?.toISOString(),
      user: {
        ...incident.Driver.User,
        createdAt: incident.Driver.User.createdAt.toISOString(),
        lastLogin: (incident.Driver.User as any).lastLogin?.toISOString(),
        resetTokenExpiry: (incident.Driver.User as any).resetTokenExpiry?.toISOString(),
        emailVerificationExpiry: (incident.Driver.User as any).emailVerificationExpiry?.toISOString(),
      },
    },
    Assignment: incident.Assignment ? {
      ...incident.Assignment,
      createdAt: incident.Assignment.createdAt.toISOString(),
      updatedAt: incident.Assignment.updatedAt.toISOString(),
      Booking: {
        ...incident.Assignment.Booking,
        createdAt: incident.Assignment.Booking.createdAt.toISOString(),
        updatedAt: incident.Assignment.Booking.updatedAt.toISOString(),
        scheduledAt: incident.Assignment.Booking.scheduledAt.toISOString(),
        paidAt: incident.Assignment.Booking.paidAt?.toISOString(),
      },
    } : null,
  }));

  return {
    jobsByStatus: jobsByStatus.reduce(
      (acc, item) => {
        acc[item.status] = item._count.id;
        return acc;
      },
      {} as Record<string, number>
    ),
    activeJobs: serializedActiveJobs,
    availableDrivers: serializedAvailableDrivers,
    openIncidents: serializedOpenIncidents,
    autoAssignRules,
  };
}

export default async function DispatchPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== 'admin')
    redirect('/auth/login');

  const data = await getDispatchData();

  return <DispatchClient data={data} />;
}
