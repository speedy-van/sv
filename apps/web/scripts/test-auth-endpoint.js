/**
 * Test the authentication endpoint
 */

const testUrl = 'http://localhost:3000/api/auth/test';
const credentials = {
  email: 'ahmadalwakai76@gmail.com',
  password: 'Aa234311Aa@@@',
};

console.log('🧪 Testing authentication endpoint...');
console.log('📍 URL:', testUrl);
console.log('📧 Email:', credentials.email);
console.log('🔑 Password:', credentials.password);
console.log('');

fetch(testUrl, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(credentials),
})
  .then(response => {
    console.log('📡 Response status:', response.status, response.statusText);
    return response.json();
  })
  .then(data => {
    console.log('📦 Response data:', JSON.stringify(data, null, 2));
    
    if (data.success) {
      console.log('\n✅ Authentication test PASSED!');
      console.log('👤 User:', data.user);
    } else {
      console.log('\n❌ Authentication test FAILED!');
      console.log('⚠️ Error:', data.error);
    }
  })
  .catch(error => {
    console.error('\n❌ Request failed:', error.message);
  });
