// src/app/quotes/quote-form-dialog.tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  generateQuoteFromPrompt,
  GenerateQuoteFromPromptOutput,
} from '@/ai/flows/generate-quote-from-prompt';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import {
  Card,
  CardContent
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, FileText, Sparkles, Percent, PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Quote } from '@/lib/types';
import { addQuote } from '@/lib/quotes';

const formSchema = z.object({
  prompt: z
    .string()
    .min(15, 'Please provide a more detailed job description (at least 15 characters).'),
  desiredMargin: z.coerce.number().min(0, "Margin can't be negative.").max(100, "Margin can't exceed 100."),
  overheadRate: z.coerce.number().min(0, "Overheads can't be negative."),
  quotingStandards: z.string().optional(),
});

const mockQuotingStandards = `Standard Labor Rate: $95/hour
Apprentice Labor Rate: $55/hour
Call-out Fee: $120 (includes first 30 minutes of labor)
Standard GPO (Supply & Install): $85 per unit
Standard Downlight (Supply & Install): $75 per unit
Wire per meter: $2.50
`;

interface QuoteFormDialogProps {
  onQuoteCreated: (quote: Quote) => void;
  projectId: string;
}

export function QuoteFormDialog({ onQuoteCreated, projectId }: QuoteFormDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GenerateQuoteFromPromptOutput | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      prompt: '',
      desiredMargin: 25,
      overheadRate: 15,
      quotingStandards: mockQuotingStandards,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    setResult(null);
    try {
      const response = await generateQuoteFromPrompt(values);
      setResult(response);
    } catch (error) {
      console.error('Error generating quote:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to generate quote. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveQuote() {
    if (!result || !projectId) return;
    setLoading(true);
    try {
      const quoteData = {
        projectId,
        ...form.getValues(),
        ...result,
      };
      const newQuoteId = await addQuote(projectId, quoteData);
      const newQuote: Quote = {
        id: newQuoteId,
        ...quoteData,
        createdAt: { seconds: Date.now() / 1000, nanoseconds: 0 } // Simulate timestamp
      };
      onQuoteCreated(newQuote);
      toast({ title: 'Quote Saved', description: 'The new quote has been saved to this project.' });
      setIsOpen(false);
      form.reset();
      setResult(null);
    } catch (error) {
      console.error("Failed to save quote:", error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not save the quote.' });
    } finally {
      setLoading(false);
    }
  }
  
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      form.reset();
      setResult(null);
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
             <DialogHeader>
                <DialogTitle>Create New Quote</DialogTitle>
                <DialogDescription>
                  Describe the job, and the AI will generate a quote. You can review it before saving.
                </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 <div className="space-y-4">
                     <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                          control={form.control}
                          name="prompt"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Job Description</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="e.g., 'Supply and install 3 downlights in the kitchen, and replace 5 GPOs in the living room.'"
                                  rows={6}
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>
                                Be as descriptive as possible for the best results.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                           <FormField
                            control={form.control}
                            name="desiredMargin"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Desired Margin</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                     <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                     <Input type="number" placeholder="25" className="pl-8" {...field} />
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                           <FormField
                            control={form.control}
                            name="overheadRate"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Overheads Rate</FormLabel>
                                 <FormControl>
                                  <div className="relative">
                                     <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                     <Input type="number" placeholder="15" className="pl-8" {...field} />
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <input type="hidden" {...form.register("quotingStandards")} />
                        <Button type="submit" disabled={loading} className="w-full">
                          {loading && !result ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            'Generate Quote'
                          )}
                        </Button>
                      </form>
                    </Form>
                 </div>
                 <div className="space-y-4">
                   {!result && !loading && (
                        <Card className="flex flex-col items-center justify-center text-center p-8 h-full">
                        <FileText className="h-16 w-16 text-muted-foreground" />
                        <p className="mt-4 text-lg font-semibold">
                            Your generated quote will appear here
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Enter a job description to get started.
                        </p>
                        </Card>
                    )}
                    {loading && !result && (
                        <Card className="flex flex-col items-center justify-center text-center p-8 h-full">
                        <Loader2 className="h-16 w-16 text-primary animate-spin" />
                        <p className="mt-4 text-lg font-semibold">
                            AI is preparing your quote...
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                            This may take a few moments.
                        </p>
                        </Card>
                    )}
                     {result && (
                        <Card>
                        <CardHeader className="pb-4">
                            <CardTitle className="flex items-center gap-2">
                            <Sparkles className="text-primary" />
                            Generated Quote
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="space-y-2 rounded-lg border p-4">
                                    <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>${result.subtotal.toFixed(2)}</span></div>
                                    <div className="flex justify-between"><span className="text-muted-foreground">Overheads</span><span>${result.overheads.toFixed(2)}</span></div>
                                    <div className="flex justify-between"><span className="text-muted-foreground">Markup</span><span>${result.markupAmount.toFixed(2)}</span></div>
                                    <div className="flex justify-between"><span className="text-muted-foreground">Total (excl. GST)</span><span>${result.totalBeforeTax.toFixed(2)}</span></div>
                                    <div className="flex justify-between"><span className="text-muted-foreground">GST (10%)</span><span>${result.taxAmount.toFixed(2)}</span></div>
                                    <div className="border-t my-2"></div>
                                    <div className="flex justify-between font-bold text-lg"><span >Quote Total</span><span className="text-primary">${result.totalAmount.toFixed(2)}</span></div>
                                </div>
                                <div className='text-sm'>
                                    <h4 className="font-semibold mb-2">Cost Breakdown</h4>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Desc.</TableHead>
                                                <TableHead className="text-center">QTY</TableHead>
                                                <TableHead className="text-right">Total</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {result.lineItems.map((item, index) => (
                                                <TableRow key={index}>
                                                    <TableCell>{item.description}</TableCell>
                                                    <TableCell className="text-center">{item.quantity}</TableCell>
                                                    <TableCell className="text-right">${item.totalCost.toFixed(2)}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        </CardContent>
                        </Card>
                    )}
                 </div>
            </div>
             <DialogFooter>
                <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
                <Button type="button" onClick={handleSaveQuote} disabled={!result || loading}>
                    {loading && result ? <Loader2 className="animate-spin" /> : "Save Quote to Project"}
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
  );
}
