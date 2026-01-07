'use client';

/**
 * B2B Main Dashboard Component
 * 
 * Enterprise-grade dashboard with real-time analytics, KPIs, and quick actions
 */

import React, { useState, useEffect } from 'react';
import {
  Building2,
  Package,
  Truck,
  Receipt,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Calendar,
  MapPin,
  Users,
  CreditCard,
  Zap,
  BarChart3,
  RefreshCw,
  Download,
  Filter,
  MoreHorizontal,
  Eye,
  FileText,
  ChevronRight,
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
import {
  B2BCard,
  B2BStatsCard,
  B2BSectionHeader,
  B2BButton,
  B2BStatusBadge,
  B2BProgress,
  B2BMetricRing,
} from './B2BDesignSystem';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

interface DashboardStats {
  totalBookings: number;
  activeShipments: number;
  pendingInvoices: number;
  totalSpent: number;
  apiCallsUsed: number;
  apiCallsLimit: number;
  avgDeliveryTime: number;
  onTimeRate: number;
}

interface RecentBooking {
  id: string;
  reference: string;
  status: 'pending' | 'in-transit' | 'delivered' | 'cancelled';
  pickup: string;
  delivery: string;
  date: string;
  amount: number;
}

interface ActiveShipment {
  id: string;
  reference: string;
  driver: string;
  vehicle: string;
  eta: string;
  progress: number;
  status: 'picking-up' | 'in-transit' | 'delivering';
}

// ============================================================================
// Mock Data
// ============================================================================

const mockStats: DashboardStats = {
  totalBookings: 1247,
  activeShipments: 23,
  pendingInvoices: 5,
  totalSpent: 45892.50,
  apiCallsUsed: 3420,
  apiCallsLimit: 5000,
  avgDeliveryTime: 2.4,
  onTimeRate: 96.8,
};

const mockRecentBookings: RecentBooking[] = [
  {
    id: '1',
    reference: 'SV-2024-001234',
    status: 'in-transit',
    pickup: 'London, EC1A 1BB',
    delivery: 'Manchester, M1 1AD',
    date: '2024-01-15T10:30:00',
    amount: 245.00,
  },
  {
    id: '2',
    reference: 'SV-2024-001235',
    status: 'delivered',
    pickup: 'Birmingham, B1 1AA',
    delivery: 'Leeds, LS1 1AA',
    date: '2024-01-15T09:00:00',
    amount: 189.50,
  },
  {
    id: '3',
    reference: 'SV-2024-001236',
    status: 'pending',
    pickup: 'Liverpool, L1 1AA',
    delivery: 'Sheffield, S1 1AA',
    date: '2024-01-15T14:00:00',
    amount: 156.00,
  },
  {
    id: '4',
    reference: 'SV-2024-001237',
    status: 'in-transit',
    pickup: 'Bristol, BS1 1AA',
    delivery: 'Cardiff, CF1 1AA',
    date: '2024-01-15T11:30:00',
    amount: 98.00,
  },
];

const mockActiveShipments: ActiveShipment[] = [
  {
    id: '1',
    reference: 'SV-2024-001234',
    driver: 'John Smith',
    vehicle: 'Large Van',
    eta: '14:30',
    progress: 65,
    status: 'in-transit',
  },
  {
    id: '2',
    reference: 'SV-2024-001237',
    driver: 'Mike Johnson',
    vehicle: 'Medium Van',
    eta: '15:45',
    progress: 35,
    status: 'picking-up',
  },
  {
    id: '3',
    reference: 'SV-2024-001238',
    driver: 'Sarah Williams',
    vehicle: 'Small Van',
    eta: '13:15',
    progress: 90,
    status: 'delivering',
  },
];

// ============================================================================
// Status Configurations
// ============================================================================

const bookingStatusConfig = {
  pending: { label: 'Pending', color: 'warning', icon: Clock },
  'in-transit': { label: 'In Transit', color: 'info', icon: Truck },
  delivered: { label: 'Delivered', color: 'success', icon: CheckCircle2 },
  cancelled: { label: 'Cancelled', color: 'danger', icon: AlertCircle },
};

const shipmentStatusConfig = {
  'picking-up': { label: 'Picking Up', color: 'bg-amber-500' },
  'in-transit': { label: 'In Transit', color: 'bg-blue-500' },
  delivering: { label: 'Delivering', color: 'bg-emerald-500' },
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

const formatDate = (date: string) => {
  return new Intl.DateTimeFormat('en-GB', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
};

// ============================================================================
// Sub Components
// ============================================================================

function QuickActions() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Button
        variant="outline"
        className="h-auto py-6 flex flex-col items-center gap-3 hover:bg-blue-50 hover:border-blue-200 dark:hover:bg-blue-950/50 transition-all group"
      >
        <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center group-hover:scale-110 transition-transform">
          <Package className="h-6 w-6 text-blue-600 dark:text-blue-400" />
        </div>
        <span className="font-medium text-sm">New Booking</span>
      </Button>
      <Button
        variant="outline"
        className="h-auto py-6 flex flex-col items-center gap-3 hover:bg-emerald-50 hover:border-emerald-200 dark:hover:bg-emerald-950/50 transition-all group"
      >
        <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center group-hover:scale-110 transition-transform">
          <FileText className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
        </div>
        <span className="font-medium text-sm">Request Quote</span>
      </Button>
      <Button
        variant="outline"
        className="h-auto py-6 flex flex-col items-center gap-3 hover:bg-purple-50 hover:border-purple-200 dark:hover:bg-purple-950/50 transition-all group"
      >
        <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center group-hover:scale-110 transition-transform">
          <MapPin className="h-6 w-6 text-purple-600 dark:text-purple-400" />
        </div>
        <span className="font-medium text-sm">Track Shipment</span>
      </Button>
      <Button
        variant="outline"
        className="h-auto py-6 flex flex-col items-center gap-3 hover:bg-amber-50 hover:border-amber-200 dark:hover:bg-amber-950/50 transition-all group"
      >
        <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center group-hover:scale-110 transition-transform">
          <Download className="h-6 w-6 text-amber-600 dark:text-amber-400" />
        </div>
        <span className="font-medium text-sm">Download Report</span>
      </Button>
    </div>
  );
}

function ActiveShipmentsCard({ shipments }: { shipments: ActiveShipment[] }) {
  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div>
          <CardTitle className="text-lg">Active Shipments</CardTitle>
          <CardDescription>{shipments.length} shipments in progress</CardDescription>
        </div>
        <Button variant="ghost" size="sm" className="text-blue-600">
          View All <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {shipments.map((shipment) => (
          <div
            key={shipment.id}
            className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'w-2 h-2 rounded-full',
                    shipmentStatusConfig[shipment.status].color
                  )}
                />
                <span className="font-semibold text-sm">{shipment.reference}</span>
              </div>
              <Badge variant="outline" className="text-xs">
                ETA: {shipment.eta}
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400 mb-3">
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {shipment.driver}
              </span>
              <span className="flex items-center gap-1">
                <Truck className="h-4 w-4" />
                {shipment.vehicle}
              </span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Progress</span>
                <span className="font-medium">{shipment.progress}%</span>
              </div>
              <Progress value={shipment.progress} className="h-2" />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function RecentBookingsCard({ bookings }: { bookings: RecentBooking[] }) {
  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div>
          <CardTitle className="text-lg">Recent Bookings</CardTitle>
          <CardDescription>Latest booking activity</CardDescription>
        </div>
        <Button variant="ghost" size="sm" className="text-blue-600">
          View All <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {bookings.map((booking) => {
            const StatusIcon = bookingStatusConfig[booking.status].icon;
            return (
              <div
                key={booking.id}
                className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={cn(
                      'w-10 h-10 rounded-xl flex items-center justify-center',
                      booking.status === 'delivered' && 'bg-emerald-100 text-emerald-600',
                      booking.status === 'in-transit' && 'bg-blue-100 text-blue-600',
                      booking.status === 'pending' && 'bg-amber-100 text-amber-600',
                      booking.status === 'cancelled' && 'bg-red-100 text-red-600'
                    )}
                  >
                    <StatusIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{booking.reference}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {booking.pickup} → {booking.delivery}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-sm">{formatCurrency(booking.amount)}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {formatDate(booking.date)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function PerformanceMetrics({ stats }: { stats: DashboardStats }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Performance Metrics</CardTitle>
        <CardDescription>Key performance indicators this month</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <B2BMetricRing
            value={stats.onTimeRate}
            label="On-Time Delivery"
            variant="success"
          />
          <B2BMetricRing
            value={(stats.apiCallsUsed / stats.apiCallsLimit) * 100}
            label="API Usage"
            variant="primary"
          />
          <B2BMetricRing
            value={85}
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

function SpendingOverview({ stats }: { stats: DashboardStats }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg">Spending Overview</CardTitle>
          <CardDescription>Monthly spend analysis</CardDescription>
        </div>
        <Select defaultValue="month">
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="quarter">This Quarter</SelectItem>
            <SelectItem value="year">This Year</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <div className="h-64 flex items-center justify-center bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
          <div className="text-center">
            <BarChart3 className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
            <p className="text-slate-500 dark:text-slate-400">
              Spending chart visualization
            </p>
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
              Total: {formatCurrency(stats.totalSpent)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Main Dashboard Component
// ============================================================================

export default function B2BMainDashboard() {
  const [stats, setStats] = useState<DashboardStats>(mockStats);
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>(mockRecentBookings);
  const [activeShipments, setActiveShipments] = useState<ActiveShipment[]>(mockActiveShipments);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState('today');

  const refreshData = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 1000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Welcome back, Company Name
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Here's what's happening with your shipments today
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-40">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
            </SelectContent>
          </Select>
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

      {/* Quick Actions */}
      <QuickActions />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <B2BStatsCard
          title="Total Bookings"
          value={stats.totalBookings.toLocaleString()}
          change={12.5}
          changeLabel="vs last month"
          trend="up"
          icon={<Package className="h-5 w-5" />}
          variant="primary"
          sparkline={[30, 40, 35, 50, 49, 60, 70, 91, 85]}
        />
        <B2BStatsCard
          title="Active Shipments"
          value={stats.activeShipments.toString()}
          change={8}
          changeLabel="vs yesterday"
          trend="up"
          icon={<Truck className="h-5 w-5" />}
          variant="success"
          sparkline={[20, 30, 25, 40, 35, 45, 40, 50, 55]}
        />
        <B2BStatsCard
          title="Pending Invoices"
          value={formatCurrency(stats.pendingInvoices * 1250)}
          change={-5}
          changeLabel="vs last month"
          trend="down"
          icon={<Receipt className="h-5 w-5" />}
          variant="warning"
        />
        <B2BStatsCard
          title="Total Spent"
          value={formatCurrency(stats.totalSpent)}
          change={18.2}
          changeLabel="vs last month"
          trend="up"
          icon={<CreditCard className="h-5 w-5" />}
          variant="info"
        />
      </div>

      {/* API Usage Alert */}
      {stats.apiCallsUsed / stats.apiCallsLimit > 0.8 && (
        <Card className="border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30">
          <CardContent className="flex items-center justify-between py-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500 flex items-center justify-center text-white">
                <Zap className="h-6 w-6" />
              </div>
              <div>
                <p className="font-semibold text-amber-900 dark:text-amber-100">
                  API Usage Alert
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  You've used {Math.round((stats.apiCallsUsed / stats.apiCallsLimit) * 100)}% of your monthly API calls ({stats.apiCallsUsed.toLocaleString()} / {stats.apiCallsLimit.toLocaleString()})
                </p>
              </div>
            </div>
            <Button variant="outline" className="border-amber-500 text-amber-700 hover:bg-amber-100">
              Upgrade Plan
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ActiveShipmentsCard shipments={activeShipments} />
        <RecentBookingsCard bookings={recentBookings} />
      </div>

      {/* Performance & Spending */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PerformanceMetrics stats={stats} />
        <SpendingOverview stats={stats} />
      </div>
    </div>
  );
}
