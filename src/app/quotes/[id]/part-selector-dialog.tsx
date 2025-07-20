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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CheckCircle, Circle } from 'lucide-react';

interface PartSelectorDialogProps {
  children: React.ReactNode;
  onPartSelected: (part: Omit<QuoteLineItem, 'id' | 'type'>) => void;
}

// Represents an item in a supplier's parts catalogue.
interface CataloguePart {
  partNumber: string;
  description: string;
  tradePrice: number;
  supplier: string;
}

// This mock data simulates a comprehensive parts catalogue imported from suppliers.
// In a real app, this would come from a dedicated 'parts' collection in Firestore.
const mockPartsCatalogue: CataloguePart[] = [
    { partNumber: 'C6-BL-305M', description: 'Cat 6 UTP Cable, Blue, 305m Box', tradePrice: 150.00, supplier: 'Rexel' },
    { partNumber: 'PDL615', description: 'Standard Single GPO, White', tradePrice: 8.50, supplier: 'Lawrence & Hanson' },
    { partNumber: 'LED-DL-9W', description: '9W LED Downlight, Warm White, Dimmable', tradePrice: 22.00, supplier: 'Beacon Lighting' },
    { partNumber: 'RCD-2P-40A', description: '2 Pole 40A 30mA RCD', tradePrice: 45.00, supplier: 'Rexel' },
    { partNumber: 'PVC-C-25', description: '25mm PVC Corrugated Conduit, Grey, 25m roll', tradePrice: 35.00, supplier: 'Bunnings Warehouse' },
    { partNumber: 'SMK-AL-9V', description: '9V Photoelectric Smoke Alarm', tradePrice: 18.00, supplier: 'Lawrence & Hanson' },
    { partNumber: 'HPM-XL777', description: 'Weatherproof Double GPO IP54', tradePrice: 38.50, supplier: 'Bunnings Warehouse' },
];


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

  // Fetch live inventory data when the dialog opens
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

  // Create a map for quick inventory lookups by SKU
  const inventoryMap = React.useMemo(() => {
    return new Map(stockItems.map(item => [item.sku, item]));
  }, [stockItems]);


  const handleSelectItem = (part: CataloguePart) => {
    // In a real app, sell price would be calculated based on the selected pricing tier (e.g., tradePrice * 1.25)
    const sellPrice = part.tradePrice * 1.3; // Placeholder 30% markup for demonstration

    onPartSelected({
      description: `${part.description} (${part.partNumber})`,
      quantity: 1,
      unitPrice: parseFloat(sellPrice.toFixed(2)),
      unitCost: part.tradePrice,
      taxRate: 10,
    });
    setIsOpen(false);
  };
  
  const handleAddOneOff = (values: OneOffItemValues) => {
    onPartSelected({ ...values, taxRate: 10 });
    setIsOpen(false);
    oneOffForm.reset();
  };

  const columns: ColumnDef<CataloguePart>[] = [
    {
      accessorKey: 'description',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Description" />,
      cell: ({ row }) => {
        const part = row.original;
        return (
            <div>
                <p className="font-medium">{part.description}</p>
                <p className="text-xs text-muted-foreground">{part.partNumber} &bull; {part.supplier}</p>
            </div>
        )
      }
    },
    {
      accessorKey: 'tradePrice',
      header: 'Trade Price',
       cell: ({ row }) => `$${row.original.tradePrice.toFixed(2)}`,
    },
    {
      id: 'inStock',
      header: 'In Stock',
      cell: ({ row }) => {
        const inventoryItem = inventoryMap.get(row.original.partNumber);
        if (inventoryItem && inventoryItem.quantityOnHand > 0) {
          return (
            <div className="flex items-center gap-1.5 text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span className="font-semibold">{inventoryItem.quantityOnHand}</span>
            </div>
          );
        }
        return (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Circle className="h-3 w-3" />
            <span>No</span>
          </div>
        );
      },
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
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Select a Part or Service</DialogTitle>
          <DialogDescription>
            Choose a part from the catalogue or add a one-off item. Inventory levels are shown for reference.
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="catalogue">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="catalogue">From Parts Catalogue</TabsTrigger>
            <TabsTrigger value="one-off">Add One-Off Item</TabsTrigger>
          </TabsList>
          <TabsContent value="catalogue">
            <Card>
              <CardContent className="p-0">
                {loading ? (
                  <div className="flex justify-center items-center h-96">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <DataTable columns={columns} data={mockPartsCatalogue} />
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="one-off">
             <Card>
                <CardHeader>
                    <CardTitle>Add One-Off Item</CardTitle>
                    <CardDescription>
                        Use this for items not in your standard parts catalogue.
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
