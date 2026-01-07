'use client';

/**
 * B2B Dashboard Layout Component
 * 
 * Premium enterprise dashboard layout with sidebar navigation
 * Features: Collapsible sidebar, breadcrumbs, notifications, user menu
 */

import React, { useState, ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Building2,
  LayoutDashboard,
  Package,
  FileText,
  Users,
  Key,
  CreditCard,
  BarChart3,
  Settings,
  Bell,
  Search,
  Menu,
  X,
  ChevronRight,
  ChevronDown,
  LogOut,
  User,
  HelpCircle,
  Moon,
  Sun,
  Briefcase,
  TrendingUp,
  Clock,
  MapPin,
  Truck,
  Receipt,
  Webhook,
  ShieldCheck,
  Globe,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// ============================================================================
// Navigation Configuration
// ============================================================================

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  href?: string;
  badge?: string;
  badgeVariant?: 'default' | 'success' | 'warning' | 'danger';
  children?: NavItem[];
}

const b2bNavigation: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    href: '/b2b/dashboard',
  },
  {
    id: 'bookings',
    label: 'Bookings',
    icon: Package,
    href: '/b2b/bookings',
    badge: '12',
    badgeVariant: 'default',
  },
  {
    id: 'quotes',
    label: 'Quotes',
    icon: FileText,
    children: [
      { id: 'quotes-all', label: 'All Quotes', icon: FileText, href: '/b2b/quotes' },
      { id: 'quotes-pending', label: 'Pending', icon: Clock, href: '/b2b/quotes/pending', badge: '5', badgeVariant: 'warning' },
      { id: 'quotes-new', label: 'Request Quote', icon: Zap, href: '/b2b/quotes/new' },
    ],
  },
  {
    id: 'tracking',
    label: 'Live Tracking',
    icon: MapPin,
    href: '/b2b/tracking',
  },
  {
    id: 'fleet',
    label: 'Fleet Overview',
    icon: Truck,
    href: '/b2b/fleet',
  },
  {
    id: 'invoices',
    label: 'Invoices',
    icon: Receipt,
    children: [
      { id: 'invoices-all', label: 'All Invoices', icon: Receipt, href: '/b2b/invoices' },
      { id: 'invoices-pending', label: 'Pending Payment', icon: Clock, href: '/b2b/invoices/pending', badge: '3', badgeVariant: 'danger' },
      { id: 'invoices-paid', label: 'Paid', icon: ShieldCheck, href: '/b2b/invoices/paid' },
    ],
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: BarChart3,
    children: [
      { id: 'analytics-overview', label: 'Overview', icon: TrendingUp, href: '/b2b/analytics' },
      { id: 'analytics-usage', label: 'API Usage', icon: Zap, href: '/b2b/analytics/usage' },
      { id: 'analytics-reports', label: 'Reports', icon: FileText, href: '/b2b/analytics/reports' },
    ],
  },
  {
    id: 'team',
    label: 'Team',
    icon: Users,
    href: '/b2b/team',
  },
  {
    id: 'api',
    label: 'API & Webhooks',
    icon: Webhook,
    children: [
      { id: 'api-keys', label: 'API Keys', icon: Key, href: '/b2b/api/keys' },
      { id: 'api-webhooks', label: 'Webhooks', icon: Globe, href: '/b2b/api/webhooks' },
      { id: 'api-docs', label: 'Documentation', icon: FileText, href: '/b2b/api/docs' },
    ],
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    children: [
      { id: 'settings-company', label: 'Company', icon: Building2, href: '/b2b/settings/company' },
      { id: 'settings-billing', label: 'Billing', icon: CreditCard, href: '/b2b/settings/billing' },
      { id: 'settings-notifications', label: 'Notifications', icon: Bell, href: '/b2b/settings/notifications' },
      { id: 'settings-security', label: 'Security', icon: ShieldCheck, href: '/b2b/settings/security' },
    ],
  },
];

// ============================================================================
// Sidebar Component
// ============================================================================

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  companyName?: string;
  companyLogo?: string;
}

function Sidebar({ collapsed, onToggle, companyName = 'Company Name', companyLogo }: SidebarProps) {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<string[]>(['quotes', 'invoices']);

  const toggleExpand = (itemId: string) => {
    setExpandedItems((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
    );
  };

  const isActive = (href?: string) => {
    if (!href) return false;
    return pathname === href || pathname?.startsWith(href + '/');
  };

  const renderNavItem = (item: NavItem, depth = 0) => {
    const Icon = item.icon;
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.includes(item.id);
    const active = isActive(item.href);

    return (
      <div key={item.id}>
        {item.href ? (
          <Link href={item.href}>
            <div
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200 group',
                depth > 0 && 'ml-4',
                active
                  ? 'bg-gradient-to-r from-blue-500/10 to-indigo-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
              )}
            >
              <Icon
                className={cn(
                  'w-5 h-5 flex-shrink-0 transition-colors',
                  active ? 'text-blue-500' : 'text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300'
                )}
              />
              {!collapsed && (
                <>
                  <span className="flex-1 font-medium text-sm">{item.label}</span>
                  {item.badge && (
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-xs px-2',
                        item.badgeVariant === 'success' && 'border-emerald-500 text-emerald-600',
                        item.badgeVariant === 'warning' && 'border-amber-500 text-amber-600',
                        item.badgeVariant === 'danger' && 'border-red-500 text-red-600'
                      )}
                    >
                      {item.badge}
                    </Badge>
                  )}
                </>
              )}
            </div>
          </Link>
        ) : (
          <div
            onClick={() => hasChildren && toggleExpand(item.id)}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200 group',
              depth > 0 && 'ml-4',
              'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
            )}
          >
            <Icon className="w-5 h-5 flex-shrink-0 text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300" />
            {!collapsed && (
              <>
                <span className="flex-1 font-medium text-sm">{item.label}</span>
                {item.badge && (
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-xs px-2 mr-2',
                      item.badgeVariant === 'success' && 'border-emerald-500 text-emerald-600',
                      item.badgeVariant === 'warning' && 'border-amber-500 text-amber-600',
                      item.badgeVariant === 'danger' && 'border-red-500 text-red-600'
                    )}
                  >
                    {item.badge}
                  </Badge>
                )}
                {hasChildren && (
                  <ChevronDown
                    className={cn(
                      'w-4 h-4 text-slate-400 transition-transform duration-200',
                      isExpanded && 'rotate-180'
                    )}
                  />
                )}
              </>
            )}
          </div>
        )}

        {/* Children */}
        {hasChildren && isExpanded && !collapsed && (
          <div className="mt-1 space-y-1">
            {item.children!.map((child) => renderNavItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          'fixed left-0 top-0 h-screen bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 z-40 flex flex-col',
          collapsed ? 'w-20' : 'w-72'
        )}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            {!collapsed && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/25">
                  {companyLogo ? (
                    <img src={companyLogo} alt="Logo" className="w-6 h-6" />
                  ) : (
                    <Building2 className="w-5 h-5" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="font-bold text-slate-900 dark:text-white truncate">
                    {companyName}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">B2B Portal</p>
                </div>
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggle}
              className="h-9 w-9 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {collapsed ? <Menu className="h-5 w-5" /> : <X className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {b2bNavigation.map((item) =>
            collapsed ? (
              <Tooltip key={item.id}>
                <TooltipTrigger asChild>
                  <Link href={item.href || '#'}>
                    <div
                      className={cn(
                        'flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-200 mx-auto',
                        isActive(item.href)
                          ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500'
                      )}
                    >
                      <item.icon className="w-5 h-5" />
                    </div>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={10}>
                  {item.label}
                </TooltipContent>
              </Tooltip>
            ) : (
              renderNavItem(item)
            )
          )}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
          {!collapsed && (
            <div className="mb-4 p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 border border-blue-200/50 dark:border-blue-800/50">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-semibold text-slate-900 dark:text-white">
                  Enterprise Plan
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                5,000 API calls remaining this month
              </p>
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
                <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: '65%' }} />
              </div>
            </div>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size={collapsed ? 'icon' : 'default'}
                className={cn(
                  'w-full justify-start gap-3',
                  collapsed && 'justify-center'
                )}
              >
                <HelpCircle className="w-5 h-5" />
                {!collapsed && <span>Help & Support</span>}
              </Button>
            </TooltipTrigger>
            {collapsed && (
              <TooltipContent side="right">Help & Support</TooltipContent>
            )}
          </Tooltip>
        </div>
      </aside>
    </TooltipProvider>
  );
}

// ============================================================================
// Header Component
// ============================================================================

interface HeaderProps {
  sidebarCollapsed: boolean;
  onMenuClick: () => void;
  userName?: string;
  userEmail?: string;
  userAvatar?: string;
}

function Header({
  sidebarCollapsed,
  onMenuClick,
  userName = 'John Doe',
  userEmail = 'john@company.com',
  userAvatar,
}: HeaderProps) {
  const [darkMode, setDarkMode] = useState(false);

  return (
    <header
      className={cn(
        'fixed top-0 right-0 h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 z-30 transition-all duration-300 flex items-center justify-between px-6',
        sidebarCollapsed ? 'left-20' : 'left-72'
      )}
    >
      {/* Left Side - Search */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search bookings, invoices..."
            className="w-80 pl-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-0.5 text-xs font-medium bg-slate-200 dark:bg-slate-700 rounded text-slate-500">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right Side - Actions */}
      <div className="flex items-center gap-3">
        {/* Quick Actions */}
        <Button
          variant="default"
          size="sm"
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-600/25"
        >
          <Package className="h-4 w-4 mr-2" />
          New Booking
        </Button>

        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setDarkMode(!darkMode)}
          className="h-10 w-10 rounded-xl"
        >
          {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl relative">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                3
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="max-h-96 overflow-y-auto">
              <DropdownMenuItem className="flex flex-col items-start gap-1 p-4">
                <span className="font-medium text-sm">Invoice #INV-2024-001 is due</span>
                <span className="text-xs text-slate-500">Payment due in 3 days • £2,450.00</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex flex-col items-start gap-1 p-4">
                <span className="font-medium text-sm">Booking confirmed</span>
                <span className="text-xs text-slate-500">Order #SV-001234 pickup tomorrow</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex flex-col items-start gap-1 p-4">
                <span className="font-medium text-sm">API usage alert</span>
                <span className="text-xs text-slate-500">80% of monthly quota used</span>
              </DropdownMenuItem>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-center text-blue-600">
              View all notifications
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-10 pl-2 pr-3 rounded-xl gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-sm">
                {userAvatar ? (
                  <img src={userAvatar} alt="Avatar" className="w-full h-full rounded-full" />
                ) : (
                  userName.charAt(0).toUpperCase()
                )}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-slate-900 dark:text-white">
                  {userName}
                </p>
                <p className="text-xs text-slate-500">{userEmail}</p>
              </div>
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="h-4 w-4 mr-2" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem>
              <CreditCard className="h-4 w-4 mr-2" />
              Billing
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600">
              <LogOut className="h-4 w-4 mr-2" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

// ============================================================================
// Main Layout Component
// ============================================================================

interface B2BDashboardLayoutProps {
  children: ReactNode;
  companyName?: string;
  companyLogo?: string;
  userName?: string;
  userEmail?: string;
  userAvatar?: string;
}

export default function B2BDashboardLayout({
  children,
  companyName,
  companyLogo,
  userName,
  userEmail,
  userAvatar,
}: B2BDashboardLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        companyName={companyName}
        companyLogo={companyLogo}
      />
      <Header
        sidebarCollapsed={sidebarCollapsed}
        onMenuClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        userName={userName}
        userEmail={userEmail}
        userAvatar={userAvatar}
      />
      <main
        className={cn(
          'pt-16 min-h-screen transition-all duration-300',
          sidebarCollapsed ? 'ml-20' : 'ml-72'
        )}
      >
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}

// Export sub-components for flexibility
export { Sidebar as B2BSidebar, Header as B2BHeader };
