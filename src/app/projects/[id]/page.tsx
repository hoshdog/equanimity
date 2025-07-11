// src/app/projects/[id]/page.tsx
'use client'

import { useState, useEffect, useMemo } from 'react';
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Briefcase, FileText, ShoppingCart, Users, Receipt, Building2, MapPin, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getProject } from '@/lib/projects';
import { getCustomer } from '@/lib/customers';
import { getJobsForProject } from '@/lib/jobs';
import { getEmployees } from '@/lib/employees';
import type { Project, Customer, Job, Employee } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { JobFormDialog } from '@/app/jobs/job-form-dialog';
import { cn } from '@/lib/utils';


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

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  const projectId = params.id;
  const [project, setProject] = useState<Project | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchData() {
        if (!projectId) return;
        setLoading(true);
        try {
            const [projectData, employeesData, jobsData] = await Promise.all([
                getProject(projectId),
                getEmployees(),
                getJobsForProject(projectId),
            ]);

            setProject(projectData);
            setEmployees(employeesData);
            setJobs(jobsData);
            
            if (projectData) {
                const customerData = await getCustomer(projectData.customerId);
                setCustomer(customerData);
            }
        } catch(error) {
            console.error("Failed to fetch project details:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not load project details.' });
        } finally {
            setLoading(false);
        }
    }
    fetchData();
  }, [projectId, toast]);

  const employeeMap = useMemo(() => {
    return new Map(employees.map(e => [e.id, e.name]));
  }, [employees]);

  const handleJobCreated = (newJob: Job) => {
    // Since the form dialog doesn't have the full project/employee objects, we add the new job
    // to the top of the list for immediate feedback. The full data is already in state maps.
    setJobs(prev => [newJob, ...prev]);
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
            <PlaceholderContent title="Quotes" icon={FileText} />
        </TabsContent>
        <TabsContent value="purchase-orders">
            <PlaceholderContent title="Purchase Orders" icon={ShoppingCart} />
        </TabsContent>
        <TabsContent value="invoicing">
            <PlaceholderContent title="Invoices" icon={Receipt} />
        </TabsContent>
        <TabsContent value="team">
            <PlaceholderContent title="Team Members" icon={Users} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
