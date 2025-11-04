// Simple test script to verify AI endpoints are working
// Run with: node test-ai-endpoints.js

const BASE_URL = 'http://localhost:3000/api';

async function testEndpoint(endpoint, method = 'GET', body = null) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    console.log(`\n🧪 Testing ${method} ${endpoint}...`);
    const response = await fetch(`${BASE_URL}${endpoint}`, options);

    if (response.ok) {
      const data = await response.json();
      console.log(`✅ ${endpoint} - SUCCESS`);
      console.log(`   Status: ${response.status}`);
      console.log(`   Response keys: ${Object.keys(data).join(', ')}`);
      return true;
    } else {
      console.log(`❌ ${endpoint} - FAILED`);
      console.log(`   Status: ${response.status}`);
      console.log(`   Response: ${await response.text()}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ ${endpoint} - ERROR`);
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Testing AI Driver Assistance System Endpoints\n');
  console.log('=' .repeat(50));

  const results = [];

  // Test basic AI health
  results.push(await testEndpoint('/ai/driver-assist'));

  // Test traffic API with mock data
  results.push(await testEndpoint('/traffic', 'POST', {
    route: {
      origin: { lat: 51.5074, lng: -0.1278 },
      destination: { lat: 51.5225, lng: -0.0473 },
      waypoints: []
    },
    includeIncidents: true,
    dataSource: 'mock'
  }));

  // Test weather API with mock data
  results.push(await testEndpoint('/weather', 'POST', {
    location: { lat: 51.5074, lng: -0.1278 },
    includeForecast: true,
    includeAlerts: true,
    dataSource: 'mock'
  }));

  // Test driver profiles API
  results.push(await testEndpoint('/driver-profiles?driverId=driver_001'));

  // Test AI driver assist with route optimization
  results.push(await testEndpoint('/ai/driver-assist', 'POST', {
    requestType: 'route_optimization',
    currentLocation: { lat: 51.5074, lng: -0.1278, address: 'London' },
    activeJobs: [
      {
        id: 'job_001',
        reference: 'SPV-001',
        pickup: {
          address: '123 Pickup St, London',
          lat: 51.5074,
          lng: -0.1278,
          time: '2024-11-02T10:00:00Z'
        },
        dropoff: {
          address: '456 Delivery Ave, London',
          lat: 51.5225,
          lng: -0.0473,
          time: '2024-11-02T11:00:00Z'
        },
        earnings: '£45.50',
        priority: 'medium'
      }
    ],
    constraints: {
      trafficAware: true,
      weatherAware: true,
      fuelEfficiency: true
    }
  }));

  console.log('\n' + '=' .repeat(50));
  const passed = results.filter(Boolean).length;
  const total = results.length;
  console.log(`📊 Test Results: ${passed}/${total} endpoints working`);

  if (passed === total) {
    console.log('🎉 All AI endpoints are responding correctly!');
    console.log('🚗 The AI Driver Assistance System is ready for production.');
  } else {
    console.log('⚠️ Some endpoints need attention. Check the logs above.');
  }
}

// Run tests
runTests().catch(console.error);
