
'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from "@/components/ui/button";
import { PlusCircle, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { MultiSelect } from '@/components/ui/multi-select';
import { mockEmployees } from '@/lib/mock-data';
import type { Project, CustomerDetails } from '@/lib/types';
import { AddCustomerDialog } from './add-customer-dialog';
import { AddSiteDialog } from './add-site-dialog';
import { AddContactDialog } from './add-contact-dialog';
import { Combobox } from '@/components/ui/combobox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ProjectFormDialogProps {
    customerDetails: CustomerDetails;
    setCustomerDetails: React.Dispatch<React.SetStateAction<CustomerDetails>>;
    onProjectCreated: (project: Omit<Project, 'id' | 'status'>) => void;
}

const projectSchema = z.object({
    name: z.string().min(3, "Project name must be at least 3 characters."),
    description: z.string().min(10, "Description must be at least 10 characters."),
    customerId: z.string({ required_error: "Please select a customer."}).min(1, "Please select a customer."),
    siteId: z.string({ required_error: "Please select a site."}).min(1, "Please select a site."),
    contactId: z.string({ required_error: "Please select a primary contact."}).min(1, "Please select a primary contact."),
    assignedStaff: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
});

type ProjectFormValues = z.infer<typeof projectSchema>;

export function ProjectFormDialog({ customerDetails, setCustomerDetails, onProjectCreated }: ProjectFormDialogProps) {
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const { toast } = useToast();
  
  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: { name: "", description: "", customerId: "", siteId: "", contactId: "", assignedStaff: [] },
  });
  
  const watchedCustomerId = form.watch('customerId');
  const watchedSiteId = form.watch('siteId');

  const customerOptions = React.useMemo(() => Object.values(customerDetails).map(c => ({
    label: c.name, value: c.id
  })), [customerDetails]);

  const siteOptions = React.useMemo(() => {
    if (!watchedCustomerId) return [];
    const customer = customerDetails[watchedCustomerId];
    if (!customer) return [];
    return customer.sites.map(site => ({ label: site.name, value: site.id }));
  }, [watchedCustomerId, customerDetails]);
  
  const contactOptions = React.useMemo(() => {
    if(!watchedCustomerId) return [];
    const customer = customerDetails[watchedCustomerId];
    if (!customer) return [];
    return customer.contacts.map(c => ({ label: c.name, value: c.id }));
  }, [watchedCustomerId, customerDetails]);

  React.useEffect(() => {
    form.resetField('siteId', { defaultValue: '' });
    form.resetField('contactId', { defaultValue: '' });
  }, [watchedCustomerId, form]);

  React.useEffect(() => {
    const customer = customerDetails[watchedCustomerId];
    const site = customer?.sites.find(s => s.id === watchedSiteId);
    if (site?.primaryContactId && contactOptions.some(c => c.value === site.primaryContactId)) {
      form.setValue('contactId', site.primaryContactId);
    } else {
       form.resetField('contactId', { defaultValue: '' });
    }
  }, [watchedSiteId, watchedCustomerId, customerDetails, contactOptions, form]);


  function onSubmit(values: ProjectFormValues) {
    const assignedStaffWithFullDetails = values.assignedStaff?.map(s => {
        return mockEmployees.find(e => e.value === s.value) || { label: s.label, value: s.value };
    }) || [];

    onProjectCreated({ ...values, assignedStaff: assignedStaffWithFullDetails });
    toast({ title: "Project Created", description: `"${values.name}" has been added.` });
    setIsFormOpen(false);
    form.reset();
  }

  return (
    <Dialog open={isFormOpen} onOpenChange={(open) => { setIsFormOpen(open); if (!open) form.reset(); }}>
        <DialogTrigger asChild>
            <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                New Project
            </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
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
                        <FormItem className="flex flex-col">
                            <FormLabel>Customer</FormLabel>
                             <Combobox
                                options={customerOptions}
                                value={field.value}
                                onChange={field.onChange}
                                placeholder="Select customer..."
                                notFoundContent={
                                    <AddCustomerDialog setCustomerDetails={setCustomerDetails} onCustomerAdded={field.onChange}>
                                        <Button variant="link" className="w-full">
                                            <Plus className="mr-2 h-4 w-4" />
                                            Create a new customer
                                        </Button>
                                    </AddCustomerDialog>
                                }
                             />
                            <FormMessage />
                        </FormItem>
                    )}/>

                    <FormField control={form.control} name="siteId" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Site</FormLabel>
                             <div className="flex gap-2">
                                <Select onValueChange={field.onChange} value={field.value} disabled={!watchedCustomerId}>
                                    <FormControl>
                                        <SelectTrigger><SelectValue placeholder="Select a site" /></SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {siteOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <AddSiteDialog 
                                    customerId={watchedCustomerId}
                                    customerDetails={customerDetails}
                                    setCustomerDetails={setCustomerDetails}
                                    onSiteAdded={field.onChange}
                                >
                                   <Button type="button" variant="outline" size="icon" disabled={!watchedCustomerId}><Plus /></Button>
                                </AddSiteDialog>
                            </div>
                            <FormMessage />
                        </FormItem>
                    )}/>
                    <FormField control={form.control} name="contactId" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Primary Contact</FormLabel>
                            <div className="flex gap-2">
                                <Select onValueChange={field.onChange} value={field.value} disabled={!watchedCustomerId}>
                                    <FormControl>
                                        <SelectTrigger><SelectValue placeholder="Select a contact" /></SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {contactOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <AddContactDialog 
                                    customerId={watchedCustomerId} 
                                    setCustomerDetails={setCustomerDetails} 
                                    onContactAdded={field.onChange}
                                >
                                   <Button type="button" variant="outline" size="icon" disabled={!watchedCustomerId}><Plus /></Button>
                                </AddContactDialog>
                            </div>
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
                                    selected={field.value || []}
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
  );
}
