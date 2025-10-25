#!/usr/bin/env node

/**
 * Test script for corrected Voodoo SMS implementation
 */

const API_KEY = 'fD9uItEwEhycokdFf0GhXg1fXZDzkqvGtu12c6phecAIEd';
const BASE_URL = 'https://api.voodoosms.com';

console.log('='.repeat(60));
console.log('VOODOO SMS - CORRECTED IMPLEMENTATION TEST');
console.log('='.repeat(60));
console.log(`API Key: ${API_KEY.substring(0, 15)}...${API_KEY.substring(API_KEY.length - 15)}`);
console.log(`Base URL: ${BASE_URL}`);
console.log('='.repeat(60));

async function testCredits() {
  console.log('\n[TEST 1] Checking Credits Balance...');
  
  try {
    const response = await fetch(`${BASE_URL}/credits`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
      },
    });

    console.log(`Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Credits: ${data.amount}`);
      return true;
    } else {
      const error = await response.text();
      console.log(`❌ Error: ${error}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Exception: ${error.message}`);
    return false;
  }
}

async function testSendSMS() {
  console.log('\n[TEST 2] Sending Test SMS (Sandbox Mode)...');
  
  const payload = {
    to: '447123456789',
    from: 'SpeedyVan',
    msg: 'Test from corrected Voodoo SMS implementation - Speedy Van',
    sandbox: true,
  };

  console.log('Payload:', JSON.stringify(payload, null, 2));

  try {
    const response = await fetch(`${BASE_URL}/sendsms`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    console.log(`Status: ${response.status} ${response.statusText}`);
    
    const responseText = await response.text();
    console.log('Response:', responseText);

    if (response.ok) {
      const data = JSON.parse(responseText);
      console.log('✅ SMS sent successfully!');
      console.log(`   Count: ${data.count}`);
      console.log(`   Credits: ${data.credits}`);
      console.log(`   Balance: ${data.balance}`);
      console.log(`   Status: ${data.messages[0].status}`);
      return true;
    } else {
      console.log(`❌ Failed to send SMS`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Exception: ${error.message}`);
    return false;
  }
}

async function testPhoneNormalization() {
  console.log('\n[TEST 3] Phone Number Normalization...');
  
  const testCases = [
    { input: '07123456789', expected: '447123456789' },
    { input: '+447123456789', expected: '447123456789' },
    { input: '00447123456789', expected: '447123456789' },
    { input: '447123456789', expected: '447123456789' },
    { input: '01202 129 746', expected: '441202129746' },
  ];

  function normalizePhoneNumber(phone) {
    let cleaned = phone.replace(/[\s\-\(\)]/g, '');

    if (cleaned.startsWith('+44')) {
      cleaned = cleaned.substring(1);
    } else if (cleaned.startsWith('0044')) {
      cleaned = '44' + cleaned.substring(4);
    } else if (cleaned.startsWith('0') && !cleaned.startsWith('00')) {
      cleaned = '44' + cleaned.substring(1);
    } else if (!cleaned.startsWith('44')) {
      cleaned = '44' + cleaned;
    }

    return cleaned;
  }

  let allPassed = true;
  testCases.forEach(({ input, expected }) => {
    const result = normalizePhoneNumber(input);
    const passed = result === expected;
    console.log(`  ${passed ? '✅' : '❌'} ${input} → ${result} ${passed ? '' : `(expected ${expected})`}`);
    if (!passed) allPassed = false;
  });

  return allPassed;
}

async function main() {
  const results = {
    credits: await testCredits(),
    sendSMS: await testSendSMS(),
    phoneNorm: testPhoneNormalization(),
  };

  console.log('\n' + '='.repeat(60));
  console.log('FINAL RESULTS');
  console.log('='.repeat(60));
  console.log(`Credits Check:        ${results.credits ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Send SMS:             ${results.sendSMS ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Phone Normalization:  ${results.phoneNorm ? '✅ PASS' : '❌ FAIL'}`);
  console.log('='.repeat(60));

  const allPassed = Object.values(results).every(r => r);
  
  if (allPassed) {
    console.log('\n🎉 ALL TESTS PASSED! The corrected implementation is working perfectly.');
    console.log('\nNext steps:');
    console.log('1. Review the changes in VoodooSMSService.ts');
    console.log('2. Commit and push the changes to your repository');
    console.log('3. Deploy to production');
  } else {
    console.log('\n⚠️  Some tests failed. Please review the errors above.');
  }

  console.log('='.repeat(60));
}

main().catch(console.error);

