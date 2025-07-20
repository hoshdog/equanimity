
// src/app/quotes/new-quote-dialog.tsx
'use client';

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
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
import { Loader2, FileText, Sparkles, Percent, PlusCircle, Plus, DollarSign, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Quote, Project, Customer, OptionType, Employee } from '@/lib/types';
import { addQuote } from '@/lib/quotes';
import { getProjects } from '@/lib/projects';
import { getCustomers, addCustomer as addDbCustomer } from '@/lib/customers';
import { getEmployeesWithWageData } from '@/lib/employees';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { initialQuotingProfiles, QuotingProfile } from '@/lib/quoting-profiles';
import { ProfileFormDialog } from '@/app/training/profile-form-dialog';
import { AddressAutocompleteInput } from '@/components/ui/address-autocomplete-input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { SearchableCombobox } from '@/components/ui/SearchableCombobox';

const customerSchema = z.object({
    name: z.string().min(2, { message: "Customer name must be at least 2 characters." }),
    address: z.string().min(10, { message: "Address must be at least 10 characters." }),
    primaryContactName: z.string().min(2, { message: "Primary contact name must be at least 2 characters." }),
    email: z.string().email({ message: "Please enter a valid email address." }),
    phone: z.string().min(8, { message: "Phone number seems too short." }),
    type: z.string().min(2, { message: "Please select a customer type." }),
});

function AddCustomerDialog({ onCustomerAdded, children }: { onCustomerAdded: (customer: Customer) => void, children: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();
    const form = useForm<z.infer<typeof customerSchema>>({
        resolver: zodResolver(customerSchema),
        defaultValues: { name: "", address: "", primaryContactName: "", email: "", phone: "", type: "Corporate Client" },
    });
    
    async function onSubmit(values: z.infer<typeof customerSchema>) {
        setLoading(true);
        try {
            const newCustomerData = {
              name: values.name,
              address: values.address,
              type: values.type,
              primaryContactName: values.primaryContactName,
              email: values.email,
              phone: values.phone,
            }
            const initialContact = { name: values.primaryContactName, emails: [values.email], phones: [values.phone], jobTitle: 'Primary Contact' };
            const initialSite = { name: 'Main Site', address: values.address };
            
            const { customerId } = await addDbCustomer(newCustomerData, initialContact, initialSite);
            const newCustomer = { id: customerId, ...newCustomerData };
            
            onCustomerAdded(newCustomer);
            toast({ title: "Customer Added", description: `"${values.name}" has been added.` });
            setIsOpen(false);
            form.reset();
        } catch (error) {
            console.error("Failed to add customer", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to add customer.' });
        } finally {
            setLoading(false);
        }
    }

    const handlePlaceSelect = (place: google.maps.places.PlaceResult | null) => {
        if (place?.name) {
            form.setValue('name', place.name);
        }
        if (place?.formatted_address) {
            form.setValue('address', place.formatted_address);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add New Customer</DialogTitle>
                    <DialogDescription>Create a new customer record. An initial contact and site will be created automatically.</DialogDescription>
                </DialogHeader>
                 <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField control={form.control} name="name" render={({ field }) => (
                            <FormItem><FormLabel>Customer Name</FormLabel>
                                <FormControl>
                                    <AddressAutocompleteInput 
                                        searchType="establishment"
                                        onPlaceSelect={handlePlaceSelect}
                                        placeholder="Search for a business..."
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}/>
                         <FormField control={form.control} name="address" render={({ field }) => (
                            <FormItem><FormLabel>Address</FormLabel>
                            <FormControl><Input placeholder="e.g., 123 Tech Park, Sydney" {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                        <FormField control={form.control} name="primaryContactName" render={({ field }) => (
                            <FormItem><FormLabel>Primary Contact Name</FormLabel><FormControl><Input placeholder="e.g., John Doe" {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                        <FormField control={form.control} name="email" render={({ field }) => (
                            <FormItem><FormLabel>Email</FormLabel><FormControl><Input placeholder="e.g., contact@innovate.com" {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                        <FormField control={form.control} name="phone" render={({ field }) => (
                            <FormItem><FormLabel>Phone</FormLabel><FormControl><Input placeholder="e.g., 02 9999 8888" {...field} /></FormControl><FormMessage />
                        </FormItem>
                        )}/>
                        <FormField control={form.control} name="type" render={({ field }) => (
                            <FormItem>
                                 <FormLabel>Customer Type</FormLabel>
                                 <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a customer type" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="Corporate Client">Corporate Client</SelectItem>
                                        <SelectItem value="Construction Partner">Construction Partner</SelectItem>
                                        <SelectItem value="Small Business">Small Business</SelectItem>
                                        <SelectItem value="Government">Government</SelectItem>
                                        <SelectItem value="Private">Private</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}/>
                        <DialogFooter>
                             <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
                            <Button type="submit" disabled={loading}>{loading ? <Loader2 className="animate-spin" /> : 'Add Customer'}</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

const materialLineItemSchema = z.object({
  description: z.string(),
  cost: z.number(),
  unit: z.string(),
});

const laborRateSchema = z.object({
  employeeType: z.string(),
  standardRate: z.number(),
  overtimeRate: z.number(),
  calculatedCostRate: z.number(),
});

const formSchema = z.object({
  customerId: z.string().min(1, "Please select a customer."),
  projectId: z.string().optional(),
  prompt: z
    .string()
    .min(15, 'Please provide a more detailed job description (at least 15 characters).'),
  desiredMargin: z.coerce.number().min(0, "Margin can't be negative.").max(100, "Margin can't exceed 100."),
  overheadCost: z.coerce.number().min(0, "Overheads can't be negative."),
  callOutFee: z.coerce.number().min(0, "Call-out fee can't be negative.").optional(),
  materialAndServiceRates: z.array(materialLineItemSchema),
  laborRates: z.array(laborRateSchema),
  persona: z.string().optional(),
  instructions: z.string().optional(),
});

interface NewQuoteDialogProps {
  onQuoteCreated: (quote: Quote) => void;
}

export function NewQuoteDialog({ onQuoteCreated }: NewQuoteDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [result, setResult] = useState<GenerateQuoteFromPromptOutput | null>(null);
  const [quotingProfiles, setQuotingProfiles] = useState<QuotingProfile[]>(initialQuotingProfiles);
  const [selectedProfileId, setSelectedProfileId] = useState<string>(quotingProfiles[0].id);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customerId: '',
      projectId: '',
      prompt: '',
      desiredMargin: quotingProfiles[0].defaults.desiredMargin,
      overheadCost: 0,
      callOutFee: quotingProfiles[0].defaults.callOutFee,
      laborRates: quotingProfiles[0].laborRates,
      materialAndServiceRates: quotingProfiles[0].materialAndServiceRates,
      persona: quotingProfiles[0].persona,
      instructions: quotingProfiles[0].instructions,
    },
  });
  
  const { fields: laborRateFields, update: updateLaborRate } = useFieldArray({ control: form.control, name: "laborRates" });
  const { fields: materialRateFields, update: updateMaterialRate } = useFieldArray({ control: form.control, name: "materialAndServiceRates" });

  const watchedCustomerId = form.watch("customerId");

  // Calculate overhead cost
  useEffect(() => {
    const overheadEmployees = employees.filter(e => e.isOverhead);
    if (overheadEmployees.length > 0) {
        const totalAnnualWages = overheadEmployees.reduce((acc, emp) => {
            const annualWage = (emp.wage || 0) * 38 * 52; // 38hr week
            return acc + annualWage;
        }, 0);
        
        // This is a simplified calculation. A real app would use a more complex formula.
        // For this demo, let's assume overhead is 2% of the total annual wage bill of overhead staff.
        const calculatedOverhead = totalAnnualWages * 0.02;
        form.setValue('overheadCost', calculatedOverhead);
    } else {
        form.setValue('overheadCost', 0);
    }
  }, [employees, form]);


  useEffect(() => {
    if (isOpen) {
        async function fetchData() {
            setLoading(true);
            try {
                const [projectsData, customersData, employeesData] = await Promise.all([
                    getProjects(),
                    getCustomers(),
                    getEmployeesWithWageData()
                ]);
                setProjects(projectsData);
                setCustomers(customersData);
                setEmployees(employeesData);
            } catch (error) {
                toast({ variant: 'destructive', title: 'Error', description: 'Could not load data.' });
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }
  }, [isOpen, toast]);

  const customerOptions: OptionType[] = customers.map(c => ({ value: c.id, label: c.name }));
  const projectOptions: OptionType[] = projects
    .filter(p => p.customerId === watchedCustomerId)
    .map(p => ({ value: p.id, label: p.name }));
  
  const handleProfileChange = (profileId: string) => {
    const profile = quotingProfiles.find(p => p.id === profileId);
    if (profile) {
        setSelectedProfileId(profile.id);
        form.reset({
            ...form.getValues(), // Keep existing values like prompt, customerId etc.
            desiredMargin: profile.defaults.desiredMargin,
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
    handleProfileChange(savedProfile.id);
  };
  
  const handleCustomerAdded = (newCustomer: Customer) => {
      setCustomers(prev => [...prev, newCustomer]);
      form.setValue('customerId', newCustomer.id, { shouldValidate: true });
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    setResult(null);
    try {
      const quoteResult = await generateQuoteFromPrompt(values);
      setResult(quoteResult);

      const quoteData = {
        customerId: values.customerId,
        projectId: values.projectId,
        ...values,
        ...quoteResult,
        status: 'Draft' as const,
      };
      
      const newQuoteId = await addQuote({
        ...quoteData,
        quoteNumber: `Q-${Date.now().toString().slice(-6)}`,
        quoteDate: new Date(),
        expiryDate: addDays(new Date(), 30),
        version: 1,
      });

      // The listener will handle the UI update.
      toast({ title: 'Quote Saved as Draft', description: 'The new quote has been saved.' });
      setIsOpen(false);

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
        customerId: '',
        projectId: '',
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
                Create New Quote
            </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[90vh] grid grid-rows-[auto,1fr,auto]">
            <DialogHeader>
                <DialogTitle>Create New Quote</DialogTitle>
                <DialogDescription>
                  Describe the job, and the AI will generate and save a draft quote.
                </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-hidden">
                <ScrollArea className="h-full pr-4">
                     <Form {...form}>
                      <form id="quote-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="customerId"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Customer</FormLabel>
                                        <div className="flex gap-2">
                                            <SearchableCombobox
                                                options={customerOptions}
                                                value={field.value}
                                                onChange={field.onChange}
                                                placeholder="Select a customer"
                                            />
                                            <AddCustomerDialog onCustomerAdded={handleCustomerAdded}>
                                                <Button type="button" variant="outline" size="icon" className="shrink-0">
                                                    <Plus className="h-4 w-4" />
                                                </Button>
                                            </AddCustomerDialog>
                                        </div>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="projectId"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                    <FormLabel>Project (Optional)</FormLabel>
                                    <SearchableCombobox
                                        options={projectOptions}
                                        value={field.value || ''}
                                        onChange={field.onChange}
                                        placeholder="Select a project"
                                        disabled={!watchedCustomerId}
                                    />
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                         <FormField
                          control={form.control}
                          name="prompt"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Job Description</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="e.g., 'Supply and install 3 downlights in the kitchen, and replace 5 GPOs in the living room.'"
                                  rows={4}
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
                        <Separator />
                        <div className="space-y-4 pt-2">
                           <div className="flex justify-between items-center">
                                <h3 className="font-semibold">Quoting Overrides</h3>
                                <ProfileFormDialog onProfileSaved={handleProfileSaved}>
                                     <Button type="button" variant="outline" size="sm">
                                        <Edit className="mr-2 h-4 w-4"/> Manage Profiles
                                    </Button>
                                </ProfileFormDialog>
                           </div>
                             <FormField
                                control={form.control}
                                name="desiredMargin"
                                render={({ field }) => (
                                <FormItem className="grid grid-cols-3 items-center">
                                    <FormLabel>Target Margin</FormLabel>
                                    <FormControl className="col-span-2">
                                    <div className="relative">
                                        <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input type="number" placeholder="25" className="pl-8" {...field} />
                                    </div>
                                    </FormControl>
                                </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="overheadCost"
                                render={({ field }) => (
                                <FormItem className="grid grid-cols-3 items-center">
                                    <FormLabel>Calculated Overhead</FormLabel>
                                    <FormControl className="col-span-2">
                                    <div className="relative">
                                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input type="number" className="pl-8" {...field} readOnly />
                                    </div>
                                    </FormControl>
                                </FormItem>
                                )}
                            />
                        </div>
                        <div className="space-y-2">
                            <h4 className="text-sm font-medium">Labor Rates (for this quote)</h4>
                            {laborRateFields.map((field, index) => (
                                <div key={field.id} className="grid grid-cols-3 gap-2">
                                    <Input value={field.employeeType} className="bg-secondary text-muted-foreground" readOnly/>
                                    <Input type="number" {...form.register(`laborRates.${index}.standardRate`)} />
                                    <Input type="number" {...form.register(`laborRates.${index}.overtimeRate`)} />
                                </div>
                            ))}
                        </div>
                         <div className="space-y-2">
                            <h4 className="text-sm font-medium">Material Rates (for this quote)</h4>
                            {materialRateFields.map((field, index) => (
                                <div key={field.id} className="grid grid-cols-12 gap-2">
                                    <div className="col-span-6">
                                        <Input {...form.register(`materialAndServiceRates.${index}.description`)} />
                                    </div>
                                    <div className="col-span-3">
                                        <Input type="number" {...form.register(`materialAndServiceRates.${index}.cost`)} />
                                    </div>
                                    <div className="col-span-3">
                                        <Input {...form.register(`materialAndServiceRates.${index}.unit`)} />
                                    </div>
                                </div>
                            ))}
                        </div>
                      </form>
                    </Form>
                </ScrollArea>
                <ScrollArea className="h-full">
                     <div className="space-y-4 pr-4">
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
                </ScrollArea>
            </div>
             <DialogFooter className="pt-4 border-t">
                <DialogClose asChild><Button type="button" variant="secondary">Close</Button></DialogClose>
                 <Button type="submit" form="quote-form" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating & Saving...
                    </>
                  ) : (
                    'Generate Quote'
                  )}
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
  );
}
