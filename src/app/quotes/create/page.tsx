// src/app/quotes/create/page.tsx
'use client';

import * as React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Loader2, PlusCircle, Plus, Trash2, ArrowLeft } from 'lucide-react';
import { addQuote } from '@/lib/quotes';
import { getProjects, getProject } from '@/lib/projects';
import { getCustomers, getCustomerSites, getCustomerContacts, addCustomer as addDbCustomer, addContact as addDbContact, addSite as addDbSite } from '@/lib/customers';
import { getEmployees } from '@/lib/employees';
import type { Quote, Project, Contact, Employee, Site } from '@/lib/types';

// Use Contact type for customers (has displayName property)
type Customer = Contact;
import { SearchableCombobox } from '@/components/ui/SearchableCombobox';
import { addDays } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { jobStaffRoles } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AddressAutocompleteInput } from '@/components/ui/address-autocomplete-input';
import { initialQuotingProfiles } from '@/lib/quoting-profiles';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useBreadcrumb } from '@/context/breadcrumb-context';
import { 
  Breadcrumb, 
  BreadcrumbList, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbPage, 
  BreadcrumbSeparator 
} from '@/components/ui/breadcrumb';
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

const assignedStaffSchema = z.object({
  employeeId: z.string().min(1, "Please select a staff member."),
  role: z.string().min(2, "Role is required."),
});

const projectContactSchema = z.object({
  contactId: z.string().min(1, "Please select a contact."),
  role: z.string().min(2, "Role is required."),
});

const createQuoteSchema = z.object({
    projectId: z.string().optional(),
    name: z.string().min(3, "Quote name must be at least 3 characters."),
    description: z.string().optional(),
    quotingProfileId: z.string({ required_error: "Please select a quoting profile."}),
    prompt: z.string().optional(),
    assignedStaff: z.array(assignedStaffSchema).optional(),
    projectContacts: z.array(projectContactSchema).optional(),
    customerId: z.string().min(1, "Customer is required."),
    siteId: z.string().optional(), // Site is now optional
});

type CreateQuoteValues = z.infer<typeof createQuoteSchema>;

const customerSchema = z.object({
    displayName: z.string().min(2, { message: "Customer name must be at least 2 characters." }),
    emails: z.array(z.object({type: z.literal('PRIMARY'), address: z.string().email("Please enter a valid email address.") })).min(1, "Email is required."),
    phones: z.array(z.object({type: z.literal('MOBILE'), number: z.string().min(8, "Phone number must be at least 8 characters.") })).min(1, "Phone number is required."),
});

const newContactSchema = z.object({
  displayName: z.string().min(2, "Contact name must be at least 2 characters."),
  emails: z.array(z.object({ type: z.literal('PRIMARY'), address: z.string().email("Please enter a valid email address.") })).min(1, "At least one email is required."),
  phones: z.array(z.object({ type: z.literal('MOBILE'), number: z.string().min(8, "Phone number seems too short.") })).min(1, "At least one phone number is required."),
  jobTitle: z.string().optional(),
});

const newSiteSchema = z.object({
  name: z.string().min(2, "Site name must be at least 2 characters."),
  address: z.string().min(10, "Address must be at least 10 characters."),
  primaryContactId: z.string().min(1, "You must select a primary contact."),
});

// TODO: Replace with dynamic org ID from user session
const ORG_ID = 'test-org';

function AddCustomerDialog({ onCustomerAdded, children }: { onCustomerAdded: (customer: Customer) => void, children: React.ReactNode }) {
    const [isOpen, setIsOpen] = React.useState(false);
    const [loading, setLoading] = React.useState(false);
    const { toast } = useToast();
    const form = useForm<z.infer<typeof customerSchema>>({
        resolver: zodResolver(customerSchema),
        defaultValues: { displayName: "", emails: [{type: 'PRIMARY', address: ''}], phones: [{type: 'MOBILE', number: ''}] },
    });
    
    async function onSubmit(values: z.infer<typeof customerSchema>) {
        setLoading(true);
        try {
            // Add empty address for compatibility with the database schema
            const customerData = {
                ...values,
                addresses: [{ type: 'PHYSICAL' as const, line1: '', city: '', region: '', postalCode: '', country: 'AU' }],
                type: 'CUSTOMER' as const
            };
            
            const { customerId } = await addDbCustomer(ORG_ID, customerData as any);
            const newCustomer = { id: customerId, ...customerData };
            
            onCustomerAdded(newCustomer);
            toast({ title: "Customer Added", description: `"${values.displayName}" has been added.` });
            setIsOpen(false);
            form.reset();
        } catch (error) {
            console.error("Failed to add customer", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to add customer.' });
        } finally {
            setLoading(false);
        }
    }

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
                        <FormField 
                            control={form.control} 
                            name="displayName" 
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Customer Name <span className="text-red-500">*</span></FormLabel>
                                    <FormControl>
                                        <Input 
                                            placeholder="e.g., Acme Corporation"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField 
                            control={form.control} 
                            name="emails.0.address" 
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email <span className="text-red-500">*</span></FormLabel>
                                    <FormControl>
                                        <Input 
                                            type="email"
                                            placeholder="e.g., contact@company.com" 
                                            {...field} 
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField 
                            control={form.control} 
                            name="phones.0.number" 
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Phone <span className="text-red-500">*</span></FormLabel>
                                    <FormControl>
                                        <Input 
                                            type="tel"
                                            placeholder="e.g., 02 9999 8888" 
                                            {...field} 
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
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

function AddContactDialog({ customerId, customerName, onContactAdded, children }: { customerId: string, customerName: string, onContactAdded: (contact: Contact) => void, children: React.ReactNode }) {
    const [isOpen, setIsOpen] = React.useState(false);
    const [loading, setLoading] = React.useState(false);
    const { toast } = useToast();
    const form = useForm<z.infer<typeof newContactSchema>>({
        resolver: zodResolver(newContactSchema),
        defaultValues: { displayName: "", emails: [{ type: 'PRIMARY', address: "" }], phones: [{ type: 'MOBILE', number: "" }], jobTitle: "" },
    });
    
    const { fields: emailFields, append: appendEmail, remove: removeEmail } = useFieldArray({ control: form.control, name: "emails" });
    const { fields: phoneFields, append: appendPhone, remove: removePhone } = useFieldArray({ control: form.control, name: "phones" });

    async function onSubmit(values: z.infer<typeof newContactSchema>) {
        setLoading(true);
        try {
            const contactData = {
              displayName: values.displayName,
              emails: values.emails,
              phones: values.phones,
            };
            const newContactId = await addDbContact(ORG_ID, customerId, contactData);
            onContactAdded({ id: newContactId, type: 'CUSTOMER', ...contactData });
            toast({ title: "Contact Added", description: `"${values.displayName}" has been added to ${customerName}.` });
            setIsOpen(false);
            form.reset({ displayName: "", emails: [{ type: 'PRIMARY', address: "" }], phones: [{ type: 'MOBILE', number: "" }], jobTitle: "" });
        } catch (error) {
            console.error("Failed to add contact", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to add contact.' });
        } finally {
            setLoading(false);
        }
    }
    
    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent>
                 <DialogHeader><DialogTitle>Add New Contact</DialogTitle><DialogDescription>Add a new contact person for {customerName}.</DialogDescription></DialogHeader>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField control={form.control} name="displayName" render={({ field }) => ( <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="e.g., Jane Doe" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                        <FormField control={form.control} name="jobTitle" render={({ field }) => ( <FormItem><FormLabel>Job Title (Optional)</FormLabel><FormControl><Input placeholder="e.g., Project Manager" {...field} /></FormControl><FormMessage /></FormItem> )}/>

                        <div>
                            <FormLabel>Email Addresses</FormLabel>
                            {emailFields.map((field, index) => (
                              <FormField key={field.id} control={form.control} name={`emails.${index}.address`} render={({ field }) => (
                                <FormItem className="flex items-center gap-2 mt-1">
                                  <FormControl><Input placeholder="jane.doe@example.com" {...field} /></FormControl>
                                  <Button type="button" variant="ghost" size="icon" disabled={emailFields.length <= 1} onClick={() => removeEmail(index)}>
                                    <Trash2 className="h-5 w-5 text-destructive"/>
                                  </Button>
                                </FormItem>
                              )}/>
                            ))}
                            <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => appendEmail({ type: 'PRIMARY', address: "" })}>
                                <PlusCircle className="mr-2 h-4 w-4"/>Add Email
                            </Button>
                        </div>

                        <div>
                            <FormLabel>Phone Numbers</FormLabel>
                            {phoneFields.map((field, index) => (
                              <FormField key={field.id} control={form.control} name={`phones.${index}.number`} render={({ field }) => (
                                <FormItem className="flex items-center gap-2 mt-1">
                                  <FormControl><Input placeholder="0412 345 678" {...field} /></FormControl>
                                  <Button type="button" variant="ghost" size="icon" disabled={phoneFields.length <= 1} onClick={() => removePhone(index)}>
                                    <Trash2 className="h-5 w-5 text-destructive"/>
                                  </Button>
                                </FormItem>
                              )}/>
                            ))}
                            <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => appendPhone({ type: 'MOBILE', number: "" })}>
                                <PlusCircle className="mr-2 h-4 w-4"/>Add Phone
                            </Button>
                        </div>
                        
                        <DialogFooter><DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose><Button type="submit" disabled={loading}>{loading ? <Loader2 className="animate-spin" /> : 'Add Contact'}</Button></DialogFooter>
                      </form>
                    </Form>
            </DialogContent>
        </Dialog>
    )
}

function AddSiteDialog({ customerId, customerName, contacts, onSiteAdded, children }: { customerId: string, customerName: string, contacts: Contact[], onSiteAdded: (site: Site) => void, children: React.ReactNode }) {
    const [isOpen, setIsOpen] = React.useState(false);
    const [loading, setLoading] = React.useState(false);
    const { toast } = useToast();
    const form = useForm<z.infer<typeof newSiteSchema>>({
        resolver: zodResolver(newSiteSchema),
        defaultValues: { name: "", address: "", primaryContactId: "" },
    });

    React.useEffect(() => {
        if (!isOpen) form.reset();
    }, [isOpen, form]);

    async function onSubmit(values: z.infer<typeof newSiteSchema>) {
        setLoading(true);
        try {
            const newSiteId = await addDbSite(ORG_ID, { ...values, customerId });
            onSiteAdded({ id: newSiteId, ...values });
            toast({ title: "Site Added", description: `"${values.name}" has been added to ${customerName}.` });
            setIsOpen(false);
        } catch (error) {
            console.error("Failed to add site", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to add site.' });
        } finally {
            setLoading(false);
        }
    }

    const contactOptions = contacts.map(c => ({ value: c.id, label: c.displayName }));

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add New Site for {customerName}</DialogTitle>
                    <DialogDescription>Create a new site or location for this customer.</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Site Name</FormLabel><FormControl><Input placeholder="e.g., Melbourne Office" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="address" render={({ field }) => (<FormItem><FormLabel>Site Address</FormLabel><FormControl><Input placeholder="e.g., 55 Collins St, Melbourne" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="primaryContactId" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>Primary Contact</FormLabel><SearchableCombobox options={contactOptions} {...field} placeholder="Select a contact" /><FormMessage /></FormItem>)} />
                        <DialogFooter>
                            <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
                            <Button type="submit" disabled={loading}>{loading ? <Loader2 className="animate-spin" /> : 'Add Site'}</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

export default function CreateQuotePage() {
    const [loading, setLoading] = useState(false);
    const [projects, setProjects] = useState<Project[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [sites, setSites] = useState<Site[]>([]);
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);

    const router = useRouter();
    const { toast } = useToast();
    const { setDynamicTitle } = useBreadcrumb();

    // Set breadcrumb title
    useEffect(() => {
        setDynamicTitle('Create Quote');
        return () => setDynamicTitle(null);
    }, [setDynamicTitle]);

    const form = useForm<CreateQuoteValues>({
        resolver: zodResolver(createQuoteSchema),
        defaultValues: { 
            projectId: "",
            name: "",
            description: "",
            quotingProfileId: initialQuotingProfiles[0]?.id || "",
            prompt: "",
            assignedStaff: [],
            projectContacts: [],
            customerId: "",
            siteId: "",
        },
    });

    const { fields: staffFields, append: appendStaff, remove: removeStaff, replace: replaceStaff } = useFieldArray({
        control: form.control,
        name: 'assignedStaff'
    });
    const { fields: contactFields, append: appendContact, remove: removeContact, replace: replaceContacts } = useFieldArray({
        control: form.control,
        name: 'projectContacts'
    });
    
    const contactRoles = [
        "Primary", 
        "Site Contact", 
        "Accounts", 
        "Tenant", 
        "Project Manager", 
        "Client Representative"
    ];

    const watchedProjectId = form.watch('projectId');
    const watchedCustomerId = form.watch('customerId');
    const selectedCustomer = useMemo(() => customers.find(c => c.id === watchedCustomerId), [customers, watchedCustomerId]);

    // Fetch initial data
    useEffect(() => {
        async function fetchInitialData() {
            setLoading(true);
            try {
                const [projectsData, employeesData, customersData] = await Promise.all([
                    getProjects(ORG_ID),
                    getEmployees(ORG_ID),
                    getCustomers(ORG_ID)
                ]);
                setProjects(projectsData);
                setEmployees(employeesData);
                setCustomers(customersData);
                
                const defaultUser = employeesData.find(e => e.id === 'EMP010'); // Simulating Jane Doe as logged-in user
                if (defaultUser && form.getValues('assignedStaff')?.length === 0) {
                  replaceStaff([{ employeeId: defaultUser.id, role: 'Project Manager' }]);
                }

            } catch (error) {
                toast({ variant: "destructive", title: "Error", description: "Could not load initial data." });
            } finally {
                setLoading(false);
            }
        }
        fetchInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [toast]);

    // When a project is selected, find its details and auto-fill customer and site.
    useEffect(() => {
        async function fetchProjectDetails() {
            if (watchedProjectId) {
                const project = await getProject(ORG_ID, watchedProjectId);
                if (project) {
                    form.setValue('customerId', project.customerId, { shouldValidate: true });
                    form.setValue('siteId', project.siteId, { shouldValidate: true });
                    if (!form.getValues('name')) {
                        form.setValue('name', `${project.name} - Quote`);
                    }
                }
            }
        }
        fetchProjectDetails();
    }, [watchedProjectId, form]);
    
    // When a customer is selected, fetch their sites and contacts
    useEffect(() => {
        async function fetchCustomerSubData() {
            if (watchedCustomerId) {
                setLoading(true);
                try {
                    const [contactsData, sitesData] = await Promise.all([
                        getCustomerContacts(ORG_ID, watchedCustomerId),
                        getCustomerSites(ORG_ID, watchedCustomerId)
                    ]);
                    setContacts(contactsData);
                    setSites(sitesData);
                    
                    const primaryContact = contactsData.find(c => c.isPrimary);
                    if (primaryContact) {
                       replaceContacts([{ contactId: primaryContact.id, role: 'Primary' }]);
                    } else if (contactsData.length > 0) {
                        replaceContacts([{ contactId: contactsData[0].id, role: 'Primary' }]);
                    } else {
                        replaceContacts([]);
                    }

                } catch (error) {
                     toast({ variant: 'destructive', title: "Error", description: "Could not load data for the selected customer." });
                } finally {
                    setLoading(false);
                }
            } else {
                setContacts([]);
                setSites([]);
            }
        }
        fetchCustomerSubData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [watchedCustomerId, toast, customers]);

    const customerOptions = useMemo(() => customers.map(c => ({ value: c.id, label: c.displayName })), [customers]);
    
    const projectOptions = useMemo(() => {
        const filteredProjects = watchedCustomerId ? projects.filter(p => p.customerId === watchedCustomerId) : projects;
        return filteredProjects.map(p => ({ value: p.id, label: `${p.name} (${p.customerName})`}));
    }, [projects, watchedCustomerId]);
    
    const siteOptions = useMemo(() => sites.map(s => ({ value: s.id, label: s.name })), [sites]);
    const contactOptions = useMemo(() => contacts.map(c => ({ value: c.id, label: c.displayName })), [contacts]);
    const employeeOptions = useMemo(() => employees.map(e => ({ value: e.id, label: e.name })), [employees]);

    const handleCustomerAdded = (newCustomer: Customer) => {
      setCustomers(prev => [...prev, newCustomer]);
      form.setValue('customerId', newCustomer.id, { shouldValidate: true });
    }
    
    const handleContactAdded = (newContact: Contact) => {
      setContacts(prev => [...prev, newContact]);
      const emptyIndex = form.getValues('projectContacts')?.findIndex(pc => !pc.contactId);
      if (emptyIndex !== undefined && emptyIndex > -1) {
          form.setValue(`projectContacts.${emptyIndex}.contactId`, newContact.id);
      } else {
          appendContact({ contactId: newContact.id, role: 'Primary' });
      }
    }

    const handleSiteAdded = (newSite: Site) => {
      setSites(prev => [...prev, newSite]);
      form.setValue('siteId', newSite.id, { shouldValidate: true });
    }

    async function onSubmit(values: CreateQuoteValues) {
        setLoading(true);
        
        try {
             const newQuoteData: Omit<Quote, 'id' | 'createdAt' | 'updatedAt' | 'quoteNumber'> = {
                projectId: values.projectId,
                projectName: projects.find(p => p.id === values.projectId)?.name || null,
                customerId: values.customerId,
                siteId: values.siteId,
                quotingProfileId: values.quotingProfileId,
                name: values.name,
                description: values.description || "",
                quoteDate: new Date(),
                dueDate: addDays(new Date(), 14),
                expiryDate: addDays(new Date(), 30),
                status: 'Draft' as const,
                lineItems: [],
                subtotal: 0, totalDiscount: 0, totalTax: 0, totalAmount: 0,
                version: 1,
                revisions: [],
                prompt: values.prompt,
                assignedStaff: values.assignedStaff,
                projectContacts: values.projectContacts,
            };
            const newQuoteId = await addQuote(ORG_ID, newQuoteData);
            toast({ title: "Quote Created", description: "Redirecting to the new quote..." });
            router.push(`/quotes/${newQuoteId}`);
        } catch (error) {
            console.error("Failed to create quote", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to create quote.' });
            setLoading(false);
        }
    }

    return (
        <div className="flex-1 space-y-4">
            {/* Breadcrumb Navigation */}
            <Breadcrumb className="mb-4">
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink asChild>
                            <Link href="/">Dashboard</Link>
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbLink asChild>
                            <Link href="/quotes">Quotes</Link>
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbPage>Create Quote</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>

            {/* Header */}
            <div className="flex items-center justify-between space-y-2">
                <div className="flex items-center gap-4">
                    <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => router.back()}
                        className="shrink-0"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Create New Quote</h2>
                        <p className="text-muted-foreground">
                            Fill out the details below to generate a new quote. You can add specific line items on the next screen.
                        </p>
                    </div>
                </div>
            </div>

            {/* Form */}
            <Card className="max-w-4xl">
                <CardContent className="p-6">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <Tabs defaultValue="core" className="w-full">
                                <TabsList className="grid w-full grid-cols-3 max-w-lg">
                                    <TabsTrigger value="core">Core Details</TabsTrigger>
                                    <TabsTrigger value="assignment">Assignment</TabsTrigger>
                                    <TabsTrigger value="ai">AI Generation</TabsTrigger>
                                </TabsList>
                                
                                <TabsContent value="core" className="pt-6 space-y-6">
                                   <FormField
                                        control={form.control}
                                        name="quotingProfileId"
                                        render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Quoting Profile <span className="text-red-500">*</span></FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl><SelectTrigger><SelectValue placeholder="Select a profile..." /></SelectTrigger></FormControl>
                                                <SelectContent>
                                                    {initialQuotingProfiles.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                            <FormDescription>This profile determines the AI persona, rules, and default rates.</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                        )}
                                    />
                                   <FormField
                                        control={form.control}
                                        name="customerId"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Customer <span className="text-red-500">*</span></FormLabel>
                                                <div className="flex gap-2">
                                                    <SearchableCombobox
                                                        options={customerOptions}
                                                        value={field.value || ''}
                                                        onChange={(value) => {
                                                            field.onChange(value);
                                                            form.setValue('projectId', ''); 
                                                            form.setValue('siteId', '');
                                                        }}
                                                        placeholder="Select a customer..."
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
                                        name="siteId"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Site <span className="text-muted-foreground text-sm">(Optional)</span></FormLabel>
                                                 <div className="flex gap-2">
                                                    <Select onValueChange={field.onChange} value={field.value} disabled={!watchedCustomerId || sites.length === 0 || !!watchedProjectId}>
                                                        <FormControl><SelectTrigger><SelectValue placeholder="Select a site" /></SelectTrigger></FormControl>
                                                        <SelectContent>{siteOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
                                                    </Select>
                                                    <AddSiteDialog
                                                        customerId={watchedCustomerId!}
                                                        customerName={selectedCustomer?.displayName || ''}
                                                        contacts={contacts}
                                                        onSiteAdded={handleSiteAdded}
                                                    >
                                                        <Button type="button" variant="outline" size="icon" className="shrink-0" disabled={!watchedCustomerId}>
                                                            <Plus className="h-4 w-4" />
                                                        </Button>
                                                    </AddSiteDialog>
                                                </div>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                     <FormField
                                        control={form.control}
                                        name="projectId"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Project or Job (Optional)</FormLabel>
                                                <SearchableCombobox
                                                    options={projectOptions}
                                                    value={field.value || ''}
                                                    onChange={field.onChange}
                                                    placeholder="Select a project or job..."
                                                    disabled={!watchedCustomerId}
                                                />
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem><FormLabel>Quote Name <span className="text-red-500">*</span></FormLabel><FormControl><Input placeholder="e.g., Kitchen Lighting Upgrade" {...field} /></FormControl><FormMessage /></FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="description"
                                        render={({ field }) => (
                                            <FormItem><FormLabel>Description <span className="text-muted-foreground text-sm">(Optional)</span></FormLabel><FormControl><Textarea placeholder="A brief summary of the work to be quoted." {...field} /></FormControl><FormMessage /></FormItem>
                                        )}
                                    />
                                </TabsContent>
                                
                                <TabsContent value="assignment" className="pt-6 space-y-6">
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <FormLabel>Customer Contacts</FormLabel>
                                             <AddContactDialog 
                                                customerId={watchedCustomerId!} 
                                                customerName={selectedCustomer?.displayName || ''} 
                                                onContactAdded={handleContactAdded}
                                            >
                                                <Button type="button" variant="outline" size="sm" disabled={!watchedCustomerId}>
                                                    <Plus className="mr-1 h-4 w-4" /> New
                                                </Button>
                                            </AddContactDialog>
                                        </div>
                                        {contactFields.map((field, index) => (
                                            <div key={field.id} className="flex items-start gap-2 p-4 border rounded-md bg-secondary/30">
                                                <div className="grid grid-cols-2 gap-2 flex-1">
                                                    <FormField control={form.control} name={`projectContacts.${index}.contactId`} render={({ field }) => (<FormItem><SearchableCombobox options={contactOptions} {...field} placeholder="Select contact..." disabled={!watchedCustomerId} /></FormItem>)} />
                                                    <FormField
                                                        control={form.control}
                                                        name={`projectContacts.${index}.role`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <Select onValueChange={field.onChange} value={field.value}>
                                                                    <FormControl>
                                                                        <SelectTrigger>
                                                                            <SelectValue placeholder="Select a role" />
                                                                        </SelectTrigger>
                                                                    </FormControl>
                                                                    <SelectContent>
                                                                        {contactRoles.map(role => <SelectItem key={role} value={role}>{role}</SelectItem>)}
                                                                    </SelectContent>
                                                                </Select>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>
                                                <Button type="button" variant="ghost" size="icon" onClick={() => removeContact(index)} disabled={contactFields.length <= 1}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                            </div>
                                        ))}
                                        <Button type="button" variant="secondary" size="sm" onClick={() => appendContact({ contactId: '', role: '' })} disabled={!watchedCustomerId}>
                                            <PlusCircle className="mr-2 h-4 w-4" />
                                            Add Another Contact
                                        </Button>
                                    </div>
                                     <div className="space-y-4">
                                        <FormLabel>Assigned Staff</FormLabel>
                                        {staffFields.map((field, index) => (
                                            <div key={field.id} className="flex items-start gap-2 p-4 border rounded-md bg-secondary/30">
                                                <div className="grid grid-cols-2 gap-2 flex-1">
                                                    <FormField control={form.control} name={`assignedStaff.${index}.employeeId`} render={({ field }) => (<FormItem><SearchableCombobox options={employeeOptions} {...field} placeholder="Select staff..." /></FormItem>)} />
                                                    <FormField
                                                        control={form.control}
                                                        name={`assignedStaff.${index}.role`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <Select onValueChange={field.onChange} value={field.value}>
                                                                    <FormControl><SelectTrigger><SelectValue placeholder="Select role..." /></SelectTrigger></FormControl>
                                                                    <SelectContent>{jobStaffRoles.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                                                                </Select>
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>
                                                <Button type="button" variant="ghost" size="icon" onClick={() => removeStaff(index)} disabled={staffFields.length <= 1}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                            </div>
                                        ))}
                                         <Button type="button" variant="secondary" size="sm" onClick={() => appendStaff({ employeeId: '', role: '' })}>
                                            <PlusCircle className="mr-2 h-4 w-4" />
                                            Add Staff Member
                                        </Button>
                                    </div>
                                </TabsContent>
                                
                                <TabsContent value="ai" className="pt-6 space-y-6">
                                     <FormField
                                        control={form.control}
                                        name="prompt"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>AI Quote Generation Prompt</FormLabel>
                                                <FormControl><Textarea placeholder="Describe the job requirements in detail. Include scope, assumptions, exclusions, parts, labor, etc. The more detail, the better the generated quote." {...field} rows={8} /></FormControl>
                                                <FormDescription>Leave blank if you prefer to build the quote manually.</FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </TabsContent>
                            </Tabs>

                            <div className="flex items-center justify-between pt-6 border-t">
                                <Button type="button" variant="outline" onClick={() => router.back()}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={loading}>
                                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                    Create Quote
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}