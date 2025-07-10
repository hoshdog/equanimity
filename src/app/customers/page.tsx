
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle, Building2, Phone, Mail, User, LayoutGrid, List, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const initialCustomers = [
    { id: '1', name: 'Innovate Corp', address: '123 Tech Park, Sydney NSW 2000', primaryContact: 'John Doe', email: 'john.doe@innovate.com', phone: '02 9999 8888', type: 'Corporate Client' },
    { id: '2', name: 'Builders Pty Ltd', address: '456 Construction Ave, Melbourne VIC 3000', primaryContact: 'Jane Smith', email: 'jane.smith@builders.com', phone: '03 8888 7777', type: 'Construction Partner' },
    { id: '3', name: 'Greenleaf Cafe', address: '789 Garden St, Brisbane QLD 4000', primaryContact: 'Peter Chen', email: 'peter.chen@greenleaf.com', phone: '07 7777 6666', type: 'Small Business' },
    { id: '4', name: 'State Gov Dept', address: '101 Parliament Pl, Canberra ACT 2600', primaryContact: 'Susan Reid', email: 's.reid@gov.au', phone: '02 6666 5555', type: 'Government' },
];

const customerSchema = z.object({
    name: z.string().min(2, { message: "Customer name must be at least 2 characters." }),
    address: z.string().min(10, { message: "Address must be at least 10 characters." }),
    primaryContact: z.string().min(2, { message: "Primary contact name must be at least 2 characters." }),
    email: z.string().email({ message: "Please enter a valid email address." }),
    phone: z.string().min(8, { message: "Phone number seems too short." }),
    type: z.string().min(2, { message: "Please select a customer type." }),
});

export default function CustomersPage() {
    const [view, setView] = useState('grid');
    const [customers, setCustomers] = useState(initialCustomers);
    const [customerTypes, setCustomerTypes] = useState([
        'Corporate Client', 
        'Construction Partner', 
        'Small Business', 
        'Government',
        'Private'
    ]);
    const [isAddCustomerDialogOpen, setIsAddCustomerDialogOpen] = useState(false);
    const [isManageTypesDialogOpen, setIsManageTypesDialogOpen] = useState(false);
    const [newType, setNewType] = useState('');
    const { toast } = useToast();
    const router = useRouter();

    const form = useForm<z.infer<typeof customerSchema>>({
        resolver: zodResolver(customerSchema),
        defaultValues: {
            name: "",
            address: "",
            primaryContact: "",
            email: "",
            phone: "",
            type: "",
        },
    });

    function onSubmit(values: z.infer<typeof customerSchema>) {
        const newCustomer = { ...values, id: `C${customers.length + 1}` };
        setCustomers([...customers, newCustomer]);
        toast({
            title: "Customer Added",
            description: `${values.name} has been successfully added.`,
        });
        console.log("New Customer Added:", newCustomer);
        setIsAddCustomerDialogOpen(false); 
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

    const handleRowClick = (id: string) => {
        router.push(`/customers/${id}`);
    };
  
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
       <div className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-2 md:space-y-0">
            <h2 className="text-3xl font-bold tracking-tight">Customers</h2>
            <div className="flex items-center space-x-2">
                 <div className="hidden md:flex items-center">
                    <Button variant={view === 'grid' ? 'default' : 'ghost'} size="icon" onClick={() => setView('grid')}>
                        <LayoutGrid className="h-5 w-5" />
                    </Button>
                     <Button variant={view === 'list' ? 'default' : 'ghost'} size="icon" onClick={() => setView('list')}>
                        <List className="h-5 w-5" />
                    </Button>
                </div>
                <Dialog open={isAddCustomerDialogOpen} onOpenChange={setIsAddCustomerDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={() => setIsAddCustomerDialogOpen(true)}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Add New Customer
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Add New Customer</DialogTitle>
                            <DialogDescription>
                                Fill in the details below to add a new customer to the system.
                            </DialogDescription>
                        </DialogHeader>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <FormField control={form.control} name="name" render={({ field }) => (
                                    <FormItem><FormLabel>Customer Name</FormLabel><FormControl><Input placeholder="e.g., Innovate Corp" {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>
                                 <FormField control={form.control} name="address" render={({ field }) => (
                                    <FormItem><FormLabel>Address</FormLabel><FormControl><Input placeholder="e.g., 123 Tech Park, Sydney" {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>
                                <FormField control={form.control} name="primaryContact" render={({ field }) => (
                                    <FormItem><FormLabel>Primary Contact Name</FormLabel><FormControl><Input placeholder="e.g., John Doe" {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>
                                <FormField control={form.control} name="email" render={({ field }) => (
                                    <FormItem><FormLabel>Email</FormLabel><FormControl><Input placeholder="e.g., contact@innovate.com" {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>
                                <FormField control={form.control} name="phone" render={({ field }) => (
                                    <FormItem><FormLabel>Phone</FormLabel><FormControl><Input placeholder="e.g., 02 9999 8888" {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>
                                <FormField
                                    control={form.control}
                                    name="type"
                                    render={({ field }) => (
                                        <FormItem>
                                            <div className="flex items-center justify-between">
                                                <FormLabel>Customer Type</FormLabel>
                                                <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsManageTypesDialogOpen(true)}>
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                            </div>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a customer type" />
                                                </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {customerTypes.map(type => (
                                                        <SelectItem key={type} value={type}>{type}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <DialogFooter>
                                     <DialogClose asChild>
                                        <Button type="button" variant="secondary">Cancel</Button>
                                     </DialogClose>
                                    <Button type="submit">Add Customer</Button>
                                </DialogFooter>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
                <Dialog open={isManageTypesDialogOpen} onOpenChange={setIsManageTypesDialogOpen}>
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
                            <Button variant="outline" onClick={() => setIsManageTypesDialogOpen(false)}>Done</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
      </div>
      {view === 'grid' || (view === 'list' && customers.length === 0) ? (
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
            {customers.map(customer => (
                <Link href={`/customers/${customer.id}`} key={customer.id}>
                    <Card className="hover:border-primary transition-colors h-full">
                        <CardHeader>
                            <div className="flex items-start justify-between">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <Building2 className="h-5 w-5 text-primary"/>
                                        {customer.name}
                                    </CardTitle>
                                    <CardDescription>{customer.address}</CardDescription>
                                </div>
                                <Badge variant="secondary">{customer.type}</Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="text-sm text-muted-foreground space-y-2">
                                <div className="flex items-center gap-2">
                                    <User className="h-4 w-4" />
                                    <span>Primary Contact: {customer.primaryContact}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Mail className="h-4 w-4" />
                                    <span className="hover:underline break-all">{customer.email}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Phone className="h-4 w-4" />
                                    <span>{customer.phone}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </Link>
            ))}
        </div>
      ) : (
        <Card className="block md:hidden">
             {customers.map(customer => (
                <Link href={`/customers/${customer.id}`} key={customer.id}>
                    <div className="border-b p-4">
                         <div className="flex items-start justify-between">
                            <div>
                                <div className="font-semibold flex items-center gap-2">
                                    <Building2 className="h-5 w-5 text-primary"/>
                                    {customer.name}
                                </div>
                                <div className="text-sm text-muted-foreground">{customer.primaryContact}</div>
                            </div>
                            <Badge variant="secondary">{customer.type}</Badge>
                        </div>
                    </div>
                </Link>
             ))}
        </Card>
      )}
      <Card className="hidden md:block">
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Primary Contact</TableHead>
                    <TableHead className="hidden lg:table-cell">Email</TableHead>
                    <TableHead className="hidden lg:table-cell">Phone</TableHead>
                    <TableHead>Type</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {customers.map(customer => (
                    <TableRow key={customer.id} onClick={() => handleRowClick(customer.id)} className="cursor-pointer">
                        <TableCell className="font-medium">{customer.name}</TableCell>
                        <TableCell>{customer.primaryContact}</TableCell>
                        <TableCell className="hidden lg:table-cell">{customer.email}</TableCell>
                        <TableCell className="hidden lg:table-cell">{customer.phone}</TableCell>
                        <TableCell><Badge variant="secondary">{customer.type}</Badge></TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
      </Card>
    </div>
  );
}
