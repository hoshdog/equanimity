// src/app/quotes/[id]/part-selector-dialog.tsx
'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
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
import { Loader2, DollarSign, PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { subscribeToStockItems } from '@/lib/inventory';
import type { StockItem, QuoteLineItem } from '@/lib/types';
import { DataTable } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';

interface PartSelectorDialogProps {
  children: React.ReactNode;
  onPartSelected: (part: Omit<QuoteLineItem, 'id' | 'type'>) => void;
}

const oneOffItemSchema = z.object({
  description: z.string().min(3, "Description is required."),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1."),
  unitPrice: z.coerce.number().min(0.01, "Price must be greater than 0."),
  unitCost: z.coerce.number().optional(),
});
type OneOffItemValues = z.infer<typeof oneOffItemSchema>;

export function PartSelectorDialog({ children, onPartSelected }: PartSelectorDialogProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [stockItems, setStockItems] = React.useState<StockItem[]>([]);
  const { toast } = useToast();

  const oneOffForm = useForm<OneOffItemValues>({
    resolver: zodResolver(oneOffItemSchema),
    defaultValues: {
      description: '',
      quantity: 1,
      unitPrice: 0,
      unitCost: 0,
    },
  });

  React.useEffect(() => {
    if (!isOpen) return;

    const unsubscribe = subscribeToStockItems(
      (items) => {
        setStockItems(items);
        setLoading(false);
      },
      (error) => {
        console.error("Failed to subscribe to stock items:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not load inventory.' });
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [isOpen, toast]);

  const handleSelectItem = (item: StockItem) => {
    // This part is a placeholder. A real implementation would fetch the actual cost and calculate the sell price based on pricing tiers.
    const sellPrice = (item.quantityOnHand > 0) ? 55.00 : 60.00; // Simplified logic for demo
    onPartSelected({
      description: `${item.name} (${item.sku})`,
      quantity: 1,
      unitPrice: sellPrice, // Placeholder, should be calculated based on markup
      unitCost: 45.00, // Placeholder, should be from inventory item
      taxRate: 10,
    });
    setIsOpen(false);
  };
  
  const handleAddOneOff = (values: OneOffItemValues) => {
    onPartSelected({ ...values, taxRate: 10 });
    setIsOpen(false);
    oneOffForm.reset();
  };

  const columns: ColumnDef<StockItem>[] = [
    {
      accessorKey: 'name',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Item Name" />,
    },
    {
      accessorKey: 'sku',
      header: ({ column }) => <DataTableColumnHeader column={column} title="SKU" />,
    },
    {
      accessorKey: 'quantityOnHand',
      header: 'Qty on Hand',
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <Button size="sm" onClick={() => handleSelectItem(row.original)}>Select</Button>
      ),
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Select a Part or Service</DialogTitle>
          <DialogDescription>
            Choose an item from your inventory or add a one-off item for this quote.
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="inventory">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="inventory">From Inventory</TabsTrigger>
            <TabsTrigger value="one-off">Add One-Off Item</TabsTrigger>
          </TabsList>
          <TabsContent value="inventory">
            <Card>
              <CardContent className="p-0">
                {loading ? (
                  <div className="flex justify-center items-center h-96">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <DataTable columns={columns} data={stockItems} />
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="one-off">
             <Card>
                <CardHeader>
                    <CardTitle>Add One-Off Item</CardTitle>
                    <CardDescription>
                        Use this for items not in your standard inventory.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...oneOffForm}>
                      <form onSubmit={oneOffForm.handleSubmit(handleAddOneOff)} className="space-y-4">
                        <FormField control={oneOffForm.control} name="description" render={({ field }) => ( <FormItem><FormLabel>Description</FormLabel><FormControl><Input placeholder="e.g., Special order RCD" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                        <div className="grid grid-cols-3 gap-4">
                            <FormField control={oneOffForm.control} name="quantity" render={({ field }) => ( <FormItem><FormLabel>Quantity</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                            <FormField control={oneOffForm.control} name="unitCost" render={({ field }) => ( <FormItem><FormLabel>Unit Cost</FormLabel><FormControl><div className="relative"><DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input type="number" className="pl-6" {...field} /></div></FormControl><FormMessage /></FormItem> )}/>
                            <FormField control={oneOffForm.control} name="unitPrice" render={({ field }) => ( <FormItem><FormLabel>Unit Price (Sell)</FormLabel><FormControl><div className="relative"><DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input type="number" className="pl-6" {...field} /></div></FormControl><FormMessage /></FormItem> )}/>
                        </div>
                        <DialogFooter className="pt-4">
                            <Button type="submit">Add Item to Quote</Button>
                        </DialogFooter>
                      </form>
                    </Form>
                </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
