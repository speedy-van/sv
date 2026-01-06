'use client';

/**
 * B2B Company Detail Dashboard Component
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
  PENDING: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  ACTIVE: { label: 'Active', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  SUSPENDED: { label: 'Suspended', color: 'bg-red-100 text-red-800', icon: Ban },
  CLOSED: { label: 'Closed', color: 'bg-gray-100 text-gray-800', icon: AlertTriangle },
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
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-[600px]" />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="p-6 text-center">
        <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold">Company not found</h2>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.push('/admin/b2b/companies')}
        >
          Back to Companies
        </Button>
      </div>
    );
  }

  const StatusIcon = statusConfig[company.status].icon;
  const availableCredit = company.creditLimitGBP - company.currentBalanceGBP;
  const creditUsagePercent = company.creditLimitGBP > 0
    ? (company.currentBalanceGBP / company.creditLimitGBP) * 100
    : 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/admin/b2b/companies')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{company.name}</h1>
              <Badge className={statusConfig[company.status].color}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {statusConfig[company.status].label}
              </Badge>
            </div>
            {company.legalName && (
              <p className="text-muted-foreground">{company.legalName}</p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {company.status === 'PENDING' && (
            <Button onClick={() => handleStatusChange('activate')}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Activate
            </Button>
          )}
          {company.status === 'ACTIVE' && (
            <Button variant="destructive" onClick={() => handleStatusChange('suspend')}>
              <Ban className="h-4 w-4 mr-2" />
              Suspend
            </Button>
          )}
          {company.status === 'SUSPENDED' && (
            <Button onClick={() => handleStatusChange('activate')}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Reactivate
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Credit Limit
            </CardDescription>
            <CardTitle className="text-2xl">{formatCurrency(company.creditLimitGBP)}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              Available: {formatCurrency(availableCredit)}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div
                className={`h-2 rounded-full ${
                  creditUsagePercent > 80 ? 'bg-red-500' : creditUsagePercent > 50 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(creditUsagePercent, 100)}%` }}
              />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Total Bookings
            </CardDescription>
            <CardTitle className="text-2xl">{company.statistics.bookingsCount}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              {company.statistics.quotesCount} quotes created
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              Total Invoiced
            </CardDescription>
            <CardTitle className="text-2xl">{formatCurrency(company.statistics.totalInvoicedGBP)}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              {company.paymentTermsDays} days payment terms
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Team Members
            </CardDescription>
            <CardTitle className="text-2xl">{company.statistics.usersCount}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              {company.ApiKey.length} API keys
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            <span className="hidden md:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden md:inline">Users</span>
          </TabsTrigger>
          <TabsTrigger value="apikeys" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            <span className="hidden md:inline">API Keys</span>
          </TabsTrigger>
          <TabsTrigger value="pricing" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            <span className="hidden md:inline">Pricing</span>
          </TabsTrigger>
          <TabsTrigger value="invoices" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden md:inline">Invoices</span>
          </TabsTrigger>
          <TabsTrigger value="audit" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            <span className="hidden md:inline">Audit</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Company Details */}
            <Card>
              <CardHeader>
                <CardTitle>Company Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">VAT Number</div>
                    <div className="font-medium">{company.vatNumber || 'Not provided'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Company Number</div>
                    <div className="font-medium">{company.companyNumber || 'Not provided'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Industry</div>
                    <div className="font-medium">{company.industry || 'Not specified'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Website</div>
                    <div className="font-medium">
                      {company.website ? (
                        <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          {company.website}
                        </a>
                      ) : (
                        'Not provided'
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Email</div>
                    <div className="font-medium">{company.email || 'Not provided'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Phone</div>
                    <div className="font-medium">{company.phone || 'Not provided'}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Billing Address */}
            <Card>
              <CardHeader>
                <CardTitle>Billing Address</CardTitle>
              </CardHeader>
              <CardContent>
                {company.billingAddressLine1 ? (
                  <div className="space-y-1">
                    <div>{company.billingAddressLine1}</div>
                    {company.billingAddressLine2 && <div>{company.billingAddressLine2}</div>}
                    <div>{company.billingCity}</div>
                    <div>{company.billingPostcode}</div>
                  </div>
                ) : (
                  <div className="text-muted-foreground">No billing address provided</div>
                )}
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Created</div>
                    <div className="font-medium">
                      {new Date(company.createdAt).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Payment Terms</div>
                    <div className="font-medium">{company.paymentTermsDays} days</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="mt-6">
          <CompanyUsersTab companyId={companyId} />
        </TabsContent>

        <TabsContent value="apikeys" className="mt-6">
          <CompanyApiKeysTab companyId={companyId} />
        </TabsContent>

        <TabsContent value="pricing" className="mt-6">
          <CompanyPricingTab companyId={companyId} />
        </TabsContent>

        <TabsContent value="invoices" className="mt-6">
          <CompanyInvoicesTab companyId={companyId} />
        </TabsContent>

        <TabsContent value="audit" className="mt-6">
          <CompanyAuditTab companyId={companyId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
