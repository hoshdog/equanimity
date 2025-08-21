// src/app/settings/bills/page.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function BillsSettingsPage() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Bills & Purchases Settings</CardTitle>
                <CardDescription>Configure default settings for bills and purchase orders.</CardDescription>
            </CardHeader>
            <CardContent>
                <p>Placeholder for Bills & Purchases settings.</p>
                <Button className="mt-4">Save</Button>
            </CardContent>
        </Card>
    );
}
