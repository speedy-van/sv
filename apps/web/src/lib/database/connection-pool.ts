/**
 * Advanced Database Connection Pool Management
 * Optimized for high-concurrency booking operations
 */

import { PrismaClient } from '@prisma/client';

interface ConnectionPoolConfig {
  maxConnections: number;
  minConnections: number;
  connectionTimeout: number;
  idleTimeout: number;
  retryAttempts: number;
  retryDelay: number;
}

interface PoolMetrics {
  activeConnections: number;
  idleConnections: number;
  totalConnections: number;
  queueLength: number;
  connectionWaitTime: number;
}

class AdvancedConnectionPool {
  private config: ConnectionPoolConfig;
  private connections: PrismaClient[] = [];
  private activeConnections = new Set<PrismaClient>();
  private connectionQueue: Array<{
    resolve: (client: PrismaClient) => void;
    reject: (error: Error) => void;
    timestamp: number;
  }> = [];
  private metrics: PoolMetrics = {
    activeConnections: 0,
    idleConnections: 0,
    totalConnections: 0,
    queueLength: 0,
    connectionWaitTime: 0
  };

  constructor(config: Partial<ConnectionPoolConfig> = {}) {
    this.config = {
      maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '500'), // Increased for high concurrency
      minConnections: parseInt(process.env.DB_MIN_CONNECTIONS || '50'),
      connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT || '30000'), // 30 seconds
      idleTimeout: parseInt(process.env.DB_IDLE_TIMEOUT || '300000'), // 5 minutes
      retryAttempts: 3,
      retryDelay: 1000,
      ...config
    };

    this.initializePool();
    this.startHealthChecks();
  }

  private async initializePool(): Promise<void> {
    console.log('🔧 Initializing advanced connection pool...');
    
    // Create minimum connections
    for (let i = 0; i < this.config.minConnections; i++) {
      await this.createConnection();
    }
    
    console.log(`✅ Connection pool initialized with ${this.config.minConnections} connections`);
  }

  private async createConnection(): Promise<PrismaClient> {
    const client = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
      log: process.env.NODE_ENV === 'development' ? ['error'] : [],
    });

    // Configure connection settings for high performance
    await client.$connect();
    
    this.connections.push(client);
    this.metrics.totalConnections++;
    this.metrics.idleConnections++;
    
    return client;
  }

  async getConnection(): Promise<PrismaClient> {
    const startTime = Date.now();
    
    // Try to get an idle connection
    const idleConnection = this.connections.find(
      conn => !this.activeConnections.has(conn)
    );
    
    if (idleConnection) {
      this.activeConnections.add(idleConnection);
      this.metrics.activeConnections++;
      this.metrics.idleConnections--;
      this.updateWaitTime(Date.now() - startTime);
      return idleConnection;
    }
    
    // Create new connection if under limit
    if (this.connections.length < this.config.maxConnections) {
      const newConnection = await this.createConnection();
      this.activeConnections.add(newConnection);
      this.metrics.activeConnections++;
      this.metrics.idleConnections--;
      this.updateWaitTime(Date.now() - startTime);
      return newConnection;
    }
    
    // Queue request if at capacity
    return new Promise((resolve, reject) => {
      this.connectionQueue.push({
        resolve,
        reject,
        timestamp: Date.now()
      });
      this.metrics.queueLength = this.connectionQueue.length;
      
      // Timeout after connectionTimeout
      setTimeout(() => {
        const index = this.connectionQueue.findIndex(
          req => req.resolve === resolve
        );
        if (index !== -1) {
          this.connectionQueue.splice(index, 1);
          this.metrics.queueLength = this.connectionQueue.length;
          reject(new Error('Connection timeout'));
        }
      }, this.config.connectionTimeout);
    });
  }

  releaseConnection(client: PrismaClient): void {
    if (this.activeConnections.has(client)) {
      this.activeConnections.delete(client);
      this.metrics.activeConnections--;
      this.metrics.idleConnections++;
      
      // Process queued requests
      if (this.connectionQueue.length > 0) {
        const queuedRequest = this.connectionQueue.shift()!;
        this.metrics.queueLength = this.connectionQueue.length;
        queuedRequest.resolve(client);
      }
    }
  }

  private updateWaitTime(waitTime: number): void {
    this.metrics.connectionWaitTime = 
      (this.metrics.connectionWaitTime + waitTime) / 2;
  }

  private startHealthChecks(): void {
    setInterval(async () => {
      await this.performHealthCheck();
    }, 60000); // Check every minute
  }

  private async performHealthCheck(): Promise<void> {
    const deadConnections: PrismaClient[] = [];
    
    for (const connection of this.connections) {
      try {
        await connection.$queryRaw`SELECT 1`;
      } catch (error) {
        console.warn('🚨 Dead connection detected, removing...');
        deadConnections.push(connection);
      }
    }
    
    // Remove dead connections
    for (const deadConnection of deadConnections) {
      const index = this.connections.indexOf(deadConnection);
      if (index !== -1) {
        this.connections.splice(index, 1);
        this.activeConnections.delete(deadConnection);
        this.metrics.totalConnections--;
        this.metrics.activeConnections--;
      }
      
      try {
        await deadConnection.$disconnect();
      } catch (error) {
        // Ignore disconnect errors for dead connections
      }
    }
    
    // Recreate connections to maintain minimum
    const neededConnections = Math.max(0, 
      this.config.minConnections - this.connections.length
    );
    
    for (let i = 0; i < neededConnections; i++) {
      await this.createConnection();
    }
  }

  getMetrics(): PoolMetrics {
    return { ...this.metrics };
  }

  async shutdown(): Promise<void> {
    console.log('🔄 Shutting down connection pool...');
    
    // Reject all queued requests
    for (const request of this.connectionQueue) {
      request.reject(new Error('Connection pool shutting down'));
    }
    this.connectionQueue = [];
    
    // Disconnect all connections
    await Promise.all(
      this.connections.map(conn => conn.$disconnect())
    );
    
    this.connections = [];
    this.activeConnections.clear();
    this.metrics = {
      activeConnections: 0,
      idleConnections: 0,
      totalConnections: 0,
      queueLength: 0,
      connectionWaitTime: 0
    };
    
    console.log('✅ Connection pool shutdown complete');
  }
}

// Global connection pool instance
let globalPool: AdvancedConnectionPool | null = null;

export function getConnectionPool(): AdvancedConnectionPool {
  if (!globalPool) {
    globalPool = new AdvancedConnectionPool({
      maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '100'),
      minConnections: parseInt(process.env.DB_MIN_CONNECTIONS || '10'),
      connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT || '30000'),
      idleTimeout: parseInt(process.env.DB_IDLE_TIMEOUT || '300000'),
    });
  }
  return globalPool;
}

export async function getDatabaseClient(): Promise<PrismaClient> {
  const pool = getConnectionPool();
  return pool.getConnection();
}

export async function releaseDatabaseClient(client: PrismaClient): Promise<void> {
  const pool = getConnectionPool();
  pool.releaseConnection(client);
}

export function getPoolMetrics(): PoolMetrics {
  const pool = getConnectionPool();
  return pool.getMetrics();
}

// Graceful shutdown
process.on('SIGINT', async () => {
  if (globalPool) {
    await globalPool.shutdown();
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  if (globalPool) {
    await globalPool.shutdown();
  }
  process.exit(0);
});

