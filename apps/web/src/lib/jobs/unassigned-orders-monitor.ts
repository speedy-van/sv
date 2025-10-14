/**
 * Background job to monitor unassigned orders and notify admin
 */
import { prisma } from '@/lib/prisma';
import { getPusherServer } from '@/lib/pusher';

interface UnassignedOrderAlert {
  id: string;
  reference: string;
  customerName: string;
  waitingMinutes: number;
  priority: 'normal' | 'high' | 'urgent';
  slaBreached: boolean;
}

// SLA thresholds (in minutes)
const SLA_THRESHOLDS = {
  NORMAL: 30,    // 30 minutes
  HIGH: 15,      // 15 minutes  
  URGENT: 5,     // 5 minutes
};

export class UnassignedOrdersMonitor {
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private readonly checkInterval = 5 * 60 * 1000; // Check every 5 minutes

  async start() {
    if (this.intervalId) {
      console.warn('UnassignedOrdersMonitor already running');
      return;
    }

    console.log('🚨 Starting UnassignedOrdersMonitor...');
    this.intervalId = setInterval(() => {
      this.checkUnassignedOrders();
    }, this.checkInterval);

    // Run initial check
    await this.checkUnassignedOrders();
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('⏹️ Stopped UnassignedOrdersMonitor');
    }
  }

  private async checkUnassignedOrders() {
    try {
      console.log('🔍 Checking for unassigned orders...');

      const unassignedOrders = await prisma.booking.findMany({
        where: {
          status: 'CONFIRMED',
          driverId: null,
          createdAt: {
            lte: new Date(Date.now() - 5 * 60 * 1000) // Older than 5 minutes
          }
        },
        select: {
          id: true,
          reference: true,
          customerName: true,
          createdAt: true,
          scheduledAt: true,
          urgency: true,
        },
        orderBy: {
          createdAt: 'asc'
        }
      });

      if (unassignedOrders.length === 0) {
        console.log('✅ No unassigned orders found');
        return;
      }

      console.log(`⚠️ Found ${unassignedOrders.length} unassigned orders`);

      const alerts: UnassignedOrderAlert[] = unassignedOrders.map(order => {
        const now = new Date();
        const waitingMinutes = Math.floor((now.getTime() - order.createdAt.getTime()) / (1000 * 60));
        
        // Determine priority and SLA breach
        let priority: 'normal' | 'high' | 'urgent' = 'normal';
        let slaBreached = false;

        if (order.urgency === 'urgent') {
          priority = 'urgent';
          slaBreached = waitingMinutes > SLA_THRESHOLDS.URGENT;
        } else if (waitingMinutes > SLA_THRESHOLDS.HIGH) {
          priority = 'high';
          slaBreached = waitingMinutes > SLA_THRESHOLDS.NORMAL;
        } else if (waitingMinutes > SLA_THRESHOLDS.NORMAL) {
          slaBreached = true;
        }

        return {
          id: order.id,
          reference: order.reference,
          customerName: order.customerName,
          waitingMinutes,
          priority,
          slaBreached
        };
      });

      // Send alerts for SLA breached orders
      const breachedOrders = alerts.filter(alert => alert.slaBreached);
      
      if (breachedOrders.length > 0) {
        await this.sendAdminAlert(breachedOrders);
      }

      // Log all unassigned orders
      await this.logUnassignedOrders(alerts);

    } catch (error) {
      console.error('❌ Error in UnassignedOrdersMonitor:', error);
    }
  }

  private async sendAdminAlert(breachedOrders: UnassignedOrderAlert[]) {
    try {
      const pusher = getPusherServer();

      for (const order of breachedOrders) {
        await pusher.trigger('admin-notifications', 'unassigned-order-alert', {
          type: 'unassigned_order_sla_breach',
          orderId: order.id,
          orderReference: order.reference,
          customerName: order.customerName,
          waitingMinutes: order.waitingMinutes,
          priority: order.priority,
          message: `Order ${order.reference} has been unassigned for ${order.waitingMinutes} minutes`,
          timestamp: new Date().toISOString(),
          actionRequired: true,
          suggestedActions: [
            'Assign available driver',
            'Contact customer about delay',
            'Escalate to operations team'
          ]
        });

        console.log(`🚨 Sent admin alert for order ${order.reference} (${order.waitingMinutes}min wait)`);
      }

      // Send summary notification
      await pusher.trigger('admin-notifications', 'unassigned-orders-summary', {
        type: 'unassigned_orders_summary',
        totalUnassigned: breachedOrders.length,
        urgentCount: breachedOrders.filter(o => o.priority === 'urgent').length,
        highCount: breachedOrders.filter(o => o.priority === 'high').length,
        message: `${breachedOrders.length} orders need immediate attention`,
        timestamp: new Date().toISOString(),
      });

    } catch (error) {
      console.error('❌ Error sending admin alert:', error);
    }
  }

  private async logUnassignedOrders(alerts: UnassignedOrderAlert[]) {
    console.log('📊 Unassigned Orders Summary:');
    alerts.forEach(alert => {
      console.log(`  - ${alert.reference}: ${alert.waitingMinutes}min (${alert.priority}) ${alert.slaBreached ? '🚨 SLA BREACH' : '✅'}`);
    });
  }
}

// Singleton instance
export const unassignedOrdersMonitor = new UnassignedOrdersMonitor();