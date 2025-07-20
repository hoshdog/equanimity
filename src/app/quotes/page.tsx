// src/app/quotes/page.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, PlusCircle, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getQuotes } from '@/lib/quotes';
import { getCustomers } from '@/lib/customers';
import type { Quote, Customer } from '@/lib/types';
import { NewQuoteDialog } from './new-quote-dialog';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const getQuoteStatusColor = (status: string) => {
    switch (status) {
      case 'Draft': return 'text-gray-600 bg-gray-100/80 border-gray-200/80';
      case 'Sent': return 'text-blue-600 bg-blue-100/80 border-blue-200/80';
      case 'Approved': return 'text-green-600 bg-green-100/80 border-green-200/80';
      case 'Rejected': return 'text-red-600 bg-red-100/80 border-red-200/80';
      default: return 'text-gray-500 bg-gray-100/80 border-gray-200/80';
    }
}

export default function QuotesPage() {
  const [loading, setLoading] = useState(true);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchData() {
        setLoading(true);
        try {
            const [quotesData, customersData] = await Promise.all([
                getQuotes(),
                getCustomers(),
            ]);
            setQuotes(quotesData);
            setCustomers(customersData);
        } catch (error) {
            console.error("Failed to fetch data:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not load quotes and customers.' });
        } finally {
            setLoading(false);
        }
    }
    fetchData();
  }, [toast]);
  
  const customerMap = useMemo(() => new Map(customers.map(c => [c.id, c.name])), [customers]);

  const onQuoteCreated = (newQuote: Quote) => {
    setQuotes(prev => [newQuote, ...prev]);
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Quotes</h2>
        <NewQuoteDialog onQuoteCreated={onQuoteCreated} />
      </div>

      {loading ? (
          <div className="flex justify-center items-center h-96">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : quotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg h-96">
            <FileText className="h-16 w-16 text-muted-foreground" />
            <p className="mt-4 text-lg font-semibold">
              No quotes have been generated yet.
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Click "Create New Quote" to get started.
            </p>
          </div>
        ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {quotes.map(quote => (
            <Link href={quote.projectId ? `/projects/${quote.projectId}` : `/customers/${quote.customerId}`} key={quote.id}>
                <Card className="flex flex-col h-full hover:border-primary transition-colors">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-lg flex justify-between items-start">
                            <span className="font-semibold text-primary">{quote.quoteNumber}</span>
                            <span className="font-bold text-lg">${quote.totalAmount.toFixed(2)}</span>
                        </CardTitle>
                        <CardDescription>
                           For: <span className="font-medium text-foreground">{customerMap.get(quote.customerId) || 'Unknown Customer'}</span>
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow">
                         <Badge variant="outline" className={cn(getQuoteStatusColor(quote.status))}>
                            {quote.status}
                        </Badge>
                    </CardContent>
                    <CardFooter>
                         <p className="text-xs text-muted-foreground">
                            Created on: {quote.createdAt ? new Date(quote.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}
                        </p>
                    </CardFooter>
                </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
