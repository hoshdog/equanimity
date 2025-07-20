
// src/app/quotes/quote-form-dialog.tsx
'use client';

import * as React from 'react';
import { useForm, useFieldArray, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from "@/components/ui/button";
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
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { PlusCircle, Trash2, Loader2, MinusCircle, Calendar as CalendarIcon, DollarSign, Percent } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Quote, Project, POLineItem, OptionType, QuoteLineItem } from '@/lib/types';
import { addQuote } from '@/lib/quotes';
import { getProject } from '@/lib/projects';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, addDays } from 'date-fns';

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

interface QuoteFormDialogProps {
  onQuoteCreated: (quote: Quote) => void;
  projectId: string;
}

export function QuoteFormDialog({ onQuoteCreated, projectId }: QuoteFormDialogProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [project, setProject] = React.useState<Project | null>(null);
  const { toast } = useToast();

  const form = useForm<QuoteFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      quoteNumber: `Q-${Date.now().toString().slice(-6)}`,
      quoteDate: new Date(),
      expiryDate: addDays(new Date(), 30),
      status: 'Draft',
      lineItems: [{ id: 'item-0', description: "", quantity: 1, unitPrice: 0, taxRate: 10 }],
      paymentTerms: 'Net 30 Days',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "lineItems",
  });

  const lineItemsWatch = form.watch('lineItems');
  const { subtotal, totalTax, totalAmount } = React.useMemo(() => {
    let sub = 0;
    let tax = 0;
    lineItemsWatch.forEach(item => {
        const lineTotal = (item.quantity || 0) * (item.unitPrice || 0);
        sub += lineTotal;
        tax += lineTotal * ((item.taxRate || 0) / 100);
    });
    return { subtotal: sub, totalTax: tax, totalAmount: sub + tax };
  }, [lineItemsWatch]);

  React.useEffect(() => {
    async function fetchProjectData() {
      if (isOpen) {
        setLoading(true);
        try {
          const projectData = await getProject(projectId);
          setProject(projectData);
        } catch (error) {
          toast({ variant: 'destructive', title: 'Error', description: 'Could not load project details.' });
        } finally {
          setLoading(false);
        }
      }
    }
    fetchProjectData();
  }, [isOpen, projectId, toast]);
  
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      form.reset({
        quoteNumber: `Q-${Date.now().toString().slice(-6)}`,
        quoteDate: new Date(),
        expiryDate: addDays(new Date(), 30),
        status: 'Draft',
        lineItems: [{ id: 'item-0', description: "", quantity: 1, unitPrice: 0, taxRate: 10 }],
        paymentTerms: 'Net 30 Days',
        clientNotes: '',
        internalNotes: '',
        validityTerms: '',
      });
    }
  }


  async function onSubmit(values: QuoteFormValues) {
    if (!project) {
        toast({ variant: 'destructive', title: 'Error', description: 'Project data is missing.' });
        return;
    }
    setLoading(true);
    try {
      const quoteData = {
        ...values,
        projectId,
        customerId: project.customerId,
        subtotal,
        totalDiscount: 0, // Placeholder
        totalTax,
        totalAmount,
        version: 1,
      };
      
      const newQuoteId = await addQuote(quoteData);
      
      // The real-time listener will update the UI, so no need to call onQuoteCreated here.
      toast({ title: "Quote Created", description: `${values.quoteNumber} has been successfully created.` });
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to create quote:", error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not create the quote.' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
            <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                New Quote
            </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl">
            <DialogHeader>
                <DialogTitle>New Quote for: {project?.name}</DialogTitle>
                <DialogDescription>Fill out the form to create a new quote for this project.</DialogDescription>
            </DialogHeader>
            <FormProvider {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <FormField control={form.control} name="quoteNumber" render={({ field }) => ( <FormItem><FormLabel>Quote #</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )}/>
                        <FormField control={form.control} name="quoteDate" render={({ field }) => ( <FormItem className="flex flex-col"><FormLabel>Quote Date</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>{field.value ? format(field.value, "PPP") : <span>Pick a date</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} /></PopoverContent></Popover><FormMessage /></FormItem>)}/>
                        <FormField control={form.control} name="expiryDate" render={({ field }) => ( <FormItem className="flex flex-col"><FormLabel>Expiry Date</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>{field.value ? format(field.value, "PPP") : <span>Pick a date</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} /></PopoverContent></Popover><FormMessage /></FormItem>)}/>
                        <FormField control={form.control} name="status" render={({ field }) => ( <FormItem><FormLabel>Status</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="Draft">Draft</SelectItem><SelectItem value="Sent">Sent</SelectItem><SelectItem value="Approved">Approved</SelectItem><SelectItem value="Rejected">Rejected</SelectItem><SelectItem value="Invoiced">Invoiced</SelectItem></SelectContent></Select><FormMessage /></FormItem> )}/>
                    </div>

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

                    <div className="flex justify-end">
                        <div className="w-full max-w-sm space-y-2 text-sm">
                             <div className="flex justify-between"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
                             <div className="flex justify-between"><span>Tax (GST)</span><span>${totalTax.toFixed(2)}</span></div>
                             <div className="flex justify-between font-bold text-base border-t pt-2"><span>Total</span><span>${totalAmount.toFixed(2)}</span></div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={form.control} name="clientNotes" render={({ field }) => (<FormItem><FormLabel>Notes for Client</FormLabel><FormControl><Textarea rows={3} {...field} /></FormControl><FormMessage/></FormItem>)}/>
                        <FormField control={form.control} name="internalNotes" render={({ field }) => (<FormItem><FormLabel>Internal Notes</FormLabel><FormControl><Textarea rows={3} {...field} /></FormControl><FormMessage/></FormItem>)}/>
                    </div>

                    <DialogFooter>
                        <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
                        <Button type="submit" disabled={loading}>{loading ? <Loader2 className="animate-spin" /> : 'Save Quote'}</Button>
                    </DialogFooter>
                </form>
            </FormProvider>
        </DialogContent>
    </Dialog>
  );
}
