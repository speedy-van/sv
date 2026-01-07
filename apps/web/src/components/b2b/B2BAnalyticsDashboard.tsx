'use client';

/**
 * B2B Analytics Dashboard Component
 * 
 * Comprehensive analytics with charts, KPIs, and detailed reports
 */

import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Calendar,
  Download,
  RefreshCw,
  Package,
  Truck,
  Clock,
  CreditCard,
  MapPin,
  Users,
  Zap,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { B2BStatsCard, B2BMetricRing, B2BProgress } from './B2BDesignSystem';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

interface AnalyticsData {
  overview: {
    totalBookings: number;
    totalSpent: number;
    avgOrderValue: number;
    onTimeRate: number;
    bookingsTrend: number;
    spendTrend: number;
    aovTrend: number;
    onTimeTrend: number;
  };
  apiUsage: {
    used: number;
    limit: number;
    successRate: number;
    avgLatency: number;
  };
  topRoutes: Array<{
    from: string;
    to: string;
    count: number;
    percentage: number;
  }>;
  vehicleUsage: Array<{
    type: string;
    count: number;
    percentage: number;
    color: string;
  }>;
  monthlyData: Array<{
    month: string;
    bookings: number;
    spent: number;
  }>;
  weeklyData: Array<{
    day: string;
    bookings: number;
  }>;
}

// ============================================================================
// Mock Data
// ============================================================================

const mockAnalytics: AnalyticsData = {
  overview: {
    totalBookings: 1247,
    totalSpent: 45892.50,
    avgOrderValue: 185.40,
    onTimeRate: 96.8,
    bookingsTrend: 12.5,
    spendTrend: 18.2,
    aovTrend: 5.3,
    onTimeTrend: 2.1,
  },
  apiUsage: {
    used: 3420,
    limit: 5000,
    successRate: 99.2,
    avgLatency: 145,
  },
  topRoutes: [
    { from: 'London', to: 'Manchester', count: 234, percentage: 35 },
    { from: 'Birmingham', to: 'Leeds', count: 189, percentage: 28 },
    { from: 'Liverpool', to: 'Sheffield', count: 145, percentage: 22 },
    { from: 'Bristol', to: 'Cardiff', count: 98, percentage: 15 },
  ],
  vehicleUsage: [
    { type: 'Small Van', count: 425, percentage: 34, color: 'bg-blue-500' },
    { type: 'Medium Van', count: 387, percentage: 31, color: 'bg-emerald-500' },
    { type: 'Large Van', count: 298, percentage: 24, color: 'bg-amber-500' },
    { type: 'Luton Van', count: 137, percentage: 11, color: 'bg-purple-500' },
  ],
  monthlyData: [
    { month: 'Jan', bookings: 89, spent: 3245 },
    { month: 'Feb', bookings: 102, spent: 3890 },
    { month: 'Mar', bookings: 125, spent: 4567 },
    { month: 'Apr', bookings: 98, spent: 3654 },
    { month: 'May', bookings: 134, spent: 5123 },
    { month: 'Jun', bookings: 156, spent: 5876 },
    { month: 'Jul', bookings: 143, spent: 5432 },
    { month: 'Aug', bookings: 167, spent: 6234 },
    { month: 'Sep', bookings: 145, spent: 5567 },
    { month: 'Oct', bookings: 178, spent: 6789 },
    { month: 'Nov', bookings: 189, spent: 7234 },
    { month: 'Dec', bookings: 201, spent: 7654 },
  ],
  weeklyData: [
    { day: 'Mon', bookings: 45 },
    { day: 'Tue', bookings: 52 },
    { day: 'Wed', bookings: 48 },
    { day: 'Thu', bookings: 61 },
    { day: 'Fri', bookings: 58 },
    { day: 'Sat', bookings: 23 },
    { day: 'Sun', bookings: 12 },
  ],
};

// ============================================================================
// Helper Functions
// ============================================================================

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
  }).format(amount);
};

// ============================================================================
// Sub Components
// ============================================================================

function OverviewStats({ data }: { data: AnalyticsData['overview'] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <B2BStatsCard
        title="Total Bookings"
        value={data.totalBookings.toLocaleString()}
        change={data.bookingsTrend}
        changeLabel="vs last period"
        trend={data.bookingsTrend > 0 ? 'up' : 'down'}
        icon={<Package className="h-5 w-5" />}
        variant="primary"
      />
      <B2BStatsCard
        title="Total Spent"
        value={formatCurrency(data.totalSpent)}
        change={data.spendTrend}
        changeLabel="vs last period"
        trend={data.spendTrend > 0 ? 'up' : 'down'}
        icon={<CreditCard className="h-5 w-5" />}
        variant="success"
      />
      <B2BStatsCard
        title="Average Order Value"
        value={formatCurrency(data.avgOrderValue)}
        change={data.aovTrend}
        changeLabel="vs last period"
        trend={data.aovTrend > 0 ? 'up' : 'down'}
        icon={<TrendingUp className="h-5 w-5" />}
        variant="info"
      />
      <B2BStatsCard
        title="On-Time Delivery"
        value={`${data.onTimeRate}%`}
        change={data.onTimeTrend}
        changeLabel="vs last period"
        trend={data.onTimeTrend > 0 ? 'up' : 'down'}
        icon={<Clock className="h-5 w-5" />}
        variant="warning"
      />
    </div>
  );
}

function BookingsTrendChart({ data }: { data: AnalyticsData['monthlyData'] }) {
  const maxBookings = Math.max(...data.map(d => d.bookings));

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg">Bookings Trend</CardTitle>
        <CardDescription>Monthly booking volume over time</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-64 flex items-end gap-2">
          {data.map((item, index) => (
            <div key={item.month} className="flex-1 flex flex-col items-center gap-2">
              <div
                className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-lg transition-all hover:from-blue-700 hover:to-blue-500 cursor-pointer relative group"
                style={{ height: `${(item.bookings / maxBookings) * 100}%`, minHeight: '20px' }}
              >
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {item.bookings} bookings
                </div>
              </div>
              <span className="text-xs text-slate-500">{item.month}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function SpendingTrendChart({ data }: { data: AnalyticsData['monthlyData'] }) {
  const maxSpent = Math.max(...data.map(d => d.spent));

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg">Spending Trend</CardTitle>
        <CardDescription>Monthly spending over time</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-64 flex items-end gap-2">
          {data.map((item) => (
            <div key={item.month} className="flex-1 flex flex-col items-center gap-2">
              <div
                className="w-full bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-lg transition-all hover:from-emerald-700 hover:to-emerald-500 cursor-pointer relative group"
                style={{ height: `${(item.spent / maxSpent) * 100}%`, minHeight: '20px' }}
              >
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {formatCurrency(item.spent)}
                </div>
              </div>
              <span className="text-xs text-slate-500">{item.month}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function TopRoutesCard({ routes }: { routes: AnalyticsData['topRoutes'] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Top Routes</CardTitle>
        <CardDescription>Most frequently used delivery routes</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {routes.map((route, index) => (
          <div key={index} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-semibold">
                  {index + 1}
                </div>
                <span className="font-medium text-sm">
                  {route.from} → {route.to}
                </span>
              </div>
              <span className="text-sm text-slate-500">{route.count} bookings</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all"
                style={{ width: `${route.percentage}%` }}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function VehicleUsageCard({ usage }: { usage: AnalyticsData['vehicleUsage'] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Vehicle Usage</CardTitle>
        <CardDescription>Distribution by vehicle type</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center mb-6">
          <div className="relative w-40 h-40">
            <svg className="w-full h-full" viewBox="0 0 100 100">
              {usage.reduce((acc, item, index) => {
                const startAngle = acc.offset;
                const angle = (item.percentage / 100) * 360;
                const endAngle = startAngle + angle;
                
                const x1 = 50 + 40 * Math.cos((startAngle - 90) * Math.PI / 180);
                const y1 = 50 + 40 * Math.sin((startAngle - 90) * Math.PI / 180);
                const x2 = 50 + 40 * Math.cos((endAngle - 90) * Math.PI / 180);
                const y2 = 50 + 40 * Math.sin((endAngle - 90) * Math.PI / 180);
                
                const largeArc = angle > 180 ? 1 : 0;
                
                acc.paths.push(
                  <path
                    key={index}
                    d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`}
                    className={item.color}
                    opacity={0.9}
                  />
                );
                
                acc.offset = endAngle;
                return acc;
              }, { paths: [] as React.ReactNode[], offset: 0 }).paths}
              <circle cx="50" cy="50" r="25" className="fill-white dark:fill-slate-900" />
            </svg>
          </div>
        </div>
        <div className="space-y-3">
          {usage.map((item) => (
            <div key={item.type} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={cn('w-3 h-3 rounded-full', item.color)} />
                <span className="text-sm">{item.type}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">{item.count}</span>
                <span className="text-xs text-slate-500">({item.percentage}%)</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ApiUsageCard({ data }: { data: AnalyticsData['apiUsage'] }) {
  const usagePercentage = (data.used / data.limit) * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Zap className="h-5 w-5 text-amber-500" />
          API Usage
        </CardTitle>
        <CardDescription>Current billing period</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-sm text-slate-500">API Calls Used</span>
            <span className="text-sm font-semibold">
              {data.used.toLocaleString()} / {data.limit.toLocaleString()}
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3">
            <div
              className={cn(
                'h-3 rounded-full transition-all',
                usagePercentage > 80 ? 'bg-red-500' : usagePercentage > 60 ? 'bg-amber-500' : 'bg-blue-500'
              )}
              style={{ width: `${usagePercentage}%` }}
            />
          </div>
          <p className="text-xs text-slate-500 mt-2">
            {Math.round(usagePercentage)}% used • {(data.limit - data.used).toLocaleString()} remaining
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
            <p className="text-2xl font-bold text-emerald-600">{data.successRate}%</p>
            <p className="text-sm text-slate-500">Success Rate</p>
          </div>
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
            <p className="text-2xl font-bold text-blue-600">{data.avgLatency}ms</p>
            <p className="text-sm text-slate-500">Avg Latency</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function WeeklyPatternCard({ data }: { data: AnalyticsData['weeklyData'] }) {
  const maxBookings = Math.max(...data.map(d => d.bookings));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Weekly Pattern</CardTitle>
        <CardDescription>Booking distribution by day of week</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-4 h-40">
          {data.map((item) => (
            <div key={item.day} className="flex-1 flex flex-col items-center gap-2">
              <div
                className="w-full bg-gradient-to-t from-purple-600 to-purple-400 rounded-t-lg transition-all hover:from-purple-700 hover:to-purple-500 cursor-pointer relative group"
                style={{ height: `${(item.bookings / maxBookings) * 100}%`, minHeight: '10px' }}
              >
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                  {item.bookings}
                </div>
              </div>
              <span className="text-xs text-slate-500">{item.day}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function PerformanceKPIs() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Performance KPIs</CardTitle>
        <CardDescription>Key performance indicators</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <B2BMetricRing
            value={96.8}
            label="On-Time Rate"
            variant="success"
          />
          <B2BMetricRing
            value={98.5}
            label="Delivery Success"
            variant="primary"
          />
          <B2BMetricRing
            value={4.8}
            max={5}
            label="Customer Rating"
            variant="warning"
          />
          <B2BMetricRing
            value={92}
            label="SLA Compliance"
            variant="success"
          />
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function B2BAnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<AnalyticsData>(mockAnalytics);
  const [dateRange, setDateRange] = useState('month');
  const [loading, setLoading] = useState(false);

  const refreshData = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 1000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-blue-500" />
            Analytics
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Insights and performance metrics
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-40">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={refreshData}
            disabled={loading}
          >
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900">
            Overview
          </TabsTrigger>
          <TabsTrigger value="bookings" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900">
            Bookings
          </TabsTrigger>
          <TabsTrigger value="spending" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900">
            Spending
          </TabsTrigger>
          <TabsTrigger value="api" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900">
            API Usage
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <OverviewStats data={analytics.overview} />
          <PerformanceKPIs />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <BookingsTrendChart data={analytics.monthlyData} />
            <SpendingTrendChart data={analytics.monthlyData} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <TopRoutesCard routes={analytics.topRoutes} />
            <VehicleUsageCard usage={analytics.vehicleUsage} />
            <WeeklyPatternCard data={analytics.weeklyData} />
          </div>
        </TabsContent>

        <TabsContent value="bookings" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <B2BStatsCard
              title="Total Bookings"
              value={analytics.overview.totalBookings.toLocaleString()}
              change={analytics.overview.bookingsTrend}
              trend="up"
              icon={<Package className="h-5 w-5" />}
              variant="primary"
            />
            <B2BStatsCard
              title="Avg Daily Bookings"
              value="42"
              change={8.5}
              trend="up"
              icon={<Calendar className="h-5 w-5" />}
              variant="info"
            />
            <B2BStatsCard
              title="Repeat Bookings"
              value="78%"
              change={5.2}
              trend="up"
              icon={<Target className="h-5 w-5" />}
              variant="success"
            />
            <B2BStatsCard
              title="Cancellation Rate"
              value="1.8%"
              change={-0.5}
              trend="down"
              icon={<TrendingDown className="h-5 w-5" />}
              variant="warning"
            />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <BookingsTrendChart data={analytics.monthlyData} />
            <TopRoutesCard routes={analytics.topRoutes} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <VehicleUsageCard usage={analytics.vehicleUsage} />
            <WeeklyPatternCard data={analytics.weeklyData} />
          </div>
        </TabsContent>

        <TabsContent value="spending" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <B2BStatsCard
              title="Total Spent"
              value={formatCurrency(analytics.overview.totalSpent)}
              change={analytics.overview.spendTrend}
              trend="up"
              icon={<CreditCard className="h-5 w-5" />}
              variant="primary"
            />
            <B2BStatsCard
              title="Avg Order Value"
              value={formatCurrency(analytics.overview.avgOrderValue)}
              change={analytics.overview.aovTrend}
              trend="up"
              icon={<TrendingUp className="h-5 w-5" />}
              variant="success"
            />
            <B2BStatsCard
              title="Monthly Budget"
              value={formatCurrency(50000)}
              icon={<Target className="h-5 w-5" />}
              variant="info"
            />
            <B2BStatsCard
              title="Savings"
              value={formatCurrency(4250)}
              change={12}
              trend="up"
              icon={<Zap className="h-5 w-5" />}
              variant="warning"
            />
          </div>
          <SpendingTrendChart data={analytics.monthlyData} />
        </TabsContent>

        <TabsContent value="api" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <B2BStatsCard
              title="API Calls"
              value={analytics.apiUsage.used.toLocaleString()}
              changeLabel={`of ${analytics.apiUsage.limit.toLocaleString()}`}
              icon={<Zap className="h-5 w-5" />}
              variant="primary"
            />
            <B2BStatsCard
              title="Success Rate"
              value={`${analytics.apiUsage.successRate}%`}
              change={0.3}
              trend="up"
              icon={<Target className="h-5 w-5" />}
              variant="success"
            />
            <B2BStatsCard
              title="Avg Latency"
              value={`${analytics.apiUsage.avgLatency}ms`}
              change={-5}
              trend="down"
              icon={<Clock className="h-5 w-5" />}
              variant="info"
            />
            <B2BStatsCard
              title="Errors"
              value="12"
              changeLabel="this month"
              icon={<TrendingDown className="h-5 w-5" />}
              variant="warning"
            />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ApiUsageCard data={analytics.apiUsage} />
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">API Endpoints</CardTitle>
                <CardDescription>Usage by endpoint</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { endpoint: 'POST /bookings', calls: 1250, percentage: 37 },
                  { endpoint: 'GET /tracking', calls: 890, percentage: 26 },
                  { endpoint: 'GET /quotes', calls: 650, percentage: 19 },
                  { endpoint: 'POST /webhooks', calls: 430, percentage: 12 },
                  { endpoint: 'Other', calls: 200, percentage: 6 },
                ].map((item) => (
                  <div key={item.endpoint} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <code className="text-sm bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                        {item.endpoint}
                      </code>
                      <span className="text-sm text-slate-500">{item.calls.toLocaleString()} calls</span>
                    </div>
                    <Progress value={item.percentage} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
