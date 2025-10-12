// Simple Node.js test for pricing API
const https = require('http');

async function testPricingAPI() {
  console.log('🧪 Testing pricing API with Node.js...');

  const testData = {
    items: [
      {
        id: "full-house-1bed",
        name: "1 Bedroom House Package",
        category: "full-house",
        quantity: 1,
        weight: 1500,
        volume: 15.0,
        fragile: false,
        oversize: true,
        disassemblyRequired: false,
        specialHandling: []
      }
    ],
    pickupAddress: {
      address: "123 Test Street, London, SW1A 1AA",
      postcode: "SW1A 1AA",
      coordinates: {
        lat: 51.5074,
        lng: -0.1278
      }
    },
    dropoffAddress: {
      address: "456 Test Avenue, Manchester, M1 1AA",
      postcode: "M1 1AA",
      coordinates: {
        lat: 53.483959,
        lng: -2.244644
      }
    },
    pickupProperty: {
      type: "house",
      floors: 0,
      hasLift: false,
      hasParking: true,
      accessNotes: null,
      requiresPermit: false
    },
    dropoffProperty: {
      type: "house",
      floors: 0,
      hasLift: false,
      hasParking: true,
      accessNotes: null,
      requiresPermit: false
    },
    serviceType: "standard",
    pickupDate: "2025-10-03",
    pickupTimeSlot: "flexible",
    urgency: "scheduled",
    distance: 0,
    estimatedDuration: 0,
    pricing: {
      baseFee: 0,
      distanceFee: 0,
      volumeFee: 0,
      serviceFee: 0,
      urgencyFee: 0,
      vat: 0,
      total: 0,
      distance: 0
    }
  };

  const postData = JSON.stringify(testData);

  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/pricing/quote',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
      'X-Correlation-ID': 'test-' + Date.now()
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';

      console.log('📡 Response status:', res.statusCode);
      console.log('📋 Response headers:', res.headers);

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          console.log('✅ API Response:', JSON.stringify(result, null, 2));

          if (result.success) {
            console.log('💰 Pricing calculated successfully!');
            console.log('Total Price: £' + (result.data.amountGbpMinor / 100).toFixed(2));
            console.log('📋 Breakdown:');
            console.log('  Base Fee: £' + (result.data.breakdown.baseFee / 100).toFixed(2));
            console.log('  Distance Fee: £' + (result.data.breakdown.distanceFee / 100).toFixed(2));
            console.log('  Items Fee: £' + (result.data.breakdown.itemsFee / 100).toFixed(2));
            console.log('  Service Fee: £' + (result.data.breakdown.serviceFee / 100).toFixed(2));
            console.log('  VAT: £' + (result.data.vatAmount / 100).toFixed(2));
            console.log('🚗 Vehicle:', result.data.recommendedVehicle.name);
            console.log('📏 Distance:', result.data.route.totalDistance.toFixed(1) + ' km');
          } else {
            console.log('❌ API Error:', result.error);
            if (result.details) {
              console.log('Details:', result.details);
            }
          }

          resolve(result);
        } catch (error) {
          console.error('❌ Failed to parse response:', error.message);
          console.error('Raw response:', data);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Request failed:', error.message);
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

testPricingAPI().catch(console.error);
