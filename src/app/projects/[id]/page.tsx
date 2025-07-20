// src/app/projects/[id]/page.tsx
'use client'

import { useState, useEffect, useMemo, use } from 'react';
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Briefcase, FileText, ShoppingCart, Users, Receipt, Building2, MapPin, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getProject } from '@/lib/projects';
import { getCustomer } from '@/lib/customers';
import type { Project, Customer, Job, Employee, Quote, PurchaseOrder } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { JobFormDialog } from '@/app/jobs/job-form-dialog';
import { QuoteFormDialog } from '@/app/quotes/quote-form-dialog';
import { PurchaseOrderFormDialog } from '@/app/purchase-orders/po-form-dialog';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { onSnapshot, collection, query, orderBy, doc, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getEmployees } from '@/lib/employees';


function PlaceholderContent({ title, icon: Icon }: { title: string, icon: React.ElementType }) {
    return (
        <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg h-64">
            <Icon className="h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-sm text-muted-foreground">{title} will be displayed here.</p>
        </div>
    )
}

const getJobStatusColor = (status: string) => {
    switch (status) {
      case 'In Progress': return 'text-yellow-600 bg-yellow-100/80 border-yellow-200/80';
      case 'Not Started': return 'text-gray-600 bg-gray-100/80 border-gray-200/80';
      case 'Completed': return 'text-green-600 bg-green-100/80 border-green-200/80';
      case 'On Hold': return 'text-blue-600 bg-blue-100/80 border-blue-200/80';
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
  const [project, setProject] = useState<Project | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!projectId) return;

    // Listener for project document
    const unsubProject = onSnapshot(doc(db, 'projects', projectId), async (doc) => {
      if (doc.exists()) {
        const projectData = { id: doc.id, ...doc.data() } as Project;
        setProject(projectData);
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

    // Listeners for subcollections
    const jobsQuery = query(collection(db, 'projects', projectId, 'jobs'), orderBy('createdAt', 'desc'));
    const unsubJobs = onSnapshot(jobsQuery, (snapshot) => {
        setJobs(snapshot.docs.map(doc => ({ id: doc.id, projectId, ...doc.data() } as Job)));
    });
    
    // Quotes are in a root collection, so we query them
    const quotesQuery = query(collection(db, 'quotes'), where('projectId', '==', projectId), orderBy('createdAt', 'desc'));
    const unsubQuotes = onSnapshot(quotesQuery, (snapshot) => {
        setQuotes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Quote)));
    });

    // POs are in a project subcollection
    const poQuery = query(collection(db, 'projects', projectId, 'purchaseOrders'), orderBy('createdAt', 'desc'));
    const unsubPOs = onSnapshot(poQuery, (snapshot) => {
        setPurchaseOrders(snapshot.docs.map(doc => ({ id: doc.id, projectId, ...doc.data() } as PurchaseOrder)));
    });
    
    // Fetch employees once
    getEmployees().then(setEmployees);

    // Cleanup listeners
    return () => {
        unsubProject();
        unsubJobs();
        unsubQuotes();
        unsubPOs();
    };
  }, [projectId, toast]);

  const employeeMap = useMemo(() => {
    return new Map(employees.map(e => [e.id, e.name]));
  }, [employees]);

  const handleJobCreated = (newJob: Job) => {
    // Handled by listener
  };
  
  const handleQuoteCreated = (newQuote: Quote) => {
    // Handled by listener
  };

  const handlePOCreated = (newPO: PurchaseOrder) => {
    // Handled by listener
  };

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
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center space-x-4">
             <Button asChild variant="outline" size="icon">
                <Link href="/projects">
                    <ArrowLeft className="h-4 w-4"/>
                    <span className="sr-only">Back to Projects</span>
                </Link>
            </Button>
            <div>
                <h2 className="text-3xl font-bold tracking-tight">{project.name}</h2>
                <p className="text-muted-foreground">{project.description}</p>
            </div>
        </div>
      
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="jobs">Jobs</TabsTrigger>
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
                    <JobFormDialog onJobCreated={handleJobCreated} initialProjectId={projectId} />
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Description</TableHead>
                                <TableHead>Technician</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {jobs.length > 0 ? jobs.map(job => (
                                <TableRow key={job.id}>
                                    <TableCell className="font-medium">{job.description}</TableCell>
                                    <TableCell>{employeeMap.get(job.technicianId) || 'Unassigned'}</TableCell>
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
        <TabsContent value="quotes">
             <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div className='space-y-1.5'>
                        <CardTitle>Quotes</CardTitle>
                        <CardDescription>All quotes associated with this project.</CardDescription>
                    </div>
                    <QuoteFormDialog onQuoteCreated={handleQuoteCreated} projectId={projectId} />
                </CardHeader>
                <CardContent>
                    {quotes.length > 0 ? (
                        <div className="space-y-4">
                            {quotes.map(quote => (
                                <Card key={quote.id}>
                                    <CardHeader className="pb-4">
                                        <CardTitle className="text-lg flex justify-between items-center">
                                            <span className="truncate pr-4">Quote for: "{quote.prompt.substring(0, 50)}{quote.prompt.length > 50 ? '...' : ''}"</span>
                                            <span className="text-primary">${quote.totalAmount.toFixed(2)}</span>
                                        </CardTitle>
                                        <CardDescription className="flex justify-between items-center">
                                            <span>
                                              Created on: {new Date(quote.createdAt.seconds * 1000).toLocaleDateString()}
                                            </span>
                                            <Badge variant="outline" className={cn(getQuoteStatusColor(quote.status))}>
                                                {quote.status}
                                            </Badge>
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <pre className="text-xs p-4 rounded-md bg-muted whitespace-pre-wrap font-sans max-h-40 overflow-auto">
                                            {quote.quoteText}
                                        </pre>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
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
                    <PurchaseOrderFormDialog onPOCreated={handlePOCreated} initialProjectId={projectId} />
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
