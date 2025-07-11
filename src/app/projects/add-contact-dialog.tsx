
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
import { Plus, PlusCircle, MinusCircle } from 'lucide-react';

interface AddContactDialogProps {
  customerId: string;
  setCustomerDetails: React.Dispatch<React.SetStateAction<CustomerDetails>>;
  onContactAdded: (contactId: string) => void;
  children: React.ReactNode;
}

const contactSchema = z.object({
  name: z.string().min(2, "Contact name must be at least 2 characters."),
  emails: z.array(z.object({ value: z.string().email("Please enter a valid email address.") })).min(1, "At least one email is required."),
  phones: z.array(z.object({ value: z.string().min(8, "Phone number seems too short.") })).min(1, "At least one phone number is required."),
});

export function AddContactDialog({ customerId, setCustomerDetails, onContactAdded, children }: AddContactDialogProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof contactSchema>>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: "", emails: [{ value: "" }], phones: [{ value: "" }] },
  });

  const { fields: emailFields, append: appendEmail, remove: removeEmail } = useFieldArray({ control: form.control, name: "emails" });
  const { fields: phoneFields, append: appendPhone, remove: removePhone } = useFieldArray({ control: form.control, name: "phones" });


  function onSubmit(values: z.infer<typeof contactSchema>) {
    if (!customerId) {
        toast({ variant: "destructive", title: "Error", description: "A customer must be selected first."});
        return;
    }

    const newContactId = `C${customerId}${Date.now()}`;
    const newContact = { 
        id: newContactId,
        name: values.name,
        emails: values.emails.map(e => e.value),
        phones: values.phones.map(p => p.value),
    };

    setCustomerDetails(prev => {
      const customerToUpdate = prev[customerId];
      if (!customerToUpdate) return prev;
      
      return {
        ...prev,
        [customerId]: {
            ...customerToUpdate,
            contacts: [...customerToUpdate.contacts, newContact]
        }
      }
    });

    toast({ title: "Contact Added", description: `"${values.name}" has been added.` });
    onContactAdded(newContactId);
    setIsOpen(false);
    form.reset({ name: "", emails: [{ value: "" }], phones: [{ value: "" }] });
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if(!open) form.reset({ name: "", emails: [{ value: "" }], phones: [{ value: "" }]}); }}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Contact</DialogTitle>
          <DialogDescription>Create a new contact person for the selected customer.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => ( <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="e.g., Jane Doe" {...field} /></FormControl><FormMessage /></FormItem> )}/>
            
            <div>
                <FormLabel>Email Addresses</FormLabel>
                {emailFields.map((field, index) => (
                  <FormField key={field.id} control={form.control} name={`emails.${index}.value`} render={({ field }) => (
                    <FormItem className="flex items-center gap-2 mt-1">
                      <FormControl><Input placeholder="jane.doe@example.com" {...field} /></FormControl>
                      <Button type="button" variant="ghost" size="icon" disabled={emailFields.length <= 1} onClick={() => removeEmail(index)}>
                        <MinusCircle className="h-5 w-5 text-destructive"/>
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
              <Button type="submit">Add Contact</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
