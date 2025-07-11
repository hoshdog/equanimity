'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  VisibilityState,
  useReactTable,
} from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle, Building2, Pencil, Trash2, MoreHorizontal, ArrowUpDown, Loader2 } from "lucide-react";
import Link from "next/link";
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Checkbox } from '@/components/ui/checkbox';
import { DataTable } from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { getCustomers, updateCustomer, deleteCustomer, addCustomer } from '@/lib/customers';
import type { Customer } from '@/lib/types';


const customerFormSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(2, { message: "Customer name must be at least 2 characters." }),
    address: z.string().min(10, { message: "Address must be at least 10 characters." }),
    primaryContactName: z.string().min(2, { message: "Primary contact name must be at least 2 characters." }),
    email: z.string().email({ message: "Please enter a valid email address." }),
    phone: z.string().min(8, { message: "Phone number seems too short." }),
    type: z.string().min(2, { message: "Please select a customer type." }),
});

type CustomerFormData = z.infer<typeof customerFormSchema>;

export default function CustomersPage() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [customerTypes, setCustomerTypes] = useState([
        'Corporate Client', 
        'Construction Partner', 
        'Small Business', 
        'Government',
        'Private'
    ]);
    const [isManageTypesDialogOpen, setIsManageTypesDialogOpen] = useState(false);
    const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
    const [newType, setNewType] = useState('');
    const { toast } = useToast();
    const router = useRouter();

    const form = useForm<CustomerFormData>({
        resolver: zodResolver(customerFormSchema),
        defaultValues: { name: "", address: "", primaryContactName: "", email: "", phone: "", type: "" },
    });

    useEffect(() => {
        async function fetchCustomers() {
            setLoading(true);
            try {
                const customersData = await getCustomers();
                setCustomers(customersData);
            } catch (error) {
                console.error("Failed to fetch customers:", error);
                toast({ variant: 'destructive', title: 'Error', description: 'Could not load customers.' });
            } finally {
                setLoading(false);
            }
        }
        fetchCustomers();
    }, [toast]);
    
    useEffect(() => {
        if (isFormDialogOpen && editingCustomer) {
            form.reset(editingCustomer);
        } else {
            form.reset({ name: "", address: "", primaryContactName: "", email: "", phone: "", type: "" });
        }
    }, [isFormDialogOpen, editingCustomer, form]);

    async function onSubmit(values: CustomerFormData) {
        setLoading(true);
        try {
            if (editingCustomer) { // Editing existing customer
                await updateCustomer(editingCustomer.id, values);
                setCustomers(customers.map(c => c.id === editingCustomer.id ? { ...c, ...values } : c));
                toast({ title: "Customer Updated", description: `${values.name} has been updated.` });
            } else { // Adding new customer
                const newCustomerData = {
                  name: values.name,
                  address: values.address,
                  type: values.type,
                  primaryContactName: values.primaryContactName,
                  email: values.email,
                  phone: values.phone,
                }
                // Firestore doesn't need an ID for adding
                const initialContact = { name: values.primaryContactName, emails: [values.email], phones: [values.phone] };
                const initialSite = { name: 'Main Site', address: values.address };
                
                // This is simplified, addCustomer returns the new ID. We should refetch for consistency.
                const { customerId } = await addCustomer(newCustomerData, initialContact, initialSite);
                setCustomers([...customers, { id: customerId, ...newCustomerData }]);
                toast({ title: "Customer Added", description: `${values.name} has been added.` });
            }
        } catch (error) {
            console.error("Failed to save customer", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to save customer.' });
        } finally {
            setIsFormDialogOpen(false);
            setEditingCustomer(null);
            setLoading(false);
        }
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

    const handleEditClick = (customer: Customer) => {
        setEditingCustomer(customer);
        setIsFormDialogOpen(true);
    }
    
    const handleDeleteCustomerAction = async (customerId: string) => {
        if (!window.confirm("Are you sure you want to delete this customer? This action cannot be undone.")) return;
        setLoading(true);
        try {
            await deleteCustomer(customerId);
            setCustomers(customers.filter(c => c.id !== customerId));
            toast({ title: "Customer Deleted", variant: "destructive", description: "The customer has been deleted."})
        } catch (error) {
            console.error("Failed to delete customer", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete customer.' });
        } finally {
            setLoading(false);
        }
    }
    
    const columns: ColumnDef<Customer>[] = [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: "name",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Customer" />,
        cell: ({ row }) => {
          return (
            <Link href={`/customers/${row.original.id}`}>
                <div className="font-medium hover:underline">{row.original.name}</div>
                <div className="text-sm text-muted-foreground md:hidden">{row.original.primaryContactName}</div>
            </Link>
          )
        }
      },
      {
        accessorKey: "primaryContactName",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Primary Contact" />,
      },
      {
        accessorKey: "type",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Type" />,
        cell: ({ row }) => <Badge variant="secondary">{row.original.type}</Badge>,
      },
      {
        id: "actions",
        cell: ({ row }) => {
          const customer = row.original
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => router.push(`/customers/${customer.id}`)}>
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleEditClick(customer)}>
                  Edit Customer
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteCustomerAction(customer.id!)}>
                  Delete Customer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )
        },
      },
    ]

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
       <div className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-2 md:space-y-0">
            <h2 className="text-3xl font-bold tracking-tight">Customers</h2>
            <div className="flex items-center space-x-2">
                <Dialog open={isFormDialogOpen} onOpenChange={(open) => { setIsFormDialogOpen(open); if(!open) setEditingCustomer(null); }}>
                    <DialogTrigger asChild>
                        <Button onClick={() => setEditingCustomer(null)}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Add New Customer
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]" onInteractOutside={(e) => { if(isManageTypesDialogOpen) e.preventDefault(); }}>
                        <DialogHeader>
                            <DialogTitle>{editingCustomer ? 'Edit Customer' : 'Add New Customer'}</DialogTitle>
                            <DialogDescription>
                                {editingCustomer ? `Update the details for ${editingCustomer.name}.` : 'Fill in the details below to add a new customer.'}
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
                                        <div className="flex items-center justify-between">
                                            <FormLabel>Customer Type</FormLabel>
                                            <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.preventDefault(); setIsManageTypesDialogOpen(true); }}>
                                                <Pencil className="h-4 w-4" />
                                            </Button>
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
                                <DialogFooter>
                                     <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
                                    <Button type="submit" disabled={loading}>{editingCustomer ? "Save Changes" : "Add Customer"}</Button>
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
      <Card>
        <CardContent className='p-0'>
            {loading ? (
                <div className="flex justify-center items-center h-96">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : (
                <DataTable columns={columns} data={customers} />
            )}
        </CardContent>
      </Card>
    </div>
  );
}
