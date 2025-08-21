'use client';

import * as React from 'react';
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  CheckCircle2, 
  AlertCircle, 
  Send, 
  Save, 
  FileText,
  DollarSign,
  Calendar,
  User,
  MapPin,
  Package,
  Clock,
  Download,
  Mail,
  Printer,
  Eye,
  Shield,
  Sparkles
} from 'lucide-react';
import { format } from 'date-fns';
import type { QuoteFormData } from '../../../types/quote.types';
import { useQuoteCalculations } from '../../../hooks/useQuoteCalculations';

interface ReviewStepProps {
  data: Partial<QuoteFormData>;
  onSubmit: () => void;
  onSave: () => void;
  isLoading?: boolean;
}

export function ReviewStep({ data, onSubmit, onSave, isLoading }: ReviewStepProps) {
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({
    customer: false,
    items: false,
    pricing: false,
    terms: false,
  });
  const [sendOptions, setSendOptions] = useState({
    email: true,
    createPdf: true,
    saveToProject: true,
  });

  const calculations = useQuoteCalculations(data.lineItems || []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
    }).format(amount);
  };

  const allChecked = Object.values(checkedItems).every(Boolean);

  const validationIssues = [];
  if (!data.customerId) validationIssues.push('Customer not selected');
  if (!data.name) validationIssues.push('Quote name not set');
  if (!data.validUntil) validationIssues.push('Valid until date not set');
  if (!data.quotingProfileId) validationIssues.push('Quoting profile not selected');
  if (!data.lineItems || data.lineItems.length === 0) validationIssues.push('No line items added');

  const handleCheckItem = (item: string) => {
    setCheckedItems(prev => ({ ...prev, [item]: !prev[item] }));
  };

  const handleSendOptionChange = (option: keyof typeof sendOptions) => {
    setSendOptions(prev => ({ ...prev, [option]: !prev[option] }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Review & Send Quote</h2>
        <p className="text-muted-foreground">
          Review all details before sending the quote to your customer.
        </p>
      </div>

      {/* Validation Issues */}
      {validationIssues.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Please complete the following:</AlertTitle>
          <AlertDescription>
            <ul className="list-disc list-inside mt-2">
              {validationIssues.map((issue, index) => (
                <li key={index}>{issue}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Quote Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Details */}
        <div className="space-y-4">
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Customer Information
                </CardTitle>
                <Checkbox
                  checked={checkedItems.customer}
                  onCheckedChange={() => handleCheckItem('customer')}
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Customer:</span>
                <span className="font-medium">{data.customerId ? 'Customer Name' : 'Not selected'}</span>
              </div>
              {data.siteId && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Site:</span>
                  <span className="font-medium">Site Location</span>
                </div>
              )}
              {data.projectId && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Project:</span>
                  <span className="font-medium">Project Name</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Type:</span>
                <Badge variant="outline">{data.quoteType || 'new-project'}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Priority:</span>
                <Badge 
                  variant={data.priority === 'urgent' ? 'destructive' : 'secondary'}
                >
                  {data.priority || 'standard'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Quote Configuration */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Quote Details
                </CardTitle>
                <Checkbox
                  checked={checkedItems.terms}
                  onCheckedChange={() => handleCheckItem('terms')}
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Quote #:</span>
                <span className="font-medium">{data.name || 'Not set'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Valid Until:</span>
                <span className="font-medium">
                  {data.validUntil ? format(data.validUntil, 'PPP') : 'Not set'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Profile:</span>
                <span className="font-medium">{data.quotingProfileId || 'Not selected'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payment Terms:</span>
                <span className="font-medium">{data.paymentTerms || 'Net 30'}</span>
              </div>
              {data.description && (
                <>
                  <Separator className="my-2" />
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Description:</p>
                    <p className="text-sm">{data.description}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Line Items Summary */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Line Items ({data.lineItems?.length || 0})
                </CardTitle>
                <Checkbox
                  checked={checkedItems.items}
                  onCheckedChange={() => handleCheckItem('items')}
                />
              </div>
            </CardHeader>
            <CardContent>
              {data.lineItems && data.lineItems.length > 0 ? (
                <ScrollArea className="h-[200px]">
                  <div className="space-y-2">
                    {data.lineItems.map((item, index) => (
                      <div key={item.id || index} className="flex justify-between py-2 border-b last:border-0">
                        <div className="flex-1">
                          <p className="font-medium">{item.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.quantity} × {formatCurrency(item.unitPrice)}
                          </p>
                        </div>
                        <p className="font-medium">{formatCurrency(item.total)}</p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <p className="text-muted-foreground text-center py-4">No items added</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Pricing & Actions */}
        <div className="space-y-4">
          {/* Pricing Summary */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Pricing Summary
                </CardTitle>
                <Checkbox
                  checked={checkedItems.pricing}
                  onCheckedChange={() => handleCheckItem('pricing')}
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal:</span>
                <span>{formatCurrency(calculations.subtotal)}</span>
              </div>
              {calculations.totalDiscounts > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Discounts:</span>
                  <span className="text-red-600">-{formatCurrency(calculations.totalDiscounts)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">GST (10%):</span>
                <span>{formatCurrency(calculations.totalTax)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Total Amount:</span>
                <span className="text-primary">{formatCurrency(calculations.totalAmount)}</span>
              </div>

              {/* Breakdown */}
              {calculations.laborTotal > 0 && calculations.materialsTotal > 0 && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Breakdown:</p>
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Labor
                      </span>
                      <span>{formatCurrency(calculations.laborTotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center gap-1">
                        <Package className="h-3 w-3" />
                        Materials
                      </span>
                      <span>{formatCurrency(calculations.materialsTotal)}</span>
                    </div>
                  </div>
                </>
              )}

              {/* Profit Margin (Internal) */}
              {calculations.profitMargin > 0 && (
                <>
                  <Separator />
                  <Alert>
                    <Shield className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Internal Only:</strong>
                      <div className="mt-1 space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>Total Cost:</span>
                          <span>{formatCurrency(calculations.totalCost)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Profit:</span>
                          <span className="text-green-600">{formatCurrency(calculations.totalProfit)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Margin:</span>
                          <span className="text-green-600">{calculations.profitMargin.toFixed(1)}%</span>
                        </div>
                      </div>
                    </AlertDescription>
                  </Alert>
                </>
              )}
            </CardContent>
          </Card>

          {/* Send Options */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                Send Options
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>Email to customer</span>
                </div>
                <Checkbox
                  checked={sendOptions.email}
                  onCheckedChange={() => handleSendOptionChange('email')}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span>Generate PDF</span>
                </div>
                <Checkbox
                  checked={sendOptions.createPdf}
                  onCheckedChange={() => handleSendOptionChange('createPdf')}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Save className="h-4 w-4 text-muted-foreground" />
                  <span>Save to project</span>
                </div>
                <Checkbox
                  checked={sendOptions.saveToProject}
                  onCheckedChange={() => handleSendOptionChange('saveToProject')}
                />
              </div>
            </CardContent>
          </Card>

          {/* Review Checklist */}
          <Alert className={allChecked ? 'border-green-500' : ''}>
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>Review Checklist</AlertTitle>
            <AlertDescription>
              Please confirm you have reviewed all sections before sending:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li className={checkedItems.customer ? 'line-through text-muted-foreground' : ''}>
                  Customer information is correct
                </li>
                <li className={checkedItems.items ? 'line-through text-muted-foreground' : ''}>
                  All line items are included
                </li>
                <li className={checkedItems.pricing ? 'line-through text-muted-foreground' : ''}>
                  Pricing is accurate
                </li>
                <li className={checkedItems.terms ? 'line-through text-muted-foreground' : ''}>
                  Terms and conditions are appropriate
                </li>
              </ul>
            </AlertDescription>
          </Alert>
        </div>
      </div>

      {/* Action Buttons */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 flex gap-2">
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
              <Button variant="outline" size="sm">
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={onSave}
                disabled={isLoading}
              >
                <Save className="h-4 w-4 mr-2" />
                Save as Draft
              </Button>
              <Button 
                onClick={onSubmit}
                disabled={!allChecked || validationIssues.length > 0 || isLoading}
                className="min-w-[120px]"
              >
                {isLoading ? (
                  <>Loading...</>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Send Quote
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Success Message Preview */}
      {allChecked && validationIssues.length === 0 && (
        <Alert className="border-green-500 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800">Ready to Send!</AlertTitle>
          <AlertDescription className="text-green-700">
            Your quote is complete and ready to be sent to the customer.
            Click "Send Quote" to deliver it via the selected methods.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}