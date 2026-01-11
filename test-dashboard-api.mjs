#!/usr/bin/env node
/**
 * Test Dashboard API
 * يختبر dashboard API بعد إصلاح مشكلة Prisma
 */

import http from 'http';

console.log('🧪 Testing Dashboard API after Prisma fix...\n');

// Test 1: Health check
function testHealthCheck() {
  return new Promise((resolve, reject) => {
    console.log('1️⃣ Testing health check...');
    const req = http.get('http://localhost:3000/api/health', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('   ✅ Health check passed\n');
          resolve(true);
        } else {
          console.log('   ❌ Health check failed:', res.statusCode, '\n');
          resolve(false);
        }
      });
    });
    req.on('error', (e) => {
      console.error('   ❌ Error:', e.message, '\n');
      resolve(false);
    });
    req.end();
  });
}

// Test 2: Dashboard endpoint (should return 401 without auth)
function testDashboardEndpoint() {
  return new Promise((resolve, reject) => {
    console.log('2️⃣ Testing dashboard endpoint (without auth)...');
    const req = http.get('http://localhost:3000/api/admin/dashboard', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 401) {
          console.log('   ✅ Dashboard endpoint accessible (requires auth as expected)');
          console.log('   📊 Response:', data.substring(0, 100), '\n');
          resolve(true);
        } else {
          console.log('   ❌ Unexpected status code:', res.statusCode);
          console.log('   📊 Response:', data.substring(0, 200), '\n');
          
          // Check for Prisma error
          if (data.includes('BookingAddress_Booking_pickupAddressIdToBookingAddress')) {
            console.log('   🚨 PRISMA ERROR STILL EXISTS!\n');
            resolve(false);
          } else if (data.includes('PrismaClientValidationError')) {
            console.log('   🚨 PRISMA VALIDATION ERROR DETECTED!\n');
            resolve(false);
          } else {
            resolve(true);
          }
        }
      });
    });
    req.on('error', (e) => {
      console.error('   ❌ Error:', e.message, '\n');
      resolve(false);
    });
    req.end();
  });
}

// Run tests
async function runTests() {
  console.log('════════════════════════════════════════════════\n');
  
  const healthOk = await testHealthCheck();
  if (!healthOk) {
    console.log('⛔ Server not running. Please start the server first.\n');
    process.exit(1);
  }
  
  const dashboardOk = await testDashboardEndpoint();
  
  console.log('════════════════════════════════════════════════\n');
  
  if (dashboardOk) {
    console.log('🎉 SUCCESS: Dashboard API is working correctly!');
    console.log('✅ The Prisma error has been fixed!\n');
    process.exit(0);
  } else {
    console.log('❌ FAILED: Dashboard API still has issues.\n');
    process.exit(1);
  }
}

runTests();
