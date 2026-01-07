'use client';

/**
 * B2B Company Detail Dashboard Component - Premium Design
 * 
 * Comprehensive view of a single company with tabs for different sections
 */

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Building2,
  ArrowLeft,
  Users,
  Key,
  CreditCard,
  FileText,
  History,
  Settings,
  CheckCircle,
  Ban,
  AlertTriangle,
  Clock,
  TrendingUp,
  Package,
  Receipt,
  Mail,
  Phone as PhoneIcon,
  Globe,
  MapPin,
  Calendar,
  Activity,
  DollarSign,
  BarChart3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import CompanyUsersTab from './tabs/CompanyUsersTab';
import CompanyApiKeysTab from './tabs/CompanyApiKeysTab';
import CompanyPricingTab from './tabs/CompanyPricingTab';
import CompanyInvoicesTab from './tabs/CompanyInvoicesTab';
import CompanyAuditTab from './tabs/CompanyAuditTab';
import CompanySettingsTab from './tabs/CompanySettingsTab';

interface CompanyDetailDashboardProps {
  companyId: string;
}

interface Company {
  id: string;
  name: string;
  legalName?: string;
  vatNumber?: string;
  companyNumber?: string;
  status: 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'CLOSED';
  creditLimitGBP: number;
  currentBalanceGBP: number;
  paymentTermsDays: number;
  billingAddressLine1?: string;
  billingAddressLine2?: string;
  billingCity?: string;
  billingPostcode?: string;
  industry?: string;
  website?: string;
  phone?: string;
  email?: string;
  createdAt: string;
  statistics: {
    bookingsCount: number;
    totalInvoicedGBP: number;
    quotesCount: number;
    usersCount: number;
  };
  CompanyUser: any[];
  ApiKey: any[];
  PricingRule: any[];
}

const statusConfig = {
  PENDING: { 
    label: 'Pending Approval', 
    color: 'bg-gradient-to-r from-yellow-50 to-amber-50 text-yellow-800 border border-yellow-200', 
    badgeColor: 'bg-yellow-500',
    icon: Clock 
  },
  ACTIVE: { 
    label: 'Active', 
    color: 'bg-gradient-to-r from-green-50 to-emerald-50 text-green-800 border border-green-200', 
    badgeColor: 'bg-green-500',
    icon: CheckCircle 
  },
  SUSPENDED: { 
    label: 'Suspended', 
    color: 'bg-gradient-to-r from-red-50 to-rose-50 text-red-800 border border-red-200', 
    badgeColor: 'bg-red-500',
    icon: Ban 
  },
  CLOSED: { 
    label: 'Closed', 
    color: 'bg-gradient-to-r from-gray-50 to-slate-50 text-gray-800 border border-gray-200', 
    badgeColor: 'bg-gray-500',
    icon: AlertTriangle 
  },
};

export default function CompanyDetailDashboard({ companyId }: CompanyDetailDashboardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(searchParams?.get('tab') || 'overview');

  useEffect(() => {
    fetchCompany();
  }, [companyId]);

  const fetchCompany = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/companies/${companyId}`);
      const data = await response.json();

      if (data.success) {
        setCompany(data.data);
      } else {
        toast.error(data.error || 'Failed to load company');
        router.push('/admin/b2b/companies');
      }
    } catch (error) {
      console.error('Error fetching company:', error);
      toast.error('Failed to load company');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (action: 'activate' | 'suspend') => {
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
        fetchCompany();
      } else {
        toast.error(data.error || `Failed to ${action} company`);
      }
    } catch (error) {
      console.error(`Error ${action}ing company:`, error);
      toast.error(`Failed to ${action} company`);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(amount / 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-12 w-96" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-40 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-[700px] rounded-xl" />
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 flex items-center justify-center p-6">
        <Card className="w-full max-w-md shadow-xl">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="h-10 w-10 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold">Company not found</h2>
            <p className="text-muted-foreground">The company you're looking for doesn't exist or has been removed.</p>
            <Button
              onClick={() => router.push('/admin/b2b/companies')}
              className="w-full"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Companies
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const StatusIcon = statusConfig[company.status].icon;
  const availableCredit = company.creditLimitGBP - company.currentBalanceGBP;
  const creditUsagePercent = company.creditLimitGBP > 0
    ? (company.currentBalanceGBP / company.creditLimitGBP) * 100
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Premium Header with Gradient Background */}
        <Card className="border-0 shadow-xl bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full -mr-48 -mt-48 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full -ml-48 -mb-48 blur-3xl"></div>
          
          <CardContent className="p-8 relative">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div className="flex items-start gap-6 flex-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => router.push('/admin/b2b/companies')}
                  className="hover:bg-white/10 text-white shrink-0"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                
                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <Building2 className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold mb-2">{company.name}</h1>
                      {company.legalName && company.legalName !== company.name && (
                        <p className="text-blue-200 text-sm">{company.legalName}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 flex-wrap">
                    <Badge className={`${statusConfig[company.status].color} px-4 py-1.5 text-sm font-semibold`}>
                      <StatusIcon className="h-4 w-4 mr-2" />
                      {statusConfig[company.status].label}
                    </Badge>
                    
                    {company.vatNumber && (
                      <div className="flex items-center gap-2 text-sm bg-white/10 px-3 py-1.5 rounded-lg">
                        <FileText className="h-4 w-4" />
                        <span>VAT: {company.vatNumber}</span>
                      </div>
                    )}
                    
                    {company.companyNumber && (
                      <div className="flex items-center gap-2 text-sm bg-white/10 px-3 py-1.5 rounded-lg">
                        <Building2 className="h-4 w-4" />
                        <span>REG: {company.companyNumber}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                {company.status === 'PENDING' && (
                  <Button 
                    onClick={() => handleStatusChange('activate')}
                    className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Activate Company
                  </Button>
                )}
                {company.status === 'ACTIVE' && (
                  <Button 
                    variant="destructive" 
                    onClick={() => handleStatusChange('suspend')}
                    className="bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 shadow-lg"
                  >
                    <Ban className="h-4 w-4 mr-2" />
                    Suspend Company
                  </Button>
                )}
                {company.status === 'SUSPENDED' && (
                  <Button 
                    onClick={() => handleStatusChange('activate')}
                    className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Reactivate
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Premium Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Credit Card */}
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-medium text-sm text-muted-foreground">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                    <CreditCard className="h-5 w-5 text-white" />
                  </div>
                  <span>Credit Limit</span>
                </div>
                <Badge variant="outline" className="text-xs">
                  {Math.round(creditUsagePercent)}% used
                </Badge>
              </div>
              <CardTitle className="text-3xl font-bold mt-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {formatCurrency(company.creditLimitGBP)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Available</span>
                  <span className="font-semibold text-green-600">{formatCurrency(availableCredit)}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`h-2.5 rounded-full transition-all duration-500 ${
                      creditUsagePercent > 80 
                        ? 'bg-gradient-to-r from-red-500 to-rose-600' 
                        : creditUsagePercent > 50 
                        ? 'bg-gradient-to-r from-yellow-500 to-amber-600' 
                        : 'bg-gradient-to-r from-green-500 to-emerald-600'
                    }`}
                    style={{ width: `${Math.min(creditUsagePercent, 100)}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bookings Card */}
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2 font-medium text-sm text-muted-foreground">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <Package className="h-5 w-5 text-white" />
                </div>
                <span>Total Bookings</span>
              </div>
              <CardTitle className="text-3xl font-bold mt-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                {company.statistics.bookingsCount}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm">
                <TrendingUp className="h-4 w-4 text-purple-500" />
                <span className="text-muted-foreground">{company.statistics.quotesCount} quotes created</span>
              </div>
            </CardContent>
          </Card>

          {/* Revenue Card */}
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2 font-medium text-sm text-muted-foreground">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-white" />
                </div>
                <span>Total Revenue</span>
              </div>
              <CardTitle className="text-3xl font-bold mt-4 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                {formatCurrency(company.statistics.totalInvoicedGBP)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-green-500" />
                <span className="text-muted-foreground">{company.paymentTermsDays} days terms</span>
              </div>
            </CardContent>
          </Card>

          {/* Team Card */}
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2 font-medium text-sm text-muted-foreground">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <span>Team Members</span>
              </div>
              <CardTitle className="text-3xl font-bold mt-4 bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                {company.statistics.usersCount}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm">
                <Key className="h-4 w-4 text-orange-500" />
                <span className="text-muted-foreground">{company.ApiKey.length} API keys active</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Premium Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-2">
              <TabsList className="grid w-full grid-cols-2 md:grid-cols-6 gap-2 bg-transparent p-0">
                <TabsTrigger 
                  value="overview" 
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white rounded-lg transition-all duration-300 shadow-sm"
                >
                  <Building2 className="h-4 w-4 mr-2" />
                  <span className="hidden md:inline">Overview</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="users"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-600 data-[state=active]:text-white rounded-lg transition-all duration-300 shadow-sm"
                >
                  <Users className="h-4 w-4 mr-2" />
                  <span className="hidden md:inline">Users</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="apikeys"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white rounded-lg transition-all duration-300 shadow-sm"
                >
                  <Key className="h-4 w-4 mr-2" />
                  <span className="hidden md:inline">API Keys</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="pricing"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-600 data-[state=active]:text-white rounded-lg transition-all duration-300 shadow-sm"
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  <span className="hidden md:inline">Pricing</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="invoices"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-blue-600 data-[state=active]:text-white rounded-lg transition-all duration-300 shadow-sm"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  <span className="hidden md:inline">Invoices</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="audit"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-slate-500 data-[state=active]:to-gray-600 data-[state=active]:text-white rounded-lg transition-all duration-300 shadow-sm"
                >
                  <History className="h-4 w-4 mr-2" />
                  <span className="hidden md:inline">Audit</span>
                </TabsTrigger>
              </TabsList>
            </CardContent>
          </Card>

          <TabsContent value="overview" className="space-y-6 mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Company Information Card */}
              <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-purple-50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-white" />
                    </div>
                    <CardTitle>Company Information</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  {[
                    { icon: FileText, label: 'VAT Number', value: company.vatNumber || 'Not provided', color: 'text-blue-500' },
                    { icon: Building2, label: 'Company Number', value: company.companyNumber || 'Not provided', color: 'text-purple-500' },
                    { icon: BarChart3, label: 'Industry', value: company.industry || 'Not specified', color: 'text-green-500' },
                    { icon: Globe, label: 'Website', value: company.website, color: 'text-cyan-500', isLink: true },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-start gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className={`w-10 h-10 ${item.color.replace('text-', 'bg-')}/10 rounded-lg flex items-center justify-center shrink-0`}>
                        <item.icon className={`h-5 w-5 ${item.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-muted-foreground font-medium mb-1">{item.label}</div>
                        <div className="font-semibold truncate">
                          {item.isLink && item.value ? (
                            <a 
                              href={item.value} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
                            >
                              {item.value}
                              <Globe className="h-3 w-3" />
                            </a>
                          ) : (
                            item.value || 'Not provided'
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Contact Information Card */}
              <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader className="border-b bg-gradient-to-r from-green-50 to-emerald-50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                      <Mail className="h-5 w-5 text-white" />
                    </div>
                    <CardTitle>Contact Information</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  {[
                    { icon: Mail, label: 'Email Address', value: company.email, color: 'text-green-500', isEmail: true },
                    { icon: PhoneIcon, label: 'Phone Number', value: company.phone, color: 'text-blue-500' },
                    { icon: MapPin, label: 'Billing Address', value: null, color: 'text-purple-500', isAddress: true },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-start gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className={`w-10 h-10 ${item.color.replace('text-', 'bg-')}/10 rounded-lg flex items-center justify-center shrink-0`}>
                        <item.icon className={`h-5 w-5 ${item.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-muted-foreground font-medium mb-1">{item.label}</div>
                        {item.isAddress ? (
                          company.billingAddressLine1 ? (
                            <div className="font-semibold space-y-0.5">
                              <div>{company.billingAddressLine1}</div>
                              {company.billingAddressLine2 && <div>{company.billingAddressLine2}</div>}
                              <div>{company.billingCity} {company.billingPostcode}</div>
                            </div>
                          ) : (
                            <div className="text-muted-foreground">No address provided</div>
                          )
                        ) : item.isEmail && item.value ? (
                          <a href={`mailto:${item.value}`} className="font-semibold text-blue-600 hover:text-blue-800 hover:underline">
                            {item.value}
                          </a>
                        ) : (
                          <div className="font-semibold truncate">{item.value || 'Not provided'}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Account Details Card */}
              <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 lg:col-span-2">
                <CardHeader className="border-b bg-gradient-to-r from-orange-50 to-red-50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
                      <Activity className="h-5 w-5 text-white" />
                    </div>
                    <CardTitle>Account Details & Activity</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {[
                      { 
                        icon: Calendar, 
                        label: 'Account Created', 
                        value: new Date(company.createdAt).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        }), 
                        color: 'text-blue-500' 
                      },
                      { icon: Clock, label: 'Payment Terms', value: `${company.paymentTermsDays} days`, color: 'text-green-500' },
                      { icon: Package, label: 'Total Orders', value: company.statistics.bookingsCount.toString(), color: 'text-purple-500' },
                      { icon: Receipt, label: 'Active Quotes', value: company.statistics.quotesCount.toString(), color: 'text-orange-500' },
                    ].map((item, idx) => (
                      <div key={idx} className="text-center p-4 rounded-xl bg-gradient-to-br from-gray-50 to-slate-50 hover:shadow-md transition-all">
                        <div className={`w-12 h-12 ${item.color.replace('text-', 'bg-')}/10 rounded-xl flex items-center justify-center mx-auto mb-3`}>
                          <item.icon className={`h-6 w-6 ${item.color}`} />
                        </div>
                        <div className="text-sm text-muted-foreground mb-1">{item.label}</div>
                        <div className="text-xl font-bold">{item.value}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users" className="mt-0">
            <CompanyUsersTab companyId={companyId} />
          </TabsContent>

          <TabsContent value="apikeys" className="mt-0">
            <CompanyApiKeysTab companyId={companyId} />
          </TabsContent>

          <TabsContent value="pricing" className="mt-0">
            <CompanyPricingTab companyId={companyId} />
          </TabsContent>

          <TabsContent value="invoices" className="mt-0">
            <CompanyInvoicesTab companyId={companyId} />
          </TabsContent>

          <TabsContent value="audit" className="mt-0">
            <CompanyAuditTab companyId={companyId} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
