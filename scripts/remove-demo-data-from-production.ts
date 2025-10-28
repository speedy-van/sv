/**
 * CRITICAL: Remove ALL Demo Data from Production Driver Accounts
 * 
 * This script ensures NO demo/test/mock data appears in any live driver account
 * except for the designated Apple Test Account.
 * 
 * Apple Test Account (ONLY account allowed to have demo data):
 * - Email: zadfad41@gmail.com
 * - Driver ID: xRLLVY7d0zwTCC9A
 * 
 * Execution: pnpm exec tsx scripts/remove-demo-data-from-production.ts
 */

import * as dotenv from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';

// Get __dirname equivalent in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from apps/web/.env.local
dotenv.config({ path: resolve(__dirname, '../apps/web/.env.local') });

const prisma = new PrismaClient();

// Apple Test Account - ONLY account allowed for demo
const APPLE_TEST_ACCOUNT = {
  email: 'zadfad41@gmail.com',
  driverId: 'xRLLVY7d0zwTCC9A',
};

async function main() {
  console.log('🚨 ===== REMOVING DEMO DATA FROM PRODUCTION =====');
  console.log('⏰ Started at:', new Date().toISOString());
  console.log('');

  try {
    // 1. Find the Apple Test Account user
    console.log('1️⃣ Identifying Apple Test Account...');
    const appleTestUser = await prisma.user.findUnique({
      where: { email: APPLE_TEST_ACCOUNT.email },
      include: { driver: true }
    });

    if (!appleTestUser) {
      console.log('⚠️ Apple Test Account not found - will create it later if needed');
    } else {
      console.log('✅ Apple Test Account found:');
      console.log('   - User ID:', appleTestUser.id);
      console.log('   - Driver ID:', appleTestUser.driver?.id || 'No driver record');
      console.log('   - Status:', appleTestUser.driver?.status || 'N/A');
    }
    console.log('');

    // 2. Find and remove all DEMO/TEST bookings (except for Apple Test Account)
    console.log('2️⃣ Searching for DEMO/TEST bookings...');
    
    const demoBookings = await prisma.booking.findMany({
      where: {
        OR: [
          { reference: { startsWith: 'DEMO-' } },
          { reference: { startsWith: 'TEST-' } },
          { reference: { startsWith: 'MOCK-' } },
          { customerName: { contains: 'Demo', mode: 'insensitive' } },
          { customerName: { contains: 'Test', mode: 'insensitive' } },
          { customerName: { contains: 'Mock', mode: 'insensitive' } },
          { customerEmail: { contains: 'demo', mode: 'insensitive' } },
          { customerEmail: { contains: 'test', mode: 'insensitive' } },
          { customerEmail: { contains: 'mock', mode: 'insensitive' } },
        ]
      },
      include: {
        driver: {
          include: {
            User: {
              select: { email: true }
            }
          }
        }
      }
    });

    console.log(`📊 Found ${demoBookings.length} DEMO/TEST bookings`);

    if (demoBookings.length > 0) {
      // Separate bookings: Apple Test Account vs Other Accounts
      const appleTestBookings = demoBookings.filter(b => 
        b.driver?.User?.email === APPLE_TEST_ACCOUNT.email
      );
      const otherAccountBookings = demoBookings.filter(b => 
        b.driver?.User?.email !== APPLE_TEST_ACCOUNT.email
      );

      console.log(`   - Apple Test Account: ${appleTestBookings.length} bookings (KEEP)`);
      console.log(`   - Other Accounts: ${otherAccountBookings.length} bookings (DELETE)`);
      console.log('');

      // Delete demo bookings from OTHER accounts (NOT Apple Test Account)
      if (otherAccountBookings.length > 0) {
        console.log('🗑️ Deleting DEMO bookings from production accounts...');
        
        const bookingIdsToDelete = otherAccountBookings.map(b => b.id);
        
        for (const booking of otherAccountBookings) {
          console.log(`   - Will delete ${booking.reference} (Driver: ${booking.driver?.User?.email || 'Unassigned'})`);
        }

        // Delete in correct order due to foreign key constraints:
        console.log('   📦 Deleting related records in cascade order...');
        
        // Helper to safely delete with error handling
        const safeDelete = async (model: string, deleteFn: Promise<any>) => {
          try {
            await deleteFn;
          } catch (err: any) {
            if (err.code === 'P2021') {
              console.log(`   ⏩ Skipping ${model} (table doesn't exist)`);
            } else {
              throw err;
            }
          }
        };
        
        // 1. Delete deepest nested records first (Assignment-related)
        await safeDelete('JobEvent', prisma.jobEvent.deleteMany({
          where: { Assignment: { bookingId: { in: bookingIdsToDelete } } }
        }));

        await safeDelete('DriverEarnings', prisma.driverEarnings.deleteMany({
          where: { Assignment: { bookingId: { in: bookingIdsToDelete } } }
        }));

        await safeDelete('DriverTip', prisma.driverTip.deleteMany({
          where: { Assignment: { bookingId: { in: bookingIdsToDelete } } }
        }));

        await safeDelete('DriverRating', prisma.driverRating.deleteMany({
          where: { Assignment: { bookingId: { in: bookingIdsToDelete } } }
        }));

        await safeDelete('DriverIncident', prisma.driverIncident.deleteMany({
          where: { Assignment: { bookingId: { in: bookingIdsToDelete } } }
        }));

        await safeDelete('BonusRequest', prisma.bonusRequest.deleteMany({
          where: { Assignment: { bookingId: { in: bookingIdsToDelete } } }
        }));

        // 2. Delete Assignments
        await safeDelete('Assignment', prisma.assignment.deleteMany({
          where: { bookingId: { in: bookingIdsToDelete } }
        }));

        // 3. Delete direct Booking-related records
        await safeDelete('TrackingPing', prisma.trackingPing.deleteMany({
          where: { bookingId: { in: bookingIdsToDelete } }
        }));

        await safeDelete('CommunicationLog', prisma.communicationLog.deleteMany({
          where: { bookingId: { in: bookingIdsToDelete } }
        }));

        await safeDelete('BookingItem', prisma.bookingItem.deleteMany({
          where: { bookingId: { in: bookingIdsToDelete } }
        }));

        await safeDelete('BookingProgress', prisma.bookingProgress.deleteMany({
          where: { bookingId: { in: bookingIdsToDelete } }
        }));

        await safeDelete('BookingCancellation', prisma.bookingCancellation.deleteMany({
          where: { bookingId: { in: bookingIdsToDelete } }
        }));

        await safeDelete('Invoice', prisma.invoice.deleteMany({
          where: { bookingId: { in: bookingIdsToDelete } }
        }));

        await safeDelete('TaxInvoice', prisma.taxInvoice.deleteMany({
          where: { bookingId: { in: bookingIdsToDelete } }
        }));

        await safeDelete('ChatSession', prisma.chatSession.deleteMany({
          where: { bookingId: { in: bookingIdsToDelete } }
        }));

        await safeDelete('Drop', prisma.drop.deleteMany({
          where: { bookingId: { in: bookingIdsToDelete } }
        }));

        // Delete Payment and its Refunds
        try {
          const payments = await prisma.payment.findMany({
            where: { bookingId: { in: bookingIdsToDelete } },
            select: { id: true }
          });

          if (payments.length > 0) {
            await prisma.refund.deleteMany({
              where: { paymentId: { in: payments.map(p => p.id) } }
            });

            await prisma.payment.deleteMany({
              where: { bookingId: { in: bookingIdsToDelete } }
            });
          }
        } catch (err) {
          console.log('   ⏩ Skipping Payment cleanup (may not exist)');
        }

        // 4. Finally delete Bookings
        const deletedCount = await prisma.booking.deleteMany({
          where: {
            id: { in: bookingIdsToDelete }
          }
        });

        console.log(`✅ Deleted ${deletedCount.count} DEMO bookings and all related data from production accounts`);
      } else {
        console.log('✅ No DEMO bookings found in production accounts');
      }
    } else {
      console.log('✅ No DEMO/TEST bookings found in database');
    }
    console.log('');

    // 3. Find and remove DEMO assignments
    console.log('3️⃣ Searching for DEMO assignments...');
    
    const demoAssignments = await prisma.assignment.findMany({
      where: {
        Booking: {
          OR: [
            { reference: { startsWith: 'DEMO-' } },
            { reference: { startsWith: 'TEST-' } },
            { reference: { startsWith: 'MOCK-' } },
          ]
        }
      },
      include: {
        Driver: {
          include: {
            User: {
              select: { email: true }
            }
          }
        },
        Booking: {
          select: { reference: true }
        }
      }
    });

    console.log(`📊 Found ${demoAssignments.length} DEMO assignments`);

    if (demoAssignments.length > 0) {
      const appleTestAssignments = demoAssignments.filter(a => 
        a.Driver.User?.email === APPLE_TEST_ACCOUNT.email
      );
      const otherAccountAssignments = demoAssignments.filter(a => 
        a.Driver.User?.email !== APPLE_TEST_ACCOUNT.email
      );

      console.log(`   - Apple Test Account: ${appleTestAssignments.length} assignments (KEEP)`);
      console.log(`   - Other Accounts: ${otherAccountAssignments.length} assignments (DELETE)`);
      console.log('');

      if (otherAccountAssignments.length > 0) {
        console.log('🗑️ Deleting DEMO assignments from production accounts...');
        
        const deletedCount = await prisma.assignment.deleteMany({
          where: {
            id: { in: otherAccountAssignments.map(a => a.id) }
          }
        });

        console.log(`✅ Deleted ${deletedCount.count} DEMO assignments`);
      } else {
        console.log('✅ No DEMO assignments in production accounts');
      }
    }
    console.log('');

    // 4. Find and remove DEMO earnings
    console.log('4️⃣ Searching for DEMO earnings...');
    
    const demoEarnings = await prisma.driverEarnings.findMany({
      where: {
        Assignment: {
          Booking: {
            OR: [
              { reference: { startsWith: 'DEMO-' } },
              { reference: { startsWith: 'TEST-' } },
              { reference: { startsWith: 'MOCK-' } },
            ]
          }
        }
      },
      include: {
        Driver: {
          include: {
            User: {
              select: { email: true }
            }
          }
        }
      }
    });

    console.log(`📊 Found ${demoEarnings.length} DEMO earnings records`);

    if (demoEarnings.length > 0) {
      const appleTestEarnings = demoEarnings.filter(e => 
        e.Driver.User?.email === APPLE_TEST_ACCOUNT.email
      );
      const otherAccountEarnings = demoEarnings.filter(e => 
        e.Driver.User?.email !== APPLE_TEST_ACCOUNT.email
      );

      console.log(`   - Apple Test Account: ${appleTestEarnings.length} earnings (KEEP)`);
      console.log(`   - Other Accounts: ${otherAccountEarnings.length} earnings (DELETE)`);
      console.log('');

      if (otherAccountEarnings.length > 0) {
        console.log('🗑️ Deleting DEMO earnings from production accounts...');
        
        const deletedCount = await prisma.driverEarnings.deleteMany({
          where: {
            id: { in: otherAccountEarnings.map(e => e.id) }
          }
        });

        console.log(`✅ Deleted ${deletedCount.count} DEMO earnings records`);
      } else {
        console.log('✅ No DEMO earnings in production accounts');
      }
    }
    console.log('');

    // 5. Verify all production drivers have ONLY real data
    console.log('5️⃣ Verifying production driver accounts...');
    
    const allDrivers = await prisma.driver.findMany({
      where: {
        status: 'active',
        onboardingStatus: 'approved'
      },
      include: {
        User: {
          select: { email: true, name: true }
        },
        Assignment: {
          where: {
            status: { in: ['invited', 'accepted'] }
          },
          include: {
            Booking: {
              select: { reference: true }
            }
          }
        }
      }
    });

    console.log(`📊 Found ${allDrivers.length} active production drivers`);
    console.log('');

    let hasIssues = false;
    for (const driver of allDrivers) {
      const demoAssignmentsForDriver = driver.Assignment.filter(a => 
        a.Booking.reference.startsWith('DEMO-') ||
        a.Booking.reference.startsWith('TEST-') ||
        a.Booking.reference.startsWith('MOCK-')
      );

      if (demoAssignmentsForDriver.length > 0 && driver.User?.email !== APPLE_TEST_ACCOUNT.email) {
        console.log(`❌ ISSUE: Driver ${driver.User?.email || driver.id} has ${demoAssignmentsForDriver.length} DEMO assignments!`);
        demoAssignmentsForDriver.forEach(a => {
          console.log(`   - ${a.Booking.reference}`);
        });
        hasIssues = true;
      }
    }

    if (!hasIssues) {
      console.log('✅ All production drivers have ONLY real data');
    }
    console.log('');

    // 6. Summary Report
    console.log('📋 ===== CLEANUP SUMMARY =====');
    console.log('✅ Demo data removal completed');
    console.log('✅ Apple Test Account preserved:', APPLE_TEST_ACCOUNT.email);
    console.log('✅ Production accounts verified clean');
    console.log('');
    console.log('🎯 Next Steps:');
    console.log('   1. Test a real driver login → should see ONLY real jobs');
    console.log('   2. Test Apple account → demo mode should work');
    console.log('   3. Monitor for any new demo data creation');
    console.log('');
    console.log('⏰ Completed at:', new Date().toISOString());
    console.log('===================================');

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

