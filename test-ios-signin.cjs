#!/usr/bin/env node

/**
 * iOS Driver App Sign-In Test Runner
 * Comprehensive testing of authentication functionality
 */

const https = require('https');
const http = require('http');

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'https://speedy-van-web.onrender.com';
const TEST_EMAIL = 'zadfad41@gmail.com';
const TEST_PASSWORD = '112233';

// Test results tracking
const results = {
  passed: 0,
  failed: 0,
  tests: []
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// HTTP request helper
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const protocol = urlObj.protocol === 'https:' ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    const req = protocol.request(requestOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: jsonData
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

// Test functions
async function test1_ValidLogin() {
  log('\n🧪 Test 1: Valid Login', 'cyan');
  
  try {
    const response = await makeRequest(`${API_BASE_URL}/api/driver/auth/login`, {
      method: 'POST',
      body: {
        email: TEST_EMAIL,
        password: TEST_PASSWORD
      }
    });

    log(`📡 Response Status: ${response.status}`, 'blue');
    log(`📦 Response: ${JSON.stringify(response.data, null, 2)}`, 'blue');

    const assertions = [
      { condition: response.data.success === true, message: 'Login should succeed' },
      { condition: response.data.token !== undefined, message: 'Should receive token' },
      { condition: response.data.user !== undefined, message: 'Should receive user data' },
      { condition: response.data.driver !== undefined, message: 'Should receive driver data' },
      { condition: response.data.error === undefined, message: 'Should not have error' }
    ];

    let passed = true;
    for (const assertion of assertions) {
      if (!assertion.condition) {
        log(`  ❌ ${assertion.message}`, 'red');
        passed = false;
      } else {
        log(`  ✓ ${assertion.message}`, 'green');
      }
    }

    if (passed) {
      log('✅ Test 1 PASSED', 'green');
      results.passed++;
      results.tests.push({ name: 'Valid Login', status: 'PASSED' });
      return response.data.token;
    } else {
      log('❌ Test 1 FAILED', 'red');
      results.failed++;
      results.tests.push({ name: 'Valid Login', status: 'FAILED' });
      return null;
    }
  } catch (error) {
    log(`❌ Test 1 FAILED: ${error.message}`, 'red');
    results.failed++;
    results.tests.push({ name: 'Valid Login', status: 'FAILED', error: error.message });
    return null;
  }
}

async function test2_InvalidEmail() {
  log('\n🧪 Test 2: Invalid Email', 'cyan');
  
  try {
    const response = await makeRequest(`${API_BASE_URL}/api/driver/auth/login`, {
      method: 'POST',
      body: {
        email: 'nonexistent@test.com',
        password: TEST_PASSWORD
      }
    });

    log(`📡 Response Status: ${response.status}`, 'blue');
    log(`📦 Response: ${JSON.stringify(response.data, null, 2)}`, 'blue');

    const assertions = [
      { condition: response.data.success === false, message: 'Login should fail' },
      { condition: response.data.token === undefined, message: 'Should not receive token' },
      { condition: response.data.error !== undefined, message: 'Should have error message' }
    ];

    let passed = true;
    for (const assertion of assertions) {
      if (!assertion.condition) {
        log(`  ❌ ${assertion.message}`, 'red');
        passed = false;
      } else {
        log(`  ✓ ${assertion.message}`, 'green');
      }
    }

    if (passed) {
      log('✅ Test 2 PASSED', 'green');
      results.passed++;
      results.tests.push({ name: 'Invalid Email', status: 'PASSED' });
    } else {
      log('❌ Test 2 FAILED', 'red');
      results.failed++;
      results.tests.push({ name: 'Invalid Email', status: 'FAILED' });
    }
  } catch (error) {
    log(`❌ Test 2 FAILED: ${error.message}`, 'red');
    results.failed++;
    results.tests.push({ name: 'Invalid Email', status: 'FAILED', error: error.message });
  }
}

async function test3_InvalidPassword() {
  log('\n🧪 Test 3: Invalid Password', 'cyan');
  
  try {
    const response = await makeRequest(`${API_BASE_URL}/api/driver/auth/login`, {
      method: 'POST',
      body: {
        email: TEST_EMAIL,
        password: 'wrongpassword'
      }
    });

    log(`📡 Response Status: ${response.status}`, 'blue');
    log(`📦 Response: ${JSON.stringify(response.data, null, 2)}`, 'blue');

    const assertions = [
      { condition: response.data.success === false, message: 'Login should fail' },
      { condition: response.data.token === undefined, message: 'Should not receive token' },
      { condition: response.data.error !== undefined, message: 'Should have error message' }
    ];

    let passed = true;
    for (const assertion of assertions) {
      if (!assertion.condition) {
        log(`  ❌ ${assertion.message}`, 'red');
        passed = false;
      } else {
        log(`  ✓ ${assertion.message}`, 'green');
      }
    }

    if (passed) {
      log('✅ Test 3 PASSED', 'green');
      results.passed++;
      results.tests.push({ name: 'Invalid Password', status: 'PASSED' });
    } else {
      log('❌ Test 3 FAILED', 'red');
      results.failed++;
      results.tests.push({ name: 'Invalid Password', status: 'FAILED' });
    }
  } catch (error) {
    log(`❌ Test 3 FAILED: ${error.message}`, 'red');
    results.failed++;
    results.tests.push({ name: 'Invalid Password', status: 'FAILED', error: error.message });
  }
}

async function test4_EmptyEmail() {
  log('\n🧪 Test 4: Empty Email', 'cyan');
  
  try {
    const response = await makeRequest(`${API_BASE_URL}/api/driver/auth/login`, {
      method: 'POST',
      body: {
        email: '',
        password: TEST_PASSWORD
      }
    });

    log(`📡 Response Status: ${response.status}`, 'blue');
    log(`📦 Response: ${JSON.stringify(response.data, null, 2)}`, 'blue');

    const assertions = [
      { condition: response.data.success === false, message: 'Login should fail' },
      { condition: response.data.error !== undefined, message: 'Should have error message' }
    ];

    let passed = true;
    for (const assertion of assertions) {
      if (!assertion.condition) {
        log(`  ❌ ${assertion.message}`, 'red');
        passed = false;
      } else {
        log(`  ✓ ${assertion.message}`, 'green');
      }
    }

    if (passed) {
      log('✅ Test 4 PASSED', 'green');
      results.passed++;
      results.tests.push({ name: 'Empty Email', status: 'PASSED' });
    } else {
      log('❌ Test 4 FAILED', 'red');
      results.failed++;
      results.tests.push({ name: 'Empty Email', status: 'FAILED' });
    }
  } catch (error) {
    log(`❌ Test 4 FAILED: ${error.message}`, 'red');
    results.failed++;
    results.tests.push({ name: 'Empty Email', status: 'FAILED', error: error.message });
  }
}

async function test5_EmptyPassword() {
  log('\n🧪 Test 5: Empty Password', 'cyan');
  
  try {
    const response = await makeRequest(`${API_BASE_URL}/api/driver/auth/login`, {
      method: 'POST',
      body: {
        email: TEST_EMAIL,
        password: ''
      }
    });

    log(`📡 Response Status: ${response.status}`, 'blue');
    log(`📦 Response: ${JSON.stringify(response.data, null, 2)}`, 'blue');

    const assertions = [
      { condition: response.data.success === false, message: 'Login should fail' },
      { condition: response.data.error !== undefined, message: 'Should have error message' }
    ];

    let passed = true;
    for (const assertion of assertions) {
      if (!assertion.condition) {
        log(`  ❌ ${assertion.message}`, 'red');
        passed = false;
      } else {
        log(`  ✓ ${assertion.message}`, 'green');
      }
    }

    if (passed) {
      log('✅ Test 5 PASSED', 'green');
      results.passed++;
      results.tests.push({ name: 'Empty Password', status: 'PASSED' });
    } else {
      log('❌ Test 5 FAILED', 'red');
      results.failed++;
      results.tests.push({ name: 'Empty Password', status: 'FAILED' });
    }
  } catch (error) {
    log(`❌ Test 5 FAILED: ${error.message}`, 'red');
    results.failed++;
    results.tests.push({ name: 'Empty Password', status: 'FAILED', error: error.message });
  }
}

async function test6_SessionValidation(token) {
  log('\n🧪 Test 6: Session Validation', 'cyan');
  
  if (!token) {
    log('⚠️  Skipping test - no valid token from previous test', 'yellow');
    results.tests.push({ name: 'Session Validation', status: 'SKIPPED' });
    return;
  }
  
  try {
    const response = await makeRequest(`${API_BASE_URL}/api/driver/session`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    log(`📡 Response Status: ${response.status}`, 'blue');
    log(`📦 Response: ${JSON.stringify(response.data, null, 2)}`, 'blue');

    const assertions = [
      { condition: response.data.isAuthenticated === true, message: 'Should be authenticated' },
      { condition: response.data.user !== undefined, message: 'Should receive user data' },
      { condition: response.data.driver !== undefined, message: 'Should receive driver data' }
    ];

    let passed = true;
    for (const assertion of assertions) {
      if (!assertion.condition) {
        log(`  ❌ ${assertion.message}`, 'red');
        passed = false;
      } else {
        log(`  ✓ ${assertion.message}`, 'green');
      }
    }

    if (passed) {
      log('✅ Test 6 PASSED', 'green');
      results.passed++;
      results.tests.push({ name: 'Session Validation', status: 'PASSED' });
    } else {
      log('❌ Test 6 FAILED', 'red');
      results.failed++;
      results.tests.push({ name: 'Session Validation', status: 'FAILED' });
    }
  } catch (error) {
    log(`❌ Test 6 FAILED: ${error.message}`, 'red');
    results.failed++;
    results.tests.push({ name: 'Session Validation', status: 'FAILED', error: error.message });
  }
}

async function test7_InvalidTokenSession() {
  log('\n🧪 Test 7: Invalid Token Session', 'cyan');
  
  try {
    const response = await makeRequest(`${API_BASE_URL}/api/driver/session`, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer invalid.token.here'
      }
    });

    log(`📡 Response Status: ${response.status}`, 'blue');
    log(`📦 Response: ${JSON.stringify(response.data, null, 2)}`, 'blue');

    const assertions = [
      { condition: response.data.isAuthenticated === false, message: 'Should not be authenticated' }
    ];

    let passed = true;
    for (const assertion of assertions) {
      if (!assertion.condition) {
        log(`  ❌ ${assertion.message}`, 'red');
        passed = false;
      } else {
        log(`  ✓ ${assertion.message}`, 'green');
      }
    }

    if (passed) {
      log('✅ Test 7 PASSED', 'green');
      results.passed++;
      results.tests.push({ name: 'Invalid Token Session', status: 'PASSED' });
    } else {
      log('❌ Test 7 FAILED', 'red');
      results.failed++;
      results.tests.push({ name: 'Invalid Token Session', status: 'FAILED' });
    }
  } catch (error) {
    log(`❌ Test 7 FAILED: ${error.message}`, 'red');
    results.failed++;
    results.tests.push({ name: 'Invalid Token Session', status: 'FAILED', error: error.message });
  }
}

// Main test runner
async function runTests() {
  log('═══════════════════════════════════════════════════════', 'cyan');
  log('  iOS Driver App - Sign-In Functionality Test Suite', 'cyan');
  log('═══════════════════════════════════════════════════════', 'cyan');
  log(`\n🔧 API Base URL: ${API_BASE_URL}`, 'blue');
  log(`📧 Test Email: ${TEST_EMAIL}`, 'blue');
  log(`🔑 Test Password: ${TEST_PASSWORD}`, 'blue');
  
  const startTime = Date.now();
  
  // Run all tests
  const token = await test1_ValidLogin();
  await test2_InvalidEmail();
  await test3_InvalidPassword();
  await test4_EmptyEmail();
  await test5_EmptyPassword();
  await test6_SessionValidation(token);
  await test7_InvalidTokenSession();
  
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  
  // Print summary
  log('\n═══════════════════════════════════════════════════════', 'cyan');
  log('  Test Summary', 'cyan');
  log('═══════════════════════════════════════════════════════', 'cyan');
  
  log(`\n✅ Passed: ${results.passed}`, 'green');
  log(`❌ Failed: ${results.failed}`, 'red');
  log(`⏱️  Duration: ${duration}s`, 'blue');
  
  log('\n📊 Detailed Results:', 'cyan');
  results.tests.forEach((test, index) => {
    const icon = test.status === 'PASSED' ? '✅' : test.status === 'SKIPPED' ? '⚠️' : '❌';
    const color = test.status === 'PASSED' ? 'green' : test.status === 'SKIPPED' ? 'yellow' : 'red';
    log(`  ${index + 1}. ${icon} ${test.name} - ${test.status}`, color);
    if (test.error) {
      log(`     Error: ${test.error}`, 'red');
    }
  });
  
  log('\n═══════════════════════════════════════════════════════', 'cyan');
  
  // Exit with appropriate code
  process.exit(results.failed > 0 ? 1 : 0);
}

// Run the tests
runTests().catch((error) => {
  log(`\n❌ Fatal Error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});

