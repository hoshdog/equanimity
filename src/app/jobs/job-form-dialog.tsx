// src/app/jobs/job-form-dialog.tsx
'use client';

import * as React from 'react';
import { Button } from "@/components/ui/button";
import { PlusCircle, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import type { Project, Job, Employee, OptionType } from '@/lib/types';
import { getProjects } from '@/lib/projects';
import { getEmployees } from '@/lib/employees';
import { addJob } from '@/lib/jobs';
import { SearchableCombobox } from '@/components/ui/SearchableCombobox';
import { Form, FormField, FormItem, FormControl, FormMessage, FormLabel } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { JobStatus, allJobStatuses } from '@/lib/job-status';

const jobSchema = z.object({
  description: z.string().min(10, "Description must be at least 10 characters."),
  projectId: z.string({ required_error: "Please select a project." }).min(1, "Please select a project."),
  technicianId: z.string({ required_error: "Please assign a technician." }).min(1, "Please assign a technician."),
  status: z.nativeEnum(JobStatus),
});

type JobFormValues = z.infer<typeof jobSchema>;

interface JobFormDialogProps {
    onJobCreated: (job: Job) => void;
    initialProjectId?: string;
}

export function JobFormDialog({ onJobCreated, initialProjectId }: JobFormDialogProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [projects, setProjects] = React.useState<OptionType[]>([]);
  const [employees, setEmployees] = React.useState<OptionType[]>([]);
  const { toast } = useToast();

  const form = useForm<JobFormValues>({
    resolver: zodResolver(jobSchema),
    defaultValues: { description: "", projectId: initialProjectId || "", technicianId: "", status: JobStatus.Draft },
  });

  React.useEffect(() => {
    // If an initial project ID is provided, set it when the dialog opens
    if (isOpen && initialProjectId) {
      form.setValue('projectId', initialProjectId);
    }
  }, [isOpen, initialProjectId, form]);

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


  async function onSubmit(values: JobFormValues) {
    setLoading(true);
    try {
        const newJobId = await addJob(values.projectId, values);
        // The real-time listener will handle the UI update.
        toast({ title: 'Job Created', description: `A new job has been successfully created.` });
        setIsOpen(false);
        form.reset();
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Job</DialogTitle>
          <DialogDescription>Fill out the form below to create a new job.</DialogDescription>
        </DialogHeader>
        {loading && <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-10"><Loader2 className="h-8 w-8 animate-spin" /></div>}
        <FormProvider {...form}>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem><FormLabel>Job Description</FormLabel>
                        <FormControl><Textarea placeholder="Describe the job in detail..." {...field} /></FormControl>
                        <FormMessage /></FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="technicianId"
                    render={({ field }) => (
                        <FormItem className="flex flex-col"><FormLabel>Assign Technician</FormLabel>
                        <SearchableCombobox options={employees} {...field} placeholder="Select a technician" />
                        <FormMessage /></FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                        <FormItem><FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a status" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {allJobStatuses.map(status => (
                                    <SelectItem key={status} value={status}>{status}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <FormMessage /></FormItem>
                    )}
                />
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
