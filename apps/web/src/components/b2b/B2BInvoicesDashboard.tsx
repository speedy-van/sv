'use client';

/**
 * B2B Invoice Dashboard Component
 * 
 * Professional invoicing interface with statement management and payment tracking
 */

import React, { useState } from 'react';
import {
  Receipt,
  Download,
  Eye,
  Send,
  Search,
  Filter,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  CreditCard,
  Building2,
  FileText,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Plus,
  Printer,
  Mail,
  DollarSign,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { B2BStatsCard, B2BStatusBadge } from './B2BDesignSystem';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

interface Invoice {
  id: string;
  number: string;
  status: 'draft' | 'sent' | 'viewed' | 'paid' | 'partially-paid' | 'overdue' | 'cancelled';
  issueDate: string;
  dueDate: string;
  subtotal: number;
  vat: number;
  total: number;
  paidAmount: number;
  poNumber?: string;
  bookingsCount: number;
  notes?: string;
}

interface InvoiceStats {
  totalInvoiced: number;
  totalPaid: number;
  totalOutstanding: number;
  overdueAmount: number;
  invoiceCount: number;
  overdueCount: number;
}

// ============================================================================
// Mock Data
// ============================================================================

const mockStats: InvoiceStats = {
  totalInvoiced: 125480.50,
  totalPaid: 98250.00,
  totalOutstanding: 27230.50,
  overdueAmount: 8450.00,
  invoiceCount: 48,
  overdueCount: 3,
};

const mockInvoices: Invoice[] = [
  {
    id: '1',
    number: 'INV-2024-001',
    status: 'paid',
    issueDate: '2024-01-01',
    dueDate: '2024-01-31',
    subtotal: 4580.00,
    vat: 916.00,
    total: 5496.00,
    paidAmount: 5496.00,
    poNumber: 'PO-2024-001',
    bookingsCount: 25,
  },
  {
    id: '2',
    number: 'INV-2024-002',
    status: 'overdue',
    issueDate: '2024-01-15',
    dueDate: '2024-02-14',
    subtotal: 3250.00,
    vat: 650.00,
    total: 3900.00,
    paidAmount: 0,
    poNumber: 'PO-2024-002',
    bookingsCount: 18,
    notes: '15 days overdue',
  },
  {
    id: '3',
    number: 'INV-2024-003',
    status: 'partially-paid',
    issueDate: '2024-02-01',
    dueDate: '2024-03-01',
    subtotal: 6780.00,
    vat: 1356.00,
    total: 8136.00,
    paidAmount: 4000.00,
    poNumber: 'PO-2024-003',
    bookingsCount: 32,
  },
  {
    id: '4',
    number: 'INV-2024-004',
    status: 'sent',
    issueDate: '2024-02-15',
    dueDate: '2024-03-15',
    subtotal: 2890.00,
    vat: 578.00,
    total: 3468.00,
    paidAmount: 0,
    bookingsCount: 15,
  },
  {
    id: '5',
    number: 'INV-2024-005',
    status: 'viewed',
    issueDate: '2024-02-20',
    dueDate: '2024-03-20',
    subtotal: 5120.00,
    vat: 1024.00,
    total: 6144.00,
    paidAmount: 0,
    poNumber: 'PO-2024-005',
    bookingsCount: 28,
  },
  {
    id: '6',
    number: 'INV-2024-006',
    status: 'draft',
    issueDate: '2024-02-25',
    dueDate: '2024-03-25',
    subtotal: 1890.00,
    vat: 378.00,
    total: 2268.00,
    paidAmount: 0,
    bookingsCount: 12,
  },
];

// ============================================================================
// Status Configuration
// ============================================================================

const statusConfig = {
  draft: {
    label: 'Draft',
    variant: 'default' as const,
    icon: FileText,
    color: 'text-slate-600 bg-slate-50',
  },
  sent: {
    label: 'Sent',
    variant: 'info' as const,
    icon: Send,
    color: 'text-blue-600 bg-blue-50',
  },
  viewed: {
    label: 'Viewed',
    variant: 'info' as const,
    icon: Eye,
    color: 'text-indigo-600 bg-indigo-50',
  },
  paid: {
    label: 'Paid',
    variant: 'success' as const,
    icon: CheckCircle2,
    color: 'text-emerald-600 bg-emerald-50',
  },
  'partially-paid': {
    label: 'Partial',
    variant: 'warning' as const,
    icon: Clock,
    color: 'text-amber-600 bg-amber-50',
  },
  overdue: {
    label: 'Overdue',
    variant: 'danger' as const,
    icon: AlertCircle,
    color: 'text-red-600 bg-red-50',
  },
  cancelled: {
    label: 'Cancelled',
    variant: 'default' as const,
    icon: XCircle,
    color: 'text-slate-600 bg-slate-50',
  },
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
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date));
};

const getDaysUntilDue = (dueDate: string) => {
  const today = new Date();
  const due = new Date(dueDate);
  const diff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return diff;
};

// ============================================================================
// Sub Components
// ============================================================================

function InvoiceStatsCards({ stats }: { stats: InvoiceStats }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 border-blue-200 dark:border-blue-800">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Total Invoiced</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">
                {formatCurrency(stats.totalInvoiced)}
              </p>
              <p className="text-sm text-slate-500 mt-1">{stats.invoiceCount} invoices</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center">
              <Receipt className="h-6 w-6 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/50 dark:to-green-950/50 border-emerald-200 dark:border-emerald-800">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">Total Paid</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">
                {formatCurrency(stats.totalPaid)}
              </p>
              <p className="text-sm text-slate-500 mt-1">
                {Math.round((stats.totalPaid / stats.totalInvoiced) * 100)}% collected
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/50 dark:to-orange-950/50 border-amber-200 dark:border-amber-800">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-amber-600 dark:text-amber-400 font-medium">Outstanding</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">
                {formatCurrency(stats.totalOutstanding)}
              </p>
              <p className="text-sm text-slate-500 mt-1">Awaiting payment</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-500 flex items-center justify-center">
              <Clock className="h-6 w-6 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/50 dark:to-rose-950/50 border-red-200 dark:border-red-800">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-red-600 dark:text-red-400 font-medium">Overdue</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">
                {formatCurrency(stats.overdueAmount)}
              </p>
              <p className="text-sm text-slate-500 mt-1">{stats.overdueCount} invoices</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-red-500 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function PaymentProgressCard({ stats }: { stats: InvoiceStats }) {
  const paidPercentage = (stats.totalPaid / stats.totalInvoiced) * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Payment Progress</CardTitle>
        <CardDescription>Current billing period collection status</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-3xl font-bold">{formatCurrency(stats.totalPaid)}</p>
            <p className="text-sm text-slate-500">of {formatCurrency(stats.totalInvoiced)} collected</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-emerald-600">{Math.round(paidPercentage)}%</p>
            <p className="text-sm text-slate-500">Collection rate</p>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Progress</span>
            <span className="font-medium">{formatCurrency(stats.totalOutstanding)} remaining</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-4 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all"
              style={{ width: `${paidPercentage}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 pt-4 border-t">
          <div className="text-center">
            <p className="text-2xl font-bold text-emerald-600">{stats.invoiceCount - stats.overdueCount - 5}</p>
            <p className="text-xs text-slate-500">Paid</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-amber-600">5</p>
            <p className="text-xs text-slate-500">Pending</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">{stats.overdueCount}</p>
            <p className="text-xs text-slate-500">Overdue</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function InvoiceRow({ invoice, selected, onSelect }: { invoice: Invoice; selected: boolean; onSelect: () => void }) {
  const config = statusConfig[invoice.status];
  const StatusIcon = config.icon;
  const daysUntilDue = getDaysUntilDue(invoice.dueDate);
  const paidPercentage = (invoice.paidAmount / invoice.total) * 100;

  return (
    <TableRow className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
      <TableCell>
        <Checkbox checked={selected} onCheckedChange={onSelect} />
      </TableCell>
      <TableCell>
        <div className="flex flex-col">
          <span className="font-semibold text-sm">{invoice.number}</span>
          {invoice.poNumber && (
            <span className="text-xs text-slate-500">{invoice.poNumber}</span>
          )}
        </div>
      </TableCell>
      <TableCell>
        <B2BStatusBadge 
          status={config.label} 
          variant={config.variant} 
          pulse={invoice.status === 'overdue'}
        />
      </TableCell>
      <TableCell>
        <div className="flex flex-col text-sm">
          <span>{formatDate(invoice.issueDate)}</span>
          <span className="text-slate-500">
            Due: {formatDate(invoice.dueDate)}
            {daysUntilDue < 0 && (
              <span className="text-red-500 ml-1">({Math.abs(daysUntilDue)} days overdue)</span>
            )}
            {daysUntilDue >= 0 && daysUntilDue <= 7 && (
              <span className="text-amber-500 ml-1">({daysUntilDue} days left)</span>
            )}
          </span>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant="outline">{invoice.bookingsCount} bookings</Badge>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex flex-col">
          <span className="font-semibold">{formatCurrency(invoice.total)}</span>
          {invoice.status === 'partially-paid' && (
            <div className="flex items-center gap-2 mt-1">
              <Progress value={paidPercentage} className="h-1.5 w-16" />
              <span className="text-xs text-slate-500">{Math.round(paidPercentage)}%</span>
            </div>
          )}
        </div>
      </TableCell>
      <TableCell className="text-right font-semibold">
        {invoice.total - invoice.paidAmount > 0 ? (
          <span className={invoice.status === 'overdue' ? 'text-red-600' : ''}>
            {formatCurrency(invoice.total - invoice.paidAmount)}
          </span>
        ) : (
          <span className="text-emerald-600">Paid</span>
        )}
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Eye className="h-4 w-4 mr-2" />
              View Invoice
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </DropdownMenuItem>
            {(invoice.status === 'draft' || invoice.status === 'sent') && (
              <DropdownMenuItem>
                <Mail className="h-4 w-4 mr-2" />
                Send Reminder
              </DropdownMenuItem>
            )}
            {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-emerald-600">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Record Payment
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}

function CreditStatusCard() {
  const creditLimit = 50000;
  const creditUsed = 27230.50;
  const creditAvailable = creditLimit - creditUsed;
  const usagePercentage = (creditUsed / creditLimit) * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-blue-500" />
          Credit Status
        </CardTitle>
        <CardDescription>Your current credit account status</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
            <p className="text-sm text-slate-500">Credit Limit</p>
            <p className="text-2xl font-bold">{formatCurrency(creditLimit)}</p>
          </div>
          <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
            <p className="text-sm text-emerald-600">Available</p>
            <p className="text-2xl font-bold text-emerald-700">{formatCurrency(creditAvailable)}</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Credit Used</span>
            <span className="font-medium">{Math.round(usagePercentage)}%</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3">
            <div
              className={cn(
                'h-full rounded-full transition-all',
                usagePercentage > 80 ? 'bg-red-500' : usagePercentage > 60 ? 'bg-amber-500' : 'bg-blue-500'
              )}
              style={{ width: `${usagePercentage}%` }}
            />
          </div>
        </div>

        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center gap-3">
          <Calendar className="h-5 w-5 text-blue-600" />
          <div>
            <p className="text-sm font-medium text-blue-700">Payment Terms</p>
            <p className="text-sm text-blue-600">Net 30 days</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function B2BInvoicesDashboard() {
  const [invoices, setInvoices] = useState<Invoice[]>(mockInvoices);
  const [stats, setStats] = useState<InvoiceStats>(mockStats);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch = invoice.number.toLowerCase().includes(search.toLowerCase()) ||
      (invoice.poNumber?.toLowerCase().includes(search.toLowerCase()) ?? false);
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const toggleSelect = (id: string) => {
    setSelectedInvoices((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedInvoices.length === filteredInvoices.length) {
      setSelectedInvoices([]);
    } else {
      setSelectedInvoices(filteredInvoices.map((i) => i.id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <Receipt className="h-8 w-8 text-blue-500" />
            Invoices
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Manage invoices and track payments
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Download Statement
          </Button>
          <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
            <CreditCard className="h-4 w-4 mr-2" />
            Pay Now
          </Button>
        </div>
      </div>

      {/* Stats */}
      <InvoiceStatsCards stats={stats} />

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search by invoice number or PO..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="viewed">Viewed</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="partially-paid">Partially Paid</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="icon">
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>

              {selectedInvoices.length > 0 && (
                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-xl flex items-center justify-between">
                  <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                    {selectedInvoices.length} invoice(s) selected
                  </span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Download All
                    </Button>
                    <Button variant="outline" size="sm" className="text-emerald-600">
                      <CreditCard className="h-4 w-4 mr-2" />
                      Pay Selected
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Invoices Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 dark:bg-slate-800/50">
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedInvoices.length === filteredInvoices.length && filteredInvoices.length > 0}
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12">
                        <Receipt className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                        <p className="text-slate-500 dark:text-slate-400">No invoices found</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredInvoices.map((invoice) => (
                      <InvoiceRow
                        key={invoice.id}
                        invoice={invoice}
                        selected={selectedInvoices.includes(invoice.id)}
                        onSelect={() => toggleSelect(invoice.id)}
                      />
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <PaymentProgressCard stats={stats} />
          <CreditStatusCard />
        </div>
      </div>
    </div>
  );
}
