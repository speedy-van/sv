/**
 * Test NextAuth signIn directly
 */

const testUrl = 'http://localhost:3000/api/auth/callback/credentials';
const credentials = {
  email: 'ahmadalwakai76@gmail.com',
  password: 'Aa234311Aa@@@',
  redirect: 'false',
  json: 'true',
};

// Create URLSearchParams for form data
const formData = new URLSearchParams(credentials);

console.log('🧪 Testing NextAuth callback endpoint...');
console.log('📍 URL:', testUrl);
console.log('📧 Email:', credentials.email);
console.log('🔑 Password:', credentials.password);
console.log('');

fetch(testUrl, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
  },
  body: formData.toString(),
})
  .then(response => {
    console.log('📡 Response status:', response.status, response.statusText);
    console.log('📋 Response headers:');
    response.headers.forEach((value, key) => {
      console.log(`  ${key}: ${value}`);
    });
    return response.text();
  })
  .then(text => {
    console.log('📦 Response body:', text);
    
    try {
      const data = JSON.parse(text);
      console.log('📊 Parsed JSON:', JSON.stringify(data, null, 2));
    } catch {
      console.log('⚠️ Response is not JSON');
    }
  })
  .catch(error => {
    console.error('\n❌ Request failed:', error.message);
  });
