// Quick fix script - Run this in browser console o// Auto-fix the booking
console.log('🔧 Fixing booking SVMG3YFW3DLUPQ automatically...');
fixBookingPayment();dmin page
async function fixBookingPayment() {
  try {
    console.log('🔧 Attempting to fix booking SVMG3YFW3DLUPQ...');
    
    const response = await fetch('/api/admin/orders/SVMG3YFW3DLUPQ/confirm-payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();
    
    if (response.ok && result.success) {
      console.log('✅ SUCCESS! Booking fixed:', result);
      console.log('📋 Booking Details:');
      console.log('   Reference:', result.booking.reference);
      console.log('   Status:', result.booking.previousStatus, '→', result.booking.status);
      console.log('   Paid At:', result.booking.paidAt);
      console.log('');
      console.log('🚛 Next Steps:');
      result.nextSteps?.forEach((step, index) => {
        console.log(`   ${index + 1}. ${step}`);
      });
      
      alert('✅ Booking SVMG3YFW3DLUPQ has been fixed! It should now appear in driver jobs.');
      
      // Refresh the page to see updated status
      if (confirm('Refresh page to see updated status?')) {
        window.location.reload();
      }
      
      return result;
    } else {
      console.error('❌ FAILED:', result);
      alert('❌ Failed to fix booking: ' + (result.error || 'Unknown error'));
      return null;
    }
  } catch (error) {
    console.error('❌ ERROR:', error);
    alert('❌ Error fixing booking: ' + error.message);
    return null;
  }
}

// Run the fix
console.log('🚀 Ready to fix booking SVMG3YFW3DLUPQ');
console.log('💡 Run: fixBookingPayment()');

// Auto-run if confirmed
if (confirm('Do you want to automatically fix booking SVMG3YFW3DLUPQ now?')) {
  fixBookingPayment();
}