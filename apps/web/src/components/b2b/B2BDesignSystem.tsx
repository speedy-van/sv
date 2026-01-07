'use client';

/**
 * B2B Design System Components
 * 
 * Premium enterprise-grade design components for B2B portal
 * Features: Modern glassmorphism, professional gradients, animated elements
 */

import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import {
  TrendingUp,
  TrendingDown,
  Building2,
  Users,
  Package,
  CreditCard,
  BarChart3,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
} from 'lucide-react';

// ============================================================================
// B2B Color Palette & Theme
// ============================================================================

export const B2BTheme = {
  colors: {
    primary: {
      50: '#e6f7ff',
      100: '#bae7ff',
      200: '#91d5ff',
      300: '#69c0ff',
      400: '#40a9ff',
      500: '#1890ff',
      600: '#096dd9',
      700: '#0050b3',
      800: '#003a8c',
      900: '#002766',
    },
    accent: {
      emerald: '#10b981',
      amber: '#f59e0b',
      rose: '#f43f5e',
      violet: '#8b5cf6',
      cyan: '#06b6d4',
    },
    gradient: {
      primary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      success: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
      warning: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      info: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      corporate: 'linear-gradient(135deg, #0c3483 0%, #a2b6df 100%)',
      premium: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
    },
  },
};

// ============================================================================
// B2B Premium Card Component
// ============================================================================

interface B2BCardProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'glass' | 'gradient' | 'elevated' | 'bordered';
  glowColor?: string;
  animate?: boolean;
}

export function B2BCard({
  children,
  className,
  variant = 'default',
  glowColor = 'rgba(24, 144, 255, 0.15)',
  animate = false,
}: B2BCardProps) {
  const variants = {
    default: 'bg-white dark:bg-slate-900 shadow-lg border border-slate-200 dark:border-slate-800',
    glass: 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 shadow-xl',
    gradient: 'bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl',
    elevated: 'bg-white dark:bg-slate-900 shadow-2xl shadow-slate-200/50 dark:shadow-slate-900/50 border-0',
    bordered: 'bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-600',
  };

  return (
    <div
      className={cn(
        'rounded-2xl p-6 transition-all duration-300',
        variants[variant],
        animate && 'hover:scale-[1.02] hover:shadow-2xl',
        className
      )}
      style={variant === 'glass' ? { boxShadow: `0 8px 32px ${glowColor}` } : undefined}
    >
      {children}
    </div>
  );
}

// ============================================================================
// B2B Stats Card Component
// ============================================================================

interface B2BStatsCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
  sparkline?: number[];
  loading?: boolean;
}

export function B2BStatsCard({
  title,
  value,
  change,
  changeLabel,
  icon,
  trend = 'neutral',
  variant = 'primary',
  sparkline,
  loading = false,
}: B2BStatsCardProps) {
  const variantStyles = {
    primary: {
      bg: 'bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50',
      iconBg: 'bg-blue-500',
      text: 'text-blue-600 dark:text-blue-400',
      border: 'border-blue-200 dark:border-blue-800/50',
    },
    success: {
      bg: 'bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/50 dark:to-green-950/50',
      iconBg: 'bg-emerald-500',
      text: 'text-emerald-600 dark:text-emerald-400',
      border: 'border-emerald-200 dark:border-emerald-800/50',
    },
    warning: {
      bg: 'bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/50 dark:to-orange-950/50',
      iconBg: 'bg-amber-500',
      text: 'text-amber-600 dark:text-amber-400',
      border: 'border-amber-200 dark:border-amber-800/50',
    },
    danger: {
      bg: 'bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/50 dark:to-rose-950/50',
      iconBg: 'bg-red-500',
      text: 'text-red-600 dark:text-red-400',
      border: 'border-red-200 dark:border-red-800/50',
    },
    info: {
      bg: 'bg-gradient-to-br from-cyan-50 to-sky-50 dark:from-cyan-950/50 dark:to-sky-950/50',
      iconBg: 'bg-cyan-500',
      text: 'text-cyan-600 dark:text-cyan-400',
      border: 'border-cyan-200 dark:border-cyan-800/50',
    },
  };

  const style = variantStyles[variant];

  if (loading) {
    return (
      <div className={cn('rounded-2xl p-6 border animate-pulse', style.bg, style.border)}>
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mb-4"></div>
        <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/4"></div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'rounded-2xl p-6 border transition-all duration-300 hover:shadow-lg group',
        style.bg,
        style.border
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
            {title}
          </p>
          <h3 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            {value}
          </h3>
        </div>
        {icon && (
          <div
            className={cn(
              'w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform',
              style.iconBg
            )}
          >
            {icon}
          </div>
        )}
      </div>

      {/* Change indicator */}
      {change !== undefined && (
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'flex items-center gap-1 text-sm font-semibold px-2 py-1 rounded-full',
              trend === 'up' && 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400',
              trend === 'down' && 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400',
              trend === 'neutral' && 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
            )}
          >
            {trend === 'up' && <ArrowUpRight className="h-3 w-3" />}
            {trend === 'down' && <ArrowDownRight className="h-3 w-3" />}
            {change > 0 ? '+' : ''}{change}%
          </span>
          {changeLabel && (
            <span className="text-sm text-slate-500 dark:text-slate-400">
              {changeLabel}
            </span>
          )}
        </div>
      )}

      {/* Mini sparkline chart */}
      {sparkline && sparkline.length > 0 && (
        <div className="mt-4 flex items-end gap-1 h-8">
          {sparkline.map((val, i) => (
            <div
              key={i}
              className={cn('flex-1 rounded-sm transition-all', style.iconBg, 'opacity-60')}
              style={{ height: `${Math.max(val, 10)}%` }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// B2B Section Header
// ============================================================================

interface B2BSectionHeaderProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  action?: ReactNode;
  badge?: string;
}

export function B2BSectionHeader({
  title,
  subtitle,
  icon,
  action,
  badge,
}: B2BSectionHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
      <div className="flex items-center gap-4">
        {icon && (
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/25">
            {icon}
          </div>
        )}
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              {title}
            </h2>
            {badge && (
              <span className="px-3 py-1 text-xs font-semibold rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md">
                {badge}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

// ============================================================================
// B2B Premium Button
// ============================================================================

interface B2BButtonProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'ghost' | 'gradient';
  size?: 'sm' | 'md' | 'lg';
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  onClick?: () => void;
}

export function B2BButton({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  className,
  onClick,
}: B2BButtonProps) {
  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/25 hover:shadow-xl hover:shadow-blue-600/30',
    secondary: 'bg-slate-100 hover:bg-slate-200 text-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-white',
    success: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/25',
    danger: 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/25',
    ghost: 'bg-transparent hover:bg-slate-100 text-slate-700 dark:hover:bg-slate-800 dark:text-slate-300',
    gradient: 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-indigo-600/25',
  };

  const sizes = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className
      )}
    >
      {loading ? (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : icon && iconPosition === 'left' ? (
        icon
      ) : null}
      {children}
      {!loading && icon && iconPosition === 'right' ? icon : null}
    </button>
  );
}

// ============================================================================
// B2B Data Table
// ============================================================================

interface B2BTableColumn<T> {
  key: string;
  header: string;
  render?: (item: T) => ReactNode;
  align?: 'left' | 'center' | 'right';
  width?: string;
}

interface B2BTableProps<T> {
  columns: B2BTableColumn<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (item: T) => void;
  rowKey: (item: T) => string;
}

export function B2BTable<T>({
  columns,
  data,
  loading = false,
  emptyMessage = 'No data available',
  onRowClick,
  rowKey,
}: B2BTableProps<T>) {
  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="animate-pulse">
          <div className="bg-slate-100 dark:bg-slate-800 p-4">
            <div className="flex gap-4">
              {columns.map((_, i) => (
                <div key={i} className="h-4 bg-slate-200 dark:bg-slate-700 rounded flex-1" />
              ))}
            </div>
          </div>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="p-4 border-t border-slate-200 dark:border-slate-800">
              <div className="flex gap-4">
                {columns.map((_, j) => (
                  <div key={j} className="h-4 bg-slate-100 dark:bg-slate-800 rounded flex-1" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center">
        <Package className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
        <p className="text-slate-500 dark:text-slate-400">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
      <table className="w-full">
        <thead className="bg-slate-50 dark:bg-slate-800/50">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  'px-6 py-4 text-sm font-semibold text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700',
                  col.align === 'center' && 'text-center',
                  col.align === 'right' && 'text-right'
                )}
                style={{ width: col.width }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
          {data.map((item) => (
            <tr
              key={rowKey(item)}
              onClick={() => onRowClick?.(item)}
              className={cn(
                'bg-white dark:bg-slate-900 transition-colors',
                onRowClick && 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50'
              )}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={cn(
                    'px-6 py-4 text-sm text-slate-700 dark:text-slate-300',
                    col.align === 'center' && 'text-center',
                    col.align === 'right' && 'text-right'
                  )}
                >
                  {col.render ? col.render(item) : (item as any)[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ============================================================================
// B2B Status Badge
// ============================================================================

interface B2BStatusBadgeProps {
  status: string;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'default';
  size?: 'sm' | 'md';
  dot?: boolean;
  pulse?: boolean;
}

export function B2BStatusBadge({
  status,
  variant = 'default',
  size = 'md',
  dot = true,
  pulse = false,
}: B2BStatusBadgeProps) {
  const variants = {
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800',
    warning: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-800',
    danger: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-400 dark:border-red-800',
    info: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-800',
    default: 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
  };

  const dotColors = {
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-red-500',
    info: 'bg-blue-500',
    default: 'bg-slate-500',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-medium rounded-full border',
        variants[variant],
        sizes[size]
      )}
    >
      {dot && (
        <span className={cn('relative flex h-2 w-2')}>
          {pulse && (
            <span
              className={cn(
                'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
                dotColors[variant]
              )}
            />
          )}
          <span
            className={cn('relative inline-flex rounded-full h-2 w-2', dotColors[variant])}
          />
        </span>
      )}
      {status}
    </span>
  );
}

// ============================================================================
// B2B Progress Indicator
// ============================================================================

interface B2BProgressProps {
  value: number;
  max?: number;
  label?: string;
  showValue?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'gradient';
}

export function B2BProgress({
  value,
  max = 100,
  label,
  showValue = true,
  size = 'md',
  variant = 'default',
}: B2BProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const barColors = {
    default: 'bg-blue-500',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-red-500',
    gradient: 'bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500',
  };

  const sizes = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };

  return (
    <div className="w-full">
      {(label || showValue) && (
        <div className="flex justify-between items-center mb-2">
          {label && (
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {label}
            </span>
          )}
          {showValue && (
            <span className="text-sm font-semibold text-slate-900 dark:text-white">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}
      <div
        className={cn(
          'w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden',
          sizes[size]
        )}
      >
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500 ease-out',
            barColors[variant]
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

// ============================================================================
// B2B Empty State
// ============================================================================

interface B2BEmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
}

export function B2BEmptyState({
  title,
  description,
  icon,
  action,
}: B2BEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      {icon && (
        <div className="w-20 h-20 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-6 text-slate-400 dark:text-slate-500">
          {icon}
        </div>
      )}
      <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-slate-500 dark:text-slate-400 max-w-md mb-6">
          {description}
        </p>
      )}
      {action}
    </div>
  );
}

// ============================================================================
// B2B Metric Ring
// ============================================================================

interface B2BMetricRingProps {
  value: number;
  max?: number;
  label: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'success' | 'warning' | 'danger';
}

export function B2BMetricRing({
  value,
  max = 100,
  label,
  size = 'md',
  variant = 'primary',
}: B2BMetricRingProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const colors = {
    primary: 'stroke-blue-500',
    success: 'stroke-emerald-500',
    warning: 'stroke-amber-500',
    danger: 'stroke-red-500',
  };

  const sizes = {
    sm: { width: 80, stroke: 6 },
    md: { width: 120, stroke: 8 },
    lg: { width: 160, stroke: 10 },
  };

  const { width, stroke } = sizes[size];

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width, height: width }}>
        <svg
          className="transform -rotate-90"
          width={width}
          height={width}
          viewBox="0 0 100 100"
        >
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="currentColor"
            strokeWidth={stroke}
            className="text-slate-100 dark:text-slate-800"
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className={cn('transition-all duration-1000 ease-out', colors[variant])}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold text-slate-900 dark:text-white">
            {Math.round(percentage)}%
          </span>
        </div>
      </div>
      <span className="mt-2 text-sm font-medium text-slate-600 dark:text-slate-400">
        {label}
      </span>
    </div>
  );
}

// ============================================================================
// Export All Components
// ============================================================================

export {
  B2BCard as Card,
  B2BStatsCard as StatsCard,
  B2BSectionHeader as SectionHeader,
  B2BButton as Button,
  B2BTable as Table,
  B2BStatusBadge as StatusBadge,
  B2BProgress as Progress,
  B2BEmptyState as EmptyState,
  B2BMetricRing as MetricRing,
};
