const fetch = require('node-fetch');

async function testDriverDashboardAPI() {
  console.log('Testing Driver Dashboard API...');

  try {
    // Test without authentication first (should return 401)
    const response = await fetch('http://localhost:3000/api/driver/dashboard');

    if (response.status === 401) {
      console.log('✅ API endpoint is responding correctly (401 Unauthorized as expected)');
      console.log('Response:', await response.text());
    } else {
      console.log('Response status:', response.status);
      console.log('Response:', await response.text());
    }
  } catch (error) {
    console.error('❌ API endpoint is not responding:', error.message);
  }
}

testDriverDashboardAPI();

