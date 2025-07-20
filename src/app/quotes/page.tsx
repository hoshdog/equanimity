
// src/app/quotes/page.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, PlusCircle, FileText, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { addQuote } from '@/lib/quotes';
import { getProjects } from '@/lib/projects';
import { getCustomers, getCustomerSites, getCustomerContacts } from '@/lib/customers';
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
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
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

                // Set default assigned staff to logged in user
                const defaultUser = employeesData.find(e => e.id === 'EMP010'); // Simulating Jane Doe as logged-in user
                if (defaultUser) {
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
                    
                    // Set default contact if customer has a primary contact
                    if (selectedCustomer?.primaryContactId) {
                        replaceContacts([{ contactId: selectedCustomer.primaryContactId, role: 'Primary' }]);
                    } else if (contactsData.length > 0) {
                        replaceContacts([{ contactId: contactsData[0].id, role: 'Primary' }]);
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
    }, [watchedCustomerId, toast, selectedCustomer]);
    

    const customerOptions = useMemo(() => customers.map(c => ({ value: c.id, label: c.name })), [customers]);
    const projectOptions = useMemo(() => {
        const filteredProjects = watchedCustomerId ? projects.filter(p => p.customerId === watchedCustomerId) : projects;
        return filteredProjects.map(p => ({ value: p.id, label: `${p.name} (${p.customerName})`}));
    }, [projects, watchedCustomerId]);
    
    const siteOptions = useMemo(() => sites.map(s => ({ value: s.id, label: s.name })), [sites]);
    const contactOptions = useMemo(() => contacts.map(c => ({ value: c.id, label: c.name })), [contacts]);
    const employeeOptions = useMemo(() => employees.map(e => ({ value: e.id, label: e.name })), [employees]);


    async function onSubmit(values: CreateQuoteValues) {
        setLoading(true);
        
        try {
             const newQuoteData: Omit<Quote, 'id' | 'createdAt' | 'updatedAt'> = {
                projectId: values.projectId,
                projectName: projects.find(p => p.id === values.projectId)?.name,
                customerId: values.customerId,
                siteId: values.siteId,
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
                                    name="customerId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Customer</FormLabel>
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
                                            <Select onValueChange={field.onChange} value={field.value} disabled={!watchedCustomerId || sites.length === 0 || !!watchedProjectId}>
                                                <FormControl><SelectTrigger><SelectValue placeholder="Select a site" /></SelectTrigger></FormControl>
                                                <SelectContent>{siteOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
                                            </Select>
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
                                    <FormLabel>Customer Contacts</FormLabel>
                                    {contactFields.map((field, index) => (
                                        <div key={field.id} className="flex items-center gap-2">
                                            <div className="grid grid-cols-2 gap-2 flex-1">
                                                <FormField control={form.control} name={`projectContacts.${index}.contactId`} render={({ field }) => (<FormItem><SearchableCombobox options={contactOptions} {...field} placeholder="Select contact..." disabled={!watchedCustomerId} /></FormItem>)} />
                                                <FormField control={form.control} name={`projectContacts.${index}.role`} render={({ field }) => (<FormItem><Input placeholder="Role, e.g., Site Contact" {...field} /></FormItem>)} />
                                            </div>
                                            <Button type="button" variant="ghost" size="icon" onClick={() => removeContact(index)} disabled={contactFields.length <= 1}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                        </div>
                                    ))}
                                    <Button type="button" variant="outline" size="sm" onClick={() => appendContact({ contactId: '', role: '' })} disabled={!watchedCustomerId}>Add Contact</Button>
                                </div>
                                 <div className="space-y-2">
                                    <FormLabel>Assigned Staff</FormLabel>
                                    {staffFields.map((field, index) => (
                                        <div key={field.id} className="flex items-center gap-2">
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
                                    <Button type="button" variant="outline" size="sm" onClick={() => appendStaff({ employeeId: '', role: '' })}>Add Staff</Button>
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
