
// src/app/quotes/[id]/page.tsx
'use client';

import * as React from 'react';
import { useState, useEffect, use } from 'react';
import { useForm, useFieldArray, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { PlusCircle, Trash2, Loader2, Calendar as CalendarIcon, DollarSign, Percent, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Quote, Project } from '@/lib/types';
import { getQuote, updateQuote } from '@/lib/quotes';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, addDays } from 'date-fns';
import Link from 'next/link';
import { onSnapshot, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const lineItemSchema = z.object({
    id: z.string(),
    description: z.string().min(3, "Description is required."),
    quantity: z.coerce.number().min(0.1, "Qty must be > 0."),
    unitPrice: z.coerce.number().min(0.01, "Price must be > 0."),
    taxRate: z.coerce.number().min(0).default(10), // Default GST
});

const formSchema = z.object({
  quoteNumber: z.string().min(1, "Quote number is required."),
  quoteDate: z.date({ required_error: "Quote date is required." }),
  expiryDate: z.date({ required_error: "Expiry date is required." }),
  status: z.enum(['Draft', 'Sent', 'Approved', 'Rejected', 'Invoiced']),
  lineItems: z.array(lineItemSchema).min(1, "At least one line item is required."),
  paymentTerms: z.string().optional(),
  validityTerms: z.string().optional(),
  internalNotes: z.string().optional(),
  clientNotes: z.string().optional(),
}).refine(data => data.expiryDate >= data.quoteDate, {
    message: "Expiry date must be on or after the quote date.",
    path: ["expiryDate"],
});


type QuoteFormValues = z.infer<typeof formSchema>;


export default function QuoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: quoteId } = use(params);
    const [quote, setQuote] = useState<Quote | null>(null);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    const form = useForm<QuoteFormValues>({
        resolver: zodResolver(formSchema),
    });

    const { fields, append, remove, replace } = useFieldArray({
        control: form.control,
        name: "lineItems",
    });
    
    useEffect(() => {
        if (!quoteId) return;
        setLoading(true);
        const unsub = onSnapshot(doc(db, "quotes", quoteId), (doc) => {
            if (doc.exists()) {
                const quoteData = { id: doc.id, ...doc.data() } as Quote;
                setQuote(quoteData);
                form.reset({
                    ...quoteData,
                    quoteDate: quoteData.quoteDate.toDate(),
                    expiryDate: quoteData.expiryDate.toDate(),
                });
                if (quoteData.lineItems) {
                    replace(quoteData.lineItems);
                }
            } else {
                toast({ variant: 'destructive', title: 'Error', description: 'Quote not found.' });
            }
            setLoading(false);
        });
        return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [quoteId, toast]);


    const lineItemsWatch = form.watch('lineItems');
    const { subtotal, totalTax, totalAmount } = React.useMemo(() => {
        let sub = 0;
        let tax = 0;
        if (lineItemsWatch) {
            lineItemsWatch.forEach(item => {
                const lineTotal = (item.quantity || 0) * (item.unitPrice || 0);
                sub += lineTotal;
                tax += lineTotal * ((item.taxRate || 0) / 100);
            });
        }
        return { subtotal: sub, totalTax: tax, totalAmount: sub + tax };
    }, [lineItemsWatch]);

    async function onSubmit(values: QuoteFormValues) {
        if (!quote) return;
        setLoading(true);
        try {
            const quoteDataToUpdate = {
                ...values,
                subtotal,
                totalTax,
                totalAmount,
            };
            await updateQuote(quote.id, quoteDataToUpdate);
            toast({ title: "Quote Updated", description: "Your changes have been saved." });
        } catch (error) {
            console.error("Failed to update quote:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not update the quote.' });
        } finally {
            setLoading(false);
        }
    }
    
    if (loading) {
        return (
            <div className="flex-1 p-8 pt-6 flex items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }
    
    if (!quote) {
        return (
             <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
                <h2 className="text-3xl font-bold tracking-tight">Quote Not Found</h2>
                <Button asChild>
                    <Link href="/quotes"><ArrowLeft className="mr-2 h-4 w-4"/>Back to Quotes</Link>
                </Button>
            </div>
        );
    }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="flex items-center justify-between">
                 <div className="flex items-center space-x-4">
                     <Button asChild variant="outline" size="icon">
                        <Link href={quote.projectId ? `/projects/${quote.projectId}` : '/quotes'}>
                            <ArrowLeft className="h-4 w-4"/>
                            <span className="sr-only">Back</span>
                        </Link>
                    </Button>
                    <h2 className="text-3xl font-bold tracking-tight">Quote: {quote.quoteNumber}</h2>
                 </div>
                 <Button type="submit" disabled={loading}>{loading ? <Loader2 className="animate-spin" /> : 'Save Changes'}</Button>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Quote Details</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <FormField control={form.control} name="quoteNumber" render={({ field }) => ( <FormItem><FormLabel>Quote #</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )}/>
                        <FormField control={form.control} name="quoteDate" render={({ field }) => ( <FormItem className="flex flex-col"><FormLabel>Quote Date</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>{field.value ? format(field.value, "PPP") : <span>Pick a date</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} /></PopoverContent></Popover><FormMessage /></FormItem>)}/>
                        <FormField control={form.control} name="expiryDate" render={({ field }) => ( <FormItem className="flex flex-col"><FormLabel>Expiry Date</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>{field.value ? format(field.value, "PPP") : <span>Pick a date</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} /></PopoverContent></Popover><FormMessage /></FormItem>)}/>
                        <FormField control={form.control} name="status" render={({ field }) => ( <FormItem><FormLabel>Status</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="Draft">Draft</SelectItem><SelectItem value="Sent">Sent</SelectItem><SelectItem value="Approved">Approved</SelectItem><SelectItem value="Rejected">Rejected</SelectItem><SelectItem value="Invoiced">Invoiced</SelectItem></SelectContent></Select><FormMessage /></FormItem> )}/>
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Line Items</CardTitle>
                </CardHeader>
                <CardContent>
                     <div className="space-y-2">
                        <div className="grid grid-cols-12 gap-2 px-2">
                            <Label className="col-span-12 sm:col-span-6">Description</Label>
                            <Label className="col-span-4 sm:col-span-2 text-center">Qty</Label>
                            <Label className="col-span-4 sm:col-span-2 text-center">Unit Price</Label>
                            <Label className="col-span-4 sm:col-span-2 text-center">Tax %</Label>
                        </div>
                        <div className="space-y-2">
                            {fields.map((field, index) => (
                                <div key={field.id} className="flex items-start gap-2 p-2 border rounded-md bg-secondary/30">
                                    <div className="grid grid-cols-12 gap-2 flex-grow">
                                        <div className="col-span-12 sm:col-span-6">
                                            <FormField control={form.control} name={`lineItems.${index}.description`} render={({ field }) => ( <FormItem><FormControl><Input placeholder="Item description" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                                        </div>
                                        <div className="col-span-4 sm:col-span-2">
                                            <FormField control={form.control} name={`lineItems.${index}.quantity`} render={({ field }) => ( <FormItem><FormControl><Input type="number" placeholder="Qty" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                                        </div>
                                        <div className="col-span-4 sm:col-span-2">
                                            <FormField control={form.control} name={`lineItems.${index}.unitPrice`} render={({ field }) => ( <FormItem><FormControl><div className="relative"><DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input type="number" step="0.01" className="pl-6" {...field} /></div></FormControl><FormMessage /></FormItem> )}/>
                                        </div>
                                        <div className="col-span-4 sm:col-span-2">
                                            <FormField control={form.control} name={`lineItems.${index}.taxRate`} render={({ field }) => ( <FormItem><FormControl><div className="relative"><Percent className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input type="number" step="0.01" className="pr-6" {...field} /></div></FormControl><FormMessage /></FormItem> )}/>
                                        </div>
                                    </div>
                                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={fields.length <= 1}><Trash2 className="h-5 w-5 text-destructive"/></Button>
                                </div>
                            ))}
                        </div>
                        <Button type="button" variant="outline" size="sm" onClick={() => append({ id: `item-${fields.length}`, description: "", quantity: 1, unitPrice: 0, taxRate: 10 })}><PlusCircle className="mr-2 h-4 w-4"/>Add Line</Button>
                    </div>

                    <div className="flex justify-end mt-4">
                        <div className="w-full max-w-sm space-y-2 text-sm">
                             <div className="flex justify-between"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
                             <div className="flex justify-between"><span>Tax (GST)</span><span>${totalTax.toFixed(2)}</span></div>
                             <div className="flex justify-between font-bold text-base border-t pt-2"><span>Total</span><span>${totalAmount.toFixed(2)}</span></div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Terms & Notes</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="clientNotes" render={({ field }) => (<FormItem><FormLabel>Notes for Client</FormLabel><FormControl><Textarea rows={3} {...field} /></FormControl><FormMessage/></FormItem>)}/>
                    <FormField control={form.control} name="internalNotes" render={({ field }) => (<FormItem><FormLabel>Internal Notes</FormLabel><FormControl><Textarea rows={3} {...field} /></FormControl><FormMessage/></FormItem>)}/>
                </CardContent>
            </Card>
        </form>
        </FormProvider>
    </div>
  );
}
