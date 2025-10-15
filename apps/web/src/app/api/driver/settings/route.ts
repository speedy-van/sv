import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { authenticateBearerToken } from '@/lib/bearer-auth';
import { withPrisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/driver/settings - Get all driver settings
export async function GET(request: NextRequest) {
  try {
    console.log('⚙️ Driver Settings API - Starting request');
    
    // Try Bearer token authentication first (for mobile app)
    const bearerAuth = await authenticateBearerToken(request);
    let userId: string;
    
    if (bearerAuth.success) {
      userId = bearerAuth.user.id;
      console.log('🔑 Bearer token authenticated for user:', userId);
    } else {
      // Fallback to NextAuth session (for web app)
      const session = await getServerSession(authOptions);
      if (!session?.user || (session.user as any).role !== 'driver') {
        console.log('❌ Driver Settings API - Unauthorized access');
        return NextResponse.json(
          { error: 'Unauthorized - Driver access required' },
          { status: 401 }
        );
      }
      userId = (session.user as any).id;
      console.log('🌐 NextAuth session authenticated for user:', userId);
    }

    // Use withPrisma for all database operations with connection checking
    const { driver, user, notificationPreferences, payoutSettings, vehicle } = await withPrisma(async (prisma) => {
      // Get driver record
      const driver = await prisma.driver.findUnique({
        where: { userId },
        select: {
          id: true,
          basePostcode: true,
          vehicleType: true,
          status: true,
          onboardingStatus: true,
          rating: true,
          strikes: true,
          DriverAvailability: {
            select: {
              status: true,
              locationConsent: true,
              lastSeenAt: true,
            },
          },
        },
      });

      if (!driver) {
        throw new Error('Driver profile not found');
      }

      // Get user info
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
          lastLogin: true,
        },
      });

      // Get notification preferences
      let notificationPreferences = await prisma.driverNotificationPreferences.findUnique({
        where: { driverId: driver.id },
      });

      if (!notificationPreferences) {
        // Create default notification preferences
        try {
          notificationPreferences = await prisma.driverNotificationPreferences.create({
            data: {
              id: `notif_${driver.id}_${Date.now()}`,
              driverId: driver.id,
              pushJobOffers: true,
              pushJobUpdates: true,
              pushMessages: true,
              pushScheduleChanges: true,
              pushPayoutEvents: true,
              pushSystemAlerts: true,
              emailJobOffers: false,
              emailJobUpdates: false,
              emailMessages: false,
              emailScheduleChanges: false,
              emailPayoutEvents: true,
              emailSystemAlerts: true,
              smsJobOffers: false,
              smsJobUpdates: false,
              smsMessages: false,
              smsScheduleChanges: false,
              smsPayoutEvents: false,
              smsSystemAlerts: false,
            },
          } as any);
        } catch (error) {
          console.error('Error creating notification preferences:', error);
          // Use default values if creation fails
          notificationPreferences = {
            id: `notif_${driver.id}`,
            driverId: driver.id,
            pushJobOffers: true,
            pushJobUpdates: true,
            pushMessages: true,
            pushScheduleChanges: true,
            pushPayoutEvents: true,
            pushSystemAlerts: true,
            emailJobOffers: false,
            emailJobUpdates: false,
            emailMessages: false,
            emailScheduleChanges: false,
            emailPayoutEvents: true,
            emailSystemAlerts: true,
            smsJobOffers: false,
            smsJobUpdates: false,
            smsMessages: false,
            smsScheduleChanges: false,
            smsPayoutEvents: false,
            smsSystemAlerts: false,
          } as any;
        }
      }

      // Get payout settings
      const payoutSettings = await prisma.driverPayoutSettings.findUnique({
        where: { driverId: driver.id },
      });

      // Get vehicle info (if exists)
      const vehicle = await prisma.driverVehicle.findFirst({
        where: { driverId: driver.id },
        select: {
          id: true,
          make: true,
          model: true,
          reg: true,
          weightClass: true,
          motExpiry: true,
        },
      });

      return { driver, user, notificationPreferences, payoutSettings, vehicle };
    });

    const response = {
      success: true,
      profile: {
        id: user?.id,
        email: user?.email,
        name: user?.name,
        firstName: driver.basePostcode ? driver.basePostcode.split(' ')[0] : '',
        lastName: driver.basePostcode ? driver.basePostcode.split(' ')[1] || '' : '',
        phone: '', // Not stored separately, would need to be added
        basePostcode: driver.basePostcode,
        vehicleType: driver.vehicleType,
        status: driver.status,
        onboardingStatus: driver.onboardingStatus,
        rating: driver.rating,
        strikes: driver.strikes,
        createdAt: user?.createdAt,
        lastLogin: user?.lastLogin,
      },
      availability: {
        status: driver.DriverAvailability?.status || 'offline',
        locationConsent: driver.DriverAvailability?.locationConsent || false,
        lastSeenAt: driver.DriverAvailability?.lastSeenAt,
      },
      notifications: notificationPreferences,
      vehicle: vehicle || {
        make: '',
        model: '',
        reg: '',
        weightClass: '',
        motExpiry: null,
      },
      payout: payoutSettings ? {
        autoPayout: payoutSettings.autoPayout,
        minPayoutAmountPence: payoutSettings.minPayoutAmountPence,
        verified: payoutSettings.verified,
        hasBankDetails: !!(
          payoutSettings.accountName &&
          payoutSettings.accountNumber &&
          payoutSettings.sortCode
        ),
        hasStripeAccount: !!payoutSettings.stripeAccountId,
      } : {
        autoPayout: false,
        minPayoutAmountPence: 5000,
        verified: false,
        hasBankDetails: false,
        hasStripeAccount: false,
      },
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error fetching driver settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// PUT /api/driver/settings - Update driver settings
export async function PUT(request: NextRequest) {
  try {
    console.log('⚙️ Driver Settings Update API - Starting request');
    
    // Try Bearer token authentication first (for mobile app)
    const bearerAuth = await authenticateBearerToken(request);
    let userId: string;
    
    if (bearerAuth.success) {
      userId = bearerAuth.user.id;
      console.log('🔑 Bearer token authenticated for user:', userId);
    } else {
      // Fallback to NextAuth session (for web app)
      const session = await getServerSession(authOptions);
      if (!session?.user || (session.user as any).role !== 'driver') {
        console.log('❌ Driver Settings Update API - Unauthorized access');
        return NextResponse.json(
          { error: 'Unauthorized - Driver access required' },
          { status: 401 }
        );
      }
      userId = (session.user as any).id;
      console.log('🌐 NextAuth session authenticated for user:', userId);
    }

    let body;
    try {
      body = await request.json();
      console.log('📦 Received settings update request:', {
        hasProfile: !!body.profile,
        hasAvailability: !!body.availability,
        hasNotifications: !!body.notifications,
        hasVehicle: !!body.vehicle,
        hasPayout: !!body.payout,
      });
    } catch (parseError) {
      console.error('❌ Failed to parse request body:', parseError);
      return NextResponse.json(
        { error: 'Invalid request body', success: false },
        { status: 400 }
      );
    }

    const { profile, availability, notifications, vehicle, payout } = body;

    // Use withPrisma for all database operations with connection checking
    await withPrisma(async (prisma) => {
      // Get driver record
      const driver = await prisma.driver.findUnique({
        where: { userId },
        select: { id: true },
      });

      if (!driver) {
        throw new Error('Driver profile not found');
      }

      console.log('✅ Driver found:', driver.id);

      // Update profile data
      if (profile) {
        console.log('📝 Updating profile...');
        const userUpdateData: any = {};
        const driverUpdateData: any = {};

        if (profile.email) userUpdateData.email = profile.email;
        if (profile.name) userUpdateData.name = profile.name;
        if (profile.basePostcode) driverUpdateData.basePostcode = profile.basePostcode;
        if (profile.vehicleType) driverUpdateData.vehicleType = profile.vehicleType;

        if (Object.keys(userUpdateData).length > 0) {
          try {
            await prisma.user.update({
              where: { id: userId },
              data: userUpdateData,
            });
            console.log('✅ User profile updated');
          } catch (err) {
            console.error('❌ Failed to update user profile:', err);
            throw err;
          }
        }

        if (Object.keys(driverUpdateData).length > 0) {
          try {
            await prisma.driver.update({
              where: { id: driver.id },
              data: driverUpdateData,
            });
            console.log('✅ Driver profile updated');
          } catch (err) {
            console.error('❌ Failed to update driver profile:', err);
            throw err;
          }
        }
      }

      // Update availability
      if (availability) {
        console.log('📍 Updating availability...');
        try {
          await prisma.driverAvailability.upsert({
            where: { driverId: driver.id },
            update: {
              status: availability.status,
              locationConsent: availability.locationConsent,
              lastSeenAt: new Date(),
              updatedAt: new Date(),
            },
            create: {
              id: `availability_${driver.id}_${Date.now()}`,
              driverId: driver.id,
              status: availability.status || 'offline',
              locationConsent: availability.locationConsent || false,
              lastSeenAt: new Date(),
              updatedAt: new Date(),
              maxConcurrentDrops: 5,
              multiDropCapable: true,
              preferredServiceAreas: [],
              currentCapacityUsed: 0,
              experienceLevel: 'standard',
            } as any,
          });
          console.log('✅ Availability updated');
        } catch (err) {
          console.error('❌ Failed to update availability:', err);
          throw err;
        }
      }

      // Update notifications
      if (notifications) {
        console.log('🔔 Updating notifications...');
        try {
          await prisma.driverNotificationPreferences.upsert({
            where: { driverId: driver.id },
            update: notifications,
            create: {
              id: `notif_${driver.id}_${Date.now()}`,
              driverId: driver.id,
              pushJobOffers: notifications.pushJobOffers ?? true,
              pushJobUpdates: notifications.pushJobUpdates ?? true,
              pushMessages: notifications.pushMessages ?? true,
              pushScheduleChanges: notifications.pushScheduleChanges ?? true,
              pushPayoutEvents: notifications.pushPayoutEvents ?? true,
              pushSystemAlerts: notifications.pushSystemAlerts ?? true,
              emailJobOffers: notifications.emailJobOffers ?? false,
              emailJobUpdates: notifications.emailJobUpdates ?? false,
              emailMessages: notifications.emailMessages ?? false,
              emailScheduleChanges: notifications.emailScheduleChanges ?? false,
              emailPayoutEvents: notifications.emailPayoutEvents ?? true,
              emailSystemAlerts: notifications.emailSystemAlerts ?? true,
              smsJobOffers: notifications.smsJobOffers ?? false,
              smsJobUpdates: notifications.smsJobUpdates ?? false,
              smsMessages: notifications.smsMessages ?? false,
              smsScheduleChanges: notifications.smsScheduleChanges ?? false,
              smsPayoutEvents: notifications.smsPayoutEvents ?? false,
              smsSystemAlerts: notifications.smsSystemAlerts ?? false,
            } as any,
          });
          console.log('✅ Notifications updated');
        } catch (err) {
          console.error('❌ Failed to update notifications:', err);
          throw err;
        }
      }

      // Update vehicle
      if (vehicle) {
        console.log('🚗 Updating vehicle...');
        try {
          // Prepare vehicle data with proper date formatting
          const vehicleData: any = { ...vehicle };
          
          // Convert motExpiry to ISO-8601 format if provided
          if (vehicleData.motExpiry) {
            try {
              vehicleData.motExpiry = new Date(vehicleData.motExpiry).toISOString();
              console.log('✅ MOT expiry converted to ISO-8601:', vehicleData.motExpiry);
            } catch (dateError) {
              console.error('❌ Invalid motExpiry date format:', vehicleData.motExpiry);
              delete vehicleData.motExpiry; // Remove invalid date
            }
          }

          // First try to find existing vehicle
          const existingVehicle = await prisma.driverVehicle.findFirst({
            where: { driverId: driver.id },
          });

          if (existingVehicle) {
            await prisma.driverVehicle.update({
              where: { id: existingVehicle.id },
              data: vehicleData,
            });
            console.log('✅ Vehicle updated');
          } else {
            await prisma.driverVehicle.create({
              data: {
                id: `vehicle_${driver.id}_${Date.now()}`,
                driverId: driver.id,
                ...vehicleData,
              } as any,
            });
            console.log('✅ Vehicle created');
          }
        } catch (error) {
          console.error('❌ Error updating vehicle:', error);
          // Continue execution - vehicle update is not critical
        }
      }

      // Update payout settings
      if (payout) {
        await prisma.driverPayoutSettings.upsert({
          where: { driverId: driver.id },
          update: {
            autoPayout: payout.autoPayout,
            minPayoutAmountPence: payout.minPayoutAmountPence,
          },
          create: {
            id: `payout_${driver.id}_${Date.now()}`,
            driverId: driver.id,
            autoPayout: payout.autoPayout || false,
            minPayoutAmountPence: payout.minPayoutAmountPence || 5000,
            verified: false,
          } as any,
        });
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully',
    });

  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('❌ Error updating driver settings:', err);
    console.error('❌ Error details:', {
      message: err.message,
      stack: err.stack,
      name: err.name,
    });
    
    // Log the request body for debugging
    try {
      const bodyForLog = await request.clone().json();
      console.error('❌ Request body that caused error:', JSON.stringify(bodyForLog, null, 2));
    } catch (bodyError) {
      console.error('❌ Could not parse request body for logging');
    }
    
    return NextResponse.json(
      {
        error: 'Failed to update settings',
        details: err.message || 'Unknown error',
        success: false
      },
      { status: 500 }
    );
  }
}
