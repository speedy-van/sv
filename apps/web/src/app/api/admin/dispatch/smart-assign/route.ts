import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface AssignmentRules {
  radius: number;
  vehicleType: string;
  capacity: string;
  loadLimit: string;
  rating: number;
  maxJobs: number;
  distanceWeight: number;
  ratingWeight: number;
  experienceWeight: number;
  loadWeight: number;
  timeWindowPriority: string;
  geographicPreference: string;
}

interface DriverScore {
  driverId: string;
  driver: any;
  score: number;
  factors: {
    distance: number;
    rating: number;
    experience: number;
    currentLoad: number;
    availability: number;
  };
  reasons: string[];
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { jobId, rules } = await request.json();

    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      );
    }

    // Get job details
    const job = await prisma.booking.findUnique({
      where: { id: jobId },
      include: {
        customer: true,
      },
    });

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    if (job.driverId) {
      return NextResponse.json(
        { error: 'Job is already assigned' },
        { status: 400 }
      );
    }

    // Get assignment rules (default or from config)
    const assignmentRules: AssignmentRules = {
      radius: 5000, // 5km default
      vehicleType: 'any',
      capacity: 'any',
      loadLimit: 'any',
      rating: 4.0,
      maxJobs: 3,
      distanceWeight: 70,
      ratingWeight: 20,
      experienceWeight: 10,
      loadWeight: 50,
      timeWindowPriority: 'urgent',
      geographicPreference: 'nearest',
      ...rules,
    };

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
            isActive: true
          }
        },
        DriverAvailability: true,
        DriverVehicle: true,
        Booking: {
          where: {
            status: {
              in: ['CONFIRMED'],
            },
          },
        },
        DriverRating: true,
        DriverPerformance: true,
      },
    });

    // Score and rank drivers
    const driverScores: DriverScore[] = [];

    for (const driver of availableDrivers) {
      const score = await calculateDriverScore(driver, job, assignmentRules);
      if (score.score > 0) {
        driverScores.push(score);
      }
    }

    // Sort by score (highest first)
    driverScores.sort((a, b) => b.score - a.score);

    if (driverScores.length === 0) {
      return NextResponse.json(
        {
          error: 'No eligible drivers found',
          details: {
            totalDrivers: availableDrivers.length,
            filteredDrivers: 0,
            reasons: ['No drivers meet the assignment criteria'],
          },
        },
        { status: 400 }
      );
    }

    // Select the best driver
    const bestDriver = driverScores[0];

    // Assign the job
    const assignedJob = await prisma.booking.update({
      where: { id: jobId },
      data: {
        driverId: bestDriver.driverId,
        status: 'CONFIRMED',
        updatedAt: new Date(),
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
                isActive: true
              }
            },
          },
        },
        customer: true,
      },
    });

    // Create assignment record
    await prisma.assignment.create({
      data: {
        id: `assignment_${jobId}_${bestDriver.driverId}`,
        bookingId: jobId,
        driverId: bestDriver.driverId,
        status: 'invited',
        updatedAt: new Date(),
      },
    });

    // Log the assignment with detailed reasoning
    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        actorRole: 'admin',
        action: 'smart_job_assigned',
        targetType: 'booking',
        targetId: jobId,
        after: {
          driverId: bestDriver.driverId,
          status: 'CONFIRMED',
          score: bestDriver.score,
          factors: bestDriver.factors,
          reasons: bestDriver.reasons,
          totalCandidates: driverScores.length,
          assignmentRules: assignmentRules as any,
        },
        ip: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Job assigned successfully using smart assignment',
      data: {
        assignedJob,
        selectedDriver: {
          id: bestDriver.driverId,
          name: bestDriver.driver.user.name,
          score: bestDriver.score,
          factors: bestDriver.factors,
          reasons: bestDriver.reasons,
        },
        candidates: driverScores.slice(0, 5).map(ds => ({
          id: ds.driverId,
          name: ds.driver.user.name,
          score: ds.score,
          factors: ds.factors,
        })),
        assignmentRules,
      },
    });
  } catch (error) {
    console.error('Smart assignment error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function calculateDriverScore(
  driver: any,
  job: any,
  rules: AssignmentRules
): Promise<DriverScore> {
  const factors = {
    distance: 0,
    rating: 0,
    experience: 0,
    currentLoad: 0,
    availability: 0,
  };
  const reasons: string[] = [];

  // Check basic eligibility
  if (driver.bookings.length >= rules.maxJobs) {
    reasons.push(
      `Driver has ${driver.bookings.length} active jobs (max: ${rules.maxJobs})`
    );
    return { driverId: driver.id, driver, score: 0, factors, reasons };
  }

  if (driver.rating && driver.rating < rules.rating) {
    reasons.push(
      `Driver rating ${driver.rating} below minimum ${rules.rating}`
    );
    return { driverId: driver.id, driver, score: 0, factors, reasons };
  }

  // Calculate distance factor (simplified - in real app, use actual coordinates)
  const distance = calculateDistance(job, driver);
  if (distance > rules.radius) {
    reasons.push(
      `Driver too far: ${Math.round(distance / 1000)}km (max: ${rules.radius / 1000}km)`
    );
    return { driverId: driver.id, driver, score: 0, factors, reasons };
  }

  // Distance score (closer is better)
  factors.distance = Math.max(0, 100 - (distance / rules.radius) * 100);
  reasons.push(`Distance: ${Math.round(distance / 1000)}km`);

  // Rating score
  if (driver.rating) {
    factors.rating = (driver.rating / 5) * 100;
    reasons.push(`Rating: ${driver.rating}/5`);
  }

  // Experience score (based on completed jobs)
  const completedJobs =
    driver.bookings?.filter((b: any) => b.status === 'completed').length || 0;
  factors.experience = Math.min(100, (completedJobs / 50) * 100); // Cap at 50 jobs
  reasons.push(`Experience: ${completedJobs} completed jobs`);

  // Current load score (fewer jobs is better)
  const currentJobs = driver.bookings.length;
  factors.currentLoad = Math.max(0, 100 - (currentJobs / rules.maxJobs) * 100);
  reasons.push(`Current load: ${currentJobs}/${rules.maxJobs} jobs`);

  // Availability score (online status)
  factors.availability = driver.availability?.status === 'online' ? 100 : 0;

  // Calculate weighted score
  const score =
    (factors.distance * rules.distanceWeight +
      factors.rating * rules.ratingWeight +
      factors.experience * rules.experienceWeight +
      factors.currentLoad * rules.loadWeight +
      factors.availability * 10) /
    (rules.distanceWeight +
      rules.ratingWeight +
      rules.experienceWeight +
      rules.loadWeight +
      10);

  return {
    driverId: driver.id,
    driver,
    score: Math.round(score * 100) / 100,
    factors,
    reasons,
  };
}

function calculateDistance(job: any, driver: any): number {
  // Simplified distance calculation
  // In a real implementation, you would use actual coordinates
  // For now, return a random distance within reasonable bounds
  return Math.random() * 10000; // 0-10km
}
