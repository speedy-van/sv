// Debug pricing API call using PowerShell
const { execSync } = require('child_process');

async function debugPricing() {
  try {
    console.log('🔍 Debugging pricing API call...');

    // Same data that booking form sends
    const testData = {
      items: [
        {
          id: 'full-house-1bed',
          name: '1 Bedroom House Package',
          category: 'full-house',
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
        address: '123 Test Street, London, SW1A 1AA',
        postcode: 'SW1A 1AA',
        coordinates: { lat: 51.5074, lng: -0.1278 }
      },
      dropoffAddress: {
        address: '456 Test Avenue, Manchester, M1 1AA',
        postcode: 'M1 1AA',
        coordinates: { lat: 53.483959, lng: -2.244644 }
      },
      pickupProperty: {
        type: 'house',
        floors: 0,
        hasLift: false,
        hasParking: true,
        accessNotes: null,
        requiresPermit: false
      },
      dropoffProperty: {
        type: 'house',
        floors: 0,
        hasLift: false,
        hasParking: true,
        accessNotes: null,
        requiresPermit: false
      },
      serviceType: 'standard',
      pickupDate: new Date().toISOString().split('T')[0],
      pickupTimeSlot: 'flexible',
      urgency: 'scheduled',
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

    console.log('📋 Sending request to pricing API...');
    console.log('Items:', testData.items.length);
    console.log('Pickup:', testData.pickupAddress.postcode);
    console.log('Dropoff:', testData.dropoffAddress.postcode);

    // Use PowerShell to make the HTTP request
    const psCommand = `
      $body = '${JSON.stringify(testData)}' | ConvertTo-Json -Depth 10
      $response = Invoke-WebRequest -Uri "http://localhost:3000/api/pricing/quote" -Method POST -Body $body -ContentType "application/json" -Headers @{"X-Correlation-ID"="debug-$(Get-Date -UFormat %s)"}
      $response.Content
    `;

    try {
      const result = execSync(`powershell -Command "${psCommand}"`, { encoding: 'utf8' });
      const apiResponse = JSON.parse(result.trim());

      console.log('📡 Response status: 200');
      console.log('✅ API Response:', apiResponse);

      if (apiResponse.success) {
        console.log('💰 Pricing calculated:', '£' + (apiResponse.data.amountGbpMinor / 100).toFixed(2));
      } else {
        console.error('❌ API returned error:', apiResponse.error);
        if (apiResponse.details) {
          console.error('Details:', apiResponse.details);
        }
      }
    } catch (error) {
      console.error('❌ PowerShell request failed:', error.message);
      if (error.stdout) console.log('STDOUT:', error.stdout);
      if (error.stderr) console.error('STDERR:', error.stderr);
    }

  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }
}

// Run the debug
debugPricing();
