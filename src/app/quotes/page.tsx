// src/app/quotes/page.tsx
'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, PlusCircle, FileText, MoreHorizontal, Copy, Archive, Trash2, ClipboardCheck, GitBranch, Sparkles, TrendingUp, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Quote } from '@/lib/types';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { ColumnDef } from '@tanstack/react-table';
import { ResponsiveDataTable, ResponsiveColumnMeta } from '@/components/ui/responsive-data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { DataTableViewOptions } from '@/components/ui/data-table-view-options';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { formatCurrency, formatPercentage, calculateQuoteStats } from '@/lib/format-utils';

// TODO: Replace with dynamic org ID from user session
const ORG_ID = 'test-org';

const getQuoteStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'text-gray-600 bg-gray-100/80 border-gray-200/80';
      case 'SENT': return 'text-blue-600 bg-blue-100/80 border-blue-200/80';
      case 'APPROVED': return 'text-green-600 bg-green-100/80 border-green-200/80';
      case 'REJECTED': return 'text-red-600 bg-red-100/80 border-red-200/80';
      case 'PENDING': return 'text-yellow-600 bg-yellow-100/80 border-yellow-200/80';
      default: return 'text-gray-500 bg-gray-100/80 border-gray-200/80';
    }
}

export default function QuotesPage() {
  const [loading, setLoading] = useState(true);
  const [quotes, setQuotes] = useState<any[]>([]);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    // Use mock data for development
    const loadQuotes = async () => {
      try {
        const { mockDataService } = await import('@/lib/mock-data');
        const quotesData = await mockDataService.getQuotes();
        setQuotes(quotesData);
        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch quotes:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not load quotes.' });
        setLoading(false);
      }
    };
    
    loadQuotes();
  }, [toast]);
  
  const handleAction = (action: string, quoteId: string) => {
    toast({
        title: `Action: ${action}`,
        description: `This functionality for quote ${quoteId} is not yet implemented.`,
    });
  };

  const columns: ColumnDef<Quote, any>[] = [
    {
      accessorKey: "quoteNumber",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Quote #" />,
      cell: ({ row }) => (
        <span className="font-medium text-primary hover:underline cursor-pointer whitespace-nowrap" 
              onClick={() => router.push(`/quotes/${row.original.id}/edit`)}>
          {row.original.quoteNumber}
        </span>
      ),
      enableHiding: false, // Always visible
      meta: {
        essential: true,
      } as ResponsiveColumnMeta,
    },
    {
      accessorKey: "name",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
      cell: ({ row }) => (
        <div className="max-w-[200px] truncate" title={row.original.name}>
          {row.original.name}
        </div>
      ),
      enableHiding: false, // Always visible
      meta: {
        essential: true,
      } as ResponsiveColumnMeta,
    },
    {
      accessorKey: "projectName",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Customer" />,
      cell: ({ row }) => (
        <div className="max-w-[150px] truncate" title={row.original.projectName || 'Internal Quote'}>
          {row.original.projectName || 'Internal'}
        </div>
      ),
      meta: {
        hideOnMobile: true,
      } as ResponsiveColumnMeta,
    },
    {
      accessorKey: 'createdAt',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Created" />,
      cell: ({ row }) => (
        <span className="whitespace-nowrap">
          {row.original.createdAt ? format(row.original.createdAt as Date, 'MMM d, yyyy') : 'N/A'}
        </span>
      ),
      meta: {
        hideOnMobile: true,
        hideOnTablet: true,
      } as ResponsiveColumnMeta,
    },
    {
      accessorKey: 'dueDate',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Due" />,
      cell: ({ row }) => (
        <span className="whitespace-nowrap">
          {row.original.dueDate ? format(row.original.dueDate, 'MMM d') : 'N/A'}
        </span>
      ),
      meta: {
        hideOnMobile: true,
      } as ResponsiveColumnMeta,
    },
    {
      accessorKey: "status",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: ({ row }) => (
        <Badge variant="outline" className={cn(getQuoteStatusColor(row.original.status), "whitespace-nowrap")}>
          {row.original.status}
        </Badge>
      ),
      enableHiding: false, // Always visible
      meta: {
        essential: true,
      } as ResponsiveColumnMeta,
    },
    {
      accessorKey: "likelihood",
      header: ({ column }) => <DataTableColumnHeader column={column} title="%" />,
      cell: ({ row }) => (
        <div className="text-center whitespace-nowrap">
          {row.original.likelihood ? `${row.original.likelihood}%` : '-'}
        </div>
      ),
      meta: {
        hideOnMobile: true,
        hideOnTablet: true,
      } as ResponsiveColumnMeta,
    },
    {
      accessorKey: "estNetProfit",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Profit" />,
      cell: ({ row }) => (
        <div className="text-right font-medium whitespace-nowrap">
          {formatCurrency(row.original.estNetProfit)}
        </div>
      ),
      meta: {
        hideOnMobile: true,
        hideOnTablet: true,
      } as ResponsiveColumnMeta,
    },
    {
      accessorKey: "totalAmount",
      header: ({ column }) => (
        <div className="text-right">
          <DataTableColumnHeader column={column} title="Amount" />
        </div>
      ),
      cell: ({ row }) => (
        <div className="text-right font-semibold whitespace-nowrap">
          {formatCurrency(row.original.totalAmount)}
        </div>
      ),
      enableHiding: false, // Always visible
      meta: {
        essential: true,
      } as ResponsiveColumnMeta,
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => {
        const quote = row.original;
        return (
          <div className="text-right">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[160px]">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => router.push(`/quotes/${quote.id}`)}>
                  <FileText className="mr-2 h-4 w-4" /> View/Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleAction('Duplicate', quote.quoteNumber)}>
                  <Copy className="mr-2 h-4 w-4" /> Duplicate
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleAction('Create Revision', quote.quoteNumber)}>
                  <GitBranch className="mr-2 h-4 w-4" /> Revise
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-green-600 focus:text-green-600" 
                                onClick={() => handleAction('Convert to Job', quote.quoteNumber)}>
                  <ClipboardCheck className="mr-2 h-4 w-4" /> To Job
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleAction('Archive', quote.quoteNumber)}>
                  <Archive className="mr-2 h-4 w-4" /> Archive
                </DropdownMenuItem>
                <DropdownMenuItem className="text-destructive focus:text-destructive" 
                                onClick={() => handleAction('Delete', quote.quoteNumber)}>
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
      enableHiding: false, // Always visible
      meta: {
        essential: true,
      } as ResponsiveColumnMeta,
    },
  ];

  // Mobile card renderer for small screens
  const mobileCardRenderer = (quote: Quote) => (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" 
          onClick={() => router.push(`/quotes/${quote.id}`)}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold text-primary">{quote.quoteNumber}</h3>
            <p className="text-sm text-muted-foreground truncate max-w-[200px]">{quote.name}</p>
          </div>
          <Badge variant="outline" className={cn(getQuoteStatusColor(quote.status))}>
            {quote.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex justify-between items-end">
          <div className="text-sm text-muted-foreground">
            {quote.projectName || 'Internal'}
            {quote.dueDate && (
              <span className="block">Due: {format(quote.dueDate, 'MMM d')}</span>
            )}
          </div>
          <div className="text-right">
            <p className="text-lg font-bold">{formatCurrency(quote.totalAmount)}</p>
            {quote.likelihood && (
              <p className="text-xs text-muted-foreground">{quote.likelihood}% likely</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Calculate statistics
  const safeStats = calculateQuoteStats(quotes);
  const stats = {
    total: quotes.length,
    totalValue: safeStats.totalValue,
    sent: quotes.filter(q => q.status === 'SENT').length,
    approved: quotes.filter(q => q.status === 'APPROVED').length,
    pending: quotes.filter(q => q.status === 'PENDING').length,
    averageValue: safeStats.averageValue,
    conversionRate: quotes.length > 0 ? (quotes.filter(q => q.status === 'APPROVED').length / quotes.length * 100) : 0,
    totalProfit: safeStats.totalProfit,
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-6 lg:p-8 pt-6 max-w-full overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h2 className="text-3xl font-bold tracking-tight">Quotes</h2>
        <div className="flex items-center gap-2">
          <Link href="/quotes/new">
            <Button className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70">
              <Sparkles className="mr-2 h-4 w-4" />
              Create New Quote
            </Button>
          </Link>
        </div>
      </div>

      {/* Statistics Cards - Responsive Grid */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Quotes</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.sent} sent, {stats.approved} approved
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalValue}</div>
            <p className="text-xs text-muted-foreground">
              Avg: {stats.averageValue}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.conversionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {stats.approved} of {stats.total} approved
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Est. Profit</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.totalProfit}</div>
            <p className="text-xs text-muted-foreground">
              From approved quotes
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
         <CardHeader>
            <CardTitle>All Quotes</CardTitle>
            <CardDescription>
                A list of all quotes across all projects.
            </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
            {loading ? (
                 <div className="flex justify-center items-center h-96">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : quotes.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center p-8 h-96">
                    <FileText className="h-16 w-16 text-muted-foreground" />
                    <p className="mt-4 text-lg font-semibold">
                    No quotes have been generated yet.
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                    Click "Create New Quote" to get started.
                    </p>
                </div>
            ) : (
                <ResponsiveDataTable 
                  columns={columns} 
                  data={quotes}
                  mobileCardRenderer={mobileCardRenderer}
                  enableMobileView={true}
                />
            )}
        </CardContent>
      </Card>
    </div>
  );
}
