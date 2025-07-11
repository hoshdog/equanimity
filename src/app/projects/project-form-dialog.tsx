
'use client';

import * as React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from "@/components/ui/button";
import { PlusCircle, Plus, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { MultiSelect } from '@/components/ui/multi-select';
import { mockEmployees } from '@/lib/mock-data';
import type { Project, CustomerDetails, ProjectContact } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AddCustomerDialog } from './add-customer-dialog';
import { AddSiteDialog } from './add-site-dialog';
import { AddContactDialog } from './add-contact-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ProjectFormDialogProps {
    customerDetails: CustomerDetails;
    setCustomerDetails: React.Dispatch<React.SetStateAction<CustomerDetails>>;
    onProjectCreated: (project: Omit<Project, 'id' | 'status'>) => void;
}

const projectSchema = z.object({
    name: z.string().min(3, "Project name must be at least 3 characters."),
    description: z.string().min(10, "Description must be at least 10 characters."),
    customerName: z.string({ required_error: "Please select or enter a customer."}).min(1, "Please select or enter a customer."),
    customerId: z.string().optional(),
    siteId: z.string({ required_error: "Please select a site."}).min(1, "Please select a site."),
    projectContacts: z.array(
        z.object({
            contactId: z.string().min(1, "Please select a contact."),
            role: z.string().min(2, "Role is required."),
        })
    ).min(1, "At least one project contact is required."),
    assignedStaff: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
});

type ProjectFormValues = z.infer<typeof projectSchema>;

const commonRoles = ["Primary", "Site Contact", "Accounts", "Tenant", "Project Manager", "Client Representative"];

export function ProjectFormDialog({ customerDetails, setCustomerDetails, onProjectCreated }: ProjectFormDialogProps) {
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const { toast } = useToast();
  
  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: { name: "", description: "", customerName: "", customerId: "", siteId: "", projectContacts: [{ contactId: '', role: '' }], assignedStaff: [] },
  });
  
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "projectContacts",
  });
  
  const watchedCustomerName = form.watch('customerName');
  const watchedCustomerId = form.watch('customerId');

  const customerOptions = React.useMemo(() => Object.values(customerDetails).map(c => ({
    label: c.name, value: c.id
  })), [customerDetails]);

  const siteOptions = React.useMemo(() => {
    if (!watchedCustomerId) return [];
    return customerDetails[watchedCustomerId]?.sites.map(site => ({ label: site.name, value: site.id })) || [];
  }, [watchedCustomerId, customerDetails]);
  
  const contactOptions = React.useMemo(() => {
    if(!watchedCustomerId) return [];
    return customerDetails[watchedCustomerId]?.contacts.map(c => ({ label: c.name, value: c.id })) || [];
  }, [watchedCustomerId, customerDetails]);

  React.useEffect(() => {
    const matchingCustomer = customerOptions.find(c => c.label.toLowerCase() === watchedCustomerName.toLowerCase());
    if (matchingCustomer) {
      if (form.getValues('customerId') !== matchingCustomer.value) {
        form.setValue('customerId', matchingCustomer.value, { shouldValidate: true });
      }
    } else {
      if (form.getValues('customerId')) {
         form.setValue('customerId', '', { shouldValidate: true });
      }
    }
  }, [watchedCustomerName, customerOptions, form]);

  React.useEffect(() => {
    form.resetField('siteId', { defaultValue: '' });
    form.resetField('projectContacts', { defaultValue: [{ contactId: '', role: '' }] });
  }, [watchedCustomerId, form]);


  function onSubmit(values: ProjectFormValues) {
    let finalCustomerId = values.customerId;

    if (!finalCustomerId) {
        toast({ variant: "destructive", title: "Invalid Customer", description: "Please select a valid customer from the list or create a new one."});
        return;
    }

    const assignedStaffWithFullDetails = values.assignedStaff?.map(s => {
        return mockEmployees.find(e => e.value === s.value) || { label: s.label, value: s.value };
    }) || [];

    onProjectCreated({ ...values, customerId: finalCustomerId, assignedStaff: assignedStaffWithFullDetails });
    toast({ title: "Project Created", description: `"${values.name}" has been added.` });
    setIsFormOpen(false);
    form.reset();
  }
  
  const handleCustomerAdded = (customerId: string) => {
    const newCustomer = customerDetails[customerId];
    if (newCustomer) {
        form.setValue('customerName', newCustomer.name, { shouldValidate: true });
        form.setValue('customerId', newCustomer.id, { shouldValidate: true });
    }
  }

  const handleSiteAdded = (siteId: string) => {
    form.setValue('siteId', siteId, { shouldValidate: true });
  };
  
  const handleContactAdded = (contactId: string) => {
    // When a new contact is added to the customer, we can set it as the selection in the *first* project contact row
    const currentProjectContacts = form.getValues('projectContacts');
    if (currentProjectContacts.length > 0 && !currentProjectContacts[0].contactId) {
        form.setValue('projectContacts.0.contactId', contactId, { shouldValidate: true });
    }
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

                    <FormField control={form.control} name="customerName" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Customer</FormLabel>
                             <div className="flex gap-2 items-center">
                                <FormControl>
                                    <Input list="customer-options" placeholder="Select or type a customer name..." {...field} />
                                </FormControl>
                                <AddCustomerDialog 
                                    setCustomerDetails={setCustomerDetails} 
                                    onCustomerAdded={handleCustomerAdded}
                                >
                                    <Button type="button" variant="outline" size="icon" className="shrink-0">
                                        <Plus className="h-4 w-4"/>
                                    </Button>
                                </AddCustomerDialog>
                             </div>
                             <datalist id="customer-options">
                                {customerOptions.map(opt => <option key={opt.value} value={opt.label} />)}
                             </datalist>
                            <FormMessage />
                        </FormItem>
                    )}/>

                    <FormField control={form.control} name="siteId" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Site</FormLabel>
                            <div className="flex gap-2 items-center">
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
                                    onSiteAdded={handleSiteAdded}
                                >
                                    <Button type="button" variant="outline" size="icon" className="shrink-0" disabled={!watchedCustomerId}>
                                        <Plus className="h-4 w-4"/>
                                    </Button>
                                </AddSiteDialog>
                            </div>
                            <FormMessage />
                        </FormItem>
                    )}/>
                   
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <FormLabel>Project Contacts</FormLabel>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <AddContactDialog 
                                      customerId={watchedCustomerId}
                                      setCustomerDetails={setCustomerDetails} 
                                      onContactAdded={handleContactAdded}
                                  >
                                      <Button type="button" variant="outline" size="icon" className="shrink-0" disabled={!watchedCustomerId}>
                                          <Plus className="h-4 w-4"/>
                                      </Button>
                                  </AddContactDialog>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Add New Contact</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                        </div>
                         {fields.map((field, index) => (
                            <div key={field.id} className="flex items-start gap-2 p-3 border rounded-md bg-secondary/30">
                                <div className="grid grid-cols-2 gap-2 flex-1">
                                    <FormField
                                        control={form.control}
                                        name={`projectContacts.${index}.contactId`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!watchedCustomerId}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select contact" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {contactOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                     <FormField
                                        control={form.control}
                                        name={`projectContacts.${index}.role`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormControl>
                                                    <Input list="common-roles" placeholder="Role (e.g., Site Contact)" {...field} />
                                                </FormControl>
                                                <datalist id="common-roles">
                                                    {commonRoles.map(role => <option key={role} value={role} />)}
                                                </datalist>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={fields.length <= 1}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </div>
                        ))}
                        <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => append({ contactId: '', role: '' })}
                            disabled={!watchedCustomerId}
                        >
                           <PlusCircle className="mr-2 h-4 w-4"/> Add Another Contact
                        </Button>
                        <FormMessage>
                            {form.formState.errors.projectContacts && (
                                <p className="text-sm font-medium text-destructive">
                                    {form.formState.errors.projectContacts.message ||
                                    (form.formState.errors.projectContacts as any)?.root?.message}
                                </p>
                            )}
                        </FormMessage>
                    </div>


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
