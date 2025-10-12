/**
 * Admin Dashboard Controls Service
 * 
 * Step 6: Live monitoring dashboard with emergency controls, route intervention capabilities,
 * driver performance metrics, and system health monitoring
 */

import { z } from 'zod';

// Admin Dashboard Types and Interfaces
interface AdminDashboardState {
  systemStatus: SystemStatus;
  activeRoutes: RouteMonitoringData[];
  driverMetrics: DriverPerformanceMetrics[];
  emergencyControls: EmergencyControlsState;
  systemHealth: SystemHealthMetrics;
  alerts: SystemAlert[];
  interventions: RouteIntervention[];
}

interface SystemStatus {
  multiDropRoutingEnabled: boolean;
  emergencyMode: boolean;
  maintenanceMode: boolean;
  lastUpdated: Date;
  uptime: number;
  version: string;
  environment: 'production' | 'staging' | 'development';
}

interface RouteMonitoringData {
  routeId: string;
  driverId: string;
  driverName: string;
  status: 'active' | 'delayed' | 'completed' | 'emergency' | 'intervention_required';
  progress: {
    totalDrops: number;
    completedDrops: number;
    currentDrop: string | null;
    estimatedCompletion: Date;
    actualProgress: number; // 0-100%
  };
  performance: {
    onTimeRate: number;
    averageDeliveryTime: number;
    customerRating: number;
    issuesCount: number;
  };
  location: {
    latitude: number;
    longitude: number;
    lastUpdated: Date;
    accuracy: number;
  };
  timeline: RouteTimelineEvent[];
  alerts: RouteAlert[];
}

interface DriverPerformanceMetrics {
  driverId: string;
  driverName: string;
  status: 'active' | 'offline' | 'on_break' | 'emergency' | 'unavailable';
  currentRoute: string | null;
  todayMetrics: {
    routesCompleted: number;
    dropsCompleted: number;
    earnings: number;
    hoursWorked: number;
    averageRating: number;
    issuesReported: number;
  };
  realTimeStatus: {
    lastSeen: Date;
    location: { lat: number; lng: number } | null;
    batteryLevel: number | null;
    connectionQuality: 'excellent' | 'good' | 'poor' | 'disconnected';
  };
  workingHours: {
    startTime: Date | null;
    maxDailyHours: number;
    currentDailyHours: number;
    breaksDue: number;
    overtimeWarning: boolean;
  };
}

interface EmergencyControlsState {
  pauseNewAssignments: boolean;
  emergencyBroadcastActive: boolean;
  systemWideAlert: string | null;
  emergencyContacts: {
    supportTeam: boolean;
    managementTeam: boolean;
    technicalTeam: boolean;
  };
  activeEmergencies: EmergencyIncident[];
}

interface SystemHealthMetrics {
  api: {
    responseTime: { p50: number; p95: number; p99: number };
    errorRate: number;
    throughput: number;
    uptime: number;
  };
  database: {
    connectionPool: { active: number; idle: number; total: number };
    queryTime: { average: number; p95: number };
    lockWaitTime: number;
    uptime: number;
  };
  websocket: {
    activeConnections: number;
    messageLatency: number;
    reconnectionRate: number;
    uptime: number;
  };
  infrastructure: {
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
    networkLatency: number;
  };
}

interface SystemAlert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  category: 'performance' | 'safety' | 'system' | 'business';
  title: string;
  message: string;
  timestamp: Date;
  acknowledged: boolean;
  acknowledgedBy: string | null;
  resolvedAt: Date | null;
  affectedComponents: string[];
  actionRequired: boolean;
}

interface RouteIntervention {
  id: string;
  routeId: string;
  type: 'reassignment' | 'route_modification' | 'emergency_support' | 'customer_escalation';
  reason: string;
  initiatedBy: string;
  initiatedAt: Date;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  actions: InterventionAction[];
  resolution: string | null;
}

interface EmergencyIncident {
  id: string;
  type: 'driver_emergency' | 'system_failure' | 'security_breach' | 'operational_crisis';
  severity: 'low' | 'medium' | 'high' | 'critical';
  affectedDrivers: string[];
  affectedRoutes: string[];
  reportedBy: string;
  reportedAt: Date;
  status: 'reported' | 'acknowledged' | 'investigating' | 'resolved';
  responseTeam: string[];
  resolution: string | null;
}

// Admin Dashboard Controls Service
class AdminDashboardControlsService {
  private dashboardState!: AdminDashboardState;
  private websocketConnections: Map<string, WebSocket> = new Map();
  private alertHandlers: Map<string, Function> = new Map();
  
  constructor() {
    console.log('🎛️ Initializing Admin Dashboard Controls Service...');
    this.initializeDashboardState();
    this.setupAlertHandlers();
  }

  /**
   * Get real-time dashboard state
   */
  async getDashboardState(): Promise<AdminDashboardState> {
    await this.refreshDashboardData();
    return this.dashboardState;
  }

  /**
   * Emergency Controls - Pause all new route assignments
   */
  async pauseNewAssignments(reason: string, adminId: string): Promise<{success: boolean; message: string}> {
    try {
      console.log(`🚨 EMERGENCY: Pausing new assignments - Reason: ${reason}`);
      
      this.dashboardState.emergencyControls.pauseNewAssignments = true;
      this.dashboardState.systemStatus.emergencyMode = true;
      
      // Create system alert
      const alert: SystemAlert = {
        id: `alert_${Date.now()}`,
        type: 'critical',
        category: 'system',
        title: 'New Assignments PAUSED',
        message: `All new route assignments have been paused. Reason: ${reason}`,
        timestamp: new Date(),
        acknowledged: false,
        acknowledgedBy: null,
        resolvedAt: null,
        affectedComponents: ['route_assignment', 'booking_system'],
        actionRequired: true
      };
      
      this.dashboardState.alerts.unshift(alert);
      
      // Broadcast to all drivers
      await this.broadcastEmergencyMessage(
        'System Notice: New route assignments temporarily paused. Current routes continue as normal.',
        'active_drivers'
      );
      
      // Log intervention
      await this.logSystemIntervention({
        type: 'system_pause',
        reason,
        adminId,
        timestamp: new Date()
      });
      
      return {
        success: true,
        message: 'New assignments paused successfully. Active routes continue normally.'
      };
      
    } catch (error) {
      console.error('❌ Failed to pause new assignments:', error);
      return {
        success: false,
        message: `Failed to pause assignments: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Emergency Controls - Resume new route assignments
   */
  async resumeNewAssignments(adminId: string): Promise<{success: boolean; message: string}> {
    try {
      console.log('✅ Resuming new route assignments...');
      
      this.dashboardState.emergencyControls.pauseNewAssignments = false;
      this.dashboardState.systemStatus.emergencyMode = false;
      
      // Create system alert
      const alert: SystemAlert = {
        id: `alert_${Date.now()}`,
        type: 'info',
        category: 'system',
        title: 'New Assignments RESUMED',
        message: 'Route assignment system has been restored to normal operation.',
        timestamp: new Date(),
        acknowledged: false,
        acknowledgedBy: null,
        resolvedAt: null,
        affectedComponents: ['route_assignment', 'booking_system'],
        actionRequired: false
      };
      
      this.dashboardState.alerts.unshift(alert);
      
      // Broadcast to all drivers
      await this.broadcastEmergencyMessage(
        'System Restored: Route assignment system is now operating normally.',
        'active_drivers'
      );
      
      return {
        success: true,
        message: 'New assignments resumed successfully. System restored to normal operation.'
      };
      
    } catch (error) {
      console.error('❌ Failed to resume new assignments:', error);
      return {
        success: false,
        message: `Failed to resume assignments: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Route Intervention - Emergency route reassignment
   */
  async emergencyRouteReassignment(
    routeId: string,
    newDriverId: string,
    reason: string,
    adminId: string
  ): Promise<{success: boolean; message: string; interventionId?: string}> {
    try {
      console.log(`🔄 Emergency route reassignment: ${routeId} -> Driver ${newDriverId}`);
      
      const intervention: RouteIntervention = {
        id: `intervention_${Date.now()}`,
        routeId,
        type: 'reassignment',
        reason,
        initiatedBy: adminId,
        initiatedAt: new Date(),
        status: 'in_progress',
        actions: [
          {
            type: 'remove_from_current_driver',
            timestamp: new Date(),
            status: 'pending'
          },
          {
            type: 'assign_to_new_driver',
            targetDriverId: newDriverId,
            timestamp: new Date(),
            status: 'pending'
          }
        ],
        resolution: null
      };
      
      this.dashboardState.interventions.unshift(intervention);
      
      // Execute reassignment
      const reassignmentResult = await this.executeRouteReassignment(routeId, newDriverId);
      
      if (reassignmentResult.success) {
        intervention.status = 'completed';
        intervention.resolution = `Successfully reassigned to driver ${newDriverId}`;
        
        // Update route monitoring data
        const routeData = this.dashboardState.activeRoutes.find(r => r.routeId === routeId);
        if (routeData) {
          routeData.driverId = newDriverId;
          routeData.status = 'active';
          routeData.alerts = routeData.alerts.filter(a => a.type !== 'emergency');
        }
        
        return {
          success: true,
          message: `Route successfully reassigned to driver ${newDriverId}`,
          interventionId: intervention.id
        };
      } else {
        intervention.status = 'failed';
        intervention.resolution = `Reassignment failed: Unknown error`;
        
        return {
          success: false,
          message: `Route reassignment failed: Unknown error`
        };
      }
      
    } catch (error) {
      console.error('❌ Emergency route reassignment failed:', error);
      return {
        success: false,
        message: `Route reassignment failed: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Driver Performance Monitoring - Get real-time driver metrics
   */
  async getDriverPerformanceMetrics(driverId?: string): Promise<DriverPerformanceMetrics[]> {
    if (driverId) {
      const driver = this.dashboardState.driverMetrics.find(d => d.driverId === driverId);
      return driver ? [driver] : [];
    }
    
    return this.dashboardState.driverMetrics;
  }

  /**
   * System Health Monitoring - Get current system health status
   */
  async getSystemHealthMetrics(): Promise<SystemHealthMetrics> {
    // Refresh health metrics
    await this.refreshSystemHealthMetrics();
    return this.dashboardState.systemHealth;
  }

  /**
   * Alert Management - Acknowledge system alert
   */
  async acknowledgeAlert(alertId: string, adminId: string): Promise<{success: boolean; message: string}> {
    try {
      const alert = this.dashboardState.alerts.find(a => a.id === alertId);
      
      if (!alert) {
        return { success: false, message: 'Alert not found' };
      }
      
      alert.acknowledged = true;
      alert.acknowledgedBy = adminId;
      
      console.log(`✅ Alert ${alertId} acknowledged by ${adminId}`);
      
      return { success: true, message: 'Alert acknowledged successfully' };
      
    } catch (error) {
      return { success: false, message: `Failed to acknowledge alert: ${error instanceof Error ? error.message : String(error)}` };
    }
  }

  /**
   * Emergency Communication - Broadcast message to drivers
   */
  async broadcastEmergencyMessage(
    message: string,
    target: 'all_drivers' | 'active_drivers' | 'specific_drivers',
    driverIds?: string[]
  ): Promise<{success: boolean; delivered: number; failed: number}> {
    try {
      console.log(`📢 Broadcasting emergency message: "${message}"`);
      
      let targetDrivers: string[] = [];
      
      switch (target) {
        case 'all_drivers':
          targetDrivers = this.dashboardState.driverMetrics.map(d => d.driverId);
          break;
        case 'active_drivers':
          targetDrivers = this.dashboardState.driverMetrics
            .filter(d => d.status === 'active')
            .map(d => d.driverId);
          break;
        case 'specific_drivers':
          targetDrivers = driverIds || [];
          break;
      }
      
      let delivered = 0;
      let failed = 0;
      
      for (const driverId of targetDrivers) {
        try {
          await this.sendDriverMessage(driverId, {
            type: 'emergency_broadcast',
            message,
            priority: 'high',
            timestamp: new Date()
          });
          delivered++;
        } catch (error) {
          console.error(`Failed to deliver message to driver ${driverId}:`, error);
          failed++;
        }
      }
      
      return { success: true, delivered, failed };
      
    } catch (error) {
      console.error('❌ Emergency broadcast failed:', error);
      return { success: false, delivered: 0, failed: 0 };
    }
  }

  /**
   * Live Route Monitoring - Get real-time route status
   */
  async getLiveRouteMonitoring(routeId?: string): Promise<RouteMonitoringData[]> {
    await this.refreshRouteMonitoringData();
    
    if (routeId) {
      const route = this.dashboardState.activeRoutes.find(r => r.routeId === routeId);
      return route ? [route] : [];
    }
    
    return this.dashboardState.activeRoutes;
  }

  /**
   * Performance Analytics - Generate dashboard analytics
   */
  async generateDashboardAnalytics(timeframe: '1h' | '24h' | '7d' | '30d' = '24h') {
    return {
      timeframe,
      generatedAt: new Date(),
      summary: {
        totalActiveRoutes: this.dashboardState.activeRoutes.length,
        averageRouteCompletion: this.calculateAverageRouteCompletion(),
        systemHealth: this.calculateOverallSystemHealth(),
        driverPerformance: this.calculateAverageDriverPerformance(),
        alertsSummary: this.summarizeAlerts()
      },
      trends: {
        routeCompletionTrend: 'improving',
        driverPerformanceTrend: 'stable',
        systemHealthTrend: 'excellent',
        customerSatisfactionTrend: 'improving'
      },
      recommendations: this.generateActionableRecommendations(),
      criticalMetrics: {
        routesAtRisk: this.identifyRoutesAtRisk(),
        driversNeedingSupport: this.identifyDriversNeedingSupport(),
        systemBottlenecks: this.identifySystemBottlenecks()
      }
    };
  }

  // Helper Methods
  private initializeDashboardState(): void {
    this.dashboardState = {
      systemStatus: {
        multiDropRoutingEnabled: true,
        emergencyMode: false,
        maintenanceMode: false,
        lastUpdated: new Date(),
        uptime: 99.95,
        version: '2.1.0',
        environment: 'production'
      },
      activeRoutes: [],
      driverMetrics: [],
      emergencyControls: {
        pauseNewAssignments: false,
        emergencyBroadcastActive: false,
        systemWideAlert: null,
        emergencyContacts: {
          supportTeam: false,
          managementTeam: false,
          technicalTeam: false
        },
        activeEmergencies: []
      },
      systemHealth: {
        api: { responseTime: { p50: 120, p95: 250, p99: 500 }, errorRate: 0.02, throughput: 150, uptime: 99.98 },
        database: { connectionPool: { active: 8, idle: 12, total: 20 }, queryTime: { average: 45, p95: 120 }, lockWaitTime: 5, uptime: 99.99 },
        websocket: { activeConnections: 245, messageLatency: 85, reconnectionRate: 0.01, uptime: 99.96 },
        infrastructure: { cpuUsage: 45, memoryUsage: 62, diskUsage: 78, networkLatency: 12 }
      },
      alerts: [],
      interventions: []
    };
  }

  private setupAlertHandlers(): void {
    // Setup automated alert detection
    setInterval(() => {
      this.checkPerformanceAlerts();
      this.checkSafetyAlerts();
      this.checkSystemHealthAlerts();
    }, 30000); // Check every 30 seconds
  }

  private async refreshDashboardData(): Promise<void> {
    // In a real implementation, this would fetch from database and APIs
    console.log('🔄 Refreshing dashboard data...');
    
    // Mock data refresh
    this.dashboardState.systemStatus.lastUpdated = new Date();
    await this.refreshRouteMonitoringData();
    await this.refreshDriverMetrics();
    await this.refreshSystemHealthMetrics();
  }

  private async refreshRouteMonitoringData(): Promise<void> {
    // Mock implementation - in reality, fetch from database
    this.dashboardState.activeRoutes = this.generateMockActiveRoutes();
  }

  private async refreshDriverMetrics(): Promise<void> {
    // Mock implementation - in reality, fetch from database
    this.dashboardState.driverMetrics = this.generateMockDriverMetrics();
  }

  private async refreshSystemHealthMetrics(): Promise<void> {
    // Mock system health metrics with realistic variations
    const health = this.dashboardState.systemHealth;
    
    // Simulate realistic metric variations
    health.api.responseTime.p95 += Math.random() * 20 - 10;
    health.database.queryTime.average += Math.random() * 10 - 5;
    health.websocket.messageLatency += Math.random() * 10 - 5;
    health.infrastructure.cpuUsage += Math.random() * 10 - 5;
  }

  private generateMockActiveRoutes(): RouteMonitoringData[] {
    const routes: RouteMonitoringData[] = [];
    
    for (let i = 1; i <= 15; i++) {
      const progress = Math.random() * 100;
      const totalDrops = Math.floor(Math.random() * 8) + 3; // 3-10 drops
      const completedDrops = Math.floor((progress / 100) * totalDrops);
      
      routes.push({
        routeId: `route_${i.toString().padStart(3, '0')}`,
        driverId: `driver_${i.toString().padStart(3, '0')}`,
        driverName: `Driver ${i}`,
        status: this.randomRouteStatus(),
        progress: {
          totalDrops,
          completedDrops,
          currentDrop: completedDrops < totalDrops ? `drop_${completedDrops + 1}` : null,
          estimatedCompletion: new Date(Date.now() + (100 - progress) * 2 * 60000),
          actualProgress: progress
        },
        performance: {
          onTimeRate: 0.85 + Math.random() * 0.15,
          averageDeliveryTime: 20 + Math.random() * 15,
          customerRating: 4.2 + Math.random() * 0.8,
          issuesCount: Math.floor(Math.random() * 3)
        },
        location: {
          latitude: 24.7136 + (Math.random() - 0.5) * 0.1,
          longitude: 46.6753 + (Math.random() - 0.5) * 0.1,
          lastUpdated: new Date(Date.now() - Math.random() * 300000),
          accuracy: 2 + Math.random() * 8
        },
        timeline: [],
        alerts: []
      });
    }
    
    return routes;
  }

  private generateMockDriverMetrics(): DriverPerformanceMetrics[] {
    const drivers: DriverPerformanceMetrics[] = [];
    
    for (let i = 1; i <= 25; i++) {
      drivers.push({
        driverId: `driver_${i.toString().padStart(3, '0')}`,
        driverName: `Driver ${i}`,
        status: this.randomDriverStatus(),
        currentRoute: Math.random() > 0.3 ? `route_${Math.floor(Math.random() * 15) + 1}` : null,
        todayMetrics: {
          routesCompleted: Math.floor(Math.random() * 5),
          dropsCompleted: Math.floor(Math.random() * 30),
          earnings: Math.random() * 400 + 100,
          hoursWorked: Math.random() * 8,
          averageRating: 4.0 + Math.random() * 1.0,
          issuesReported: Math.floor(Math.random() * 3)
        },
        realTimeStatus: {
          lastSeen: new Date(Date.now() - Math.random() * 600000),
          location: Math.random() > 0.1 ? {
            lat: 24.7136 + (Math.random() - 0.5) * 0.1,
            lng: 46.6753 + (Math.random() - 0.5) * 0.1
          } : null,
          batteryLevel: Math.floor(Math.random() * 100),
          connectionQuality: this.randomConnectionQuality()
        },
        workingHours: {
          startTime: Math.random() > 0.2 ? new Date(Date.now() - Math.random() * 8 * 60 * 60 * 1000) : null,
          maxDailyHours: 10,
          currentDailyHours: Math.random() * 8,
          breaksDue: Math.floor(Math.random() * 2),
          overtimeWarning: Math.random() < 0.1
        }
      });
    }
    
    return drivers;
  }

  private randomRouteStatus(): RouteMonitoringData['status'] {
    const statuses: RouteMonitoringData['status'][] = ['active', 'delayed', 'completed', 'emergency', 'intervention_required'];
    const weights = [0.7, 0.15, 0.1, 0.03, 0.02]; // Weighted probabilities
    
    const random = Math.random();
    let cumulative = 0;
    
    for (let i = 0; i < statuses.length; i++) {
      cumulative += weights[i];
      if (random <= cumulative) return statuses[i];
    }
    
    return 'active';
  }

  private randomDriverStatus(): DriverPerformanceMetrics['status'] {
    const statuses: DriverPerformanceMetrics['status'][] = ['active', 'offline', 'on_break', 'emergency', 'unavailable'];
    const weights = [0.6, 0.2, 0.15, 0.02, 0.03];
    
    const random = Math.random();
    let cumulative = 0;
    
    for (let i = 0; i < statuses.length; i++) {
      cumulative += weights[i];
      if (random <= cumulative) return statuses[i];
    }
    
    return 'active';
  }

  private randomConnectionQuality(): DriverPerformanceMetrics['realTimeStatus']['connectionQuality'] {
    const qualities: DriverPerformanceMetrics['realTimeStatus']['connectionQuality'][] = ['excellent', 'good', 'poor', 'disconnected'];
    const weights = [0.5, 0.3, 0.15, 0.05];
    
    const random = Math.random();
    let cumulative = 0;
    
    for (let i = 0; i < qualities.length; i++) {
      cumulative += weights[i];
      if (random <= cumulative) return qualities[i];
    }
    
    return 'good';
  }

  private async executeRouteReassignment(routeId: string, newDriverId: string) {
    // Mock implementation
    console.log(`🔄 Executing route reassignment: ${routeId} -> ${newDriverId}`);
    
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate processing
    
    return { success: true };
  }

  private async sendDriverMessage(driverId: string, message: any) {
    // Mock WebSocket message sending
    console.log(`📱 Sending message to driver ${driverId}:`, message.type);
    
    await new Promise(resolve => setTimeout(resolve, 100)); // Simulate network delay
  }

  private async logSystemIntervention(intervention: any) {
    console.log('📝 Logging system intervention:', intervention);
  }

  private checkPerformanceAlerts(): void {
    // Check for performance-related alerts
    const health = this.dashboardState.systemHealth;
    
    if (health.api.responseTime.p95 > 400) {
      this.createAlert('warning', 'performance', 'High API Response Time', 
        `API P95 response time is ${health.api.responseTime.p95}ms (threshold: 400ms)`);
    }
    
    if (health.database.queryTime.average > 100) {
      this.createAlert('warning', 'performance', 'Slow Database Queries',
        `Database query time is ${health.database.queryTime.average}ms (threshold: 100ms)`);
    }
  }

  private checkSafetyAlerts(): void {
    // Check for safety-related alerts
    const emergencyDrivers = this.dashboardState.driverMetrics.filter(d => d.status === 'emergency');
    
    if (emergencyDrivers.length > 0) {
      this.createAlert('critical', 'safety', 'Driver Emergency Detected',
        `${emergencyDrivers.length} driver(s) have reported emergencies`);
    }
  }

  private checkSystemHealthAlerts(): void {
    // Check for system health alerts
    const health = this.dashboardState.systemHealth;
    
    if (health.infrastructure.cpuUsage > 80) {
      this.createAlert('warning', 'system', 'High CPU Usage',
        `CPU usage is ${health.infrastructure.cpuUsage}% (threshold: 80%)`);
    }
    
    if (health.websocket.reconnectionRate > 0.05) {
      this.createAlert('warning', 'system', 'High WebSocket Reconnection Rate',
        `WebSocket reconnection rate is ${(health.websocket.reconnectionRate * 100).toFixed(2)}% (threshold: 5%)`);
    }
  }

  private createAlert(type: SystemAlert['type'], category: SystemAlert['category'], title: string, message: string): void {
    // Check if similar alert already exists
    const existingAlert = this.dashboardState.alerts.find(a => 
      a.title === title && !a.acknowledged && a.type === type
    );
    
    if (existingAlert) {
      existingAlert.timestamp = new Date(); // Update timestamp
      return;
    }
    
    const alert: SystemAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      category,
      title,
      message,
      timestamp: new Date(),
      acknowledged: false,
      acknowledgedBy: null,
      resolvedAt: null,
      affectedComponents: [category],
      actionRequired: type === 'critical'
    };
    
    this.dashboardState.alerts.unshift(alert);
    
    // Keep only last 50 alerts
    if (this.dashboardState.alerts.length > 50) {
      this.dashboardState.alerts = this.dashboardState.alerts.slice(0, 50);
    }
    
    console.log(`🚨 Alert created: ${type.toUpperCase()} - ${title}`);
  }

  // Analytics helper methods
  private calculateAverageRouteCompletion(): number {
    const routes = this.dashboardState.activeRoutes;
    if (routes.length === 0) return 0;
    
    const totalProgress = routes.reduce((sum, route) => sum + route.progress.actualProgress, 0);
    return totalProgress / routes.length;
  }

  private calculateOverallSystemHealth(): number {
    const health = this.dashboardState.systemHealth;
    
    const apiHealth = health.api.uptime;
    const dbHealth = health.database.uptime;
    const wsHealth = health.websocket.uptime;
    
    return (apiHealth + dbHealth + wsHealth) / 3;
  }

  private calculateAverageDriverPerformance(): number {
    const drivers = this.dashboardState.driverMetrics.filter(d => d.status === 'active');
    if (drivers.length === 0) return 0;
    
    const totalRating = drivers.reduce((sum, driver) => sum + driver.todayMetrics.averageRating, 0);
    return totalRating / drivers.length;
  }

  private summarizeAlerts() {
    const alerts = this.dashboardState.alerts;
    
    return {
      total: alerts.length,
      critical: alerts.filter(a => a.type === 'critical' && !a.acknowledged).length,
      warning: alerts.filter(a => a.type === 'warning' && !a.acknowledged).length,
      info: alerts.filter(a => a.type === 'info' && !a.acknowledged).length,
      acknowledged: alerts.filter(a => a.acknowledged).length
    };
  }

  private generateActionableRecommendations(): string[] {
    const recommendations: string[] = [];
    const health = this.dashboardState.systemHealth;
    
    if (health.api.responseTime.p95 > 300) {
      recommendations.push('Consider API performance optimization or scaling');
    }
    
    if (health.infrastructure.cpuUsage > 70) {
      recommendations.push('Monitor CPU usage trends and consider infrastructure scaling');
    }
    
    const delayedRoutes = this.dashboardState.activeRoutes.filter(r => r.status === 'delayed');
    if (delayedRoutes.length > 3) {
      recommendations.push('Investigate route optimization to reduce delays');
    }
    
    return recommendations;
  }

  private identifyRoutesAtRisk(): string[] {
    return this.dashboardState.activeRoutes
      .filter(route => route.status === 'delayed' || route.performance.onTimeRate < 0.8)
      .map(route => route.routeId);
  }

  private identifyDriversNeedingSupport(): string[] {
    return this.dashboardState.driverMetrics
      .filter(driver => 
        driver.todayMetrics.issuesReported > 2 || 
        driver.workingHours.overtimeWarning ||
        driver.realTimeStatus.connectionQuality === 'poor'
      )
      .map(driver => driver.driverId);
  }

  private identifySystemBottlenecks(): string[] {
    const bottlenecks: string[] = [];
    const health = this.dashboardState.systemHealth;
    
    if (health.api.responseTime.p95 > 400) bottlenecks.push('API response time');
    if (health.database.queryTime.average > 100) bottlenecks.push('Database performance');
    if (health.websocket.messageLatency > 200) bottlenecks.push('WebSocket latency');
    if (health.infrastructure.cpuUsage > 80) bottlenecks.push('CPU utilization');
    
    return bottlenecks;
  }
}

// Additional type definitions
interface RouteTimelineEvent {
  timestamp: Date;
  type: 'pickup' | 'delivery' | 'delay' | 'issue' | 'resolution';
  description: string;
  location?: { lat: number; lng: number };
}

interface RouteAlert {
  type: 'delay' | 'issue' | 'emergency' | 'customer_complaint';
  message: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high';
}

interface InterventionAction {
  type: string;
  timestamp: Date;
  status: 'pending' | 'completed' | 'failed';
  targetDriverId?: string;
  details?: any;
}

export { AdminDashboardControlsService, type AdminDashboardState, type RouteMonitoringData, type DriverPerformanceMetrics, type SystemAlert };