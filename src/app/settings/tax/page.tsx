// src/app/settings/tax/page.tsx
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { PlusCircle, Trash2, ArrowUpDown, Info } from "lucide-react";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

interface TaxRate {
    id: string;
    name: string;
    rate: number;
}

export default function TaxSettingsPage() {
    const [taxRates, setTaxRates] = useState<TaxRate[]>([
        { id: 'gst', name: 'GST', rate: 10.00 },
        { id: 'no-gst', name: 'No GST', rate: 0.00 },
    ]);

    const RequiredLabel = ({ children }: { children: React.ReactNode }) => (
        <Label className="flex items-center">
            {children}
            <span className="text-destructive ml-1">*</span>
        </Label>
    );

    return (
        <Card>
            <CardHeader>
                <CardTitle>Tax</CardTitle>
                <CardDescription>Configure your Default Tax Rates and set up new Tax Rates that can be used.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <RequiredLabel>Default Tax Rate</RequiredLabel>
                         <Select defaultValue="gst">
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {taxRates.map(rate => <SelectItem key={rate.id} value={rate.id}>{rate.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="space-y-2">
                        <RequiredLabel>Default No Tax Rate</RequiredLabel>
                        <Select defaultValue="no-gst">
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {taxRates.map(rate => <SelectItem key={rate.id} value={rate.id}>{rate.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="space-y-2">
                        <RequiredLabel>Sale Tax Default</RequiredLabel>
                        <Select defaultValue="exclusive">
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="exclusive">Exclusive</SelectItem>
                                <SelectItem value="inclusive">Inclusive</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="space-y-2">
                        <RequiredLabel>Purchase Tax Default</RequiredLabel>
                        <Select defaultValue="exclusive">
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="exclusive">Exclusive</SelectItem>
                                <SelectItem value="inclusive">Inclusive</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                 <div className="space-y-2">
                     <Label className="flex items-center gap-1.5">
                        Tax Calculation Method
                        <span className="text-destructive">*</span>
                        <TooltipProvider>
                           <Tooltip>
                             <TooltipTrigger asChild>
                               <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                             </TooltipTrigger>
                             <TooltipContent>
                               <p>Choose how tax is calculated on your invoices and quotes.</p>
                             </TooltipContent>
                           </Tooltip>
                        </TooltipProvider>
                    </Label>
                    <div className="p-2 text-sm text-muted-foreground">
                        Calculate tax on each line item
                    </div>
                </div>

                <Separator />

                <div>
                    <Button variant="outline">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        New Tax Rate
                    </Button>
                </div>

                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Display Name</TableHead>
                            <TableHead className="text-right flex items-center justify-end gap-1">
                                Rate
                                <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {taxRates.map(rate => (
                            <TableRow key={rate.id}>
                                <TableCell className="font-medium text-primary">{rate.name}</TableCell>
                                <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <span>{rate.rate.toFixed(4)}%</span>
                                        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>

            </CardContent>
        </Card>
    );
}