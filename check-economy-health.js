#!/usr/bin/env node
/**
 * Economy Service Health Check
 * 
 * Quickly verify that Economy service routing is working correctly
 * 
 * Usage: node check-economy-health.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDatabaseSchema() {
  console.log('\n📋 Checking Database Schema...');
  
  try {
    // Try to query with new columns
    const testQuery = await prisma.booking.findFirst({
      select: {
        serviceType: true,
        isEconomyService: true,
        shouldBeMultiDrop: true,
      },
    });

    console.log('   ✅ Database columns exist');
    return true;
  } catch (error) {
    console.log('   ❌ Database columns missing!');
    console.log('   ⚠️  Run migration: psql $DATABASE_URL -f add-service-type-columns.sql');
    return false;
  }
}

async function checkEconomyBookings() {
  console.log('\n📦 Checking Economy Bookings...');

  try {
    // Count total Economy bookings
    const totalEconomy = await prisma.booking.count({
      where: {
        OR: [
          { serviceType: 'ECONOMY' },
          { isEconomyService: true },
        ],
      },
    });

    // Count converted to multi-drop
    const converted = await prisma.booking.count({
      where: {
        OR: [
          { serviceType: 'ECONOMY' },
          { isEconomyService: true },
        ],
        orderType: 'multi-drop',
      },
    });

    // Count still pending
    const pending = await prisma.booking.count({
      where: {
        OR: [
          { serviceType: 'ECONOMY' },
          { isEconomyService: true },
        ],
        orderType: {
          not: 'multi-drop',
        },
        status: 'CONFIRMED',
      },
    });

    console.log(`   📊 Total Economy Bookings: ${totalEconomy}`);
    console.log(`   ✅ Converted to Multi-Drop: ${converted}`);
    console.log(`   ⏳ Pending Conversion: ${pending}`);

    if (pending > 0) {
      console.log(`   ⚠️  Some bookings need conversion!`);
      console.log(`   💡 Run: node convert-economy-bookings.js --all`);
    }

    return { totalEconomy, converted, pending };
  } catch (error) {
    console.log(`   ❌ Error checking bookings: ${error.message}`);
    return null;
  }
}

async function checkEconomyDrops() {
  console.log('\n🎯 Checking Economy Drops...');

  try {
    // Count drops with economy service tier
    const economyDrops = await prisma.drop.count({
      where: {
        serviceTier: 'economy',
      },
    });

    // Count drops without routes
    const unassigned = await prisma.drop.count({
      where: {
        serviceTier: 'economy',
        routeId: null,
      },
    });

    // Count drops in routes
    const assigned = await prisma.drop.count({
      where: {
        serviceTier: 'economy',
        routeId: {
          not: null,
        },
      },
    });

    console.log(`   📊 Total Economy Drops: ${economyDrops}`);
    console.log(`   ⏳ Awaiting Route Assignment: ${unassigned}`);
    console.log(`   ✅ Assigned to Routes: ${assigned}`);

    return { economyDrops, unassigned, assigned };
  } catch (error) {
    console.log(`   ❌ Error checking drops: ${error.message}`);
    return null;
  }
}

async function checkRecentActivity() {
  console.log('\n📈 Recent Activity (Last 24 Hours)...');

  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Count recent Economy bookings
    const recentBookings = await prisma.booking.count({
      where: {
        OR: [
          { serviceType: 'ECONOMY' },
          { isEconomyService: true },
        ],
        createdAt: {
          gte: oneDayAgo,
        },
      },
    });

    // Count recent Drops created
    const recentDrops = await prisma.drop.count({
      where: {
        serviceTier: 'economy',
        createdAt: {
          gte: oneDayAgo,
        },
      },
    });

    // Count audit logs
    const auditLogs = await prisma.auditLog.count({
      where: {
        action: {
          in: ['economy_booking_created', 'manual_economy_drop_conversion'],
        },
        createdAt: {
          gte: oneDayAgo,
        },
      },
    });

    console.log(`   📦 New Economy Bookings: ${recentBookings}`);
    console.log(`   🎯 New Economy Drops: ${recentDrops}`);
    console.log(`   📝 Audit Logs: ${auditLogs}`);

    if (recentBookings > 0 && recentDrops === 0) {
      console.log(`   ⚠️  Bookings created but no Drops! Webhook may not be working.`);
    } else if (recentBookings > 0 && recentDrops > 0) {
      const conversionRate = (recentDrops / recentBookings * 100).toFixed(1);
      console.log(`   📊 Conversion Rate: ${conversionRate}%`);
      
      if (conversionRate < 90) {
        console.log(`   ⚠️  Low conversion rate! Check webhook logs.`);
      } else {
        console.log(`   ✅ Conversion rate is healthy!`);
      }
    }

    return { recentBookings, recentDrops, auditLogs };
  } catch (error) {
    console.log(`   ❌ Error checking recent activity: ${error.message}`);
    return null;
  }
}

async function checkProblemBookings() {
  console.log('\n⚠️  Checking for Problem Bookings...');

  try {
    // Find Economy bookings in Single Orders (should be in Multi-Drop)
    const wrongSection = await prisma.booking.findMany({
      where: {
        status: 'CONFIRMED',
        routeId: null,
        OR: [
          { serviceType: 'ECONOMY' },
          { isEconomyService: true },
        ],
        orderType: {
          not: 'multi-drop',
        },
      },
      select: {
        id: true,
        reference: true,
        serviceType: true,
        orderType: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 5,
    });

    if (wrongSection.length === 0) {
      console.log(`   ✅ No problem bookings found!`);
    } else {
      console.log(`   ⚠️  Found ${wrongSection.length} Economy bookings NOT in Multi-Drop:`);
      wrongSection.forEach(booking => {
        console.log(`      - ${booking.reference} (${booking.id})`);
        console.log(`        Created: ${booking.createdAt.toISOString()}`);
        console.log(`        Type: ${booking.orderType || 'Not set'}`);
      });
      console.log(`\n   💡 Fix with: node convert-economy-bookings.js --all`);
    }

    return wrongSection;
  } catch (error) {
    console.log(`   ❌ Error checking problem bookings: ${error.message}`);
    return null;
  }
}

async function generateHealthScore() {
  console.log('\n\n╔══════════════════════════════════════════════════════╗');
  console.log('║              HEALTH SCORE SUMMARY                   ║');
  console.log('╚══════════════════════════════════════════════════════╝\n');

  const checks = {
    schemaOk: false,
    conversionRate: 0,
    problemBookings: 0,
  };

  // Check schema
  checks.schemaOk = await checkDatabaseSchema();

  // Check bookings
  const bookingStats = await checkEconomyBookings();
  if (bookingStats && bookingStats.totalEconomy > 0) {
    checks.conversionRate = (bookingStats.converted / bookingStats.totalEconomy * 100);
  }

  // Check drops
  await checkEconomyDrops();

  // Check recent activity
  const activityStats = await checkRecentActivity();

  // Check problems
  const problems = await checkProblemBookings();
  if (problems) {
    checks.problemBookings = problems.length;
  }

  // Calculate overall health score
  let score = 0;
  
  if (checks.schemaOk) score += 30;
  if (checks.conversionRate >= 90) score += 40;
  else if (checks.conversionRate >= 70) score += 20;
  else if (checks.conversionRate >= 50) score += 10;
  
  if (checks.problemBookings === 0) score += 30;
  else if (checks.problemBookings <= 5) score += 15;
  else if (checks.problemBookings <= 10) score += 5;

  console.log(`\n┌──────────────────────────────────────────┐`);
  console.log(`│  Overall Health Score: ${score}/100 ${getHealthEmoji(score)}        │`);
  console.log(`└──────────────────────────────────────────┘\n`);

  if (score >= 90) {
    console.log('✅ EXCELLENT - Economy service routing is working perfectly!\n');
  } else if (score >= 70) {
    console.log('🟢 GOOD - Economy service routing is working with minor issues\n');
  } else if (score >= 50) {
    console.log('🟡 FAIR - Economy service routing needs attention\n');
  } else {
    console.log('🔴 POOR - Economy service routing has serious issues!\n');
    console.log('⚠️  RECOMMENDED ACTIONS:');
    if (!checks.schemaOk) {
      console.log('   1. Run database migration: psql $DATABASE_URL -f add-service-type-columns.sql');
    }
    if (checks.problemBookings > 0) {
      console.log('   2. Convert pending bookings: node convert-economy-bookings.js --all');
    }
    if (checks.conversionRate < 50) {
      console.log('   3. Check webhook logs for errors');
    }
    console.log('');
  }
}

function getHealthEmoji(score) {
  if (score >= 90) return '🎉';
  if (score >= 70) return '✅';
  if (score >= 50) return '⚠️';
  return '❌';
}

async function main() {
  console.log('\n╔══════════════════════════════════════════════════════╗');
  console.log('║     Economy Service Health Check                    ║');
  console.log('╚══════════════════════════════════════════════════════╝');

  try {
    await generateHealthScore();

    console.log('\n✅ Health check completed!\n');
    await prisma.$disconnect();
  } catch (error) {
    console.error('\n❌ Health check failed:', error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

main();
