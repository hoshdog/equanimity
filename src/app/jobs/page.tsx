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
import { onSnapshot, collection, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const getStatusColor = (status: Job['status']) => {
    switch (status) {
      case 'In Progress': return 'text-yellow-600 bg-yellow-100/80 border-yellow-200/80';
      case 'Draft': return 'text-gray-600 bg-gray-100/80 border-gray-200/80';
      case 'Planned': return 'text-blue-600 bg-blue-100/80 border-blue-200/80';
      case 'Completed': return 'text-green-600 bg-green-100/80 border-green-200/80';
      default: return 'text-gray-500 bg-gray-100/80 border-gray-200/80';
    }
}

const getPriorityColor = (priority: Job['priority']) => {
    switch(priority) {
        case 'Critical': return 'border-red-500 text-red-500';
        case 'High': return 'border-orange-500 text-orange-500';
        case 'Medium': return 'border-yellow-500 text-yellow-500';
        default: return 'border-gray-400 text-gray-400';
    }
}

export default function JobsPage() {
    const router = useRouter();
    const [jobs, setJobs] = useState<Job[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        // Subscribe to all jobs in real-time
        const jobsQuery = query(collection(db, 'jobs'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(jobsQuery, (snapshot) => {
            const jobsData: Job[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Job));
            setJobs(jobsData);
            setLoading(false);
        }, (error) => {
            console.error("Failed to subscribe to jobs:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not load jobs.' });
            setLoading(false);
        });

        // Fetch employees once
        async function fetchSupportingData() {
            try {
                const employeesData = await getEmployees();
                setEmployees(employeesData);
            } catch (error) {
                console.error("Failed to fetch employees:", error);
            }
        }
        fetchSupportingData();

        return () => unsubscribe();
    }, [toast]);

    const handleJobCreated = (newJob: Job) => {
        // State is handled by the real-time listener
    }
    
    const handleRowClick = (job: Job) => {
        router.push(`/projects/${job.projectId}`);
    };

    const getTechnicianNames = (technicianIds: string[]) => {
        if (!technicianIds || technicianIds.length === 0) return 'Unassigned';
        return technicianIds.map(id => employees.find(e => e.id === id)?.name || 'Unknown').join(', ');
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
                                        <TableHead>Project</TableHead>
                                        <TableHead>Assigned Staff</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Priority</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {jobs.map(job => (
                                        <TableRow key={job.id} onClick={() => handleRowClick(job)} className="cursor-pointer">
                                            <TableCell className="font-medium">{job.title}</TableCell>
                                            <TableCell>{job.projectName}</TableCell>
                                            <TableCell>{getTechnicianNames(job.assignedStaffIds)}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={cn(getStatusColor(job.status))}>
                                                    {job.status}
                                                </Badge>
                                            </TableCell>
                                             <TableCell>
                                                <Badge variant="outline" className={cn(getPriorityColor(job.priority))}>
                                                    {job.priority}
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
