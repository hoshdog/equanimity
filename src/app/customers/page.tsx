// src/app/customers/page.tsx
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
import { updateCustomer, deleteCustomer, addCustomer } from '@/lib/customers';
import type { Customer, Contact } from '@/lib/types';
import { onSnapshot, collection, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const customerFormSchema = z.object({
    id: z.string().optional(),
    displayName: z.string().min(2, { message: "Customer name must be at least 2 characters." }),
    addresses: z.array(z.object({ line1: z.string().min(10, { message: "Address must be at least 10 characters." }) })),
    emails: z.array(z.object({ address: z.string().email({ message: "Please enter a valid email address." }) })),
    phones: z.array(z.object({ number: z.string().min(8, { message: "Phone number seems too short." }) })),
});

type CustomerFormData = z.infer<typeof customerFormSchema>;

// TODO: Replace with dynamic org ID from user session
const ORG_ID = 'test-org';

export default function CustomersPage() {
    const [customers, setCustomers] = useState<Contact[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<Contact | null>(null);
    const { toast } = useToast();
    const router = useRouter();

    const form = useForm<CustomerFormData>({
        resolver: zodResolver(customerFormSchema),
        defaultValues: { displayName: "", addresses: [{line1: ''}], emails: [{address: ''}], phones: [{number: ''}] },
    });

    useEffect(() => {
      // Use mock data for development
      const loadCustomers = async () => {
        try {
          const { mockDataService } = await import('@/lib/mock-data');
          const customersData = await mockDataService.getCustomers();
          setCustomers(customersData as any);
          setLoading(false);
        } catch (error) {
          console.error("Failed to fetch customers:", error);
          toast({ variant: 'destructive', title: 'Error', description: 'Could not load customers.' });
          setLoading(false);
        }
      };
      
      loadCustomers();
    }, [toast]);
    
    useEffect(() => {
        if (isFormDialogOpen && editingCustomer) {
            form.reset({
              ...editingCustomer,
              addresses: editingCustomer.addresses?.length ? editingCustomer.addresses : [{line1: ''}],
              emails: editingCustomer.emails?.length ? editingCustomer.emails : [{address: ''}],
              phones: editingCustomer.phones?.length ? editingCustomer.phones : [{number: ''}],
            });
        } else {
            form.reset({ displayName: "", addresses: [{line1: ''}], emails: [{address: ''}], phones: [{number: ''}] });
        }
    }, [isFormDialogOpen, editingCustomer, form]);

    async function onSubmit(values: CustomerFormData) {
        setLoading(true);
        try {
            const customerData = {
                displayName: values.displayName,
                addresses: values.addresses.map(a => ({...a, type: 'PHYSICAL'})),
                emails: values.emails.map(e => ({...e, type: 'PRIMARY'})),
                phones: values.phones.map(p => ({...p, type: 'MOBILE'})),
                type: 'CUSTOMER' as const
            };

            if (editingCustomer) {
                await updateCustomer(ORG_ID, editingCustomer.id, customerData);
                toast({ title: "Customer Updated", description: `${values.displayName} has been updated.` });
            } else {
                await addCustomer(ORG_ID, customerData);
                toast({ title: "Customer Added", description: `${values.displayName} has been added.` });
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

    const handleEditClick = (customer: Contact) => {
        setEditingCustomer(customer);
        setIsFormDialogOpen(true);
    }
    
    const handleDeleteCustomerAction = async (customerId: string) => {
        if (!window.confirm("Are you sure you want to delete this customer? This action cannot be undone.")) return;
        setLoading(true);
        try {
            await deleteCustomer(ORG_ID, customerId);
            toast({ title: "Customer Deleted", variant: "destructive", description: "The customer has been deleted."})
        } catch (error) {
            console.error("Failed to delete customer", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete customer.' });
        } finally {
            setLoading(false);
        }
    }
    
    const columns: ColumnDef<Contact>[] = [
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
        accessorKey: "displayName",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Customer" />,
        cell: ({ row }) => {
          return (
            <Link href={`/customers/${row.original.id}`}>
                <div className="font-medium hover:underline">{row.original.displayName}</div>
                <div className="text-sm text-muted-foreground md:hidden">{row.original.emails[0]?.address}</div>
            </Link>
          )
        }
      },
      {
        accessorKey: "emails",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Primary Email" />,
        cell: ({ row }) => row.original.emails[0]?.address,
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
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>{editingCustomer ? 'Edit Customer' : 'Add New Customer'}</DialogTitle>
                            <DialogDescription>
                                {editingCustomer ? `Update the details for ${editingCustomer.displayName}.` : 'Fill in the details below to add a new customer.'}
                            </DialogDescription>
                        </DialogHeader>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <FormField control={form.control} name="displayName" render={({ field }) => (
                                    <FormItem><FormLabel>Customer Name</FormLabel><FormControl><Input placeholder="e.g., Innovate Corp" {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>
                                 <FormField control={form.control} name="addresses.0.line1" render={({ field }) => (
                                    <FormItem><FormLabel>Address</FormLabel><FormControl><Input placeholder="e.g., 123 Tech Park, Sydney" {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>
                                <FormField control={form.control} name="emails.0.address" render={({ field }) => (
                                    <FormItem><FormLabel>Email</FormLabel><FormControl><Input placeholder="e.g., contact@innovate.com" {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>
                                <FormField control={form.control} name="phones.0.number" render={({ field }) => (
                                    <FormItem><FormLabel>Phone</FormLabel><FormControl><Input placeholder="e.g., 02 9999 8888" {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>
                                <DialogFooter>
                                     <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
                                    <Button type="submit" disabled={loading}>{editingCustomer ? "Save Changes" : "Add Customer"}</Button>
                                </DialogFooter>
                            </form>
                        </Form>
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
