
'use client';

import * as React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import type { CustomerDetails } from '@/lib/types';
import { Plus, Pencil, Trash2, PlusCircle, MinusCircle } from 'lucide-react';
import { AddressAutocompleteInput } from '@/components/ui/address-autocomplete-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface AddCustomerDialogProps {
  setCustomerDetails: React.Dispatch<React.SetStateAction<CustomerDetails>>;
  onCustomerAdded: (customerId: string) => void;
  children: React.ReactNode;
}

const customerSchema = z.object({
    name: z.string().min(2, "Customer name must be at least 2 characters."),
    address: z.string().min(10, "Address must be at least 10 characters."),
    type: z.string({ required_error: "Please select a customer type." }).min(1, "Please select a customer type."),
    primaryContactName: z.string().min(2, "Contact name must be at least 2 characters."),
    jobTitle: z.string().optional(),
    email: z.string().email("Please enter a valid email address."),
    phones: z.array(z.object({ value: z.string().min(8, "Phone number seems too short.") })).min(1, "At least one phone number is required."),
}).refine(data => data.type.toLowerCase() === 'residential' || (data.jobTitle && data.jobTitle.length > 0), {
    message: "Job Title is required for non-residential customers.",
    path: ["jobTitle"],
});

export function AddCustomerDialog({ setCustomerDetails, onCustomerAdded, children }: AddCustomerDialogProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isTypeManagerOpen, setIsTypeManagerOpen] = React.useState(false);
  const [newType, setNewType] = React.useState('');
  const [customerTypes, setCustomerTypes] = React.useState([
    'Corporate Client', 
    'Construction Partner', 
    'Small Business', 
    'Government',
    'Residential'
  ]);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof customerSchema>>({
    resolver: zodResolver(customerSchema),
    defaultValues: { name: "", address: "", type: "", primaryContactName: "", jobTitle: "", email: "", phones: [{ value: "" }] },
  });

  const { fields: phoneFields, append: appendPhone, remove: removePhone } = useFieldArray({ control: form.control, name: "phones" });
  
  const watchedCustomerType = form.watch('type');

  function onSubmit(values: z.infer<typeof customerSchema>) {
    const newCustomerId = `${Date.now()}`;
    const newContactId = `C${newCustomerId}A`;

    const newCustomer = {
        id: newCustomerId,
        name: values.name,
        address: values.address,
        type: values.type,
        primaryContactName: values.primaryContactName,
        email: values.email,
        phone: values.phones[0].value,
        contacts: [{ 
            id: newContactId, 
            name: values.primaryContactName, 
            emails: [values.email], 
            phones: values.phones.map(p => p.value),
            jobTitle: values.jobTitle,
        }],
        sites: [],
        projects: [],
    };

    setCustomerDetails(prev => ({
        ...prev,
        [newCustomerId]: newCustomer
    }));

    toast({ title: "Customer Added", description: `"${values.name}" has been added.` });
    onCustomerAdded(newCustomerId);
    setIsOpen(false);
    form.reset();
  }

  const handleAddType = () => {
    if (newType && !customerTypes.includes(newType)) {
        setCustomerTypes([...customerTypes, newType]);
        setNewType('');
        toast({ title: "Type Added", description: `"${newType}" has been added to the list.` });
    }
  };

  const handleDeleteType = (typeToDelete: string) => {
    setCustomerTypes(customerTypes.filter(type => type !== typeToDelete));
    toast({ title: "Type Removed", description: `"${typeToDelete}" has been removed.` });
  };


  return (
    <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) form.reset(); }}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => { if(isTypeManagerOpen) e.preventDefault(); }}>
        <DialogHeader>
          <DialogTitle>Add New Customer</DialogTitle>
          <DialogDescription>Create a new customer record.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem><FormLabel>Customer Name</FormLabel><FormControl>
                  <AddressAutocompleteInput 
                    placeholder="e.g., Innovate Corp" 
                    searchType='establishment'
                    onPlaceSelect={(place) => {
                      if (place) {
                        form.setValue('name', place.name || '', { shouldValidate: true });
                        form.setValue('address', place.formatted_address || '', { shouldValidate: true });
                      }
                    }}
                    {...field}
                  />
                </FormControl><FormMessage /></FormItem>
            )}/>
            <FormField control={form.control} name="address" render={({ field }) => (
                <FormItem><FormLabel>Address</FormLabel><FormControl>
                  <AddressAutocompleteInput 
                    placeholder="e.g., 123 Tech Park, Sydney" 
                    onPlaceSelect={(place) => {
                      if (place) {
                        form.setValue('address', place.formatted_address || '', { shouldValidate: true });
                      }
                    }}
                    {...field}
                  />
                </FormControl><FormMessage /></FormItem>
            )}/>
             <FormField control={form.control} name="type" render={({ field }) => (
                <FormItem>
                    <div className="flex items-center justify-between">
                        <FormLabel>Customer Type</FormLabel>
                        <Dialog open={isTypeManagerOpen} onOpenChange={setIsTypeManagerOpen}>
                            <DialogTrigger asChild>
                                <Button type="button" variant="ghost" size="icon" className="h-6 w-6"><Pencil className="h-4 w-4"/></Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Manage Customer Types</DialogTitle>
                                    <DialogDescription>Add or remove customer types from the list.</DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                    <div className="flex gap-2">
                                        <Input value={newType} onChange={(e) => setNewType(e.target.value)} placeholder="New type name..." />
                                        <Button onClick={handleAddType}>Add Type</Button>
                                    </div>
                                    <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                                        {customerTypes.map(type => (
                                            <div key={type} className="flex items-center justify-between p-2 rounded-md bg-secondary">
                                                <span className="text-sm">{type}</span>
                                                <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => handleDeleteType(type)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                    <DialogFooter>
                                    <Button variant="outline" onClick={() => setIsTypeManagerOpen(false)}>Done</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                    <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a customer type" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {customerTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <FormMessage />
                </FormItem>
            )}/>
             <hr/>
             <h4 className='text-sm font-medium'>Primary Contact</h4>
            <FormField control={form.control} name="primaryContactName" render={({ field }) => (
                <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="e.g., John Doe" {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
            {watchedCustomerType && watchedCustomerType.toLowerCase() !== 'residential' && (
               <FormField control={form.control} name="jobTitle" render={({ field }) => (
                <FormItem><FormLabel>Job Title</FormLabel><FormControl><Input placeholder="e.g., Office Manager" {...field} /></FormControl><FormMessage /></FormItem>
               )}/>
            )}
            <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem><FormLabel>Email</FormLabel><FormControl><Input placeholder="e.g., contact@innovate.com" {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
             <div>
                <FormLabel>Phone Numbers</FormLabel>
                {phoneFields.map((field, index) => (
                  <FormField key={field.id} control={form.control} name={`phones.${index}.value`} render={({ field: phoneField }) => (
                    <FormItem className="flex items-center gap-2 mt-1">
                      <FormControl><Input placeholder="0412 345 678" {...phoneField} /></FormControl>
                      <Button type="button" variant="ghost" size="icon" disabled={phoneFields.length <= 1} onClick={() => removePhone(index)}>
                        <MinusCircle className="h-5 w-5 text-destructive"/>
                      </Button>
                    </FormItem>
                  )}/>
                ))}
                <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => appendPhone({ value: "" })}>
                    <PlusCircle className="mr-2 h-4 w-4"/>Add Phone
                </Button>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
              <Button type="submit">Add Customer</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
