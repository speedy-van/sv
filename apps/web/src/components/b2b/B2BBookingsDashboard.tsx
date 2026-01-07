'use client';

/**
 * B2B Bookings Dashboard Component
 * 
 * Comprehensive booking management interface with filters, search, and bulk actions
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Package,
  Plus,
  Search,
  Filter,
  Download,
  MoreHorizontal,
  Eye,
  Copy,
  Trash2,
  Truck,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  MapPin,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  RefreshCw,
  FileText,
  Send,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { B2BStatsCard, B2BStatusBadge } from './B2BDesignSystem';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

interface Booking {
  id: string;
  reference: string;
  status: 'pending' | 'confirmed' | 'in-transit' | 'delivered' | 'cancelled';
  pickup: {
    address: string;
    postcode: string;
    date: string;
    time: string;
  };
  delivery: {
    address: string;
    postcode: string;
    date: string;
    time: string;
  };
  items: number;
  weight: string;
  vehicleType: string;
  price: number;
  driver?: {
    name: string;
    phone: string;
    vehicle: string;
  };
  createdAt: string;
  poNumber?: string;
  notes?: string;
}

interface BookingStats {
  total: number;
  pending: number;
  inTransit: number;
  delivered: number;
  cancelled: number;
}

// ============================================================================
// Mock Data
// ============================================================================

const mockStats: BookingStats = {
  total: 1247,
  pending: 45,
  inTransit: 23,
  delivered: 1156,
  cancelled: 23,
};

const mockBookings: Booking[] = [
  {
    id: '1',
    reference: 'SV-2024-001234',
    status: 'in-transit',
    pickup: {
      address: '123 Business Park, London',
      postcode: 'EC1A 1BB',
      date: '2024-01-15',
      time: '10:00',
    },
    delivery: {
      address: '456 Industrial Estate, Manchester',
      postcode: 'M1 1AD',
      date: '2024-01-15',
      time: '16:00',
    },
    items: 5,
    weight: '250kg',
    vehicleType: 'Large Van',
    price: 245.00,
    driver: {
      name: 'John Smith',
      phone: '07123456789',
      vehicle: 'Ford Transit - AB12 CDE',
    },
    createdAt: '2024-01-14T14:30:00',
    poNumber: 'PO-2024-001',
  },
  {
    id: '2',
    reference: 'SV-2024-001235',
    status: 'delivered',
    pickup: {
      address: '789 Warehouse Rd, Birmingham',
      postcode: 'B1 1AA',
      date: '2024-01-14',
      time: '09:00',
    },
    delivery: {
      address: '321 Commerce St, Leeds',
      postcode: 'LS1 1AA',
      date: '2024-01-14',
      time: '14:00',
    },
    items: 3,
    weight: '120kg',
    vehicleType: 'Medium Van',
    price: 189.50,
    driver: {
      name: 'Mike Johnson',
      phone: '07987654321',
      vehicle: 'Mercedes Sprinter - CD34 EFG',
    },
    createdAt: '2024-01-13T10:00:00',
    poNumber: 'PO-2024-002',
  },
  {
    id: '3',
    reference: 'SV-2024-001236',
    status: 'pending',
    pickup: {
      address: '555 Distribution Centre, Liverpool',
      postcode: 'L1 1AA',
      date: '2024-01-16',
      time: '08:00',
    },
    delivery: {
      address: '888 Retail Park, Sheffield',
      postcode: 'S1 1AA',
      date: '2024-01-16',
      time: '12:00',
    },
    items: 8,
    weight: '400kg',
    vehicleType: 'Luton Van',
    price: 312.00,
    createdAt: '2024-01-15T09:00:00',
  },
  {
    id: '4',
    reference: 'SV-2024-001237',
    status: 'confirmed',
    pickup: {
      address: '999 Factory Lane, Bristol',
      postcode: 'BS1 1AA',
      date: '2024-01-16',
      time: '11:00',
    },
    delivery: {
      address: '111 High Street, Cardiff',
      postcode: 'CF1 1AA',
      date: '2024-01-16',
      time: '15:00',
    },
    items: 2,
    weight: '50kg',
    vehicleType: 'Small Van',
    price: 98.00,
    createdAt: '2024-01-15T11:30:00',
    poNumber: 'PO-2024-003',
  },
  {
    id: '5',
    reference: 'SV-2024-001238',
    status: 'cancelled',
    pickup: {
      address: '222 Tech Hub, Reading',
      postcode: 'RG1 1AA',
      date: '2024-01-15',
      time: '13:00',
    },
    delivery: {
      address: '333 Office Complex, Oxford',
      postcode: 'OX1 1AA',
      date: '2024-01-15',
      time: '17:00',
    },
    items: 1,
    weight: '25kg',
    vehicleType: 'Small Van',
    price: 75.00,
    createdAt: '2024-01-14T16:00:00',
    notes: 'Customer requested cancellation',
  },
];

// ============================================================================
// Status Configuration
// ============================================================================

const statusConfig = {
  pending: {
    label: 'Pending',
    variant: 'warning' as const,
    icon: Clock,
    color: 'text-amber-600 bg-amber-50',
  },
  confirmed: {
    label: 'Confirmed',
    variant: 'info' as const,
    icon: CheckCircle2,
    color: 'text-blue-600 bg-blue-50',
  },
  'in-transit': {
    label: 'In Transit',
    variant: 'info' as const,
    icon: Truck,
    color: 'text-indigo-600 bg-indigo-50',
  },
  delivered: {
    label: 'Delivered',
    variant: 'success' as const,
    icon: CheckCircle2,
    color: 'text-emerald-600 bg-emerald-50',
  },
  cancelled: {
    label: 'Cancelled',
    variant: 'danger' as const,
    icon: XCircle,
    color: 'text-red-600 bg-red-50',
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

// ============================================================================
// Sub Components
// ============================================================================

function BookingStatsCards({ stats }: { stats: BookingStats }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      <Card className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border-slate-200 dark:border-slate-700">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-500 flex items-center justify-center">
              <Package className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total.toLocaleString()}</p>
              <p className="text-sm text-slate-500">Total</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/50 dark:to-orange-950/50 border-amber-200 dark:border-amber-800">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center">
              <Clock className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">{stats.pending}</p>
              <p className="text-sm text-amber-600 dark:text-amber-500">Pending</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 border-blue-200 dark:border-blue-800">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center">
              <Truck className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">{stats.inTransit}</p>
              <p className="text-sm text-blue-600 dark:text-blue-500">In Transit</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/50 dark:to-green-950/50 border-emerald-200 dark:border-emerald-800">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">{stats.delivered.toLocaleString()}</p>
              <p className="text-sm text-emerald-600 dark:text-emerald-500">Delivered</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/50 dark:to-rose-950/50 border-red-200 dark:border-red-800">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500 flex items-center justify-center">
              <XCircle className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-700 dark:text-red-400">{stats.cancelled}</p>
              <p className="text-sm text-red-600 dark:text-red-500">Cancelled</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function BookingRow({ booking, selected, onSelect }: { booking: Booking; selected: boolean; onSelect: () => void }) {
  const config = statusConfig[booking.status];
  const StatusIcon = config.icon;

  return (
    <TableRow className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
      <TableCell>
        <Checkbox checked={selected} onCheckedChange={onSelect} />
      </TableCell>
      <TableCell>
        <div className="flex flex-col">
          <span className="font-semibold text-sm">{booking.reference}</span>
          {booking.poNumber && (
            <span className="text-xs text-slate-500">{booking.poNumber}</span>
          )}
        </div>
      </TableCell>
      <TableCell>
        <B2BStatusBadge status={config.label} variant={config.variant} pulse={booking.status === 'in-transit'} />
      </TableCell>
      <TableCell>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="truncate max-w-[200px]">{booking.pickup.address}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <span className="truncate max-w-[200px]">{booking.delivery.address}</span>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex flex-col text-sm">
          <span>{formatDate(booking.pickup.date)}</span>
          <span className="text-slate-500">{booking.pickup.time}</span>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant="outline" className="font-normal">
          {booking.vehicleType}
        </Badge>
      </TableCell>
      <TableCell className="text-right font-semibold">
        {formatCurrency(booking.price)}
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
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem>
              <MapPin className="h-4 w-4 mr-2" />
              Track Shipment
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Copy className="h-4 w-4 mr-2" />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuItem>
              <FileText className="h-4 w-4 mr-2" />
              Download POD
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600">
              <Trash2 className="h-4 w-4 mr-2" />
              Cancel Booking
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function B2BBookingsDashboard() {
  const [bookings, setBookings] = useState<Booking[]>(mockBookings);
  const [stats, setStats] = useState<BookingStats>(mockStats);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedBookings, setSelectedBookings] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  const filteredBookings = bookings.filter((booking) => {
    const matchesSearch = booking.reference.toLowerCase().includes(search.toLowerCase()) ||
      booking.pickup.address.toLowerCase().includes(search.toLowerCase()) ||
      booking.delivery.address.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const toggleSelect = (id: string) => {
    setSelectedBookings((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedBookings.length === filteredBookings.length) {
      setSelectedBookings([]);
    } else {
      setSelectedBookings(filteredBookings.map((b) => b.id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <Package className="h-8 w-8 text-blue-500" />
            Bookings
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Manage and track all your shipments
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
            <Plus className="h-4 w-4 mr-2" />
            New Booking
          </Button>
        </div>
      </div>

      {/* Stats */}
      <BookingStatsCards stats={stats} />

      {/* Filters & Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by reference, address..."
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
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="in-transit">In Transit</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          {/* Bulk Actions */}
          {selectedBookings.length > 0 && (
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-xl flex items-center justify-between">
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                {selectedBookings.length} booking(s) selected
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Send className="h-4 w-4 mr-2" />
                  Send to Driver
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export Selected
                </Button>
                <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Cancel Selected
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bookings Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 dark:bg-slate-800/50">
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedBookings.length === filteredBookings.length && filteredBookings.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Route</TableHead>
                <TableHead>
                  <div className="flex items-center gap-1 cursor-pointer hover:text-slate-900">
                    Date <ArrowUpDown className="h-3 w-3" />
                  </div>
                </TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBookings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12">
                    <Package className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                    <p className="text-slate-500 dark:text-slate-400">No bookings found</p>
                    <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
                      Try adjusting your filters or create a new booking
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredBookings.map((booking) => (
                  <BookingRow
                    key={booking.id}
                    booking={booking}
                    selected={selectedBookings.includes(booking.id)}
                    onSelect={() => toggleSelect(booking.id)}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>

        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-800">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Showing {filteredBookings.length} of {bookings.length} bookings
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={currentPage === 1}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm px-3">Page {currentPage}</span>
            <Button variant="outline" size="sm">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
