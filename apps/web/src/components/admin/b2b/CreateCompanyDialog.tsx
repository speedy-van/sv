'use client';

/**
 * Create Company Dialog Component
 * 
 * Dialog for creating a new B2B company
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

interface CreateCompanyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function CreateCompanyDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateCompanyDialogProps) {
  const [creating, setCreating] = useState(false);
  const [step, setStep] = useState(1);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    legalName: '',
    vatNumber: '',
    companyNumber: '',
    industry: '',
    website: '',
    email: '',
    phone: '',
    billingAddressLine1: '',
    billingAddressLine2: '',
    billingCity: '',
    billingPostcode: '',
    creditLimitGBP: '',
    paymentTermsDays: '30',
  });

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreate = async () => {
    if (!formData.name) {
      toast.error('Company name is required');
      return;
    }

    setCreating(true);
    try {
      const response = await fetch('/api/admin/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          creditLimitGBP: formData.creditLimitGBP
            ? Math.round(parseFloat(formData.creditLimitGBP) * 100)
            : 0,
          paymentTermsDays: parseInt(formData.paymentTermsDays) || 30,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Company created successfully');
        onSuccess();
        resetForm();
      } else {
        toast.error(data.error || 'Failed to create company');
      }
    } catch (error) {
      console.error('Error creating company:', error);
      toast.error('Failed to create company');
    } finally {
      setCreating(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      legalName: '',
      vatNumber: '',
      companyNumber: '',
      industry: '',
      website: '',
      email: '',
      phone: '',
      billingAddressLine1: '',
      billingAddressLine2: '',
      billingCity: '',
      billingPostcode: '',
      creditLimitGBP: '',
      paymentTermsDays: '30',
    });
    setStep(1);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Company</DialogTitle>
          <DialogDescription>
            Add a new B2B company account. Step {step} of 3.
          </DialogDescription>
        </DialogHeader>

        {/* Step 1: Basic Information */}
        {step === 1 && (
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Company Name *</Label>
                <Input
                  id="name"
                  placeholder="Acme Ltd"
                  value={formData.name}
                  onChange={(e) => updateField('name', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="legalName">Legal Name</Label>
                <Input
                  id="legalName"
                  placeholder="Acme Limited"
                  value={formData.legalName}
                  onChange={(e) => updateField('legalName', e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vatNumber">VAT Number</Label>
                <Input
                  id="vatNumber"
                  placeholder="GB123456789"
                  value={formData.vatNumber}
                  onChange={(e) => updateField('vatNumber', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyNumber">Company Number</Label>
                <Input
                  id="companyNumber"
                  placeholder="12345678"
                  value={formData.companyNumber}
                  onChange={(e) => updateField('companyNumber', e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="industry">Industry</Label>
                <Select
                  value={formData.industry}
                  onValueChange={(value) => updateField('industry', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="retail">Retail</SelectItem>
                    <SelectItem value="ecommerce">E-commerce</SelectItem>
                    <SelectItem value="manufacturing">Manufacturing</SelectItem>
                    <SelectItem value="logistics">Logistics</SelectItem>
                    <SelectItem value="healthcare">Healthcare</SelectItem>
                    <SelectItem value="construction">Construction</SelectItem>
                    <SelectItem value="hospitality">Hospitality</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  type="url"
                  placeholder="https://example.com"
                  value={formData.website}
                  onChange={(e) => updateField('website', e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Contact & Address */}
        {step === 2 && (
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="accounts@example.com"
                  value={formData.email}
                  onChange={(e) => updateField('email', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  placeholder="+44 20 1234 5678"
                  value={formData.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="billingAddressLine1">Billing Address Line 1</Label>
              <Input
                id="billingAddressLine1"
                placeholder="123 Business Street"
                value={formData.billingAddressLine1}
                onChange={(e) => updateField('billingAddressLine1', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="billingAddressLine2">Billing Address Line 2</Label>
              <Input
                id="billingAddressLine2"
                placeholder="Suite 100"
                value={formData.billingAddressLine2}
                onChange={(e) => updateField('billingAddressLine2', e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="billingCity">City</Label>
                <Input
                  id="billingCity"
                  placeholder="London"
                  value={formData.billingCity}
                  onChange={(e) => updateField('billingCity', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="billingPostcode">Postcode</Label>
                <Input
                  id="billingPostcode"
                  placeholder="SW1A 1AA"
                  value={formData.billingPostcode}
                  onChange={(e) => updateField('billingPostcode', e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Credit & Payment Terms */}
        {step === 3 && (
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="creditLimitGBP">Credit Limit (£)</Label>
                <Input
                  id="creditLimitGBP"
                  type="number"
                  placeholder="10000"
                  value={formData.creditLimitGBP}
                  onChange={(e) => updateField('creditLimitGBP', e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Maximum outstanding balance allowed
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="paymentTermsDays">Payment Terms (days)</Label>
                <Select
                  value={formData.paymentTermsDays}
                  onValueChange={(value) => updateField('paymentTermsDays', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Due on receipt</SelectItem>
                    <SelectItem value="7">Net 7</SelectItem>
                    <SelectItem value="14">Net 14</SelectItem>
                    <SelectItem value="30">Net 30</SelectItem>
                    <SelectItem value="45">Net 45</SelectItem>
                    <SelectItem value="60">Net 60</SelectItem>
                    <SelectItem value="90">Net 90</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Days until invoice payment is due
                </p>
              </div>
            </div>
            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-medium mb-2">Summary</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>Company: {formData.name || '-'}</div>
                <div>VAT: {formData.vatNumber || '-'}</div>
                <div>Credit Limit: £{formData.creditLimitGBP || '0'}</div>
                <div>Payment Terms: {formData.paymentTermsDays} days</div>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          {step > 1 && (
            <Button variant="outline" onClick={() => setStep(step - 1)}>
              Back
            </Button>
          )}
          {step < 3 ? (
            <Button onClick={() => setStep(step + 1)}>
              Next
            </Button>
          ) : (
            <Button onClick={handleCreate} disabled={creating}>
              {creating ? 'Creating...' : 'Create Company'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
