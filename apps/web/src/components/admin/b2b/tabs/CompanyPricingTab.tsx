'use client';

/**
 * Company Pricing Tab Component
 * 
 * Manages company-specific pricing rules
 */

import { useState, useEffect } from 'react';
import {
  CreditCard,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  Percent,
  MapPin,
  Clock,
  Package,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

interface CompanyPricingTabProps {
  companyId: string;
}

interface PricingRule {
  id: string;
  name: string;
  description?: string;
  ruleType: 'DISTANCE' | 'VOLUME' | 'TIME' | 'DISCOUNT' | 'SURCHARGE';
  priority: number;
  isActive: boolean;
  baseRateGBP?: number;
  perMileRateGBP?: number;
  minChargeGBP?: number;
  maxChargeGBP?: number;
  discountPercent?: number;
  discountFixedGBP?: number;
  peakMultiplier?: number;
  weekendMultiplier?: number;
  validFrom?: string;
  validTo?: string;
  createdAt: string;
}

const ruleTypeConfig = {
  DISTANCE: { label: 'Distance', icon: MapPin, color: 'bg-blue-100 text-blue-800' },
  VOLUME: { label: 'Volume', icon: Package, color: 'bg-green-100 text-green-800' },
  TIME: { label: 'Time', icon: Clock, color: 'bg-yellow-100 text-yellow-800' },
  DISCOUNT: { label: 'Discount', icon: Percent, color: 'bg-purple-100 text-purple-800' },
  SURCHARGE: { label: 'Surcharge', icon: CreditCard, color: 'bg-red-100 text-red-800' },
};

export default function CompanyPricingTab({ companyId }: CompanyPricingTabProps) {
  const [rules, setRules] = useState<PricingRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [creating, setCreating] = useState(false);

  // Form state
  const [ruleName, setRuleName] = useState('');
  const [ruleType, setRuleType] = useState<string>('DISTANCE');
  const [baseRate, setBaseRate] = useState('');
  const [perMileRate, setPerMileRate] = useState('');
  const [discountPercent, setDiscountPercent] = useState('');

  useEffect(() => {
    fetchRules();
  }, [companyId]);

  const fetchRules = async () => {
    setLoading(true);
    try {
      // TODO: Implement API endpoint
      // For now, use mock data
      setRules([]);
    } catch (error) {
      console.error('Error fetching pricing rules:', error);
      toast.error('Failed to load pricing rules');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!ruleName) {
      toast.error('Rule name is required');
      return;
    }

    setCreating(true);
    try {
      // TODO: Implement API call
      toast.success('Pricing rule created successfully');
      setShowCreateDialog(false);
      resetForm();
      fetchRules();
    } catch (error) {
      console.error('Error creating pricing rule:', error);
      toast.error('Failed to create pricing rule');
    } finally {
      setCreating(false);
    }
  };

  const resetForm = () => {
    setRuleName('');
    setRuleType('DISTANCE');
    setBaseRate('');
    setPerMileRate('');
    setDiscountPercent('');
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(amount / 100);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Pricing Rules
            </CardTitle>
            <CardDescription>
              Configure custom pricing rules for this company
            </CardDescription>
          </div>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Rule
          </Button>
        </CardHeader>
        <CardContent>
          {rules.length === 0 ? (
            <div className="text-center py-12">
              <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No custom pricing rules</h3>
              <p className="text-muted-foreground">
                This company uses standard pricing. Add rules to customize.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rule</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.map((rule) => {
                  const TypeIcon = ruleTypeConfig[rule.ruleType].icon;
                  return (
                    <TableRow key={rule.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{rule.name}</div>
                          {rule.description && (
                            <div className="text-sm text-muted-foreground">
                              {rule.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={ruleTypeConfig[rule.ruleType].color}>
                          <TypeIcon className="h-3 w-3 mr-1" />
                          {ruleTypeConfig[rule.ruleType].label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {rule.ruleType === 'DISTANCE' && (
                          <div className="text-sm">
                            Base: {formatCurrency(rule.baseRateGBP)}<br />
                            Per mile: {formatCurrency(rule.perMileRateGBP)}
                          </div>
                        )}
                        {rule.ruleType === 'DISCOUNT' && (
                          <div className="text-sm">
                            {rule.discountPercent}% off
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={rule.isActive ? 'default' : 'secondary'}>
                          {rule.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>{rule.priority}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Rule Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Pricing Rule</DialogTitle>
            <DialogDescription>
              Add a custom pricing rule for this company
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Rule Name</Label>
              <Input
                id="name"
                placeholder="e.g., Volume Discount"
                value={ruleName}
                onChange={(e) => setRuleName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Rule Type</Label>
              <Select value={ruleType} onValueChange={setRuleType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DISTANCE">Distance Pricing</SelectItem>
                  <SelectItem value="VOLUME">Volume Pricing</SelectItem>
                  <SelectItem value="TIME">Time-based Pricing</SelectItem>
                  <SelectItem value="DISCOUNT">Discount</SelectItem>
                  <SelectItem value="SURCHARGE">Surcharge</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {ruleType === 'DISTANCE' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="baseRate">Base Rate (£)</Label>
                  <Input
                    id="baseRate"
                    type="number"
                    placeholder="45.00"
                    value={baseRate}
                    onChange={(e) => setBaseRate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="perMileRate">Per Mile Rate (£)</Label>
                  <Input
                    id="perMileRate"
                    type="number"
                    placeholder="1.50"
                    value={perMileRate}
                    onChange={(e) => setPerMileRate(e.target.value)}
                  />
                </div>
              </>
            )}

            {ruleType === 'DISCOUNT' && (
              <div className="space-y-2">
                <Label htmlFor="discountPercent">Discount Percentage</Label>
                <Input
                  id="discountPercent"
                  type="number"
                  placeholder="10"
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(e.target.value)}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={creating}>
              {creating ? 'Creating...' : 'Create Rule'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
