import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkJobAssignments() {
  console.log('\n🔍 Checking All Jobs Assignment Status\n');
  console.log('=' .repeat(80));
  
  // Get all CONFIRMED jobs
  const jobs = await prisma.booking.findMany({
    where: {
      status: 'CONFIRMED',
      scheduledAt: {
        gte: new Date()
      }
    },
    include: {
      Assignment: {
        include: {
          Driver: {
            include: {
              User: { select: { name: true, email: true } }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      },
      driver: {
        include: {
          User: { select: { name: true, email: true } }
        }
      }
    },
    orderBy: { scheduledAt: 'asc' },
    take: 20
  });

  console.log(`\nFound ${jobs.length} CONFIRMED future jobs\n`);

  for (const job of jobs) {
    const activeAssignments = job.Assignment.filter(
      a => ['invited', 'claimed', 'accepted'].includes(a.status)
    );

    const isAvailable = 
      job.driverId === null &&
      activeAssignments.length === 0;

    const status = isAvailable ? '🟢 AVAILABLE' :
                   activeAssignments.length > 0 ? '🔵 ASSIGNED' :
                   '⚪ OTHER';

    console.log(`${status} | ${job.reference} | ${job.scheduledAt.toISOString().split('T')[0]}`);
    console.log(`   Booking.driverId: ${job.driverId || 'null'} ${job.driver ? `(${job.driver.User.name})` : ''}`);
    
    if (job.Assignment.length > 0) {
      console.log(`   Assignments (${job.Assignment.length}):`);
      job.Assignment.forEach((a, i) => {
        const icon = a.status === 'accepted' ? '✅' :
                     a.status === 'invited' ? '📧' :
                     a.status === 'claimed' ? '🤚' :
                     a.status === 'declined' ? '❌' :
                     a.status === 'cancelled' ? '🚫' : '❓';
        console.log(`      ${i + 1}. ${icon} ${a.status.toUpperCase()} - ${a.Driver?.User?.name || 'Unknown'} (${a.Driver?.User?.email || 'N/A'})`);
      });
    } else {
      console.log(`   Assignments: None`);
    }
    
    if (isAvailable) {
      console.log(`   🎯 VISIBLE TO: All drivers (Available Jobs)`);
    } else if (activeAssignments.length > 0) {
      const assignedDrivers = activeAssignments.map(a => a.Driver?.User?.name || 'Unknown').join(', ');
      console.log(`   🎯 VISIBLE TO: ${assignedDrivers} only (Assigned Jobs)`);
    } else {
      console.log(`   ⚠️  WARNING: Job may be in inconsistent state!`);
    }
    
    console.log('');
  }

  // Check for potential issues
  console.log('\n' + '='.repeat(80));
  console.log('🔎 Checking for Potential Issues:\n');
  
  const issuesFound = [];

  // Issue 1: Jobs with driverId but no active assignment
  const orphanedJobs = jobs.filter(
    j => j.driverId !== null && 
         !j.Assignment.some(a => ['invited', 'claimed', 'accepted'].includes(a.status))
  );
  
  if (orphanedJobs.length > 0) {
    issuesFound.push({
      type: 'Orphaned Jobs',
      count: orphanedJobs.length,
      description: 'Jobs have Booking.driverId set but no active Assignment',
      jobs: orphanedJobs.map(j => ({ ref: j.reference, driverId: j.driverId }))
    });
  }

  // Issue 2: Jobs with active assignment but driverId null (expected if status=invited)
  const pendingJobs = jobs.filter(
    j => j.driverId === null &&
         j.Assignment.some(a => a.status === 'accepted')
  );
  
  if (pendingJobs.length > 0) {
    issuesFound.push({
      type: 'Accepted But Not Assigned',
      count: pendingJobs.length,
      description: 'Jobs have accepted Assignment but Booking.driverId is still null',
      jobs: pendingJobs.map(j => ({ 
        ref: j.reference, 
        acceptedBy: j.Assignment.find(a => a.status === 'accepted')?.Driver?.User?.name || 'Unknown'
      }))
    });
  }

  // Issue 3: Jobs with multiple active assignments (should not happen)
  const conflictedJobs = jobs.filter(
    j => j.Assignment.filter(a => ['invited', 'claimed', 'accepted'].includes(a.status)).length > 1
  );
  
  if (conflictedJobs.length > 0) {
    issuesFound.push({
      type: 'Multiple Active Assignments',
      count: conflictedJobs.length,
      description: 'Jobs have more than one active assignment (data corruption)',
      jobs: conflictedJobs.map(j => ({ 
        ref: j.reference,
        activeAssignments: j.Assignment
          .filter(a => ['invited', 'claimed', 'accepted'].includes(a.status))
          .map(a => `${a.Driver?.User?.name || 'Unknown'} (${a.status})`)
      }))
    });
  }

  if (issuesFound.length === 0) {
    console.log('✅ No issues found! All jobs are in correct state.\n');
  } else {
    console.log(`❌ Found ${issuesFound.length} issue(s):\n`);
    issuesFound.forEach((issue, i) => {
      console.log(`${i + 1}. ${issue.type} (${issue.count} jobs)`);
      console.log(`   ${issue.description}`);
      console.log(`   Jobs:`, JSON.stringify(issue.jobs, null, 2));
      console.log('');
    });
  }

  await prisma.$disconnect();
}

checkJobAssignments().catch(console.error);
