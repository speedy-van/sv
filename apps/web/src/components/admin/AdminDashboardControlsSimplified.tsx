/**
 * Admin Dashboard Controls - Simplified Version
 * 
 * Real-time monitoring interface with emergency controls,
 * route intervention capabilities, and system health monitoring
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AlertTriangle, 
  Pause, 
  Radio, 
  Route, 
  Users, 
  Activity,
  RefreshCw,
  Bell,
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  TrendingUp,
  Settings
} from 'lucide-react';

interface AdminDashboardControlsProps {
  adminId: string;
  onEmergencyAction?: (action: string, result: any) => void;
}

interface RouteMonitoring {
  id: string;
  status: 'active' | 'delayed' | 'intervention_required';
  driverId: string;
  pickupLocation: string;
  dropoffLocation: string;
  estimatedArrival: Date;
  actualProgress: number;
  delayMinutes: number;
}

interface DriverMetrics {
  driverId: string;
  name: string;
  status: 'active' | 'offline' | 'emergency' | 'on_break';
  currentLocation: string;
  activeRoute: string | null;
  todayEarnings: number;
  todayDeliveries: number;
  avgDeliveryTime: number;
  customerRating: number;
  lastActive: Date;
}

interface SystemAlert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  message: string;
  acknowledged: boolean;
  timestamp: Date;
}

interface SystemHealthMetrics {
  api: { status: string; uptime: number; responseTime: number };
  database: { status: string; uptime: number; queryTime: number };
  websocket: { status: string; uptime: number; connections: number };
  infrastructure: { cpuUsage: number; memoryUsage: number; diskSpace: number };
}

const AdminDashboardControls: React.FC<AdminDashboardControlsProps> = ({
  adminId,
  onEmergencyAction
}) => {
  // State management
  const [activeSection, setActiveSection] = useState<string>('overview');
  const [routes, setRoutes] = useState<RouteMonitoring[]>([]);
  const [drivers, setDrivers] = useState<DriverMetrics[]>([]);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealthMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [emergencyMode, setEmergencyMode] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async (section: string = 'overview') => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/dashboard?section=${section}&realtime=true`);
      const data = await response.json();
      
      if (data.success) {
        switch (section) {
          case 'routes':
            setRoutes(data.data.routes || []);
            break;
          case 'drivers':
            setDrivers(data.data.drivers || []);
            break;
          case 'alerts':
            setAlerts(data.data.alerts || []);
            break;
          case 'system_health':
            setSystemHealth(data.data.health);
            break;
        }
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Execute emergency action (simplified)
  const executeEmergencyAction = async (action: string) => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/admin/dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          adminId,
          reason: `Emergency action executed from dashboard`
        })
      });

      const result = await response.json();
      
      if (result.success) {
        if (onEmergencyAction) {
          onEmergencyAction(action, result.data);
        }
        
        // Refresh data
        fetchDashboardData(activeSection);
        fetchDashboardData('alerts');
      } else {
        alert(`Emergency action failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Emergency action failed:', error);
      alert('Emergency action failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-refresh data
  useEffect(() => {
    fetchDashboardData(activeSection);
    
    // Set up auto-refresh every 30 seconds for real-time monitoring
    const interval = setInterval(() => {
      fetchDashboardData(activeSection);
    }, 30000);

    return () => clearInterval(interval);
  }, [activeSection, fetchDashboardData]);

  // Emergency Controls Panel
  const EmergencyControlsPanel = () => (
    <Card className="border-red-200 bg-red-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-700">
          <Shield className="w-5 h-5" />
          Emergency Controls
        </CardTitle>
        <CardDescription className="text-red-600">
          Critical system controls for emergency interventions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Button 
            variant={emergencyMode ? "destructive" : "outline"}
            className="w-full"
            onClick={() => executeEmergencyAction(emergencyMode ? 'resume_assignments' : 'pause_assignments')}
            disabled={isLoading}
          >
            <Pause className="w-4 h-4 mr-2" />
            {emergencyMode ? 'Resume' : 'Pause'} System
          </Button>
          
          <Button 
            variant="outline" 
            onClick={() => executeEmergencyAction('emergency_broadcast')}
            disabled={isLoading}
          >
            <Radio className="w-4 h-4 mr-2" />
            Broadcast
          </Button>
          
          <Button 
            variant="outline"
            onClick={() => fetchDashboardData(activeSection)}
            disabled={isLoading}
          >
            {isLoading ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Refresh
          </Button>

          <Button 
            variant="outline"
            onClick={() => executeEmergencyAction('system_maintenance')}
            disabled={isLoading}
          >
            <Settings className="w-4 h-4 mr-2" />
            Maintenance
          </Button>

          <Button variant="outline" disabled>
            <Bell className="w-4 h-4 mr-2" />
            Alerts ({alerts.filter(a => !a.acknowledged).length})
          </Button>
        </div>

        {lastUpdate && (
          <p className="text-sm text-gray-500">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </p>
        )}
      </CardContent>
    </Card>
  );

  // Route Monitoring View
  const RouteMonitoringView = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Routes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {routes.filter(r => r.status === 'active').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Delayed Routes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {routes.filter(r => r.status === 'delayed').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Need Intervention</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {routes.filter(r => r.status === 'intervention_required').length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Live Route Monitoring</CardTitle>
          <CardDescription>Real-time tracking of all active routes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {routes.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No active routes at the moment
              </div>
            ) : (
              routes.map(route => (
                <div 
                  key={route.id}
                  className={`p-4 border rounded-lg ${
                    route.status === 'intervention_required' ? 'border-red-300 bg-red-50' :
                    route.status === 'delayed' ? 'border-orange-300 bg-orange-50' :
                    'border-green-300 bg-green-50'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={
                            route.status === 'active' ? 'default' :
                            route.status === 'delayed' ? 'secondary' : 'destructive'
                          }
                        >
                          {route.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                        {route.delayMinutes > 0 && (
                          <Badge variant="outline" className="text-orange-600">
                            <Clock className="w-3 h-3 mr-1" />
                            {route.delayMinutes}min delay
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4" />
                        {route.pickupLocation} → {route.dropoffLocation}
                      </div>
                      
                      <div className="text-sm text-gray-500">
                        Driver: {route.driverId} | Progress: {route.actualProgress}%
                      </div>
                    </div>

                    {route.status === 'intervention_required' && (
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => executeEmergencyAction('route_reassignment')}
                        disabled={isLoading}
                      >
                        <AlertTriangle className="w-4 h-4 mr-2" />
                        Intervene
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Driver Performance View
  const DriverPerformanceView = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Drivers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {drivers.filter(d => d.status === 'active').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Offline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">
              {drivers.filter(d => d.status === 'offline').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">On Break</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {drivers.filter(d => d.status === 'on_break').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Emergency Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {drivers.filter(d => d.status === 'emergency').length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Driver Performance Metrics</CardTitle>
          <CardDescription>Real-time driver status and performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {drivers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No driver data available
              </div>
            ) : (
              drivers.map(driver => (
                <div 
                  key={driver.driverId}
                  className={`p-4 border rounded-lg ${
                    driver.status === 'emergency' ? 'border-red-300 bg-red-50' :
                    driver.status === 'active' ? 'border-green-300 bg-green-50' :
                    'border-gray-300 bg-gray-50'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{driver.name}</span>
                        <Badge 
                          variant={
                            driver.status === 'active' ? 'default' :
                            driver.status === 'emergency' ? 'destructive' :
                            driver.status === 'on_break' ? 'secondary' : 'outline'
                          }
                        >
                          {driver.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Today Earnings:</span>
                          <div className="font-medium">£{driver.todayEarnings.toFixed(2)}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Deliveries:</span>
                          <div className="font-medium">{driver.todayDeliveries}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Avg Time:</span>
                          <div className="font-medium">{driver.avgDeliveryTime}min</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Rating:</span>
                          <div className="font-medium">⭐ {driver.customerRating.toFixed(1)}</div>
                        </div>
                      </div>
                      
                      <div className="text-sm text-gray-500">
                        Location: {driver.currentLocation} | 
                        Last Active: {new Date(driver.lastActive).toLocaleTimeString()}
                      </div>
                    </div>

                    {driver.status === 'emergency' && (
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => executeEmergencyAction('emergency_broadcast')}
                        disabled={isLoading}
                      >
                        <Bell className="w-4 h-4 mr-2" />
                        Contact
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // System Health View
  const SystemHealthView = () => (
    <div className="space-y-4">
      {systemHealth ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Activity className="w-4 h-4" />
                API Health
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  {systemHealth.api.uptime > 99.5 ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-600" />
                  )}
                  <span className="font-medium">
                    {systemHealth.api.uptime > 99.5 ? 'Healthy' : 'Issues Detected'}
                  </span>
                </div>
                <div className="text-sm text-gray-500">
                  Uptime: {systemHealth.api.uptime}% | Response: {systemHealth.api.responseTime}ms
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Database
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  {systemHealth.database.uptime > 99.5 ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-600" />
                  )}
                  <span className="font-medium">
                    {systemHealth.database.uptime > 99.5 ? 'Healthy' : 'Issues Detected'}
                  </span>
                </div>
                <div className="text-sm text-gray-500">
                  Uptime: {systemHealth.database.uptime}% | Query: {systemHealth.database.queryTime}ms
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Infrastructure
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  {systemHealth.infrastructure.cpuUsage < 80 ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-orange-600" />
                  )}
                  <span className="font-medium">
                    {systemHealth.infrastructure.cpuUsage < 80 ? 'Healthy' : 'High Load'}
                  </span>
                </div>
                <div className="text-sm text-gray-500">
                  CPU: {systemHealth.infrastructure.cpuUsage}% | 
                  Memory: {systemHealth.infrastructure.memoryUsage}%
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-8 text-gray-500">
            Loading system health metrics...
          </CardContent>
        </Card>
      )}
    </div>
  );

  // Alerts View
  const AlertsView = () => (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>System Alerts</CardTitle>
          <CardDescription>Active alerts and notifications requiring attention</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {alerts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
                No active alerts
              </div>
            ) : (
              alerts.map(alert => (
                <div 
                  key={alert.id}
                  className={`p-4 border rounded-lg ${
                    alert.type === 'critical' ? 'border-red-300 bg-red-50' :
                    alert.type === 'warning' ? 'border-orange-300 bg-orange-50' :
                    'border-blue-300 bg-blue-50'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      <span>{alert.message}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={
                          alert.type === 'critical' ? 'destructive' :
                          alert.type === 'warning' ? 'secondary' : 'default'
                        }
                      >
                        {alert.type.toUpperCase()}
                      </Badge>
                      {!alert.acknowledged && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => executeEmergencyAction('acknowledge_alert')}
                          disabled={isLoading}
                        >
                          Acknowledge
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Emergency Controls Panel */}
      <EmergencyControlsPanel />

      {/* Main Dashboard Navigation */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'overview', label: 'Overview', icon: Activity },
              { key: 'routes', label: 'Routes', icon: Route },
              { key: 'drivers', label: 'Drivers', icon: Users },
              { key: 'system_health', label: 'System Health', icon: Activity },
              { key: 'alerts', label: 'Alerts', icon: Bell }
            ].map(({ key, label, icon: Icon }) => (
              <Button
                key={key}
                variant={activeSection === key ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveSection(key)}
                className="flex items-center gap-2"
              >
                <Icon className="w-4 h-4" />
                {label}
                {key === 'alerts' && alerts.filter(a => !a.acknowledged).length > 0 && (
                  <Badge variant="destructive" className="ml-1">
                    {alerts.filter(a => !a.acknowledged).length}
                  </Badge>
                )}
              </Button>
            ))}
          </div>
        </CardHeader>
      </Card>

      {/* Dashboard Content */}
      <div className="space-y-4">
        {activeSection === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium mb-4">Route Summary</h3>
              <RouteMonitoringView />
            </div>
            <div>
              <h3 className="text-lg font-medium mb-4">Driver Summary</h3>
              <DriverPerformanceView />
            </div>
          </div>
        )}

        {activeSection === 'routes' && <RouteMonitoringView />}
        {activeSection === 'drivers' && <DriverPerformanceView />}
        {activeSection === 'system_health' && <SystemHealthView />}
        {activeSection === 'alerts' && <AlertsView />}
      </div>
    </div>
  );
};

export default AdminDashboardControls;