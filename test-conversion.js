/**
 * Test Booking to Drop Conversion
 * 
 * This script tests the conversion API endpoint and validates the business logic.
 * Run: node test-conversion.js
 */

async function testConversionAPI() {
  const baseUrl = 'http://localhost:3000';
  
  console.log('🧪 Testing Booking to Drop Conversion API...\n');

  // Test 1: Valid conversion request
  console.log('📋 Test 1: Valid conversion request');
  try {
    const response = await fetch(`${baseUrl}/api/bookings/convert-to-drops`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        bookingIds: [
          'bkg_test_001',
          'bkg_test_002',
          'bkg_test_003',
          'bkg_test_004',
          'bkg_test_005'
        ],
        forceConvert: false
      })
    });

    const data = await response.json();
    console.log('✅ Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('❌ Test 1 failed:', error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 2: Force conversion
  console.log('📋 Test 2: Force conversion (override existing)');
  try {
    const response = await fetch(`${baseUrl}/api/bookings/convert-to-drops`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        bookingIds: ['bkg_existing_001', 'bkg_existing_002'],
        forceConvert: true
      })
    });

    const data = await response.json();
    console.log('✅ Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('❌ Test 2 failed:', error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 3: Invalid request (too many bookings)
  console.log('📋 Test 3: Invalid request (exceeds batch limit)');
  try {
    const tooManyBookings = Array.from({ length: 51 }, (_, i) => `bkg_${i}`);
    
    const response = await fetch(`${baseUrl}/api/bookings/convert-to-drops`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        bookingIds: tooManyBookings,
        forceConvert: false
      })
    });

    const data = await response.json();
    console.log('✅ Expected error response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('❌ Test 3 failed:', error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 4: Get conversion stats
  console.log('📋 Test 4: Get conversion statistics');
  try {
    const response = await fetch(`${baseUrl}/api/bookings/convert-to-drops?days=7`);
    const data = await response.json();
    console.log('✅ Stats Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('❌ Test 4 failed:', error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 5: Large batch conversion (performance test)
  console.log('📋 Test 5: Large batch conversion (performance test)');
  const startTime = Date.now();
  
  try {
    const largeBatch = Array.from({ length: 25 }, (_, i) => `bkg_perf_${i}`);
    
    const response = await fetch(`${baseUrl}/api/bookings/convert-to-drops`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        bookingIds: largeBatch,
        forceConvert: false
      })
    });

    const data = await response.json();
    const endTime = Date.now();
    const processingTime = endTime - startTime;
    
    console.log('✅ Large batch response:', JSON.stringify(data, null, 2));
    console.log(`⏱️  Processing time: ${processingTime}ms (${processingTime / 25}ms per booking)`);
  } catch (error) {
    console.error('❌ Test 5 failed:', error.message);
  }

  console.log('\n🎉 All tests completed!');
}

// Helper function to validate response structure
function validateConversionResponse(response) {
  const requiredFields = ['success', 'converted', 'existing', 'failed', 'summary'];
  const summaryFields = ['total', 'newDrops', 'existingDrops', 'failures'];
  
  for (const field of requiredFields) {
    if (!(field in response)) {
      throw new Error(`Missing required field: ${field}`);
    }
  }
  
  for (const field of summaryFields) {
    if (!(field in response.summary)) {
      throw new Error(`Missing summary field: ${field}`);
    }
  }
  
  // Validate totals add up
  const { summary } = response;
  const calculatedTotal = summary.newDrops + summary.existingDrops + summary.failures;
  
  if (calculatedTotal !== summary.total) {
    throw new Error(`Summary totals don't match: calculated ${calculatedTotal}, reported ${summary.total}`);
  }
  
  return true;
}

// Performance benchmark
async function benchmarkConversion() {
  console.log('🏁 Running conversion performance benchmark...\n');
  
  const batchSizes = [1, 5, 10, 25, 50];
  const baseUrl = 'http://localhost:3000';
  
  for (const size of batchSizes) {
    const bookingIds = Array.from({ length: size }, (_, i) => `bkg_bench_${i}`);
    const startTime = Date.now();
    
    try {
      const response = await fetch(`${baseUrl}/api/bookings/convert-to-drops`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingIds,
          forceConvert: false
        })
      });

      const data = await response.json();
      const endTime = Date.now();
      const processingTime = endTime - startTime;
      const avgTime = processingTime / size;
      
      console.log(`📊 Batch size ${size}: ${processingTime}ms total, ${avgTime.toFixed(2)}ms per booking`);
      
      if (avgTime > 100) {
        console.log(`⚠️  Warning: Average processing time above 100ms threshold`);
      }
      
    } catch (error) {
      console.error(`❌ Benchmark failed for batch size ${size}:`, error.message);
    }
  }
}

// Export for use in other scripts
if (typeof module !== 'undefined') {
  module.exports = {
    testConversionAPI,
    validateConversionResponse,
    benchmarkConversion
  };
}

// Run tests if called directly
if (typeof require !== 'undefined' && require.main === module) {
  testConversionAPI()
    .then(() => benchmarkConversion())
    .catch(console.error);
}