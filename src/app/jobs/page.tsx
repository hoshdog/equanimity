// src/app/jobs/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getJobs } from '@/lib/jobs';
import { getProjects } from '@/lib/projects';
import { getEmployees } from '@/lib/employees';
import type { Job, Project, Employee } from '@/lib/types';
import { JobFormDialog } from './job-form-dialog';

const getStatusColor = (status: string) => {
    switch (status) {
      case 'In Progress': return 'text-yellow-600 bg-yellow-100/80 border-yellow-200/80';
      case 'Not Started': return 'text-gray-600 bg-gray-100/80 border-gray-200/80';
      case 'Completed': return 'text-green-600 bg-green-100/80 border-green-200/80';
      case 'On Hold': return 'text-blue-600 bg-blue-100/80 border-blue-200/80';
      default: return 'text-gray-500 bg-gray-100/80 border-gray-200/80';
    }
}

export default function JobsPage() {
    const router = useRouter();
    const [jobs, setJobs] = useState<Job[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            try {
                const [jobsData, projectsData, employeesData] = await Promise.all([
                    getJobs(),
                    getProjects(),
                    getEmployees(),
                ]);
                setJobs(jobsData);
                setProjects(projectsData);
                setEmployees(employeesData);
            } catch (error) {
                console.error("Failed to fetch jobs data:", error);
                toast({ variant: 'destructive', title: 'Error', description: 'Could not load jobs.' });
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [toast]);

    const handleJobCreated = (newJob: Job) => {
        setJobs(prev => [newJob, ...prev]);
    }
    
    const handleRowClick = (job: Job) => {
        router.push(`/projects/${job.projectId}`);
        console.log(`Navigate to job ${job.id}`);
    };

    const getProjectName = (projectId: string) => {
        return projects.find(p => p.id === projectId)?.name || 'Unknown Project';
    }

    const getTechnicianName = (technicianId: string) => {
        return employees.find(e => e.id === technicianId)?.name || 'Unassigned';
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
                                        <TableHead>Job ID</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead>Project</TableHead>
                                        <TableHead>Technician</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {jobs.map(job => (
                                        <TableRow key={job.id} onClick={() => handleRowClick(job)} className="cursor-pointer">
                                            <TableCell className="font-medium">{job.id.substring(0, 6)}...</TableCell>
                                            <TableCell>{job.description}</TableCell>
                                            <TableCell>{getProjectName(job.projectId)}</TableCell>
                                            <TableCell>{getTechnicianName(job.technicianId)}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={cn(getStatusColor(job.status))}>
                                                    {job.status}
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
