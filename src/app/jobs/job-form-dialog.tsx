// src/app/jobs/job-form-dialog.tsx
'use client';

import * as React from 'react';
import { Button } from "@/components/ui/button";
import { PlusCircle, Loader2, CalendarIcon, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { useForm, FormProvider, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import type { Project, Job, Employee, OptionType, TimelineItem, AssignedStaff } from '@/lib/types';
import { getProjects } from '@/lib/projects';
import { getEmployees } from '@/lib/employees';
import { addJob } from '@/lib/jobs';
import { getTimelineItems } from '@/lib/timeline';
import { SearchableCombobox } from '@/components/ui/SearchableCombobox';
import { MultiSelect } from '@/components/ui/multi-select';
import { Form, FormField, FormItem, FormControl, FormMessage, FormLabel, FormDescription } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { jobStaffRoles } from '@/lib/types';


const assignedStaffSchema = z.object({
  employeeId: z.string().min(1, "Please select a staff member."),
  role: z.string().min(2, "Role is required."),
});

const jobSchema = z.object({
  // Core Details
  title: z.string().min(3, "Title must be at least 3 characters."),
  description: z.string().min(10, "Description must be at least 10 characters."),
  category: z.string().min(2, "Please select a category."),
  projectId: z.string({ required_error: "Please select a project." }).min(1, "Please select a project."),
  
  // Scheduling
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  dependencies: z.array(z.string()).optional(),
  isMilestone: z.boolean().default(false),

  // Assignment & Resources
  assignedStaff: z.array(assignedStaffSchema).min(1, "Please assign at least one staff member."),
  estimatedHours: z.coerce.number().min(0, "Hours must be a positive number.").optional(),
  
  // Status & Priority
  status: z.enum(['Draft', 'Planned', 'In Progress', 'On Hold', 'Completed']),
  priority: z.enum(['Low', 'Medium', 'High', 'Critical']),
  
  // Financials
  billable: z.boolean().default(true),
  billingRate: z.coerce.number().min(0, "Billing rate must be a positive number.").optional(),
}).refine(data => {
    if (data.startDate && data.endDate) {
        return data.endDate >= data.startDate;
    }
    return true;
}, {
    message: "End date must be on or after the start date.",
    path: ["endDate"],
});


type JobFormValues = z.infer<typeof jobSchema>;

const jobCategories = ["Installation", "Maintenance", "Repair", "Consultation", "Design", "Quoting"];
const jobPriorities: JobFormValues['priority'][] = ['Low', 'Medium', 'High', 'Critical'];
const jobStatuses: JobFormValues['status'][] = ['Draft', 'Planned', 'In Progress', 'On Hold', 'Completed'];

interface JobFormDialogProps {
    onJobCreated: (job: Job) => void;
    initialProjectId?: string;
}

export function JobFormDialog({ onJobCreated, initialProjectId }: JobFormDialogProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [projects, setProjects] = React.useState<OptionType[]>([]);
  const [employees, setEmployees] = React.useState<OptionType[]>([]);
  const [dependencyOptions, setDependencyOptions] = React.useState<OptionType[]>([]);
  const { toast } = useToast();

  const form = useForm<JobFormValues>({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      projectId: initialProjectId || "",
      assignedStaff: [{ employeeId: '', role: '' }],
      dependencies: [],
      status: 'Planned',
      priority: 'Medium',
      isMilestone: false,
      billable: true,
    },
  });
  
  const { fields: staffFields, append: appendStaff, remove: removeStaff } = useFieldArray({
    control: form.control,
    name: "assignedStaff",
  });
  
  const watchedProjectId = form.watch('projectId');

  React.useEffect(() => {
    async function fetchInitialData() {
        if (isOpen) {
            setLoading(true);
            try {
                const [projectsData, employeesData] = await Promise.all([
                    initialProjectId ? Promise.resolve([]) : getProjects(),
                    getEmployees(),
                ]);
                if (!initialProjectId) setProjects(projectsData.map(p => ({ value: p.id, label: `${p.name} (${p.customerName})` })));
                setEmployees(employeesData.map(e => ({ value: e.id, label: e.name })));
            } catch (error) {
                console.error("Failed to load data for job form", error);
                toast({ variant: 'destructive', title: 'Error', description: 'Could not load projects and employees.' });
            } finally {
                setLoading(false);
            }
        }
    }
    fetchInitialData();
  }, [isOpen, toast, initialProjectId]);
  
  React.useEffect(() => {
    async function fetchProjectDependencies() {
        if (watchedProjectId) {
            setLoading(true);
            try {
                const timelineItems = await getTimelineItems(watchedProjectId);
                setDependencyOptions(timelineItems.map(item => ({ value: item.id, label: item.name })));
            } catch (error) {
                 toast({ variant: 'destructive', title: 'Error', description: 'Could not load items for dependencies.' });
            } finally {
                setLoading(false);
            }
        }
    }
    fetchProjectDependencies();
  }, [watchedProjectId, toast]);

  React.useEffect(() => {
    if (isOpen && initialProjectId) {
      form.setValue('projectId', initialProjectId);
    }
     if (!isOpen) {
        form.reset({
          title: "",
          description: "",
          category: "",
          projectId: initialProjectId || "",
          assignedStaff: [{ employeeId: '', role: '' }],
          dependencies: [],
          status: 'Planned',
          priority: 'Medium',
          isMilestone: false,
          billable: true,
          startDate: undefined,
          endDate: undefined,
          estimatedHours: undefined,
          billingRate: undefined,
        });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialProjectId]);


  async function onSubmit(values: JobFormValues) {
    setLoading(true);
    try {
        const newJobId = await addJob(values.projectId, values);
        // The real-time listener will handle the UI update.
        toast({ title: 'Job Created', description: `A new job has been successfully created.` });
        setIsOpen(false);
    } catch (error) {
        console.error("Failed to create job", error);
        toast({ variant: "destructive", title: "Error", description: "Could not create the job." });
    } finally {
        setLoading(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          New Job
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Job</DialogTitle>
          <DialogDescription>Fill out the form below to create a new job.</DialogDescription>
        </DialogHeader>
        {loading && <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-10"><Loader2 className="h-8 w-8 animate-spin" /></div>}
        <FormProvider {...form}>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <Tabs defaultValue="core" className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="core">Core</TabsTrigger>
                        <TabsTrigger value="scheduling">Scheduling</TabsTrigger>
                        <TabsTrigger value="assignment">Assignment</TabsTrigger>
                        <TabsTrigger value="financials">Financials</TabsTrigger>
                    </TabsList>
                    <TabsContent value="core" className="pt-4 space-y-4">
                        {!initialProjectId && (
                            <FormField
                                control={form.control}
                                name="projectId"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col"><FormLabel>Project</FormLabel>
                                    <SearchableCombobox options={projects} {...field} placeholder="Select a project" />
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}
                        <FormField control={form.control} name="title" render={({ field }) => (<FormItem><FormLabel>Job Title</FormLabel><FormControl><Input placeholder="e.g., Install new kitchen downlights" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="description" render={({ field }) => (<FormItem><FormLabel>Job Description</FormLabel><FormControl><Textarea placeholder="Describe the job in detail..." {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="category" render={({ field }) => (<FormItem><FormLabel>Category</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger></FormControl><SelectContent>{jobCategories.map(cat => (<SelectItem key={cat} value={cat}>{cat}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="priority" render={({ field }) => (<FormItem><FormLabel>Priority</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select priority" /></SelectTrigger></FormControl><SelectContent>{jobPriorities.map(p => (<SelectItem key={p} value={p}>{p}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)} />
                        </div>
                        <FormField control={form.control} name="status" render={({ field }) => (<FormItem><FormLabel>Status</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger></FormControl><SelectContent>{jobStatuses.map(s => (<SelectItem key={s} value={s}>{s}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)} />
                    </TabsContent>
                    <TabsContent value="scheduling" className="pt-4 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="startDate" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>Start Date</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>{field.value ? format(field.value, "PPP") : <span>Pick a date</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} /></PopoverContent></Popover><FormMessage /></FormItem>)}/>
                            <FormField control={form.control} name="endDate" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>End Date</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>{field.value ? format(field.value, "PPP") : <span>Pick a date</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} /></PopoverContent></Popover><FormMessage /></FormItem>)}/>
                        </div>
                        <FormField control={form.control} name="dependencies" render={({ field }) => (<FormItem><FormLabel>Dependencies</FormLabel><MultiSelect options={dependencyOptions} selected={dependencyOptions.filter(opt => field.value?.includes(opt.value))} onChange={(selected) => field.onChange(selected.map(s => s.value))} placeholder="Select prerequisite jobs or tasks..." /><FormDescription>This job can only start after these items are completed.</FormDescription><FormMessage /></FormItem>)}/>
                        <FormField control={form.control} name="isMilestone" render={({ field }) => (<FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm"><div className="space-y-0.5"><FormLabel>Mark as Milestone</FormLabel><FormDescription>Key milestones are highlighted on the project timeline.</FormDescription></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>)}/>
                    </TabsContent>
                    <TabsContent value="assignment" className="pt-4 space-y-4">
                       <div className="space-y-2">
                            <FormLabel>Assigned Staff</FormLabel>
                            {staffFields.map((field, index) => (
                                <div key={field.id} className="flex items-start gap-2 p-2 border rounded-md">
                                    <div className="grid grid-cols-2 gap-2 flex-grow">
                                        <FormField
                                            control={form.control}
                                            name={`assignedStaff.${index}.employeeId`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <Select onValueChange={field.onChange} value={field.value}>
                                                        <FormControl><SelectTrigger><SelectValue placeholder="Select staff..." /></SelectTrigger></FormControl>
                                                        <SelectContent>{employees.map(e => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}</SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name={`assignedStaff.${index}.role`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <Select onValueChange={field.onChange} value={field.value}>
                                                        <FormControl><SelectTrigger><SelectValue placeholder="Select role..." /></SelectTrigger></FormControl>
                                                        <SelectContent>{jobStaffRoles.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <Button type="button" variant="ghost" size="icon" onClick={() => removeStaff(index)} disabled={staffFields.length <= 1}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </div>
                            ))}
                            <Button type="button" variant="outline" size="sm" onClick={() => appendStaff({ employeeId: '', role: '' })}>
                                <PlusCircle className="mr-2 h-4 w-4" /> Add Staff Member
                            </Button>
                            <FormMessage>{form.formState.errors.assignedStaff?.message}</FormMessage>
                        </div>
                        <FormField control={form.control} name="estimatedHours" render={({ field }) => (<FormItem><FormLabel>Estimated Hours</FormLabel><FormControl><Input type="number" placeholder="e.g., 16" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                    </TabsContent>
                    <TabsContent value="financials" className="pt-4 space-y-4">
                        <FormField control={form.control} name="billable" render={({ field }) => (<FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm"><div className="space-y-0.5"><FormLabel>Billable Job</FormLabel><FormDescription>Should the time and materials for this job be billed to the client?</FormDescription></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>)}/>
                        <FormField control={form.control} name="billingRate" render={({ field }) => (<FormItem><FormLabel>Billing Rate (per hour)</FormLabel><FormControl><Input type="number" placeholder="Leave blank to use default rate" {...field} /></FormControl><FormDescription>Override the default billing rate for this specific job.</FormDescription><FormMessage /></FormItem>)} />
                    </TabsContent>
                </Tabs>
                <DialogFooter>
                    <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
                    <Button type="submit" disabled={loading}>Create Job</Button>
                </DialogFooter>
            </form>
          </Form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
