import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkSpecificJob() {
  const jobId = 'cmi3ev899000zw2eghv2sy1eq';
  
  console.log(`\n🔍 Checking Job: ${jobId}\n`);
  console.log('='.repeat(80));
  
  const job = await prisma.booking.findUnique({
    where: { id: jobId },
    include: {
      Assignment: {
        include: {
          Driver: {
            include: {
              User: { select: { id: true, name: true, email: true } }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      },
      driver: {
        include: {
          User: { select: { id: true, name: true, email: true } }
        }
      }
    }
  });

  if (!job) {
    console.log('❌ Job not found\n');
    await prisma.$disconnect();
    return;
  }

  console.log(`\n📦 Job Details:`);
  console.log(`   ID: ${job.id}`);
  console.log(`   Reference: ${job.reference}`);
  console.log(`   Status: ${job.status}`);
  console.log(`   Scheduled: ${job.scheduledAt}`);
  console.log(`   Customer: ${job.customerName}`);

  console.log(`\n👤 Booking.driverId: ${job.driverId || 'null'}`);
  if (job.driver) {
    console.log(`   Driver: ${job.driver.User.name} (${job.driver.User.email})`);
    console.log(`   Driver ID: ${job.driver.id}`);
  }

  console.log(`\n📋 Assignments: ${job.Assignment.length}`);
  if (job.Assignment.length > 0) {
    job.Assignment.forEach((a, i) => {
      const icon = a.status === 'accepted' ? '✅' :
                   a.status === 'invited' ? '📧' :
                   a.status === 'claimed' ? '🤚' :
                   a.status === 'declined' ? '❌' :
                   a.status === 'cancelled' ? '🚫' :
                   a.status === 'completed' ? '🏁' : '❓';
      
      console.log(`   ${i + 1}. ${icon} ${a.status.toUpperCase()}`);
      console.log(`      Driver: ${a.Driver?.User?.name || 'Unknown'} (${a.Driver?.User?.email || 'N/A'})`);
      console.log(`      Driver ID: ${a.driverId}`);
      console.log(`      Created: ${a.createdAt}`);
      console.log(`      Updated: ${a.updatedAt}`);
      if (a.expiresAt) console.log(`      Expires: ${a.expiresAt}`);
      console.log('');
    });
  }

  // Check if job would appear as "available" with NEW logic
  const activeAssignments = job.Assignment.filter(
    a => ['invited', 'claimed', 'accepted'].includes(a.status)
  );

  const wouldBeAvailable_NEW = 
    job.status === 'CONFIRMED' &&
    job.driverId === null &&
    activeAssignments.length === 0 &&
    job.scheduledAt >= new Date();

  // Check with OLD logic (before fix)
  const wouldBeAvailable_OLD =
    job.status === 'CONFIRMED' &&
    job.driverId === null &&
    job.Assignment.length === 0 &&
    job.scheduledAt >= new Date();

  console.log(`\n🔬 Analysis:`);
  console.log(`   Active Assignments: ${activeAssignments.length}`);
  console.log(`   Total Assignments: ${job.Assignment.length}`);
  console.log('');
  console.log(`   📊 Would appear as "Available" (OLD logic): ${wouldBeAvailable_OLD ? '✅ YES' : '❌ NO'}`);
  console.log(`   📊 Would appear as "Available" (NEW logic): ${wouldBeAvailable_NEW ? '✅ YES' : '❌ NO'}`);
  console.log('');

  if (wouldBeAvailable_NEW) {
    console.log(`   🎯 Visibility: ALL drivers (Available Jobs list)`);
  } else if (activeAssignments.length > 0) {
    const driverNames = activeAssignments.map(a => a.Driver?.User?.name || 'Unknown').join(', ');
    console.log(`   🎯 Visibility: ${driverNames} ONLY (Assigned Jobs list)`);
  } else {
    console.log(`   ⚠️  Visibility: HIDDEN from all (past job or completed)`);
  }

  // Check Fadi Younes
  console.log(`\n🔍 Checking Fadi Younes (sami.justeat@gmail.com):`);
  const fadi = await prisma.driver.findFirst({
    where: {
      User: {
        email: 'sami.justeat@gmail.com'
      }
    },
    include: {
      User: { select: { id: true, name: true, email: true } }
    }
  });

  if (fadi) {
    console.log(`   Driver ID: ${fadi.id}`);
    console.log(`   User ID: ${fadi.User.id}`);
    console.log(`   Name: ${fadi.User.name}`);
    
    const fadiAssignment = job.Assignment.find(a => a.driverId === fadi.id);
    const isAssignedToFadi = job.driverId === fadi.id || !!fadiAssignment;
    
    console.log('');
    console.log(`   Is assigned to this job? ${isAssignedToFadi ? '✅ YES' : '❌ NO'}`);
    if (fadiAssignment) {
      console.log(`   Assignment status: ${fadiAssignment.status}`);
    }
    
    console.log('');
    if (wouldBeAvailable_NEW && !isAssignedToFadi) {
      console.log(`   ✅ Can see in "Available Jobs" list`);
      console.log(`   ✅ Can view job details`);
      console.log(`   ❌ Cannot update progress (not assigned)`);
    } else if (isAssignedToFadi && fadiAssignment && ['invited', 'accepted'].includes(fadiAssignment.status)) {
      console.log(`   ✅ Can see in "Assigned Jobs" list`);
      console.log(`   ✅ Can view job details`);
      console.log(`   ${fadiAssignment.status === 'accepted' ? '✅' : '⚠️'} ${fadiAssignment.status === 'accepted' ? 'Can update progress' : 'Must accept first'}`);
    } else {
      console.log(`   ❌ Cannot see this job`);
    }
  }

  console.log('\n' + '='.repeat(80) + '\n');

  await prisma.$disconnect();
}

checkSpecificJob().catch(console.error);
