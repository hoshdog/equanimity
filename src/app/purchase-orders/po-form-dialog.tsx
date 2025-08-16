// src/app/purchase-orders/po-form-dialog.tsx
'use client';

import * as React from 'react';
import { useForm, useFieldArray, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { PlusCircle, Trash2, Loader2, MinusCircle, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getProjects } from '@/lib/projects';
import { addPurchaseOrder } from '@/lib/purchase-orders';
import type { PurchaseOrder, Project, POLineItem, OptionType } from '@/lib/types';
import { SearchableCombobox } from '@/components/ui/SearchableCombobox';

const poLineItemSchema = z.object({
  id: z.string(),
  description: z.string().min(3, "Item description is required."),
  quantity: z.coerce.number().min(0.1, "Quantity must be greater than 0."),
  unitPrice: z.coerce.number().min(0.01, "Price must be greater than 0."),
});

const poSchema = z.object({
  projectId: z.string({ required_error: "Please select a project." }).min(1, "Please select a project."),
  supplierName: z.string().min(2, "Supplier name is required."),
  poNumber: z.string().min(1, "PO Number is required."),
  status: z.string().min(1, "Status is required."),
  lineItems: z.array(poLineItemSchema).min(1, "At least one line item is required."),
});

type POFormValues = z.infer<typeof poSchema>;

// Mock list of suppliers
const mockSuppliers = [
    { value: 'Bunnings Warehouse', label: 'Bunnings Warehouse' },
    { value: 'Rexel', label: 'Rexel' },
    { value: 'Lawrence & Hanson', label: 'Lawrence & Hanson' },
    { value: 'Beacon Lighting', label: 'Beacon Lighting' },
    { value: 'Harvey Norman Commercial', label: 'Harvey Norman Commercial' },
];

interface PurchaseOrderFormDialogProps {
  onPOCreated: (po: PurchaseOrder) => void;
  initialProjectId?: string;
  orgId: string;
}

export function PurchaseOrderFormDialog({ onPOCreated, initialProjectId, orgId }: PurchaseOrderFormDialogProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [projects, setProjects] = React.useState<OptionType[]>([]);
  const { toast } = useToast();

  const form = useForm<POFormValues>({
    resolver: zodResolver(poSchema),
    defaultValues: {
      projectId: initialProjectId || "",
      supplierName: "",
      poNumber: `PO-${Date.now().toString().slice(-6)}`,
      status: 'Draft',
      lineItems: [{ id: 'item-0', description: "", quantity: 1, unitPrice: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "lineItems",
  });

  const lineItemsWatch = form.watch('lineItems');
  const totalValue = React.useMemo(() => {
    return lineItemsWatch.reduce((total, item) => total + (item.quantity * item.unitPrice), 0);
  }, [lineItemsWatch]);

  React.useEffect(() => {
    async function fetchProjectsData() {
      if (isOpen && !initialProjectId) {
        setLoading(true);
        try {
          const projectsData = await getProjects(orgId);
          setProjects(projectsData.map(p => ({ value: p.id, label: `${p.name} (${p.customerName})` })));
        } catch (error) {
          toast({ variant: 'destructive', title: 'Error', description: 'Could not load projects.' });
        } finally {
          setLoading(false);
        }
      }
    }
    fetchProjectsData();
  }, [isOpen, initialProjectId, toast, orgId]);
  
  React.useEffect(() => {
    if (isOpen && initialProjectId) {
      form.setValue('projectId', initialProjectId);
    }
    if (!isOpen) {
        form.reset({
            projectId: initialProjectId || "",
            supplierName: "",
            poNumber: `PO-${Date.now().toString().slice(-6)}`,
            status: 'Draft',
            lineItems: [{ id: 'item-0', description: "", quantity: 1, unitPrice: 0 }],
        });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialProjectId]);

  async function onSubmit(values: POFormValues) {
    setLoading(true);
    try {
      const poData = {
        ...values,
        totalValue,
      };
      const newPOId = await addPurchaseOrder(orgId, values.projectId, poData);
      onPOCreated({ id: newPOId, ...poData, createdAt: new Date() } as any);
      toast({ title: "Purchase Order Created", description: `${values.poNumber} has been successfully created.` });
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to create purchase order:", error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not create the purchase order.' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          New Purchase Order
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Purchase Order</DialogTitle>
          <DialogDescription>Fill out the form below to create a new PO.</DialogDescription>
        </DialogHeader>
        {loading && <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-10"><Loader2 className="h-8 w-8 animate-spin" /></div>}
        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {!initialProjectId && (
                <FormField
                  control={form.control}
                  name="projectId"
                  render={({ field }) => (
                    <FormItem className="flex flex-col"><FormLabel>Project</FormLabel>
                      <SearchableCombobox
                          options={projects}
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Select a project"
                      />
                    <FormMessage /></FormItem> )}
                />
              )}
               <FormField
                  control={form.control}
                  name="supplierName"
                  render={({ field }) => (
                    <FormItem className="flex flex-col"><FormLabel>Supplier</FormLabel>
                       <SearchableCombobox
                          options={mockSuppliers}
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Select a supplier"
                      />
                    <FormMessage /></FormItem> )}
                />
              <FormField
                control={form.control}
                name="poNumber"
                render={({ field }) => (
                  <FormItem><FormLabel>PO Number</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="Draft">Draft</SelectItem>
                        <SelectItem value="Sent">Sent</SelectItem>
                        <SelectItem value="Partially Received">Partially Received</SelectItem>
                        <SelectItem value="Received">Received</SelectItem>
                        <SelectItem value="Cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-2">
                <FormLabel>Line Items</FormLabel>
                <div className="space-y-2">
                {fields.map((field, index) => (
                    <div key={field.id} className="flex items-start gap-2 p-2 border rounded-md">
                        <div className="grid grid-cols-12 gap-2 flex-grow">
                           <div className="col-span-12 sm:col-span-6">
                             <FormField
                                control={form.control}
                                name={`lineItems.${index}.description`}
                                render={({ field }) => (
                                    <FormItem><FormControl><Input placeholder="Item description" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                           </div>
                            <div className="col-span-6 sm:col-span-2">
                                <FormField
                                    control={form.control}
                                    name={`lineItems.${index}.quantity`}
                                    render={({ field }) => (
                                        <FormItem><FormControl><Input type="number" placeholder="Qty" {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                            </div>
                            <div className="col-span-6 sm:col-span-3">
                                <FormField
                                    control={form.control}
                                    name={`lineItems.${index}.unitPrice`}
                                    render={({ field }) => (
                                        <FormItem><FormControl>
                                            <div className="relative">
                                                <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                <Input type="number" placeholder="Unit Price" step="0.01" className="pl-6" {...field} />
                                            </div>
                                        </FormControl><FormMessage /></FormItem>
                                    )} />
                            </div>
                        </div>
                        <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={fields.length <= 1}>
                          <MinusCircle className="h-5 w-5 text-destructive"/>
                        </Button>
                    </div>
                ))}
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => append({ id: `item-${fields.length}`, description: "", quantity: 1, unitPrice: 0 })}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Line Item
                </Button>
            </div>
            <div className="text-right font-bold text-lg">
                Total: ${totalValue.toFixed(2)}
            </div>
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
              <Button type="submit" disabled={loading}>Create PO</Button>
            </DialogFooter>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
