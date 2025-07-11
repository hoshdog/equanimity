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
  CardContent,
  CardHeader,
  CardTitle
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { initialQuotingProfiles, QuotingProfile } from '@/lib/quoting-profiles';
import { ProfileFormDialog } from '@/app/training/profile-form-dialog';

const lineItemRateSchema = z.object({
  description: z.string(),
  cost: z.number(),
  unit: z.string(),
});

const laborRateSchema = z.object({
  employeeType: z.string(),
  standardRate: z.number(),
  overtimeRate: z.number(),
});

const formSchema = z.object({
  prompt: z
    .string()
    .min(15, 'Please provide a more detailed job description (at least 15 characters).'),
  desiredMargin: z.coerce.number().min(0, "Margin can't be negative.").max(100, "Margin can't exceed 100."),
  overheadCost: z.coerce.number().min(0, "Overheads can't be negative."),
  callOutFee: z.coerce.number().min(0, "Call-out fee can't be negative.").optional(),
  laborRates: z.array(laborRateSchema).optional(),
  materialAndServiceRates: z.array(lineItemRateSchema).optional(),
  persona: z.string().optional(),
  instructions: z.string().optional(),
});

interface QuoteFormDialogProps {
  onQuoteCreated: (quote: Quote) => void;
  projectId: string;
}

export function QuoteFormDialog({ onQuoteCreated, projectId }: QuoteFormDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GenerateQuoteFromPromptOutput | null>(null);
  const [quotingProfiles, setQuotingProfiles] = useState<QuotingProfile[]>(initialQuotingProfiles);
  const [selectedProfileId, setSelectedProfileId] = useState<string>(quotingProfiles[0].id);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      prompt: '',
      desiredMargin: quotingProfiles[0].defaults.desiredMargin,
      overheadCost: 0, // This will be calculated
      callOutFee: quotingProfiles[0].defaults.callOutFee,
      laborRates: quotingProfiles[0].laborRates,
      materialAndServiceRates: quotingProfiles[0].materialAndServiceRates,
      persona: quotingProfiles[0].persona,
      instructions: quotingProfiles[0].instructions,
    },
  });
  
  const handleProfileChange = (profileId: string) => {
    const profile = quotingProfiles.find(p => p.id === profileId);
    if (profile) {
        setSelectedProfileId(profile.id);
        form.reset({
            prompt: form.getValues('prompt'),
            desiredMargin: profile.defaults.desiredMargin,
            overheadCost: form.getValues('overheadCost'),
            callOutFee: profile.defaults.callOutFee,
            laborRates: profile.laborRates,
            materialAndServiceRates: profile.materialAndServiceRates,
            persona: profile.persona,
            instructions: profile.instructions,
        });
    }
  }

  const handleProfileSaved = (savedProfile: QuotingProfile) => {
    const existingIndex = quotingProfiles.findIndex(p => p.id === savedProfile.id);
    let updatedProfiles;
    if (existingIndex > -1) {
        updatedProfiles = quotingProfiles.map(p => p.id === savedProfile.id ? savedProfile : p);
    } else {
        updatedProfiles = [...quotingProfiles, savedProfile];
    }
    setQuotingProfiles(updatedProfiles);
    handleProfileChange(savedProfile.id); // Select the new or updated profile
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    setResult(null);
    try {
      const quoteResult = await generateQuoteFromPrompt(values);
      setResult(quoteResult);

      const quoteData = {
        projectId,
        ...values,
        ...quoteResult,
        status: 'Draft' as const,
      };
      
      const newQuoteId = await addQuote(quoteData);
      const newQuote: Quote = {
        id: newQuoteId,
        customerId: '', // This should be derived from the project in a real app
        ...quoteData,
        createdAt: { seconds: Date.now() / 1000, nanoseconds: 0 }
      };

      onQuoteCreated(newQuote);
      toast({ title: 'Quote Saved as Draft', description: 'The new quote has been saved to this project.' });

    } catch (error) {
      console.error('Error generating or saving quote:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to generate and save quote. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  }
  
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      const profile = quotingProfiles[0];
      form.reset({
        prompt: '',
        desiredMargin: profile.defaults.desiredMargin,
        overheadCost: 0,
        callOutFee: profile.defaults.callOutFee,
        laborRates: profile.laborRates,
        materialAndServiceRates: profile.materialAndServiceRates,
        persona: profile.persona,
        instructions: profile.instructions,
      });
      setSelectedProfileId(profile.id);
      setResult(null);
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
             <DialogHeader>
                <DialogTitle>Create New Quote</DialogTitle>
                <DialogDescription>
                  Describe the job, and the AI will generate and save a draft quote.
                </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 <div className="space-y-4">
                     <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormItem>
                            <FormLabel>Quoting Profile</FormLabel>
                             <div className="flex items-center gap-2">
                                <Select onValueChange={handleProfileChange} value={selectedProfileId}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a quoting profile" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {quotingProfiles.map(profile => (
                                            <SelectItem key={profile.id} value={profile.id}>{profile.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                 <ProfileFormDialog onProfileSaved={handleProfileSaved}>
                                     <Button type="button" variant="outline" size="icon">
                                        <PlusCircle className="h-4 w-4" />
                                    </Button>
                                </ProfileFormDialog>
                             </div>
                            <FormDescription>
                                Select a profile to load pre-defined costing and labor rates.
                            </FormDescription>
                        </FormItem>
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
                           {/* OverheadRate is replaced by overheadCost which is calculated dynamically */}
                        </div>
                        <input type="hidden" {...form.register("laborRates")} />
                        <input type="hidden" {...form.register("materialAndServiceRates")} />
                        <input type="hidden" {...form.register("persona")} />
                        <input type="hidden" {...form.register("instructions")} />
                         <input type="hidden" {...form.register("callOutFee")} />
                         <input type="hidden" {...form.register("overheadCost")} />
                        <Button type="submit" disabled={loading} className="w-full">
                          {loading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Generating & Saving...
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
                <DialogClose asChild><Button type="button" variant="secondary">Close</Button></DialogClose>
            </DialogFooter>
        </DialogContent>
    </Dialog>
  );
}
