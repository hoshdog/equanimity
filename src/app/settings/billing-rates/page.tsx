// src/app/settings/billing-rates/page.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

export default function BillingRatesPage() {
    const rates = [
        { id: 1, name: 'Standard Labor', rate: 95.00, type: 'Labor' },
        { id: 2, name: 'Emergency Call-out', rate: 250.00, type: 'Fee' },
        { id: 3, name: '1.5mm Cable', rate: 2.50, type: 'Material' },
        { id: 4, name: 'Standard GPO', rate: 15.00, type: 'Material' },
    ];
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Billing Rates</CardTitle>
                    <CardDescription>Manage your default labor and material rates.</CardDescription>
                </div>
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" /> New Rate
                </Button>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Item Name</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead className="text-right">Rate</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rates.map(rate => (
                            <TableRow key={rate.id}>
                                <TableCell className="font-medium">{rate.name}</TableCell>
                                <TableCell><Badge variant="outline">{rate.type}</Badge></TableCell>
                                <TableCell className="text-right">${rate.rate.toFixed(2)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
