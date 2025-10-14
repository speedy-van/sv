/**
 * Automatic Route Creation Scheduler
 * Runs every 15 minutes to create optimized routes from pending drops
 */

import { prisma } from '@/lib/prisma';

interface SchedulerStats {
  lastRun: Date | null;
  totalRuns: number;
  routesCreated: number;
  dropsProcessed: number;
  errors: number;
}

class AutoRouteScheduler {
  private isRunningFlag = false; // Flag for single run in progress
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private stats: SchedulerStats = {
    lastRun: null,
    totalRuns: 0,
    routesCreated: 0,
    dropsProcessed: 0,
    errors: 0,
  };

  // Configuration
  private readonly INTERVAL_MS = 15 * 60 * 1000; // 15 minutes
  private readonly MAX_DROPS_PER_ROUTE = 10;
  private readonly MAX_DISTANCE_KM = 50;
  private readonly TIME_WINDOW_TOLERANCE_HOURS = 4;

  /**
   * Start the automatic scheduler
   */
  start() {
    if (this.intervalId) {
      console.log('⚠️  Auto Route Scheduler is already running');
      return;
    }

    console.log('🚀 Starting Auto Route Scheduler...');
    console.log(`📅 Will run every ${this.INTERVAL_MS / 60000} minutes`);

    // Run immediately on start
    this.runOrchestration();

    // Then run at intervals
    this.intervalId = setInterval(() => {
      this.runOrchestration();
    }, this.INTERVAL_MS);

    console.log('✅ Auto Route Scheduler started successfully');
  }

  /**
   * Stop the scheduler
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('🛑 Auto Route Scheduler stopped');
    }
  }

  /**
   * Get scheduler statistics
   */
  getStats(): SchedulerStats {
    return { ...this.stats };
  }

  /**
   * Check if scheduler is currently running
   */
  isRunning(): boolean {
    return this.intervalId !== null;
  }

  /**
   * Main orchestration logic
   */
  private async runOrchestration() {
    if (this.isRunningFlag) {
      console.log('⏭️  Skipping - previous run still in progress');
      return;
    }

    this.isRunningFlag = true;
    const startTime = Date.now();

    try {
      console.log('\n🔄 Starting Auto Route Orchestration...');
      console.log(`⏰ Time: ${new Date().toISOString()}`);

      // Get pending drops
      const pendingDrops = await prisma.drop.findMany({
        where: {
          status: 'booked',
          routeId: null,
        },
        select: {
          id: true,
          customerId: true,
          pickupAddress: true,
          deliveryAddress: true,
          timeWindowStart: true,
          timeWindowEnd: true,
          serviceTier: true,
          status: true,
          quotedPrice: true,
          weight: true,
          volume: true,
          User: {
            select: { name: true, email: true }
          }
        },
        orderBy: { timeWindowStart: 'asc' },
        take: 100, // Process in batches
      });

      if (pendingDrops.length === 0) {
        console.log('✅ No pending drops to process');
        this.stats.lastRun = new Date();
        this.stats.totalRuns++;
        return;
      }

      console.log(`📦 Found ${pendingDrops.length} pending drops`);

      // Get available drivers
      const availableDrivers = await prisma.driver.findMany({
        where: {
          status: 'active'
        },
        include: {
          User: { select: { name: true } }
        },
      });

      console.log(`👥 Found ${availableDrivers.length} available drivers`);

      // Create routes using clustering algorithm
      const routes = this.clusterDropsIntoRoutes(pendingDrops);
      console.log(`🗺️  Created ${routes.length} route clusters`);

      // Save routes to database
      let routesCreated = 0;
      let dropsAssigned = 0;

      for (let i = 0; i < routes.length; i++) {
        const dropGroup = routes[i];
        const assignedDriver = i < availableDrivers.length ? availableDrivers[i] : null;

        try {
          const totalOutcome = dropGroup.reduce((sum, d) => sum + Number(d.quotedPrice || 0), 0);
          const totalWeight = dropGroup.reduce((sum, d) => sum + (d.weight || 0), 0);
          const totalVolume = dropGroup.reduce((sum, d) => sum + (d.volume || 0), 0);

          const route = await prisma.route.create({
            data: {
              driverId: assignedDriver?.id || (await this.getOrCreateSystemDriver()).id,
              status: assignedDriver ? 'assigned' : 'planned',
              startTime: dropGroup[0].timeWindowStart,
              timeWindowStart: dropGroup[0].timeWindowStart,
              timeWindowEnd: dropGroup[dropGroup.length - 1].timeWindowEnd,
              serviceTier: dropGroup[0].serviceTier || 'standard',
              totalDrops: dropGroup.length,
              completedDrops: 0,
              totalOutcome,
              maxCapacityWeight: totalWeight,
              maxCapacityVolume: totalVolume,
              routeOptimizationVersion: '2.0-auto',
              routeNotes: `Auto-generated by scheduler at ${new Date().toISOString()}`,
              routeComplexityScore: Math.min(dropGroup.length, 5),
            }
          });

          // Update drops
          await prisma.drop.updateMany({
            where: { id: { in: dropGroup.map(d => d.id) } },
            data: {
              routeId: route.id,
              status: 'assigned_to_route',
            }
          });

          // Log optimization history (disabled - model not available)
          /*
          await prisma.routeOptimizationHistory.create({
            data: {
              routeId: route.id,
              optimizationType: 'initial',
              algorithmVersion: '2.0-auto-scheduler',
              inputParameters: {
                maxDropsPerRoute: this.MAX_DROPS_PER_ROUTE,
                maxDistanceKm: this.MAX_DISTANCE_KM,
                autoScheduled: true,
                timestamp: new Date().toISOString(),
              },
              optimizationResult: {
                dropsCount: dropGroup.length,
                estimatedDuration: dropGroup.length * 30,
                totalValue: totalOutcome,
                driverAssigned: !!assignedDriver,
              },
            }
          });
          */

          routesCreated++;
          dropsAssigned += dropGroup.length;

          console.log(`  ✅ Route ${i + 1}: ${dropGroup.length} drops${assignedDriver ? ` → ${assignedDriver.User?.name}` : ' (unassigned)'}`);

        } catch (error) {
          console.error(`  ❌ Failed to create route ${i + 1}:`, error);
          this.stats.errors++;
        }
      }

      // Update stats
      this.stats.lastRun = new Date();
      this.stats.totalRuns++;
      this.stats.routesCreated += routesCreated;
      this.stats.dropsProcessed += dropsAssigned;

      const duration = Date.now() - startTime;
      console.log(`\n✅ Orchestration Complete!`);
      console.log(`   📊 Routes Created: ${routesCreated}`);
      console.log(`   📦 Drops Assigned: ${dropsAssigned}/${pendingDrops.length}`);
      console.log(`   ⏱️  Duration: ${duration}ms`);
      console.log(`   📈 Total Runs: ${this.stats.totalRuns}`);

    } catch (error) {
      console.error('❌ Auto Route Orchestration failed:', error);
      this.stats.errors++;
    } finally {
      this.isRunningFlag = false;
    }
  }

  /**
   * Cluster drops into routes using simple algorithm
   */
  private clusterDropsIntoRoutes(drops: any[]): any[][] {
    const routes: any[][] = [];
    let currentGroup: any[] = [];
    let currentTime = drops[0]?.timeWindowStart;

    for (const drop of drops) {
      // Check if drop fits in current group
      const timeDiff = Math.abs(
        drop.timeWindowStart.getTime() - currentTime.getTime()
      ) / (1000 * 60 * 60); // Hours

      if (
        currentGroup.length >= this.MAX_DROPS_PER_ROUTE ||
        timeDiff > this.TIME_WINDOW_TOLERANCE_HOURS
      ) {
        // Create new group
        if (currentGroup.length > 0) {
          routes.push(currentGroup);
        }
        currentGroup = [drop];
        currentTime = drop.timeWindowStart;
      } else {
        currentGroup.push(drop);
      }
    }

    // Add last group
    if (currentGroup.length > 0) {
      routes.push(currentGroup);
    }

    return routes;
  }

  /**
   * Manual trigger (for testing or admin override)
   */
  async triggerNow(): Promise<void> {
    console.log('🔥 Manual trigger requested');
    await this.runOrchestration();
  }

  /**
   * Get or create a system driver for unassigned routes
   */
  private async getOrCreateSystemDriver() {
    try {
      // Try to find existing system driver
      let systemDriver = await prisma.user.findFirst({
        where: {
          email: 'system@speedy-van.co.uk',
          role: 'driver'
        }
      });

      if (!systemDriver) {
        // Create system driver if not exists
        systemDriver = await prisma.user.create({
          data: {
            email: 'system@speedy-van.co.uk',
            name: 'System Driver',
            password: 'system_password_not_used', // System user, password not used
            role: 'driver',
            isActive: true,
            emailVerified: true
          }
        });
      }

      return systemDriver;
    } catch (error) {
      console.error('❌ Failed to get/create system driver:', error);
      throw error;
    }
  }
}

// Export singleton
export const autoRouteScheduler = new AutoRouteScheduler();

// Auto-start disabled for debugging - will be controlled via API only
console.log('🔧 Auto Route Scheduler loaded (manual control only)');



