
// src/app/quotes/[id]/page.tsx
'use client';

import * as React from 'react';
import { use, useEffect, useMemo, useState } from 'react';
import { useFieldArray, useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import { onSnapshot, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { updateQuote } from '@/lib/quotes';
import { getCustomer, getCustomers, getCustomerContacts, getCustomerSites } from '@/lib/customers';
import { getEmployees } from '@/lib/employees';
import { getProject, getProjects } from '@/lib/projects';
import type { Quote, Project, Contact, Employee, OptionType, QuoteLineItem, AssignedStaff, ProjectContact, Customer, Site } from '@/lib/types';
import { PlusCircle, Trash2, Loader2, DollarSign, ArrowLeft, Users, Pencil, Briefcase, Building2, MapPin, Save, Wand2, Upload, FileText } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { SearchableCombobox } from '@/components/ui/SearchableCombobox';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { initialQuotingProfiles, QuotingProfile } from '@/lib/quoting-profiles';
import { PartSelectorDialog } from './part-selector-dialog';
import { generateQuoteFromPrompt, GenerateQuoteFromPromptOutput } from '@/ai/flows/generate-quote-from-prompt';


const lineItemSchema = z.object({
    id: z.string(),
    type: z.enum(['Part', 'Labour']),
    description: z.string().min(3, "Description is required."),
    quantity: z.coerce.number().min(0.1, "Qty must be > 0."),
    unitPrice: z.coerce.number().min(0.01, "Price must be greater than 0."),
    unitCost: z.coerce.number().min(0).optional(), // Cost to you
    taxRate: z.coerce.number().min(0).default(10), // Default GST
});

const formSchema = z.object({
  quoteNumber: z.string().min(1, "Quote number is required."),
  name: z.string().min(3, "Quote name is required."),
  description: z.string().optional(),
  quoteDate: z.date({ required_error: "Quote date is required." }),
  dueDate: z.date({ required_error: "Due date is required." }),
  expiryDate: z.date({ required_error: "Expiry date is required." }),
  status: z.enum(['Draft', 'Sent', 'Approved', 'Rejected', 'Invoiced']),
  lineItems: z.array(lineItemSchema).min(1, "At least one line item is required."),
  projectContacts: z.array(z.object({ contactId: z.string().min(1), role: z.string().min(2) })).optional(),
  assignedStaff: z.array(z.object({ employeeId: z.string().min(1), role: z.string().min(2) })).optional(),
  paymentTerms: z.string().optional(),
  validityTerms: z.string().optional(),
  internalNotes: z.string().optional(),
  clientNotes: z.string().optional(),
  projectId: z.string().optional(),
  customerId: z.string().optional(),
  siteId: z.string().optional(),
}).refine(data => data.expiryDate >= data.quoteDate, {
    message: "Expiry date must be on or after the quote date.",
    path: ["expiryDate"],
}).refine(data => data.dueDate >= data.quoteDate, {
    message: "Due date must be on or after the quote date.",
    path: ["dueDate"],
});


type QuoteFormValues = z.infer<typeof formSchema>;


function AIAssistant({
    onGenerationComplete,
}: {
    onGenerationComplete: (output: GenerateQuoteFromPromptOutput) => void;
}) {
    const [aiPrompt, setAiPrompt] = useState('');
    const [loading, setLoading] = useState(false);
    const [selectedProfileId, setSelectedProfileId] = useState<string>(initialQuotingProfiles[0].id);
    const { toast } = useToast();
    
    const selectedProfile = useMemo(() => {
        return initialQuotingProfiles.find(p => p.id === selectedProfileId) || initialQuotingProfiles[0];
    }, [selectedProfileId]);

    const handleGenerateQuote = async () => {
        setLoading(true);
        try {
            const result = await generateQuoteFromPrompt({
                prompt: aiPrompt,
                desiredMargin: selectedProfile.defaults.desiredMargin,
                overheadCost: 50, // This could be a configurable value
                callOutFee: selectedProfile.defaults.callOutFee,
                laborRates: selectedProfile.laborRates,
                materialAndServiceRates: selectedProfile.materialAndServiceRates,
                persona: selectedProfile.persona,
                instructions: selectedProfile.instructions
            });
            onGenerationComplete(result);
            toast({ title: 'Quote Generated', description: 'The AI has generated the quote details and line items.' });
        } catch (error) {
             console.error("AI quote generation failed:", error);
            toast({ variant: 'destructive', title: 'AI Error', description: 'Failed to generate the quote.' });
        } finally {
            setLoading(false);
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Wand2 className="h-5 w-5 text-primary" />
                    AI Assistant
                </CardTitle>
                <CardDescription>Generate the entire quote from a single prompt.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div className="space-y-2">
                    <Label htmlFor="quoting-profile">Quoting Profile</Label>
                    <Select value={selectedProfileId} onValueChange={setSelectedProfileId}>
                        <SelectTrigger id="quoting-profile">
                            <SelectValue placeholder="Select a profile" />
                        </SelectTrigger>
                        <SelectContent>
                            {initialQuotingProfiles.map(profile => (
                                <SelectItem key={profile.id} value={profile.id}>{profile.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                 </div>
                 <div className="space-y-2">
                    <Label htmlFor="ai-prompt">Job Description Prompt</Label>
                    <Textarea id="ai-prompt" value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} placeholder="e.g., Supply and install 10 new downlights in the kitchen..." rows={5} />
                    <FormDescription>The more detail you provide, the more accurate the generated quote will be.</FormDescription>
                </div>
                <Button type="button" onClick={handleGenerateQuote} disabled={loading || !aiPrompt} className="w-full">
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                    Generate Quote
                </Button>
            </CardContent>
        </Card>
    );
}


export default function QuoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: quoteId } = use(params);
    const [quote, setQuote] = useState<Quote | null>(null);
    const [project, setProject] = useState<Project | null>(null);
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [site, setSite] = useState<Site | null>(null);
    const [allProjects, setAllProjects] = useState<Project[]>([]);
    const [allCustomers, setAllCustomers] = useState<Customer[]>([]);
    const [customerSites, setCustomerSites] = useState<Site[]>([]);
    const [projectContacts, setProjectContacts] = useState<Contact[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditingHeader, setIsEditingHeader] = useState(false);
    const [aiSuggestions, setAiSuggestions] = useState<GenerateQuoteFromPromptOutput | null>(null);
    const { toast } = useToast();

    const quotingProfile: QuotingProfile = initialQuotingProfiles[0];
    const laborRateOptions = useMemo(() => {
        const defaultRates = [
            { label: "Standard Labor", value: "Standard Labor", calculatedCostRate: 50, standardRate: 90 },
            { label: "Overtime Labor", value: "Overtime Labor", calculatedCostRate: 75, standardRate: 135 }
        ];

        if (!quotingProfile.laborRates || quotingProfile.laborRates.length === 0) {
            return defaultRates;
        }

        const profileRates = quotingProfile.laborRates.map(rate => ({
            label: rate.employeeType,
            value: rate.employeeType,
            ...rate,
        }));
        
        return profileRates.length > 0 ? profileRates : defaultRates;
    }, [quotingProfile.laborRates]);

    const form = useForm<QuoteFormValues>({ resolver: zodResolver(formSchema) });
    const { control, setValue, watch, trigger, getValues, reset } = form;
    const { fields: lineItemFields, append: appendLineItem, remove: removeLineItem, replace: replaceLineItems } = useFieldArray({ control, name: "lineItems" });

    const watchedProjectId = watch('projectId');
    const watchedCustomerId = watch('customerId');

    const resetFormToQuote = React.useCallback((quoteData: Quote) => {
        reset({
            ...quoteData,
            quoteDate: quoteData.quoteDate instanceof Date ? quoteData.quoteDate : (quoteData.quoteDate as any)?.toDate() || new Date(),
            dueDate: quoteData.dueDate instanceof Date ? quoteData.dueDate : (quoteData.dueDate as any)?.toDate() || new Date(new Date().setDate(new Date().getDate() + 14)),
            expiryDate: quoteData.expiryDate instanceof Date ? quoteData.expiryDate : (quoteData.expiryDate as any)?.toDate() || new Date(new Date().setDate(new Date().getDate() + 30)),
        });
    }, [reset]);

    useEffect(() => {
        const fetchRelatedData = async (quoteData: Quote) => {
            if (quoteData.projectId) {
                const proj = await getProject(quoteData.projectId);
                setProject(proj);
                if (proj?.customerId) {
                    const cust = await getCustomer(proj.customerId);
                    setCustomer(cust);
                    const sites = await getCustomerSites(proj.customerId);
                    setCustomerSites(sites);
                    const projSite = sites.find(s => s.id === proj.siteId);
                    setSite(projSite || null);
                }
            } else if (quoteData.customerId) {
                 const cust = await getCustomer(quoteData.customerId);
                 setCustomer(cust);
                 const sites = await getCustomerSites(quoteData.customerId);
                 setCustomerSites(sites);
                 const projSite = sites.find(s => s.id === quoteData.siteId);
                 setSite(projSite || null);
            }
             if (quoteData.customerId) {
                const contacts = await getCustomerContacts(quoteData.customerId);
                setProjectContacts(contacts);
            }
        };

        const unsub = onSnapshot(doc(db, "quotes", quoteId), async (doc) => {
            if (doc.exists()) {
                setLoading(true);
                const quoteData = { id: doc.id, ...doc.data() } as Quote;
                setQuote(quoteData);
                await fetchRelatedData(quoteData);
                resetFormToQuote(quoteData);
            } else {
                toast({ variant: 'destructive', title: 'Error', description: 'Quote not found.' });
            }
            setLoading(false);
        });
        return () => unsub();
    }, [quoteId, toast, resetFormToQuote]);

    // Fetch lists for dropdowns when editing
    useEffect(() => {
        if (isEditingHeader) {
            getProjects().then(setAllProjects);
            getCustomers().then(setAllCustomers);
        }
    }, [isEditingHeader]);
    
    // When customer changes, fetch their sites
    useEffect(() => {
        if (watchedCustomerId && isEditingHeader) {
            getCustomerSites(watchedCustomerId).then(setCustomerSites);
        }
    }, [watchedCustomerId, isEditingHeader]);


    const lineItemsWatch = form.watch('lineItems');
    const { subtotal, totalTax, totalAmount, totalCost, grossProfit, grossMargin } = React.useMemo(() => {
        let sub = 0, tax = 0, cost = 0;
        if (lineItemsWatch) {
            lineItemsWatch.forEach((item: Partial<QuoteLineItem>) => {
                const lineTotal = (item.quantity || 0) * (item.unitPrice || 0);
                const lineCost = (item.quantity || 0) * (item.unitCost || item.unitPrice || 0);
                sub += lineTotal;
                tax += lineTotal * ((item.taxRate || 0) / 100);
                cost += lineCost;
            });
        }
        const profit = sub - cost;
        const margin = sub > 0 ? (profit / sub) * 100 : 0;
        return { subtotal: sub, totalTax: tax, totalAmount: sub + tax, totalCost: cost, grossProfit: profit, grossMargin: margin };
    }, [lineItemsWatch]);

    async function onSubmit(values: QuoteFormValues) {
        if (!quote) return;
        setLoading(true);
        try {
            const quoteDataToUpdate = { ...values, subtotal, totalTax, totalAmount };
            await updateQuote(quote.id, quoteDataToUpdate, "Manual quote update");
            toast({ title: "Quote Updated", description: "Your changes have been saved." });
            setIsEditingHeader(false);
        } catch (error) {
            console.error("Failed to update quote:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not update the quote.' });
        } finally {
            setLoading(false);
        }
    }
    
    const handleGenerationComplete = (output: GenerateQuoteFromPromptOutput) => {
        setValue('description', output.quoteText);
        setAiSuggestions(output);
    };

    const isItemLabor = (item: GenerateQuoteFromPromptOutput['lineItems'][number]) => {
        if ((item.type as string) === 'Labour') return true;
        const laborKeywords = ['labor', 'labour', 'technician', 'engineer', 'developer', 'consultant', 'hours', 'hrs', 'service', 'installation', 'support', 'call-out', 'callout'];
        return laborKeywords.some(keyword => item.description.toLowerCase().includes(keyword));
    }
    
    const handleAddSuggestedItem = (item: GenerateQuoteFromPromptOutput['lineItems'][number]) => {
        appendLineItem({
            id: `item-${Date.now()}`,
            type: isItemLabor(item) ? 'Labour' : 'Part',
            description: item.description,
            quantity: item.quantity,
            unitPrice: parseFloat((item.totalCost / item.quantity).toFixed(2)),
            unitCost: parseFloat(item.unitCost.toFixed(2)),
            taxRate: 10,
        });
        toast({ title: "Item Added", description: `Added "${item.description}" to the quote.` });
    };

    const customerOptions = useMemo(() => allCustomers.map(c => ({ value: c.id, label: c.name })), [allCustomers]);
    const projectOptions = useMemo(() => allProjects.map(p => ({ value: p.id, label: `${p.name} (${p.customerName})` })), [allProjects]);
    const siteOptions = useMemo(() => customerSites.map(s => ({ value: s.id, label: s.name })), [customerSites]);
    
    if (loading) return <div className="flex-1 p-8 pt-6 flex items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
    if (!quote) return <div className="flex-1 p-8 pt-6"><h2>Quote not found</h2></div>;

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="flex items-center justify-between">
                 <div className="flex items-center space-x-4">
                     <Button asChild variant="outline" size="icon">
                        <Link href={quote.projectId ? `/projects/${quote.projectId}` : '/quotes'}>
                            <ArrowLeft className="h-4 w-4"/><span className="sr-only">Back</span>
                        </Link>
                    </Button>
                    <h2 className="text-3xl font-bold tracking-tight">Quote: {quote.quoteNumber}</h2>
                 </div>
                 <Button type="submit" disabled={loading}>{loading ? <Loader2 className="animate-spin" /> : <><Save className="mr-2 h-4 w-4"/>Save Changes</>}</Button>
            </div>
            
             <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>
                            {customer?.name || 'No Customer Selected'}
                            {project && <span className="text-muted-foreground"> / {project.name}</span>}
                        </CardTitle>
                        <CardDescription>
                           Core details, dates, and links for this quote.
                        </CardDescription>
                    </div>
                     <div className="flex gap-2">
                        {!isEditingHeader ? (
                            <Button variant="outline" onClick={() => setIsEditingHeader(true)}><Pencil className="mr-2 h-4 w-4" /> Edit</Button>
                        ) : (
                           <>
                            <Button variant="secondary" onClick={() => { setIsEditingHeader(false); resetFormToQuote(quote); }}>Cancel</Button>
                            <Button onClick={() => form.handleSubmit(onSubmit)()} disabled={loading}>
                                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4" />}
                                Save Details
                            </Button>
                           </>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {isEditingHeader ? (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <FormField control={form.control} name="customerId" render={({ field }) => ( <FormItem><FormLabel>Customer</FormLabel><SearchableCombobox options={customerOptions} {...field} placeholder="Select a customer..." /></FormItem> )}/>
                                <FormField control={form.control} name="siteId" render={({ field }) => ( <FormItem><FormLabel>Site</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent>{siteOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent></Select></FormItem> )}/>
                                <FormField control={form.control} name="projectId" render={({ field }) => ( <FormItem><FormLabel>Project</FormLabel><SearchableCombobox options={projectOptions} {...field} placeholder="Select a project..." /></FormItem> )}/>
                            </div>
                            <Separator />
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField control={form.control} name="name" render={({ field }) => ( <FormItem><FormLabel>Quote Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )}/>
                                <FormField control={form.control} name="description" render={({ field }) => ( <FormItem><FormLabel>Description</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )}/>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <FormItem><FormLabel>Quote #</FormLabel><FormControl><Input value={form.getValues('quoteNumber')} readOnly /></FormControl></FormItem>
                                <FormItem><FormLabel>Quote Date</FormLabel><FormControl><Input readOnly value={form.getValues('quoteDate') ? format(form.getValues('quoteDate'), 'PPP') : 'N/A'} /></FormControl></FormItem>
                                <FormField control={form.control} name="dueDate" render={({ field }) => ( <FormItem className="flex flex-col"><FormLabel>Due Date</FormLabel><FormControl><Input readOnly value={field.value ? format(field.value, 'PPP') : 'N/A'} /></FormControl><FormMessage /></FormItem>)}/>
                                <FormField control={form.control} name="status" render={({ field }) => ( <FormItem><FormLabel>Status</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="Draft">Draft</SelectItem><SelectItem value="Sent">Sent</SelectItem><SelectItem value="Approved">Approved</SelectItem><SelectItem value="Rejected">Rejected</SelectItem><SelectItem value="Invoiced">Invoiced</SelectItem></SelectContent></Select><FormMessage /></FormItem> )}/>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                           <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                <div className="flex items-center gap-2"><Building2 className="h-4 w-4 text-muted-foreground"/><strong>Customer:</strong> {customer?.name || 'N/A'}</div>
                                <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-muted-foreground"/><strong>Site:</strong> {site?.name || 'N/A'}</div>
                                <div className="flex items-center gap-2"><Briefcase className="h-4 w-4 text-muted-foreground"/><strong>Project:</strong> {project?.name || 'N/A'}</div>
                            </div>
                            <Separator />
                             <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                                <div><span className="text-muted-foreground">Due:</span> {format((quote.dueDate as any).toDate(), 'PPP')}</div>
                                <div><span className="text-muted-foreground">Status:</span> <span className="font-medium">{quote.status}</span></div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Quote Description</CardTitle>
                            <CardDescription>
                                This is the customer-facing description of the work to be performed, including scope, inclusions, and exclusions.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <FormField
                                control={control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormControl>
                                            <Textarea
                                                placeholder="e.g., ### Inclusions..."
                                                rows={12}
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Parts & Materials</CardTitle>
                            <PartSelectorDialog
                                onPartSelected={(part) => {
                                    appendLineItem({
                                        id: `item-${lineItemFields.length}`,
                                        type: 'Part',
                                        description: part.description,
                                        quantity: part.quantity,
                                        unitCost: part.unitCost,
                                        unitPrice: part.unitPrice,
                                        taxRate: 10,
                                    });
                                }}
                            >
                                <Button type="button" variant="outline" size="sm">
                                    <PlusCircle className="mr-2 h-4 w-4"/>Add Part
                                </Button>
                            </PartSelectorDialog>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="grid grid-cols-12 gap-2 px-2">
                                <Label className="col-span-12 sm:col-span-5">Description</Label>
                                <Label className="col-span-4 sm:col-span-2 text-center">Qty</Label>
                                <Label className="col-span-4 sm:col-span-2 text-center">Unit Cost</Label>
                                <Label className="col-span-4 sm:col-span-2 text-center">Unit Price</Label>
                                <Label className="col-span-4 sm:col-span-1 text-center">Tax %</Label>
                            </div>
                            {lineItemFields.filter(item => item.type === 'Part').length > 0 ? lineItemFields.map((field, index) => {
                                const originalIndex = lineItemFields.findIndex(item => item.id === field.id);
                                if (lineItemFields[originalIndex].type !== 'Part') return null;
                                return (
                                    <div key={field.id} className="flex items-start gap-2 p-2 border rounded-md bg-secondary/30">
                                        <div className="grid grid-cols-12 gap-2 flex-grow">
                                            <div className="col-span-12 sm:col-span-5">
                                                <FormField control={form.control} name={`lineItems.${originalIndex}.description`} render={({ field }) => ( <FormItem><FormControl><Input placeholder="Part description" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                                            </div>
                                            <div className="col-span-4 sm:col-span-2">
                                                <FormField control={form.control} name={`lineItems.${originalIndex}.quantity`} render={({ field }) => ( <FormItem><FormControl><Input type="number" placeholder="Qty" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                                            </div>
                                            <div className="col-span-4 sm:col-span-2">
                                                <FormField control={form.control} name={`lineItems.${originalIndex}.unitCost`} render={({ field }) => ( <FormItem><FormControl><div className="relative"><DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input type="number" step="0.01" className="pl-6" {...field} /></div></FormControl><FormMessage /></FormItem> )}/>
                                            </div>
                                            <div className="col-span-4 sm:col-span-2">
                                                <FormField control={form.control} name={`lineItems.${originalIndex}.unitPrice`} render={({ field }) => ( <FormItem><FormControl><div className="relative"><DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input type="number" step="0.01" className="pl-6" {...field} /></div></FormControl><FormMessage /></FormItem> )}/>
                                            </div>
                                            <div className="col-span-4 sm:col-span-1 flex items-center justify-center">
                                                <FormField
                                                    control={form.control}
                                                    name={`lineItems.${originalIndex}.taxRate`}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormControl>
                                                                <div className="relative flex items-center">
                                                                    <input type="hidden" {...field} />
                                                                    <span className="text-sm">{field.value}%</span>
                                                                </div>
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                        </div>
                                        <Button type="button" variant="ghost" size="icon" onClick={() => removeLineItem(originalIndex)}><Trash2 className="h-5 w-5 text-destructive"/></Button>
                                    </div>
                                )
                            }) : <p className="text-sm text-muted-foreground text-center p-4">No parts added yet.</p>}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Labour & Services</CardTitle>
                            <Button type="button" variant="outline" size="sm" onClick={() => appendLineItem({ id: `item-${lineItemFields.length}`, type: 'Labour', description: "", quantity: 1, unitCost: 0, unitPrice: 0, taxRate: 10 })}>
                                <PlusCircle className="mr-2 h-4 w-4"/>Add Labour
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="grid grid-cols-12 gap-2 px-2">
                                <Label className="col-span-12 sm:col-span-5">Description</Label>
                                <Label className="col-span-4 sm:col-span-2 text-center">Hours</Label>
                                <Label className="col-span-4 sm:col-span-2 text-center">Cost Rate</Label>
                                <Label className="col-span-4 sm:col-span-2 text-center">Billable Rate</Label>
                                <Label className="col-span-4 sm:col-span-1 text-center">Tax %</Label>
                            </div>
                            {lineItemFields.filter(item => item.type === 'Labour').length > 0 ? lineItemFields.map((field, index) => {
                                const originalIndex = lineItemFields.findIndex(item => item.id === field.id);
                                if (lineItemFields[originalIndex].type !== 'Labour') return null;
                                return (
                                    <div key={field.id} className="flex items-start gap-2 p-2 border rounded-md bg-secondary/30">
                                        <div className="grid grid-cols-12 gap-2 flex-grow">
                                            <div className="col-span-12 sm:col-span-5">
                                                <FormField
                                                    control={form.control}
                                                    name={`lineItems.${originalIndex}.description`}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <Select
                                                                onValueChange={(value) => {
                                                                    field.onChange(value);
                                                                    const selectedRate = laborRateOptions.find(opt => opt.value === value);
                                                                    if (selectedRate) {
                                                                        setValue(`lineItems.${originalIndex}.unitCost`, selectedRate.calculatedCostRate);
                                                                        setValue(`lineItems.${originalIndex}.unitPrice`, selectedRate.standardRate);
                                                                    }
                                                                }}
                                                                value={field.value}
                                                            >
                                                                <FormControl>
                                                                    <SelectTrigger>
                                                                        <SelectValue placeholder="Select a labor type" />
                                                                    </SelectTrigger>
                                                                </FormControl>
                                                                <SelectContent>
                                                                    {laborRateOptions.map(option => (
                                                                        <SelectItem key={option.value} value={option.value}>
                                                                            {option.label}
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                            <div className="col-span-4 sm:col-span-2">
                                                <FormField control={form.control} name={`lineItems.${originalIndex}.quantity`} render={({ field }) => ( <FormItem><FormControl><Input type="number" placeholder="Hours" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                                            </div>
                                            <div className="col-span-4 sm:col-span-2">
                                                <FormField control={form.control} name={`lineItems.${originalIndex}.unitCost`} render={({ field }) => ( <FormItem><FormControl><div className="relative"><DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input type="number" step="0.01" className="pl-6" {...field} /></div></FormControl><FormMessage /></FormItem> )}/>
                                            </div>
                                            <div className="col-span-4 sm:col-span-2">
                                                <FormField control={form.control} name={`lineItems.${originalIndex}.unitPrice`} render={({ field }) => ( <FormItem><FormControl><div className="relative"><DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input type="number" step="0.01" className="pl-6" {...field} /></div></FormControl><FormMessage /></FormItem> )}/>
                                            </div>
                                            <div className="col-span-4 sm:col-span-1 flex items-center justify-center">
                                                <FormField
                                                    control={form.control}
                                                    name={`lineItems.${originalIndex}.taxRate`}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormControl>
                                                                <div className="relative flex items-center">
                                                                    <input type="hidden" {...field} />
                                                                    <span className="text-sm">{field.value}%</span>
                                                                </div>
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                        </div>
                                        <Button type="button" variant="ghost" size="icon" onClick={() => removeLineItem(originalIndex)}><Trash2 className="h-5 w-5 text-destructive"/></Button>
                                    </div>
                                )
                            }) : <p className="text-sm text-muted-foreground text-center p-4">No labour added yet.</p>}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle>Totals & Summary</CardTitle></CardHeader>
                        <CardContent>
                             <div className="flex justify-end">
                                <div className="w-full max-w-sm space-y-4">
                                    <div className="space-y-1 text-sm"><div className="flex justify-between"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div><div className="flex justify-between"><span>Tax (GST)</span><span>${totalTax.toFixed(2)}</span></div></div>
                                    <Separator />
                                    <div className="flex justify-between font-bold text-lg"><span>Total</span><span>${totalAmount.toFixed(2)}</span></div>
                                    <Separator />
                                    <div className="space-y-1 text-xs text-muted-foreground"><div className="flex justify-between"><span>Total Cost</span><span>${totalCost.toFixed(2)}</span></div><div className="flex justify-between"><span>Gross Profit</span><span>${grossProfit.toFixed(2)}</span></div><div className="flex justify-between"><span>Gross Margin</span><span className={cn(grossMargin < 20 ? 'text-destructive' : 'text-primary')}>{grossMargin.toFixed(1)}%</span></div></div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle>Terms & Notes</CardTitle></CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField control={form.control} name="clientNotes" render={({ field }) => (<FormItem><FormLabel>Notes for Client</FormLabel><FormControl><Textarea rows={3} {...field} /></FormControl><FormMessage/></FormItem>)}/>
                            <FormField control={form.control} name="internalNotes" render={({ field }) => (<FormItem><FormLabel>Internal Notes</FormLabel><FormControl><Textarea rows={3} {...field} /></FormControl><FormMessage/></FormItem>)}/>
                        </CardContent>
                    </Card>
                </div>

                <div className="lg:col-span-1 space-y-4">
                    <AIAssistant onGenerationComplete={handleGenerationComplete} />
                    {aiSuggestions && (
                        <Card>
                            <CardHeader>
                                <CardTitle>AI Suggestions</CardTitle>
                                <CardDescription>Review and add the suggested items to your quote.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <h4 className="font-semibold mb-2">Suggested Parts</h4>
                                    <div className="space-y-2">
                                        {aiSuggestions.lineItems.filter(item => !isItemLabor(item)).map((item, index) => (
                                            <div key={`part-${index}`} className="flex items-center justify-between p-2 rounded-md bg-secondary/30 text-sm">
                                                <span className="flex-1">{item.quantity} x {item.description}</span>
                                                <Button size="sm" variant="ghost" onClick={() => handleAddSuggestedItem(item)}>Add</Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                 <div>
                                    <h4 className="font-semibold mb-2">Suggested Labour</h4>
                                    <div className="space-y-2">
                                         {aiSuggestions.lineItems.filter(item => isItemLabor(item)).map((item, index) => (
                                            <div key={`labour-${index}`} className="flex items-center justify-between p-2 rounded-md bg-secondary/30 text-sm">
                                                <span className="flex-1">{item.quantity} hrs - {item.description}</span>
                                                <Button size="sm" variant="ghost" onClick={() => handleAddSuggestedItem(item)}>Add</Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </form>
        </FormProvider>
    </div>
  );
}
