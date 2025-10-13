// Test Earnings API for demo account

const DATABASE_URL = 'postgresql://neondb_owner:npg_qNFE0IHpk1vT@ep-dry-glitter-aftvvy9d-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

async function testEarningsAPI() {
  try {
    console.log('🧪 Testing Earnings API...\n');
    
    // Step 1: Login to get token
    console.log('Step 1: Login with demo account');
    const loginResponse = await fetch('https://speedy-van.co.uk/api/driver/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'zadfad41@gmail.com',
        password: '112233'
      })
    });

    const loginData = await loginResponse.json();
    console.log('Login status:', loginResponse.status);
    console.log('Login success:', loginData.success);
    
    if (!loginData.success || !loginData.token) {
      console.error('❌ Login failed:', loginData);
      return;
    }
    
    const token = loginData.token;
    console.log('✅ Token received:', token.substring(0, 30) + '...\n');
    
    // Step 2: Test earnings endpoint
    console.log('Step 2: Fetch earnings with Bearer token');
    const earningsResponse = await fetch('https://speedy-van.co.uk/api/driver/earnings?period=week', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('Earnings status:', earningsResponse.status);
    console.log('Earnings status text:', earningsResponse.statusText);
    
    const earningsData = await earningsResponse.json();
    console.log('Earnings response:', JSON.stringify(earningsData, null, 2));
    
    if (earningsData.success) {
      console.log('\n✅ Earnings API works!');
      console.log('Total jobs:', earningsData.data?.summary?.totalJobs);
      console.log('Total earnings:', earningsData.data?.summary?.totalEarnings);
      console.log('Earnings count:', earningsData.data?.earnings?.length || 0);
    } else {
      console.error('\n❌ Earnings API failed:', earningsData);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Error details:', error);
  }
}

testEarningsAPI();

