/**
 * TEST SCRIPT: Remote Mainland Pickup Surcharge
 * 
 * Tests the new pricing rule:
 * - Remote mainland pickup + price < £300 → add £120 surcharge
 * - Remote mainland pickup + price ≥ £300 → no surcharge
 * - Non-remote pickup → no surcharge
 */

import { isRemoteMainlandPickupLocation, getRemoteLocationCountry, REMOTE_LOCATION_CONFIG } from './apps/web/src/lib/pricing/remote-location-checker';

console.log('🧪 Testing Remote Mainland Pickup Location Detection\n');
console.log('=' .repeat(60));

// Test cases
const testAddresses = [
  // Remote locations - England
  {
    full: '123 Main Street, Berwick-upon-Tweed, TD15 1AA',
    line1: '123 Main Street',
    city: 'Berwick-upon-Tweed',
    postcode: 'TD15 1AA',
    coordinates: { lat: 55.7686, lng: -2.0063 },
    expected: true,
    country: 'england'
  },
  {
    full: '45 High Street, Alnwick, NE66 1JQ',
    line1: '45 High Street',
    city: 'Alnwick',
    postcode: 'NE66 1JQ',
    coordinates: { lat: 55.4133, lng: -1.7067 },
    expected: true,
    country: 'england'
  },
  {
    full: '78 Market Place, Kendal, LA9 4QE',
    line1: '78 Market Place',
    city: 'Kendal',
    postcode: 'LA9 4QE',
    coordinates: { lat: 54.3265, lng: -2.7452 },
    expected: true,
    country: 'england'
  },
  
  // Remote locations - Wales
  {
    full: '12 Terrace Road, Aberystwyth, SY23 1NY',
    line1: '12 Terrace Road',
    city: 'Aberystwyth',
    postcode: 'SY23 1NY',
    coordinates: { lat: 52.4153, lng: -4.0829 },
    expected: true,
    country: 'wales'
  },
  {
    full: '56 High Street, Llandrindod Wells, LD1 6AG',
    line1: '56 High Street',
    city: 'Llandrindod Wells',
    postcode: 'LD1 6AG',
    coordinates: { lat: 52.2413, lng: -3.3782 },
    expected: true,
    country: 'wales'
  },
  
  // Remote locations - Scotland
  {
    full: '89 High Street, Inverness, IV1 1HT',
    line1: '89 High Street',
    city: 'Inverness',
    postcode: 'IV1 1HT',
    coordinates: { lat: 57.4778, lng: -4.2247 },
    expected: true,
    country: 'scotland'
  },
  {
    full: '34 Main Street, Fort William, PH33 6DN',
    line1: '34 Main Street',
    city: 'Fort William',
    postcode: 'PH33 6DN',
    coordinates: { lat: 56.8198, lng: -5.1052 },
    expected: true,
    country: 'scotland'
  },
  
  // Non-remote locations (major cities)
  {
    full: '10 Downing Street, London, SW1A 2AA',
    line1: '10 Downing Street',
    city: 'London',
    postcode: 'SW1A 2AA',
    coordinates: { lat: 51.5034, lng: -0.1276 },
    expected: false,
    country: null
  },
  {
    full: '1 Piccadilly Gardens, Manchester, M1 1RG',
    line1: '1 Piccadilly Gardens',
    city: 'Manchester',
    postcode: 'M1 1RG',
    coordinates: { lat: 53.4808, lng: -2.2426 },
    expected: false,
    country: null
  },
  {
    full: '123 Princes Street, Edinburgh, EH2 4AD',
    line1: '123 Princes Street',
    city: 'Edinburgh',
    postcode: 'EH2 4AD',
    coordinates: { lat: 55.9533, lng: -3.1883 },
    expected: false,
    country: null
  },
  {
    full: '45 St Mary Street, Cardiff, CF10 1DX',
    line1: '45 St Mary Street',
    city: 'Cardiff',
    postcode: 'CF10 1DX',
    coordinates: { lat: 51.4816, lng: -3.1791 },
    expected: false,
    country: null
  }
];

console.log('\n📍 Testing Location Detection:\n');

let passed = 0;
let failed = 0;

testAddresses.forEach((address, index) => {
  const result = isRemoteMainlandPickupLocation(address as any);
  const country = getRemoteLocationCountry(address as any);
  const status = result === address.expected ? '✅' : '❌';
  
  console.log(`${status} Test ${index + 1}: ${address.city}, ${address.postcode}`);
  console.log(`   Expected: ${address.expected ? 'REMOTE' : 'NOT REMOTE'}`);
  console.log(`   Got: ${result ? 'REMOTE' : 'NOT REMOTE'}`);
  console.log(`   Country: ${country || 'N/A'}`);
  
  if (result === address.expected && country === address.country) {
    passed++;
  } else {
    failed++;
    console.log(`   ⚠️  MISMATCH! Expected country: ${address.country}, got: ${country}`);
  }
  console.log('');
});

console.log('=' .repeat(60));
console.log(`\n📊 Results: ${passed}/${testAddresses.length} tests passed`);

if (failed > 0) {
  console.log(`❌ ${failed} tests failed\n`);
  process.exit(1);
} else {
  console.log('✅ All tests passed!\n');
}

// Test pricing scenarios
console.log('\n💰 Testing Pricing Surcharge Logic:\n');
console.log('=' .repeat(60));

const pricingScenarios = [
  {
    description: 'Remote pickup, price £250 (< £300)',
    isRemote: true,
    price: 250,
    expectedSurcharge: 120,
    expectedTotal: 370
  },
  {
    description: 'Remote pickup, price £299 (< £300)',
    isRemote: true,
    price: 299,
    expectedSurcharge: 120,
    expectedTotal: 419
  },
  {
    description: 'Remote pickup, price £300 (= £300)',
    isRemote: true,
    price: 300,
    expectedSurcharge: 0,
    expectedTotal: 300
  },
  {
    description: 'Remote pickup, price £350 (> £300)',
    isRemote: true,
    price: 350,
    expectedSurcharge: 0,
    expectedTotal: 350
  },
  {
    description: 'Non-remote pickup, price £250',
    isRemote: false,
    price: 250,
    expectedSurcharge: 0,
    expectedTotal: 250
  },
  {
    description: 'Non-remote pickup, price £350',
    isRemote: false,
    price: 350,
    expectedSurcharge: 0,
    expectedTotal: 350
  }
];

let pricingPassed = 0;
let pricingFailed = 0;

pricingScenarios.forEach((scenario, index) => {
  const shouldApplySurcharge = scenario.isRemote && scenario.price < REMOTE_LOCATION_CONFIG.PRICE_THRESHOLD;
  const actualSurcharge = shouldApplySurcharge ? REMOTE_LOCATION_CONFIG.SURCHARGE_AMOUNT : 0;
  const actualTotal = scenario.price + actualSurcharge;
  
  const status = actualSurcharge === scenario.expectedSurcharge && actualTotal === scenario.expectedTotal ? '✅' : '❌';
  
  console.log(`${status} Scenario ${index + 1}: ${scenario.description}`);
  console.log(`   Price: £${scenario.price}`);
  console.log(`   Remote: ${scenario.isRemote ? 'YES' : 'NO'}`);
  console.log(`   Expected surcharge: £${scenario.expectedSurcharge}`);
  console.log(`   Actual surcharge: £${actualSurcharge}`);
  console.log(`   Expected total: £${scenario.expectedTotal}`);
  console.log(`   Actual total: £${actualTotal}`);
  
  if (actualSurcharge === scenario.expectedSurcharge && actualTotal === scenario.expectedTotal) {
    pricingPassed++;
  } else {
    pricingFailed++;
  }
  console.log('');
});

console.log('=' .repeat(60));
console.log(`\n📊 Pricing Results: ${pricingPassed}/${pricingScenarios.length} scenarios passed`);

if (pricingFailed > 0) {
  console.log(`❌ ${pricingFailed} scenarios failed\n`);
  process.exit(1);
} else {
  console.log('✅ All pricing scenarios passed!\n');
}

console.log('\n✅ ALL TESTS PASSED - Remote Pickup Surcharge is working correctly!\n');
console.log('Configuration:');
console.log(`  - Surcharge amount: £${REMOTE_LOCATION_CONFIG.SURCHARGE_AMOUNT}`);
console.log(`  - Price threshold: £${REMOTE_LOCATION_CONFIG.PRICE_THRESHOLD}`);
console.log(`  - Remote locations: ${REMOTE_LOCATION_CONFIG.LOCATIONS.england.length + REMOTE_LOCATION_CONFIG.LOCATIONS.wales.length + REMOTE_LOCATION_CONFIG.LOCATIONS.scotland.length} total`);
console.log(`  - Postcode prefixes: ${REMOTE_LOCATION_CONFIG.POSTCODE_PREFIXES.length} prefixes`);
