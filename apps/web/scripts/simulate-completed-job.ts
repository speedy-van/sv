// This script simulates a completed job by directly calling the API endpoints
// Run this after the server is running

const API_BASE = 'http://localhost:3000';

async function simulateCompletedJob() {
  try {
    console.log('🚀 Simulating completed job...');

    // First, let's check if there are any existing jobs
    const jobsResponse = await fetch(`${API_BASE}/api/driver/jobs/my-jobs`);
    const jobsData = await jobsResponse.json();
    
    if (jobsData.success && jobsData.data.length > 0) {
      console.log('📋 Found existing jobs:', jobsData.data.length);
      
      // Get the first job
      const job = jobsData.data[0];
      console.log('🎯 Using job:', job.bookingReference);
      
      // Simulate completing all steps
      const steps = [
        'navigate_to_pickup',
        'arrived_at_pickup', 
        'loading_started',
        'loading_completed',
        'en_route_to_dropoff',
        'arrived_at_dropoff',
        'unloading_started',
        'unloading_completed',
        'job_completed'
      ];
      
      for (const step of steps) {
        try {
          const response = await fetch(`${API_BASE}/api/driver/jobs/${job.id}/update-step`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              step: step,
              notes: `Simulated ${step} step`,
              payload: {
                timestamp: new Date().toISOString(),
                simulated: true
              }
            })
          });
          
          const result = await response.json();
          if (result.success) {
            console.log(`✅ Completed step: ${step}`);
          } else {
            console.log(`⚠️ Step ${step} failed:`, result.error);
          }
        } catch (error) {
          console.log(`❌ Error completing step ${step}:`, error);
        }
      }
      
      console.log('🎉 Job simulation completed!');
      console.log('💡 Now check the driver earnings page to see the results.');
      
    } else {
      console.log('❌ No jobs found. Please create a job first.');
      console.log('💡 You can create a job through the admin panel or customer booking flow.');
    }
    
  } catch (error) {
    console.error('❌ Error simulating job:', error);
  }
}

simulateCompletedJob();
