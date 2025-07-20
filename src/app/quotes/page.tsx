// src/app/quotes/page.tsx
'use client';

import * as React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, PlusCircle, FileText, Trash2, Plus, Pencil } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { addQuote } from '@/lib/quotes';
import { getProjects } from '@/lib/projects';
import { getCustomers, getCustomerSites, getCustomerContacts, addCustomer as addDbCustomer, addContact as addDbContact, addSite as addDbSite } from '@/lib/customers';
import { getEmployees } from '@/lib/employees';
import type { Quote, Project, OptionType, Contact, Employee, AssignedStaff, ProjectContact, Customer, Site } from '@/lib/types';
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { SearchableCombobox } from '@/components/ui/SearchableCombobox';
import { onSnapshot, collection, query, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { addDays } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { jobStaffRoles } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AddressAutocompleteInput } from '@/components/ui/address-autocomplete-input';
import { initialQuotingProfiles } from '@/lib/quoting-profiles';


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
    customerId: z.string().optional(),
    siteId: z.string().optional(),
}).refine(data => {
    if (!data.projectId) {
        return !!data.customerId;
    }
    return true;
}, {
    message: "Customer is required when no project is selected.",
    path: ["customerId"],
});


type CreateQuoteValues = z.infer<typeof createQuoteSchema>;

const customerSchema = z.object({
    name: z.string().min(2, { message: "Customer name must be at least 2 characters." }),
    address: z.string().min(10, { message: "Address must be at least 10 characters." }),
    primaryContactName: z.string().min(2, { message: "Primary contact name must be at least 2 characters." }),
    email: z.string().email({ message: "Please enter a valid email address." }),
    phone: z.string().min(8, { message: "Phone number seems too short." }),
    type: z.string().min(2, { message: "Please select a customer type." }),
});

const newContactSchema = z.object({
  name: z.string().min(2, "Contact name must be at least 2 characters."),
  emails: z.array(z.object({ value: z.string().email("Please enter a valid email address.") })).min(1, "At least one email is required."),
  phones: z.array(z.object({ value: z.string().min(8, "Phone number seems too short.") })).min(1, "At least one phone number is required."),
  jobTitle: z.string().optional(),
});

const newSiteSchema = z.object({
  name: z.string().min(2, "Site name must be at least 2 characters."),
  address: z.string().min(10, "Address must be at least 10 characters."),
  primaryContactId: z.string().min(1, "You must select a primary contact."),
});

function AddCustomerDialog({ onCustomerAdded, children }: { onCustomerAdded: (customer: Customer) => void, children: React.ReactNode }) {
    const [isOpen, setIsOpen] = React.useState(false);
    const [loading, setLoading] = React.useState(false);
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
            
            const { customerId, contactId } = await addDbCustomer(newCustomerData, initialContact, initialSite);
            const newCustomer = { id: customerId, ...newCustomerData, primaryContactId: contactId };
            
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
                            <FormItem><FormLabel>Phone</FormLabel><FormControl><Input placeholder="e.g., 02 9999 8888" {...field} /></FormControl><FormMessage /></FormItem>
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

function AddContactDialog({ customerId, customerName, onContactAdded, children }: { customerId: string, customerName: string, onContactAdded: (contact: Contact) => void, children: React.ReactNode }) {
    const [isOpen, setIsOpen] = React.useState(false);
    const [loading, setLoading] = React.useState(false);
    const { toast } = useToast();
    const form = useForm<z.infer<typeof newContactSchema>>({
        resolver: zodResolver(newContactSchema),
        defaultValues: { name: "", emails: [{ value: "" }], phones: [{ value: "" }], jobTitle: "" },
    });
    
    const { fields: emailFields, append: appendEmail, remove: removeEmail } = useFieldArray({ control: form.control, name: "emails" });
    const { fields: phoneFields, append: appendPhone, remove: removePhone } = useFieldArray({ control: form.control, name: "phones" });

    async function onSubmit(values: z.infer<typeof newContactSchema>) {
        setLoading(true);
        try {
            const contactData = {
              name: values.name,
              emails: values.emails.map(e => e.value),
              phones: values.phones.map(p => p.value),
              jobTitle: values.jobTitle,
            };
            const newContactId = await addDbContact(customerId, contactData);
            onContactAdded({ id: newContactId, ...contactData });
            toast({ title: "Contact Added", description: `"${values.name}" has been added to ${customerName}.` });
            setIsOpen(false);
            form.reset({ name: "", emails: [{ value: "" }], phones: [{ value: "" }], jobTitle: "" });
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
                        <FormField control={form.control} name="name" render={({ field }) => ( <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="e.g., Jane Doe" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                        <FormField control={form.control} name="jobTitle" render={({ field }) => ( <FormItem><FormLabel>Job Title (Optional)</FormLabel><FormControl><Input placeholder="e.g., Project Manager" {...field} /></FormControl><FormMessage /></FormItem> )}/>

                        <div>
                            <FormLabel>Email Addresses</FormLabel>
                            {emailFields.map((field, index) => (
                              <FormField key={field.id} control={form.control} name={`emails.${index}.value`} render={({ field }) => (
                                <FormItem className="flex items-center gap-2 mt-1">
                                  <FormControl><Input placeholder="jane.doe@example.com" {...field} /></FormControl>
                                  <Button type="button" variant="ghost" size="icon" disabled={emailFields.length <= 1} onClick={() => removeEmail(index)}>
                                    <Trash2 className="h-5 w-5 text-destructive"/>
                                  </Button>
                                </FormItem>
                              )}/>
                            ))}
                            <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => appendEmail({ value: "" })}>
                                <PlusCircle className="mr-2 h-4 w-4"/>Add Email
                            </Button>
                        </div>

                        <div>
                            <FormLabel>Phone Numbers</FormLabel>
                            {phoneFields.map((field, index) => (
                              <FormField key={field.id} control={form.control} name={`phones.${index}.value`} render={({ field }) => (
                                <FormItem className="flex items-center gap-2 mt-1">
                                  <FormControl><Input placeholder="0412 345 678" {...field} /></FormControl>
                                  <Button type="button" variant="ghost" size="icon" disabled={phoneFields.length <= 1} onClick={() => removePhone(index)}>
                                    <Trash2 className="h-5 w-5 text-destructive"/>
                                  </Button>
                                </FormItem>
                              )}/>
                            ))}
                            <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => appendPhone({ value: "" })}>
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
            const newSiteId = await addDbSite(customerId, values);
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

    const contactOptions = contacts.map(c => ({ value: c.id, label: c.name }));

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

function CreateQuoteDialog({ children, initialProjectId }: { children: React.ReactNode, initialProjectId?: string }) {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [projects, setProjects] = useState<Project[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [sites, setSites] = useState<Site[]>([]);
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);

    const router = useRouter();
    const { toast } = useToast();

    const form = useForm<CreateQuoteValues>({
        resolver: zodResolver(createQuoteSchema),
        defaultValues: { 
            projectId: initialProjectId || "",
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


    // Fetch initial data (customers, all projects, employees)
    useEffect(() => {
        if (!isOpen) return;

        async function fetchInitialData() {
            setLoading(true);
            try {
                const [projectsData, employeesData, customersData] = await Promise.all([
                    getProjects(),
                    getEmployees(),
                    getCustomers()
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
    }, [isOpen, toast]);

    // When a project is selected, find its details and auto-fill customer and site.
    useEffect(() => {
        if (watchedProjectId) {
            const project = projects.find(p => p.id === watchedProjectId);
            if (project) {
                form.setValue('customerId', project.customerId, { shouldValidate: true });
                form.setValue('siteId', project.siteId, { shouldValidate: true });
            }
        }
    }, [watchedProjectId, projects, form]);
    
    // When a customer is selected (manually or via a project), fetch their sites and contacts.
    useEffect(() => {
        async function fetchCustomerSubData() {
            if (watchedCustomerId) {
                setLoading(true);
                try {
                    const [contactsData, sitesData] = await Promise.all([
                        getCustomerContacts(watchedCustomerId),
                        getCustomerSites(watchedCustomerId)
                    ]);
                    setContacts(contactsData);
                    setSites(sitesData);
                    
                    const customer = customers.find(c => c.id === watchedCustomerId);
                    
                    if (customer?.primaryContactId) {
                        const primaryContactExists = contactsData.some(c => c.id === customer.primaryContactId);
                        if(primaryContactExists) {
                           replaceContacts([{ contactId: customer.primaryContactId, role: 'Primary' }]);
                        }
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
    

    const customerOptions = useMemo(() => customers.map(c => ({ value: c.id, label: c.name })), [customers]);
    
    const projectOptions = useMemo(() => {
        const filteredProjects = watchedCustomerId ? projects.filter(p => p.customerId === watchedCustomerId) : projects;
        return filteredProjects.map(p => ({ value: p.id, label: `${p.name} (${p.customerName})`}));
    }, [projects, watchedCustomerId]);
    
    const siteOptions = useMemo(() => sites.map(s => ({ value: s.id, label: s.name })), [sites]);
    const contactOptions = useMemo(() => contacts.map(c => ({ value: c.id, label: c.name })), [contacts]);
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
                quoteNumber: `Q-${Date.now().toString().slice(-6)}`,
                name: values.name,
                description: values.description || "",
                quoteDate: new Date(),
                dueDate: addDays(new Date(), 14),
                expiryDate: addDays(new Date(), 30),
                status: 'Draft' as const,
                lineItems: [{ id: 'item-0', type: 'Part' as const, description: "", quantity: 1, unitPrice: 0, taxRate: 10 }],
                subtotal: 0, totalDiscount: 0, totalTax: 0, totalAmount: 0,
                version: 1,
                prompt: values.prompt,
                assignedStaff: values.assignedStaff,
                projectContacts: values.projectContacts,
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
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Create New Quote</DialogTitle>
                    <DialogDescription>Fill out the details below to generate a new quote. You can add specific line items on the next screen.</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <Tabs defaultValue="core">
                            <TabsList className="grid w-full grid-cols-3 max-w-lg">
                                <TabsTrigger value="core">Core Details</TabsTrigger>
                                <TabsTrigger value="assignment">Assignment</TabsTrigger>
                                <TabsTrigger value="ai">AI Generation</TabsTrigger>
                            </TabsList>
                            <TabsContent value="core" className="pt-4 space-y-4">
                               <FormField
                                    control={form.control}
                                    name="quotingProfileId"
                                    render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Quoting Profile</FormLabel>
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
                                            <FormLabel>Customer</FormLabel>
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
                                            <FormLabel>Site</FormLabel>
                                             <div className="flex gap-2">
                                                <Select onValueChange={field.onChange} value={field.value} disabled={!watchedCustomerId || sites.length === 0 || !!watchedProjectId}>
                                                    <FormControl><SelectTrigger><SelectValue placeholder="Select a site" /></SelectTrigger></FormControl>
                                                    <SelectContent>{siteOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
                                                </Select>
                                                <AddSiteDialog
                                                    customerId={watchedCustomerId!}
                                                    customerName={selectedCustomer?.name || ''}
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
                                        <FormItem><FormLabel>Quote Name</FormLabel><FormControl><Input placeholder="e.g., Kitchen Lighting Upgrade" {...field} /></FormControl><FormMessage /></FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="description"
                                    render={({ field }) => (
                                        <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea placeholder="A brief summary of the work to be quoted." {...field} /></FormControl><FormMessage /></FormItem>
                                    )}
                                />
                            </TabsContent>
                            <TabsContent value="assignment" className="pt-4 space-y-4">
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <FormLabel>Customer Contacts</FormLabel>
                                         <AddContactDialog 
                                            customerId={watchedCustomerId!} 
                                            customerName={selectedCustomer?.name || ''} 
                                            onContactAdded={handleContactAdded}
                                        >
                                            <Button type="button" variant="outline" size="sm" disabled={!watchedCustomerId}>
                                                <Plus className="mr-1 h-4 w-4" /> New
                                            </Button>
                                        </AddContactDialog>
                                    </div>
                                    {contactFields.map((field, index) => (
                                        <div key={field.id} className="flex items-start gap-2 p-2 border rounded-md bg-secondary/30">
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
                                 <div className="space-y-2">
                                    <FormLabel>Assigned Staff</FormLabel>
                                    {staffFields.map((field, index) => (
                                        <div key={field.id} className="flex items-start gap-2 p-2 border rounded-md bg-secondary/30">
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
                            <TabsContent value="ai" className="pt-4 space-y-4">
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
  

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Quotes</h2>
        <CreateQuoteDialog>
          <Button><PlusCircle className="mr-2 h-4 w-4" />Create New Quote</Button>
        </CreateQuoteDialog>
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
                           For: <span className="font-medium text-foreground">{quote.projectName || 'Internal Quote'}</span>
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
