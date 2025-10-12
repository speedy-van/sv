/**
 * Real-time Performance Monitor Dashboard
 * 
 * React component for monitoring API performance metrics,
 * cache hit rates, and system optimization status
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  Zap, 
  Database, 
  Server, 
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  Gauge
} from 'lucide-react';

interface PerformanceMetrics {
  totalRequests: number;
  averageResponseTime: number;
  cacheHitRate: number;
  errorRate: number;
  endpointStats: Record<string, {
    requests: number;
    averageResponseTime: number;
    cacheHitRate: number;
    errorRate: number;
  }>;
}

interface OptimizationSuggestion {
  endpoint: string;
  issue: string;
  suggestion: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

const PerformanceMonitorDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [suggestions, setSuggestions] = useState<OptimizationSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [timeframe, setTimeframe] = useState<'hour' | 'day' | 'week'>('hour');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch performance data
  const fetchPerformanceData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/performance/routes?endpoint=analytics&timeframe=${timeframe}`);
      const data = await response.json();
      
      if (data.success) {
        setMetrics(data.data.performance);
        setSuggestions(data.data.optimizationSuggestions);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('Failed to fetch performance data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [timeframe]);

  // Clear cache
  const clearCache = async (pattern?: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/performance/routes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'clear_cache',
          pattern
        })
      });
      
      if (response.ok) {
        await fetchPerformanceData();
      }
    } catch (error) {
      console.error('Failed to clear cache:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Optimize database
  const optimizeDatabase = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/performance/routes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'optimize_database'
        })
      });
      
      if (response.ok) {
        await fetchPerformanceData();
      }
    } catch (error) {
      console.error('Failed to optimize database:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-refresh
  useEffect(() => {
    fetchPerformanceData();
    
    if (autoRefresh) {
      const interval = setInterval(fetchPerformanceData, 30000); // 30 seconds
      return () => clearInterval(interval);
    }
  }, [fetchPerformanceData, autoRefresh]);

  // Performance grade helper
  const getPerformanceGrade = (responseTime: number): { grade: string; color: string } => {
    if (responseTime <= 200) return { grade: 'A', color: 'text-green-600' };
    if (responseTime <= 500) return { grade: 'B', color: 'text-blue-600' };
    if (responseTime <= 1000) return { grade: 'C', color: 'text-yellow-600' };
    if (responseTime <= 2000) return { grade: 'D', color: 'text-orange-600' };
    return { grade: 'F', color: 'text-red-600' };
  };

  // Priority color helper
  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                API Performance Monitor
              </CardTitle>
              <CardDescription>
                Real-time monitoring of multi-drop route API performance
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                {(['hour', 'day', 'week'] as const).map(tf => (
                  <Button
                    key={tf}
                    variant={timeframe === tf ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTimeframe(tf)}
                  >
                    {tf === 'hour' ? '1H' : tf === 'day' ? '24H' : '7D'}
                  </Button>
                ))}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
                {autoRefresh ? 'Auto' : 'Manual'}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchPerformanceData()}
                disabled={isLoading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Performance Overview */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Total Requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalRequests.toLocaleString()}</div>
              <div className="text-sm text-gray-500 mt-1">
                Last {timeframe === 'hour' ? 'hour' : timeframe === 'day' ? '24 hours' : 'week'}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Gauge className="w-4 h-4" />
                Avg Response Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getPerformanceGrade(metrics.averageResponseTime).color}`}>
                {metrics.averageResponseTime}ms
              </div>
              <div className="flex items-center gap-1 mt-1">
                <Badge variant="outline" className="text-xs">
                  Grade {getPerformanceGrade(metrics.averageResponseTime).grade}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Cache Hit Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${
                metrics.cacheHitRate >= 80 ? 'text-green-600' :
                metrics.cacheHitRate >= 60 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {metrics.cacheHitRate.toFixed(1)}%
              </div>
              <div className="flex items-center gap-1 mt-1">
                {metrics.cacheHitRate >= 80 ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-yellow-600" />
                )}
                <span className="text-xs text-gray-500">
                  {metrics.cacheHitRate >= 80 ? 'Excellent' : metrics.cacheHitRate >= 60 ? 'Good' : 'Needs Improvement'}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Error Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${
                metrics.errorRate <= 1 ? 'text-green-600' :
                metrics.errorRate <= 5 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {metrics.errorRate.toFixed(1)}%
              </div>
              <div className="flex items-center gap-1 mt-1">
                {metrics.errorRate <= 1 ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : metrics.errorRate <= 5 ? (
                  <AlertTriangle className="w-4 h-4 text-yellow-600" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                )}
                <span className="text-xs text-gray-500">
                  {metrics.errorRate <= 1 ? 'Excellent' : metrics.errorRate <= 5 ? 'Acceptable' : 'Critical'}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Endpoint Performance */}
        {metrics && (
          <Card>
            <CardHeader>
              <CardTitle>Endpoint Performance</CardTitle>
              <CardDescription>Performance breakdown by API endpoint</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(metrics.endpointStats).map(([endpoint, stats]) => (
                  <div key={endpoint} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-medium text-sm">{endpoint}</span>
                      <Badge variant="outline" className="text-xs">
                        {stats.requests} requests
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Avg Time:</span>
                        <div className={`font-medium ${getPerformanceGrade(stats.averageResponseTime).color}`}>
                          {stats.averageResponseTime}ms
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-500">Cache Hit:</span>
                        <div className="font-medium">{stats.cacheHitRate.toFixed(1)}%</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Error Rate:</span>
                        <div className={`font-medium ${
                          stats.errorRate <= 1 ? 'text-green-600' : 
                          stats.errorRate <= 5 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {stats.errorRate.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Optimization Suggestions */}
        <Card>
          <CardHeader>
            <CardTitle>Optimization Suggestions</CardTitle>
            <CardDescription>Recommendations to improve API performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {suggestions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
                  No optimization suggestions at this time
                </div>
              ) : (
                suggestions.map((suggestion, index) => (
                  <div 
                    key={index}
                    className={`border rounded-lg p-4 ${getPriorityColor(suggestion.priority)}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-medium text-sm">{suggestion.endpoint}</span>
                      <Badge 
                        variant="outline"
                        className={`text-xs ${getPriorityColor(suggestion.priority)}`}
                      >
                        {suggestion.priority.toUpperCase()}
                      </Badge>
                    </div>
                    
                    <div className="text-sm mb-2">
                      <strong>Issue:</strong> {suggestion.issue}
                    </div>
                    
                    <div className="text-sm">
                      <strong>Suggestion:</strong> {suggestion.suggestion}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Actions</CardTitle>
          <CardDescription>Tools to optimize system performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              onClick={() => clearCache()}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <Zap className="w-4 h-4" />
              Clear All Cache
            </Button>
            
            <Button
              variant="outline"
              onClick={() => clearCache('routes')}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <Server className="w-4 h-4" />
              Clear Routes Cache
            </Button>
            
            <Button
              variant="outline"
              onClick={optimizeDatabase}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <Database className="w-4 h-4" />
              Optimize Database
            </Button>
          </div>
          
          {lastUpdate && (
            <div className="mt-4 text-sm text-gray-500 flex items-center gap-1">
              <Clock className="w-4 h-4" />
              Last updated: {lastUpdate.toLocaleTimeString()}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PerformanceMonitorDashboard;