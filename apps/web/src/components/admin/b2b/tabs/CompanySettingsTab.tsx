'use client';

/**
 * Company Settings Tab Component
 * 
 * Manages company settings and configuration
 */

import { useState } from 'react';
import {
  Settings,
  Save,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';

interface CompanySettingsTabProps {
  companyId: string;
}

export default function CompanySettingsTab({ companyId }: CompanySettingsTabProps) {
  const [saving, setSaving] = useState(false);

  // Settings state
  const [settings, setSettings] = useState({
    autoInvoicing: true,
    emailNotifications: true,
    webhooksEnabled: false,
    requirePONumber: false,
    maxBookingsPerDay: 100,
    defaultPaymentTerms: 30,
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      // TODO: Implement API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Billing Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Billing Settings</CardTitle>
          <CardDescription>
            Configure billing and invoicing preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Auto-generate Invoices</Label>
              <p className="text-sm text-muted-foreground">
                Automatically create invoices for completed bookings
              </p>
            </div>
            <Switch
              checked={settings.autoInvoicing}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, autoInvoicing: checked })
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Require PO Number</Label>
              <p className="text-sm text-muted-foreground">
                Require a purchase order number for all bookings
              </p>
            </div>
            <Switch
              checked={settings.requirePONumber}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, requirePONumber: checked })
              }
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="paymentTerms">Default Payment Terms (days)</Label>
              <Input
                id="paymentTerms"
                type="number"
                value={settings.defaultPaymentTerms}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    defaultPaymentTerms: parseInt(e.target.value) || 30,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxBookings">Max Bookings Per Day</Label>
              <Input
                id="maxBookings"
                type="number"
                value={settings.maxBookingsPerDay}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    maxBookingsPerDay: parseInt(e.target.value) || 100,
                  })
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>
            Configure how the company receives notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Email Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Send email notifications for bookings and invoices
              </p>
            </div>
            <Switch
              checked={settings.emailNotifications}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, emailNotifications: checked })
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Webhooks</Label>
              <p className="text-sm text-muted-foreground">
                Enable webhook notifications for real-time updates
              </p>
            </div>
            <Switch
              checked={settings.webhooksEnabled}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, webhooksEnabled: checked })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>
            Irreversible actions that affect the company account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              These actions cannot be undone. Please proceed with caution.
            </AlertDescription>
          </Alert>
          <div className="flex items-center justify-between">
            <div>
              <Label>Suspend Company</Label>
              <p className="text-sm text-muted-foreground">
                Temporarily disable all company access and API keys
              </p>
            </div>
            <Button variant="destructive" size="sm">
              Suspend
            </Button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Close Account</Label>
              <p className="text-sm text-muted-foreground">
                Permanently close this company account
              </p>
            </div>
            <Button variant="destructive" size="sm">
              Close Account
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  );
}
