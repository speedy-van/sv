'use client';

/**
 * B2B Notifications Center
 * 
 * Real-time notification system for B2B portal with advanced filtering,
 * grouping, and notification preferences management.
 */

import { useState, useEffect } from 'react';
import {
  Bell,
  Check,
  CheckCheck,
  X,
  Clock,
  AlertTriangle,
  AlertCircle,
  Info,
  Package,
  CreditCard,
  Truck,
  Key,
  Users,
  FileText,
  Settings,
  Filter,
  MoreVertical,
  Trash2,
  Archive,
  Volume2,
  VolumeX,
  Mail,
  Smartphone,
  RefreshCw,
  ChevronRight,
  Building2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

type NotificationType = 
  | 'booking_created' 
  | 'booking_confirmed' 
  | 'booking_completed'
  | 'booking_cancelled'
  | 'invoice_created' 
  | 'invoice_paid' 
  | 'invoice_overdue'
  | 'payment_received'
  | 'api_usage_warning'
  | 'api_key_expiring'
  | 'user_added'
  | 'user_removed'
  | 'credit_warning'
  | 'system_update'
  | 'driver_assigned';

type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  read: boolean;
  archived: boolean;
  createdAt: string;
  metadata?: {
    bookingId?: string;
    invoiceId?: string;
    amount?: number;
    userId?: string;
    apiUsagePercent?: number;
  };
}

interface NotificationPreferences {
  email: boolean;
  push: boolean;
  sound: boolean;
  categories: {
    bookings: boolean;
    invoices: boolean;
    api: boolean;
    team: boolean;
    system: boolean;
  };
}

// ============================================================================
// Configuration
// ============================================================================

const notificationConfig: Record<NotificationType, {
  icon: React.ElementType;
  color: string;
  bgColor: string;
  category: string;
}> = {
  booking_created: { 
    icon: Package, 
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    category: 'bookings',
  },
  booking_confirmed: { 
    icon: Check, 
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
    category: 'bookings',
  },
  booking_completed: { 
    icon: CheckCheck, 
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
    category: 'bookings',
  },
  booking_cancelled: { 
    icon: X, 
    color: 'text-red-600',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    category: 'bookings',
  },
  invoice_created: { 
    icon: FileText, 
    color: 'text-purple-600',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    category: 'invoices',
  },
  invoice_paid: { 
    icon: CreditCard, 
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
    category: 'invoices',
  },
  invoice_overdue: { 
    icon: AlertTriangle, 
    color: 'text-red-600',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    category: 'invoices',
  },
  payment_received: { 
    icon: CreditCard, 
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
    category: 'invoices',
  },
  api_usage_warning: { 
    icon: AlertCircle, 
    color: 'text-amber-600',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    category: 'api',
  },
  api_key_expiring: { 
    icon: Key, 
    color: 'text-amber-600',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    category: 'api',
  },
  user_added: { 
    icon: Users, 
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    category: 'team',
  },
  user_removed: { 
    icon: Users, 
    color: 'text-slate-600',
    bgColor: 'bg-slate-100 dark:bg-slate-800',
    category: 'team',
  },
  credit_warning: { 
    icon: AlertTriangle, 
    color: 'text-amber-600',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    category: 'invoices',
  },
  system_update: { 
    icon: Info, 
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    category: 'system',
  },
  driver_assigned: { 
    icon: Truck, 
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100 dark:bg-indigo-900/30',
    category: 'bookings',
  },
};

const priorityConfig = {
  low: { color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
  medium: { color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  high: { color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  urgent: { color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
};

// ============================================================================
// Sample Data
// ============================================================================

const sampleNotifications: Notification[] = [
  {
    id: '1',
    type: 'booking_confirmed',
    title: 'Booking Confirmed',
    message: 'Booking #BK-2024-0542 has been confirmed and a driver has been assigned.',
    priority: 'medium',
    read: false,
    archived: false,
    createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    metadata: { bookingId: 'BK-2024-0542' },
  },
  {
    id: '2',
    type: 'invoice_overdue',
    title: 'Invoice Overdue',
    message: 'Invoice #INV-2024-0128 is now 7 days overdue. Amount: £2,450.00',
    priority: 'urgent',
    read: false,
    archived: false,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    metadata: { invoiceId: 'INV-2024-0128', amount: 245000 },
  },
  {
    id: '3',
    type: 'api_usage_warning',
    title: 'API Usage Alert',
    message: 'Your API usage has reached 85% of your monthly limit.',
    priority: 'high',
    read: false,
    archived: false,
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    metadata: { apiUsagePercent: 85 },
  },
  {
    id: '4',
    type: 'user_added',
    title: 'New Team Member',
    message: 'John Smith has been added to your team as a Manager.',
    priority: 'low',
    read: true,
    archived: false,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    metadata: { userId: 'user-123' },
  },
  {
    id: '5',
    type: 'booking_completed',
    title: 'Delivery Complete',
    message: 'Booking #BK-2024-0538 has been successfully delivered.',
    priority: 'low',
    read: true,
    archived: false,
    createdAt: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
    metadata: { bookingId: 'BK-2024-0538' },
  },
  {
    id: '6',
    type: 'payment_received',
    title: 'Payment Received',
    message: 'Payment of £1,850.00 received for invoice #INV-2024-0125.',
    priority: 'medium',
    read: true,
    archived: false,
    createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    metadata: { invoiceId: 'INV-2024-0125', amount: 185000 },
  },
];

// ============================================================================
// Helper Functions
// ============================================================================

function getRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

// ============================================================================
// Sub Components
// ============================================================================

function NotificationItem({
  notification,
  onRead,
  onArchive,
  onDelete,
}: {
  notification: Notification;
  onRead: (id: string) => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const config = notificationConfig[notification.type];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'flex gap-4 p-4 rounded-xl transition-colors cursor-pointer group',
        notification.read 
          ? 'bg-white dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-800/50' 
          : 'bg-blue-50/50 dark:bg-blue-950/20 hover:bg-blue-50 dark:hover:bg-blue-950/30'
      )}
      onClick={() => onRead(notification.id)}
    >
      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', config.bgColor)}>
        <Icon className={cn('h-5 w-5', config.color)} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <h4 className={cn(
              'text-sm',
              notification.read ? 'font-medium text-slate-700 dark:text-slate-300' : 'font-semibold text-slate-900 dark:text-white'
            )}>
              {notification.title}
            </h4>
            {notification.priority !== 'low' && (
              <Badge variant="secondary" className={cn('text-[10px] px-1.5 py-0', priorityConfig[notification.priority].color)}>
                {notification.priority}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs text-slate-400">{getRelativeTime(notification.createdAt)}</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {!notification.read && (
                  <DropdownMenuItem onClick={() => onRead(notification.id)}>
                    <Check className="h-4 w-4 mr-2" />
                    Mark as read
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => onArchive(notification.id)}>
                  <Archive className="h-4 w-4 mr-2" />
                  Archive
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDelete(notification.id)} className="text-red-600">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{notification.message}</p>
      </div>
      {!notification.read && (
        <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1.5" />
      )}
    </div>
  );
}

function NotificationPreferencesPanel({
  preferences,
  onUpdate,
}: {
  preferences: NotificationPreferences;
  onUpdate: (prefs: NotificationPreferences) => void;
}) {
  const updateCategory = (category: keyof NotificationPreferences['categories'], value: boolean) => {
    onUpdate({
      ...preferences,
      categories: {
        ...preferences.categories,
        [category]: value,
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Delivery Methods */}
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Delivery Methods</h4>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-slate-500" />
              <span className="text-sm">Email notifications</span>
            </div>
            <Switch
              checked={preferences.email}
              onCheckedChange={(v) => onUpdate({ ...preferences, email: v })}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Smartphone className="h-4 w-4 text-slate-500" />
              <span className="text-sm">Push notifications</span>
            </div>
            <Switch
              checked={preferences.push}
              onCheckedChange={(v) => onUpdate({ ...preferences, push: v })}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {preferences.sound ? (
                <Volume2 className="h-4 w-4 text-slate-500" />
              ) : (
                <VolumeX className="h-4 w-4 text-slate-500" />
              )}
              <span className="text-sm">Sound alerts</span>
            </div>
            <Switch
              checked={preferences.sound}
              onCheckedChange={(v) => onUpdate({ ...preferences, sound: v })}
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Categories */}
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Notification Categories</h4>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Package className="h-4 w-4 text-blue-500" />
              <span className="text-sm">Booking updates</span>
            </div>
            <Switch
              checked={preferences.categories.bookings}
              onCheckedChange={(v) => updateCategory('bookings', v)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CreditCard className="h-4 w-4 text-purple-500" />
              <span className="text-sm">Invoices & Payments</span>
            </div>
            <Switch
              checked={preferences.categories.invoices}
              onCheckedChange={(v) => updateCategory('invoices', v)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Key className="h-4 w-4 text-amber-500" />
              <span className="text-sm">API & Integrations</span>
            </div>
            <Switch
              checked={preferences.categories.api}
              onCheckedChange={(v) => updateCategory('api', v)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="h-4 w-4 text-emerald-500" />
              <span className="text-sm">Team activity</span>
            </div>
            <Switch
              checked={preferences.categories.team}
              onCheckedChange={(v) => updateCategory('team', v)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Info className="h-4 w-4 text-slate-500" />
              <span className="text-sm">System announcements</span>
            </div>
            <Switch
              checked={preferences.categories.system}
              onCheckedChange={(v) => updateCategory('system', v)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Notification Bell Component (For Header)
// ============================================================================

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState(sampleNotifications);
  
  const unreadCount = notifications.filter(n => !n.read && !n.archived).length;

  const handleRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const handleMarkAllRead = () => {
    setNotifications(prev =>
      prev.map(n => ({ ...n, read: true }))
    );
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs font-semibold flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:w-[400px] p-0">
        <SheetHeader className="p-4 border-b">
          <div className="flex items-center justify-between">
            <SheetTitle>Notifications</SheetTitle>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={handleMarkAllRead}>
                <CheckCheck className="h-4 w-4 mr-1" />
                Mark all read
              </Button>
            )}
          </div>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-80px)]">
          <div className="p-2 space-y-1">
            {notifications.filter(n => !n.archived).length === 0 ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3">
                  <Bell className="h-6 w-6 text-slate-400" />
                </div>
                <p className="text-sm text-slate-500">No notifications</p>
              </div>
            ) : (
              notifications
                .filter(n => !n.archived)
                .map(notification => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onRead={handleRead}
                    onArchive={(id) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, archived: true } : n))}
                    onDelete={(id) => setNotifications(prev => prev.filter(n => n.id !== id))}
                  />
                ))
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

// ============================================================================
// Full Notifications Center (Page Component)
// ============================================================================

export default function B2BNotificationsCenter() {
  const [notifications, setNotifications] = useState(sampleNotifications);
  const [filter, setFilter] = useState<'all' | 'unread' | 'archived'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    email: true,
    push: true,
    sound: false,
    categories: {
      bookings: true,
      invoices: true,
      api: true,
      team: true,
      system: true,
    },
  });

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.read && !n.archived;
    if (filter === 'archived') return n.archived;
    return !n.archived;
  }).filter(n => {
    if (categoryFilter === 'all') return true;
    return notificationConfig[n.type].category === categoryFilter;
  });

  const unreadCount = notifications.filter(n => !n.read && !n.archived).length;
  const archivedCount = notifications.filter(n => n.archived).length;

  const handleRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const handleArchive = (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, archived: true } : n)
    );
  };

  const handleDelete = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleMarkAllRead = () => {
    setNotifications(prev =>
      prev.map(n => ({ ...n, read: true }))
    );
  };

  return (
    <div className="p-6 space-y-6 bg-slate-50 dark:bg-slate-950 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <Bell className="h-5 w-5 text-white" />
            </div>
            Notifications
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Stay updated with your business activities and alerts
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon">
            <RefreshCw className="h-4 w-4" />
          </Button>
          {unreadCount > 0 && (
            <Button variant="outline" onClick={handleMarkAllRead}>
              <CheckCheck className="h-4 w-4 mr-2" />
              Mark all read
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total Notifications</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {notifications.filter(n => !n.archived).length}
                </p>
              </div>
              <Bell className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/50 dark:to-orange-950/50 border-amber-200 dark:border-amber-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Unread</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{unreadCount}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/50 dark:to-rose-950/50 border-red-200 dark:border-red-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Urgent</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {notifications.filter(n => n.priority === 'urgent' && !n.archived).length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border-slate-200 dark:border-slate-700">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Archived</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{archivedCount}</p>
              </div>
              <Archive className="h-8 w-8 text-slate-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Notifications List */}
        <div className="lg:col-span-2 space-y-4">
          <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
            <div className="flex items-center justify-between">
              <TabsList>
                <TabsTrigger value="all">
                  All
                </TabsTrigger>
                <TabsTrigger value="unread" className="relative">
                  Unread
                  {unreadCount > 0 && (
                    <span className="ml-2 px-1.5 py-0.5 text-[10px] font-semibold bg-blue-500 text-white rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="archived">Archived</TabsTrigger>
              </TabsList>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    {categoryFilter === 'all' ? 'All Categories' : categoryFilter}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setCategoryFilter('all')}>
                    All Categories
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setCategoryFilter('bookings')}>
                    <Package className="h-4 w-4 mr-2 text-blue-500" />
                    Bookings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setCategoryFilter('invoices')}>
                    <CreditCard className="h-4 w-4 mr-2 text-purple-500" />
                    Invoices
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setCategoryFilter('api')}>
                    <Key className="h-4 w-4 mr-2 text-amber-500" />
                    API
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setCategoryFilter('team')}>
                    <Users className="h-4 w-4 mr-2 text-emerald-500" />
                    Team
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setCategoryFilter('system')}>
                    <Info className="h-4 w-4 mr-2 text-slate-500" />
                    System
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <TabsContent value={filter} className="mt-4">
              <Card>
                <CardContent className="p-2">
                  {filteredNotifications.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
                        <Bell className="h-8 w-8 text-slate-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                        No notifications
                      </h3>
                      <p className="text-slate-500 dark:text-slate-400 mt-1">
                        {filter === 'unread' 
                          ? "You're all caught up!" 
                          : filter === 'archived'
                            ? 'No archived notifications'
                            : 'No notifications to display'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {filteredNotifications.map(notification => (
                        <NotificationItem
                          key={notification.id}
                          notification={notification}
                          onRead={handleRead}
                          onArchive={handleArchive}
                          onDelete={handleDelete}
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Preferences Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Notification Preferences
              </CardTitle>
              <CardDescription>
                Customize how you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <NotificationPreferencesPanel
                preferences={preferences}
                onUpdate={setPreferences}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
