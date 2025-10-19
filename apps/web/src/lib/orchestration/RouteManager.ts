/**
 * Unified Route Manager
 * Handles both Auto and Manual routing modes with complete Admin control
 * 
 * This is the single source of truth for all routing operations in the system.
 */

import { prisma } from '@/lib/prisma';
import { RouteOrchestrationEngine } from '@/lib/route-orchestration';

// ============================================================================
// Types & Interfaces
// ============================================================================

export type RoutingMode = 'auto' | 'manual';
export type RoutingStatus = 'idle' | 'running' | 'error';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface RouteManagerConfig {
  routingMode: RoutingMode;
  autoRoutingEnabled: boolean;
  autoRoutingIntervalMin: number;
  maxDropsPerRoute: number;
  maxRouteDistanceKm: number;
  autoAssignDrivers: boolean;
  requireAdminApproval: boolean;
  minDropsForAutoRoute: number;
}

export interface AutoRoutingResult {
  success: boolean;
  routesCreated: number;
  bookingsProcessed: number;
  dropsCreated: number;
  routesAwaitingApproval: number;
  errors: string[];
  duration: number; // ms
  timestamp: Date;
}

export interface ManualRouteCreationInput {
  bookingIds?: string[];
  dropIds?: string[];
  driverId?: string;
  vehicleId?: string;
  startTime: Date;
  serviceTier?: string;
  adminId: string;
  skipApproval?: boolean; // Admin can override approval requirement
}

export interface RoutePreviewData {
  estimatedDuration: number; // minutes
  estimatedDistance: number; // km
  totalDrops: number;
  totalValue: number; // pence
  stops: Array<{
    sequence: number;
    address: string;
    lat: number;
    lng: number;
    type: 'pickup' | 'delivery';
    estimatedTime: Date;
  }>;
  driver?: {
    id: string;
    name: string;
    currentLoad: number;
  };
  warnings: string[];
}

// ============================================================================
// Route Manager Class
// ============================================================================

export class RouteManager {
  private static instance: RouteManager;
  private config: RouteManagerConfig | null = null;
  private isRunning: boolean = false;

  private constructor() {}

  /**
   * Singleton instance
   */
  public static getInstance(): RouteManager {
    if (!RouteManager.instance) {
      RouteManager.instance = new RouteManager();
    }
    return RouteManager.instance;
  }

  // ============================================================================
  // Configuration Management
  // ============================================================================

  /**
   * Load system settings from database
   */
  public async loadConfig(): Promise<RouteManagerConfig> {
    const settings = await prisma.systemSettings.findFirst({
      orderBy: { updatedAt: 'desc' }
    });

    if (!settings) {
      // Create default settings if none exist
      const defaultSettings = await prisma.systemSettings.create({
        data: {
          routingMode: 'manual',
          autoRoutingEnabled: false,
          autoRoutingIntervalMin: 15,
          maxDropsPerRoute: 10,
          maxRouteDistanceKm: 50,
          autoAssignDrivers: false,
          requireAdminApproval: true,
          minDropsForAutoRoute: 2,
          updatedBy: 'system',
        }
      });

      this.config = this.mapSettingsToConfig(defaultSettings);
      return this.config;
    }

    this.config = this.mapSettingsToConfig(settings);
    return this.config;
  }

  /**
   * Update routing mode (Auto/Manual toggle)
   */
  public async setRoutingMode(
    mode: RoutingMode, 
    adminId: string,
    ipAddress?: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const currentSettings = await this.loadConfig();

      await prisma.$transaction(async (tx) => {
        // Update settings
        await tx.systemSettings.updateMany({
          data: {
            routingMode: mode,
            autoRoutingEnabled: mode === 'auto',
            updatedBy: adminId,
            updatedAt: new Date(),
          }
        });

        // Log the change
        await tx.systemAuditLog.create({
          data: {
            eventType: 'routing_mode_changed',
            severity: 'info',
            actor: adminId,
            actorType: 'admin',
            targetType: 'settings',
            action: 'change_routing_mode',
            details: {
              oldMode: currentSettings.routingMode,
              newMode: mode,
              timestamp: new Date().toISOString(),
            },
            result: 'success',
            ipAddress,
          }
        });
      });

      this.config = await this.loadConfig();

      return {
        success: true,
        message: `Routing mode switched to ${mode.toUpperCase()} successfully`,
      };
    } catch (error) {
      await this.logError('set_routing_mode', error, adminId);
      throw error;
    }
  }

  /**
   * Update auto-routing settings
   */
  public async updateConfig(
    updates: Partial<RouteManagerConfig>,
    adminId: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      await prisma.systemSettings.updateMany({
        data: {
          ...updates,
          updatedBy: adminId,
          updatedAt: new Date(),
        }
      });

      await this.logAudit({
        eventType: 'routing_config_updated',
        actor: adminId,
        actorType: 'admin',
        targetType: 'settings',
        action: 'update_config',
        details: { updates },
        result: 'success',
      });

      this.config = await this.loadConfig();

      return {
        success: true,
        message: 'Routing configuration updated successfully',
      };
    } catch (error) {
      await this.logError('update_config', error, adminId);
      throw error;
    }
  }

  // ============================================================================
  // AUTO MODE - Automated Routing
  // ============================================================================

  /**
   * Run automatic route generation
   * Called by cron job or manually triggered by admin
   */
  public async runAutoRouting(
    triggeredBy: string = 'system'
  ): Promise<AutoRoutingResult> {
    const startTime = Date.now();
    const result: AutoRoutingResult = {
      success: false,
      routesCreated: 0,
      bookingsProcessed: 0,
      dropsCreated: 0,
      routesAwaitingApproval: 0,
      errors: [],
      duration: 0,
      timestamp: new Date(),
    };

    // Prevent concurrent runs
    if (this.isRunning) {
      result.errors.push('Auto-routing is already running');
      return result;
    }

    try {
      this.isRunning = true;
      const config = await this.loadConfig();

      // Check if auto-routing is enabled
      if (!config.autoRoutingEnabled) {
        result.errors.push('Auto-routing is disabled');
        return result;
      }

      // Update status to running
      await prisma.systemSettings.updateMany({
        data: {
          autoRoutingStatus: 'running',
          lastAutoRoutingRun: new Date(),
        }
      });

      await this.logAudit({
        eventType: 'auto_routing_run',
        actor: triggeredBy,
        actorType: triggeredBy === 'system' ? 'system' : 'admin',
        action: 'start_auto_routing',
        details: { config },
        result: 'success',
      });

      // Step 1: Fetch all confirmed bookings without routeId
      const pendingBookings = await prisma.booking.findMany({
        where: {
          status: 'CONFIRMED',
          routeId: null,
          scheduledAt: {
            gte: new Date(),
            lte: new Date(Date.now() + 48 * 60 * 60 * 1000), // Next 48 hours
          }
        },
        include: {
          pickupAddress: true,
          dropoffAddress: true,
          BookingItem: true,
        },
        orderBy: { scheduledAt: 'asc' },
        take: 100, // Process in batches
      });

      if (pendingBookings.length < config.minDropsForAutoRoute) {
        result.errors.push(`Not enough bookings for auto-routing (minimum: ${config.minDropsForAutoRoute})`);
        await this.updateStatusToIdle();
        return result;
      }

      result.bookingsProcessed = pendingBookings.length;

      // Step 2: Convert bookings to drops (internal format for optimization)
      const drops = await this.convertBookingsToDrops(pendingBookings);
      result.dropsCreated = drops.length;

      if (drops.length === 0) {
        result.errors.push('No valid drops created from bookings');
        await this.updateStatusToIdle();
        return result;
      }

      // Step 3: Run route orchestration engine
      const orchestrationEngine = new RouteOrchestrationEngine({
        maxClusterRadius: config.maxRouteDistanceKm * 1000, // Convert to meters
        maxDropsPerRoute: config.maxDropsPerRoute,
      });

      const orchestrationResult = await orchestrationEngine.orchestrateRoutes(drops, {
        emergencyMode: false,
        availableDrivers: config.autoAssignDrivers ? await this.getAvailableDriverCount() : undefined,
      });

      // Step 4: Create routes in database
      for (const routeProposal of orchestrationResult.routes) {
        try {
          const route = await this.createRouteFromProposal(
            routeProposal,
            config,
            triggeredBy
          );

          result.routesCreated++;

          // Create approval record if required
          if (config.requireAdminApproval) {
            await this.createRouteApproval(route.id, routeProposal, triggeredBy);
            result.routesAwaitingApproval++;
          } else {
            // Auto-approve and notify drivers
            await this.approveAndDispatchRoute(route.id, 'system');
          }
        } catch (routeError) {
          result.errors.push(`Failed to create route: ${routeError instanceof Error ? routeError.message : 'Unknown error'}`);
        }
      }

      // Log unassigned bookings
      if (orchestrationResult.unassigned.length > 0) {
        result.errors.push(`${orchestrationResult.unassigned.length} bookings could not be assigned to routes`);
        await this.logAudit({
          eventType: 'auto_routing_unassigned',
          actor: triggeredBy,
          actorType: 'system',
          action: 'log_unassigned',
          details: {
            unassignedCount: orchestrationResult.unassigned.length,
            unassignedIds: orchestrationResult.unassigned.map(d => d.id),
          },
          result: 'warning',
        });
      }

      result.success = result.routesCreated > 0;
      await this.updateStatusToIdle();

    } catch (error) {
      result.success = false;
      result.errors.push(error instanceof Error ? error.message : 'Unknown error');
      await this.logError('auto_routing_run', error, triggeredBy);
      
      // Update status to error
      await prisma.systemSettings.updateMany({
        data: {
          autoRoutingStatus: 'error',
          lastError: error instanceof Error ? error.message : 'Unknown error',
        }
      });
    } finally {
      this.isRunning = false;
      result.duration = Date.now() - startTime;
    }

    await this.logAudit({
      eventType: 'auto_routing_completed',
      actor: triggeredBy,
      actorType: 'system',
      action: 'complete_auto_routing',
      details: { result },
      result: result.success ? 'success' : 'failure',
    });

    return result;
  }

  // ============================================================================
  // MANUAL MODE - Admin-Driven Routing
  // ============================================================================

  /**
   * Create route manually from selected bookings/drops
   */
  public async createManualRoute(
    input: ManualRouteCreationInput
  ): Promise<{ success: boolean; routeId?: string; approvalId?: string; message: string }> {
    try {
      const config = await this.loadConfig();

      // Validate input
      if (!input.bookingIds?.length && !input.dropIds?.length) {
        return {
          success: false,
          message: 'No bookings or drops provided',
        };
      }

      // Fetch drops (create from bookings if needed)
      let drops: any[] = [];
      
      if (input.dropIds?.length) {
        drops = await prisma.drop.findMany({
          where: {
            id: { in: input.dropIds },
            status: 'pending',
            routeId: null,
          }
        });
      } else if (input.bookingIds?.length) {
        const bookings = await prisma.booking.findMany({
          where: {
            id: { in: input.bookingIds },
            status: 'CONFIRMED',
            routeId: null,
          },
          include: {
            pickupAddress: true,
            dropoffAddress: true,
          }
        });

        drops = await this.convertBookingsToDrops(bookings);
      }

      if (drops.length === 0) {
        return {
          success: false,
          message: 'No valid drops available for routing',
        };
      }

      // Calculate route metrics
      const totalWeight = drops.reduce((sum, d) => sum + (d.weight || 0), 0);
      const totalVolume = drops.reduce((sum, d) => sum + (d.volume || 0), 0);
      const totalOutcome = drops.reduce((sum, d) => {
        const price = Number(d.quotedPrice || 0);
        return (Number.isFinite(price) && price >= 0 && price <= Number.MAX_SAFE_INTEGER) ? sum + price : sum;
      }, 0);

      // Create route
      const routeId = `route_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const route = await prisma.route.create({
      data: {
        id: routeId,
        driverId: input.driverId || 'system',
        vehicleId: input.vehicleId || undefined,
        status: input.driverId && !config.requireAdminApproval ? 'assigned' : 'planned',
        startTime: input.startTime,
        serviceTier: input.serviceTier || 'standard',
        totalDrops: drops.length,
        completedDrops: 0,
        totalOutcome,
        maxCapacityWeight: totalWeight,
        maxCapacityVolume: totalVolume,
        routeNotes: 'Manually created by admin',
        updatedAt: new Date(),
      }
    });

      // Link drops to route
      if (input.dropIds?.length) {
        await prisma.drop.updateMany({
          where: { id: { in: input.dropIds } },
          data: { routeId: route.id, status: 'assigned_to_route' }
        });
      }

      // Link bookings to route
      if (input.bookingIds?.length) {
        await prisma.booking.updateMany({
          where: { id: { in: input.bookingIds } },
          data: { routeId: route.id }
        });
      }

      // Create approval record if needed
      let approvalId: string | undefined;
      if (config.requireAdminApproval && !input.skipApproval) {
        const approval = await this.createRouteApproval(route.id, {
          drops,
          totalDistance: 0, // Will be calculated
          totalDuration: 0,
        }, input.adminId);
        approvalId = approval.id;
      } else {
        // Auto-approve and dispatch
        await this.approveAndDispatchRoute(route.id, input.adminId);
      }

      await this.logAudit({
        eventType: 'manual_route_created',
        actor: input.adminId,
        actorType: 'admin',
        targetType: 'route',
        targetId: route.id,
        action: 'create_manual_route',
        details: {
          dropsCount: drops.length,
          driverId: input.driverId,
          totalValue: totalOutcome,
        },
        result: 'success',
      });

      return {
        success: true,
        routeId: route.id,
        approvalId,
        message: `Route created successfully with ${drops.length} stops`,
      };

    } catch (error) {
      await this.logError('create_manual_route', error, input.adminId);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create route',
      };
    }
  }

  /**
   * Generate route preview for admin review
   */
  public async generateRoutePreview(
    bookingIds: string[]
  ): Promise<RoutePreviewData> {
    const bookings = await prisma.booking.findMany({
      where: { id: { in: bookingIds } },
      include: {
        pickupAddress: true,
        dropoffAddress: true,
      }
    });

    const drops = await this.convertBookingsToDrops(bookings);
    
    // Run optimization to get estimated metrics
    const engine = new RouteOrchestrationEngine();
    const result = await engine.orchestrateRoutes(drops);

    if (result.routes.length === 0) {
      throw new Error('No viable routes could be generated');
    }

    const bestRoute = result.routes[0];

    return {
      estimatedDuration: bestRoute.estimatedDuration || 0,
      estimatedDistance: bestRoute.totalDistance || 0,
      totalDrops: bestRoute.drops.length,
      totalValue: bestRoute.drops.reduce((sum, d) => sum + d.value, 0),
      stops: bestRoute.drops.map((drop, index) => ({
        sequence: index + 1,
        address: drop.pickupLocation.address,
        lat: drop.pickupLocation.latitude,
        lng: drop.pickupLocation.longitude,
        type: 'pickup',
        estimatedTime: new Date(Date.now() + index * 30 * 60 * 1000), // Rough estimate
      })),
      warnings: result.warnings,
    };
  }

  // ============================================================================
  // Route Approval System
  // ============================================================================

  /**
   * Approve route and dispatch to driver
   */
  public async approveRoute(
    routeId: string,
    adminId: string,
    driverId?: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      await prisma.$transaction(async (tx) => {
        // Update approval status
        await tx.routeApproval.updateMany({
          where: { routeId },
          data: {
            status: 'approved',
            reviewedBy: adminId,
            reviewedAt: new Date(),
          }
        });

        // Update route status
        await tx.route.update({
          where: { id: routeId },
          data: {
            status: driverId ? 'assigned' : 'planned',
            ...(driverId && { driverId }),
          }
        });

        // Log approval
        await tx.systemAuditLog.create({
          data: {
            eventType: 'route_approved',
            severity: 'info',
            actor: adminId,
            actorType: 'admin',
            targetType: 'route',
            targetId: routeId,
            action: 'approve_route',
            details: { driverId, timestamp: new Date().toISOString() },
            result: 'success',
          }
        });
      });

      // Dispatch to driver if assigned
      if (driverId) {
        await this.notifyDriver(routeId, driverId);
      }

      return {
        success: true,
        message: 'Route approved successfully',
      };
    } catch (error) {
      await this.logError('approve_route', error, adminId);
      throw error;
    }
  }

  /**
   * Reject route with reason
   */
  public async rejectRoute(
    routeId: string,
    adminId: string,
    reason: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      await prisma.$transaction(async (tx) => {
        // Update approval status
        await tx.routeApproval.updateMany({
          where: { routeId },
          data: {
            status: 'rejected',
            reviewedBy: adminId,
            reviewedAt: new Date(),
            rejectionReason: reason,
          }
        });

        // Update route status
        await tx.route.update({
          where: { id: routeId },
          data: { status: 'cancelled' }
        });

        // Release bookings/drops
        await tx.booking.updateMany({
          where: { routeId },
          data: { routeId: null }
        });

        await tx.drop.updateMany({
          where: { routeId },
          data: { routeId: null, status: 'pending' }
        });

        // Log rejection
        await tx.systemAuditLog.create({
          data: {
            eventType: 'route_rejected',
            severity: 'warning',
            actor: adminId,
            actorType: 'admin',
            targetType: 'route',
            targetId: routeId,
            action: 'reject_route',
            details: { reason, timestamp: new Date().toISOString() },
            result: 'success',
          }
        });
      });

      return {
        success: true,
        message: 'Route rejected and released',
      };
    } catch (error) {
      await this.logError('reject_route', error, adminId);
      throw error;
    }
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private async convertBookingsToDrops(bookings: any[]): Promise<any[]> {
    const drops = [];
    
    for (const booking of bookings) {
      const pickupAddress = booking.pickupAddress;
      const dropoffAddress = booking.dropoffAddress;

      if (!pickupAddress?.lat || !pickupAddress?.lng || !dropoffAddress?.lat || !dropoffAddress?.lng) {
        continue; // Skip bookings without geocoded addresses
      }

      drops.push({
        id: `drop_${booking.id}`,
        bookingId: booking.id,
        pickupLocation: {
          latitude: pickupAddress.lat,
          longitude: pickupAddress.lng,
          address: pickupAddress.label || pickupAddress.postcode,
        },
        deliveryLocation: {
          latitude: dropoffAddress.lat,
          longitude: dropoffAddress.lng,
          address: dropoffAddress.label || dropoffAddress.postcode,
        },
        timeWindow: {
          earliest: booking.scheduledAt,
          latest: new Date(booking.scheduledAt.getTime() + 4 * 60 * 60 * 1000), // 4-hour window
        },
        weight: 50, // Default estimate
        volume: 1, // Default estimate
        serviceTier: 'standard',
        priority: booking.urgency === 'urgent' ? 10 : 5,
        estimatedDuration: booking.estimatedDurationMinutes || 120,
        value: booking.totalGBP,
        status: 'pending',
      });
    }

    return drops;
  }

  private async createRouteFromProposal(
    proposal: any,
    config: RouteManagerConfig,
    createdBy: string
  ): Promise<any> {
    const routeId = `route_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return await prisma.route.create({
      data: {
        id: routeId,
        driverId: 'system', // Placeholder - will be assigned after approval
        status: 'planned',
        startTime: proposal.startTime || new Date(),
        serviceTier: proposal.drops[0]?.serviceTier || 'standard',
        totalDrops: proposal.drops.length,
        completedDrops: 0,
        totalOutcome: proposal.drops.reduce((sum: number, d: any) => sum + (d.value || 0), 0),
        optimizedDistanceKm: proposal.totalDistance || 0,
        estimatedDuration: proposal.estimatedDuration || 0,
        routeNotes: 'Auto-generated by system',
        routeOptimizationVersion: '3.0',
        updatedAt: new Date(),
      }
    });
  }

  private async createRouteApproval(
    routeId: string,
    routeData: any,
    submittedBy: string
  ): Promise<any> {
    return await prisma.routeApproval.create({
      data: {
        routeId,
        status: 'pending',
        submittedBy,
        autoGenerated: submittedBy === 'system',
        estimatedDuration: routeData.estimatedDuration || 0,
        estimatedDistance: routeData.totalDistance || 0,
        totalDrops: routeData.drops?.length || 0,
        totalValue: routeData.drops?.reduce((sum: number, d: any) => sum + (d.value || 0), 0) || 0,
        routePreview: routeData,
      }
    });
  }

  private async approveAndDispatchRoute(routeId: string, approvedBy: string): Promise<void> {
    await prisma.$transaction(async (tx) => {
      await tx.route.update({
        where: { id: routeId },
        data: { status: 'approved' }
      });

      await tx.systemAuditLog.create({
        data: {
          eventType: 'route_auto_approved',
          severity: 'info',
          actor: approvedBy,
          actorType: 'system',
          targetType: 'route',
          targetId: routeId,
          action: 'auto_approve_route',
          details: { timestamp: new Date().toISOString() },
          result: 'success',
        }
      });
    });
  }

  private async notifyDriver(routeId: string, driverId: string): Promise<void> {
    try {
      // Fetch full route details
      const route = await prisma.route.findUnique({
        where: { id: routeId },
        include: {
          Booking: {
            include: {
              pickupAddress: true,
              dropoffAddress: true,
            }
          },
          drops: true,
          driver: {
            select: {
              name: true,
              email: true,
            }
          }
        }
      });

      if (!route) {
        console.error(`Route ${routeId} not found for notifications`);
        return;
      }

      const driver = await prisma.driver.findUnique({
        where: { id: driverId },
        include: {
          User: true,
          DriverProfile: true
        }
      });

      if (!driver) {
        console.error(`Driver ${driverId} not found`);
        return;
      }

      const driverPhone = driver.DriverProfile?.phone;
      const driverName = driver.User?.name || 'Driver';

      // Prepare notification data
      const notificationData = {
        routeId: route.id,
        totalDrops: route.totalDrops,
        startTime: route.startTime.toISOString(),
        estimatedDuration: route.estimatedDuration,
        totalValue: route.totalOutcome.toString(),
        status: route.status,
        firstPickup: (route as any).Booking?.[0]?.pickupAddress?.label || 'N/A',
      };

      // 1. Pusher Real-time Notification
      try {
        const pusherModule = await import('@/lib/pusher');
        const pusherServer = (pusherModule as any).pusherServer || (pusherModule as any).default;
        
        await pusherServer.trigger(
          `driver-${driverId}`,
          'new-route-assigned',
          {
            ...notificationData,
            title: 'New Route Assigned',
            message: `You have been assigned a route with ${route.totalDrops} stops`,
            timestamp: new Date().toISOString(),
            priority: 'high',
          }
        );

        console.log(`✅ Pusher notification sent to driver ${driverId}`);
      } catch (pusherError) {
        console.error('❌ Pusher notification failed:', pusherError);
      }

      // 2. SMS Notification
      if (driverPhone) {
        try {
          const smsMessage = `Hi ${driverName}, you have been assigned a new route with ${route.totalDrops} stops starting at ${route.startTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}. Please check your app for details. - Speedy Van`;

          // Use TheSMSWorks
          const smsResponse = await fetch('https://api.thesmsworks.co.uk/v1/message/send', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': process.env.THESMSWORKS_JWT || '',
            },
            body: JSON.stringify({
              sender: 'SpeedyVan',
              destination: driverPhone,
              content: smsMessage,
              tag: `route_${routeId}`,
            }),
          });

          if (smsResponse.ok) {
            console.log(`✅ SMS sent to driver ${driverId} (${driverPhone})`);
            
            // Log SMS in database
            await prisma.communicationLog.create({
              data: {
                id: `sms_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                bookingId: (route as any).Booking?.[0]?.id || '',
                channel: 'sms',
                recipient: driverPhone,
                messageId: smsMessage,
                type: 'SMS',
                status: 'SENT',
                attemptedAt: new Date(),
              }
            });
          } else {
            console.error('❌ SMS sending failed:', await smsResponse.text());
          }
        } catch (smsError) {
          console.error('❌ SMS notification failed:', smsError);
        }
      }

      // 3. Push Notification (Removed - iOS app no longer supported)

      // 4. Email Notification (Backup)
      if (driver.User?.email) {
        try {
          const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #2563eb;">New Route Assigned</h2>
              <p>Hi ${driverName},</p>
              <p>You have been assigned a new delivery route:</p>
              <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Route ID:</strong> ${route.id}</p>
                <p><strong>Total Stops:</strong> ${route.totalDrops}</p>
                <p><strong>Start Time:</strong> ${route.startTime.toLocaleString('en-GB')}</p>
                <p><strong>Estimated Duration:</strong> ${route.estimatedDuration ? `${route.estimatedDuration} minutes` : 'TBD'}</p>
                <p><strong>First Pickup:</strong> ${notificationData.firstPickup}</p>
              </div>
              <p>Please open your Speedy Van Driver app to view full route details and start navigation.</p>
              <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
                This is an automated notification from Speedy Van. For support, call 07901846297 or email support@speedy-van.co.uk
              </p>
            </div>
          `;

          // Use ZeptoMail
          const emailResponse = await fetch(process.env.ZEPTO_API_URL || 'https://api.zeptomail.eu/v1.1/email', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': process.env.ZEPTO_API_KEY || '',
            },
            body: JSON.stringify({
              from: {
                address: process.env.MAIL_FROM || 'noreply@speedy-van.co.uk',
                name: 'Speedy Van Dispatch',
              },
              to: [{
                email_address: {
                  address: driver.User.email,
                  name: driverName,
                }
              }],
              subject: `New Route Assigned - ${route.totalDrops} Stops`,
              htmlbody: emailHtml,
            }),
          });

          if (emailResponse.ok) {
            console.log(`✅ Email sent to driver ${driverId} (${driver.User.email})`);
          } else {
            console.error('❌ Email sending failed:', await emailResponse.text());
          }
        } catch (emailError) {
          console.error('❌ Email notification failed:', emailError);
        }
      }

      // Log successful notification
      await prisma.systemAuditLog.create({
        data: {
          eventType: 'driver_notified',
          severity: 'info',
          actor: 'system',
          actorType: 'system',
          targetType: 'route',
          targetId: routeId,
          action: 'notify_driver',
          details: {
            driverId,
            driverName,
            routeId,
            totalDrops: route.totalDrops,
            channels: ['pusher', 'sms', 'push', 'email'],
          },
          result: 'success',
          timestamp: new Date(),
        }
      });

    } catch (error) {
      console.error('❌ Critical error in notifyDriver:', error);
      
      // Log error
      await prisma.systemAuditLog.create({
        data: {
          eventType: 'driver_notification_failed',
          severity: 'error',
          actor: 'system',
          actorType: 'system',
          targetType: 'route',
          targetId: routeId,
          action: 'notify_driver',
          details: {
            driverId,
            error: error instanceof Error ? error.message : 'Unknown error',
          },
          result: 'failure',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date(),
        }
      });
    }
  }

  private async getAvailableDriverCount(): Promise<number> {
    const count = await prisma.driver.count({
      where: {
        status: 'active',
        DriverAvailability: {
          status: 'online',
        }
      }
    });
    return count;
  }

  private async updateStatusToIdle(): Promise<void> {
    await prisma.systemSettings.updateMany({
      data: { autoRoutingStatus: 'idle' }
    });
  }

  private mapSettingsToConfig(settings: any): RouteManagerConfig {
    return {
      routingMode: settings.routingMode,
      autoRoutingEnabled: settings.autoRoutingEnabled,
      autoRoutingIntervalMin: settings.autoRoutingIntervalMin,
      maxDropsPerRoute: settings.maxDropsPerRoute,
      maxRouteDistanceKm: settings.maxRouteDistanceKm,
      autoAssignDrivers: settings.autoAssignDrivers,
      requireAdminApproval: settings.requireAdminApproval,
      minDropsForAutoRoute: settings.minDropsForAutoRoute,
    };
  }

  private async logAudit(data: {
    eventType: string;
    actor: string;
    actorType: string;
    targetType?: string;
    targetId?: string;
    action: string;
    details: any;
    result?: string;
  }): Promise<void> {
    await prisma.systemAuditLog.create({
      data: {
        ...data,
        severity: 'info',
        timestamp: new Date(),
      }
    });
  }

  private async logError(action: string, error: unknown, actor: string): Promise<void> {
    await prisma.systemAuditLog.create({
      data: {
        eventType: 'routing_error',
        severity: 'error',
        actor,
        actorType: 'system',
        action,
        details: {},
        result: 'failure',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
      }
    });
  }

  // ============================================================================
  // Public Query Methods
  // ============================================================================

  /**
   * Get current system configuration
   */
  public async getConfig(): Promise<RouteManagerConfig> {
    if (!this.config) {
      return await this.loadConfig();
    }
    return this.config;
  }

  /**
   * Get pending route approvals
   */
  public async getPendingApprovals(): Promise<any[]> {
    return await prisma.routeApproval.findMany({
      where: { status: 'pending' },
      orderBy: { submittedAt: 'desc' },
    });
  }

  /**
   * Get auto-routing history
   */
  public async getAutoRoutingHistory(limit: number = 50): Promise<any[]> {
    return await prisma.systemAuditLog.findMany({
      where: {
        eventType: { in: ['auto_routing_run', 'auto_routing_completed'] }
      },
      orderBy: { timestamp: 'desc' },
      take: limit,
    });
  }
}

// ============================================================================
// Singleton Export
// ============================================================================

export const routeManager = RouteManager.getInstance();

