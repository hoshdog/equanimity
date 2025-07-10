
'use client';

import { useRouter } from 'next/navigation';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle } from "lucide-react";
import { cn } from '@/lib/utils';

const jobs = [
    { id: 'JOB001', description: 'Install new server rack', project: 'Server Upgrade', status: 'In Progress', technician: 'Bob Smith' },
    { id: 'JOB002', description: 'Run network cabling to new desks', project: 'Office Network Setup', status: 'Not Started', technician: 'Charlie Brown' },
    { id: 'JOB003', description: 'Test and tag all kitchen appliances', project: 'Kitchen Appliance Testing', status: 'Completed', technician: 'Alice Johnson' },
    { id: 'JOB004', description: 'Install security cameras in main yard', project: 'Security System Install', status: 'In Progress', technician: 'Bob Smith' },
    { id: 'JOB005', description: 'Configure firewall and switches', project: 'Office Network Setup', status: 'Not Started', technician: 'Charlie Brown' },
    { id: 'JOB006', description: 'Perform quarterly data center maintenance', project: 'Data Centre Maintenance', status: 'On Hold', technician: 'Alice Johnson' },
];

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

    const handleRowClick = (id: string) => {
        // router.push(`/jobs/${id}`);
        console.log(`Navigate to job ${id}`);
    };

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Jobs</h2>
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    New Job
                </Button>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>All Jobs</CardTitle>
                    <CardDescription>A list of all jobs across all projects.</CardDescription>
                </CardHeader>
                <CardContent>
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
                                    <TableRow key={job.id} onClick={() => handleRowClick(job.id)} className="cursor-pointer">
                                        <TableCell className="font-medium">{job.id}</TableCell>
                                        <TableCell>{job.description}</TableCell>
                                        <TableCell>{job.project}</TableCell>
                                        <TableCell>{job.technician}</TableCell>
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
                </CardContent>
            </Card>
        </div>
    );
}
