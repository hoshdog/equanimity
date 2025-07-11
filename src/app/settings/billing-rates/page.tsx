// src/app/settings/billing-rates/page.tsx
'use client';

import * as React from 'react';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PlusCircle, Pencil, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PricingTierDialog } from './pricing-tier-dialog';
import type { TierFormValues } from './pricing-tier-dialog';
import { LabourRates } from './labour-rates';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";


export default function BillingRatesPage() {
    const { toast } = useToast();
    const [tiers, setTiers] = React.useState<TierFormValues[]>([
        { id: 'tier-1', name: 'Standard', priceBasedOn: 'trade', defaultMarkup: 30, isDefault: true, enableScaledPricing: false, scaledPricing: [{ from: 0, markup: 30 }] },
        { id: 'tier-2', name: 'Wholesale', priceBasedOn: 'cost', defaultMarkup: 15, isDefault: false, enableScaledPricing: false, scaledPricing: [{ from: 0, markup: 15 }] },
        { 
            id: 'tier-3', 
            name: 'Scaled Pricing Example', 
            priceBasedOn: 'trade', 
            defaultMarkup: 50, 
            isDefault: false, 
            enableScaledPricing: true,
            scaledPricing: [
                { from: 0, markup: 50 },
                { from: 100, markup: 40 },
                { from: 500, markup: 30 },
            ]
        },
    ]);

    const handleSave = (data: TierFormValues) => {
        setTiers(prev => {
            const existingIndex = prev.findIndex(t => t.id === data.id);
            if (data.isDefault) {
                // Ensure only one default
                prev.forEach(t => t.isDefault = false);
            }
            if (existingIndex > -1) {
                const updatedTiers = [...prev];
                updatedTiers[existingIndex] = data;
                return updatedTiers;
            }
            return [...prev, data];
        });
        toast({ title: 'Success', description: `Pricing Tier "${data.name}" has been saved.`});
    };
    
    const handleDelete = (tierId: string) => {
        if (window.confirm("Are you sure you want to delete this pricing tier?")) {
             setTiers(prev => prev.filter(t => t.id !== tierId));
             toast({ title: 'Tier Deleted', variant: 'destructive', description: `The pricing tier has been deleted.`});
        }
    }
    
    const getMarkupRange = (tier: TierFormValues): string => {
        if (!tier.enableScaledPricing || !tier.scaledPricing || tier.scaledPricing.length === 0) {
            return `${tier.defaultMarkup}%`;
        }
        const markups = tier.scaledPricing.map(p => p.markup);
        const min = Math.min(...markups);
        const max = Math.max(...markups);

        if (min === max) {
            return `${min}%`;
        }
        return `${min}% - ${max}%`;
    }


    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="flex flex-row items-start justify-between">
                    <div>
                        <CardTitle>Pricing Tiers (Markup)</CardTitle>
                        <CardDescription>
                            Manage different pricing levels for materials and services. These are used to calculate markup on costs.
                        </CardDescription>
                    </div>
                    <PricingTierDialog onSave={handleSave}>
                        <Button>
                            <PlusCircle className="mr-2 h-4 w-4" /> Create Pricing Tier
                        </Button>
                    </PricingTierDialog>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Tier Name</TableHead>
                                <TableHead>Price Based On</TableHead>
                                <TableHead>Markup Range</TableHead>
                                <TableHead>Default</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {tiers.map(tier => (
                                <TableRow key={tier.id}>
                                    <TableCell className="font-medium">{tier.name}</TableCell>
                                    <TableCell className="capitalize">{tier.priceBasedOn}</TableCell>
                                    <TableCell>{getMarkupRange(tier)}</TableCell>
                                    <TableCell>{tier.isDefault ? 'Yes' : 'No'}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <PricingTierDialog tier={tier} onSave={handleSave}>
                                                <Button variant="ghost" size="icon">
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                            </PricingTierDialog>
                                            <Button variant="ghost" size="icon" onClick={() => handleDelete(tier.id)}>
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
            
            <LabourRates />
        </div>
    );
}