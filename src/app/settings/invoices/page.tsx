// src/app/settings/invoices/page.tsx
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from '@/hooks/use-toast';


export default function InvoicesSettingsPage() {
    const [taxDisplay, setTaxDisplay] = useState('exclude');
    const [financeChargeLabel, setFinanceChargeLabel] = useState('Bank Fee');
    const [lateFee, setLateFee] = useState('10');
    const [lateFeeCalculation, setLateFeeCalculation] = useState('monthly');
    const { toast } = useToast();

    const handleSaveChanges = () => {
        // In a real app, this would save the settings to a database.
        console.log("Saving invoice settings:", {
            taxDisplay,
            financeChargeLabel,
            lateFee,
            lateFeeCalculation,
        });
        toast({
            title: "Settings Saved",
            description: "Your invoice settings have been updated.",
        });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Invoicing</CardTitle>
                <CardDescription>Configure default settings for invoices and late payment fees.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
                <div className="space-y-2">
                    <Label>Show Sell & Cost Prices</Label>
                    <RadioGroup
                        value={taxDisplay}
                        onValueChange={setTaxDisplay}
                        className="flex items-center gap-4"
                    >
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="include" id="inc-tax" />
                            <Label htmlFor="inc-tax" className="font-normal">Inc Tax</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="exclude" id="ex-tax" />
                            <Label htmlFor="ex-tax" className="font-normal">Ex Tax</Label>
                        </div>
                    </RadioGroup>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="finance-charge-label" className="flex items-center">
                        Finance Charge Label
                        <span className="text-destructive ml-1">*</span>
                    </Label>
                    <Input
                        id="finance-charge-label"
                        value={financeChargeLabel}
                        onChange={(e) => setFinanceChargeLabel(e.target.value)}
                        className="max-w-xs"
                    />
                </div>

                <div className="space-y-2">
                    <Label>Late Payment Fee</Label>
                    <div className="flex items-center gap-2">
                         <div className="relative max-w-[100px]">
                            <Input
                                type="number"
                                value={lateFee}
                                onChange={(e) => setLateFee(e.target.value)}
                            />
                         </div>
                         <div className="flex h-10 items-center rounded-md border border-input bg-background px-3 text-sm">
                            % per year
                         </div>
                         <RadioGroup
                            value={lateFeeCalculation}
                            onValueChange={setLateFeeCalculation}
                            className="flex items-center gap-4 ml-4"
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="monthly" id="calc-monthly" />
                                <Label htmlFor="calc-monthly" className="font-normal">Calculated Monthly</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="daily" id="calc-daily" />
                                <Label htmlFor="calc-daily" className="font-normal">Calculated Daily</Label>
                            </div>
                        </RadioGroup>
                    </div>
                </div>
                
                <Button onClick={handleSaveChanges}>Save Changes</Button>
            </CardContent>
        </Card>
    );
}
