
'use client';

import { useState } from 'react';
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

type ColumnVisibilityState = {
  [key: string]: boolean;
};

export default function ProjectsPage() {
  const [view, setView] = useState('grid');
  const router = useRouter();
  const projects = [
    { id: 1, name: 'Website Redesign', description: 'Complete overhaul of the corporate website with a new CMS.', status: 'In Progress', manager: 'Alice', teamSize: 5 },
    { id: 2, name: 'Mobile App Development', description: 'Building a new cross-platform mobile application for customer engagement.', status: 'Planning', manager: 'Bob', teamSize: 8 },
    { id: 3, name: 'Q3 Marketing Campaign', description: 'Launch campaign for the new product line across all digital channels.', status: 'Completed', manager: 'Charlie', teamSize: 3 },
    { id: 4, name: 'New Office Setup', description: 'Physical setup and IT infrastructure for the new branch office.', status: 'On Hold', manager: 'Alice', teamSize: 4 },
  ];

  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibilityState>({
    'Project Name': true,
    'Manager': true,
    'Status': true,
    'Team Size': true,
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
            <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                New Project
            </Button>
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
                    <CardDescription>Managed by {project.manager}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                    <div className="text-sm text-muted-foreground">
                    <span className="font-semibold">Status: </span>
                    <span className={cn(getStatusColor(project.status))}>{project.status}</span>
                    </div>
                </CardContent>
                <CardFooter>
                    <p className="text-sm text-muted-foreground">{project.teamSize} team members</p>
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
                        {visibleColumns.includes('Manager') && <TableHead>Manager</TableHead>}
                        {visibleColumns.includes('Status') && <TableHead>Status</TableHead>}
                        {visibleColumns.includes('Team Size') && <TableHead>Team Size</TableHead>}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {projects.map(project => (
                        <TableRow key={project.id} onClick={() => handleRowClick(project.id)} className="cursor-pointer">
                           {visibleColumns.includes('Project Name') && <TableCell className="font-medium">{project.name}</TableCell>}
                           {visibleColumns.includes('Manager') && <TableCell>{project.manager}</TableCell>}
                           {visibleColumns.includes('Status') &&
                            <TableCell>
                                <span className={cn('font-semibold', getStatusColor(project.status))}>
                                    {project.status}
                                </span>
                            </TableCell>
                           }
                           {visibleColumns.includes('Team Size') && <TableCell>{project.teamSize}</TableCell>}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </Card>
      )}
    </div>
  );
}
