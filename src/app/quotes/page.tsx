// src/app/quotes/page.tsx
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
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
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
import { Loader2, FileText, Sparkles, Percent, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { quotingProfiles, QuotingProfile } from '@/lib/quoting-profiles';

const formSchema = z.object({
  prompt: z
    .string()
    .min(15, 'Please provide a more detailed job description (at least 15 characters).'),
  desiredMargin: z.coerce.number().min(0, "Margin can't be negative.").max(100, "Margin can't exceed 100."),
  overheadRate: z.coerce.number().min(0, "Overheads can't be negative."),
  quotingStandards: z.string().optional(),
});


export default function QuotesPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GenerateQuoteFromPromptOutput | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<QuotingProfile>(quotingProfiles[0]);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      prompt: '',
      desiredMargin: 25,
      overheadRate: 15,
      quotingStandards: selectedProfile.standards,
    },
  });
  
  const handleProfileChange = (profileName: string) => {
    const profile = quotingProfiles.find(p => p.name === profileName);
    if (profile) {
        setSelectedProfile(profile);
        form.setValue('quotingStandards', profile.standards);
    }
  }

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

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Quotes</h2>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>AI Quote Generation</CardTitle>
            <CardDescription>
              Describe the job, set your margin, and let the AI calculate the costs and generate a quote.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                 <FormItem>
                    <FormLabel>Quoting Profile</FormLabel>
                    <Select onValueChange={handleProfileChange} defaultValue={selectedProfile.name}>
                        <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a quoting profile" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {quotingProfiles.map(profile => (
                                <SelectItem key={profile.name} value={profile.name}>{profile.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
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
                  {loading ? (
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
          </CardContent>
        </Card>
        <div className="lg:col-span-3">
          {!result && !loading && (
            <Card className="flex flex-col items-center justify-center text-center p-8 h-full">
              <FileText className="h-16 w-16 text-muted-foreground" />
              <p className="mt-4 text-lg font-semibold">
                Your generated quote will appear here
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Enter a job description and your desired margin to get started.
              </p>
            </Card>
          )}
          {loading && (
            <Card className="flex flex-col items-center justify-center text-center p-8 h-full">
              <Loader2 className="h-16 w-16 text-primary animate-spin" />
              <p className="mt-4 text-lg font-semibold">
                AI is preparing your quote...
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Calculating costs and applying markup. This may take a few moments.
              </p>
            </Card>
          )}
          {result && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="text-primary" />
                  Generated Quote
                </CardTitle>
                <CardDescription>
                    A detailed breakdown of the generated quote.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                    <div>
                        <h4 className="font-semibold mb-2">Cost Breakdown</h4>
                         <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Description</TableHead>
                                    <TableHead className="text-center">QTY</TableHead>
                                    <TableHead className="text-right">Unit Cost</TableHead>
                                    <TableHead className="text-right">Total</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {result.lineItems.map((item, index) => (
                                    <TableRow key={index}>
                                        <TableCell>{item.description}</TableCell>
                                        <TableCell className="text-center">{item.quantity}</TableCell>
                                        <TableCell className="text-right">${item.unitCost.toFixed(2)}</TableCell>
                                        <TableCell className="text-right">${item.totalCost.toFixed(2)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                         </Table>
                    </div>
                    <div className="space-y-2 rounded-lg border p-4">
                        <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>${result.subtotal.toFixed(2)}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Overheads</span><span>${result.overheads.toFixed(2)}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Markup</span><span>${result.markupAmount.toFixed(2)}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Total (excl. GST)</span><span>${result.totalBeforeTax.toFixed(2)}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">GST (10%)</span><span>${result.taxAmount.toFixed(2)}</span></div>
                        <div className="border-t my-2"></div>
                        <div className="flex justify-between font-bold text-lg"><span >Quote Total</span><span className="text-primary">${result.totalAmount.toFixed(2)}</span></div>
                    </div>
                     <div>
                        <h4 className="font-semibold mb-2">Formatted Quote</h4>
                        <pre className="text-sm p-4 rounded-md bg-muted whitespace-pre-wrap font-sans">
                            {result.quoteText}
                        </pre>
                    </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
