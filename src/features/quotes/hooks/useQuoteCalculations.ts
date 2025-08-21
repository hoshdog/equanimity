import { useMemo } from 'react';
import type { QuoteLineItem, QuoteCalculations } from '../types/quote.types';

export function useQuoteCalculations(
  lineItems: QuoteLineItem[],
  discounts: any[] = [],
  taxSettings = { defaultRate: 0.10 }
): QuoteCalculations {
  return useMemo(() => {
    // Calculate subtotal
    const subtotal = lineItems.reduce((sum, item) => {
      const itemSubtotal = item.quantity * item.unitPrice;
      const discountAmount = item.discountPercent 
        ? itemSubtotal * (item.discountPercent / 100)
        : 0;
      return sum + (itemSubtotal - discountAmount);
    }, 0);

    // Calculate total discounts
    const totalDiscounts = discounts.reduce((sum, discount) => {
      if (discount.type === 'percentage') {
        return sum + (subtotal * (discount.value / 100));
      } else {
        return sum + discount.value;
      }
    }, 0);

    // Calculate tax
    const taxableAmount = subtotal - totalDiscounts;
    const totalTax = taxableAmount * taxSettings.defaultRate;

    // Calculate total
    const totalAmount = taxableAmount + totalTax;

    // Calculate costs and profit (if cost data available)
    const totalCost = lineItems.reduce((sum, item) => {
      return sum + ((item.unitCost || 0) * item.quantity);
    }, 0);
    
    const totalProfit = totalCost > 0 ? totalAmount - totalCost : 0;
    const profitMargin = totalAmount > 0 ? (totalProfit / totalAmount) * 100 : 0;

    // Calculate category breakdown
    const breakdown = lineItems.reduce((acc, item) => {
      const category = item.category || 'Uncategorized';
      const existing = acc.find(b => b.category === category);
      const itemTotal = item.quantity * item.unitPrice;
      
      if (existing) {
        existing.amount += itemTotal;
      } else {
        acc.push({
          category,
          amount: itemTotal,
          percentage: 0,
        });
      }
      return acc;
    }, [] as { category: string; amount: number; percentage: number }[]);

    // Calculate percentages for breakdown
    breakdown.forEach(item => {
      item.percentage = subtotal > 0 ? (item.amount / subtotal) * 100 : 0;
    });

    // Separate labor and materials
    const laborTotal = lineItems
      .filter(item => item.type === 'labor')
      .reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    
    const materialsTotal = lineItems
      .filter(item => item.type === 'product')
      .reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

    return {
      subtotal,
      totalDiscounts,
      totalTax,
      totalAmount,
      totalCost,
      totalProfit,
      profitMargin,
      laborTotal,
      materialsTotal,
      breakdown,
    };
  }, [lineItems, discounts, taxSettings]);
}