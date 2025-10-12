// Test script to create sample routes for testing
const fetch = require('node-fetch');

async function createTestRoutes() {
  try {
    console.log('🧪 Creating test routes for auto scheduler testing...');

    // First, let's check if we have any pending drops
    const dropsResponse = await fetch('http://localhost:3001/api/admin/routes?status=all');
    const dropsData = await dropsResponse.json();

    console.log('📊 Current routes/drops status:', dropsData);

    // Try to trigger auto-create
    const autoCreateResponse = await fetch('http://localhost:3001/api/admin/routes/auto-create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        maxDropsPerRoute: 5,
        autoAssignDrivers: true,
      })
    });

    const autoCreateData = await autoCreateResponse.json();
    console.log('🚀 Auto-create response:', autoCreateData);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

createTestRoutes();