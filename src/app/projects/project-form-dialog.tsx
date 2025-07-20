// src/app/projects/project-form-dialog.tsx
'use client';

import * as React from 'react';
import { useForm, useFieldArray, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from "@/components/ui/button";
import { PlusCircle, Plus, Trash2, Pencil, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import type { Project, Customer, Site, Contact, Employee, OptionType, AssignedStaff } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { getCustomers, getCustomerSites, getCustomerContacts, addCustomer as addDbCustomer, addContact as addDbContact } from '@/lib/customers';
import { getEmployees } from '@/lib/employees';
import { addProject } from '@/lib/projects';
import { AddressAutocompleteInput } from '@/components/ui/address-autocomplete-input';
import { SearchableCombobox } from '@/components/ui/SearchableCombobox';

const customerSchema = z.object({
    name: z.string().min(2, { message: "Customer name must be at least 2 characters." }),
    address: z.string().min(10, { message: "Address must be at least 10 characters." }),
    primaryContactName: z.string().min(2, { message: "Primary contact name must be at least 2 characters." }),
    email: z.string().email({ message: "Please enter a valid email address." }),
    phone: z.string().min(8, { message: "Phone number seems too short." }),
    type: z.string().min(2, { message: "Please select a customer type." }),
});

const newContactSchema = z.object({
  name: z.string().min(2, "Contact name must be at least 2 characters."),
  emails: z.array(z.object({ value: z.string().email("Please enter a valid email address.") })).min(1, "At least one email is required."),
  phones: z.array(z.object({ value: z.string().min(8, "Phone number seems too short.") })).min(1, "At least one phone number is required."),
  jobTitle: z.string().optional(),
});


const projectSchema = z.object({
    name: z.string().min(3, "Project name must be at least 3 characters."),
    description: z.string().min(10, "Description must be at least 10 characters."),
    customerId: z.string({ required_error: "Please select a valid customer."}).min(1, "Please select a valid customer."),
    siteId: z.string({ required_error: "Please select a site."}).min(1, "Please select a site."),
    projectContacts: z.array(
        z.object({
            contactId: z.string().min(1, "Please select a contact."),
            role: z.string().min(2, "Role is required."),
        })
    ).min(1, "At least one project contact is required."),
    assignedStaff: z.array(
        z.object({
            employeeId: z.string().min(1, "Please select a staff member."),
            role: z.string().min(2, "Role is required."),
        })
    ).min(1, "At least one staff member must be assigned."),
});


interface ProjectFormDialogProps {
    onProjectCreated: (project: Project) => void;
}


type ProjectFormValues = z.infer<typeof projectSchema>;

function AddCustomerDialog({ onCustomerAdded, children }: { onCustomerAdded: (customer: Customer) => void, children: React.ReactNode }) {
    const [isOpen, setIsOpen] = React.useState(false);
    const [loading, setLoading] = React.useState(false);
    const { toast } = useToast();
    const form = useForm<z.infer<typeof customerSchema>>({
        resolver: zodResolver(customerSchema),
        defaultValues: { name: "", address: "", primaryContactName: "", email: "", phone: "", type: "Corporate Client" },
    });
    
    async function onSubmit(values: z.infer<typeof customerSchema>) {
        setLoading(true);
        try {
            const newCustomerData = {
              name: values.name,
              address: values.address,
              type: values.type,
              primaryContactName: values.primaryContactName,
              email: values.email,
              phone: values.phone,
            }
            const initialContact = { name: values.primaryContactName, emails: [values.email], phones: [values.phone], jobTitle: 'Primary Contact' };
            const initialSite = { name: 'Main Site', address: values.address };
            
            const { customerId } = await addDbCustomer(newCustomerData, initialContact, initialSite);
            const newCustomer = { id: customerId, ...newCustomerData };
            
            onCustomerAdded(newCustomer);
            toast({ title: "Customer Added", description: `"${values.name}" has been added.` });
            setIsOpen(false);
            form.reset();
        } catch (error) {
            console.error("Failed to add customer", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to add customer.' });
        } finally {
            setLoading(false);
        }
    }

    const handlePlaceSelect = (place: google.maps.places.PlaceResult | null) => {
        if (place?.name) {
            form.setValue('name', place.name);
        }
        if (place?.formatted_address) {
            form.setValue('address', place.formatted_address);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add New Customer</DialogTitle>
                    <DialogDescription>Create a new customer record. An initial contact and site will be created automatically.</DialogDescription>
                </DialogHeader>
                 <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField control={form.control} name="name" render={({ field }) => (
                            <FormItem><FormLabel>Customer Name</FormLabel>
                                <FormControl>
                                    <AddressAutocompleteInput 
                                        searchType="establishment"
                                        onPlaceSelect={handlePlaceSelect}
                                        placeholder="Search for a business..."
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}/>
                         <FormField control={form.control} name="address" render={({ field }) => (
                            <FormItem><FormLabel>Address</FormLabel>
                            <FormControl><Input placeholder="e.g., 123 Tech Park, Sydney" {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                        <FormField control={form.control} name="primaryContactName" render={({ field }) => (
                            <FormItem><FormLabel>Primary Contact Name</FormLabel><FormControl><Input placeholder="e.g., John Doe" {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                        <FormField control={form.control} name="email" render={({ field }) => (
                            <FormItem><FormLabel>Email</FormLabel><FormControl><Input placeholder="e.g., contact@innovate.com" {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                        <FormField control={form.control} name="phone" render={({ field }) => (
                            <FormItem><FormLabel>Phone</FormLabel><FormControl><Input placeholder="e.g., 02 9999 8888" {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                        <FormField control={form.control} name="type" render={({ field }) => (
                            <FormItem>
                                 <FormLabel>Customer Type</FormLabel>
                                 <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a customer type" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="Corporate Client">Corporate Client</SelectItem>
                                        <SelectItem value="Construction Partner">Construction Partner</SelectItem>
                                        <SelectItem value="Small Business">Small Business</SelectItem>
                                        <SelectItem value="Government">Government</SelectItem>
                                        <SelectItem value="Private">Private</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}/>
                        <DialogFooter>
                             <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
                            <Button type="submit" disabled={loading}>{loading ? <Loader2 className="animate-spin" /> : 'Add Customer'}</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}


function AddContactDialog({ customerId, customerName, onContactAdded, children }: { customerId: string, customerName: string, onContactAdded: (contact: Contact) => void, children: React.ReactNode }) {
    const [isOpen, setIsOpen] = React.useState(false);
    const [loading, setLoading] = React.useState(false);
    const { toast } = useToast();
    const form = useForm<z.infer<typeof newContactSchema>>({
        resolver: zodResolver(newContactSchema),
        defaultValues: { name: "", emails: [{ value: "" }], phones: [{ value: "" }], jobTitle: "" },
    });
    
    const { fields: emailFields, append: appendEmail, remove: removeEmail } = useFieldArray({ control: form.control, name: "emails" });
    const { fields: phoneFields, append: appendPhone, remove: removePhone } = useFieldArray({ control: form.control, name: "phones" });

    async function onSubmit(values: z.infer<typeof newContactSchema>) {
        setLoading(true);
        try {
            const contactData = {
              name: values.name,
              emails: values.emails.map(e => e.value),
              phones: values.phones.map(p => p.value),
              jobTitle: values.jobTitle,
            };
            const newContactId = await addDbContact(customerId, contactData);
            onContactAdded({ id: newContactId, ...contactData });
            toast({ title: "Contact Added", description: `"${values.name}" has been added to ${customerName}.` });
            setIsOpen(false);
            form.reset({ name: "", emails: [{ value: "" }], phones: [{ value: "" }], jobTitle: "" });
        } catch (error) {
            console.error("Failed to add contact", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to add contact.' });
        } finally {
            setLoading(false);
        }
    }
    
    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent>
                 <DialogHeader><DialogTitle>Add New Contact</DialogTitle><DialogDescription>Add a new contact person for {customerName}.</DialogDescription></DialogHeader>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField control={form.control} name="name" render={({ field }) => ( <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="e.g., Jane Doe" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                        <FormField control={form.control} name="jobTitle" render={({ field }) => ( <FormItem><FormLabel>Job Title (Optional)</FormLabel><FormControl><Input placeholder="e.g., Project Manager" {...field} /></FormControl><FormMessage /></FormItem> )}/>

                        <div>
                            <FormLabel>Email Addresses</FormLabel>
                            {emailFields.map((field, index) => (
                              <FormField key={field.id} control={form.control} name={`emails.${index}.value`} render={({ field }) => (
                                <FormItem className="flex items-center gap-2 mt-1">
                                  <FormControl><Input placeholder="jane.doe@example.com" {...field} /></FormControl>
                                  <Button type="button" variant="ghost" size="icon" disabled={emailFields.length <= 1} onClick={() => removeEmail(index)}>
                                    <Trash2 className="h-5 w-5 text-destructive"/>
                                  </Button>
                                </FormItem>
                              )}/>
                            ))}
                            <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => appendEmail({ value: "" })}>
                                <PlusCircle className="mr-2 h-4 w-4"/>Add Email
                            </Button>
                        </div>

                        <div>
                            <FormLabel>Phone Numbers</FormLabel>
                            {phoneFields.map((field, index) => (
                              <FormField key={field.id} control={form.control} name={`phones.${index}.value`} render={({ field }) => (
                                <FormItem className="flex items-center gap-2 mt-1">
                                  <FormControl><Input placeholder="0412 345 678" {...field} /></FormControl>
                                  <Button type="button" variant="ghost" size="icon" disabled={phoneFields.length <= 1} onClick={() => removePhone(index)}>
                                    <Trash2 className="h-5 w-5 text-destructive"/>
                                  </Button>
                                </FormItem>
                              )}/>
                            ))}
                            <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => appendPhone({ value: "" })}>
                                <PlusCircle className="mr-2 h-4 w-4"/>Add Phone
                            </Button>
                        </div>
                        
                        <DialogFooter><DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose><Button type="submit" disabled={loading}>{loading ? <Loader2 className="animate-spin" /> : 'Add Contact'}</Button></DialogFooter>
                      </form>
                    </Form>
            </DialogContent>
        </Dialog>
    )
}


export function ProjectFormDialog({ onProjectCreated }: ProjectFormDialogProps) {
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [isContactRoleManagerOpen, setIsContactRoleManagerOpen] = React.useState(false);
  const [isStaffRoleManagerOpen, setIsStaffRoleManagerOpen] = React.useState(false);
  const [newContactRole, setNewContactRole] = React.useState('');
  const [newStaffRole, setNewStaffRole] = React.useState('');
  const [contactRoles, setContactRoles] = React.useState([
    "Primary", 
    "Site Contact", 
    "Accounts", 
    "Tenant", 
    "Project Manager", 
    "Client Representative"
  ]);
   const [staffRoles, setStaffRoles] = React.useState([
    "Project Manager",
    "Lead Technician",
    "Technician",
    "Apprentice",
    "Estimator",
    "Safety Officer",
  ]);
  const [customers, setCustomers] = React.useState<Customer[]>([]);
  const [sites, setSites] = React.useState<Site[]>([]);
  const [contacts, setContacts] = React.useState<Contact[]>([]);
  const [employees, setEmployees] = React.useState<OptionType[]>([]);
  const [loading, setLoading] = React.useState(false);
  
  const { toast } = useToast();
  
  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: { name: "", description: "", customerId: "", siteId: "", projectContacts: [{ contactId: '', role: '' }], assignedStaff: [{employeeId: '', role: ''}] },
  });
  
  const { fields: contactFields, append: appendContact, remove: removeContact } = useFieldArray({
    control: form.control,
    name: "projectContacts",
  });
  const { fields: staffFields, append: appendStaff, remove: removeStaff } = useFieldArray({
    control: form.control,
    name: "assignedStaff",
  });
  
  const watchedCustomerId = form.watch('customerId');
  const selectedCustomer = React.useMemo(() => customers.find(c => c.id === watchedCustomerId), [customers, watchedCustomerId]);

  React.useEffect(() => {
    async function fetchInitialData() {
        setLoading(true);
        try {
            const [customersData, employeesData] = await Promise.all([
                getCustomers(),
                getEmployees()
            ]);
            setCustomers(customersData);
            setEmployees(employeesData.map(e => ({ value: e.id, label: e.name })));
        } catch (error) {
            console.error("Failed to fetch initial data", error);
            toast({ variant: "destructive", title: "Error", description: "Could not load customers and employees." });
        } finally {
            setLoading(false);
        }
    }
    if (isFormOpen) {
        fetchInitialData();
    }
  }, [isFormOpen, toast]);
  
  React.useEffect(() => {
    async function fetchCustomerSubData() {
        if (watchedCustomerId) {
            setLoading(true);
            try {
                const [sitesData, contactsData] = await Promise.all([
                    getCustomerSites(watchedCustomerId),
                    getCustomerContacts(watchedCustomerId)
                ]);
                setSites(sitesData);
                setContacts(contactsData);
                form.resetField('siteId');
                form.resetField('projectContacts', { defaultValue: [{ contactId: '', role: '' }] });
            } catch (error) {
                console.error("Failed to fetch customer data", error);
                toast({ variant: "destructive", title: "Error", description: "Could not load sites and contacts for this customer." });
            } finally {
                setLoading(false);
            }
        } else {
            setSites([]);
            setContacts([]);
        }
    }
    fetchCustomerSubData();
  }, [watchedCustomerId, form, toast]);

  const customerOptions = React.useMemo(() => {
    return customers.map(c => ({
        value: c.id,
        label: c.name,
    }));
  }, [customers]);

  const siteOptions = React.useMemo(() => {
    return sites.map(site => ({ label: site.name, value: site.id }));
  }, [sites]);
  
  const contactOptions = React.useMemo(() => {
    return contacts.map(c => ({ label: c.name, value: c.id }));
  }, [contacts]);
  
  const employeeOptions = React.useMemo(() => {
    return employees;
  }, [employees]);

  async function onSubmit(values: ProjectFormValues) {
    setLoading(true);
    try {
        const newProjectId = await addProject(values);
        
        const customer = customers.find(c => c.id === values.customerId);
        
        const newProject: Project = { 
            id: newProjectId, 
            ...values,
            customerName: customer?.name || "Unknown",
            status: 'Planning',
            createdAt: { seconds: Date.now() / 1000, nanoseconds: 0 }
        };

        onProjectCreated(newProject);
        toast({ title: "Project Created", description: `"${values.name}" has been added.` });
        setIsFormOpen(false);
        form.reset();
    } catch (error) {
        console.error("Failed to create project", error);
        toast({ variant: "destructive", title: "Error", description: "Could not create the project." });
    } finally {
        setLoading(false);
    }
  }

  const handleAddContactRole = () => {
    if (newContactRole && !contactRoles.includes(newContactRole)) {
      setContactRoles([...contactRoles, newContactRole]);
      setNewContactRole('');
      toast({ title: "Role Added", description: `"${newContactRole}" has been added.` });
    }
  };

  const handleDeleteContactRole = (roleToDelete: string) => {
    setContactRoles(contactRoles.filter(role => role !== roleToDelete));
    toast({ title: "Role Removed", description: `"${roleToDelete}" has been removed.` });
  };
    
  const handleAddStaffRole = () => {
    if (newStaffRole && !staffRoles.includes(newStaffRole)) {
      setStaffRoles([...staffRoles, newStaffRole]);
      setNewStaffRole('');
      toast({ title: "Role Added", description: `"${newStaffRole}" has been added.` });
    }
  };

  const handleDeleteStaffRole = (roleToDelete: string) => {
    setStaffRoles(staffRoles.filter(role => role !== roleToDelete));
    toast({ title: "Role Removed", description: `"${roleToDelete}" has been removed.` });
  };

  
  const handleCustomerAdded = (newCustomer: Customer) => {
      setCustomers(prev => [...prev, newCustomer]);
      form.setValue('customerId', newCustomer.id, { shouldValidate: true });
  }

  const handleContactAdded = (newContact: Contact) => {
      setContacts(prev => [...prev, newContact]);
      // Set the newly created contact in the first empty contact field
      const emptyContactIndex = form.getValues('projectContacts').findIndex(pc => !pc.contactId);
      if (emptyContactIndex !== -1) {
          form.setValue(`projectContacts.${emptyContactIndex}.contactId`, newContact.id);
      } else {
          appendContact({ contactId: newContact.id, role: '' });
      }
  }

  return (
    <Dialog open={isFormOpen} onOpenChange={(open) => { setIsFormOpen(open); if (!open) { form.reset(); } }}>
        <DialogTrigger asChild>
            <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                New Project
            </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-xl max-h-[90svh] overflow-y-auto" onInteractOutside={(e) => { if(isContactRoleManagerOpen || isStaffRoleManagerOpen) e.preventDefault(); }}>
          <TooltipProvider>
            <DialogHeader>
                <DialogTitle>Create New Project</DialogTitle>
                <DialogDescription>Fill out the form below to create a new project.</DialogDescription>
            </DialogHeader>
            {loading && <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-10"><Loader2 className="h-8 w-8 animate-spin" /></div>}
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
                           <div className="flex gap-2">
                                <SearchableCombobox 
                                    options={customerOptions}
                                    value={field.value}
                                    onChange={field.onChange}
                                    placeholder="Select a customer"
                                />
                                <AddCustomerDialog onCustomerAdded={handleCustomerAdded}>
                                    <Button type="button" variant="outline" size="icon" className="shrink-0">
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </AddCustomerDialog>
                            </div>
                            <FormMessage />
                        </FormItem>
                    )}/>

                    <FormField control={form.control} name="siteId" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Site</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value} disabled={!watchedCustomerId}>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a site" />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                {siteOptions.map(option => (
                                    <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                    </SelectItem>
                                ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}/>
                    
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <FormLabel>Project Contacts</FormLabel>
                          <div className='flex items-center gap-1'>
                            <AddContactDialog 
                                customerId={watchedCustomerId} 
                                customerName={selectedCustomer?.name || ''} 
                                onContactAdded={handleContactAdded}
                            >
                                <Button type="button" variant="outline" size="sm" disabled={!watchedCustomerId}>
                                    <Plus className="mr-1 h-4 w-4" /> New
                                </Button>
                            </AddContactDialog>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Dialog open={isContactRoleManagerOpen} onOpenChange={setIsContactRoleManagerOpen}>
                                  <DialogTrigger asChild>
                                    <Button type="button" variant="ghost" size="icon" className="shrink-0 h-7 w-7"><Pencil className="h-4 w-4"/></Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Manage Contact Roles</DialogTitle>
                                      <DialogDescription>Add or remove contact roles from the list of suggestions.</DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                      <div className="flex gap-2">
                                        <Input value={newContactRole} onChange={(e) => setNewContactRole(e.target.value)} placeholder="New role name..." />
                                        <Button onClick={handleAddContactRole}>Add Role</Button>
                                      </div>
                                      <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                                        {contactRoles.map(role => (
                                          <div key={role} className="flex items-center justify-between p-2 rounded-md bg-secondary">
                                            <span className="text-sm">{role}</span>
                                            <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => handleDeleteContactRole(role)}>
                                              <Trash2 className="h-4 w-4" />
                                            </Button>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                    <DialogFooter>
                                      <Button variant="outline" onClick={() => setIsContactRoleManagerOpen(false)}>Done</Button>
                                    </DialogFooter>
                                  </DialogContent>
                                </Dialog>
                              </TooltipTrigger>
                              <TooltipContent><p>Manage Contact Roles</p></TooltipContent>
                            </Tooltip>
                          </div>
                        </div>
                        {contactFields.map((field, index) => (
                          <div key={field.id} className="flex items-start gap-2 p-3 border rounded-md bg-secondary/30">
                            <div className="grid grid-cols-2 gap-2 flex-1">
                              <FormField
                                control={form.control}
                                name={`projectContacts.${index}.contactId`}
                                render={({ field }) => (
                                  <FormItem>
                                     <SearchableCombobox 
                                        options={contactOptions}
                                        value={field.value}
                                        onChange={field.onChange}
                                        placeholder="Select contact"
                                        disabled={!watchedCustomerId}
                                    />
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name={`projectContacts.${index}.role`}
                                render={({ field }) => (
                                  <FormItem>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select a role" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        {contactRoles.map(role => <SelectItem key={role} value={role}>{role}</SelectItem>)}
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                            <Button type="button" variant="ghost" size="icon" onClick={() => removeContact(index)} disabled={contactFields.length <= 1}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => appendContact({ contactId: '', role: '' })}
                          disabled={!watchedCustomerId}
                        >
                          <PlusCircle className="mr-2 h-4 w-4"/> Add Another Contact
                        </Button>
                         <FormMessage>
                          {form.formState.errors.projectContacts && (form.formState.errors.projectContacts.message || (form.formState.errors.projectContacts as any)?.root?.message)}
                        </FormMessage>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <FormLabel>Assign Staff</FormLabel>
                             <Tooltip>
                                <TooltipTrigger asChild>
                                <Dialog open={isStaffRoleManagerOpen} onOpenChange={setIsStaffRoleManagerOpen}>
                                    <DialogTrigger asChild>
                                    <Button type="button" variant="ghost" size="icon" className="shrink-0 h-6 w-6"><Pencil className="h-4 w-4"/></Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Manage Staff Roles</DialogTitle>
                                        <DialogDescription>Add or remove staff roles from the list of suggestions.</DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                        <div className="flex gap-2">
                                        <Input value={newStaffRole} onChange={(e) => setNewStaffRole(e.target.value)} placeholder="New role name..." />
                                        <Button onClick={handleAddStaffRole}>Add Role</Button>
                                        </div>
                                        <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                                        {staffRoles.map(role => (
                                            <div key={role} className="flex items-center justify-between p-2 rounded-md bg-secondary">
                                            <span className="text-sm">{role}</span>
                                            <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => handleDeleteStaffRole(role)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                            </div>
                                        ))}
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => setIsStaffRoleManagerOpen(false)}>Done</Button>
                                    </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                                </TooltipTrigger>
                                <TooltipContent><p>Manage Staff Roles</p></TooltipContent>
                            </Tooltip>
                        </div>
                        {staffFields.map((field, index) => (
                           <div key={field.id} className="flex items-start gap-2 p-3 border rounded-md bg-secondary/30">
                            <div className="grid grid-cols-2 gap-2 flex-1">
                                <FormField
                                control={form.control}
                                name={`assignedStaff.${index}.employeeId`}
                                render={({ field }) => (
                                    <FormItem>
                                     <SearchableCombobox 
                                        options={employeeOptions}
                                        value={field.value}
                                        onChange={field.onChange}
                                        placeholder="Select staff"
                                    />
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
                                        <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a role" />
                                        </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                        {staffRoles.map(role => <SelectItem key={role} value={role}>{role}</SelectItem>)}
                                        </SelectContent>
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
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => appendStaff({ employeeId: '', role: '' })}
                        >
                          <PlusCircle className="mr-2 h-4 w-4"/> Add Staff Member
                        </Button>
                         <FormMessage>
                            {form.formState.errors.assignedStaff && (form.formState.errors.assignedStaff.message || (form.formState.errors.assignedStaff as any)?.root?.message)}
                        </FormMessage>
                    </div>

                    <DialogFooter>
                        <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
                        <Button type="submit" disabled={loading}>Create Project</Button>
                    </DialogFooter>
                </form>
            </Form>
          </TooltipProvider>
        </DialogContent>
    </Dialog>
  );
}
