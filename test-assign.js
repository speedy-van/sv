import fetch from 'node-fetch';

async function testAssignDriver() {
  const response = await fetch('http://localhost:3000/api/admin/orders/SVMG51MMNI2CRI/assign-driver', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // Add auth headers if needed
    },
    body: JSON.stringify({
      driverId: 'driver_cmgec92800000w2ywm70h5vbs_1760056772925',
      reason: 'Test assignment'
    })
  });

  console.log('Status:', response.status);
  const data = await response.json();
  console.log('Response:', data);
}

testAssignDriver().catch(console.error);