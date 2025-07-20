
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
import { Loader2, DollarSign, PlusCircle, CheckCircle, Circle, Trash2, ShoppingCart, ChevronDown, ChevronRight, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { subscribeToStockItems } from '@/lib/inventory';
import type { StockItem, QuoteLineItem } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';


interface PartSelectorDialogProps {
  children: React.ReactNode;
  onPartSelected: (part: Omit<QuoteLineItem, 'id' | 'type'>) => void;
}

// Represents a supplier-specific offering for a part.
interface SupplierPartInfo {
  supplier: string;
  tradePrice: number;
  isDefault?: boolean; // The preferred supplier for this part
}

// Represents a part that can be sourced from multiple suppliers.
interface CataloguePart {
  partNumber: string;
  description: string;
  suppliers: SupplierPartInfo[];
}

// Mock data simulates a comprehensive parts catalogue.
const mockPartsCatalogue: CataloguePart[] = [
    { partNumber: 'PDL615', description: 'Standard Single GPO, White', suppliers: [
        { supplier: 'Lawrence & Hanson', tradePrice: 8.50, isDefault: true },
        { supplier: 'Rexel', tradePrice: 8.75 },
    ]},
    { partNumber: 'LED-DL-9W', description: '9W LED Downlight, Warm White, Dimmable', suppliers: [
        { supplier: 'Beacon Lighting', tradePrice: 22.00, isDefault: true },
        { supplier: 'Bunnings Warehouse', tradePrice: 21.50 },
    ]},
    { partNumber: 'C6-BL-305M', description: 'Cat 6 UTP Cable, Blue, 305m Box', suppliers: [
        { supplier: 'Rexel', tradePrice: 150.00, isDefault: true },
    ]},
    { partNumber: 'RCD-2P-40A', description: '2 Pole 40A 30mA RCD', suppliers: [
         { supplier: 'Rexel', tradePrice: 45.00 },
         { supplier: 'Lawrence & Hanson', tradePrice: 44.50, isDefault: true },
    ]},
    { partNumber: 'SMK-AL-9V', description: '9V Photoelectric Smoke Alarm', suppliers: [
        { supplier: 'Lawrence & Hanson', tradePrice: 18.00 },
        { supplier: 'Bunnings Warehouse', tradePrice: 17.00, isDefault: true },
    ]},
    { partNumber: 'HPM-XL777', description: 'Weatherproof Double GPO IP54', suppliers: [
        { supplier: 'Bunnings Warehouse', tradePrice: 38.50, isDefault: true },
    ]},
    { partNumber: 'PVC-C-25', description: '25mm PVC Corrugated Conduit, Grey, 25m roll', suppliers: [
        { supplier: 'Bunnings Warehouse', tradePrice: 35.00 },
        { supplier: 'Rexel', tradePrice: 38.00, isDefault: true },
    ]},
];

const oneOffItemSchema = z.object({
  description: z.string().min(3, "Description is required."),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1."),
  unitPrice: z.coerce.number().min(0.01, "Price must be greater than 0."),
  unitCost: z.coerce.number().optional(),
});
type OneOffItemValues = z.infer<typeof oneOffItemSchema>;

interface SelectedPart {
  part: CataloguePart;
  supplierInfo: SupplierPartInfo;
  quantity: number;
}

export function PartSelectorDialog({ children, onPartSelected }: PartSelectorDialogProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [stockItems, setStockItems] = React.useState<StockItem[]>([]);
  const [globalFilter, setGlobalFilter] = React.useState('');
  const [selectedParts, setSelectedParts] = React.useState<Map<string, SelectedPart>>(new Map());
  const [defaultSupplier, setDefaultSupplier] = React.useState('cheapest');


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
    if (!isOpen) {
        setGlobalFilter('');
        setSelectedParts(new Map());
        return;
    };

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

  const inventoryMap = React.useMemo(() => {
    return new Map(stockItems.map(item => [item.sku, item]));
  }, [stockItems]);

  const handleSelectPart = (part: CataloguePart, supplierInfo: SupplierPartInfo, quantity: number) => {
    if (quantity <= 0) return;
    const newSelectedParts = new Map(selectedParts);
    const uniqueKey = `${part.partNumber}-${supplierInfo.supplier}`;
    newSelectedParts.set(uniqueKey, { part, supplierInfo, quantity });
    setSelectedParts(newSelectedParts);
    toast({ title: "Part Added", description: `Added ${quantity} x ${part.description} from ${supplierInfo.supplier}.` });
  };
  
  const handleRemovePart = (key: string) => {
    const newSelectedParts = new Map(selectedParts);
    newSelectedParts.delete(key);
    setSelectedParts(newSelectedParts);
  }

  const handleAddSelectedParts = () => {
    if (selectedParts.size === 0) {
        toast({ variant: "destructive", title: "No parts selected", description: "Please select a part and quantity to add."});
        return;
    }
    
    selectedParts.forEach(({ part, supplierInfo, quantity }) => {
        const sellPrice = supplierInfo.tradePrice * 1.3; // Placeholder 30% markup
        onPartSelected({
          description: `${part.description}`,
          quantity,
          unitPrice: parseFloat(sellPrice.toFixed(2)),
          unitCost: supplierInfo.tradePrice,
          taxRate: 10,
        });
    });
    setIsOpen(false);
  };
  
  const handleAddOneOff = (values: OneOffItemValues) => {
    onPartSelected({ ...values, taxRate: 10 });
    setIsOpen(false);
    oneOffForm.reset();
  };
  
  const filteredCatalogue = React.useMemo(() => {
    if (!globalFilter) return mockPartsCatalogue;
    const filterText = globalFilter.toLowerCase();
    return mockPartsCatalogue.filter(part => 
        part.description.toLowerCase().includes(filterText) ||
        part.partNumber.toLowerCase().includes(filterText)
    );
  }, [globalFilter]);

  const selectedPartsArray = Array.from(selectedParts.entries());
  
  const allSuppliers = React.useMemo(() => {
    const supplierSet = new Set<string>();
    mockPartsCatalogue.forEach(part => {
        part.suppliers.forEach(s => supplierSet.add(s.supplier));
    });
    return Array.from(supplierSet);
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-6xl">
        <DialogHeader>
          <DialogTitle>Select Parts</DialogTitle>
          <DialogDescription>
            Choose items from the catalogue or add a one-off item. Specify quantities and add them to your quote.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
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
                      <>
                        <div className="p-4 flex gap-4">
                          <Input
                            placeholder="Search by description or part number..."
                            value={globalFilter}
                            onChange={(event) => setGlobalFilter(event.target.value)}
                            className="w-full"
                          />
                           <Select value={defaultSupplier} onValueChange={setDefaultSupplier}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Default Supplier" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="cheapest">Cheapest</SelectItem>
                                    {allSuppliers.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                         <div className="rounded-md border">
                            <Table>
                               <TableHeader>
                                  <TableRow>
                                    <TableHead className="w-12"></TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead className="text-center w-28">Qty in Stock</TableHead>
                                    <TableHead className="w-48 text-right">Quick Add</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredCatalogue.length > 0 ? filteredCatalogue.map((part) => (
                                        <PartRow 
                                            key={part.partNumber} 
                                            part={part} 
                                            inventoryMap={inventoryMap} 
                                            onSelect={handleSelectPart}
                                            defaultSupplierPreference={defaultSupplier}
                                        />
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={4} className="h-24 text-center">No parts found.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                         </div>
                      </>
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
                                <FormField control={oneOffForm.control} name="unitCost" render={({ field }) => ( <FormItem><FormLabel>Unit Cost</FormLabel><FormControl><div className="relative"><DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input type="number" step="0.01" className="pl-6" {...field} /></div></FormControl><FormMessage /></FormItem> )}/>
                                <FormField control={oneOffForm.control} name="unitPrice" render={({ field }) => ( <FormItem><FormLabel>Unit Price (Sell)</FormLabel><FormControl><div className="relative"><DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input type="number" step="0.01" className="pl-6" {...field} /></div></FormControl><FormMessage /></FormItem> )}/>
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
          </div>
          <div className="md:col-span-1">
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ShoppingCart className="h-5 w-5 text-primary" />
                        Selected Parts ({selectedPartsArray.length})
                    </CardTitle>
                    <CardDescription>
                        These items will be added to the quote.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 max-h-[450px] overflow-y-auto">
                    {selectedPartsArray.length > 0 ? (
                        selectedPartsArray.map(([key, {part, supplierInfo, quantity}]) => (
                           <div key={key} className="flex items-center justify-between text-sm p-2 rounded-md bg-secondary/50">
                                <div>
                                    <p className="font-medium">{part.description}</p>
                                    <p className="text-xs text-muted-foreground">{part.partNumber} &bull; {quantity} x {supplierInfo.supplier}</p>
                                </div>
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleRemovePart(key)}>
                                    <Trash2 className="h-4 w-4 text-destructive"/>
                                </Button>
                           </div>
                        ))
                    ) : (
                        <div className="text-center text-sm text-muted-foreground py-10">
                            No parts selected. Use the quick add or expand a row to select parts.
                        </div>
                    )}
                </CardContent>
             </Card>
          </div>
        </div>
        <DialogFooter className="pt-6 border-t">
          <DialogClose asChild>
            <Button type="button" variant="secondary">Cancel</Button>
          </DialogClose>
          <Button onClick={handleAddSelectedParts} disabled={selectedParts.size === 0}>
             <PlusCircle className="mr-2 h-4 w-4" />
             Add {selectedParts.size > 0 ? `${selectedParts.size} Item(s)` : 'Items'} to Quote
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


function PartRow({ part, inventoryMap, onSelect, defaultSupplierPreference }: { part: CataloguePart, inventoryMap: Map<string, StockItem>, onSelect: (part: CataloguePart, supplier: SupplierPartInfo, quantity: number) => void, defaultSupplierPreference: string }) {
    const [isOpen, setIsOpen] = React.useState(false);
    const [quickAddQty, setQuickAddQty] = React.useState(1);

    const inventoryItem = inventoryMap.get(part.partNumber);
    const stockQty = inventoryItem?.quantityOnHand || 0;
    
    // Sort suppliers by price, cheapest first
    const sortedSuppliers = [...part.suppliers].sort((a, b) => a.tradePrice - b.tradePrice);
    
    const handleQuickAdd = () => {
        let supplierToUse: SupplierPartInfo | undefined;

        if (defaultSupplierPreference === 'cheapest') {
            supplierToUse = sortedSuppliers[0];
        } else {
            supplierToUse = part.suppliers.find(s => s.supplier === defaultSupplierPreference);
            if (!supplierToUse) {
                // Fallback to cheapest if preferred supplier doesn't stock it
                supplierToUse = sortedSuppliers[0];
            }
        }
        
        if (supplierToUse) {
            onSelect(part, supplierToUse, quickAddQty);
            setQuickAddQty(1); // Reset
        }
    };


    return (
        <Collapsible asChild>
            <>
            <TableRow>
                <TableCell className="w-12">
                     <CollapsibleTrigger asChild>
                         <Button variant="ghost" size="icon" disabled={part.suppliers.length <= 1}>
                            {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                         </Button>
                     </CollapsibleTrigger>
                </TableCell>
                <TableCell>
                    <p className="font-medium">{part.description}</p>
                    <p className="text-xs text-muted-foreground">{part.partNumber}</p>
                </TableCell>
                <TableCell className="text-center">
                    <Badge variant={stockQty > 0 ? 'default' : 'secondary'} className={cn(stockQty > 0 && "bg-green-600/20 text-green-600 border-green-600/30")}>
                        {stockQty}
                    </Badge>
                </TableCell>
                <TableCell className="text-right">
                    <div className="flex justify-end items-center gap-2">
                        <Input type="number" value={quickAddQty} onChange={(e) => setQuickAddQty(parseInt(e.target.value) || 1)} className="w-20 h-8" />
                        <Button size="sm" onClick={handleQuickAdd}>Add</Button>
                    </div>
                </TableCell>
            </TableRow>
            <CollapsibleContent asChild>
               <TableRow>
                    <TableCell></TableCell>
                    <TableCell colSpan={3} className="p-0">
                       <div className="p-2 bg-secondary/50 space-y-1">
                          {sortedSuppliers.map((supplier, index) => (
                              <SupplierRow 
                                key={supplier.supplier} 
                                supplier={supplier} 
                                part={part} 
                                isCheapest={index === 0}
                                onSelect={onSelect}
                              />
                          ))}
                       </div>
                    </TableCell>
                </TableRow>
            </CollapsibleContent>
            </>
        </Collapsible>
    )
}

function SupplierRow({ part, supplier, isCheapest, onSelect }: { part: CataloguePart, supplier: SupplierPartInfo, isCheapest: boolean, onSelect: (part: CataloguePart, supplier: SupplierPartInfo, quantity: number) => void }) {
    const [quantity, setQuantity] = React.useState(1);
    
    const handleAddClick = () => {
        onSelect(part, supplier, quantity);
        setQuantity(1); // Reset for next time
    }
    
    return (
        <div className={cn("flex items-center justify-between gap-2 p-2 rounded-md", isCheapest ? "bg-primary/10" : "bg-background")}>
            <div className="flex items-center gap-2">
                 <div className="text-sm font-medium">{supplier.supplier}</div>
                 {isCheapest && <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30">Cheapest</Badge>}
                 {supplier.isDefault && <Badge><Star className="h-3 w-3 mr-1"/>Default</Badge>}
            </div>
            <div className="flex items-center gap-2">
                <div className="text-sm font-semibold">${supplier.tradePrice.toFixed(2)}</div>
                <Input type="number" value={quantity} onChange={e => setQuantity(parseInt(e.target.value) || 1)} className="w-20 h-8" />
                <Button size="sm" onClick={handleAddClick}>Add</Button>
            </div>
        </div>
    )
}
