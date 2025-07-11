
'use client';

import * as React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from "@/components/ui/button";
import { PlusCircle, Plus, Trash2, Pencil } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { MultiSelect } from '@/components/ui/multi-select';
import { mockEmployees } from '@/lib/mock-data';
import type { Project, CustomerDetails } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AddCustomerDialog } from './add-customer-dialog';
import { AddSiteDialog } from './add-site-dialog';
import { AddContactDialog } from './add-contact-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Combobox } from '@/components/ui/combobox';

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
    projectContacts: z.array(
        z.object({
            contactId: z.string().min(1, "Please select a contact."),
            role: z.string().min(2, "Role is required."),
        })
    ).min(1, "At least one project contact is required."),
    assignedStaff: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
});

type ProjectFormValues = z.infer<typeof projectSchema>;

export function ProjectFormDialog({ customerDetails, setCustomerDetails, onProjectCreated }: ProjectFormDialogProps) {
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [isRoleManagerOpen, setIsRoleManagerOpen] = React.useState(false);
  const [newRole, setNewRole] = React.useState('');
  const [commonRoles, setCommonRoles] = React.useState([
    "Primary", 
    "Site Contact", 
    "Accounts", 
    "Tenant", 
    "Project Manager", 
    "Client Representative"
  ]);

  const { toast } = useToast();
  
  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: { name: "", description: "", customerId: "", siteId: "", projectContacts: [{ contactId: '', role: '' }], assignedStaff: [] },
  });
  
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "projectContacts",
  });
  
  const watchedCustomerId = form.watch('customerId');

  const customerOptions = React.useMemo(() => {
    return Object.values(customerDetails).map(c => ({
        value: c.id,
        label: c.name,
    }));
  }, [customerDetails]);

  const siteOptions = React.useMemo(() => {
    if (!watchedCustomerId) return [];
    return customerDetails[watchedCustomerId]?.sites.map(site => ({ label: site.name, value: site.id })) || [];
  }, [watchedCustomerId, customerDetails]);
  
  const contactOptions = React.useMemo(() => {
    if(!watchedCustomerId) return [];
    return customerDetails[watchedCustomerId]?.contacts.map(c => ({ label: c.name, value: c.id })) || [];
  }, [watchedCustomerId, customerDetails]);
  
  React.useEffect(() => {
    form.resetField('siteId', { defaultValue: '' });
    form.resetField('projectContacts', { defaultValue: [{ contactId: '', role: '' }] });
  }, [watchedCustomerId, form]);


  function onSubmit(values: ProjectFormValues) {
    const assignedStaffWithFullDetails = values.assignedStaff?.map(s => {
        return mockEmployees.find(e => e.value === s.value) || { label: s.label, value: s.value };
    }) || [];

    onProjectCreated({ ...values, assignedStaff: assignedStaffWithFullDetails });
    toast({ title: "Project Created", description: `"${values.name}" has been added.` });
    setIsFormOpen(false);
    form.reset();
  }
  
  const handleCustomerAdded = (customerId: string) => {
    form.setValue('customerId', customerId, { shouldValidate: true });
  }

  const handleSiteAdded = (siteId: string) => {
    form.setValue('siteId', siteId, { shouldValidate: true });
  };
  
  const handleContactAdded = (contactId: string) => {
    const currentProjectContacts = form.getValues('projectContacts');
    if (currentProjectContacts.length > 0 && !currentProjectContacts[0].contactId) {
        form.setValue('projectContacts.0.contactId', contactId, { shouldValidate: true });
    }
  }

  const handleAddRole = () => {
    if (newRole && !commonRoles.includes(newRole)) {
      setCommonRoles([...commonRoles, newRole]);
      setNewRole('');
      toast({ title: "Role Added", description: `"${newRole}" has been added to the list.` });
    }
  };

  const handleDeleteRole = (roleToDelete: string) => {
    setCommonRoles(commonRoles.filter(role => role !== roleToDelete));
    toast({ title: "Role Removed", description: `"${roleToDelete}" has been removed.` });
  };


  return (
    <>
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
                              <div className="flex items-center justify-between">
                                  <FormLabel>Customer</FormLabel>
                                  <AddCustomerDialog 
                                      setCustomerDetails={setCustomerDetails}
                                      onCustomerAdded={handleCustomerAdded}
                                  >
                                      <Button type="button" variant="ghost" size="icon" className="shrink-0 h-6 w-6">
                                          <Plus className="h-4 w-4"/>
                                      </Button>
                                  </AddCustomerDialog>
                               </div>
                               <Combobox
                                 options={customerOptions}
                                 value={field.value}
                                 onChange={field.onChange}
                                 placeholder="Select a customer"
                                 searchPlaceholder="Search customers..."
                                 emptyPlaceholder="No customers found."
                               />
                              <FormMessage />
                          </FormItem>
                      )}/>

                      <FormField control={form.control} name="siteId" render={({ field }) => (
                          <FormItem>
                              <div className="flex items-center justify-between">
                                  <FormLabel>Site</FormLabel>
                                  <AddSiteDialog 
                                      customerId={watchedCustomerId}
                                      customerDetails={customerDetails}
                                      setCustomerDetails={setCustomerDetails} 
                                      onSiteAdded={handleSiteAdded}
                                  >
                                      <Button type="button" variant="ghost" size="icon" className="shrink-0 h-6 w-6" disabled={!watchedCustomerId}>
                                          <Plus className="h-4 w-4"/>
                                      </Button>
                                  </AddSiteDialog>
                              </div>
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
                     
                      <div className="space-y-2">
                          <div className="flex items-center justify-between">
                              <FormLabel>Project Contacts</FormLabel>
                              <Dialog open={isRoleManagerOpen} onOpenChange={setIsRoleManagerOpen}>
                                  <TooltipProvider><Tooltip>
                                      <TooltipTrigger asChild>
                                          <DialogTrigger asChild>
                                              <Button type="button" variant="ghost" size="icon" className="shrink-0 h-6 w-6"><Pencil className="h-4 w-4"/></Button>
                                          </DialogTrigger>
                                      </TooltipTrigger>
                                      <TooltipContent><p>Manage Roles</p></TooltipContent>
                                  </Tooltip></TooltipProvider>
                                  <DialogContent>
                                      <DialogHeader>
                                          <DialogTitle>Manage Contact Roles</DialogTitle>
                                          <DialogDescription>Add or remove contact roles from the list of suggestions.</DialogDescription>
                                      </DialogHeader>
                                      <div className="space-y-4">
                                          <div className="flex gap-2">
                                              <Input value={newRole} onChange={(e) => setNewRole(e.target.value)} placeholder="New role name..." />
                                              <Button onClick={handleAddRole}>Add Role</Button>
                                          </div>
                                          <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                                              {commonRoles.map(role => (
                                                  <div key={role} className="flex items-center justify-between p-2 rounded-md bg-secondary">
                                                      <span className="text-sm">{role}</span>
                                                      <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => handleDeleteRole(role)}>
                                                          <Trash2 className="h-4 w-4" />
                                                      </Button>
                                                  </div>
                                              ))}
                                          </div>
                                      </div>
                                       <DialogFooter>
                                          <Button variant="outline" onClick={() => setIsRoleManagerOpen(false)}>Done</Button>
                                      </DialogFooter>
                                  </DialogContent>
                              </Dialog>
                          </div>
                           {fields.map((field, index) => (
                              <div key={field.id} className="flex items-start gap-2 p-3 border rounded-md bg-secondary/30">
                                  <div className="grid grid-cols-2 gap-2 flex-1">
                                      <FormField
                                          control={form.control}
                                          name={`projectContacts.${index}.contactId`}
                                          render={({ field }) => (
                                              <FormItem>
                                                  <div className="flex items-center gap-1">
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
                                                       <TooltipProvider>
                                                          <Tooltip>
                                                              <TooltipTrigger asChild>
                                                              <AddContactDialog 
                                                                  customerId={watchedCustomerId}
                                                                  setCustomerDetails={setCustomerDetails} 
                                                                  onContactAdded={handleContactAdded}
                                                              >
                                                                  <Button type="button" variant="ghost" size="icon" className="shrink-0" disabled={!watchedCustomerId}>
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
                                                  <FormMessage />
                                              </FormItem>
                                          )}
                                      />
                                       <FormField
                                          control={form.control}
                                          name={`projectContacts.${index}.role`}
                                          render={({ field }) => (
                                              <FormItem>
                                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                      <FormControl>
                                                          <SelectTrigger>
                                                              <SelectValue placeholder="Select a role" />
                                                          </SelectTrigger>
                                                      </FormControl>
                                                      <SelectContent>
                                                          {commonRoles.map(role => <SelectItem key={role} value={role}>{role}</SelectItem>)}
                                                      </SelectContent>
                                                  </Select>
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
    </>
  );
}
