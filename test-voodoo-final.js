/**
 * Voodoo SMS - Final Test with Correct Endpoint
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read API key
const envContent = readFileSync(join(__dirname, '.env.local'), 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  line = line.trim();
  if (line && !line.startsWith('#')) {
    const equalIndex = line.indexOf('=');
    if (equalIndex > 0) {
      const key = line.substring(0, equalIndex).trim();
      const value = line.substring(equalIndex + 1).trim();
      env[key] = value;
    }
  }
});

const apiKey = env.VOODOO_SMS_API_KEY;

if (!apiKey) {
  console.log('❌ VOODOO_SMS_API_KEY not found in .env.local');
  process.exit(1);
}

console.log('='.repeat(80));
console.log('VOODOO SMS - FINAL TEST (CORRECT ENDPOINT)');
console.log('='.repeat(80));
console.log('');
console.log('API Key:', apiKey.substring(0, 20) + '...');
console.log('Endpoint: https://www.voodoosms.com/vapi/server/sendSMS');
console.log('');

const testNumber = '00447901846297';
const testMessage = 'Test SMS from Speedy Van via Voodoo SMS';

const payload = {
  uid: apiKey,
  to: testNumber,
  message: testMessage,
  from: 'SpeedyVan',
};

console.log('REQUEST PAYLOAD:');
console.log(JSON.stringify(payload, null, 2));
console.log('');
console.log('Sending request...');
console.log('');

try {
  const response = await fetch('https://www.voodoosms.com/vapi/server/sendSMS', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  console.log('=== RESPONSE ===');
  console.log('Status:', response.status);
  console.log('Status Text:', response.statusText);
  console.log('');

  const responseText = await response.text();
  console.log('Response Body:');
  console.log(responseText);
  console.log('');

  let result;
  try {
    result = JSON.parse(responseText);
    console.log('Parsed JSON:');
    console.log(JSON.stringify(result, null, 2));
  } catch {
    console.log('(Response is not JSON)');
  }

  console.log('');
  console.log('='.repeat(80));
  
  if (response.ok) {
    console.log('✅ SUCCESS - SMS SENT VIA VOODOO SMS!');
    console.log('='.repeat(80));
    console.log('');
    console.log('Message ID:', result?.id || result?.messageId || 'N/A');
    console.log('Destination:', testNumber);
    console.log('');
    console.log('📱 CHECK PHONE FOR SMS DELIVERY');
    console.log('');
  } else {
    console.log('❌ FAILED - STATUS', response.status);
    console.log('='.repeat(80));
    console.log('');
    console.log('Possible issues:');
    console.log('  1. Invalid API key');
    console.log('  2. Insufficient credits (error code 21)');
    console.log('  3. Invalid phone number');
    console.log('  4. Invalid sender ID (error code 26)');
    console.log('');
    console.log('Check Voodoo SMS dashboard: https://www.voodoosms.com');
    console.log('');
  }

} catch (error) {
  console.log('='.repeat(80));
  console.log('❌ FATAL ERROR');
  console.log('='.repeat(80));
  console.error(error);
}

console.log('='.repeat(80));
console.log('TEST COMPLETE');
console.log('='.repeat(80));


