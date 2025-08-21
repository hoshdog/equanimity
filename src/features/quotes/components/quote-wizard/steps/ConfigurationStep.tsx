'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { SearchableCombobox } from '@/components/ui/SearchableCombobox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Settings2, 
  FileText, 
  Calendar as CalendarIcon, 
  DollarSign,
  Users,
  AlertCircle,
  Shield,
  Clock,
  Zap
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { QuoteFormData } from '../../../types/quote.types';
import { 
  generateQuoteNumber, 
  getValidUntilPresets, 
  calculateValidUntilDate,
  getTermsTemplates,
  getDefaultTermsTemplate
} from '../../../utils/quote-utils';

interface ConfigurationStepProps {
  data: Partial<QuoteFormData>;
  onChange: (updates: Partial<QuoteFormData>) => void;
}

export function ConfigurationStep({ data, onChange }: ConfigurationStepProps) {
  const [validUntilOpen, setValidUntilOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string>('custom');

  // Auto-generate quote number on mount if not set
  useEffect(() => {
    if (!data.name) {
      const quoteNumber = generateQuoteNumber();
      onChange({ name: quoteNumber });
    }
  }, []);

  const validUntilPresets = getValidUntilPresets();
  const termsTemplates = getTermsTemplates();
  
  const quotingProfiles = termsTemplates.map(template => ({
    value: template.id,
    label: template.name,
    description: template.description,
    content: template.content,
  }));

  const taxProfiles = [
    { value: 'standard-gst', label: 'Standard GST (10%)', rate: 0.10 },
    { value: 'gst-free', label: 'GST Free (0%)', rate: 0 },
    { value: 'export', label: 'Export (0%)', rate: 0 },
  ];

  const paymentTerms = [
    { value: 'net-7', label: 'Net 7 Days' },
    { value: 'net-14', label: 'Net 14 Days' },
    { value: 'net-30', label: 'Net 30 Days' },
    { value: 'net-60', label: 'Net 60 Days' },
    { value: 'due-on-receipt', label: 'Due on Receipt' },
    { value: '50-deposit', label: '50% Deposit' },
  ];

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ name: e.target.value });
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange({ description: e.target.value });
  };

  const handleValidUntilChange = (date: Date | undefined) => {
    onChange({ validUntil: date });
    setValidUntilOpen(false);
    setSelectedPreset('custom');
  };

  const handlePresetSelect = (presetValue: string) => {
    setSelectedPreset(presetValue);
    if (presetValue !== 'custom') {
      const date = calculateValidUntilDate(presetValue);
      onChange({ validUntil: date });
    }
  };

  const handleQuotingProfileChange = (value: string) => {
    const profile = quotingProfiles.find(p => p.value === value);
    onChange({ 
      quotingProfileId: value,
      terms: profile?.content || ''
    });
  };

  const handleTaxProfileChange = (value: string) => {
    const profile = taxProfiles.find(p => p.value === value);
    onChange({ 
      taxSettings: {
        defaultRate: profile?.rate || 0.10,
        includeTaxInPrices: false,
        taxLabel: value === 'standard-gst' ? 'GST' : 'Tax',
      }
    });
  };

  const handlePaymentTermsChange = (value: string) => {
    onChange({ paymentTerms: value });
  };

  const handleDiscountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 0;
    onChange({ defaultDiscountPercent: value });
  };

  const handleContactSelection = (contactId: string, type: 'primary' | 'billing') => {
    if (type === 'primary') {
      onChange({ 
        projectContacts: [
          ...(data.projectContacts || []).filter(c => c.role !== 'primary'),
          { contactId, role: 'primary' }
        ]
      });
    } else {
      onChange({ 
        projectContacts: [
          ...(data.projectContacts || []).filter(c => c.role !== 'billing'),
          { contactId, role: 'billing' }
        ]
      });
    }
  };

  const handleStaffSelection = (staffIds: string[]) => {
    onChange({ 
      assignedStaff: staffIds.map(id => ({ staffId: id, role: 'worker' }))
    });
  };

  // Default to 30 days from now if not set
  const defaultValidUntil = new Date();
  defaultValidUntil.setDate(defaultValidUntil.getDate() + 30);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Quote Configuration</h2>
        <p className="text-muted-foreground">
          Set up the quote details, terms, and configuration options.
        </p>
      </div>

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Basic Information
          </CardTitle>
          <CardDescription>
            Essential details about this quote
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quote-name">Quote Number *</Label>
              <div className="flex gap-2">
                <Input
                  id="quote-name"
                  placeholder="e.g., QUO-2024-001"
                  value={data.name || ''}
                  onChange={handleNameChange}
                  className="font-mono"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newNumber = generateQuoteNumber();
                    onChange({ name: newNumber });
                  }}
                >
                  Generate
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Auto-generated reference number for this quote
              </p>
            </div>

            <div className="space-y-2">
              <Label>Valid Until Date *</Label>
              
              {/* Quick Presets */}
              <div className="flex flex-wrap gap-2 mb-2">
                {validUntilPresets.map(preset => (
                  <Button
                    key={preset.value}
                    type="button"
                    variant={selectedPreset === preset.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handlePresetSelect(preset.value)}
                  >
                    {preset.label}
                  </Button>
                ))}
                <Button
                  type="button"
                  variant={selectedPreset === 'custom' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setValidUntilOpen(true)}
                >
                  Custom
                </Button>
              </div>

              {/* Date Display/Picker */}
              <Popover open={validUntilOpen} onOpenChange={setValidUntilOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !data.validUntil && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {data.validUntil ? format(data.validUntil, 'PPP') : 'Select expiry date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={data.validUntil}
                    onSelect={handleValidUntilChange}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Provide a brief description of the work to be quoted..."
              value={data.description || ''}
              onChange={handleDescriptionChange}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Terms & Conditions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Terms & Conditions
          </CardTitle>
          <CardDescription>
            Select a template or customize the terms for this quote. These define payment expectations and project scope.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Terms Template *</Label>
              <Select value={data.quotingProfileId || 'standard'} onValueChange={handleQuotingProfileChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a terms template" />
                </SelectTrigger>
                <SelectContent>
                  {quotingProfiles.map(profile => (
                    <SelectItem key={profile.value} value={profile.value}>
                      <div className="flex flex-col">
                        <span className="font-medium">{profile.label}</span>
                        <span className="text-xs text-muted-foreground">
                          {profile.description}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Choose pre-written terms that match your project type
              </p>
            </div>

            <div className="space-y-2">
              <Label>Payment Terms</Label>
              <Select value={data.paymentTerms || ''} onValueChange={handlePaymentTermsChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select payment terms" />
                </SelectTrigger>
                <SelectContent>
                  {paymentTerms.map(term => (
                    <SelectItem key={term.value} value={term.value}>
                      {term.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="terms">Additional Terms & Conditions</Label>
            <Textarea
              id="terms"
              placeholder="Enter any additional terms and conditions..."
              value={data.terms || ''}
              onChange={(e) => onChange({ terms: e.target.value })}
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              These will appear at the bottom of the quote document
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Pricing & Tax */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Pricing & Tax Configuration
          </CardTitle>
          <CardDescription>
            Set up tax rates and default discounts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Tax Profile</Label>
              <Select 
                value={data.taxSettings?.defaultRate === 0 ? 'gst-free' : 'standard-gst'} 
                onValueChange={handleTaxProfileChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select tax profile" />
                </SelectTrigger>
                <SelectContent>
                  {taxProfiles.map(profile => (
                    <SelectItem key={profile.value} value={profile.value}>
                      {profile.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="discount">Default Discount (%)</Label>
              <Input
                id="discount"
                type="number"
                min="0"
                max="100"
                step="0.01"
                placeholder="0.00"
                value={data.defaultDiscountPercent || ''}
                onChange={handleDiscountChange}
              />
            </div>

            <div className="space-y-2">
              <Label>Price Display</Label>
              <Select 
                value={data.taxSettings?.includeTaxInPrices ? 'inclusive' : 'exclusive'}
                onValueChange={(value) => onChange({ 
                  taxSettings: {
                    ...data.taxSettings,
                    includeTaxInPrices: value === 'inclusive'
                  }
                })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="exclusive">Tax Exclusive</SelectItem>
                  <SelectItem value="inclusive">Tax Inclusive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Individual line items can override these default settings
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Advanced Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Advanced Options
            <Badge variant="outline" className="ml-2">Optional</Badge>
          </CardTitle>
          <CardDescription>
            Additional configuration for complex quotes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Project Contact</Label>
              <SearchableCombobox
                options={[
                  { value: 'contact-1', label: 'John Smith' },
                  { value: 'contact-2', label: 'Jane Doe' },
                ]}
                value={data.projectContacts?.find(c => c.role === 'primary')?.contactId || ''}
                onChange={(value) => handleContactSelection(value, 'primary')}
                placeholder="Select primary contact..."
              />
            </div>

            <div className="space-y-2">
              <Label>Billing Contact</Label>
              <SearchableCombobox
                options={[
                  { value: 'contact-1', label: 'John Smith' },
                  { value: 'contact-2', label: 'Jane Doe' },
                ]}
                value={data.projectContacts?.find(c => c.role === 'billing')?.contactId || ''}
                onChange={(value) => handleContactSelection(value, 'billing')}
                placeholder="Select billing contact..."
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Assigned Staff
            </Label>
            <SearchableCombobox
              options={[
                { value: 'staff-1', label: 'Mike Johnson' },
                { value: 'staff-2', label: 'Sarah Williams' },
                { value: 'staff-3', label: 'Tom Brown' },
              ]}
              value={data.assignedStaff?.map(s => s.staffId).join(',') || ''}
              onChange={(value) => handleStaffSelection(value.split(',').filter(Boolean))}
              placeholder="Assign staff members..."
              multiple
            />
            <p className="text-xs text-muted-foreground">
              Staff members who will work on this project
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Follow-up Date
              </Label>
              <Input
                type="date"
                value={data.followUpDate ? format(data.followUpDate, 'yyyy-MM-dd') : ''}
                onChange={(e) => onChange({ followUpDate: e.target.value ? new Date(e.target.value) : undefined })}
              />
            </div>

            <div className="space-y-2">
              <Label>Internal Notes</Label>
              <Textarea
                placeholder="Internal notes (not shown to customer)..."
                value={data.internalNotes || ''}
                onChange={(e) => onChange({ internalNotes: e.target.value })}
                rows={2}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}