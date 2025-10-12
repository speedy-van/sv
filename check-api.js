async function checkBookingViaAPI() {
  try {
    // Check admin dashboard to see unassigned bookings
    const adminResponse = await fetch('http://localhost:3001/api/admin/dashboard-enhanced');
    const adminData = await adminResponse.json();
    
    console.log('📊 Admin Dashboard - Unassigned Bookings Count:', adminData.unassignedBookings?.length || 0);
    
    if (adminData.unassignedBookings && adminData.unassignedBookings.length > 0) {
      console.log('📋 Recent Unassigned Bookings:');
      adminData.unassignedBookings.slice(0, 5).forEach((booking, index) => {
        console.log(`  ${index + 1}. ${booking.reference} - ${booking.customer} - Status: ${booking.status || 'N/A'}`);
      });
      
      // Check if our booking is in the list
      const ourBooking = adminData.unassignedBookings.find(b => b.reference === 'SVMG3YFW3DLUPQ');
      if (ourBooking) {
        console.log('✅ Found our booking in unassigned list:', ourBooking);
      } else {
        console.log('❌ Our booking SVMG3YFW3DLUPQ is NOT in unassigned list');
      }
    }

    // Check driver dashboard for available jobs
    const driverResponse = await fetch('http://localhost:3001/api/driver/dashboard');
    if (driverResponse.ok) {
      const driverData = await driverResponse.json();
      console.log('\n🚛 Driver Dashboard - Available Jobs Count:', driverData.availableJobs?.length || 0);
      
      if (driverData.availableJobs && driverData.availableJobs.length > 0) {
        console.log('📋 Available Jobs for Drivers:');
        driverData.availableJobs.forEach((job, index) => {
          console.log(`  ${index + 1}. ID: ${job.id} - Customer: ${job.customer} - Status: ${job.status || 'N/A'}`);
        });
      }
    } else {
      console.log('⚠️ Driver dashboard requires authentication, status:', driverResponse.status);
    }

  } catch (error) {
    console.error('❌ Error checking booking via API:', error);
  }
}

checkBookingViaAPI();