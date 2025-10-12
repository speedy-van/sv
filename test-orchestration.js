/**
 * Test Route Orchestration API
 * 
 * Tests the route orchestration engine with various scenarios
 * Run: node test-orchestration.js
 */

// Sample test data for route orchestration
const sampleDrops = [
  {
    id: "drop_001",
    bookingId: "bkg_001",
    pickupLocation: {
      latitude: 24.7136,
      longitude: 46.6753,
      address: "Riyadh Downtown, Saudi Arabia"
    },
    deliveryLocation: {
      latitude: 24.7236,
      longitude: 46.6853,
      address: "Al Olaya District, Riyadh"
    },
    timeWindow: {
      earliest: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour from now
      latest: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString() // 4 hours from now
    },
    weight: 5.5,
    volume: 0.05,
    serviceTier: "standard",
    priority: 7,
    estimatedDuration: 30,
    value: 85.50,
    status: "pending"
  },
  {
    id: "drop_002",
    bookingId: "bkg_002",
    pickupLocation: {
      latitude: 24.7156,
      longitude: 46.6773,
      address: "King Fahd Road, Riyadh"
    },
    deliveryLocation: {
      latitude: 24.7256,
      longitude: 46.6873,
      address: "Diplomatic Quarter, Riyadh"
    },
    timeWindow: {
      earliest: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 min from now
      latest: new Date(Date.now() + 3.5 * 60 * 60 * 1000).toISOString() // 3.5 hours from now
    },
    weight: 3.2,
    volume: 0.03,
    serviceTier: "standard",
    priority: 8,
    estimatedDuration: 25,
    value: 72.00,
    status: "pending"
  },
  {
    id: "drop_003",
    bookingId: "bkg_003",
    pickupLocation: {
      latitude: 24.7176,
      longitude: 46.6793,
      address: "Prince Sultan Road, Riyadh"
    },
    deliveryLocation: {
      latitude: 24.7276,
      longitude: 46.6893,
      address: "Al Malaz District, Riyadh"
    },
    timeWindow: {
      earliest: new Date(Date.now() + 45 * 60 * 1000).toISOString(), // 45 min from now
      latest: new Date(Date.now() + 4.5 * 60 * 60 * 1000).toISOString() // 4.5 hours from now
    },
    weight: 8.1,
    volume: 0.08,
    serviceTier: "premium",
    priority: 9,
    estimatedDuration: 40,
    value: 125.75,
    status: "pending"
  },
  {
    id: "drop_004",
    bookingId: "bkg_004",
    pickupLocation: {
      latitude: 24.7116,
      longitude: 46.6733,
      address: "Al Murabba District, Riyadh"
    },
    deliveryLocation: {
      latitude: 24.7216,
      longitude: 46.6833,
      address: "Al Sulimaniyah, Riyadh"
    },
    timeWindow: {
      earliest: new Date(Date.now() + 90 * 60 * 1000).toISOString(), // 1.5 hours from now
      latest: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString() // 5 hours from now
    },
    weight: 2.8,
    volume: 0.025,
    serviceTier: "economy",
    priority: 5,
    estimatedDuration: 20,
    value: 45.25,
    status: "pending"
  },
  {
    id: "drop_005",
    bookingId: "bkg_005",
    pickupLocation: {
      latitude: 24.7196,
      longitude: 46.6813,
      address: "Al Naseem District, Riyadh"
    },
    deliveryLocation: {
      latitude: 24.7296,
      longitude: 46.6913,
      address: "Al Rawdah District, Riyadh"
    },
    timeWindow: {
      earliest: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
      latest: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString() // 6 hours from now
    },
    weight: 12.5,
    volume: 0.12,
    serviceTier: "premium",
    priority: 10,
    estimatedDuration: 50,
    value: 180.00,
    status: "pending"
  }
];

async function testOrchestrationAPI() {
  const baseUrl = 'http://localhost:3000';
  
  console.log('🎯 Testing Route Orchestration API...\n');

  // Test 1: Basic orchestration
  console.log('📋 Test 1: Basic route orchestration');
  try {
    const response = await fetch(`${baseUrl}/api/routes/orchestrate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        drops: sampleDrops,
        options: {
          emergencyMode: false,
          preferredStartTime: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
          availableDrivers: 3
        }
      })
    });

    const data = await response.json();
    console.log('✅ Basic orchestration response:');
    console.log(`   Routes created: ${data.data?.routes?.length || 0}`);
    console.log(`   Unassigned drops: ${data.data?.unassigned?.length || 0}`);
    console.log(`   Efficiency score: ${data.data?.metrics?.efficiencyScore?.toFixed(1) || 'N/A'}`);
    console.log(`   Processing time: ${data.data?.processingTime || 'N/A'}ms`);
    
    if (data.data?.routes?.length > 0) {
      const route = data.data.routes[0];
      console.log(`   Sample route: ${route.drops?.length || 0} drops, $${route.totalValue?.toFixed(2) || '0'} value`);
    }
  } catch (error) {
    console.error('❌ Test 1 failed:', error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 2: Emergency mode orchestration
  console.log('📋 Test 2: Emergency mode orchestration');
  try {
    const response = await fetch(`${baseUrl}/api/routes/orchestrate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        drops: sampleDrops.slice(0, 3), // Use fewer drops for emergency
        options: {
          emergencyMode: true,
          customConfig: {
            maxClusterRadius: 10000, // Larger radius for emergency
            allowMixedTiers: true // Allow mixed tiers in emergency
          }
        }
      })
    });

    const data = await response.json();
    console.log('✅ Emergency orchestration response:');
    console.log(`   Routes created: ${data.data?.routes?.length || 0}`);
    console.log(`   Assignment rate: ${((data.data?.metrics?.assignmentRate || 0) * 100).toFixed(1)}%`);
    console.log(`   Emergency mode applied: ${data.data?.routes?.[0] ? 'Yes' : 'No'}`);
  } catch (error) {
    console.error('❌ Test 2 failed:', error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 3: Geofence constraints
  console.log('📋 Test 3: Orchestration with geofence constraints');
  try {
    const response = await fetch(`${baseUrl}/api/routes/orchestrate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        drops: sampleDrops,
        options: {
          geofenceConstraints: [
            {
              lat: 24.7136,
              lng: 46.6753,
              radius: 3000 // 3km radius from downtown Riyadh
            }
          ],
          customConfig: {
            maxDropsPerRoute: 6
          }
        }
      })
    });

    const data = await response.json();
    console.log('✅ Geofence orchestration response:');
    console.log(`   Routes within geofence: ${data.data?.routes?.length || 0}`);
    console.log(`   Drops outside geofence: ${data.data?.unassigned?.length || 0}`);
  } catch (error) {
    console.error('❌ Test 3 failed:', error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 4: Get orchestration configuration
  console.log('📋 Test 4: Get orchestration configuration');
  try {
    const response = await fetch(`${baseUrl}/api/routes/orchestrate`, {
      method: 'GET'
    });

    const data = await response.json();
    console.log('✅ Configuration response:');
    console.log(`   Max cluster radius: ${data.data?.config?.maxClusterRadius || 'N/A'}m`);
    console.log(`   Max drops per route: ${data.data?.config?.maxDropsPerRoute || 'N/A'}`);
    console.log(`   Mixed tiers allowed: ${data.data?.config?.allowMixedTiers ? 'Yes' : 'No'}`);
  } catch (error) {
    console.error('❌ Test 4 failed:', error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 5: Validate drops before orchestration
  console.log('📋 Test 5: Validate drops before orchestration');
  try {
    // Create some invalid drops for testing
    const testDrops = [
      ...sampleDrops.slice(0, 2), // Valid drops
      {
        ...sampleDrops[0],
        id: "drop_invalid_001",
        weight: -5, // Invalid: negative weight
        timeWindow: {
          earliest: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
          latest: new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString() // Invalid: end before start
        }
      }
    ];

    const response = await fetch(`${baseUrl}/api/routes/orchestrate`, {
      method: 'PUT', // Using PUT for validation endpoint
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        drops: testDrops
      })
    });

    const data = await response.json();
    console.log('✅ Drop validation response:');
    console.log(`   Total drops: ${data.data?.total || 0}`);
    console.log(`   Valid drops: ${data.data?.valid || 0}`);
    console.log(`   Invalid drops: ${data.data?.invalid || 0}`);
    
    if (data.data?.issues?.length > 0) {
      console.log(`   Issues found:`);
      data.data.issues.forEach((issue, index) => {
        console.log(`     ${index + 1}. Drop ${issue.dropId}: ${issue.issues.join(', ')}`);
      });
    }
  } catch (error) {
    console.error('❌ Test 5 failed:', error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 6: Invalid request (missing required fields)
  console.log('📋 Test 6: Invalid request validation');
  try {
    const response = await fetch(`${baseUrl}/api/routes/orchestrate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        drops: [], // Invalid: empty drops array
        options: {
          emergencyMode: "not_boolean" // Invalid: wrong type
        }
      })
    });

    const data = await response.json();
    console.log('✅ Expected validation error response:');
    console.log(`   Success: ${data.success}`);
    console.log(`   Error: ${data.error}`);
    console.log(`   Validation issues: ${data.details?.length || 0}`);
  } catch (error) {
    console.error('❌ Test 6 failed:', error.message);
  }

  console.log('\n🎉 All orchestration tests completed!');
}

// Performance benchmark for orchestration
async function benchmarkOrchestration() {
  console.log('🏁 Running orchestration performance benchmark...\n');
  
  const baseUrl = 'http://localhost:3000';
  const dropCounts = [5, 10, 20, 50];
  
  for (const count of dropCounts) {
    const testDrops = Array.from({ length: count }, (_, i) => ({
      ...sampleDrops[i % sampleDrops.length],
      id: `drop_bench_${i}`,
      bookingId: `bkg_bench_${i}`,
      pickupLocation: {
        ...sampleDrops[i % sampleDrops.length].pickupLocation,
        latitude: sampleDrops[i % sampleDrops.length].pickupLocation.latitude + (Math.random() - 0.5) * 0.1,
        longitude: sampleDrops[i % sampleDrops.length].pickupLocation.longitude + (Math.random() - 0.5) * 0.1
      }
    }));
    
    const startTime = Date.now();
    
    try {
      const response = await fetch(`${baseUrl}/api/routes/orchestrate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          drops: testDrops,
          options: {
            emergencyMode: false
          }
        })
      });

      const data = await response.json();
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      const processingTime = data.data?.processingTime || 0;
      
      console.log(`📊 ${count} drops:`);
      console.log(`   Total time: ${totalTime}ms (${(totalTime / count).toFixed(1)}ms per drop)`);
      console.log(`   Processing time: ${processingTime}ms`);
      console.log(`   Routes created: ${data.data?.routes?.length || 0}`);
      console.log(`   Efficiency: ${data.data?.metrics?.efficiencyScore?.toFixed(1) || 'N/A'}%`);
      
      if (totalTime > 5000) {
        console.log(`⚠️  Warning: Total time exceeds 5 second threshold`);
      }
      
    } catch (error) {
      console.error(`❌ Benchmark failed for ${count} drops:`, error.message);
    }
    
    console.log('');
  }
}

// Export for use in other scripts
if (typeof module !== 'undefined') {
  module.exports = {
    testOrchestrationAPI,
    benchmarkOrchestration,
    sampleDrops
  };
}

// Run tests if called directly
if (typeof require !== 'undefined' && require.main === module) {
  testOrchestrationAPI()
    .then(() => benchmarkOrchestration())
    .catch(console.error);
}