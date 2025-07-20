// src/app/inventory/stock-item-form-dialog.tsx
'use client';

import * as React from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { StockItem } from '@/lib/types';
import { addStockItem, updateStockItem } from '@/lib/inventory';

const stockItemFormSchema = z.object({
  name: z.string().min(3, "Item name must be at least 3 characters."),
  sku: z.string().min(2, "SKU is required."),
  quantityOnHand: z.coerce.number().min(0, "Quantity cannot be negative."),
  reorderThreshold: z.coerce.number().min(0, "Reorder threshold cannot be negative."),
});

type StockItemFormValues = z.infer<typeof stockItemFormSchema>;

interface StockItemFormDialogProps {
  item?: StockItem | null;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export function StockItemFormDialog({ item, isOpen, setIsOpen }: StockItemFormDialogProps) {
  const [loading, setLoading] = React.useState(false);
  const { toast } = useToast();
  const isEditing = !!item;

  const form = useForm<StockItemFormValues>({
    resolver: zodResolver(stockItemFormSchema),
    defaultValues: { name: "", sku: "", quantityOnHand: 0, reorderThreshold: 0 },
  });

  React.useEffect(() => {
    if (isOpen) {
      if (isEditing && item) {
        form.reset(item);
      } else {
        form.reset({ name: "", sku: "", quantityOnHand: 0, reorderThreshold: 0 });
      }
    }
  }, [isOpen, isEditing, item, form]);

  async function onSubmit(values: StockItemFormValues) {
    setLoading(true);
    try {
      if (isEditing && item) {
        await updateStockItem(item.id, values);
        toast({ title: 'Item Updated', description: `"${values.name}" has been updated.` });
      } else {
        await addStockItem(values);
        toast({ title: 'Item Created', description: `"${values.name}" has been added to inventory.` });
      }
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to save stock item:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not save the stock item." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Stock Item' : 'Add New Stock Item'}</DialogTitle>
          <DialogDescription>
            {isEditing ? `Update the details for ${item.name}.` : 'Fill in the details for the new inventory item.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem><FormLabel>Item Name</FormLabel><FormControl><Input placeholder="e.g., Cat 6 Cable (305m box)" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="sku" render={({ field }) => (
              <FormItem><FormLabel>SKU / Part Number</FormLabel><FormControl><Input placeholder="e.g., C6-BL-305M" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="quantityOnHand" render={({ field }) => (
                <FormItem><FormLabel>Quantity On Hand</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="reorderThreshold" render={({ field }) => (
                <FormItem>
                  <FormLabel>Reorder Threshold</FormLabel>
                  <FormControl><Input type="number" {...field} /></FormControl>
                  <FormDescription className="text-xs">Set reorder threshold based on your supplier's lead time to avoid running out.</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? 'Save Changes' : 'Create Item'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
