// src/app/quotes/page.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, PlusCircle, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getQuotes, addQuote } from '@/lib/quotes';
import { getCustomers, getProjects } from '@/lib/firebase-helpers'; // Placeholder
import type { Quote, Customer, Project, OptionType } from '@/lib/types';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { SearchableCombobox } from '@/components/ui/SearchableCombobox';
import { onSnapshot, collection, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';


const createQuoteSchema = z.object({
    projectId: z.string().min(1, "Please select a project."),
});

type CreateQuoteValues = z.infer<typeof createQuoteSchema>;


function CreateQuoteDialog() {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [projects, setProjects] = useState<Project[]>([]);
    const router = useRouter();
    const { toast } = useToast();

    const form = useForm<CreateQuoteValues>({
        resolver: zodResolver(createQuoteSchema),
        defaultValues: { projectId: "" },
    });

    useEffect(() => {
        if (!isOpen) return;
        async function fetchProjects() {
            setLoading(true);
            try {
                // In a real app, this should be a more efficient query
                const q = query(collection(db, 'projects'), orderBy('createdAt', 'desc'));
                const snapshot = await getDocs(q);
                setProjects(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project)));
            } catch (error) {
                toast({ variant: "destructive", title: "Error", description: "Could not load projects." });
            } finally {
                setLoading(false);
            }
        }
        fetchProjects();
    }, [isOpen, toast]);

    const projectOptions = projects.map(p => ({ value: p.id, label: `${p.name} (${p.customerName})`}));

    async function onSubmit(values: CreateQuoteValues) {
        setLoading(true);
        const selectedProject = projects.find(p => p.id === values.projectId);
        if (!selectedProject) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not find selected project.' });
            setLoading(false);
            return;
        }

        try {
            const newQuoteData = {
                projectId: selectedProject.id,
                customerId: selectedProject.customerId,
                quoteNumber: `Q-${Date.now().toString().slice(-6)}`,
                quoteDate: new Date(),
                expiryDate: new Date(new Date().setDate(new Date().getDate() + 30)),
                status: 'Draft' as const,
                lineItems: [{ id: 'item-0', description: "", quantity: 1, unitPrice: 0, taxRate: 10 }],
                subtotal: 0,
                totalDiscount: 0,
                totalTax: 0,
                totalAmount: 0,
                version: 1,
            };
            const newQuoteId = await addQuote(newQuoteData);
            toast({ title: "Quote Created", description: "Redirecting to the new quote..." });
            setIsOpen(false);
            router.push(`/quotes/${newQuoteId}`);
        } catch (error) {
            console.error("Failed to create quote", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to create quote.' });
            setLoading(false);
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button><PlusCircle className="mr-2 h-4 w-4" />Create New Quote</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create New Quote</DialogTitle>
                    <DialogDescription>Select the project this quote is for. You can add details on the next screen.</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="projectId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Project</FormLabel>
                                    <SearchableCombobox
                                        options={projectOptions}
                                        value={field.value}
                                        onChange={field.onChange}
                                        placeholder="Select a project"
                                    />
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
                            <Button type="submit" disabled={loading}>{loading ? <Loader2 className="animate-spin" /> : "Create Quote"}</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}



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

  useEffect(() => {
    const q = query(collection(db, 'quotes'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, 
        (snapshot) => {
            const quotesData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                quoteDate: (doc.data().quoteDate as any).toDate(),
                createdAt: (doc.data().createdAt as any)?.toDate(),
            } as Quote));
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
  

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Quotes</h2>
        <CreateQuoteDialog />
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
            <Link href={`/quotes/${quote.id}`} key={quote.id}>
                <Card className="flex flex-col h-full hover:border-primary transition-colors">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-lg flex justify-between items-start">
                            <span className="font-semibold text-primary">{quote.quoteNumber}</span>
                            <span className="font-bold text-lg">${quote.totalAmount.toFixed(2)}</span>
                        </CardTitle>
                        <CardDescription>
                           For: <span className="font-medium text-foreground">{quote.projectName || 'Unknown Project'}</span>
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow">
                         <Badge variant="outline" className={cn(getQuoteStatusColor(quote.status))}>
                            {quote.status}
                        </Badge>
                    </CardContent>
                    <CardFooter>
                         <p className="text-xs text-muted-foreground">
                            Created on: {quote.createdAt ? new Date(quote.createdAt).toLocaleDateString() : 'N/A'}
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
