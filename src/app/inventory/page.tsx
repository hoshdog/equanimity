// src/app/inventory/page.tsx
'use client';

import * as React from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table"
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, MoreHorizontal, Pencil, Trash2, AlertTriangle, Loader2 } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DataTable } from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { subscribeToStockItems, deleteStockItem } from '@/lib/inventory';
import type { CatalogueItem as StockItem } from '@/lib/types';
import { StockItemFormDialog } from './stock-item-form-dialog';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

// TODO: Replace with dynamic org ID from user session
const ORG_ID = 'test-org';


export default function InventoryPage() {
    const [stockItems, setStockItems] = React.useState<StockItem[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [editingItem, setEditingItem] = React.useState<StockItem | null>(null);
    const [isFormOpen, setIsFormOpen] = React.useState(false);
    const { toast } = useToast();

    React.useEffect(() => {
        const unsubscribe = subscribeToStockItems(
            ORG_ID,
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
    }, [toast]);

    const handleEditClick = (item: StockItem) => {
        setEditingItem(item);
        setIsFormOpen(true);
    };

    const handleNewClick = () => {
        setEditingItem(null);
        setIsFormOpen(true);
    }
    
    const handleDeleteAction = async (itemId: string, itemName: string) => {
        if (!window.confirm(`Are you sure you want to delete "${itemName}"? This action cannot be undone.`)) return;
        setLoading(true);
        try {
            await deleteStockItem(ORG_ID, itemId);
            toast({ title: "Item Deleted", variant: "destructive", description: `"${itemName}" has been deleted from inventory.`})
        } catch (error) {
            console.error("Failed to delete stock item", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete stock item.' });
        } finally {
            setLoading(false);
        }
    }
    
    const columns: ColumnDef<StockItem>[] = [
      {
        accessorKey: "name",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Item Name" />,
        cell: ({ row }) => {
            const item = row.original;
            const isLowStock = (item.quantityOnHand || 0) <= (item.reorderThreshold || 0);
            return (
                <div className="flex items-center gap-2">
                   {isLowStock && <AlertTriangle className="h-4 w-4 text-yellow-500" />}
                   <span className="font-medium">{item.name}</span>
                </div>
            )
        }
      },
      {
        accessorKey: "sku",
        header: ({ column }) => <DataTableColumnHeader column={column} title="SKU" />,
      },
      {
        accessorKey: "quantityOnHand",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Qty on Hand" />,
        cell: ({ row }) => {
          const item = row.original;
          const isLowStock = (item.quantityOnHand || 0) <= (item.reorderThreshold || 0);
          return <span className={cn(isLowStock && "text-yellow-500 font-bold")}>{item.quantityOnHand || 0}</span>;
        },
      },
      {
        accessorKey: "reorderThreshold",
        header: "Reorder At",
        cell: ({ row }) => row.original.reorderThreshold || 0,
      },
       {
        id: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const item = row.original;
          const qty = item.quantityOnHand || 0;
          const reorder = item.reorderThreshold || 0;

          if (qty <= 0) {
            return <Badge variant="destructive">Out of Stock</Badge>;
          }
          if (qty <= reorder) {
            return <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30">Low Stock</Badge>;
          }
          return <Badge variant="outline">In Stock</Badge>;
        },
      },
      {
        id: "actions",
        cell: ({ row }) => {
          const item = row.original
          return (
            <div className="text-right">
                <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => handleEditClick(item)}>
                        <Pencil className="mr-2 h-4 w-4" /> Edit Item
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteAction(item.id!, item.name)}>
                        <Trash2 className="mr-2 h-4 w-4" /> Delete Item
                    </DropdownMenuItem>
                </DropdownMenuContent>
                </DropdownMenu>
            </div>
          )
        },
      },
    ]

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
       <div className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-2 md:space-y-0">
            <h2 className="text-3xl font-bold tracking-tight">Inventory</h2>
            <Button onClick={handleNewClick}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Stock Item
            </Button>
      </div>
      <Card>
        <CardHeader>
            <CardTitle>Stock Items</CardTitle>
            <CardDescription>A list of all items in your inventory.</CardDescription>
        </CardHeader>
        <CardContent className='p-0'>
            {loading ? (
                <div className="flex justify-center items-center h-96">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : (
                <DataTable columns={columns} data={stockItems} />
            )}
        </CardContent>
      </Card>
      <StockItemFormDialog 
        orgId={ORG_ID}
        isOpen={isFormOpen} 
        setIsOpen={setIsFormOpen} 
        item={editingItem}
      />
    </div>
  );
}
