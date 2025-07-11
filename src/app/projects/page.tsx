
'use client';

import * as React from 'react';
import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Briefcase, LayoutGrid, List, Columns } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { mockEmployees, mockCustomerDetails as initialCustomerDetails } from '@/lib/mock-data';
import { ProjectFormDialog } from './project-form-dialog';
import type { Project, CustomerDetails } from '@/lib/types';


type ColumnVisibilityState = {
  [key: string]: boolean;
};

const initialProjects: Project[] = [
    { id: 1, name: 'Website Redesign', description: 'Complete overhaul of the corporate website with a new CMS.', status: 'In Progress', assignedStaff: [mockEmployees[0], mockEmployees[2]], customerId: '1', siteId: 'S1A', projectContacts: [{ contactId: 'C1A', role: 'Primary' }] },
    { id: 2, name: 'Mobile App Development', description: 'Building a new cross-platform mobile application for customer engagement.', status: 'Planning', assignedStaff: [mockEmployees[1]], customerId: '2', siteId: 'S2A', projectContacts: [{ contactId: 'C2A', role: 'Client' }] },
    { id: 3, name: 'Q3 Marketing Campaign', description: 'Launch campaign for the new product line across all digital channels.', status: 'Completed', assignedStaff: [mockEmployees[2], mockEmployees[3]], customerId: '3', siteId: 'S3A', projectContacts: [{ contactId: 'C3A', role: 'Marketing Head' }] },
    { id: 4, name: 'New Office Setup', description: 'Physical setup and IT infrastructure for the new branch office.', status: 'On Hold', assignedStaff: [mockEmployees[0], mockEmployees[4]], customerId: '1', siteId: 'S1B', projectContacts: [{ contactId: 'C1B', role: 'Site Manager' }] },
];

export default function ProjectsPage() {
  const [view, setView] = useState('grid');
  const [projects, setProjects] = useState(initialProjects);
  const [customerDetails, setCustomerDetails] = useState<CustomerDetails>(initialCustomerDetails);

  const router = useRouter();

  const handleAddNewProject = (newProjectData: Omit<Project, 'id' | 'status'>) => {
    const newProject: Project = {
        ...newProjectData,
        id: Date.now(),
        status: 'Planning'
    }
    setProjects(prev => [...prev, newProject]);
  }

  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibilityState>({
    'Project Name': true,
    'Assigned Staff': true,
    'Status': true,
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'In Progress': return 'text-yellow-600';
      case 'Planning': return 'text-blue-600';
      case 'Completed': return 'text-green-600';
      case 'On Hold': return 'text-gray-600';
      default: return 'text-gray-500';
    }
  }

  const handleRowClick = (id: number) => {
    router.push(`/projects/${id}`);
  };

  const toggleColumn = (column: string) => {
    setColumnVisibility(prev => ({ ...prev, [column]: !prev[column] }));
  };

  const visibleColumns = Object.keys(columnVisibility).filter(key => columnVisibility[key]);


  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Projects</h2>
        <div className="flex items-center space-x-2">
            <div className="flex items-center">
                <Button variant={view === 'grid' ? 'default' : 'ghost'} size="icon" onClick={() => setView('grid')}>
                    <LayoutGrid className="h-5 w-5" />
                </Button>
                <Button variant={view === 'list' ? 'default' : 'ghost'} size="icon" onClick={() => setView('list')}>
                    <List className="h-5 w-5" />
                </Button>
            </div>
             {view === 'list' && (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline">
                            <Columns className="mr-2 h-4 w-4" />
                            View
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {Object.keys(columnVisibility).map(key => (
                           <DropdownMenuCheckboxItem
                                key={key}
                                checked={columnVisibility[key]}
                                onCheckedChange={() => toggleColumn(key)}
                           >
                               {key}
                           </DropdownMenuCheckboxItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            )}
            <ProjectFormDialog 
                customerDetails={customerDetails}
                setCustomerDetails={setCustomerDetails}
                onProjectCreated={handleAddNewProject}
            />
        </div>
      </div>
      {view === 'grid' ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {projects.map((project) => (
            <Link href={`/projects/${project.id}`} key={project.id}>
                <Card className="flex flex-col h-full hover:border-primary transition-colors">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-primary" />
                    {project.name}
                    </CardTitle>
                    <CardDescription className="line-clamp-2">{project.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                     <div className="text-sm text-muted-foreground mb-4">
                        <span className="font-semibold">Status: </span>
                        <span className={cn(getStatusColor(project.status))}>{project.status}</span>
                    </div>
                </CardContent>
                <CardFooter>
                    <div className="flex flex-col w-full">
                        <div className="text-xs text-muted-foreground mb-2">Team</div>
                         <div className="flex items-center -space-x-2">
                            <TooltipProvider>
                            {project.assignedStaff.map(staff => (
                                <Tooltip key={staff.value}>
                                    <TooltipTrigger asChild>
                                        <Avatar className="h-8 w-8 border-2 border-background">
                                            <AvatarFallback>{staff.label.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                    </TooltipTrigger>
                                    <TooltipContent>{staff.label}</TooltipContent>
                                </Tooltip>
                            ))}
                            </TooltipProvider>
                         </div>
                    </div>
                </CardFooter>
                </Card>
            </Link>
            ))}
        </div>
      ) : (
        <Card>
            <Table>
                <TableHeader>
                    <TableRow>
                        {visibleColumns.includes('Project Name') && <TableHead>Project Name</TableHead>}
                        {visibleColumns.includes('Assigned Staff') && <TableHead>Assigned Staff</TableHead>}
                        {visibleColumns.includes('Status') && <TableHead>Status</TableHead>}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {projects.map(project => (
                        <TableRow key={project.id} onClick={() => handleRowClick(project.id)} className="cursor-pointer">
                           {visibleColumns.includes('Project Name') && <TableCell className="font-medium">{project.name}</TableCell>}
                           {visibleColumns.includes('Assigned Staff') && <TableCell>
                             <div className="flex items-center -space-x-2">
                                <TooltipProvider>
                                {project.assignedStaff.map(staff => (
                                    <Tooltip key={staff.value}>
                                        <TooltipTrigger asChild>
                                            <Avatar className="h-8 w-8 border-2 border-background">
                                                <AvatarFallback>{staff.label.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                        </TooltipTrigger>
                                        <TooltipContent>{staff.label}</TooltipContent>
                                    </Tooltip>
                                ))}
                                </TooltipProvider>
                             </div>
                           </TableCell>}
                           {visibleColumns.includes('Status') &&
                            <TableCell>
                                <span className={cn('font-semibold', getStatusColor(project.status))}>
                                    {project.status}
                                </span>
                            </TableCell>
                           }
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </Card>
      )}
    </div>
  );
}
