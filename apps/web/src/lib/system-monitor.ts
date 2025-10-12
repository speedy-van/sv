import { prisma } from './prisma';

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: Date;
  services: {
    database: ServiceHealth;
    api: ServiceHealth;
    external: ServiceHealth;
  };
  metrics: {
    responseTime: number;
    errorRate: number;
    uptime: number;
  };
}

export interface ServiceHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime?: number;
  error?: string;
  lastCheck: Date;
}

export class SystemMonitor {
  private static instance: SystemMonitor;
  private healthCache: SystemHealth | null = null;
  private cacheTimeout = 30000; // 30 seconds

  static getInstance(): SystemMonitor {
    if (!SystemMonitor.instance) {
      SystemMonitor.instance = new SystemMonitor();
    }
    return SystemMonitor.instance;
  }

  async getSystemHealth(): Promise<SystemHealth> {
    // Return cached health if still valid
    if (this.healthCache && this.isCacheValid()) {
      return this.healthCache;
    }

    const health: SystemHealth = {
      status: 'healthy',
      timestamp: new Date(),
      services: {
        database: await this.checkDatabaseHealth(),
        api: await this.checkApiHealth(),
        external: await this.checkExternalHealth(),
      },
      metrics: {
        responseTime: 0,
        errorRate: 0,
        uptime: process.uptime(),
      },
    };

    // Determine overall status
    const serviceStatuses = Object.values(health.services).map(s => s.status);
    if (serviceStatuses.includes('unhealthy')) {
      health.status = 'unhealthy';
    } else if (serviceStatuses.includes('degraded')) {
      health.status = 'degraded';
    }

    // Cache the result
    this.healthCache = health;
    return health;
  }

  private async checkDatabaseHealth(): Promise<ServiceHealth> {
    try {
      const start = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      const responseTime = Date.now() - start;

      return {
        status: responseTime > 1000 ? 'degraded' : 'healthy',
        responseTime,
        lastCheck: new Date(),
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        lastCheck: new Date(),
      };
    }
  }

  private async checkApiHealth(): Promise<ServiceHealth> {
    try {
      const start = Date.now();
      // Simulate API check
      await new Promise(resolve => setTimeout(resolve, 10));
      const responseTime = Date.now() - start;

      return {
        status: responseTime > 500 ? 'degraded' : 'healthy',
        responseTime,
        lastCheck: new Date(),
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        lastCheck: new Date(),
      };
    }
  }

  private async checkExternalHealth(): Promise<ServiceHealth> {
    try {
      const start = Date.now();
      // Simulate external service check
      await new Promise(resolve => setTimeout(resolve, 50));
      const responseTime = Date.now() - start;

      return {
        status: responseTime > 2000 ? 'degraded' : 'healthy',
        responseTime,
        lastCheck: new Date(),
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        lastCheck: new Date(),
      };
    }
  }

  private isCacheValid(): boolean {
    if (!this.healthCache) return false;
    return Date.now() - this.healthCache.timestamp.getTime() < this.cacheTimeout;
  }

  async getSystemMetrics(): Promise<{
    totalUsers: number;
    totalOrders: number;
    activeDrivers: number;
    systemUptime: number;
  }> {
    try {
      const [totalUsers, totalOrders, activeDrivers] = await Promise.all([
        prisma.user.count(),
        prisma.booking.count(),
        prisma.driver.count({ where: { status: 'active' } }),
      ]);

      return {
        totalUsers,
        totalOrders,
        activeDrivers,
        systemUptime: process.uptime(),
      };
    } catch (error) {
      console.error('Failed to get system metrics:', error);
      return {
        totalUsers: 0,
        totalOrders: 0,
        activeDrivers: 0,
        systemUptime: process.uptime(),
      };
    }
  }
}

export const systemMonitor = SystemMonitor.getInstance();