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
import { Loader2, PlusCircle, FileText, MoreHorizontal, Copy, Archive, Trash2, ClipboardCheck, GitBranch } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Quote } from '@/lib/types';
import { cn } from '@/lib/utils';
import { onSnapshot, collection, query, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { CreateQuoteDialog } from './create-quote-dialog';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';

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
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const q = query(collection(db, 'quotes'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, 
        (snapshot) => {
            const quotesData = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    quoteDate: (data.quoteDate as Timestamp)?.toDate(),
                    createdAt: (data.createdAt as Timestamp)?.toDate(),
                } as Quote;
            });
            setQuotes(quotesData);
            setLoading(false);
        },
        (error) => {
            console.error("Failed to fetch quotes:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not load quotes.' });
            setLoading(false);
        }
    );
    return () => unsubscribe();
  }, [toast]);
  
  const handleAction = (action: string, quoteId: string) => {
    toast({
        title: `Action: ${action}`,
        description: `This functionality for quote ${quoteId} is not yet implemented.`,
    });
  };

  const columns: ColumnDef<Quote>[] = [
    {
      accessorKey: "quoteNumber",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Quote #" />,
      cell: ({ row }) => (
        <span className="font-medium text-primary hover:underline cursor-pointer" onClick={() => router.push(`/quotes/${row.original.id}`)}>
          {row.original.quoteNumber}
        </span>
      ),
    },
    {
      accessorKey: "name",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
    },
     {
      accessorKey: "projectName",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Project / Customer" />,
      cell: ({ row }) => row.original.projectName || 'Internal Quote'
    },
    {
        accessorKey: 'quoteDate',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Date" />,
        cell: ({ row }) => format(row.original.quoteDate, 'PPP'),
    },
    {
      accessorKey: "status",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: ({ row }) => (
        <Badge variant="outline" className={cn(getQuoteStatusColor(row.original.status))}>
          {row.original.status}
        </Badge>
      ),
    },
    {
      accessorKey: "totalAmount",
      header: ({ column }) => (
        <div className="text-right">
          <DataTableColumnHeader column={column} title="Amount" />
        </div>
      ),
      cell: ({ row }) => (
        <div className="text-right font-semibold">
          ${row.original.totalAmount.toFixed(2)}
        </div>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const quote = row.original;
        return (
          <div className="text-right">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                 <DropdownMenuItem onClick={() => router.push(`/quotes/${quote.id}`)}>
                   <FileText className="mr-2 h-4 w-4" /> View/Edit Quote
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleAction('Duplicate', quote.quoteNumber)}>
                  <Copy className="mr-2 h-4 w-4" /> Duplicate
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleAction('Create Revision', quote.quoteNumber)}>
                  <GitBranch className="mr-2 h-4 w-4" /> Create Revision
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-green-600 focus:text-green-600" onClick={() => handleAction('Convert to Job', quote.quoteNumber)}>
                  <ClipboardCheck className="mr-2 h-4 w-4" /> Convert to Job
                </DropdownMenuItem>
                 <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleAction('Archive', quote.quoteNumber)}>
                  <Archive className="mr-2 h-4 w-4" /> Archive
                </DropdownMenuItem>
                <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleAction('Delete', quote.quoteNumber)}>
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Quotes</h2>
        <CreateQuoteDialog>
          <Button><PlusCircle className="mr-2 h-4 w-4" />Create New Quote</Button>
        </CreateQuoteDialog>
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
                <DataTable columns={columns} data={quotes} />
            )}
        </CardContent>
      </Card>
    </div>
  );
}
