// src/app/jobs/page.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from '@/lib/utils';
import { Loader2, PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getEmployees } from '@/lib/employees';
import type { Job, Employee } from '@/lib/types';
import { JobFormDialog } from './job-form-dialog';

const getStatusColor = (status: string) => {
    switch (status) {
      case 'In Progress': return 'text-yellow-600 bg-yellow-100/80 border-yellow-200/80';
      case 'Planning': return 'text-blue-600 bg-blue-100/80 border-blue-200/80';
      case 'Completed': return 'text-green-600 bg-green-100/80 border-green-200/80';
      default: return 'text-gray-500 bg-gray-100/80 border-gray-200/80';
    }
}

const getPriorityColor = (priority: string | undefined) => {
    switch(priority) {
        case 'Critical': return 'border-red-500 text-red-500';
        case 'High': return 'border-orange-500 text-orange-500';
        case 'Medium': return 'border-yellow-500 text-yellow-500';
        default: return 'border-gray-400 text-gray-400';
    }
}

export default function JobsPage() {
    const router = useRouter();
    const [jobs, setJobs] = useState<any[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        // Use mock data for development
        const loadData = async () => {
            try {
                const { mockDataService } = await import('@/lib/mock-data');
                
                // Load jobs
                const jobsData = await mockDataService.getJobs();
                setJobs(jobsData);
                
                // Load employees
                const employeesData = await mockDataService.getEmployees();
                setEmployees(employeesData);
                
                setLoading(false);
            } catch (error) {
                console.error("Failed to fetch data:", error);
                toast({ variant: 'destructive', title: 'Error', description: 'Could not load jobs.' });
                setLoading(false);
            }
        };
        
        loadData();
    }, [toast]);

    const handleJobCreated = (newJob: Job) => {
        // State is handled by the real-time listener
    }
    
    const handleRowClick = (job: Job) => {
        if (job.projectId) {
            router.push(`/projects/${job.projectId}`);
        } else {
            // Future: Navigate to a standalone job page, for now, do nothing.
            toast({ title: "Standalone Job", description: "This job is not linked to a project. A dedicated view is coming soon."})
        }
    };

    const getTechnicianNames = (assignedTo: string[] | undefined) => {
        if (!assignedTo || assignedTo.length === 0) return 'Unassigned';
        return assignedTo.map(employeeId => employees.find(e => e.id === employeeId)?.displayName || 'Unknown').join(', ');
    }

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Jobs</h2>
                <JobFormDialog onJobCreated={handleJobCreated} />
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>All Jobs</CardTitle>
                    <CardDescription>A list of all jobs across all projects.</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                         <div className="flex justify-center items-center h-64">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <div className="relative w-full overflow-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Job Title</TableHead>
                                        <TableHead>Project / Customer</TableHead>
                                        <TableHead>Assigned Staff</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Priority</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {jobs.map(job => (
                                        <TableRow key={job.id} onClick={() => handleRowClick(job)} className="cursor-pointer">
                                            <TableCell className="font-medium">{job.name}</TableCell>
                                            <TableCell>{job.projectName || 'Standalone Job'}</TableCell>
                                            <TableCell>{getTechnicianNames(job.assignedTo)}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={cn(getStatusColor(job.status))}>
                                                    {job.status}
                                                </Badge>
                                            </TableCell>
                                             <TableCell>
                                                <Badge variant="outline" className={cn(getPriorityColor('Medium'))}>
                                                    Medium
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
