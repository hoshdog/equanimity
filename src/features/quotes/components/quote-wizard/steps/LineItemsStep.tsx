'use client';

import * as React from 'react';
import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Copy, 
  Package, 
  Clock,
  DollarSign,
  Percent,
  GripVertical,
  Calculator,
  Search,
  AlertCircle,
  Archive,
  FileText,
  Zap
} from 'lucide-react';
import type { QuoteLineItem } from '../../../types/quote.types';

interface LineItemsStepProps {
  data: { lineItems?: QuoteLineItem[] };
  onChange: (updates: { lineItems: QuoteLineItem[] }) => void;
}

export function LineItemsStep({ data, onChange }: LineItemsStepProps) {
  const [editingItem, setEditingItem] = useState<QuoteLineItem | null>(null);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [draggedItem, setDraggedItem] = useState<number | null>(null);
  const [editingCell, setEditingCell] = useState<{ id: string; field: 'quantity' | 'unitPrice' } | null>(null);

  const lineItems = data.lineItems || [];

  // Categories for filtering
  const categories = [
    { value: 'all', label: 'All Items' },
    { value: 'labor', label: 'Labor' },
    { value: 'materials', label: 'Materials' },
    { value: 'equipment', label: 'Equipment' },
    { value: 'subcontractor', label: 'Subcontractor' },
    { value: 'other', label: 'Other' },
  ];

  // Sample product catalog for quick add
  const productCatalog = [
    { id: 'cat-1', name: 'Standard Labor Hour', unitPrice: 85, category: 'labor', type: 'labor' },
    { id: 'cat-2', name: 'Overtime Labor Hour', unitPrice: 127.50, category: 'labor', type: 'labor' },
    { id: 'cat-3', name: 'Cable Cat6 (per meter)', unitPrice: 2.50, category: 'materials', type: 'product' },
    { id: 'cat-4', name: 'RJ45 Connector', unitPrice: 0.50, category: 'materials', type: 'product' },
    { id: 'cat-5', name: 'Network Switch 24-port', unitPrice: 450, category: 'equipment', type: 'product' },
  ];

  const handleAddItem = useCallback(() => {
    const newItem: QuoteLineItem = {
      id: `item-${Date.now()}`,
      type: 'product',
      name: '',
      description: '',
      quantity: 1,
      unitPrice: 0,
      total: 0,
      discountPercent: 0,
      category: 'materials',
      sortOrder: lineItems.length,
    };
    setEditingItem(newItem);
    setIsAddingItem(true);
  }, [lineItems.length]);

  const handleSaveItem = useCallback((item: QuoteLineItem) => {
    const updatedItems = isAddingItem
      ? [...lineItems, item]
      : lineItems.map(li => li.id === item.id ? item : li);
    
    onChange({ lineItems: updatedItems });
    setEditingItem(null);
    setIsAddingItem(false);
  }, [lineItems, isAddingItem, onChange]);

  const handleInlineEdit = useCallback((itemId: string, field: 'quantity' | 'unitPrice', value: string) => {
    const numValue = parseFloat(value) || 0;
    const updatedItems = lineItems.map(item => {
      if (item.id === itemId) {
        const updatedItem = { ...item, [field]: numValue };
        // Recalculate total
        const total = updatedItem.quantity * updatedItem.unitPrice;
        const discountAmount = updatedItem.discountPercent ? total * (updatedItem.discountPercent / 100) : 0;
        updatedItem.total = total - discountAmount;
        return updatedItem;
      }
      return item;
    });
    onChange({ lineItems: updatedItems });
  }, [lineItems, onChange]);

  const handleDeleteItem = useCallback((id: string) => {
    const updatedItems = lineItems.filter(item => item.id !== id);
    onChange({ lineItems: updatedItems });
  }, [lineItems, onChange]);

  const handleDuplicateItem = useCallback((item: QuoteLineItem) => {
    const newItem: QuoteLineItem = {
      ...item,
      id: `item-${Date.now()}`,
      name: `${item.name} (Copy)`,
      sortOrder: lineItems.length,
    };
    onChange({ lineItems: [...lineItems, newItem] });
  }, [lineItems, onChange]);

  const handleQuickAdd = useCallback((product: typeof productCatalog[0]) => {
    const newItem: QuoteLineItem = {
      id: `item-${Date.now()}`,
      type: product.type as 'product' | 'labor',
      name: product.name,
      description: '',
      quantity: 1,
      unitPrice: product.unitPrice,
      total: product.unitPrice,
      discountPercent: 0,
      category: product.category,
      sortOrder: lineItems.length,
    };
    onChange({ lineItems: [...lineItems, newItem] });
  }, [lineItems, onChange]);

  const handleDragStart = (index: number) => {
    setDraggedItem(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedItem === null || draggedItem === index) return;

    const draggedOverItem = lineItems[index];
    const draggedItemContent = lineItems[draggedItem];

    // Swap the items
    const newItems = [...lineItems];
    newItems[index] = draggedItemContent;
    newItems[draggedItem] = draggedOverItem;

    onChange({ lineItems: newItems });
    setDraggedItem(index);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  const calculateTotals = () => {
    const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0);
    const discounts = lineItems.reduce((sum, item) => {
      const discount = item.discountPercent ? item.total * (item.discountPercent / 100) : 0;
      return sum + discount;
    }, 0);
    return { subtotal, discounts, total: subtotal - discounts };
  };

  const totals = calculateTotals();

  const filteredItems = lineItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Line Items</h2>
        <p className="text-muted-foreground">
          Add products, services, and labor to your quote.
        </p>
      </div>

      {/* Quick Add from Catalog */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Quick Add from Catalog
          </CardTitle>
          <CardDescription>
            Select common items from your product catalog
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
            {productCatalog.map(product => (
              <Button
                key={product.id}
                variant="outline"
                size="sm"
                className="justify-start"
                onClick={() => handleQuickAdd(product)}
              >
                <Package className="h-4 w-4 mr-2" />
                <span className="truncate">{product.name}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Line Items Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Quote Line Items
              </CardTitle>
              <CardDescription>
                Manage all items in this quote
              </CardDescription>
            </div>
            <Button onClick={handleAddItem}>
              <Plus className="h-4 w-4 mr-2" />
              Add Custom Item
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Items Table */}
          {filteredItems.length > 0 ? (
            <ScrollArea className="h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[30px]"></TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-center w-[100px]">Qty</TableHead>
                    <TableHead className="text-right w-[120px]">Unit Price</TableHead>
                    <TableHead className="text-right w-[100px]">Discount</TableHead>
                    <TableHead className="text-right w-[120px]">Total</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((item, index) => (
                    <TableRow 
                      key={item.id}
                      draggable
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragEnd={handleDragEnd}
                      className="cursor-move"
                    >
                      <TableCell>
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {item.type === 'labor' ? (
                            <Clock className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Package className="h-4 w-4 text-muted-foreground" />
                          )}
                          <div>
                            <p className="font-medium">{item.name}</p>
                            <Badge variant="outline" className="text-xs">
                              {item.category}
                            </Badge>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                          {item.description || '-'}
                        </p>
                      </TableCell>
                      <TableCell className="text-center p-1">
                        {editingCell?.id === item.id && editingCell?.field === 'quantity' ? (
                          <Input
                            type="number"
                            min="0.01"
                            step="0.01"
                            defaultValue={item.quantity}
                            className="w-20 text-center"
                            autoFocus
                            onBlur={(e) => {
                              handleInlineEdit(item.id, 'quantity', e.target.value);
                              setEditingCell(null);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleInlineEdit(item.id, 'quantity', e.currentTarget.value);
                                setEditingCell(null);
                              }
                              if (e.key === 'Escape') {
                                setEditingCell(null);
                              }
                            }}
                          />
                        ) : (
                          <button
                            className="px-2 py-1 hover:bg-muted rounded cursor-pointer w-full text-center"
                            onClick={() => setEditingCell({ id: item.id, field: 'quantity' })}
                          >
                            {item.quantity}
                          </button>
                        )}
                      </TableCell>
                      <TableCell className="text-right p-1">
                        {editingCell?.id === item.id && editingCell?.field === 'unitPrice' ? (
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            defaultValue={item.unitPrice}
                            className="w-24 text-right"
                            autoFocus
                            onBlur={(e) => {
                              handleInlineEdit(item.id, 'unitPrice', e.target.value);
                              setEditingCell(null);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleInlineEdit(item.id, 'unitPrice', e.currentTarget.value);
                                setEditingCell(null);
                              }
                              if (e.key === 'Escape') {
                                setEditingCell(null);
                              }
                            }}
                          />
                        ) : (
                          <button
                            className="px-2 py-1 hover:bg-muted rounded cursor-pointer w-full text-right"
                            onClick={() => setEditingCell({ id: item.id, field: 'unitPrice' })}
                          >
                            ${item.unitPrice.toFixed(2)}
                          </button>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.discountPercent ? `${item.discountPercent}%` : '-'}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ${item.total.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingItem(item)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDuplicateItem(item)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteItem(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          ) : (
            <div className="text-center py-12">
              <Archive className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No line items added yet</p>
              <p className="text-sm text-muted-foreground">
                Add items from the catalog or create custom items
              </p>
            </div>
          )}

          {/* Totals */}
          {lineItems.length > 0 && (
            <>
              <Separator className="my-4" />
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>${totals.subtotal.toFixed(2)}</span>
                </div>
                {totals.discounts > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Discounts</span>
                    <span className="text-red-600">-${totals.discounts.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold">
                  <span>Total (ex. tax)</span>
                  <span>${totals.total.toFixed(2)}</span>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Tips */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Pro Tips:</strong>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Drag and drop items to reorder them</li>
            <li>Use the quick add buttons for common items</li>
            <li>Add discounts to individual items or the entire quote</li>
            <li>Group similar items together for better organization</li>
          </ul>
        </AlertDescription>
      </Alert>

      {/* Edit Item Dialog */}
      <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {isAddingItem ? 'Add New Item' : 'Edit Item'}
            </DialogTitle>
            <DialogDescription>
              Configure the details for this line item
            </DialogDescription>
          </DialogHeader>
          {editingItem && (
            <LineItemForm
              item={editingItem}
              onSave={handleSaveItem}
              onCancel={() => setEditingItem(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Line Item Form Component
function LineItemForm({
  item,
  onSave,
  onCancel,
}: {
  item: QuoteLineItem;
  onSave: (item: QuoteLineItem) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState<QuoteLineItem>(item);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const total = formData.quantity * formData.unitPrice;
    const discountAmount = formData.discountPercent ? total * (formData.discountPercent / 100) : 0;
    onSave({
      ...formData,
      total: total - discountAmount,
    });
  };

  const updateField = (field: keyof QuoteLineItem, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="item-type">Type</Label>
          <Select 
            value={formData.type} 
            onValueChange={(value) => updateField('type', value)}
          >
            <SelectTrigger id="item-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="product">Product</SelectItem>
              <SelectItem value="labor">Labor</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="item-category">Category</Label>
          <Select 
            value={formData.category || ''} 
            onValueChange={(value) => updateField('category', value)}
          >
            <SelectTrigger id="item-category">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="labor">Labor</SelectItem>
              <SelectItem value="materials">Materials</SelectItem>
              <SelectItem value="equipment">Equipment</SelectItem>
              <SelectItem value="subcontractor">Subcontractor</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="item-name">Name *</Label>
        <Input
          id="item-name"
          value={formData.name}
          onChange={(e) => updateField('name', e.target.value)}
          placeholder="Enter item name..."
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="item-description">Description</Label>
        <Textarea
          id="item-description"
          value={formData.description || ''}
          onChange={(e) => updateField('description', e.target.value)}
          placeholder="Enter item description..."
          rows={3}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="item-quantity">Quantity *</Label>
          <Input
            id="item-quantity"
            type="number"
            min="0.01"
            step="0.01"
            value={formData.quantity}
            onChange={(e) => updateField('quantity', parseFloat(e.target.value) || 0)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="item-price">Unit Price *</Label>
          <Input
            id="item-price"
            type="number"
            min="0"
            step="0.01"
            value={formData.unitPrice}
            onChange={(e) => updateField('unitPrice', parseFloat(e.target.value) || 0)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="item-discount">Discount (%)</Label>
          <Input
            id="item-discount"
            type="number"
            min="0"
            max="100"
            step="0.01"
            value={formData.discountPercent || ''}
            onChange={(e) => updateField('discountPercent', parseFloat(e.target.value) || 0)}
          />
        </div>
      </div>

      <div className="flex items-center justify-between pt-4">
        <div className="text-lg font-medium">
          Total: ${((formData.quantity * formData.unitPrice) * (1 - (formData.discountPercent || 0) / 100)).toFixed(2)}
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">
            Save Item
          </Button>
        </div>
      </div>
    </form>
  );
}