'use client';

/**
 * Enhanced Admin B2B Companies Dashboard
 * 
 * Premium admin interface for managing B2B companies with advanced features
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Eye,
  Edit,
  Ban,
  CheckCircle,
  AlertTriangle,
  Clock,
  Users,
  Key,
  CreditCard,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Download,
  BarChart3,
  Activity,
  Zap,
  Globe,
  Shield,
  ArrowUpRight,
  ArrowDownRight,
  ChevronLeft,
  ChevronRight,
  Settings,
  Mail,
  Phone,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import CreateCompanyDialog from './CreateCompanyDialog';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

interface Company {
  id: string;
  name: string;
  legalName?: string;
  email?: string;
  phone?: string;
  industry?: string;
  status: 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'CLOSED';
  creditLimitGBP: number;
  currentBalanceGBP: number;
  createdAt: string;
  _count: {
    CompanyUser: number;
    CompanyBooking: number;
  };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface DashboardStats {
  total: number;
  active: number;
  pending: number;
  suspended: number;
  totalCredit: number;
  totalOutstanding: number;
  monthlyGrowth: number;
  avgBookingsPerCompany: number;
  apiCallsToday: number;
}

// ============================================================================
// Status Configuration
// ============================================================================

const statusConfig = {
  PENDING: { 
    label: 'Pending', 
    color: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800', 
    icon: Clock,
    dotColor: 'bg-amber-500',
  },
  ACTIVE: { 
    label: 'Active', 
    color: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800', 
    icon: CheckCircle,
    dotColor: 'bg-emerald-500',
  },
  SUSPENDED: { 
    label: 'Suspended', 
    color: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800', 
    icon: Ban,
    dotColor: 'bg-red-500',
  },
  CLOSED: { 
    label: 'Closed', 
    color: 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700', 
    icon: AlertTriangle,
    dotColor: 'bg-slate-500',
  },
};

// ============================================================================
// Helper Functions
// ============================================================================

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
  }).format(amount / 100);
};

const formatDate = (date: string) => {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date));
};

// ============================================================================
// Sub Components
// ============================================================================

function StatsCard({
  title,
  value,
  change,
  trend,
  icon: Icon,
  variant = 'default',
}: {
  title: string;
  value: string | number;
  change?: number;
  trend?: 'up' | 'down';
  icon: React.ElementType;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
}) {
  const variants = {
    default: 'from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border-slate-200 dark:border-slate-700',
    success: 'from-emerald-50 to-green-50 dark:from-emerald-950/50 dark:to-green-950/50 border-emerald-200 dark:border-emerald-800',
    warning: 'from-amber-50 to-orange-50 dark:from-amber-950/50 dark:to-orange-950/50 border-amber-200 dark:border-amber-800',
    danger: 'from-red-50 to-rose-50 dark:from-red-950/50 dark:to-rose-950/50 border-red-200 dark:border-red-800',
    info: 'from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 border-blue-200 dark:border-blue-800',
  };

  const iconColors = {
    default: 'bg-slate-500',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-red-500',
    info: 'bg-blue-500',
  };

  return (
    <Card className={cn('bg-gradient-to-br border overflow-hidden', variants[variant])}>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
            <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">
              {value}
            </p>
            {change !== undefined && (
              <div className="flex items-center gap-1 mt-2">
                {trend === 'up' ? (
                  <ArrowUpRight className="h-4 w-4 text-emerald-500" />
                ) : (
                  <ArrowDownRight className="h-4 w-4 text-red-500" />
                )}
                <span className={cn(
                  'text-sm font-medium',
                  trend === 'up' ? 'text-emerald-600' : 'text-red-600'
                )}>
                  {change > 0 ? '+' : ''}{change}%
                </span>
                <span className="text-xs text-slate-500">vs last month</span>
              </div>
            )}
          </div>
          <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center shadow-lg', iconColors[variant])}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CompanyRow({ company, onAction }: { company: Company; onAction: (id: string, action: string) => void }) {
  const router = useRouter();
  const config = statusConfig[company.status];
  const StatusIcon = config.icon;
  const creditUsage = company.creditLimitGBP > 0 
    ? (company.currentBalanceGBP / company.creditLimitGBP) * 100 
    : 0;

  return (
    <TableRow className="hover:bg-slate-50 dark:hover:bg-slate-800/50 group">
      <TableCell>
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-md">
            {company.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="font-semibold text-slate-900 dark:text-white">{company.name}</div>
            {company.legalName && (
              <div className="text-sm text-slate-500 dark:text-slate-400">{company.legalName}</div>
            )}
          </div>
        </div>
      </TableCell>
      <TableCell>
        <Badge className={cn('border font-medium', config.color)}>
          <span className={cn('w-2 h-2 rounded-full mr-2', config.dotColor)} />
          {config.label}
        </Badge>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <div className="flex -space-x-2">
            {[...Array(Math.min(company._count.CompanyUser, 3))].map((_, i) => (
              <div key={i} className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 border-2 border-white dark:border-slate-900 flex items-center justify-center text-xs font-medium">
                {i + 1}
              </div>
            ))}
          </div>
          <span className="text-sm text-slate-600 dark:text-slate-400">
            {company._count.CompanyUser} users
          </span>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <Activity className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          <span className="font-medium">{company._count.CompanyBooking}</span>
        </div>
      </TableCell>
      <TableCell>
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{formatCurrency(company.currentBalanceGBP)}</span>
            <span className="text-xs text-slate-500">/ {formatCurrency(company.creditLimitGBP)}</span>
          </div>
          <Progress 
            value={creditUsage} 
            className={cn(
              'h-1.5',
              creditUsage > 80 ? '[&>div]:bg-red-500' : creditUsage > 60 ? '[&>div]:bg-amber-500' : '[&>div]:bg-emerald-500'
            )} 
          />
        </div>
      </TableCell>
      <TableCell className="text-sm text-slate-500">
        {formatDate(company.createdAt)}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => router.push(`/admin/b2b/companies/${company.id}`)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Company Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push(`/admin/b2b/companies/${company.id}`)}>
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push(`/admin/b2b/companies/${company.id}?tab=edit`)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Company
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push(`/admin/b2b/companies/${company.id}?tab=users`)}>
                <Users className="h-4 w-4 mr-2" />
                Manage Users
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push(`/admin/b2b/companies/${company.id}?tab=apikeys`)}>
                <Key className="h-4 w-4 mr-2" />
                API Keys
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push(`/admin/b2b/companies/${company.id}?tab=pricing`)}>
                <CreditCard className="h-4 w-4 mr-2" />
                Pricing Rules
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {company.status === 'PENDING' && (
                <DropdownMenuItem 
                  onClick={() => onAction(company.id, 'activate')}
                  className="text-emerald-600"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve & Activate
                </DropdownMenuItem>
              )}
              {company.status === 'ACTIVE' && (
                <DropdownMenuItem 
                  onClick={() => onAction(company.id, 'suspend')}
                  className="text-red-600"
                >
                  <Ban className="h-4 w-4 mr-2" />
                  Suspend Company
                </DropdownMenuItem>
              )}
              {company.status === 'SUSPENDED' && (
                <DropdownMenuItem 
                  onClick={() => onAction(company.id, 'activate')}
                  className="text-emerald-600"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Reactivate
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </TableCell>
    </TableRow>
  );
}

function QuickActionsCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-3">
        <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2 hover:bg-blue-50 hover:border-blue-200 dark:hover:bg-blue-950/50">
          <Plus className="h-5 w-5 text-blue-600" />
          <span className="text-xs">Add Company</span>
        </Button>
        <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2 hover:bg-emerald-50 hover:border-emerald-200 dark:hover:bg-emerald-950/50">
          <Key className="h-5 w-5 text-emerald-600" />
          <span className="text-xs">Generate API Key</span>
        </Button>
        <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2 hover:bg-purple-50 hover:border-purple-200 dark:hover:bg-purple-950/50">
          <BarChart3 className="h-5 w-5 text-purple-600" />
          <span className="text-xs">View Reports</span>
        </Button>
        <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2 hover:bg-amber-50 hover:border-amber-200 dark:hover:bg-amber-950/50">
          <Download className="h-5 w-5 text-amber-600" />
          <span className="text-xs">Export Data</span>
        </Button>
      </CardContent>
    </Card>
  );
}

function RecentActivityCard() {
  const activities = [
    { company: 'TechCorp Ltd', action: 'API key generated', time: '5 min ago', type: 'key' },
    { company: 'Logistics Plus', action: 'New booking placed', time: '12 min ago', type: 'booking' },
    { company: 'FastShip Inc', action: 'Invoice paid', time: '1 hour ago', type: 'payment' },
    { company: 'Express Delivery', action: 'User added', time: '2 hours ago', type: 'user' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {activities.map((activity, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className={cn(
              'w-8 h-8 rounded-lg flex items-center justify-center',
              activity.type === 'key' && 'bg-emerald-100 dark:bg-emerald-900/30',
              activity.type === 'booking' && 'bg-blue-100 dark:bg-blue-900/30',
              activity.type === 'payment' && 'bg-purple-100 dark:bg-purple-900/30',
              activity.type === 'user' && 'bg-amber-100 dark:bg-amber-900/30',
            )}>
              {activity.type === 'key' && <Key className="h-4 w-4 text-emerald-600" />}
              {activity.type === 'booking' && <Activity className="h-4 w-4 text-blue-600" />}
              {activity.type === 'payment' && <CreditCard className="h-4 w-4 text-purple-600" />}
              {activity.type === 'user' && <Users className="h-4 w-4 text-amber-600" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{activity.company}</p>
              <p className="text-xs text-slate-500">{activity.action}</p>
            </div>
            <span className="text-xs text-slate-400">{activity.time}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function EnhancedCompaniesListDashboard() {
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [stats, setStats] = useState<DashboardStats>({
    total: 0,
    active: 0,
    pending: 0,
    suspended: 0,
    totalCredit: 0,
    totalOutstanding: 0,
    monthlyGrowth: 12.5,
    avgBookingsPerCompany: 45,
    apiCallsToday: 12450,
  });

  const fetchCompanies = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });
      
      if (search) params.set('search', search);
      if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter);

      const response = await fetch(`/api/admin/companies?${params}`);
      const data = await response.json();

      if (data.success) {
        setCompanies(data.data);
        setPagination(data.pagination);
        
        const activeCount = data.data.filter((c: Company) => c.status === 'ACTIVE').length;
        const pendingCount = data.data.filter((c: Company) => c.status === 'PENDING').length;
        const suspendedCount = data.data.filter((c: Company) => c.status === 'SUSPENDED').length;
        const totalCredit = data.data.reduce((sum: number, c: Company) => sum + c.creditLimitGBP, 0);
        const totalOutstanding = data.data.reduce((sum: number, c: Company) => sum + c.currentBalanceGBP, 0);
        
        setStats(prev => ({
          ...prev,
          total: data.pagination.total,
          active: activeCount,
          pending: pendingCount,
          suspended: suspendedCount,
          totalCredit,
          totalOutstanding,
        }));
      } else {
        toast.error(data.error || 'Failed to load companies');
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
      toast.error('Failed to load companies');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchCompanies(pagination?.page || 1);
    setRefreshing(false);
  };

  const handleStatusChange = async (companyId: string, action: string) => {
    try {
      const response = await fetch(`/api/admin/companies/${companyId}`, {
        method: action === 'suspend' ? 'DELETE' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          action === 'activate' 
            ? { status: 'ACTIVE' } 
            : { action: 'suspend', reason: 'Admin action' }
        ),
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success(`Company ${action}d successfully`);
        fetchCompanies(pagination?.page || 1);
      } else {
        toast.error(data.error || `Failed to ${action} company`);
      }
    } catch (error) {
      console.error(`Error ${action}ing company:`, error);
      toast.error(`Failed to ${action} company`);
    }
  };

  return (
    <div className="p-6 space-y-6 bg-slate-50 dark:bg-slate-950 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            B2B Companies
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Manage corporate accounts, API access, and pricing configurations
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="icon"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button 
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            onClick={() => setShowCreateDialog(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Company
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Companies"
          value={stats.total}
          change={stats.monthlyGrowth}
          trend="up"
          icon={Building2}
          variant="info"
        />
        <StatsCard
          title="Active Companies"
          value={stats.active}
          icon={CheckCircle}
          variant="success"
        />
        <StatsCard
          title="Pending Approval"
          value={stats.pending}
          icon={Clock}
          variant="warning"
        />
        <StatsCard
          title="Total Credit Limit"
          value={formatCurrency(stats.totalCredit)}
          icon={CreditCard}
          variant="default"
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Companies List */}
        <div className="lg:col-span-3 space-y-4">
          {/* Filters */}
          <Card className="border-slate-200 dark:border-slate-800">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search companies by name, email, or industry..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 bg-white dark:bg-slate-900"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[200px] bg-white dark:bg-slate-900">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="SUSPENDED">Suspended</SelectItem>
                    <SelectItem value="CLOSED">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Table */}
          <Card className="border-slate-200 dark:border-slate-800">
            <CardContent className="p-0">
              {loading ? (
                <div className="p-6 space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : companies.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
                    <Building2 className="h-8 w-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">No companies found</h3>
                  <p className="text-slate-500 dark:text-slate-400 mt-1">
                    {search || statusFilter !== 'all'
                      ? 'Try adjusting your filters'
                      : 'Get started by adding your first B2B company'}
                  </p>
                  <Button className="mt-4" onClick={() => setShowCreateDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Company
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 dark:bg-slate-800/50">
                      <TableHead>Company</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Users</TableHead>
                      <TableHead>Bookings</TableHead>
                      <TableHead>Credit Usage</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="w-24"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {companies.map((company) => (
                      <CompanyRow 
                        key={company.id} 
                        company={company} 
                        onAction={handleStatusChange}
                      />
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-800">
                <p className="text-sm text-slate-500">
                  Showing {companies.length} of {pagination.total} companies
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page === 1}
                    onClick={() => fetchCompanies(pagination.page - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm px-3">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page === pagination.totalPages}
                    onClick={() => fetchCompanies(pagination.page + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <QuickActionsCard />
          <RecentActivityCard />
        </div>
      </div>

      {/* Create Company Dialog */}
      <CreateCompanyDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={() => {
          fetchCompanies();
          setShowCreateDialog(false);
        }}
      />
    </div>
  );
}
