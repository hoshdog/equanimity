
'use client';

import * as React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus } from 'lucide-react';
import { AddCustomerDialog } from './add-customer-dialog';
import type { CustomerDetails } from '@/lib/types';


interface CustomerSelectionDialogProps {
    customerDetails: CustomerDetails;
    setCustomerDetails: React.Dispatch<React.SetStateAction<CustomerDetails>>;
    onCustomerSelected: (customerId: string) => void;
    onCustomerAdded: (customerId: string) => void;
    children: React.ReactNode;
}

export function CustomerSelectionDialog({
    customerDetails,
    setCustomerDetails,
    onCustomerSelected,
    onCustomerAdded,
    children
}: CustomerSelectionDialogProps) {
    const [isOpen, setIsOpen] = React.useState(false);
    const [searchTerm, setSearchTerm] = React.useState('');

    const customerOptions = React.useMemo(() => Object.values(customerDetails).map(c => ({
        label: c.name, value: c.id
    })), [customerDetails]);

    const filteredCustomers = searchTerm
        ? customerOptions.filter(customer =>
            customer.label.toLowerCase().includes(searchTerm.toLowerCase())
          )
        : customerOptions;

    const handleSelect = (customerId: string) => {
        onCustomerSelected(customerId);
        setIsOpen(false);
        setSearchTerm('');
    };

    const handleCustomerAddedAndSelect = (customerId: string) => {
        onCustomerAdded(customerId);
        handleSelect(customerId);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Select a Customer</DialogTitle>
                    <DialogDescription>Search for an existing customer or add a new one.</DialogDescription>
                </DialogHeader>
                <div className="flex items-center gap-2">
                     <Input
                        placeholder="Search customers..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <AddCustomerDialog
                        setCustomerDetails={setCustomerDetails}
                        onCustomerAdded={handleCustomerAddedAndSelect}
                    >
                        <Button type="button" variant="outline" size="icon">
                            <Plus className="h-4 w-4"/>
                        </Button>
                    </AddCustomerDialog>
                </div>
                <ScrollArea className="h-64">
                   <div className="space-y-2 p-1">
                     {filteredCustomers.length > 0 ? (
                        filteredCustomers.map(customer => (
                            <Button
                                key={customer.value}
                                variant="ghost"
                                className="w-full justify-start"
                                onClick={() => handleSelect(customer.value)}
                            >
                                {customer.label}
                            </Button>
                        ))
                     ) : (
                        <p className="p-4 text-center text-sm text-muted-foreground">No customers found.</p>
                     )}
                   </div>
                </ScrollArea>
                 <DialogFooter>
                    <Button variant="secondary" onClick={() => setIsOpen(false)}>Cancel</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

