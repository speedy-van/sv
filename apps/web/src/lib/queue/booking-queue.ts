/**
 * Advanced Booking Queue System
 * Handles high-volume concurrent booking requests with priority management
 */

import { getCache } from '../cache/redis-cache';

interface QueueJob {
  id: string;
  type: 'booking' | 'payment' | 'assignment' | 'notification';
  priority: number; // 1-10, 10 being highest priority
  data: any;
  createdAt: Date;
  attempts: number;
  maxAttempts: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'retrying';
  error?: string;
  result?: any;
  processingStartedAt?: Date;
  completedAt?: Date;
}

interface QueueConfig {
  maxConcurrency: number;
  retryDelay: number;
  maxRetries: number;
  jobTimeout: number;
  priorityWeights: Record<number, number>;
}

interface QueueMetrics {
  totalJobs: number;
  pendingJobs: number;
  processingJobs: number;
  completedJobs: number;
  failedJobs: number;
  averageProcessingTime: number;
  throughput: number;
  errorRate: number;
}

class AdvancedBookingQueue {
  private config: QueueConfig;
  private jobs: Map<string, QueueJob> = new Map();
  private processing: Set<string> = new Set();
  private workers: Map<string, Worker> = new Map();
  private metrics: QueueMetrics = {
    totalJobs: 0,
    pendingJobs: 0,
    processingJobs: 0,
    completedJobs: 0,
    failedJobs: 0,
    averageProcessingTime: 0,
    throughput: 0,
    errorRate: 0
  };
  private processingTimes: number[] = [];
  private isRunning = false;

  constructor(config: Partial<QueueConfig> = {}) {
    this.config = {
      maxConcurrency: parseInt(process.env.QUEUE_MAX_CONCURRENCY || '50'),
      retryDelay: parseInt(process.env.QUEUE_RETRY_DELAY || '5000'),
      maxRetries: parseInt(process.env.QUEUE_MAX_RETRIES || '3'),
      jobTimeout: parseInt(process.env.QUEUE_JOB_TIMEOUT || '30000'),
      priorityWeights: {
        1: 1,   // Low priority
        2: 2,   // Below normal
        3: 3,   // Normal
        4: 4,   // Above normal
        5: 5,   // High
        6: 6,   // Higher
        7: 7,   // Very high
        8: 8,   // Critical
        9: 9,   // Emergency
        10: 10  // System critical
      },
      ...config
    };

    this.initializeWorkers();
    this.startMetricsCollection();
  }

  private initializeWorkers(): void {
    // Create workers for different job types
    const workerTypes = ['booking', 'payment', 'assignment', 'notification'];
    
    for (const type of workerTypes) {
      const worker = new Worker(type, this.config);
      this.workers.set(type, worker);
    }
  }

  async addJob(jobData: {
    type: QueueJob['type'];
    priority?: number;
    data: any;
    maxAttempts?: number;
  }): Promise<string> {
    const jobId = this.generateJobId();
    const job: QueueJob = {
      id: jobId,
      type: jobData.type,
      priority: jobData.priority || 5,
      data: jobData.data,
      createdAt: new Date(),
      attempts: 0,
      maxAttempts: jobData.maxAttempts || this.config.maxRetries,
      status: 'pending'
    };

    this.jobs.set(jobId, job);
    this.metrics.totalJobs++;
    this.metrics.pendingJobs++;

    // Store in cache for persistence
    await this.persistJob(job);

    // Start processing if not already running
    if (!this.isRunning) {
      this.startProcessing();
    }

    console.log(`📝 Added job ${jobId} (${job.type}, priority ${job.priority})`);
    return jobId;
  }

  private generateJobId(): string {
    return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async persistJob(job: QueueJob): Promise<void> {
    try {
      const cache = getCache();
      await cache.set(`queue:job:${job.id}`, job, { ttl: 3600 }); // 1 hour TTL
    } catch (error) {
      console.error(`Failed to persist job ${job.id}:`, error);
    }
  }

  private async loadPersistedJobs(): Promise<void> {
    try {
      const cache = getCache();
      // In a real implementation, you'd scan for all queue:job:* keys
      // For now, we'll rely on in-memory storage
    } catch (error) {
      console.error('Failed to load persisted jobs:', error);
    }
  }

  private startProcessing(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.processJobs();
  }

  private async processJobs(): Promise<void> {
    while (this.isRunning) {
      try {
        const availableSlots = this.config.maxConcurrency - this.processing.size;
        
        if (availableSlots > 0) {
          const jobsToProcess = this.getNextJobs(availableSlots);
          
          for (const job of jobsToProcess) {
            this.processJob(job);
          }
        }

        // Wait before next iteration
        await this.delay(100);
      } catch (error) {
        console.error('Error in job processing loop:', error);
        await this.delay(1000);
      }
    }
  }

  private getNextJobs(count: number): QueueJob[] {
    // Get jobs sorted by priority and creation time
    const pendingJobs = Array.from(this.jobs.values())
      .filter(job => job.status === 'pending')
      .sort((a, b) => {
        // Sort by priority (higher first), then by creation time (older first)
        const priorityDiff = b.priority - a.priority;
        if (priorityDiff !== 0) return priorityDiff;
        return a.createdAt.getTime() - b.createdAt.getTime();
      })
      .slice(0, count);

    return pendingJobs;
  }

  private async processJob(job: QueueJob): Promise<void> {
    if (this.processing.has(job.id)) return;

    this.processing.add(job.id);
    job.status = 'processing';
    job.processingStartedAt = new Date();
    job.attempts++;
    
    this.metrics.pendingJobs--;
    this.metrics.processingJobs++;

    try {
      const worker = this.workers.get(job.type);
      if (!worker) {
        throw new Error(`No worker available for job type: ${job.type}`);
      }

      // Process job with timeout
      const result = await Promise.race([
        worker.process(job.data),
        this.timeoutPromise(this.config.jobTimeout)
      ]);

      // Job completed successfully
      job.status = 'completed';
      job.result = result;
      job.completedAt = new Date();
      
      this.metrics.processingJobs--;
      this.metrics.completedJobs++;
      
      const processingTime = job.completedAt.getTime() - job.processingStartedAt!.getTime();
      this.updateProcessingTime(processingTime);

      console.log(`✅ Job ${job.id} completed in ${processingTime}ms`);

    } catch (error) {
      console.error(`❌ Job ${job.id} failed:`, error);
      
      job.error = error instanceof Error ? error.message : String(error);
      
      if (job.attempts < job.maxAttempts) {
        // Retry job
        job.status = 'retrying';
        this.metrics.processingJobs--;
        this.metrics.pendingJobs++;
        
        // Schedule retry
        setTimeout(() => {
          job.status = 'pending';
          this.processJob(job);
        }, this.config.retryDelay * job.attempts);
        
        console.log(`🔄 Job ${job.id} scheduled for retry (attempt ${job.attempts}/${job.maxAttempts})`);
      } else {
        // Job failed permanently
        job.status = 'failed';
        this.metrics.processingJobs--;
        this.metrics.failedJobs++;
        
        console.log(`💀 Job ${job.id} failed permanently after ${job.attempts} attempts`);
      }
    } finally {
      this.processing.delete(job.id);
      await this.persistJob(job);
    }
  }

  private timeoutPromise(timeout: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Job timeout after ${timeout}ms`));
      }, timeout);
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private updateProcessingTime(time: number): void {
    this.processingTimes.push(time);
    
    // Keep only last 100 processing times
    if (this.processingTimes.length > 100) {
      this.processingTimes.shift();
    }
    
    this.metrics.averageProcessingTime = 
      this.processingTimes.reduce((a, b) => a + b, 0) / this.processingTimes.length;
  }

  private startMetricsCollection(): void {
    // Update metrics every 10 seconds
    setInterval(() => {
      this.updateMetrics();
    }, 10000);
  }

  private updateMetrics(): void {
    // Calculate throughput (jobs per minute)
    const completedInLastMinute = Array.from(this.jobs.values())
      .filter(job => {
        return job.status === 'completed' && 
               job.completedAt && 
               (Date.now() - job.completedAt.getTime()) < 60000;
      }).length;
    
    this.metrics.throughput = completedInLastMinute;
    
    // Calculate error rate
    const totalProcessed = this.metrics.completedJobs + this.metrics.failedJobs;
    this.metrics.errorRate = totalProcessed > 0 ? 
      (this.metrics.failedJobs / totalProcessed) * 100 : 0;
  }

  // Public API methods
  async getJobStatus(jobId: string): Promise<QueueJob | null> {
    return this.jobs.get(jobId) || null;
  }

  getMetrics(): QueueMetrics {
    return { ...this.metrics };
  }

  getQueueStatus(): {
    totalJobs: number;
    pendingJobs: number;
    processingJobs: number;
    completedJobs: number;
    failedJobs: number;
    isRunning: boolean;
  } {
    return {
      totalJobs: this.metrics.totalJobs,
      pendingJobs: this.metrics.pendingJobs,
      processingJobs: this.metrics.processingJobs,
      completedJobs: this.metrics.completedJobs,
      failedJobs: this.metrics.failedJobs,
      isRunning: this.isRunning
    };
  }

  async stop(): Promise<void> {
    this.isRunning = false;
    
    // Wait for current jobs to complete
    while (this.processing.size > 0) {
      await this.delay(1000);
    }
    
    console.log('✅ Queue processing stopped');
  }

  async clearCompletedJobs(): Promise<void> {
    const completedJobs = Array.from(this.jobs.values())
      .filter(job => job.status === 'completed');
    
    for (const job of completedJobs) {
      this.jobs.delete(job.id);
    }
    
    console.log(`🗑️ Cleared ${completedJobs.length} completed jobs`);
  }
}

// Worker class for processing different job types
class Worker {
  constructor(
    private type: string,
    private config: QueueConfig
  ) {}

  async process(data: any): Promise<any> {
    switch (this.type) {
      case 'booking':
        return this.processBooking(data);
      case 'payment':
        return this.processPayment(data);
      case 'assignment':
        return this.processAssignment(data);
      case 'notification':
        return this.processNotification(data);
      default:
        throw new Error(`Unknown job type: ${this.type}`);
    }
  }

  private async processBooking(data: any): Promise<any> {
    // Simulate booking processing
    await this.delay(Math.random() * 1000 + 500); // 500-1500ms
    
    // In real implementation, this would:
    // 1. Validate booking data
    // 2. Check availability
    // 3. Create booking in database
    // 4. Send confirmation
    
    return { bookingId: data.id, status: 'confirmed' };
  }

  private async processPayment(data: any): Promise<any> {
    // Simulate payment processing
    await this.delay(Math.random() * 2000 + 1000); // 1000-3000ms
    
    // In real implementation, this would:
    // 1. Process payment with Stripe
    // 2. Update booking status
    // 3. Send receipt
    
    return { paymentId: data.id, status: 'paid' };
  }

  private async processAssignment(data: any): Promise<any> {
    // Simulate driver assignment
    await this.delay(Math.random() * 800 + 300); // 300-1100ms
    
    // In real implementation, this would:
    // 1. Find available driver
    // 2. Send assignment notification
    // 3. Update booking status
    
    return { assignmentId: data.id, driverId: 'driver_123' };
  }

  private async processNotification(data: any): Promise<any> {
    // Simulate notification sending
    await this.delay(Math.random() * 600 + 200); // 200-800ms
    
    // In real implementation, this would:
    // 1. Send SMS/email
    // 2. Send push notification
    // 3. Update notification status
    
    return { notificationId: data.id, status: 'sent' };
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Global queue instance
let globalQueue: AdvancedBookingQueue | null = null;

export function getQueue(): AdvancedBookingQueue {
  if (!globalQueue) {
    globalQueue = new AdvancedBookingQueue();
  }
  return globalQueue;
}

export async function addBookingJob(data: any, priority: number = 5): Promise<string> {
  const queue = getQueue();
  return queue.addJob({
    type: 'booking',
    priority,
    data
  });
}

export async function addPaymentJob(data: any, priority: number = 8): Promise<string> {
  const queue = getQueue();
  return queue.addJob({
    type: 'payment',
    priority,
    data
  });
}

export async function addAssignmentJob(data: any, priority: number = 7): Promise<string> {
  const queue = getQueue();
  return queue.addJob({
    type: 'assignment',
    priority,
    data
  });
}

export async function addNotificationJob(data: any, priority: number = 3): Promise<string> {
  const queue = getQueue();
  return queue.addJob({
    type: 'notification',
    priority,
    data
  });
}

export async function getJobStatus(jobId: string) {
  const queue = getQueue();
  return queue.getJobStatus(jobId);
}

export function getQueueMetrics() {
  const queue = getQueue();
  return queue.getMetrics();
}

export function getQueueStatus() {
  const queue = getQueue();
  return queue.getQueueStatus();
}

// Graceful shutdown
process.on('SIGINT', async () => {
  if (globalQueue) {
    await globalQueue.stop();
  }
});

process.on('SIGTERM', async () => {
  if (globalQueue) {
    await globalQueue.stop();
  }
});

