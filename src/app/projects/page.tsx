
'use client';

import * as React from 'react';
import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Briefcase, LayoutGrid, List, Columns, User, Users } from "lucide-react";
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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { MultiSelect, OptionType } from '@/components/ui/multi-select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { mockEmployees, mockCustomerDetails } from '@/lib/mock-data';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type ColumnVisibilityState = {
  [key: string]: boolean;
};

const initialProjects = [
    { id: 1, name: 'Website Redesign', description: 'Complete overhaul of the corporate website with a new CMS.', status: 'In Progress', assignedStaff: [mockEmployees[0], mockEmployees[2]], customerId: '1', siteId: 'S1A' },
    { id: 2, name: 'Mobile App Development', description: 'Building a new cross-platform mobile application for customer engagement.', status: 'Planning', assignedStaff: [mockEmployees[1]], customerId: '2', siteId: 'S2A' },
    { id: 3, name: 'Q3 Marketing Campaign', description: 'Launch campaign for the new product line across all digital channels.', status: 'Completed', assignedStaff: [mockEmployees[2], mockEmployees[3]], customerId: '3', siteId: 'S3A' },
    { id: 4, name: 'New Office Setup', description: 'Physical setup and IT infrastructure for the new branch office.', status: 'On Hold', assignedStaff: [mockEmployees[0], mockEmployees[4]], customerId: '1', siteId: 'S1B' },
];

const projectSchema = z.object({
    name: z.string().min(3, "Project name must be at least 3 characters."),
    description: z.string().min(10, "Description must be at least 10 characters."),
    customerId: z.string({ required_error: "Please select a customer."}).min(1, "Please select a customer."),
    siteId: z.string({ required_error: "Please select a site."}).min(1, "Please select a site."),
    assignedStaff: z.array(z.object({ value: z.string(), label: z.string() })).min(1, "At least one staff member must be assigned."),
});

type Project = Omit<typeof initialProjects[0], 'id' | 'status' | 'assignedStaff'> & { 
    id?: number; 
    status?: string;
    assignedStaff: OptionType[];
};

const customerOptions = Object.values(mockCustomerDetails).map(c => ({
    label: c.name,
    value: c.id
}));

export default function ProjectsPage() {
  const [view, setView] = useState('grid');
  const [projects, setProjects] = useState(initialProjects);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<z.infer<typeof projectSchema>>({
    resolver: zodResolver(projectSchema),
    defaultValues: { name: "", description: "", customerId: "", siteId: "", assignedStaff: [] },
  });
  
  const watchedCustomerId = form.watch('customerId');
  
  const siteOptions = useMemo(() => {
    if (!watchedCustomerId) return [];
    const customer = mockCustomerDetails[watchedCustomerId as keyof typeof mockCustomerDetails];
    if (!customer) return [];
    return customer.sites.map(site => ({ label: site.name, value: site.id }));
  }, [watchedCustomerId]);
  
  // Reset siteId when customerId changes
  React.useEffect(() => {
    form.setValue('siteId', '');
  }, [watchedCustomerId, form]);


  function onSubmit(values: z.infer<typeof projectSchema>) {
    const assignedStaffWithFullDetails = values.assignedStaff.map(s => {
        const fullEmployee = mockEmployees.find(e => e.value === s.value);
        return fullEmployee || s;
    });

    const newProject = { 
        ...values, 
        id: Date.now(),
        status: 'Planning',
        assignedStaff: assignedStaffWithFullDetails,
    };
    setProjects(prev => [...prev, newProject]);
    toast({ title: "Project Created", description: `"${values.name}" has been added.` });
    setIsFormOpen(false);
    form.reset();
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
            <Dialog open={isFormOpen} onOpenChange={(open) => { setIsFormOpen(open); if (!open) form.reset(); }}>
                <DialogTrigger asChild>
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        New Project
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create New Project</DialogTitle>
                        <DialogDescription>Fill out the form below to create a new project.</DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                             <FormField control={form.control} name="name" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Project Name</FormLabel>
                                    <FormControl><Input placeholder="e.g., Website Redesign" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}/>
                            <FormField control={form.control} name="description" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl><Textarea placeholder="A brief description of the project..." {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}/>
                            <FormField control={form.control} name="customerId" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Customer</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger><SelectValue placeholder="Select a customer" /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {customerOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}/>
                            <FormField control={form.control} name="siteId" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Site</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value} disabled={!watchedCustomerId}>
                                        <FormControl>
                                            <SelectTrigger><SelectValue placeholder="Select a site" /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {siteOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}/>
                            <FormField
                                control={form.control}
                                name="assignedStaff"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Assign Staff</FormLabel>
                                        <MultiSelect
                                            options={mockEmployees}
                                            selected={field.value}
                                            onChange={field.onChange}
                                            placeholder="Select staff..."
                                            className="w-full"
                                        />
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <DialogFooter>
                                <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
                                <Button type="submit">Create Project</Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
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
