// src/app/projects/[id]/page.tsx
'use client'

import { useState, useEffect, useMemo, use } from 'react';
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Briefcase, FileText, ShoppingCart, Users, Receipt, Building2, MapPin, Loader2, MessageSquare, GanttChartSquare, PlusCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getProject, getProjects } from '@/lib/projects';
import { getCustomer, getCustomerContacts } from '@/lib/customers';
import type { Project, Customer, Job, Employee, Quote, PurchaseOrder } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { JobFormDialog } from '@/app/jobs/job-form-dialog';
import { addQuote } from '@/lib/quotes';
import { PurchaseOrderFormDialog } from '@/app/purchase-orders/po-form-dialog';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { onSnapshot, collection, query, orderBy, doc, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getEmployees } from '@/lib/employees';
import { ChatWidget } from './chat-widget';
import TimelinePage from './timeline/page';
import { format, addDays } from 'date-fns';
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogContent,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Form, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { SearchableCombobox } from '@/components/ui/SearchableCombobox';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTimeTracker } from '@/context/time-tracker-context';
import { useBreadcrumb } from '@/context/breadcrumb-context';


const createQuoteSchema = z.object({
    projectId: z.string().optional(),
});
type CreateQuoteValues = z.infer<typeof createQuoteSchema>;


// This component is now defined in quotes/page.tsx and imported here.
// For simplicity of this change, I'll keep a reference here but in a larger refactor
// this would be moved to a shared component file.
function CreateQuoteDialog({ children, initialProjectId }: { children: React.ReactNode, initialProjectId?: string }) {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [projects, setProjects] = useState<Project[]>([]);
    const router = useRouter();
    const { toast } = useToast();

    const form = useForm<CreateQuoteValues>({
        resolver: zodResolver(createQuoteSchema),
        defaultValues: { projectId: initialProjectId || "" },
    });

    useEffect(() => {
        if (!isOpen) return;
        async function fetchProjects() {
            setLoading(true);
            try {
                const projectsData = await getProjects();
                setProjects(projectsData);
                if (initialProjectId) {
                    form.setValue('projectId', initialProjectId);
                }
            } catch (error) {
                toast({ variant: "destructive", title: "Error", description: "Could not load projects." });
            } finally {
                setLoading(false);
            }
        }
        fetchProjects();
    }, [isOpen, toast, initialProjectId, form]);

    const projectOptions = projects.map(p => ({ value: p.id, label: `${p.name} (${p.customerName})`}));

    async function onSubmit(values: CreateQuoteValues) {
        setLoading(true);
        const selectedProject = projects.find(p => p.id === values.projectId);

        try {
             const newQuoteData: Omit<Quote, 'id' | 'createdAt' | 'updatedAt'> = {
                projectId: selectedProject?.id,
                projectName: selectedProject?.name,
                customerId: selectedProject?.customerId,
                quoteNumber: `Q-${Date.now().toString().slice(-6)}`,
                name: selectedProject ? `${selectedProject.name} - Quote` : "New Quote",
                description: selectedProject ? `Quote for ${selectedProject.name}` : "",
                quoteDate: new Date(),
                dueDate: addDays(new Date(), 14),
                expiryDate: addDays(new Date(), 30),
                status: 'Draft' as const,
                lineItems: [{ id: 'item-0', type: 'Part' as const, description: "", quantity: 1, unitPrice: 0, taxRate: 10 }],
                subtotal: 0, totalDiscount: 0, totalTax: 0, totalAmount: 0,
                version: 1,
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
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create New Quote</DialogTitle>
                    <DialogDescription>Select the project or job this quote is for. You can add details on the next screen.</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                                        placeholder="Select a project or job"
                                        disabled={!!initialProjectId}
                                    />
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
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


function PlaceholderContent({ title, icon: Icon }: { title: string, icon: React.ElementType }) {
    return (
        <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg h-64">
            <Icon className="h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-sm text-muted-foreground">{title} will be displayed here.</p>
        </div>
    )
}

const getJobStatusColor = (status: Job['status']) => {
    switch (status) {
      case 'In Progress': return 'text-yellow-600 bg-yellow-100/80 border-yellow-200/80';
      case 'Draft': return 'text-gray-600 bg-gray-100/80 border-gray-200/80';
      case 'Planned': return 'text-blue-600 bg-blue-100/80 border-blue-200/80';
      case 'Completed': return 'text-green-600 bg-green-100/80 border-green-200/80';
      default: return 'text-gray-500 bg-gray-100/80 border-gray-200/80';
    }
}

const getPOStatusColor = (status: string) => {
    switch (status) {
      case 'Received': return 'text-green-600 bg-green-100/80 border-green-200/80';
      case 'Sent': return 'text-blue-600 bg-blue-100/80 border-blue-200/80';
      case 'Partially Received': return 'text-yellow-600 bg-yellow-100/80 border-yellow-200/80';
      case 'Cancelled': return 'text-red-600 bg-red-100/80 border-red-200/80';
      default: return 'text-gray-500 bg-gray-100/80 border-gray-200/80';
    }
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


export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = use(params);
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { setContext } = useTimeTracker();
  const { setDynamicTitle } = useBreadcrumb();


  useEffect(() => {
    if (!projectId) return;

    // Listener for project document
    const unsubProject = onSnapshot(doc(db, 'projects', projectId), async (projectDoc) => {
      if (projectDoc.exists()) {
        const projectData = { id: projectDoc.id, ...projectDoc.data() } as Project;
        setProject(projectData);
        setContext({ type: 'project', id: projectData.id, name: projectData.name });
        setDynamicTitle(projectData.name);

        if (projectData.customerId) {
          const customerData = await getCustomer(projectData.customerId);
          setCustomer(customerData);
        }
      } else {
        toast({ variant: 'destructive', title: 'Error', description: 'Project not found.' });
      }
      setLoading(false);
    }, (error) => {
        console.error("Error fetching project:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not load project details.' });
    });

    // Listeners for related collections
    const jobsQuery = query(collection(db, 'jobs'), where('projectId', '==', projectId));
    const unsubJobs = onSnapshot(jobsQuery, (snapshot) => {
        setJobs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Job)));
    });
    
    const quotesQuery = query(collection(db, 'quotes'), where('projectId', '==', projectId));
    const unsubQuotes = onSnapshot(quotesQuery, (snapshot) => {
        setQuotes(snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id, 
                ...data,
                quoteDate: (data.quoteDate as any)?.toDate(),
                createdAt: (data.createdAt as any)?.toDate(),
            } as Quote
        }));
    });

    const poQuery = query(collection(db, 'purchaseOrders'), where('projectId', '==', projectId));
    const unsubPOs = onSnapshot(poQuery, (snapshot) => {
        setPurchaseOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PurchaseOrder)));
    });
    
    // Fetch employees once
    getEmployees().then(setEmployees);

    // Cleanup listeners
    return () => {
        unsubProject();
        unsubJobs();
        unsubQuotes();
        unsubPOs();
        setContext(null); // Clear context on unmount
        setDynamicTitle(null); // Clear breadcrumbs on unmount
    };
  }, [projectId, toast, setContext, setDynamicTitle]);

  const employeeMap = useMemo(() => {
    return new Map(employees.map(e => [e.id, e.name]));
  }, [employees]);

  if (loading) {
      return (
          <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 flex items-center justify-center h-full">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
      );
  }

  if (!project) {
    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <h2 className="text-3xl font-bold tracking-tight">Project Not Found</h2>
            <p>The project you are looking for does not exist.</p>
            <Button asChild>
                <Link href="/projects"><ArrowLeft className="mr-2 h-4 w-4"/>Back to Projects</Link>
            </Button>
        </div>
    );
  }

  return (
    <div className="space-y-4">
      
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="jobs">Jobs</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="chat">Chat</TabsTrigger>
          <TabsTrigger value="quotes">Quotes</TabsTrigger>
          <TabsTrigger value="purchase-orders">Purchase Orders</TabsTrigger>
          <TabsTrigger value="invoicing">Invoicing</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
             <Card>
                <CardHeader>
                    <CardTitle>Project Overview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                             <div className="flex items-center gap-2 text-muted-foreground">
                                <strong>Status:</strong>
                                <Badge variant={project.status === 'Completed' ? 'default' : 'secondary'}>{project.status}</Badge>
                            </div>
                            <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-muted-foreground"/>
                                <span><strong>Manager:</strong> Not yet assigned</span>
                            </div>
                        </div>
                        {customer &&
                        <div className="space-y-2">
                            <Link href={`/customers/${customer.id}`} className="flex items-center gap-2 hover:underline">
                               <Building2 className="h-4 w-4 text-muted-foreground" /> 
                               <span><strong>Customer:</strong> {customer.name}</span>
                            </Link>
                            {/* Site information is not directly on project yet, needs enhancement */}
                            {/* <div className="flex items-center gap-2">
                               <MapPin className="h-4 w-4 text-muted-foreground" /> 
                               <span><strong>Site:</strong> {project.siteName}</span>
                            </div> */}
                        </div>
                        }
                    </div>
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="jobs">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div className='space-y-1.5'>
                        <CardTitle>Jobs</CardTitle>
                        <CardDescription>All jobs associated with this project.</CardDescription>
                    </div>
                    <JobFormDialog onJobCreated={() => {}} initialProjectId={projectId} />
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Title</TableHead>
                                <TableHead>Assigned Staff</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {jobs.length > 0 ? jobs.map(job => (
                                <TableRow key={job.id}>
                                    <TableCell className="font-medium">{job.title}</TableCell>
                                    <TableCell>{job.assignedStaff.map(staff => employeeMap.get(staff.employeeId) || 'Unknown').join(', ')}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={cn(getJobStatusColor(job.status))}>
                                            {job.status}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={3} className="h-24 text-center">
                                        No jobs created for this project yet.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="timeline">
            <TimelinePage projectId={projectId} />
        </TabsContent>
        <TabsContent value="chat">
            <ChatWidget projectId={projectId} />
        </TabsContent>
        <TabsContent value="quotes">
             <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div className='space-y-1.5'>
                        <CardTitle>Quotes</CardTitle>
                        <CardDescription>All quotes and variations for this project.</CardDescription>
                    </div>
                    <CreateQuoteDialog initialProjectId={project.id}>
                      <Button><PlusCircle className="mr-2 h-4 w-4" />New Quote</Button>
                    </CreateQuoteDialog>
                </CardHeader>
                <CardContent>
                    {quotes.length > 0 ? (
                         <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Quote #</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {quotes.map(quote => (
                                    <TableRow key={quote.id} onClick={() => router.push(`/quotes/${quote.id}`)} className="cursor-pointer">
                                        <TableCell className="font-medium">{quote.quoteNumber}</TableCell>
                                        <TableCell>{format(quote.quoteDate, 'PPP')}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={cn(getQuoteStatusColor(quote.status))}>
                                                {quote.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right font-semibold">${quote.totalAmount.toFixed(2)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                         <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg h-64">
                            <FileText className="h-12 w-12 text-muted-foreground" />
                            <p className="mt-4 text-sm text-muted-foreground">No quotes created for this project yet.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="purchase-orders">
             <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div className='space-y-1.5'>
                        <CardTitle>Purchase Orders</CardTitle>
                        <CardDescription>All purchase orders associated with this project.</CardDescription>
                    </div>
                    <PurchaseOrderFormDialog onPOCreated={()=>{}} initialProjectId={projectId} />
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>PO Number</TableHead>
                                <TableHead>Supplier</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Value</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {purchaseOrders.length > 0 ? purchaseOrders.map(po => (
                                <TableRow key={po.id}>
                                    <TableCell className="font-medium">{po.poNumber}</TableCell>
                                    <TableCell>{po.supplierName}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={cn(getPOStatusColor(po.status))}>
                                            {po.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">${po.totalValue.toFixed(2)}</TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">
                                        No purchase orders created for this project yet.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="invoicing">
            <PlaceholderContent title="Invoices" icon={Receipt} />
        </TabsContent>
        <TabsContent value="team">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div className="space-y-1.5">
                        <CardTitle>Project Team</CardTitle>
                        <CardDescription>The team members assigned to this project.</CardDescription>
                    </div>
                    <Button variant="outline">Manage Team</Button>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {(project.assignedStaff && project.assignedStaff.length > 0) ? (
                            project.assignedStaff.map(staff => {
                                const employee = employees.find(e => e.id === staff.employeeId);
                                if (!employee) return null;
                                return (
                                    <Card key={staff.employeeId} className="p-4 flex items-center gap-4">
                                        <Avatar>
                                            <AvatarImage src={`https://placehold.co/40x40.png`} data-ai-hint="person" />
                                            <AvatarFallback>{employee.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-semibold">{employee.name}</p>
                                            <p className="text-sm text-muted-foreground">{staff.role}</p>
                                        </div>
                                    </Card>
                                )
                            })
                        ) : (
                            <div className="col-span-full">
                                <PlaceholderContent title="No team members assigned" icon={Users} />
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}