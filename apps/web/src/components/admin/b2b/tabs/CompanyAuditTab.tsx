'use client';

/**
 * Company Audit Tab Component
 * 
 * Displays audit log for company activities
 */

import { useState, useEffect } from 'react';
import {
  History,
  User,
  Key,
  Building2,
  CreditCard,
  FileText,
  Package,
  Filter,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

interface CompanyAuditTabProps {
  companyId: string;
}

interface AuditLog {
  id: string;
  action: string;
  actorId: string;
  actorType: 'user' | 'admin' | 'system' | 'api_key';
  targetType: string;
  targetId?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

const actionConfig: Record<string, { label: string; icon: any; color: string }> = {
  COMPANY_CREATED: { label: 'Company Created', icon: Building2, color: 'bg-green-100 text-green-800' },
  COMPANY_UPDATED: { label: 'Company Updated', icon: Building2, color: 'bg-blue-100 text-blue-800' },
  COMPANY_SUSPENDED: { label: 'Company Suspended', icon: Building2, color: 'bg-red-100 text-red-800' },
  USER_ADDED: { label: 'User Added', icon: User, color: 'bg-green-100 text-green-800' },
  USER_REMOVED: { label: 'User Removed', icon: User, color: 'bg-red-100 text-red-800' },
  USER_ROLE_UPDATED: { label: 'Role Updated', icon: User, color: 'bg-blue-100 text-blue-800' },
  API_KEY_CREATED: { label: 'API Key Created', icon: Key, color: 'bg-green-100 text-green-800' },
  API_KEY_REVOKED: { label: 'API Key Revoked', icon: Key, color: 'bg-red-100 text-red-800' },
  CREDIT_LIMIT_UPDATED: { label: 'Credit Updated', icon: CreditCard, color: 'bg-blue-100 text-blue-800' },
  INVOICE_CREATED: { label: 'Invoice Created', icon: FileText, color: 'bg-green-100 text-green-800' },
  INVOICE_PAID: { label: 'Invoice Paid', icon: FileText, color: 'bg-green-100 text-green-800' },
  BOOKING_CREATED: { label: 'Booking Created', icon: Package, color: 'bg-green-100 text-green-800' },
  QUOTE_CREATED: { label: 'Quote Created', icon: FileText, color: 'bg-blue-100 text-blue-800' },
  QUOTE_ACCEPTED: { label: 'Quote Accepted', icon: FileText, color: 'bg-green-100 text-green-800' },
};

export default function CompanyAuditTab({ companyId }: CompanyAuditTabProps) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState<string>('all');

  useEffect(() => {
    fetchLogs();
  }, [companyId, actionFilter]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      // TODO: Implement API endpoint
      // For now, use mock data
      setLogs([]);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      toast.error('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  const getActionConfig = (action: string) => {
    return actionConfig[action] || {
      label: action,
      icon: History,
      color: 'bg-gray-100 text-gray-800',
    };
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Audit Log
          </CardTitle>
          <CardDescription>
            Track all activities and changes for this company
          </CardDescription>
        </div>
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            <SelectItem value="company">Company Changes</SelectItem>
            <SelectItem value="user">User Changes</SelectItem>
            <SelectItem value="apikey">API Key Changes</SelectItem>
            <SelectItem value="booking">Bookings</SelectItem>
            <SelectItem value="invoice">Invoices</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <div className="text-center py-12">
            <History className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No activity yet</h3>
            <p className="text-muted-foreground">
              Activity will be logged here as changes are made
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {logs.map((log) => {
              const config = getActionConfig(log.action);
              const ActionIcon = config.icon;
              return (
                <div
                  key={log.id}
                  className="flex items-start gap-4 p-4 border rounded-lg"
                >
                  <div className={`p-2 rounded-full ${config.color}`}>
                    <ActionIcon className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{config.label}</span>
                      <Badge variant="outline" className="text-xs">
                        {log.actorType}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {log.targetType && (
                        <span>Target: {log.targetType}</span>
                      )}
                      {log.metadata && Object.keys(log.metadata).length > 0 && (
                        <span className="ml-2">
                          {JSON.stringify(log.metadata)}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-2">
                      {formatDate(log.createdAt)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
