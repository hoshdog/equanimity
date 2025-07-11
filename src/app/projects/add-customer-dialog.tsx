
'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import type { CustomerDetails } from '@/lib/types';
import { Plus } from 'lucide-react';

interface AddCustomerDialogProps {
  setCustomerDetails: React.Dispatch<React.SetStateAction<CustomerDetails>>;
  onCustomerAdded: (customerId: string) => void;
}

const customerSchema = z.object({
    name: z.string().min(2, "Customer name must be at least 2 characters."),
    address: z.string().min(10, "Address must be at least 10 characters."),
    primaryContactName: z.string().min(2, "Contact name must be at least 2 characters."),
    email: z.string().email("Please enter a valid email address."),
    phone: z.string().min(8, "Phone number seems too short."),
    type: z.string().default('Corporate Client'), // Default value
});

export function AddCustomerDialog({ setCustomerDetails, onCustomerAdded }: AddCustomerDialogProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof customerSchema>>({
    resolver: zodResolver(customerSchema),
    defaultValues: { name: "", address: "", primaryContactName: "", email: "", phone: "", type: "Corporate Client" },
  });

  function onSubmit(values: z.infer<typeof customerSchema>) {
    const newCustomerId = `${Date.now()}`;
    const newContactId = `C${newCustomerId}A`;

    const newCustomer = {
        id: newCustomerId,
        ...values,
        contacts: [{ id: newContactId, name: values.primaryContactName, emails: [values.email], phones: [values.phone] }],
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

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon"><Plus /></Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Customer</DialogTitle>
          <DialogDescription>Create a new customer record.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem><FormLabel>Customer Name</FormLabel><FormControl><Input placeholder="e.g., Innovate Corp" {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
            <FormField control={form.control} name="address" render={({ field }) => (
                <FormItem><FormLabel>Address</FormLabel><FormControl><Input placeholder="e.g., 123 Tech Park, Sydney" {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
            <FormField control={form.control} name="primaryContactName" render={({ field }) => (
                <FormItem><FormLabel>Primary Contact Name</FormLabel><FormControl><Input placeholder="e.g., John Doe" {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
            <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem><FormLabel>Contact Email</FormLabel><FormControl><Input placeholder="e.g., contact@innovate.com" {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
            <FormField control={form.control} name="phone" render={({ field }) => (
                <FormItem><FormLabel>Contact Phone</FormLabel><FormControl><Input placeholder="e.g., 02 9999 8888" {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
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
