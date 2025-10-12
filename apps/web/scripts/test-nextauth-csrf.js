/**
 * Test NextAuth signIn with proper CSRF handling
 */

async function testSignIn() {
  const baseUrl = 'http://localhost:3000';
  
  console.log('🧪 Testing NextAuth with CSRF...\n');
  
  // Step 1: Get CSRF token
  console.log('📋 Step 1: Getting CSRF token...');
  const csrfResponse = await fetch(`${baseUrl}/api/auth/csrf`);
  const csrfData = await csrfResponse.json();
  console.log('✅ CSRF Token:', csrfData.csrfToken);
  
  // Extract cookies
  const cookies = csrfResponse.headers.get('set-cookie');
  console.log('🍪 Cookies:', cookies);
  
  // Step 2: Sign in with CSRF token - TEST NEW USER
  console.log('\n🔐 Step 2: Signing in with NEW USER (deloalo99@gmail.com)...');
  const credentials = {
    email: 'deloalo99@gmail.com',  // NEW USER
    password: 'Aa234311Aa@@@',
    redirect: 'false',
    json: 'true',
    csrfToken: csrfData.csrfToken,
  };
  
  const formData = new URLSearchParams(credentials);
  
  const signInResponse = await fetch(`${baseUrl}/api/auth/callback/credentials`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cookie': cookies || '',
    },
    body: formData.toString(),
  });
  
  console.log('📡 Sign in response status:', signInResponse.status, signInResponse.statusText);
  
  const signInText = await signInResponse.text();
  console.log('📦 Response body:', signInText);
  
  try {
    const signInData = JSON.parse(signInText);
    console.log('📊 Parsed response:', JSON.stringify(signInData, null, 2));
    
    if (signInData.url && !signInData.url.includes('error')) {
      console.log('\n✅ Sign in SUCCESSFUL!');
    } else {
      console.log('\n❌ Sign in FAILED!');
    }
  } catch {
    console.log('⚠️ Response is not JSON');
  }
}

testSignIn().catch(error => {
  console.error('\n❌ Test failed:', error.message);
});
