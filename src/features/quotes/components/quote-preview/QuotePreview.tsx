'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, Calendar, User, MapPin, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import type { QuoteFormData } from '../../types/quote.types';
import { useQuoteCalculations } from '../../hooks/useQuoteCalculations';

interface QuotePreviewProps {
  data: Partial<QuoteFormData>;
}

export function QuotePreview({ data }: QuotePreviewProps) {
  const calculations = useQuoteCalculations(data.lineItems || []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
    }).format(amount);
  };

  return (
    <Card className="shadow-lg">
      <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Quote Preview
          </CardTitle>
          <Badge variant="outline">{data.status || 'DRAFT'}</Badge>
        </div>
      </CardHeader>
      <ScrollArea className="h-[calc(100vh-220px)]">
        <CardContent className="p-6 space-y-6">
          {/* Header Section */}
          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-2xl font-bold text-primary">QUOTE</h3>
                <p className="text-sm text-muted-foreground">
                  #{data.name || 'QUO-DRAFT'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold">Trackle Services</p>
                <p className="text-xs text-muted-foreground">ABN: 12 345 678 901</p>
              </div>
            </div>

            <Separator />

            {/* Customer Details */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-semibold flex items-center gap-1 mb-2">
                  <User className="h-4 w-4" />
                  Customer
                </p>
                <p className="text-muted-foreground">
                  {data.customerId ? 'Customer Name' : 'Not selected'}
                </p>
                {data.siteId && (
                  <p className="text-muted-foreground flex items-center gap-1 mt-1">
                    <MapPin className="h-3 w-3" />
                    Site Location
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="font-semibold flex items-center gap-1 mb-2 justify-end">
                  <Calendar className="h-4 w-4" />
                  Dates
                </p>
                <p className="text-xs text-muted-foreground">
                  Created: {format(new Date(), 'dd MMM yyyy')}
                </p>
                <p className="text-xs text-muted-foreground">
                  Valid Until: {data.validUntil ? format(data.validUntil, 'dd MMM yyyy') : 'Not set'}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Quote Details */}
          <div className="space-y-2">
            <h4 className="font-semibold">Description</h4>
            <p className="text-sm text-muted-foreground">
              {data.description || 'No description provided'}
            </p>
          </div>

          {/* Line Items */}
          {data.lineItems && data.lineItems.length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <h4 className="font-semibold">Line Items</h4>
                <div className="space-y-2">
                  {data.lineItems.map((item, index) => (
                    <div
                      key={item.id || index}
                      className="flex justify-between items-start py-2 text-sm"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{item.name}</p>
                        {item.description && (
                          <p className="text-xs text-muted-foreground">{item.description}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {item.quantity} × {formatCurrency(item.unitPrice)}
                        </p>
                      </div>
                      <p className="font-medium">{formatCurrency(item.total)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Totals */}
          <Separator />
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(calculations.subtotal)}</span>
            </div>
            {calculations.totalDiscounts > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Discounts</span>
                <span className="text-red-600">-{formatCurrency(calculations.totalDiscounts)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">GST (10%)</span>
              <span>{formatCurrency(calculations.totalTax)}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-lg font-bold">
              <span className="flex items-center gap-1">
                <DollarSign className="h-5 w-5" />
                Total
              </span>
              <span className="text-primary">{formatCurrency(calculations.totalAmount)}</span>
            </div>
          </div>

          {/* Terms & Conditions */}
          {data.terms && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Terms & Conditions</h4>
                <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                  {data.terms}
                </p>
              </div>
            </>
          )}

          {/* Footer */}
          <div className="pt-6 mt-6 border-t text-center">
            <p className="text-xs text-muted-foreground">
              This quote is valid for 30 days from the date of issue.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Thank you for your business!
            </p>
          </div>
        </CardContent>
      </ScrollArea>
    </Card>
  );
}