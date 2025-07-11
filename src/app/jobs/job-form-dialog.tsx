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
import { ItemCreationForm } from '@/components/forms/item-creation-form';

const jobSchema = z.object({
  description: z.string().min(10, "Description must be at least 10 characters."),
  projectId: z.string({ required_error: "Please select a project." }).min(1, "Please select a project."),
  technicianId: z.string({ required_error: "Please assign a technician." }).min(1, "Please assign a technician."),
  status: z.string().min(2, "Please select a status."),
});

type JobFormValues = z.infer<typeof jobSchema>;

interface JobFormDialogProps {
    onJobCreated: (job: Job) => void;
    initialProjectId?: string;
}

export function JobFormDialog({ onJobCreated, initialProjectId }: JobFormDialogProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [employees, setEmployees] = React.useState<OptionType[]>([]);
  const { toast } = useToast();

  const form = useForm<JobFormValues>({
    resolver: zodResolver(jobSchema),
    defaultValues: { description: "", projectId: initialProjectId || "", technicianId: "", status: "Not Started" },
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
                    // Only fetch projects if no initial project is set
                    initialProjectId ? Promise.resolve([]) : getProjects(),
                    getEmployees(),
                ]);
                if (!initialProjectId) setProjects(projectsData);
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

  const projectOptions = projects.map(p => ({ value: p.id, label: p.name }));

  async function onSubmit(values: JobFormValues) {
    setLoading(true);
    try {
        const newJobId = await addJob(values.projectId, values);
        const newJob: Job = {
            id: newJobId,
            ...values,
            createdAt: { seconds: Date.now() / 1000, nanoseconds: 0 } // Simulate timestamp
        };
        onJobCreated(newJob);
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

  const fields = [
    ...(initialProjectId ? [] : [{ name: 'projectId', label: 'Project', type: 'select', options: projectOptions, placeholder: "Select a project" }]),
    { name: 'description', label: 'Job Description', type: 'textarea', placeholder: 'Describe the job in detail...' },
    { name: 'technicianId', label: 'Assign Technician', type: 'select', options: employees, placeholder: 'Select a technician' },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'Not Started', label: 'Not Started' },
        { value: 'In Progress', label: 'In Progress' },
        { value: 'On Hold', label: 'On Hold' },
        { value: 'Completed', label: 'Completed' },
      ],
      placeholder: 'Select a status'
    },
  ] as const;

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
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <ItemCreationForm fields={fields} />
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
              <Button type="submit" disabled={loading}>Create Job</Button>
            </DialogFooter>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
