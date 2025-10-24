/**
 * Test SMS API directly
 */

const response = await fetch('http://localhost:3000/api/admin/sms/send', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    to: '00441202129746',
    message: 'Test message',
  }),
});

console.log('Status:', response.status);
const text = await response.text();
console.log('Response:', text);