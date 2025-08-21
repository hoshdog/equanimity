'use client';

import * as React from 'react';
import { use, useEffect, useState } from 'react';
import { QuoteWizard } from '@/features/quotes/components/quote-wizard/QuoteWizard';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import type { QuoteFormData } from '@/features/quotes/types/quote.types';

interface QuoteEditPageProps {
  params: Promise<{ id: string }>;
}

export default function QuoteEditPage({ params }: QuoteEditPageProps) {
  const { id } = use(params);
  const [quoteData, setQuoteData] = useState<Partial<QuoteFormData> | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const loadQuote = async () => {
      try {
        const { mockDataService } = await import('@/lib/mock-data');
        const quotes = await mockDataService.getQuotes();
        const quote = quotes.find((q: any) => q.id === id);
        
        if (!quote) {
          toast({
            variant: 'destructive',
            title: 'Quote Not Found',
            description: 'The requested quote could not be found.',
          });
          return;
        }

        // Transform quote data to match QuoteFormData interface
        const formData: Partial<QuoteFormData> = {
          name: quote.name || quote.quoteNumber,
          description: quote.description,
          customerId: quote.customerId,
          siteId: quote.siteId,
          projectId: quote.projectId,
          status: quote.status,
          validUntil: quote.validUntil ? new Date(quote.validUntil) : undefined,
          lineItems: quote.lineItems || [],
          terms: quote.terms,
          internalNotes: quote.internalNotes,
          createdAt: quote.createdAt ? new Date(quote.createdAt) : new Date(),
          updatedAt: quote.updatedAt ? new Date(quote.updatedAt) : new Date(),
        };

        setQuoteData(formData);
      } catch (error) {
        console.error('Failed to load quote:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load the quote. Please try again.',
        });
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadQuote();
    }
  }, [id, toast]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading quote...</span>
        </div>
      </div>
    );
  }

  if (!quoteData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Quote Not Found</h2>
          <p className="text-muted-foreground">The requested quote could not be loaded.</p>
        </div>
      </div>
    );
  }

  return (
    <QuoteWizard 
      initialData={quoteData}
      quoteId={id}
      mode="edit"
    />
  );
}