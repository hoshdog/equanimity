
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface AddSiteDialogProps {
  customerId: string;
  customerDetails: CustomerDetails;
  setCustomerDetails: React.Dispatch<React.SetStateAction<CustomerDetails>>;
  onSiteAdded: (siteId: string) => void;
}

const siteSchema = z.object({
  name: z.string().min(2, "Site name must be at least 2 characters."),
  address: z.string().min(10, "Address must be at least 10 characters."),
  primaryContactId: z.string().min(1, "You must select a primary contact."),
});

export function AddSiteDialog({ customerId, customerDetails, setCustomerDetails, onSiteAdded }: AddSiteDialogProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof siteSchema>>({
    resolver: zodResolver(siteSchema),
    defaultValues: { name: "", address: "", primaryContactId: "" },
  });

  const contactsForCustomer = customerId ? customerDetails[customerId]?.contacts : [];

  function onSubmit(values: z.infer<typeof siteSchema>) {
    if (!customerId) {
        toast({ variant: "destructive", title: "Error", description: "A customer must be selected first."});
        return;
    }

    const newSiteId = `S${customerId}${Date.now()}`;
    const newSite = { id: newSiteId, ...values };

    setCustomerDetails(prev => {
        const customerToUpdate = prev[customerId];
        if (!customerToUpdate) return prev;

        return {
            ...prev,
            [customerId]: {
                ...customerToUpdate,
                sites: [...customerToUpdate.sites, newSite]
            }
        };
    });

    toast({ title: "Site Added", description: `"${values.name}" has been added.` });
    onSiteAdded(newSiteId);
    setIsOpen(false);
    form.reset();
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" disabled={!customerId}><Plus /></Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Site</DialogTitle>
          <DialogDescription>Add a new site for the selected customer.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => ( <FormItem><FormLabel>Site Name</FormLabel><FormControl><Input placeholder="e.g., Melbourne Office" {...field} /></FormControl><FormMessage /></FormItem> )}/>
            <FormField control={form.control} name="address" render={({ field }) => ( <FormItem><FormLabel>Site Address</FormLabel><FormControl><Input placeholder="e.g., 55 Collins St, Melbourne" {...field} /></FormControl><FormMessage /></FormItem> )}/>
            <FormField control={form.control} name="primaryContactId" render={({ field }) => (
                <FormItem><FormLabel>Primary Contact</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select a contact" /></SelectTrigger></FormControl>
                    <SelectContent>
                        {contactsForCustomer?.map(contact => <SelectItem key={contact.id} value={contact.id}>{contact.name}</SelectItem>)}
                    </SelectContent>
                </Select>
                <FormMessage /></FormItem> 
            )}/>
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
              <Button type="submit">Add Site</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
